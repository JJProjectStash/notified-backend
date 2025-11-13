/**
 * Notification Routes
 * 
 * @author Notified Development Team
 * @version 1.0.0
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireStaff } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const notificationController = require('../controllers/notificationController');

/**
 * All routes require authentication
 */
router.use(protect);

// Validation rules
const createNotificationValidation = [
  body('recipient')
    .notEmpty()
    .withMessage('Recipient is required')
    .isMongoId()
    .withMessage('Invalid recipient ID'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['attendance_alert', 'grade_update', 'announcement', 'reminder', 'system'])
    .withMessage('Invalid notification type'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('student')
    .optional()
    .isMongoId()
    .withMessage('Invalid student ID'),
];

// Routes
router.get('/stats', notificationController.getNotificationStats);
router.get('/unread/count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/read', notificationController.deleteReadNotifications);
router.get('/:id', notificationController.getNotificationById);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.get('/', notificationController.getNotifications);
router.post('/', requireStaff, createNotificationValidation, validate, notificationController.createNotification);

module.exports = router;
