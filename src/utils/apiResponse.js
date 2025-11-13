/**
 * API Response Utility
 * Standardized response format for all API endpoints
 * 
 * @author Notified Development Team
 * @version 1.0.0
 */

const { HTTP_STATUS } = require('../config/constants');

class ApiResponse {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {String} message - Success message
   * @param {Number} statusCode - HTTP status code
   */
  static success(res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code
   * @param {*} errors - Validation errors or additional error details
   */
  static error(res, message = 'Error', statusCode = HTTP_STATUS.BAD_REQUEST, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Array of items
   * @param {Number} page - Current page
   * @param {Number} limit - Items per page
   * @param {Number} total - Total number of items
   * @param {String} message - Success message
   */
  static paginated(
    res,
    data,
    page,
    limit,
    total,
    message = 'Success',
    statusCode = HTTP_STATUS.OK
  ) {
    const totalPages = Math.ceil(total / limit);

    return res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send created response
   * @param {Object} res - Express response object
   * @param {*} data - Created resource data
   * @param {String} message - Success message
   */
  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }

  /**
   * Send no content response
   * @param {Object} res - Express response object
   */
  static noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }

  /**
   * Send unauthorized response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  /**
   * Send forbidden response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN);
  }

  /**
   * Send not found response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND);
  }

  /**
   * Send conflict response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static conflict(res, message = 'Resource already exists') {
    return this.error(res, message, HTTP_STATUS.CONFLICT);
  }

  /**
   * Send validation error response
   * @param {Object} res - Express response object
   * @param {*} errors - Validation errors
   */
  static validationError(res, errors) {
    return this.error(res, 'Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
  }

  /**
   * Send internal server error response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static serverError(res, message = 'Internal server error') {
    return this.error(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

module.exports = ApiResponse;
