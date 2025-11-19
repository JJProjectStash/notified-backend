const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const { Attendance, Student, Subject, Record, Notification } = require('../models');
const {
  RECORD_TYPES,
  ATTENDANCE_STATUS,
  ERROR_MESSAGES,
  NOTIFICATION_TYPES,
} = require('../config/constants');
const ValidationUtil = require('../utils/validationUtil');
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

      // Validate subject exists when provided (subject is optional for arrival-only marks)
      let subject = null;
      if (subjectId) {
        subject = await Subject.findById(subjectId);
        if (!subject) {
          const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
          error.statusCode = 404;
          throw error;
        }
      }

      // Check if attendance already marked for this date
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      // Check for existing attendance for the same student/date.
      // If subject is present, include it in the check; otherwise look for records with no subject.
      const attendanceQuery = {
        student: studentId,
        date: {
          $gte: attendanceDate,
          $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
        },
      };

      if (subjectId) {
        attendanceQuery.subject = subjectId;
      } else {
        // Match documents where subject is null/undefined (arrival-only marks)
        attendanceQuery.subject = { $exists: false };
      }

      const existingAttendance = await Attendance.findOne(attendanceQuery);

      if (existingAttendance) {
        // Populate existing attendance for returning to client
        const populatedExisting = await Attendance.findById(existingAttendance._id)
          .populate('student', 'studentNumber firstName lastName')
          .populate('subject', 'subjectCode subjectName')
          .populate('markedBy', 'name email')
          .lean();

        const error = new Error(ERROR_MESSAGES.ATTENDANCE_EXISTS);
        error.statusCode = 409;
        // Attach the existing record so the controller / error middleware can include it
        error.data = populatedExisting;
        throw error;
      }

      // Create attendance record
      const attendance = await Attendance.create({
        student: studentId,
        subject: subjectId,
        date: attendanceDate,
        status,
        timeSlot: attendanceData.timeSlot,
        remarks,
        markedBy: userId,
      });

      // Create activity record (use subject name when available)
      await Record.create({
        student: studentId,
        subject: subjectId || null,
        recordType: RECORD_TYPES.ATTENDANCE_MARKED,
        recordData: `Attendance marked as ${status}${subject ? ` for ${subject.subjectName}` : ''}`,
        performedBy: userId,
      });

      // Send notification if absent or late
      if (status === ATTENDANCE_STATUS.ABSENT || status === ATTENDANCE_STATUS.LATE) {
        const subjectName = subject ? subject.subjectName : 'the school';

        await Notification.createNotification(student.createdBy, {
          student: studentId,
          type: NOTIFICATION_TYPES.ATTENDANCE_ALERT,
          title: `Attendance Alert: ${student.fullName}`,
          message: `${student.fullName} was marked ${status}${subject ? ` in ${subject.subjectName}` : ''} on ${attendanceDate.toLocaleDateString()}`,
          priority: status === ATTENDANCE_STATUS.ABSENT ? 'high' : 'medium',
        });

        // Send email to guardian if available; include subject name when present
        if (student.guardianEmail) {
          try {
            await EmailUtil.sendAttendanceNotification(
              student.guardianEmail,
              student.fullName,
              subjectName,
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
      if (filters.timeSlot) query.timeSlot = filters.timeSlot;

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

      // Add audit information and history entry
      const historyEntry = {
        status: attendance.status,
        timeSlot: attendance.timeSlot,
        remarks: attendance.remarks,
        editedAt: new Date(),
        editedBy: userId,
      };

      // Update attendance
      Object.assign(attendance, updateData);
      attendance.editedAt = new Date();
      attendance.editedBy = userId;
      // Initialize history if needed
      if (!Array.isArray(attendance.history)) attendance.history = [];
      attendance.history.push(historyEntry);
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

  /**
   * Bulk mark attendance for multiple students
   * @param {Array} records - Array of attendance records
   * @param {String} userId - User ID marking attendance
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkMarkAttendance(records, userId) {
    try {
      const results = {
        successful: [],
        failed: [],
        total: records.length,
      };

      for (const record of records) {
        try {
          const attendanceData = {
            ...record,
            date: record.date || new Date(),
          };

          const attendance = await this.markAttendance(attendanceData, userId);
          results.successful.push({
            studentId: record.studentId,
            attendance,
          });
        } catch (error) {
          results.failed.push({
            studentId: record.studentId,
            error: error.message,
          });
        }
      }

      logger.info(
        `Bulk attendance marked: ${results.successful.length}/${results.total} successful`
      );
      return results;
    } catch (error) {
      logger.error('Error in bulkMarkAttendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance records with flexible filters
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Attendance records with pagination
   */
  async getAttendanceRecords(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      const query = {};

      if (filters.studentId) query.student = filters.studentId;
      if (filters.subjectId) query.subject = filters.subjectId;
      if (filters.status) query.status = filters.status;

      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) {
          const start = new Date(filters.startDate);
          start.setHours(0, 0, 0, 0);
          query.date.$gte = start;
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          end.setHours(23, 59, 59, 999);
          query.date.$lte = end;
        }
      }

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
      logger.error('Error in getAttendanceRecords:', error);
      throw error;
    }
  }

  /**
   * Get daily attendance summary
   * @param {String} date - Date to get summary for
   * @param {String} subjectId - Optional subject ID filter
   * @returns {Promise<Object>} Daily summary
   */
  async getDailySummary(date, subjectId = null) {
    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const query = {
        date: {
          $gte: targetDate,
          $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
        },
      };

      if (subjectId) query.subject = subjectId;

      const summary = await Attendance.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const total = summary.reduce((acc, item) => acc + item.count, 0);
      const formattedSummary = {
        date: targetDate,
        total,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };

      summary.forEach((item) => {
        formattedSummary[item._id] = item.count;
      });

      formattedSummary.attendanceRate =
        total > 0 ? ((formattedSummary.present / total) * 100).toFixed(2) : 0;

      return formattedSummary;
    } catch (error) {
      logger.error('Error in getDailySummary:', error);
      throw error;
    }
  }

  /**
   * Get attendance summary for all students
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Students summary
   */
  async getStudentsSummary(filters = {}) {
    try {
      const query = {};

      if (filters.subjectId) query.subject = filters.subjectId;

      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) query.date.$gte = new Date(filters.startDate);
        if (filters.endDate) query.date.$lte = new Date(filters.endDate);
      }

      const summary = await Attendance.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$student',
            totalDays: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
            },
            absent: {
              $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
            },
            late: {
              $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
            },
            excused: {
              $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: 'students',
            localField: '_id',
            foreignField: '_id',
            as: 'student',
          },
        },
        { $unwind: '$student' },
        {
          $project: {
            _id: 1,
            studentNumber: '$student.studentNumber',
            firstName: '$student.firstName',
            lastName: '$student.lastName',
            section: '$student.section',
            totalDays: 1,
            present: 1,
            absent: 1,
            late: 1,
            excused: 1,
            attendanceRate: {
              $multiply: [{ $divide: ['$present', '$totalDays'] }, 100],
            },
          },
        },
        { $sort: { studentNumber: 1 } },
      ]);

      return summary;
    } catch (error) {
      logger.error('Error in getStudentsSummary:', error);
      throw error;
    }
  }

  /**
   * Import attendance from Excel file
   * @param {Object} file - Uploaded file object
   * @param {String} userId - User ID performing import
   * @returns {Promise<Object>} Import result
   */
  async importFromExcel(file, userId) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(file.tempFilePath);

      const worksheet = workbook.getWorksheet(1);
      const records = [];
      const errors = [];

      // Skip header row (row 1)
      const rows = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) rows.push({ row, rowNumber });
      });

      for (const { row, rowNumber } of rows) {
        try {
          const record = {
            studentId: row.getCell(1).value,
            subjectId: row.getCell(2).value,
            date: row.getCell(3).value,
            status: row.getCell(4).value,
            remarks: row.getCell(5).value || '',
          };

          // Validate required fields
          if (!record.studentId || !record.subjectId || !record.status) {
            errors.push({
              row: rowNumber,
              error: 'Missing required fields',
            });
            continue;
          }

          // Validate status
          if (!Object.values(ATTENDANCE_STATUS).includes(record.status)) {
            errors.push({
              row: rowNumber,
              error: `Invalid status: ${record.status}`,
            });
            continue;
          }

          records.push(record);
        } catch (error) {
          errors.push({
            row: rowNumber,
            error: error.message,
          });
        }
      }

      // Clean up temp file
      try {
        await fs.unlink(file.tempFilePath);
      } catch (unlinkError) {
        // Ignore cleanup errors
      }

      if (errors.length > 0) {
        return {
          success: false,
          imported: 0,
          errors,
          message: 'Import failed with errors',
        };
      }

      // Bulk mark attendance
      const result = await this.bulkMarkAttendance(records, userId);

      return {
        success: true,
        imported: result.successful.length,
        failed: result.failed.length,
        total: records.length,
        errors: result.failed,
      };
    } catch (error) {
      logger.error('Error in importFromExcel:', error);
      throw error;
    }
  }

  /**
   * Export attendance to Excel file
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Buffer>} Excel file buffer
   */
  async exportToExcel(filters = {}) {
    try {
      const query = {};

      if (filters.studentId) query.student = filters.studentId;
      if (filters.subjectId) query.subject = filters.subjectId;
      if (filters.status) query.status = filters.status;

      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) query.date.$gte = new Date(filters.startDate);
        if (filters.endDate) query.date.$lte = new Date(filters.endDate);
      }

      const records = await Attendance.find(query)
        .populate('student', 'studentNumber firstName lastName section')
        .populate('subject', 'subjectCode subjectName')
        .populate('markedBy', 'name')
        .sort({ date: -1 })
        .lean();

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance Records');

      // Add headers
      worksheet.columns = [
        { header: 'Student Number', key: 'studentNumber', width: 15 },
        { header: 'Student Name', key: 'studentName', width: 25 },
        { header: 'Section', key: 'section', width: 10 },
        { header: 'Subject Code', key: 'subjectCode', width: 15 },
        { header: 'Subject Name', key: 'subjectName', width: 25 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Remarks', key: 'remarks', width: 30 },
        { header: 'Marked By', key: 'markedBy', width: 20 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Add data rows
      records.forEach((record) => {
        worksheet.addRow({
          studentNumber: record.student?.studentNumber || 'N/A',
          studentName: record.student
            ? `${record.student.firstName} ${record.student.lastName}`
            : 'N/A',
          section: record.student?.section || 'N/A',
          subjectCode: record.subject?.subjectCode || 'N/A',
          subjectName: record.subject?.subjectName || 'N/A',
          date: new Date(record.date).toLocaleDateString(),
          status: record.status,
          remarks: record.remarks || '',
          markedBy: record.markedBy?.name || 'System',
        });
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      logger.error('Error in exportToExcel:', error);
      throw error;
    }
  }
}

module.exports = new AttendanceService();
