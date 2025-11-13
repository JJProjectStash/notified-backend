/**
 * Error Handling Middleware
 * Centralized error handler for the application
 * 
 * @author Notified Development Team
 * @version 1.0.0
 */

const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');

/**
 * Handle Mongoose CastError (invalid ObjectId)
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return { message, statusCode: HTTP_STATUS.BAD_REQUEST };
};

/**
 * Handle Mongoose Duplicate Key Error
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists`;
  return { message, statusCode: HTTP_STATUS.CONFLICT };
};

/**
 * Handle Mongoose Validation Error
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failed: ${errors.join('. ')}`;
  return { message, statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY, errors };
};

/**
 * Handle JWT Error
 */
const handleJWTError = () => {
  return { message: ERROR_MESSAGES.TOKEN_INVALID, statusCode: HTTP_STATUS.UNAUTHORIZED };
};

/**
 * Handle JWT Expired Error
 */
const handleJWTExpiredError = () => {
  return { message: ERROR_MESSAGES.TOKEN_EXPIRED, statusCode: HTTP_STATUS.UNAUTHORIZED };
};

/**
 * Send error in development environment
 */
const sendErrorDev = (err, res) => {
  return res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send error in production environment
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Programming or unknown error: don't leak error details
  logger.error('ERROR 💥', err);
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: ERROR_MESSAGES.INTERNAL_ERROR,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  err.message = err.message || ERROR_MESSAGES.INTERNAL_ERROR;

  // Log error
  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method}`);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };

    // Handle specific error types
    if (err.name === 'CastError') {
      const castErrorResult = handleCastError(err);
      error.message = castErrorResult.message;
      error.statusCode = castErrorResult.statusCode;
    }

    if (err.code === 11000) {
      const duplicateResult = handleDuplicateKeyError(err);
      error.message = duplicateResult.message;
      error.statusCode = duplicateResult.statusCode;
    }

    if (err.name === 'ValidationError') {
      const validationResult = handleValidationError(err);
      error.message = validationResult.message;
      error.statusCode = validationResult.statusCode;
      error.errors = validationResult.errors;
    }

    if (err.name === 'JsonWebTokenError') {
      const jwtResult = handleJWTError();
      error.message = jwtResult.message;
      error.statusCode = jwtResult.statusCode;
    }

    if (err.name === 'TokenExpiredError') {
      const jwtExpiredResult = handleJWTExpiredError();
      error.message = jwtExpiredResult.message;
      error.statusCode = jwtExpiredResult.statusCode;
    }

    sendErrorProd(error, res);
  }
};

/**
 * Handle 404 - Not Found
 */
const notFound = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  logger.warn(message);
  return ApiResponse.notFound(res, message);
};

/**
 * Async error handler wrapper
 * Catches errors in async route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
};
