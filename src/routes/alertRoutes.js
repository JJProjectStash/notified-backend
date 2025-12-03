/**
 * Alert Routes
 * API routes for attendance alerts and smart triggers
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { protect, restrictTo, validate, requireAdmin } = require('../middleware');

// All routes require authentication
router.use(protect);

// Validation rules
const acknowledgeMultipleValidation = [
  body('alertIds').isArray({ min: 1 }).withMessage('Alert IDs must be a non-empty array'),
  body('alertIds.*').isMongoId().withMessage('Invalid alert ID format'),
];

const updateConfigValidation = [
  body('consecutiveAbsenceThreshold')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Threshold must be between 1 and 30'),
  body('lowAttendanceThreshold')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Threshold must be between 0 and 100'),
  body('enableConsecutiveAlerts').optional().isBoolean().withMessage('Must be a boolean'),
  body('enableLowAttendanceAlerts').optional().isBoolean().withMessage('Must be a boolean'),
  body('enablePatternAlerts').optional().isBoolean().withMessage('Must be a boolean'),
  body('autoSendEmail').optional().isBoolean().withMessage('Must be a boolean'),
  body('emailRecipients').optional().isArray().withMessage('Must be an array'),
  body('emailRecipients.*')
    .optional()
    .isIn(['guardian', 'student', 'admin'])
    .withMessage('Invalid recipient type'),
];

const notifyValidation = [
  body('recipients').optional().isArray().withMessage('Recipients must be an array'),
  body('recipients.*')
    .optional()
    .isIn(['guardian', 'student', 'admin'])
    .withMessage('Invalid recipient type'),
];

/**
 * @route   GET /api/v1/alerts
 * @desc    Get alerts with optional filters
 * @access  Private
 */
router.get('/', alertController.getAlerts);

/**
 * @route   GET /api/v1/alerts/summary
 * @desc    Get alert summary statistics
 * @access  Private
 */
router.get('/summary', alertController.getSummary);

/**
 * @route   GET /api/v1/alerts/consecutive-absences
 * @desc    Get students with consecutive absences
 * @access  Private
 */
router.get('/consecutive-absences', alertController.getConsecutiveAbsences);

/**
 * @route   GET /api/v1/alerts/low-attendance
 * @desc    Get students with low attendance rate
 * @access  Private
 */
router.get('/low-attendance', alertController.getLowAttendance);

/**
 * @route   GET /api/v1/alerts/config
 * @desc    Get alert configuration
 * @access  Private
 */
router.get('/config', alertController.getConfig);

/**
 * @route   PUT /api/v1/alerts/config
 * @desc    Update alert configuration
 * @access  Private (Admin)
 */
router.put('/config', requireAdmin, updateConfigValidation, validate, alertController.updateConfig);

/**
 * @route   POST /api/v1/alerts/scan
 * @desc    Manually trigger alert generation
 * @access  Private (Admin)
 */
router.post('/scan', requireAdmin, alertController.runScan);

/**
 * @route   PUT /api/v1/alerts/acknowledge-multiple
 * @desc    Acknowledge multiple alerts
 * @access  Private
 */
router.put(
  '/acknowledge-multiple',
  acknowledgeMultipleValidation,
  validate,
  alertController.acknowledgeMultiple
);

/**
 * @route   PUT /api/v1/alerts/:alertId/acknowledge
 * @desc    Acknowledge an alert
 * @access  Private
 */
router.put(
  '/:alertId/acknowledge',
  param('alertId').isMongoId().withMessage('Invalid alert ID'),
  validate,
  alertController.acknowledge
);

/**
 * @route   POST /api/v1/alerts/:alertId/notify
 * @desc    Send notification email for an alert
 * @access  Private
 */
router.post(
  '/:alertId/notify',
  param('alertId').isMongoId().withMessage('Invalid alert ID'),
  notifyValidation,
  validate,
  alertController.sendNotification
);

/**
 * @route   DELETE /api/v1/alerts/:alertId
 * @desc    Dismiss/delete an alert
 * @access  Private
 */
router.delete(
  '/:alertId',
  param('alertId').isMongoId().withMessage('Invalid alert ID'),
  validate,
  alertController.dismiss
);

module.exports = router;
