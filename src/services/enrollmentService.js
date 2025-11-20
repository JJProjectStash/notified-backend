const { Enrollment, Student, Subject, Record } = require('../models');
const { RECORD_TYPES, ERROR_MESSAGES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Enrollment Service
 * Handles business logic for student-subject enrollment
 */
class EnrollmentService {
  /**
   * Enroll a student in a subject
   * @param {String} subjectId - Subject ID
   * @param {String} studentId - Student ID
   * @param {String} userId - User ID performing enrollment
   * @returns {Promise<Object>} Created enrollment
   */
  async enrollStudent(subjectId, studentId, userId) {
    try {
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

      // Check if already enrolled
      const existingEnrollment = await Enrollment.findOne({
        student: studentId,
        subject: subjectId,
      });

      if (existingEnrollment) {
        if (existingEnrollment.isActive) {
          const error = new Error(ERROR_MESSAGES.ENROLLMENT_EXISTS);
          error.statusCode = 409;
          throw error;
        } else {
          // Reactivate inactive enrollment
          existingEnrollment.isActive = true;
          existingEnrollment.enrollmentDate = new Date();
          existingEnrollment.enrolledBy = userId;
          await existingEnrollment.save();

          logger.info(
            `Enrollment reactivated: Student ${studentId} in Subject ${subjectId} by user ${userId}`
          );

          const populated = await Enrollment.findById(existingEnrollment._id)
            .populate('student', 'studentNumber firstName lastName email section')
            .populate('subject', 'subjectCode subjectName yearLevel section')
            .populate('enrolledBy', 'name email')
            .lean();

          return this._formatEnrollment(populated);
        }
      }

      // Create new enrollment
      const enrollment = await Enrollment.create({
        student: studentId,
        subject: subjectId,
        enrolledBy: userId,
      });

      // Create activity record
      await Record.create({
        student: studentId,
        subject: subjectId,
        recordType: RECORD_TYPES.ENROLLMENT,
        recordData: `Student enrolled in ${subject.subjectCode} - ${subject.subjectName}`,
        performedBy: userId,
      });

      logger.info(`Student ${studentId} enrolled in Subject ${subjectId} by user ${userId}`);

      // Return populated enrollment
      const populated = await Enrollment.findById(enrollment._id)
        .populate('student', 'studentNumber firstName lastName email section')
        .populate('subject', 'subjectCode subjectName yearLevel section')
        .populate('enrolledBy', 'name email')
        .lean();

      return this._formatEnrollment(populated);
    } catch (error) {
      logger.error('Error in enrollStudent:', error);
      throw error;
    }
  }

  /**
   * Unenroll a student from a subject
   * @param {String} subjectId - Subject ID
   * @param {String} studentId - Student ID
   * @param {String} userId - User ID performing unenrollment
   * @returns {Promise<void>}
   */
  async unenrollStudent(subjectId, studentId, userId) {
    try {
      const enrollment = await Enrollment.findOne({
        student: studentId,
        subject: subjectId,
        isActive: true,
      });

      if (!enrollment) {
        const error = new Error(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Soft delete by setting isActive to false
      enrollment.isActive = false;
      await enrollment.save();

      // Get subject details for logging
      const subject = await Subject.findById(subjectId);

      // Create activity record
      await Record.create({
        student: studentId,
        subject: subjectId,
        recordType: RECORD_TYPES.ENROLLMENT,
        recordData: `Student unenrolled from ${subject?.subjectCode || 'subject'}`,
        performedBy: userId,
      });

      logger.info(`Student ${studentId} unenrolled from Subject ${subjectId} by user ${userId}`);
    } catch (error) {
      logger.error('Error in unenrollStudent:', error);
      throw error;
    }
  }

  /**
   * Bulk enroll students in a subject
   * @param {String} subjectId - Subject ID
   * @param {Array<String>} studentIds - Array of student IDs
   * @param {String} userId - User ID performing enrollment
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkEnrollStudents(subjectId, studentIds, userId) {
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
        total: studentIds.length,
      };

      for (const studentId of studentIds) {
        try {
          const enrollment = await this.enrollStudent(subjectId, studentId, userId);
          results.successful.push({
            studentId,
            enrollment,
          });
        } catch (error) {
          results.failed.push({
            studentId,
            error: error.message,
          });
        }
      }

      logger.info(
        `Bulk enrollment: ${results.successful.length}/${results.total} successful for Subject ${subjectId}`
      );

      return results;
    } catch (error) {
      logger.error('Error in bulkEnrollStudents:', error);
      throw error;
    }
  }

  /**
   * Get all enrolled students for a subject
   * @param {String} subjectId - Subject ID
   * @returns {Promise<Array>} Enrolled students
   */
  async getEnrolledStudents(subjectId) {
    try {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        const error = new Error(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      const enrollments = await Enrollment.find({
        subject: subjectId,
        isActive: true,
      })
        .populate('student', 'studentNumber firstName lastName email section')
        .populate('enrolledBy', 'name email')
        .sort({ enrollmentDate: -1 })
        .lean();

      return enrollments.map((enrollment) => this._formatEnrollment(enrollment));
    } catch (error) {
      logger.error('Error in getEnrolledStudents:', error);
      throw error;
    }
  }

  /**
   * Format enrollment object to match frontend expectations
   * @private
   */
  _formatEnrollment(enrollment) {
    // Ensure we handle both populated and unpopulated student fields
    const studentObj = enrollment.student || {};
    const studentId = studentObj._id || enrollment.student;

    return {
      id: enrollment._id,
      studentId: studentId,
      subjectId: enrollment.subject,
      enrolledAt: enrollment.enrollmentDate,
      student: studentObj,
      enrolledBy: enrollment.enrolledBy,
    };
  }

  /**
   * Check if a student is enrolled in a subject
   * @param {String} subjectId - Subject ID
   * @param {String} studentId - Student ID
   * @returns {Promise<Boolean>} Enrollment status
   */
  async isStudentEnrolled(subjectId, studentId) {
    try {
      const enrollment = await Enrollment.findOne({
        student: studentId,
        subject: subjectId,
        isActive: true,
      });

      return !!enrollment;
    } catch (error) {
      logger.error('Error in isStudentEnrolled:', error);
      throw error;
    }
  }

  /**
   * Get enrollment details
   * @param {String} enrollmentId - Enrollment ID
   * @returns {Promise<Object>} Enrollment details
   */
  async getEnrollmentById(enrollmentId) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId)
        .populate('student', 'studentNumber firstName lastName email section')
        .populate('subject', 'subjectCode subjectName yearLevel section')
        .populate('enrolledBy', 'name email')
        .lean();

      if (!enrollment) {
        const error = new Error(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      return this._formatEnrollment(enrollment);
    } catch (error) {
      logger.error('Error in getEnrollmentById:', error);
      throw error;
    }
  }

  /**
   * Get all enrollments for a student
   * @param {String} studentId - Student ID
   * @returns {Promise<Array>} Student's enrollments
   */
  async getStudentEnrollments(studentId) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        const error = new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      const enrollments = await Enrollment.find({
        student: studentId,
        isActive: true,
      })
        .populate('subject', 'subjectCode subjectName yearLevel section')
        .populate('enrolledBy', 'name email')
        .sort({ enrollmentDate: -1 })
        .lean();

      return enrollments.map((enrollment) => this._formatEnrollment(enrollment));
    } catch (error) {
      logger.error('Error in getStudentEnrollments:', error);
      throw error;
    }
  }
}

module.exports = new EnrollmentService();
