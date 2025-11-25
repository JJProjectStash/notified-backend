/**
 * Email Routes
 * API routes for email operations
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { protect, restrictTo, validate } = require('../middleware');

// All routes require authentication
router.use(protect);

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

/**
 * @route   POST /api/v1/emails/send
 * @desc    Send single email
 * @access  Private
 */
router.post('/send', sendSingleEmailValidation, validate, emailController.sendSingleEmail);

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
