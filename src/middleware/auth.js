/**
 * Authentication Middleware
 * Protects routes and verifies JWT tokens
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const JWTUtil = require('../utils/jwtUtil');
const ApiResponse = require('../utils/apiResponse');
const { User } = require('../models');
const logger = require('../utils/logger');
const { ERROR_MESSAGES } = require('../config/constants');

/**
 * Protect route - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Verify token
    let decoded;
    try {
      decoded = JWTUtil.verifyAccessToken(token);
    } catch (error) {
      if (error.message.includes('expired')) {
        return ApiResponse.unauthorized(res, ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.TOKEN_INVALID);
    }

    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!user) {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Check if user is active
    if (!user.isActive) {
      return ApiResponse.unauthorized(res, 'Your account has been deactivated');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return ApiResponse.serverError(res, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Optional authentication - doesn't require token but attaches user if present
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = JWTUtil.verifyAccessToken(token);
        const user = await User.findById(decoded.id).select('-password -refreshToken');
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid or expired, continue without user
        logger.debug(`Optional auth: Invalid token - ${error.message}`);
      }
    }

    next();
  } catch (error) {
    logger.error(`Optional authentication error: ${error.message}`);
    next();
  }
};

module.exports = {
  protect,
  optionalAuth,
};
