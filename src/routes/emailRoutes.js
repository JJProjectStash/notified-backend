/**
 * Email Routes
 * API routes for email operations
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { protect, restrictTo, validate, requireAdmin } = require('../middleware');

// Validation rules
const sendSingleEmailValidation = [
  body('to')
    .trim()
    .notEmpty()
    .withMessage('Recipient email is required')
    .isEmail()
    .withMessage('Invalid email address format')
    .normalizeEmail(),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Email subject is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Subject must be between 3 and 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Email message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array'),
];

const sendBulkEmailValidation = [
  body('recipients')
    .notEmpty()
    .withMessage('Recipients array is required')
    .isArray({ min: 1, max: 100 })
    .withMessage('Recipients must be an array with 1-100 emails'),
  body('recipients.*')
    .trim()
    .isEmail()
    .withMessage('All recipients must be valid email addresses')
    .normalizeEmail(),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Email subject is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Subject must be between 3 and 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Email message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array'),
];

const sendGuardianEmailValidation = [
  body('studentId')
    .trim()
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID format'),
  body('guardianEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid guardian email format')
    .normalizeEmail(),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Email subject is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Subject must be between 3 and 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Email message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters'),
];

const testEmailValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Test email address is required')
    .isEmail()
    .withMessage('Invalid email address format')
    .normalizeEmail(),
];

const sendHtmlValidation = [
  body('to').notEmpty().withMessage('Recipient(s) required'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Email subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject cannot exceed 200 characters'),
  body('html').notEmpty().withMessage('HTML content is required'),
  body('text').optional().isString(),
  body('attachments').optional().isArray(),
  body('tags').optional().isArray(),
];

const scheduleEmailValidation = [
  body('to').notEmpty().withMessage('Recipient(s) required'),
  body('subject').trim().notEmpty().withMessage('Email subject is required'),
  body('html').notEmpty().withMessage('HTML content is required'),
  body('scheduledAt')
    .notEmpty()
    .withMessage('Scheduled time is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('text').optional().isString(),
  body('attachments').optional().isArray(),
  body('tags').optional().isArray(),
];

const rescheduleValidation = [
  body('scheduledAt')
    .notEmpty()
    .withMessage('New scheduled time is required')
    .isISO8601()
    .withMessage('Invalid date format'),
];

const unsubscribeValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('reason').optional().isString(),
  body('token').optional().isString(),
];

// ==========================================
// Public Routes (no authentication required)
// ==========================================

/**
 * @route   POST /api/v1/emails/unsubscribes
 * @desc    Unsubscribe an email (public for unsubscribe links)
 * @access  Public
 */
router.post('/unsubscribes', unsubscribeValidation, validate, emailController.unsubscribe);

// All remaining routes require authentication
router.use(protect);

// ==========================================
// Authenticated Routes
// ==========================================

/**
 * @route   POST /api/v1/emails/send
 * @desc    Send single email
 * @access  Private
 */
router.post('/send', sendSingleEmailValidation, validate, emailController.sendSingleEmail);

/**
 * @route   POST /api/v1/emails/send-html
 * @desc    Send HTML email
 * @access  Private
 */
router.post('/send-html', sendHtmlValidation, validate, emailController.sendHtml);

/**
 * @route   POST /api/v1/emails/send-bulk
 * @desc    Send bulk emails
 * @access  Private (Admin/Staff/System Admin)
 */
router.post(
  '/send-bulk',
  restrictTo('admin', 'staff', 'system_admin'),
  sendBulkEmailValidation,
  validate,
  emailController.sendBulkEmail
);

/**
 * @route   POST /api/v1/emails/send-guardian
 * @desc    Send email to student's guardian
 * @access  Private
 */
router.post(
  '/send-guardian',
  sendGuardianEmailValidation,
  validate,
  emailController.sendGuardianEmail
);

/**
 * @route   POST /api/v1/emails/schedule
 * @desc    Schedule an email for future delivery
 * @access  Private
 */
router.post('/schedule', scheduleEmailValidation, validate, emailController.schedule);

/**
 * @route   GET /api/v1/emails/scheduled
 * @desc    Get scheduled emails
 * @access  Private
 */
router.get('/scheduled', emailController.getScheduled);

/**
 * @route   DELETE /api/v1/emails/scheduled/:emailId
 * @desc    Cancel a scheduled email
 * @access  Private
 */
router.delete(
  '/scheduled/:emailId',
  param('emailId').isMongoId().withMessage('Invalid email ID'),
  validate,
  emailController.cancelScheduled
);

/**
 * @route   PUT /api/v1/emails/scheduled/:emailId
 * @desc    Reschedule an email
 * @access  Private
 */
router.put(
  '/scheduled/:emailId',
  param('emailId').isMongoId().withMessage('Invalid email ID'),
  rescheduleValidation,
  validate,
  emailController.reschedule
);

/**
 * @route   GET /api/v1/emails/bounces
 * @desc    Get bounced emails list
 * @access  Private
 */
router.get('/bounces', emailController.getBounces);

/**
 * @route   GET /api/v1/emails/bounces/check/:email
 * @desc    Check if an email is bounced
 * @access  Private
 */
router.get('/bounces/check/:email', emailController.checkBounce);

/**
 * @route   DELETE /api/v1/emails/bounces/:email
 * @desc    Remove email from bounce list
 * @access  Private (Admin)
 */
router.delete('/bounces/:email', requireAdmin, emailController.removeBounce);

/**
 * @route   GET /api/v1/emails/unsubscribes
 * @desc    Get unsubscribed emails list
 * @access  Private
 */
router.get('/unsubscribes', emailController.getUnsubscribes);

/**
 * @route   GET /api/v1/emails/unsubscribes/check/:email
 * @desc    Check if an email is unsubscribed
 * @access  Private
 */
router.get('/unsubscribes/check/:email', emailController.checkUnsubscribe);

/**
 * @route   DELETE /api/v1/emails/unsubscribes/:email
 * @desc    Resubscribe an email
 * @access  Private (Admin)
 */
router.delete('/unsubscribes/:email', requireAdmin, emailController.resubscribe);

/**
 * @route   GET /api/v1/emails/stats
 * @desc    Get email statistics
 * @access  Private
 */
router.get('/stats', emailController.getStats);

/**
 * @route   GET /api/v1/emails/config
 * @desc    Check email configuration status
 * @access  Private (Admin/System Admin)
 */
router.get('/config', restrictTo('admin', 'system_admin'), emailController.getEmailConfig);

/**
 * @route   POST /api/v1/emails/test
 * @desc    Test email configuration
 * @access  Private (Admin/System Admin)
 */
router.post(
  '/test',
  restrictTo('admin', 'system_admin'),
  testEmailValidation,
  validate,
  emailController.testEmailConfig
);

/**
 * @route   GET /api/v1/emails/history
 * @desc    Get email history with pagination
 * @access  Private
 */
router.get('/history', emailController.getEmailHistory);

module.exports = router;
