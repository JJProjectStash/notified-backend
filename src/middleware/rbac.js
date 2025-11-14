/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const ApiResponse = require('../utils/apiResponse');
const { ROLES, ERROR_MESSAGES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Restrict access to specific roles
 * @param  {...String} roles - Allowed roles
 * @returns {Function} Middleware function
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Superadmin has access to everything
    if (req.user.role === ROLES.SUPERADMIN) {
      return next();
    }

    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      logger.warn(
        `User ${req.user.email} (${req.user.role}) attempted to access ${req.path} - Forbidden`
      );
      return ApiResponse.forbidden(res, 'You do not have permission to perform this action');
    }

    next();
  };
};

/**
 * Require superadmin role
 */
const requireSuperAdmin = restrictTo(ROLES.SUPERADMIN);

/**
 * Require admin or higher role
 */
const requireAdmin = restrictTo(ROLES.SUPERADMIN, ROLES.ADMIN);

/**
 * Require staff or higher role (any authenticated user)
 */
const requireStaff = restrictTo(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.STAFF);

/**
 * Check if user has at least the specified role level
 * @param {String} requiredRole - Required role level
 * @returns {Function} Middleware function
 */
const hasRoleLevel = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!req.user.hasRoleLevel(requiredRole)) {
      return ApiResponse.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Check if user can modify resource (owner or admin)
 * @param {String} resourceUserIdField - Field name containing resource owner's user ID
 * @returns {Function} Middleware function
 */
const canModifyResource = (resourceUserIdField = 'createdBy') => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Superadmin and Admin can modify any resource
    if (req.user.hasRoleLevel(ROLES.ADMIN)) {
      return next();
    }

    // Check if user owns the resource
    const resource = req.resource; // Resource should be attached by previous middleware
    if (resource && resource[resourceUserIdField]) {
      if (resource[resourceUserIdField].toString() === req.user._id.toString()) {
        return next();
      }
    }

    return ApiResponse.forbidden(res, 'You can only modify your own resources');
  };
};

module.exports = {
  restrictTo,
  requireSuperAdmin,
  requireAdmin,
  requireStaff,
  hasRoleLevel,
  canModifyResource,
};
