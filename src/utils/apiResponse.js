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
   * Supports two patterns:
   * 1. ApiResponse.success(res, data, message) - Old pattern
   * 2. res.json(ApiResponse.success(data, message)) - New pattern
   *
   * @param {Object} resOrData - Express response object OR data
   * @param {*} dataOrMessage - Response data OR message
   * @param {String} messageOrStatusCode - Success message OR status code
   * @param {Number} statusCode - HTTP status code
   */
  static success(resOrData, dataOrMessage, messageOrStatusCode, statusCode) {
    // Check if first argument is Express response object (has json method)
    if (resOrData && typeof resOrData.json === 'function') {
      // Old pattern: success(res, data, message, statusCode)
      const res = resOrData;
      const data = dataOrMessage;
      const message = messageOrStatusCode || 'Success';
      const code = statusCode || HTTP_STATUS.OK;

      return res.status(code).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
      });
    } else {
      // New pattern: success(data, message, statusCode) - returns object
      const data = resOrData;
      const message = dataOrMessage || 'Success';
      const code = messageOrStatusCode || HTTP_STATUS.OK;

      return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
      };
    }
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
   * Supports two patterns for backward compatibility
   *
   * @param {Object} resOrData - Express response object OR data array
   * @param {Array} dataOrPage - Array of items OR page number
   * @param {Number} pageOrLimit - Current page OR limit
   * @param {Number} limitOrTotal - Items per page OR total
   * @param {Number} totalOrMessage - Total number of items OR message
   * @param {String} messageOrStatusCode - Success message OR status code
   * @param {Number} statusCode - HTTP status code
   */
  static paginated(
    resOrData,
    dataOrPage,
    pageOrLimit,
    limitOrTotal,
    totalOrMessage,
    messageOrStatusCode,
    statusCode
  ) {
    // Check if first argument is Express response object
    if (resOrData && typeof resOrData.json === 'function') {
      // Old pattern: paginated(res, data, page, limit, total, message, statusCode)
      const res = resOrData;
      const data = dataOrPage;
      const page = pageOrLimit;
      const limit = limitOrTotal;
      const total = totalOrMessage;
      const message = messageOrStatusCode || 'Success';
      const code = statusCode || HTTP_STATUS.OK;
      const totalPages = Math.ceil(total / limit);

      return res.status(code).json({
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
    } else {
      // New pattern: paginated(data, page, limit, total, message, statusCode) - returns object
      const data = resOrData;
      const page = dataOrPage;
      const limit = pageOrLimit;
      const total = limitOrTotal;
      const message = totalOrMessage || 'Success';
      const code = messageOrStatusCode || HTTP_STATUS.OK;
      const totalPages = Math.ceil(total / limit);

      return {
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
      };
    }
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
