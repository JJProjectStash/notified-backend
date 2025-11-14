/**
 * Email Controller
 * Handles HTTP requests for email operations
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const emailService = require('../services/emailService');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * @route   POST /api/v1/emails/send
 * @desc    Send single email
 * @access  Private
 */
const sendSingleEmail = asyncHandler(async (req, res) => {
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return ApiResponse.error(res, 'Email recipient, subject, and message are required', 400);
  }

  const result = await emailService.sendSingleEmail({
    to,
    subject,
    message,
    userId: req.user._id,
  });

  ApiResponse.success(res, result, SUCCESS_MESSAGES.EMAIL_SENT);
});

/**
 * @route   POST /api/v1/emails/send-bulk
 * @desc    Send bulk emails
 * @access  Private (Admin/Staff)
 */
const sendBulkEmail = asyncHandler(async (req, res) => {
  const { recipients, subject, message } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return ApiResponse.error(res, 'Recipients array is required', 400);
  }

  if (!subject || !message) {
    return ApiResponse.error(res, 'Subject and message are required', 400);
  }

  const result = await emailService.sendBulkEmail({
    recipients,
    subject,
    message,
    userId: req.user._id,
  });

  ApiResponse.success(res, result, `Emails sent to ${result.sentCount} recipients`);
});

/**
 * @route   POST /api/v1/emails/send-guardian
 * @desc    Send email to student's guardian
 * @access  Private
 */
const sendGuardianEmail = asyncHandler(async (req, res) => {
  const { studentId, guardianEmail, subject, message } = req.body;

  if (!studentId) {
    return ApiResponse.error(res, 'Student ID is required', 400);
  }

  if (!subject || !message) {
    return ApiResponse.error(res, 'Subject and message are required', 400);
  }

  const result = await emailService.sendGuardianEmail({
    studentId,
    guardianEmail,
    subject,
    message,
    userId: req.user._id,
  });

  ApiResponse.success(res, result, SUCCESS_MESSAGES.EMAIL_SENT);
});

/**
 * @route   GET /api/v1/emails/config
 * @desc    Check email configuration status
 * @access  Private (Admin)
 */
const getEmailConfig = asyncHandler(async (req, res) => {
  const config = await emailService.getEmailConfig();
  ApiResponse.success(res, config, 'Email configuration retrieved');
});

/**
 * @route   POST /api/v1/emails/test
 * @desc    Test email configuration
 * @access  Private (Admin)
 */
const testEmailConfig = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return ApiResponse.error(res, 'Email address is required', 400);
  }

  const result = await emailService.testEmailConfig(email);

  if (result.success) {
    ApiResponse.success(res, result, 'Test email sent successfully');
  } else {
    ApiResponse.error(res, result.message, 500);
  }
});

/**
 * @route   GET /api/v1/emails/history
 * @desc    Get email history
 * @access  Private
 */
const getEmailHistory = asyncHandler(async (req, res) => {
  const { page, limit, startDate, endDate } = req.query;

  const filters = {};
  if (startDate && endDate) {
    filters.startDate = startDate;
    filters.endDate = endDate;
  }

  const result = await emailService.getEmailHistory(req.user._id, filters, { page, limit });

  ApiResponse.paginated(
    res,
    result.emails,
    result.page,
    result.limit,
    result.total,
    'Email history retrieved successfully'
  );
});

module.exports = {
  sendSingleEmail,
  sendBulkEmail,
  sendGuardianEmail,
  getEmailConfig,
  testEmailConfig,
  getEmailHistory,
};
