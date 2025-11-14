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
const ValidationUtil = require('../utils/validationUtil');

/**
 * @route   POST /api/v1/emails/send
 * @desc    Send single email
 * @access  Private
 */
const sendSingleEmail = asyncHandler(async (req, res) => {
  const { to, subject, message, attachments } = req.body;

  // Validation
  if (!to || !subject || !message) {
    return ApiResponse.error(res, 'Email recipient, subject, and message are required', 400);
  }

  // Validate email format
  if (!ValidationUtil.isValidEmail(to.trim())) {
    return ApiResponse.error(res, 'Invalid email address format', 400);
  }

  // Validate subject length
  if (subject.trim().length < 3 || subject.trim().length > 200) {
    return ApiResponse.error(res, 'Subject must be between 3 and 200 characters', 400);
  }

  // Validate message length
  if (message.trim().length < 10 || message.trim().length > 5000) {
    return ApiResponse.error(res, 'Message must be between 10 and 5000 characters', 400);
  }

  // Sanitize inputs
  const sanitizedData = {
    to: ValidationUtil.sanitizeInput(to.trim()),
    subject: ValidationUtil.sanitizeInput(subject.trim()),
    message: ValidationUtil.sanitizeInput(message.trim()),
    attachments: attachments || [],
    userId: req.user._id,
  };

  const result = await emailService.sendSingleEmail(sanitizedData);

  return res.json(ApiResponse.success(result, SUCCESS_MESSAGES.EMAIL_SENT));
});

/**
 * @route   POST /api/v1/emails/send-bulk
 * @desc    Send bulk emails
 * @access  Private (Admin/Staff)
 */
const sendBulkEmail = asyncHandler(async (req, res) => {
  const { recipients, subject, message, attachments } = req.body;

  // Validation
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return ApiResponse.error(
      res,
      'Recipients array is required and must contain at least one email',
      400
    );
  }

  // Limit bulk email size for safety
  if (recipients.length > 100) {
    return ApiResponse.error(res, 'Cannot send to more than 100 recipients at once', 400);
  }

  if (!subject || !message) {
    return ApiResponse.error(res, 'Subject and message are required', 400);
  }

  // Validate subject and message length
  if (subject.trim().length < 3 || subject.trim().length > 200) {
    return ApiResponse.error(res, 'Subject must be between 3 and 200 characters', 400);
  }

  if (message.trim().length < 10 || message.trim().length > 5000) {
    return ApiResponse.error(res, 'Message must be between 10 and 5000 characters', 400);
  }

  // Validate all emails
  const invalidEmails = recipients.filter((email) => !ValidationUtil.isValidEmail(email.trim()));
  if (invalidEmails.length > 0) {
    return ApiResponse.error(res, `Invalid email addresses: ${invalidEmails.join(', ')}`, 400);
  }

  // Sanitize inputs
  const sanitizedData = {
    recipients: recipients.map((email) => ValidationUtil.sanitizeInput(email.trim())),
    subject: ValidationUtil.sanitizeInput(subject.trim()),
    message: ValidationUtil.sanitizeInput(message.trim()),
    attachments: attachments || [],
    userId: req.user._id,
  };

  const result = await emailService.sendBulkEmail(sanitizedData);

  return res.json(
    ApiResponse.success(
      result,
      `Emails sent to ${result.sentCount} of ${recipients.length} recipients`
    )
  );
});

/**
 * @route   POST /api/v1/emails/send-guardian
 * @desc    Send email to student's guardian
 * @access  Private
 */
const sendGuardianEmail = asyncHandler(async (req, res) => {
  const { studentId, guardianEmail, subject, message } = req.body;

  // Validation
  if (!studentId) {
    return ApiResponse.error(res, 'Student ID is required', 400);
  }

  // Validate MongoDB ObjectId format
  if (!ValidationUtil.isValidObjectId(studentId)) {
    return ApiResponse.error(res, 'Invalid student ID format', 400);
  }

  if (!subject || !message) {
    return ApiResponse.error(res, 'Subject and message are required', 400);
  }

  // Validate optional guardian email if provided
  if (guardianEmail && !ValidationUtil.isValidEmail(guardianEmail.trim())) {
    return ApiResponse.error(res, 'Invalid guardian email format', 400);
  }

  // Validate subject and message length
  if (subject.trim().length < 3 || subject.trim().length > 200) {
    return ApiResponse.error(res, 'Subject must be between 3 and 200 characters', 400);
  }

  if (message.trim().length < 10 || message.trim().length > 5000) {
    return ApiResponse.error(res, 'Message must be between 10 and 5000 characters', 400);
  }

  // Sanitize inputs
  const sanitizedData = {
    studentId,
    guardianEmail: guardianEmail ? ValidationUtil.sanitizeInput(guardianEmail.trim()) : undefined,
    subject: ValidationUtil.sanitizeInput(subject.trim()),
    message: ValidationUtil.sanitizeInput(message.trim()),
    userId: req.user._id,
  };

  const result = await emailService.sendGuardianEmail(sanitizedData);

  return res.json(ApiResponse.success(result, SUCCESS_MESSAGES.EMAIL_SENT));
});

/**
 * @route   GET /api/v1/emails/config
 * @desc    Check email configuration status
 * @access  Private (Admin)
 */
const getEmailConfig = asyncHandler(async (req, res) => {
  const config = await emailService.getEmailConfig();
  return res.json(ApiResponse.success(config, 'Email configuration retrieved'));
});

/**
 * @route   POST /api/v1/emails/test
 * @desc    Test email configuration
 * @access  Private (Admin)
 */
const testEmailConfig = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validation
  if (!email) {
    return ApiResponse.error(res, 'Email address is required for testing', 400);
  }

  if (!ValidationUtil.isValidEmail(email.trim())) {
    return ApiResponse.error(res, 'Invalid email address format', 400);
  }

  const result = await emailService.testEmailConfig(email.trim());

  if (result.success) {
    return res.json(ApiResponse.success(result, 'Test email sent successfully'));
  } else {
    return ApiResponse.error(res, result.message || 'Failed to send test email', 500);
  }
});

/**
 * @route   GET /api/v1/emails/history
 * @desc    Get email history with pagination
 * @access  Private
 */
const getEmailHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, startDate, endDate } = req.query;

  // Validate pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    return ApiResponse.error(res, 'Invalid page number', 400);
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return ApiResponse.error(res, 'Limit must be between 1 and 100', 400);
  }

  const filters = {};
  if (startDate && endDate) {
    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return ApiResponse.error(res, 'Invalid date format', 400);
    }

    if (start > end) {
      return ApiResponse.error(res, 'Start date must be before end date', 400);
    }

    filters.startDate = startDate;
    filters.endDate = endDate;
  }

  const result = await emailService.getEmailHistory(req.user._id, filters, {
    page: pageNum,
    limit: limitNum,
  });

  return res.json(
    ApiResponse.paginated(
      result.emails,
      result.page,
      result.limit,
      result.total,
      'Email history retrieved successfully'
    )
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
