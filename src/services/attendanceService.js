const { Attendance, Student, Subject, Record, Notification } = require('../models');
const { RECORD_TYPES, ATTENDANCE_STATUS, ERROR_MESSAGES, NOTIFICATION_TYPES } = require('../config/constants');
const { ValidationUtil } = require('../utils/validationUtil');
const { EmailUtil } = require('../utils/emailUtil');
const logger = require('../utils/logger');

/**
 * Attendance Service
 * Handles business logic for attendance management
 */
class AttendanceService {
  /**
   * Mark attendance for a student
   * @param {Object} attendanceData - Attendance data
   * @param {String} userId - User ID marking attendance
   * @returns {Promise<Object>} Created attendance record
   */
  async markAttendance(attendanceData, userId) {
    try {
      const { studentId, subjectId, date, status, remarks } = attendanceData;

      // Validate student exists
      const student = await Student.findById(studentId);
      if (!student) {
        const error = new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Validate subject exists
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Check if attendance already marked for this date
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      const existingAttendance = await Attendance.findOne({
        student: studentId,
        subject: subjectId,
        date: {
          $gte: attendanceDate,
          $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      if (existingAttendance) {
        const error = new Error(ERROR_MESSAGES.ATTENDANCE_EXISTS);
        error.statusCode = 409;
        throw error;
      }

      // Create attendance record
      const attendance = await Attendance.create({
        student: studentId,
        subject: subjectId,
        date: attendanceDate,
        status,
        remarks,
        markedBy: userId,
      });

      // Create activity record
      await Record.create({
        student: studentId,
        subject: subjectId,
        recordType: RECORD_TYPES.ATTENDANCE_MARKED,
        recordData: `Attendance marked as ${status} for ${subject.subjectName}`,
        performedBy: userId,
      });

      // Send notification if absent or late
      if (status === ATTENDANCE_STATUS.ABSENT || status === ATTENDANCE_STATUS.LATE) {
        await Notification.createNotification({
          recipient: student.createdBy,
          student: studentId,
          type: NOTIFICATION_TYPES.ATTENDANCE_ALERT,
          title: `Attendance Alert: ${student.fullName}`,
          message: `${student.fullName} was marked ${status} in ${subject.subjectName} on ${attendanceDate.toLocaleDateString()}`,
          priority: status === ATTENDANCE_STATUS.ABSENT ? 'high' : 'medium',
        });

        // Send email to guardian if available
        if (student.guardianEmail) {
          try {
            await EmailUtil.sendAttendanceNotification(
              student.guardianEmail,
              student.fullName,
              subject.subjectName,
              status,
              attendanceDate
            );
          } catch (emailError) {
            logger.error('Failed to send attendance email:', emailError);
            // Don't throw - email failure shouldn't fail the attendance marking
          }
        }
      }

      logger.info(`Attendance marked for student ${studentId} by user ${userId}`);

      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('student', 'studentNumber firstName lastName')
        .populate('subject', 'subjectCode subjectName')
        .populate('markedBy', 'name email')
        .lean();

      return populatedAttendance;
    } catch (error) {
      logger.error('Error in markAttendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance records by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Attendance records with pagination
   */
  async getAttendanceByDateRange(startDate, endDate, filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      // Build query
      const query = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };

      if (filters.studentId) query.student = filters.studentId;
      if (filters.subjectId) query.subject = filters.subjectId;
      if (filters.status) query.status = filters.status;

      const [records, total] = await Promise.all([
        Attendance.find(query)
          .populate('student', 'studentNumber firstName lastName section')
          .populate('subject', 'subjectCode subjectName')
          .populate('markedBy', 'name email')
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Attendance.countDocuments(query),
      ]);

      return {
        records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in getAttendanceByDateRange:', error);
      throw error;
    }
  }

  /**
   * Get attendance for a specific student
   * @param {String} studentId - Student ID
   * @param {Object} filters - Filters (subjectId, startDate, endDate)
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Student attendance records
   */
  async getStudentAttendance(studentId, filters = {}, pagination = {}) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        const error = new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      const { page = 1, limit = 10 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      const query = { student: studentId };

      if (filters.subjectId) query.subject = filters.subjectId;
      if (filters.startDate && filters.endDate) {
        query.date = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      }

      const [records, total] = await Promise.all([
        Attendance.find(query)
          .populate('subject', 'subjectCode subjectName')
          .populate('markedBy', 'name email')
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Attendance.countDocuments(query),
      ]);

      // Get attendance summary
      const summary = await this.getAttendanceSummary(studentId, filters.subjectId);

      return {
        student: {
          _id: student._id,
          studentNumber: student.studentNumber,
          fullName: student.fullName,
        },
        records,
        summary,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in getStudentAttendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance for a specific subject
   * @param {String} subjectId - Subject ID
   * @param {Object} filters - Filters (date, status)
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Subject attendance records
   */
  async getSubjectAttendance(subjectId, filters = {}, pagination = {}) {
    try {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      const { page = 1, limit = 10 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      const query = { subject: subjectId };

      if (filters.date) {
        const filterDate = new Date(filters.date);
        filterDate.setHours(0, 0, 0, 0);
        query.date = {
          $gte: filterDate,
          $lt: new Date(filterDate.getTime() + 24 * 60 * 60 * 1000),
        };
      }
      if (filters.status) query.status = filters.status;

      const [records, total] = await Promise.all([
        Attendance.find(query)
          .populate('student', 'studentNumber firstName lastName section')
          .populate('markedBy', 'name email')
          .sort({ date: -1, student: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Attendance.countDocuments(query),
      ]);

      return {
        subject: {
          _id: subject._id,
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
        },
        records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in getSubjectAttendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance summary for a student
   * @param {String} studentId - Student ID
   * @param {String} subjectId - Optional subject ID
   * @returns {Promise<Object>} Attendance summary
   */
  async getAttendanceSummary(studentId, subjectId = null) {
    try {
      const query = { student: studentId };
      if (subjectId) query.subject = subjectId;

      const summary = await Attendance.getAttendanceSummary(studentId, subjectId);

      return summary;
    } catch (error) {
      logger.error('Error in getAttendanceSummary:', error);
      throw error;
    }
  }

  /**
   * Update attendance record
   * @param {String} id - Attendance ID
   * @param {Object} updateData - Data to update
   * @param {String} userId - User ID performing update
   * @returns {Promise<Object>} Updated attendance
   */
  async updateAttendance(id, updateData, userId) {
    try {
      const attendance = await Attendance.findById(id);

      if (!attendance) {
        const error = new Error(ERROR_MESSAGES.ATTENDANCE_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      const oldStatus = attendance.status;

      // Update attendance
      Object.assign(attendance, updateData);
      await attendance.save();

      // Create activity record
      await Record.create({
        student: attendance.student,
        subject: attendance.subject,
        recordType: RECORD_TYPES.ATTENDANCE_MARKED,
        recordData: `Attendance updated from ${oldStatus} to ${attendance.status}`,
        performedBy: userId,
      });

      logger.info(`Attendance updated: ${id} by user ${userId}`);

      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('student', 'studentNumber firstName lastName')
        .populate('subject', 'subjectCode subjectName')
        .populate('markedBy', 'name email')
        .lean();

      return populatedAttendance;
    } catch (error) {
      logger.error('Error in updateAttendance:', error);
      throw error;
    }
  }

  /**
   * Delete attendance record
   * @param {String} id - Attendance ID
   * @param {String} userId - User ID performing deletion
   * @returns {Promise<void>}
   */
  async deleteAttendance(id, userId) {
    try {
      const attendance = await Attendance.findById(id);

      if (!attendance) {
        const error = new Error(ERROR_MESSAGES.ATTENDANCE_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      await attendance.deleteOne();

      // Create activity record
      await Record.create({
        student: attendance.student,
        subject: attendance.subject,
        recordType: RECORD_TYPES.ATTENDANCE_MARKED,
        recordData: 'Attendance record deleted',
        performedBy: userId,
      });

      logger.info(`Attendance deleted: ${id} by user ${userId}`);
    } catch (error) {
      logger.error('Error in deleteAttendance:', error);
      throw error;
    }
  }

  /**
   * Get today's attendance for a subject
   * @param {String} subjectId - Subject ID
   * @returns {Promise<Array>} Today's attendance records
   */
  async getTodayAttendance(subjectId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const records = await Attendance.find({
        subject: subjectId,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      })
        .populate('student', 'studentNumber firstName lastName section')
        .populate('markedBy', 'name email')
        .sort({ student: 1 })
        .lean();

      return records;
    } catch (error) {
      logger.error('Error in getTodayAttendance:', error);
      throw error;
    }
  }
}

module.exports = new AttendanceService();
