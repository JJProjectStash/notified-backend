const userService = require('../services/userService');
const { ApiResponse } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * Get all users
 * @route GET /api/v1/users
 * @access Private (Admin)
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role, isActive, page, limit } = req.query;

  const filters = {};
  if (role) filters.role = role;
  if (isActive !== undefined) filters.isActive = isActive === 'true';

  const result = await userService.getAllUsers(filters, { page, limit });

  res.json(
    ApiResponse.paginated(result.users, result.pagination, SUCCESS_MESSAGES.USERS_RETRIEVED)
  );
});

/**
 * Get user by ID
 * @route GET /api/v1/users/:id
 * @access Private (Admin)
 */
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json(ApiResponse.success(user, SUCCESS_MESSAGES.USER_RETRIEVED));
});

/**
 * Create new user
 * @route POST /api/v1/users
 * @access Private (Admin)
 */
exports.createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body, req.user.id);
  res.status(201).json(ApiResponse.created(user, SUCCESS_MESSAGES.USER_CREATED));
});

/**
 * Update user
 * @route PUT /api/v1/users/:id
 * @access Private (Admin)
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user.id);
  res.json(ApiResponse.success(user, SUCCESS_MESSAGES.USER_UPDATED));
});

/**
 * Delete user
 * @route DELETE /api/v1/users/:id
 * @access Private (Admin)
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user.id);
  res.json(ApiResponse.success(null, SUCCESS_MESSAGES.USER_DELETED));
});

/**
 * Toggle user status
 * @route PATCH /api/v1/users/:id/toggle-status
 * @access Private (Admin)
 */
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.toggleUserStatus(req.params.id, req.user.id);
  res.json(ApiResponse.success(user, 'User status updated successfully'));
});

/**
 * Search users
 * @route GET /api/v1/users/search
 * @access Private (Admin)
 */
exports.searchUsers = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;

  if (!q) {
    return res.status(400).json(ApiResponse.error('Search query is required'));
  }

  const result = await userService.searchUsers(q, { page, limit });

  res.json(
    ApiResponse.paginated(result.users, result.pagination, SUCCESS_MESSAGES.USERS_RETRIEVED)
  );
});

/**
 * Get user statistics
 * @route GET /api/v1/users/stats
 * @access Private (Admin)
 */
exports.getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStats();
  res.json(ApiResponse.success(stats, 'User statistics retrieved successfully'));
});
