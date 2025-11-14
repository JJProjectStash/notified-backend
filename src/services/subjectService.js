const { Subject, Enrollment, Record } = require('../models');
const { RECORD_TYPES, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../config/constants');
const ValidationUtil = require('../utils/validationUtil');
const logger = require('../utils/logger');

/**
 * Subject Service
 * Handles business logic for subject management
 */
class SubjectService {
  /**
   * Get all subjects with pagination and filters
   * @param {Object} filters - Filter options (yearLevel, section, isActive)
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Paginated subjects
   */
  async getAllSubjects(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      if (filters.yearLevel) query.yearLevel = filters.yearLevel;
      if (filters.section) query.section = new RegExp(filters.section, 'i');
      if (filters.isActive !== undefined) query.isActive = filters.isActive;

      // Execute query with pagination
      const [subjects, total] = await Promise.all([
        Subject.find(query)
          .populate('createdBy', 'name email')
          .sort({ subjectCode: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Subject.countDocuments(query),
      ]);

      // Enrich subjects with enrollment counts
      const enrichedSubjects = await Promise.all(
        subjects.map(async (subject) => ({
          ...subject,
          enrollmentCount: await Enrollment.countDocuments({
            subject: subject._id,
            isActive: true,
          }),
        }))
      );

      return {
        subjects: enrichedSubjects,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in getAllSubjects:', error);
      throw error;
    }
  }

  /**
   * Get subject by ID
   * @param {String} id - Subject ID
   * @returns {Promise<Object>} Subject details
   */
  async getSubjectById(id) {
    try {
      const subject = await Subject.findById(id).populate('createdBy', 'name email').lean();

      if (!subject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Get enrollment count
      const enrollmentCount = await Enrollment.countDocuments({
        subject: subject._id,
        isActive: true,
      });

      return {
        ...subject,
        enrollmentCount,
      };
    } catch (error) {
      logger.error('Error in getSubjectById:', error);
      throw error;
    }
  }

  /**
   * Get subject by subject code
   * @param {String} subjectCode - Subject code
   * @returns {Promise<Object>} Subject details
   */
  async getSubjectByCode(subjectCode) {
    try {
      const subject = await Subject.findByCode(subjectCode);

      if (!subject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Get enrollment count
      const enrollmentCount = await subject.getEnrollmentCount();

      return {
        ...subject.toObject(),
        enrollmentCount,
      };
    } catch (error) {
      logger.error('Error in getSubjectByCode:', error);
      throw error;
    }
  }

  /**
   * Create new subject
   * @param {Object} subjectData - Subject data
   * @param {String} userId - User ID creating the subject
   * @returns {Promise<Object>} Created subject
   */
  async createSubject(subjectData, userId) {
    try {
      const { subjectCode, subjectName, description, yearLevel, section } = subjectData;

      // Validate subject code format
      if (!ValidationUtil.isValidSubjectCode(subjectCode)) {
        const error = new Error(ERROR_MESSAGES.INVALID_SUBJECT_CODE);
        error.statusCode = 400;
        throw error;
      }

      // Check if subject code already exists
      const existingSubject = await Subject.findOne({
        subjectCode: subjectCode.toUpperCase(),
      });

      if (existingSubject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_CODE_EXISTS);
        error.statusCode = 409;
        throw error;
      }

      // Create subject
      const subject = await Subject.create({
        subjectCode: subjectCode.toUpperCase(),
        subjectName,
        description,
        yearLevel,
        section,
        createdBy: userId,
      });

      // Create activity record
      await Record.createSubjectRecord(
        subject._id,
        RECORD_TYPES.SUBJECT_ADDED,
        `Subject ${subject.subjectCode} - ${subject.subjectName} created`,
        userId
      );

      logger.info(`Subject created: ${subject.subjectCode} by user ${userId}`);

      return subject.toObject();
    } catch (error) {
      logger.error('Error in createSubject:', error);
      throw error;
    }
  }

  /**
   * Update subject
   * @param {String} id - Subject ID
   * @param {Object} updateData - Data to update
   * @param {String} userId - User ID performing update
   * @returns {Promise<Object>} Updated subject
   */
  async updateSubject(id, updateData, userId) {
    try {
      const subject = await Subject.findById(id);

      if (!subject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // If updating subject code, validate and check uniqueness
      if (updateData.subjectCode && updateData.subjectCode !== subject.subjectCode) {
        if (!ValidationUtil.isValidSubjectCode(updateData.subjectCode)) {
          const error = new Error(ERROR_MESSAGES.INVALID_SUBJECT_CODE);
          error.statusCode = 400;
          throw error;
        }

        const existingSubject = await Subject.findOne({
          subjectCode: updateData.subjectCode.toUpperCase(),
          _id: { $ne: id },
        });

        if (existingSubject) {
          const error = new Error(ERROR_MESSAGES.SUBJECT_CODE_EXISTS);
          error.statusCode = 409;
          throw error;
        }

        updateData.subjectCode = updateData.subjectCode.toUpperCase();
      }

      // Update subject
      Object.assign(subject, updateData);
      await subject.save();

      // Create activity record
      await Record.createSubjectRecord(
        subject._id,
        RECORD_TYPES.SUBJECT_UPDATED,
        `Subject ${subject.subjectCode} updated`,
        userId
      );

      logger.info(`Subject updated: ${subject.subjectCode} by user ${userId}`);

      return subject.toObject();
    } catch (error) {
      logger.error('Error in updateSubject:', error);
      throw error;
    }
  }

  /**
   * Delete subject (soft delete)
   * @param {String} id - Subject ID
   * @param {String} userId - User ID performing deletion
   * @returns {Promise<Object>} Deleted subject
   */
  async deleteSubject(id, userId) {
    try {
      const subject = await Subject.findById(id);

      if (!subject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Check if subject has active enrollments
      const activeEnrollments = await Enrollment.countDocuments({
        subject: id,
        isActive: true,
      });

      if (activeEnrollments > 0) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_HAS_ENROLLMENTS);
        error.statusCode = 400;
        throw error;
      }

      // Soft delete
      subject.isActive = false;
      await subject.save();

      // Create activity record
      await Record.createSubjectRecord(
        subject._id,
        RECORD_TYPES.SUBJECT_DELETED,
        `Subject ${subject.subjectCode} deleted`,
        userId
      );

      logger.info(`Subject deleted: ${subject.subjectCode} by user ${userId}`);

      return subject.toObject();
    } catch (error) {
      logger.error('Error in deleteSubject:', error);
      throw error;
    }
  }

  /**
   * Search subjects
   * @param {String} searchTerm - Search term
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Search results
   */
  async searchSubjects(searchTerm, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      // Build search query
      const searchRegex = new RegExp(searchTerm, 'i');
      const query = {
        $or: [
          { subjectCode: searchRegex },
          { subjectName: searchRegex },
          { description: searchRegex },
          { section: searchRegex },
        ],
      };

      const [subjects, total] = await Promise.all([
        Subject.find(query)
          .populate('createdBy', 'name email')
          .sort({ subjectCode: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Subject.countDocuments(query),
      ]);

      return {
        subjects,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in searchSubjects:', error);
      throw error;
    }
  }

  /**
   * Get subjects by year level and section
   * @param {Number} yearLevel - Year level
   * @param {String} section - Section
   * @returns {Promise<Array>} Subjects
   */
  async getSubjectsByYearAndSection(yearLevel, section) {
    try {
      const subjects = await Subject.findByYearAndSection(yearLevel, section);
      return subjects;
    } catch (error) {
      logger.error('Error in getSubjectsByYearAndSection:', error);
      throw error;
    }
  }

  /**
   * Get subject enrollment details
   * @param {String} id - Subject ID
   * @returns {Promise<Object>} Enrollment details
   */
  async getSubjectEnrollments(id) {
    try {
      const subject = await Subject.findById(id);

      if (!subject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      const enrollments = await Enrollment.find({
        subject: id,
        isActive: true,
      })
        .populate('student', 'studentNumber firstName lastName email section')
        .populate('enrolledBy', 'name email')
        .sort({ enrollmentDate: -1 })
        .lean();

      return {
        subject: subject.toObject(),
        enrollments,
        totalEnrolled: enrollments.length,
      };
    } catch (error) {
      logger.error('Error in getSubjectEnrollments:', error);
      throw error;
    }
  }
}

module.exports = new SubjectService();
