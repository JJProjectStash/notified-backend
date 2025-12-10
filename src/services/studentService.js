/**
 * Student Service
 * Business logic for student management
 * Based on JavaFX StudentService
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const { Student, Record, Enrollment, Attendance } = require('../models');
const ValidationUtil = require('../utils/validationUtil');
const logger = require('../utils/logger');
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  RECORD_TYPES,
  DEFAULT_YEAR_PREFIX,
} = require('../config/constants');

class StudentService {
  /**
   * Get all students with pagination
   */
  async getAllStudents(page = 1, limit = 10, filters = {}) {
    const query = {};
    if (filters.section) query.section = filters.section;
    if (filters.status) query.status = filters.status;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    const students = await Student.find(query)
      .sort({ studentNumber: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Student.countDocuments(query);

    return { students, total, page, limit };
  }

  /**
   * Get student by ID
   */
  async getStudentById(studentId) {
    const student = await Student.findById(studentId);

    if (!student) {
      throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
    }

    return student;
  }

  /**
   * Get student by student number
   */
  async getStudentByNumber(studentNumber) {
    const student = await Student.findByStudentNumber(studentNumber);

    if (!student) {
      throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
    }

    return student;
  }

  /**
   * Create new student
   */
  async createStudent(studentData, userId) {
    const { studentNumber, firstName, lastName, email, section, guardianName, guardianEmail } =
      studentData;

    // Validate student number
    if (!ValidationUtil.isValidStudentNumber(studentNumber)) {
      throw new Error('Invalid student number format. Must be YY-NNNN (e.g., 25-0001)');
    }

    // Check if student number already exists
    const existing = await Student.findByStudentNumber(studentNumber);
    if (existing) {
      throw new Error(ERROR_MESSAGES.STUDENT_EXISTS);
    }

    // Validate email
    if (!ValidationUtil.isValidEmail(email)) {
      throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
    }

    // Create student
    const student = await Student.create({
      studentNumber,
      firstName: ValidationUtil.sanitizeInput(firstName),
      lastName: ValidationUtil.sanitizeInput(lastName),
      email: email.toLowerCase(),
      section: section || '',
      guardianName: ValidationUtil.sanitizeInput(guardianName),
      guardianEmail: guardianEmail ? guardianEmail.toLowerCase() : '',
      createdBy: userId,
    });

    // Create record
    await Record.createStudentRecord(
      student._id,
      RECORD_TYPES.STUDENT_ADDED,
      `Student added: ${firstName} ${lastName} (${studentNumber})`,
      userId
    );

    logger.info(`Student created: ${studentNumber} by user ${userId}`);

    return student;
  }

  /**
   * Update student
   */
  async updateStudent(studentId, updateData, userId) {
    const student = await Student.findById(studentId);

    if (!student) {
      throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
    }

    const { firstName, lastName, email, section, guardianName, guardianEmail } = updateData;

    if (firstName) student.firstName = ValidationUtil.sanitizeInput(firstName);
    if (lastName) student.lastName = ValidationUtil.sanitizeInput(lastName);
    if (email) {
      if (!ValidationUtil.isValidEmail(email)) {
        throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
      }
      student.email = email.toLowerCase();
    }
    if (section !== undefined) student.section = section;
    if (guardianName) student.guardianName = ValidationUtil.sanitizeInput(guardianName);
    if (guardianEmail) student.guardianEmail = guardianEmail.toLowerCase();

    await student.save();

    // Create record
    await Record.createStudentRecord(
      student._id,
      RECORD_TYPES.STUDENT_UPDATED,
      `Student updated: ${student.firstName} ${student.lastName} (${student.studentNumber})`,
      userId
    );

    logger.info(`Student updated: ${student.studentNumber}`);

    return student;
  }

  /**
   * Delete student (hard delete with cascade)
   * Also removes all related enrollment and attendance records
   */
  async deleteStudent(studentId, userId) {
    const student = await Student.findById(studentId);

    if (!student) {
      throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
    }

    // Cascade delete: Remove all enrollment records for this student
    const enrollmentResult = await Enrollment.deleteMany({ student: studentId });
    logger.info(`Deleted ${enrollmentResult.deletedCount} enrollments for student ${studentId}`);

    // Cascade delete: Remove all attendance records for this student
    const attendanceResult = await Attendance.deleteMany({ student: studentId });
    logger.info(`Deleted ${attendanceResult.deletedCount} attendance records for student ${studentId}`);

    // Create record before deletion
    await Record.createStudentRecord(
      student._id,
      RECORD_TYPES.STUDENT_DELETED,
      `Student deleted: ${student.firstName} ${student.lastName} (${student.studentNumber}). Cascade deleted ${enrollmentResult.deletedCount} enrollments and ${attendanceResult.deletedCount} attendance records.`,
      userId
    );

    // Hard delete - permanently remove from database
    await Student.findByIdAndDelete(studentId);

    logger.info(`Student deleted: ${student.studentNumber}`);

    return {
      message: SUCCESS_MESSAGES.STUDENT_DELETED,
      deletedEnrollments: enrollmentResult.deletedCount,
      deletedAttendance: attendanceResult.deletedCount,
    };
  }

  /**
   * Generate next student number
   */
  async generateNextStudentNumber(yearPrefix = DEFAULT_YEAR_PREFIX) {
    return await Student.generateNextStudentNumber(yearPrefix);
  }

  /**
   * Search students
   */
  async searchStudents(query, page = 1, limit = 10) {
    const searchRegex = new RegExp(query, 'i');

    const students = await Student.find({
      $or: [
        { studentNumber: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { section: searchRegex },
      ],
    })
      .sort({ studentNumber: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Student.countDocuments({
      $or: [
        { studentNumber: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ],
    });

    return { students, total, page, limit };
  }

  /**
   * Get attendance summary for a student
   * @param {String} studentId - Student ID
   * @returns {Promise<Object>} Attendance summary with per-subject breakdown
   */
  async getStudentAttendanceSummary(studentId) {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
    }

    // Get overall attendance stats
    const overallStats = await Attendance.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate overall summary
    const summary = {
      totalDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendanceRate: 0,
      bySubject: [],
    };

    overallStats.forEach((stat) => {
      summary[stat._id] = stat.count;
      summary.totalDays += stat.count;
    });

    // Calculate attendance rate
    if (summary.totalDays > 0) {
      summary.attendanceRate = Math.round(
        ((summary.present + summary.late) / summary.totalDays) * 100
      );
    }

    // Get per-subject breakdown
    const subjectStats = await Attendance.aggregate([
      { $match: { student: student._id, subject: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: { subject: '$subject', status: '$status' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.subject',
          stats: {
            $push: { status: '$_id.status', count: '$count' },
          },
          total: { $sum: '$count' },
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject',
        },
      },
      { $unwind: '$subject' },
    ]);

    summary.bySubject = subjectStats.map((s) => {
      const stats = { present: 0, absent: 0, late: 0, excused: 0 };
      s.stats.forEach((st) => {
        stats[st.status] = st.count;
      });
      const rate = s.total > 0 ? Math.round(((stats.present + stats.late) / s.total) * 100) : 0;

      return {
        subjectId: s._id.toString(),
        subjectCode: s.subject.subjectCode,
        subjectName: s.subject.subjectName,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        excused: stats.excused,
        attendanceRate: rate,
      };
    });

    return summary;
  }
}

module.exports = new StudentService();
