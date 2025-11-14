/**
 * Email Routes
 * API routes for email operations
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/v1/emails/send
 * @desc    Send single email
 * @access  Private
 */
router.post('/send', emailController.sendSingleEmail);

/**
 * @route   POST /api/v1/emails/send-bulk
 * @desc    Send bulk emails
 * @access  Private (Admin/Staff)
 */
router.post('/send-bulk', authorize('admin', 'staff'), emailController.sendBulkEmail);

/**
 * @route   POST /api/v1/emails/send-guardian
 * @desc    Send email to student's guardian
 * @access  Private
 */
router.post('/send-guardian', emailController.sendGuardianEmail);

/**
 * @route   GET /api/v1/emails/config
 * @desc    Check email configuration status
 * @access  Private (Admin)
 */
router.get('/config', authorize('admin'), emailController.getEmailConfig);

/**
 * @route   POST /api/v1/emails/test
 * @desc    Test email configuration
 * @access  Private (Admin)
 */
router.post('/test', authorize('admin'), emailController.testEmailConfig);

/**
 * @route   GET /api/v1/emails/history
 * @desc    Get email history
 * @access  Private
 */
router.get('/history', emailController.getEmailHistory);

module.exports = router;
