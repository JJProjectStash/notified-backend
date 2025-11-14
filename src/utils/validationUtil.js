/**
 * Validation Utility
 * Common validation functions
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const { VALIDATION } = require('../config/constants');

class ValidationUtil {
  /**
   * Validate email format
   * @param {String} email - Email to validate
   * @returns {Boolean} True if valid
   */
  static isValidEmail(email) {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @param {String} password - Password to validate
   * @returns {Object} { valid: Boolean, message: String }
   */
  static validatePassword(password) {
    if (!password || password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      return {
        valid: false,
        message: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
      };
    }

    // Check for at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasLetter || !hasNumber) {
      return {
        valid: false,
        message: 'Password must contain both letters and numbers',
      };
    }

    return { valid: true, message: 'Password is valid' };
  }

  /**
   * Validate student number format
   * @param {String} studentNumber - Student number to validate
   * @returns {Boolean} True if valid
   */
  static isValidStudentNumber(studentNumber) {
    return VALIDATION.STUDENT_NUMBER_PATTERN.test(studentNumber);
  }

  /**
   * Validate subject code format
   * @param {String} subjectCode - Subject code to validate
   * @returns {Boolean} True if valid
   */
  static isValidSubjectCode(subjectCode) {
    return VALIDATION.SUBJECT_CODE_PATTERN.test(subjectCode);
  }

  /**
   * Validate name format (only letters, spaces, hyphens, apostrophes)
   * @param {String} name - Name to validate
   * @returns {Boolean} True if valid
   */
  static isValidName(name) {
    return VALIDATION.NAME_PATTERN.test(name);
  }

  /**
   * Validate MongoDB ObjectId format
   * @param {String} id - ID to validate
   * @returns {Boolean} True if valid ObjectId format
   */
  static isValidObjectId(id) {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Sanitize input string
   * @param {String} input - Input to sanitize
   * @returns {String} Sanitized input
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Validate pagination parameters
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @returns {Object} { page: Number, limit: Number }
   */
  static validatePagination(page, limit) {
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const validLimit = Math.min(
      Math.max(1, parseInt(limit, 10) || 10),
      100 // Max 100 items per page
    );

    return { page: validPage, limit: validLimit };
  }
}

module.exports = ValidationUtil;
