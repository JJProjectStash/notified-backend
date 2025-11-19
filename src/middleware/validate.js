/**
 * Request Validation Middleware
 * Express-validator based validation middleware
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Validate request and return errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
      value: err.value,
    }));

    // Log validation failure for debugging
    try {
      const logger = require('../utils/logger');
      logger.warn(`Validation failed for ${req.originalUrl}: ${JSON.stringify(extractedErrors)}`);
      logger.debug(`Request body: ${JSON.stringify(req.body)}`);
    } catch (logErr) {
      // ignore logging errors
    }
    return ApiResponse.validationError(res, extractedErrors);
  }

  next();
};

module.exports = { validate };
