const notificationService = require('../services/notificationService');
const { ApiResponse } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * Create notification
 * @route POST /api/v1/notifications
 * @access Private (Admin/Staff)
 */
exports.createNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.createNotification(req.body);
  res.status(201).json(ApiResponse.created(notification, SUCCESS_MESSAGES.NOTIFICATION_CREATED));
});

/**
 * Get all notifications for current user
 * @route GET /api/v1/notifications
 * @access Private
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const { isRead, type, priority, page, limit } = req.query;

  const filters = {};
  if (isRead !== undefined) filters.isRead = isRead;
  if (type) filters.type = type;
  if (priority) filters.priority = priority;

  const result = await notificationService.getNotifications(req.user.id, filters, { page, limit });

  res.json(
    ApiResponse.paginated(
      result.notifications,
      result.pagination,
      SUCCESS_MESSAGES.NOTIFICATIONS_RETRIEVED
    )
  );
});

/**
 * Get notification by ID
 * @route GET /api/v1/notifications/:id
 * @access Private
 */
exports.getNotificationById = asyncHandler(async (req, res) => {
  const notification = await notificationService.getNotificationById(req.params.id, req.user.id);
  res.json(ApiResponse.success(notification, SUCCESS_MESSAGES.NOTIFICATION_RETRIEVED));
});

/**
 * Mark notification as read
 * @route PUT /api/v1/notifications/:id/read
 * @access Private
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  res.json(ApiResponse.success(notification, SUCCESS_MESSAGES.NOTIFICATION_UPDATED));
});

/**
 * Mark all notifications as read
 * @route PUT /api/v1/notifications/read-all
 * @access Private
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);
  res.json(ApiResponse.success(result, 'All notifications marked as read'));
});

/**
 * Delete notification
 * @route DELETE /api/v1/notifications/:id
 * @access Private
 */
exports.deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user.id);
  res.json(ApiResponse.success(null, SUCCESS_MESSAGES.NOTIFICATION_DELETED));
});

/**
 * Get unread notification count
 * @route GET /api/v1/notifications/unread/count
 * @access Private
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);
  res.json(ApiResponse.success(result, 'Unread count retrieved successfully'));
});

/**
 * Delete all read notifications
 * @route DELETE /api/v1/notifications/read
 * @access Private
 */
exports.deleteReadNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteReadNotifications(req.user.id);
  res.json(ApiResponse.success(result, 'Read notifications deleted successfully'));
});

/**
 * Get notification statistics
 * @route GET /api/v1/notifications/stats
 * @access Private
 */
exports.getNotificationStats = asyncHandler(async (req, res) => {
  const stats = await notificationService.getNotificationStats(req.user.id);
  res.json(ApiResponse.success(stats, 'Notification statistics retrieved successfully'));
});
