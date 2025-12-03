const { Attendance, Student, Subject, Enrollment, Record } = require('../models');
const {
  RECORD_TYPES,
  ATTENDANCE_STATUS,
  ERROR_MESSAGES,
  NOTIFICATION_TYPES,
} = require('../config/constants');
const logger = require('../utils/logger');
const emailUtil = require('../utils/emailUtil');

/**
 * Subject Attendance Service
 * Handles subject-specific attendance operations with support for multiple schedules
 */
class SubjectAttendanceService {
  /**
   * Mark attendance for a student in a subject
   * @param {Object} attendanceData - Attendance data with subjectId, studentId, date, status
   * @param {String} userId - User ID marking attendance
   * @returns {Promise<Object>} Created or updated attendance record
   */
  async markSubjectAttendance(attendanceData, userId) {
    try {
      const { subjectId, studentId, date, status, remarks, timeSlot, scheduleSlot } =
        attendanceData;

      // Validate subject exists
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Validate student exists
      const student = await Student.findById(studentId);
      if (!student) {
        const error = new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Check if student is enrolled in the subject
      const enrollment = await Enrollment.findOne({
        student: studentId,
        subject: subjectId,
        isActive: true,
      });

      if (!enrollment) {
        const error = new Error('Student is not enrolled in this subject');
        error.statusCode = 400;
        throw error;
      }

      // Normalize date to start of day
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      // Check for existing attendance with same schedule slot and time slot
      const existingAttendance = await Attendance.findOne({
        student: studentId,
        subject: subjectId,
        date: {
          $gte: attendanceDate,
          $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
        },
        scheduleSlot: scheduleSlot || null,
        timeSlot: timeSlot || null,
      });

      let attendance;
      let isUpdate = false;

      if (existingAttendance) {
        // Update existing attendance instead of throwing error
        isUpdate = true;

        // Add current state to history before updating
        existingAttendance.history.push({
          status: existingAttendance.status,
          timeSlot: existingAttendance.timeSlot,
          scheduleSlot: existingAttendance.scheduleSlot,
          remarks: existingAttendance.remarks,
          editedAt: existingAttendance.editedAt || existingAttendance.createdAt,
          editedBy: existingAttendance.editedBy || existingAttendance.markedBy,
        });

        // Update the attendance
        existingAttendance.status = status;
        existingAttendance.remarks = remarks || existingAttendance.remarks;
        existingAttendance.editedAt = new Date();
        existingAttendance.editedBy = userId;

        await existingAttendance.save();
        attendance = existingAttendance;
      } else {
        // Create new attendance record
        attendance = await Attendance.create({
          student: studentId,
          subject: subjectId,
          date: attendanceDate,
          status,
          timeSlot,
          scheduleSlot,
          remarks,
          markedBy: userId,
        });
      }

      // Create activity record
      const scheduleInfo = scheduleSlot ? ` (${scheduleSlot})` : '';
      const actionType = isUpdate ? 'updated' : 'marked';
      await Record.create({
        student: studentId,
        subject: subjectId,
        recordType: RECORD_TYPES.ATTENDANCE_MARKED,
        recordData: `Attendance ${actionType} as ${status} for ${subject.subjectName}${scheduleInfo}`,
        performedBy: userId,
      });

      // Send email notifications asynchronously (fire-and-forget)
      // This prevents the API from timing out while waiting for emails to send
      setImmediate(() => {
        this._sendAttendanceNotifications(
          student,
          subject,
          attendance,
          scheduleSlot,
          isUpdate,
          userId
        ).catch((emailError) => {
          logger.error('Failed to send attendance notification email:', emailError);
        });
      });

      logger.info(
        `Attendance ${actionType} for student ${studentId} in subject ${subjectId} by user ${userId}`
      );

      // Return populated attendance immediately without waiting for emails
      // Include isUpdate flag so callers know whether the record was created or updated
      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('student', 'studentNumber firstName lastName email')
        .populate('subject', 'subjectCode subjectName')
        .populate('markedBy', 'name email')
        .lean();

      return { attendance: populatedAttendance, isUpdate };
    } catch (error) {
      logger.error('Error in markSubjectAttendance:', error.message);
      throw error;
    }
  }

  /**
   * Send attendance notifications to student and guardian
   * @private
   */
  async _sendAttendanceNotifications(
    student,
    subject,
    attendance,
    scheduleSlot,
    isUpdate = false,
    userId = null
  ) {
    const scheduleInfo = scheduleSlot ? ` - ${scheduleSlot}` : '';
    const actionType = isUpdate ? 'updated' : 'marked';
    const attendanceData = {
      date: attendance.date,
      status: attendance.status,
      subject: `${subject.subjectCode} - ${subject.subjectName}${scheduleInfo}`,
      remarks: attendance.remarks,
      actionType,
    };

    const studentData = {
      firstName: student.firstName,
      lastName: student.lastName,
      studentNumber: student.studentNumber,
    };

    const emailSubject = `Attendance Alert for ${student.firstName} ${student.lastName}`;

    // Send to student
    if (student.email) {
      try {
        const result = await emailUtil.sendAttendanceNotification(
          student.email,
          studentData,
          attendanceData
        );
        logger.info(`Attendance notification sent to student: ${student.email}`);

        // Create email history record
        await Record.create({
          recordType: RECORD_TYPES.EMAIL_SENT,
          recordData: `Attendance notification sent to student (${student.email}): ${emailSubject}`,
          student: student._id,
          subject: subject._id,
          performedBy: userId,
          metadata: {
            recipient: student.email,
            recipientType: 'student',
            subject: emailSubject,
            attendanceStatus: attendance.status,
            messageId: result?.messageId,
          },
        });
      } catch (error) {
        logger.error(`Failed to send notification to student ${student.email}:`, error.message);
      }
    }

    // Send to guardian
    if (student.guardianEmail) {
      try {
        const result = await emailUtil.sendAttendanceNotification(
          student.guardianEmail,
          studentData,
          attendanceData
        );
        logger.info(`Attendance notification sent to guardian: ${student.guardianEmail}`);

        // Create email history record
        await Record.create({
          recordType: RECORD_TYPES.EMAIL_SENT,
          recordData: `Attendance notification sent to guardian (${student.guardianEmail}): ${emailSubject}`,
          student: student._id,
          subject: subject._id,
          performedBy: userId,
          metadata: {
            recipient: student.guardianEmail,
            recipientType: 'guardian',
            guardianName: student.guardianName,
            subject: emailSubject,
            attendanceStatus: attendance.status,
            messageId: result?.messageId,
          },
        });
      } catch (error) {
        logger.error(
          `Failed to send notification to guardian ${student.guardianEmail}:`,
          error.message
        );
      }
    }
  }

  /**
   * Bulk mark attendance for multiple students in a subject
   * @param {String} subjectId - Subject ID
   * @param {Array} attendanceData - Array of attendance records
   * @param {String} userId - User ID marking attendance
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkMarkSubjectAttendance(subjectId, attendanceData, userId) {
    try {
      // Validate subject exists
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      const results = {
        successful: [],
        failed: [],
        total: attendanceData.length,
      };

      for (const data of attendanceData) {
        try {
          const attendance = await this.markSubjectAttendance(
            {
              subjectId,
              studentId: data.studentId,
              date: data.date || new Date(),
              status: data.status,
              remarks: data.remarks,
              timeSlot: data.timeSlot,
              scheduleSlot: data.scheduleSlot,
            },
            userId
          );

          // attendance now returns { attendance, isUpdate }
          results.successful.push({
            studentId: data.studentId,
            attendance: attendance.attendance,
            isUpdate: attendance.isUpdate,
          });
        } catch (error) {
          results.failed.push({
            studentId: data.studentId,
            error: error.message,
          });
        }
      }

      logger.info(
        `Bulk attendance marked for subject ${subjectId}: ${results.successful.length}/${results.total} successful`
      );

      // Summarize created vs updated
      const updated = results.successful.filter((r) => r.isUpdate).length;
      const created = results.successful.filter((r) => !r.isUpdate).length;
      results.summary = { updated, created };
      // Return records with essential fields
      results.records = results.successful.map((r) => ({
        _id: r.attendance._id,
        student: r.attendance.student,
        status: r.attendance.status,
        markedBy: r.attendance.markedBy,
      }));

      return results;
    } catch (error) {
      logger.error('Error in bulkMarkSubjectAttendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance records for a subject on a specific date
   * @param {String} subjectId - Subject ID
   * @param {String} date - Date string
   * @param {String} scheduleSlot - Optional schedule slot filter
   * @returns {Promise<Array>} Attendance records
   */
  async getSubjectAttendanceByDate(subjectId, date, scheduleSlot = null) {
    try {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const query = {
        subject: subjectId,
        date: {
          $gte: targetDate,
          $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
        },
      };

      if (scheduleSlot) {
        query.scheduleSlot = scheduleSlot;
      }

      const records = await Attendance.find(query)
        .populate('student', 'studentNumber firstName lastName email section guardianEmail')
        .populate('markedBy', 'name email')
        .sort({ 'student.studentNumber': 1 })
        .lean();

      // Get all enrolled students for this subject
      const enrollments = await Enrollment.find({ subject: subjectId, isActive: true }).populate(
        'student',
        'studentNumber firstName lastName email'
      );

      // Create map of attendance by student id
      const attendanceMap = new Map();
      records.forEach((record) => {
        if (record.student && record.student._id) {
          attendanceMap.set(record.student._id.toString(), record);
        }
      });

      // Build students array including unmarked
      const stats = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0, total: 0 };
      const students = enrollments.map((enrollment) => {
        const student = enrollment.student;
        const attendance = attendanceMap.get(student._id.toString());
        const status = attendance ? attendance.status : 'unmarked';
        if (stats.hasOwnProperty(status)) stats[status]++;
        stats.total++;

        return {
          _id: student._id,
          studentId: student.studentNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          status,
          markedAt: attendance ? attendance.updatedAt || attendance.createdAt : null,
          markedBy: attendance ? attendance.markedBy : null,
        };
      });

      return {
        subjectId: subject._id,
        date: targetDate.toISOString(),
        students,
        stats,
      };
    } catch (error) {
      logger.error('Error in getSubjectAttendanceByDate:', error);
      throw error;
    }
  }

  /**
   * Get attendance summary for a subject on a specific date
   * @param {String} subjectId - Subject ID
   * @param {String} date - Date string
   * @returns {Promise<Object>} Attendance summary
   */
  async getSubjectAttendanceSummary(subjectId, date) {
    try {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const result = await this.getSubjectAttendanceByDate(subjectId, date);

      const studentsList = Array.isArray(result) ? result : result.students || [];

      const totalEnrolled = await Enrollment.countDocuments({
        subject: subjectId,
        isActive: true,
      });

      const summary = {
        subjectId: subject._id,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        totalEnrolled,
        totalMarked: studentsList.filter((s) => s.status && s.status !== 'unmarked').length,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };

      studentsList.forEach((record) => {
        if (record.status === ATTENDANCE_STATUS.PRESENT) summary.present++;
        else if (record.status === ATTENDANCE_STATUS.ABSENT) summary.absent++;
        else if (record.status === ATTENDANCE_STATUS.LATE) summary.late++;
        else if (record.status === ATTENDANCE_STATUS.EXCUSED) summary.excused++;
      });

      summary.attendanceRate =
        totalEnrolled > 0 ? ((summary.present / totalEnrolled) * 100).toFixed(2) : 0;

      return summary;
    } catch (error) {
      logger.error('Error in getSubjectAttendanceSummary:', error);
      throw error;
    }
  }

  /**
   * Get attendance statistics for a subject over a date range
   * @param {String} subjectId - Subject ID
   * @param {String} startDate - Start date
   * @param {String} endDate - End date
   * @returns {Promise<Object>} Attendance statistics
   */
  async getSubjectAttendanceStats(subjectId, startDate, endDate) {
    try {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const stats = await Attendance.aggregate([
        {
          $match: {
            subject: subject._id,
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const totalEnrolled = await Enrollment.countDocuments({
        subject: subjectId,
        isActive: true,
      });

      const result = {
        subjectId: subject._id,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        dateRange: { startDate: start, endDate: end },
        totalEnrolled,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
      };

      stats.forEach((stat) => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      result.averageAttendanceRate =
        result.total > 0 ? ((result.present / result.total) * 100).toFixed(2) : 0;

      return result;
    } catch (error) {
      logger.error('Error in getSubjectAttendanceStats:', error);
      throw error;
    }
  }
}

module.exports = new SubjectAttendanceService();
