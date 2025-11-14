const { Record, Student, Subject, User } = require('../models');
const { RECORD_TYPES, ERROR_MESSAGES } = require('../config/constants');
const ValidationUtil = require('../utils/validationUtil');
const logger = require('../utils/logger');

/**
 * Record Service
 * Handles business logic for activity record management
 */
class RecordService {
  /**
   * Get all records with pagination and filters
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Paginated records
   */
  async getAllRecords(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      if (filters.recordType) query.recordType = filters.recordType;
      if (filters.studentId) query.student = filters.studentId;
      if (filters.subjectId) query.subject = filters.subjectId;
      if (filters.performedBy) query.performedBy = filters.performedBy;

      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      }

      const [records, total] = await Promise.all([
        Record.find(query)
          .populate('student', 'studentNumber firstName lastName')
          .populate('subject', 'subjectCode subjectName')
          .populate('performedBy', 'name email role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Record.countDocuments(query),
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
      logger.error('Error in getAllRecords:', error);
      throw error;
    }
  }

  /**
   * Get record by ID
   * @param {String} id - Record ID
   * @returns {Promise<Object>} Record details
   */
  async getRecordById(id) {
    try {
      const record = await Record.findById(id)
        .populate('student', 'studentNumber firstName lastName section')
        .populate('subject', 'subjectCode subjectName')
        .populate('performedBy', 'name email role')
        .lean();

      if (!record) {
        const error = new Error(ERROR_MESSAGES.RECORD_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      return record;
    } catch (error) {
      logger.error('Error in getRecordById:', error);
      throw error;
    }
  }

  /**
   * Get records by type
   * @param {String} recordType - Record type
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Records of specified type
   */
  async getRecordsByType(recordType, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      const records = await Record.findByType(recordType);

      // Apply pagination manually since static method returns all
      const total = records.length;
      const paginatedRecords = records.slice(skip, skip + limit);

      return {
        records: paginatedRecords,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in getRecordsByType:', error);
      throw error;
    }
  }

  /**
   * Get records by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Records in date range
   */
  async getRecordsByDateRange(startDate, endDate, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      const records = await Record.findByDateRange(startDate, endDate);

      // Apply pagination
      const total = records.length;
      const paginatedRecords = records.slice(skip, skip + limit);

      return {
        records: paginatedRecords,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in getRecordsByDateRange:', error);
      throw error;
    }
  }

  /**
   * Get records for a specific student
   * @param {String} studentId - Student ID
   * @param {Object} filters - Additional filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Student records
   */
  async getStudentRecords(studentId, filters = {}, pagination = {}) {
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

      if (filters.recordType) query.recordType = filters.recordType;
      if (filters.subjectId) query.subject = filters.subjectId;
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      }

      const [records, total] = await Promise.all([
        Record.find(query)
          .populate('subject', 'subjectCode subjectName')
          .populate('performedBy', 'name email role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Record.countDocuments(query),
      ]);

      return {
        student: {
          _id: student._id,
          studentNumber: student.studentNumber,
          fullName: student.fullName,
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
      logger.error('Error in getStudentRecords:', error);
      throw error;
    }
  }

  /**
   * Get records for a specific subject
   * @param {String} subjectId - Subject ID
   * @param {Object} filters - Additional filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Subject records
   */
  async getSubjectRecords(subjectId, filters = {}, pagination = {}) {
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

      if (filters.recordType) query.recordType = filters.recordType;
      if (filters.studentId) query.student = filters.studentId;
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      }

      const [records, total] = await Promise.all([
        Record.find(query)
          .populate('student', 'studentNumber firstName lastName')
          .populate('performedBy', 'name email role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Record.countDocuments(query),
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
      logger.error('Error in getSubjectRecords:', error);
      throw error;
    }
  }

  /**
   * Get today's records
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Today's records
   */
  async getTodayRecords(pagination = {}) {
    try {
      const { page = 1, limit = 10 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      const records = await Record.getTodayRecords();

      const total = records.length;
      const paginatedRecords = records.slice(skip, skip + limit);

      return {
        records: paginatedRecords,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in getTodayRecords:', error);
      throw error;
    }
  }

  /**
   * Delete record (Admin only)
   * @param {String} id - Record ID
   * @param {String} userId - User ID performing deletion
   * @returns {Promise<void>}
   */
  async deleteRecord(id, userId) {
    try {
      const record = await Record.findById(id);

      if (!record) {
        const error = new Error(ERROR_MESSAGES.RECORD_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      await record.deleteOne();

      logger.info(`Record ${id} deleted by user ${userId}`);
    } catch (error) {
      logger.error('Error in deleteRecord:', error);
      throw error;
    }
  }

  /**
   * Get record statistics
   * @param {Object} filters - Optional filters (startDate, endDate)
   * @returns {Promise<Object>} Record statistics
   */
  async getRecordStats(filters = {}) {
    try {
      const query = {};

      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      }

      const [total, byType, byPerformer] = await Promise.all([
        Record.countDocuments(query),
        Record.aggregate([
          { $match: query },
          { $group: { _id: '$recordType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Record.aggregate([
          { $match: query },
          {
            $group: {
              _id: '$performedBy',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: '$user' },
          {
            $project: {
              _id: 1,
              count: 1,
              userName: '$user.name',
              userEmail: '$user.email',
            },
          },
        ]),
      ]);

      return {
        total,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topPerformers: byPerformer,
      };
    } catch (error) {
      logger.error('Error in getRecordStats:', error);
      throw error;
    }
  }
}

module.exports = new RecordService();
