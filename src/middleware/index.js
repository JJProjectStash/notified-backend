/**
 * Middleware Index
 * Exports all middleware functions
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const { protect, optionalAuth } = require('./auth');
const {
  restrictTo,
  requireSuperAdmin,
  requireAdmin,
  requireStaff,
  hasRoleLevel,
  canModifyResource,
} = require('./rbac');
const { errorHandler, notFound, asyncHandler } = require('./errorHandler');
const { validate } = require('./validate');

module.exports = {
  // Authentication
  protect,
  optionalAuth,

  // Authorization
  restrictTo,
  requireSuperAdmin,
  requireAdmin,
  requireStaff,
  hasRoleLevel,
  canModifyResource,

  // Error Handling
  errorHandler,
  notFound,
  asyncHandler,

  // Validation
  validate,
};
