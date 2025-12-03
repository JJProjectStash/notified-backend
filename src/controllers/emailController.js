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
const { ScheduledEmail, EmailBounce, Unsubscribe, Record } = require('../models');
const logger = require('../utils/logger');
const emailUtil = require('../utils/emailUtil');

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

/**
 * @route   POST /api/v1/emails/send-html
 * @desc    Send HTML email
 * @access  Private
 */
const sendHtml = asyncHandler(async (req, res) => {
  const { to, subject, html, text, attachments, tags } = req.body;

  // Validation
  if (!to || !subject || !html) {
    return ApiResponse.error(res, 'Recipient, subject, and HTML content are required', 400);
  }

  // Check unsubscribe and bounce lists
  const toArray = Array.isArray(to) ? to : [to];
  const validRecipients = [];

  for (const email of toArray) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check unsubscribe list
    const unsubscribed = await Unsubscribe.findOne({
      email: normalizedEmail,
      status: 'unsubscribed',
    });
    if (unsubscribed) {
      logger.info(`Skipping unsubscribed email: ${normalizedEmail}`);
      continue;
    }

    // Check hard bounce list
    const bounced = await EmailBounce.findOne({
      email: normalizedEmail,
      type: 'hard',
    });
    if (bounced) {
      logger.info(`Skipping hard-bounced email: ${normalizedEmail}`);
      continue;
    }

    validRecipients.push(normalizedEmail);
  }

  if (validRecipients.length === 0) {
    return ApiResponse.error(res, 'No valid recipients (all unsubscribed or bounced)', 400);
  }

  try {
    const result = await emailUtil.sendEmail({
      to: validRecipients,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      attachments,
    });

    // Log to records
    await Record.create({
      recordType: 'email_sent',
      recordData: `HTML email sent to ${validRecipients.length} recipient(s): ${subject}`,
      performedBy: req.user._id,
      metadata: {
        recipients: validRecipients,
        subject,
        tags,
        messageId: result.messageId,
      },
    });

    return res.json({
      success: true,
      data: {
        messageId: result.messageId,
        sentTo: validRecipients,
        skipped: toArray.length - validRecipients.length,
      },
      message: 'Email sent successfully',
    });
  } catch (error) {
    logger.error('Error sending HTML email:', error);

    // Track bounce if applicable
    if (error.message.includes('bounce') || error.message.includes('invalid')) {
      for (const email of validRecipients) {
        await EmailBounce.findOneAndUpdate(
          { email: email.toLowerCase() },
          {
            $set: { type: 'soft', reason: error.message, lastBounceAt: new Date() },
            $inc: { bounceCount: 1 },
          },
          { upsert: true }
        );
      }
    }

    return ApiResponse.error(res, error.message || 'Failed to send email', 500);
  }
});

/**
 * @route   POST /api/v1/emails/schedule
 * @desc    Schedule an email for future delivery
 * @access  Private
 */
const schedule = asyncHandler(async (req, res) => {
  const { to, subject, html, text, scheduledAt, attachments, tags } = req.body;

  // Validation
  if (!to || !subject || !html || !scheduledAt) {
    return ApiResponse.error(
      res,
      'Recipient, subject, HTML content, and scheduledAt are required',
      400
    );
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return ApiResponse.error(res, 'Invalid scheduledAt date format', 400);
  }

  if (scheduledDate <= new Date()) {
    return ApiResponse.error(res, 'Scheduled time must be in the future', 400);
  }

  const toArray = Array.isArray(to) ? to : [to];

  const scheduledEmail = await ScheduledEmail.create({
    to: toArray,
    subject,
    html,
    text,
    scheduledAt: scheduledDate,
    attachments,
    tags,
    createdBy: req.user._id,
  });

  return res.status(201).json({
    success: true,
    data: {
      id: scheduledEmail._id.toString(),
      to: scheduledEmail.to,
      subject: scheduledEmail.subject,
      scheduledAt: scheduledEmail.scheduledAt,
      status: scheduledEmail.status,
      createdAt: scheduledEmail.createdAt,
    },
    message: 'Email scheduled successfully',
  });
});

/**
 * @route   GET /api/v1/emails/scheduled
 * @desc    Get scheduled emails
 * @access  Private
 */
const getScheduled = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await ScheduledEmail.countDocuments(query);

  const emails = await ScheduledEmail.find(query)
    .populate('createdBy', 'name email')
    .sort({ scheduledAt: 1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .lean();

  return res.json({
    success: true,
    data: emails.map((e) => ({
      id: e._id.toString(),
      to: e.to,
      subject: e.subject,
      scheduledAt: e.scheduledAt,
      status: e.status,
      sentAt: e.sentAt,
      error: e.error,
      createdBy: e.createdBy?.name,
      createdAt: e.createdAt,
    })),
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  });
});

/**
 * @route   DELETE /api/v1/emails/scheduled/:emailId
 * @desc    Cancel a scheduled email
 * @access  Private
 */
const cancelScheduled = asyncHandler(async (req, res) => {
  const { emailId } = req.params;

  const email = await ScheduledEmail.findById(emailId);

  if (!email) {
    return ApiResponse.error(res, 'Scheduled email not found', 404);
  }

  if (email.status !== 'pending') {
    return ApiResponse.error(res, 'Can only cancel pending emails', 400);
  }

  email.status = 'cancelled';
  await email.save();

  return res.json({
    success: true,
    message: 'Scheduled email cancelled',
  });
});

/**
 * @route   PUT /api/v1/emails/scheduled/:emailId
 * @desc    Reschedule an email
 * @access  Private
 */
const reschedule = asyncHandler(async (req, res) => {
  const { emailId } = req.params;
  const { scheduledAt } = req.body;

  if (!scheduledAt) {
    return ApiResponse.error(res, 'New scheduledAt time is required', 400);
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return ApiResponse.error(res, 'Invalid scheduledAt date format', 400);
  }

  if (scheduledDate <= new Date()) {
    return ApiResponse.error(res, 'Scheduled time must be in the future', 400);
  }

  const email = await ScheduledEmail.findById(emailId);

  if (!email) {
    return ApiResponse.error(res, 'Scheduled email not found', 404);
  }

  if (email.status !== 'pending') {
    return ApiResponse.error(res, 'Can only reschedule pending emails', 400);
  }

  email.scheduledAt = scheduledDate;
  await email.save();

  return res.json({
    success: true,
    data: {
      id: email._id.toString(),
      scheduledAt: email.scheduledAt,
    },
    message: 'Email rescheduled successfully',
  });
});

/**
 * @route   GET /api/v1/emails/bounces
 * @desc    Get bounced emails list
 * @access  Private
 */
const getBounces = asyncHandler(async (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;

  const query = {};
  if (type) query.type = type;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await EmailBounce.countDocuments(query);

  const bounces = await EmailBounce.find(query)
    .sort({ lastBounceAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .lean();

  return res.json({
    success: true,
    data: bounces.map((b) => ({
      id: b._id.toString(),
      email: b.email,
      type: b.type,
      reason: b.reason,
      bounceCount: b.bounceCount,
      timestamp: b.lastBounceAt,
    })),
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  });
});

/**
 * @route   GET /api/v1/emails/bounces/check/:email
 * @desc    Check if an email is bounced
 * @access  Private
 */
const checkBounce = asyncHandler(async (req, res) => {
  const { email } = req.params;

  const bounce = await EmailBounce.findOne({ email: email.toLowerCase() });

  return res.json({
    success: true,
    data: {
      bounced: !!bounce,
      type: bounce?.type || null,
      bounceCount: bounce?.bounceCount || 0,
    },
  });
});

/**
 * @route   DELETE /api/v1/emails/bounces/:email
 * @desc    Remove email from bounce list
 * @access  Private (Admin)
 */
const removeBounce = asyncHandler(async (req, res) => {
  const { email } = req.params;

  const result = await EmailBounce.findOneAndDelete({ email: email.toLowerCase() });

  if (!result) {
    return ApiResponse.error(res, 'Email not found in bounce list', 404);
  }

  return res.json({
    success: true,
    message: 'Email removed from bounce list',
  });
});

/**
 * @route   GET /api/v1/emails/unsubscribes
 * @desc    Get unsubscribed emails list
 * @access  Private
 */
const getUnsubscribes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await Unsubscribe.countDocuments({ status: 'unsubscribed' });

  const unsubscribes = await Unsubscribe.find({ status: 'unsubscribed' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .lean();

  return res.json({
    success: true,
    data: unsubscribes.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      reason: u.reason,
      unsubscribedAt: u.createdAt,
    })),
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  });
});

/**
 * @route   GET /api/v1/emails/unsubscribes/check/:email
 * @desc    Check if an email is unsubscribed
 * @access  Private
 */
const checkUnsubscribe = asyncHandler(async (req, res) => {
  const { email } = req.params;

  const unsubscribed = await Unsubscribe.findOne({
    email: email.toLowerCase(),
    status: 'unsubscribed',
  });

  return res.json({
    success: true,
    data: {
      unsubscribed: !!unsubscribed,
    },
  });
});

/**
 * @route   POST /api/v1/emails/unsubscribes
 * @desc    Unsubscribe an email (public for unsubscribe links)
 * @access  Public
 */
const unsubscribe = asyncHandler(async (req, res) => {
  const { email, reason, token } = req.body;

  if (!email) {
    return ApiResponse.error(res, 'Email address is required', 400);
  }

  // Check if already unsubscribed
  const existing = await Unsubscribe.findOne({ email: email.toLowerCase() });

  if (existing && existing.status === 'unsubscribed') {
    return res.json({
      success: true,
      message: 'Email was already unsubscribed',
    });
  }

  if (existing) {
    existing.status = 'unsubscribed';
    existing.reason = reason;
    existing.resubscribedAt = null;
    await existing.save();
  } else {
    await Unsubscribe.create({
      email: email.toLowerCase(),
      reason,
    });
  }

  return res.json({
    success: true,
    message: 'Successfully unsubscribed',
  });
});

/**
 * @route   DELETE /api/v1/emails/unsubscribes/:email
 * @desc    Resubscribe an email
 * @access  Private (Admin)
 */
const resubscribe = asyncHandler(async (req, res) => {
  const { email } = req.params;

  const unsub = await Unsubscribe.findOne({ email: email.toLowerCase() });

  if (!unsub) {
    return ApiResponse.error(res, 'Email not found in unsubscribe list', 404);
  }

  unsub.status = 'resubscribed';
  unsub.resubscribedAt = new Date();
  await unsub.save();

  return res.json({
    success: true,
    message: 'Email resubscribed successfully',
  });
});

/**
 * @route   GET /api/v1/emails/stats
 * @desc    Get email statistics
 * @access  Private
 */
const getStats = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query;

  let startDate = new Date();
  switch (period) {
    case 'day':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  const [scheduled, bounces, unsubscribes] = await Promise.all([
    ScheduledEmail.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    EmailBounce.countDocuments({ createdAt: { $gte: startDate } }),
    Unsubscribe.countDocuments({ createdAt: { $gte: startDate }, status: 'unsubscribed' }),
  ]);

  const statusCounts = {};
  scheduled.forEach((s) => {
    statusCounts[s._id] = s.count;
  });

  const totalSent = (statusCounts.sent || 0) + (statusCounts.failed || 0);
  const delivered = statusCounts.sent || 0;
  const pending = statusCounts.pending || 0;

  return res.json({
    success: true,
    data: {
      totalSent,
      delivered,
      bounced: bounces,
      pending,
      unsubscribed: unsubscribes,
      bounceRate: totalSent > 0 ? Math.round((bounces / totalSent) * 100 * 10) / 10 : 0,
      deliveryRate: totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0,
    },
  });
});

module.exports = {
  sendSingleEmail,
  sendBulkEmail,
  sendGuardianEmail,
  getEmailConfig,
  testEmailConfig,
  getEmailHistory,
  // New enhanced email functions
  sendHtml,
  schedule,
  getScheduled,
  cancelScheduled,
  reschedule,
  getBounces,
  checkBounce,
  removeBounce,
  getUnsubscribes,
  checkUnsubscribe,
  unsubscribe,
  resubscribe,
  getStats,
};
