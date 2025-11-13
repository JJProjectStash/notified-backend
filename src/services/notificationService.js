const { Notification, User } = require('../models');
const { ERROR_MESSAGES, NOTIFICATION_TYPES } = require('../config/constants');
const { ValidationUtil } = require('../utils/validationUtil');
const logger = require('../utils/logger');

/**
 * Notification Service
 * Handles business logic for notification management
 */
class NotificationService {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(notificationData) {
    try {
      const { recipient, student, type, title, message, priority, metadata } = notificationData;

      // Validate recipient exists
      const user = await User.findById(recipient);
      if (!user) {
        const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      const notification = await Notification.createNotification({
        recipient,
        student,
        type,
        title,
        message,
        priority: priority || 'medium',
        metadata,
      });

      logger.info(`Notification created for user ${recipient}`);

      return notification.toObject();
    } catch (error) {
      logger.error('Error in createNotification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   * @param {String} userId - User ID
   * @param {Object} filters - Filters (isRead, type, priority)
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Notifications with pagination
   */
  async getNotifications(userId, filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      const query = { recipient: userId };

      if (filters.isRead !== undefined) query.isRead = filters.isRead === 'true';
      if (filters.type) query.type = filters.type;
      if (filters.priority) query.priority = filters.priority;

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
          .populate('student', 'studentNumber firstName lastName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(query),
        Notification.countDocuments({ recipient: userId, isRead: false }),
      ]);

      return {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in getNotifications:', error);
      throw error;
    }
  }

  /**
   * Get notification by ID
   * @param {String} id - Notification ID
   * @param {String} userId - User ID (for authorization check)
   * @returns {Promise<Object>} Notification details
   */
  async getNotificationById(id, userId) {
    try {
      const notification = await Notification.findById(id)
        .populate('student', 'studentNumber firstName lastName')
        .populate('recipient', 'name email')
        .lean();

      if (!notification) {
        const error = new Error(ERROR_MESSAGES.NOTIFICATION_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Check if user is authorized to view this notification
      if (notification.recipient._id.toString() !== userId) {
        const error = new Error(ERROR_MESSAGES.UNAUTHORIZED);
        error.statusCode = 403;
        throw error;
      }

      return notification;
    } catch (error) {
      logger.error('Error in getNotificationById:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {String} id - Notification ID
   * @param {String} userId - User ID (for authorization check)
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(id, userId) {
    try {
      const notification = await Notification.findById(id);

      if (!notification) {
        const error = new Error(ERROR_MESSAGES.NOTIFICATION_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Check if user is authorized to update this notification
      if (notification.recipient.toString() !== userId) {
        const error = new Error(ERROR_MESSAGES.UNAUTHORIZED);
        error.statusCode = 403;
        throw error;
      }

      await Notification.markAsRead(id);

      logger.info(`Notification ${id} marked as read by user ${userId}`);

      const updatedNotification = await Notification.findById(id)
        .populate('student', 'studentNumber firstName lastName')
        .lean();

      return updatedNotification;
    } catch (error) {
      logger.error('Error in markAsRead:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.markAllAsRead(userId);

      logger.info(`All notifications marked as read for user ${userId}`);

      return {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} notification(s) marked as read`,
      };
    } catch (error) {
      logger.error('Error in markAllAsRead:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {String} id - Notification ID
   * @param {String} userId - User ID (for authorization check)
   * @returns {Promise<void>}
   */
  async deleteNotification(id, userId) {
    try {
      const notification = await Notification.findById(id);

      if (!notification) {
        const error = new Error(ERROR_MESSAGES.NOTIFICATION_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Check if user is authorized to delete this notification
      if (notification.recipient.toString() !== userId) {
        const error = new Error(ERROR_MESSAGES.UNAUTHORIZED);
        error.statusCode = 403;
        throw error;
      }

      await notification.deleteOne();

      logger.info(`Notification ${id} deleted by user ${userId}`);
    } catch (error) {
      logger.error('Error in deleteNotification:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Unread count
   */
  async getUnreadCount(userId) {
    try {
      const unreadNotifications = await Notification.getUnreadNotifications(userId);

      return {
        count: unreadNotifications.length,
        notifications: unreadNotifications.slice(0, 5), // Return only first 5 for preview
      };
    } catch (error) {
      logger.error('Error in getUnreadCount:', error);
      throw error;
    }
  }

  /**
   * Delete all read notifications for a user
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteReadNotifications(userId) {
    try {
      const result = await Notification.deleteMany({
        recipient: userId,
        isRead: true,
      });

      logger.info(`${result.deletedCount} read notifications deleted for user ${userId}`);

      return {
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} read notification(s) deleted`,
      };
    } catch (error) {
      logger.error('Error in deleteReadNotifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Notification statistics
   */
  async getNotificationStats(userId) {
    try {
      const [total, unread, byType, byPriority] = await Promise.all([
        Notification.countDocuments({ recipient: userId }),
        Notification.countDocuments({ recipient: userId, isRead: false }),
        Notification.aggregate([
          { $match: { recipient: userId } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        Notification.aggregate([
          { $match: { recipient: userId, isRead: false } },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
      ]);

      return {
        total,
        unread,
        read: total - unread,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      };
    } catch (error) {
      logger.error('Error in getNotificationStats:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
