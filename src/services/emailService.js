/**
 * Email Service
 * Business logic for email operations
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const emailUtil = require('../utils/emailUtil');
const { Student, Record } = require('../models');
const { RECORD_TYPES, ERROR_MESSAGES } = require('../config/constants');
const logger = require('../utils/logger');
const ValidationUtil = require('../utils/validationUtil');

class EmailService {
  constructor() {
    // Rate limiting: Track email sends per user
    this.rateLimitMap = new Map();
    this.RATE_LIMIT_WINDOW = 60000; // 1 minute
    this.MAX_EMAILS_PER_MINUTE = 30; // Max 30 emails per minute per user
  }

  /**
   * Check rate limit for user
   * @private
   */
  _checkRateLimit(userId) {
    const now = Date.now();
    const userKey = userId.toString();

    if (!this.rateLimitMap.has(userKey)) {
      this.rateLimitMap.set(userKey, []);
    }

    const userSends = this.rateLimitMap.get(userKey);

    // Remove old entries outside the time window
    const recentSends = userSends.filter((timestamp) => now - timestamp < this.RATE_LIMIT_WINDOW);

    if (recentSends.length >= this.MAX_EMAILS_PER_MINUTE) {
      const oldestSend = Math.min(...recentSends);
      const timeToWait = Math.ceil((this.RATE_LIMIT_WINDOW - (now - oldestSend)) / 1000);
      throw new Error(
        `Rate limit exceeded. Please wait ${timeToWait} seconds before sending more emails.`
      );
    }

    // Add current send
    recentSends.push(now);
    this.rateLimitMap.set(userKey, recentSends);

    // Clean up old entries periodically
    if (Math.random() < 0.1) {
      // 10% chance
      this._cleanupRateLimitMap();
    }
  }

  /**
   * Clean up old rate limit entries
   * @private
   */
  _cleanupRateLimitMap() {
    const now = Date.now();
    for (const [userId, sends] of this.rateLimitMap.entries()) {
      const recentSends = sends.filter((timestamp) => now - timestamp < this.RATE_LIMIT_WINDOW);
      if (recentSends.length === 0) {
        this.rateLimitMap.delete(userId);
      } else {
        this.rateLimitMap.set(userId, recentSends);
      }
    }
  }

  /**
   * Send single email
   */
  async sendSingleEmail(emailData) {
    try {
      const { to, subject, message, attachments, userId } = emailData;

      // Check rate limit
      this._checkRateLimit(userId);

      // Send email
      const result = await emailUtil.sendEmail({
        to,
        subject,
        html: this.formatEmailContent(message),
        text: message,
        attachments,
      });

      // Create activity record
      await Record.create({
        recordType: RECORD_TYPES.EMAIL_SENT,
        recordData: `Email sent to ${to}: ${subject}`,
        performedBy: userId,
      });

      logger.info(`Email sent to ${to} by user ${userId} (MessageID: ${result.messageId})`);

      return {
        success: true,
        recipient: to,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error in sendSingleEmail:', error);
      throw new Error(error.message || 'Failed to send email');
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmail(emailData) {
    try {
      const { recipients, subject, message, attachments, userId } = emailData;

      // Check rate limit (bulk sends count as multiple sends)
      this._checkRateLimit(userId);

      const results = [];
      const errors = [];
      let successCount = 0;

      logger.info(`Starting bulk email send to ${recipients.length} recipients by user ${userId}`);

      // Send emails sequentially to avoid overwhelming the SMTP server
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        try {
          const result = await emailUtil.sendEmail({
            to: recipient,
            subject,
            html: this.formatEmailContent(message),
            text: message,
            attachments,
          });

          results.push({
            recipient,
            status: 'sent',
            messageId: result.messageId,
          });
          successCount++;

          logger.debug(`Bulk email ${i + 1}/${recipients.length} sent to ${recipient}`);

          // Small delay to prevent rate limiting (100ms between emails)
          if (i < recipients.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (error) {
          errors.push({
            recipient,
            error: error.message || 'Unknown error',
            timestamp: new Date().toISOString(),
          });
          logger.error(`Failed to send bulk email to ${recipient}:`, error);
        }
      }

      // Create activity record
      await Record.create({
        recordType: RECORD_TYPES.EMAIL_SENT,
        recordData: `Bulk email sent: ${subject} (${successCount}/${recipients.length} successful)`,
        performedBy: userId,
      });

      logger.info(
        `Bulk email completed: ${successCount}/${recipients.length} sent successfully by user ${userId}`
      );

      return {
        success: true,
        sentCount: successCount,
        failedCount: errors.length,
        totalRecipients: recipients.length,
        successRate: ((successCount / recipients.length) * 100).toFixed(1),
        results,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error in sendBulkEmail:', error);
      throw new Error(error.message || 'Failed to send bulk emails');
    }
  }

  /**
   * Send email to student's guardian
   */
  async sendGuardianEmail(emailData) {
    try {
      const { studentId, guardianEmail, subject, message, userId } = emailData;

      // Check rate limit
      this._checkRateLimit(userId);

      // Get student data
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
      }

      // Use provided guardian email or student's guardian email
      const recipientEmail = guardianEmail || student.guardianEmail;

      if (!recipientEmail) {
        throw new Error(`Guardian email not found for student ${student.studentNumber}`);
      }

      // Format message with student context
      const contextualMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Dear ${student.guardianName || 'Guardian'},</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4A90E2; margin: 20px 0;">
            <p style="margin: 0;"><strong>Regarding:</strong> ${student.firstName} ${student.lastName}</p>
            <p style="margin: 5px 0 0 0;"><strong>Student Number:</strong> ${student.studentNumber}</p>
            <p style="margin: 5px 0 0 0;"><strong>Section:</strong> ${student.section || 'N/A'}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
          ${this.formatEmailContent(message)}
          <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
          <p style="color: #666; font-size: 14px;">
            If you have any questions or concerns, please contact the school administration.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            <strong>Notified School Management System</strong><br>
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `;

      // Send email
      const result = await emailUtil.sendEmail({
        to: recipientEmail,
        subject: `[Notified] ${subject}`,
        html: contextualMessage,
        text: `Regarding: ${student.firstName} ${student.lastName} (${student.studentNumber})\n\n${message}`,
      });

      // Create activity record linked to student
      await Record.createStudentRecord(
        studentId,
        RECORD_TYPES.EMAIL_SENT,
        `Email sent to guardian (${recipientEmail}): ${subject}`,
        userId,
        {
          recipient: recipientEmail,
          guardianName: student.guardianName,
          subject,
          messageId: result.messageId,
        }
      );

      logger.info(
        `Guardian email sent for student ${student.studentNumber} to ${recipientEmail} (MessageID: ${result.messageId})`
      );

      return {
        success: true,
        recipient: recipientEmail,
        student: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          studentNumber: student.studentNumber,
          guardianName: student.guardianName,
        },
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error in sendGuardianEmail:', error);
      throw new Error(error.message || 'Failed to send guardian email');
    }
  }

  /**
   * Get email configuration status
   */
  async getEmailConfig() {
    try {
      const configured = !!(
        process.env.EMAIL_HOST &&
        process.env.EMAIL_PORT &&
        process.env.EMAIL_USERNAME &&
        process.env.EMAIL_PASSWORD
      );

      let connectionValid = false;
      if (configured) {
        connectionValid = await emailUtil.verifyConnection();
      }

      return {
        configured,
        connectionValid,
        provider: process.env.EMAIL_HOST || 'Not configured',
        from: process.env.EMAIL_FROM || 'Not configured',
      };
    } catch (error) {
      logger.error('Error in getEmailConfig:', error);
      return {
        configured: false,
        connectionValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfig(testEmail) {
    try {
      // Validate email
      if (!ValidationUtil.isValidEmail(testEmail)) {
        throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
      }

      // Send test email
      await emailUtil.sendEmail({
        to: testEmail,
        subject: 'Notified Email Configuration Test',
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email from the Notified system.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <hr>
          <p>Best regards,<br>Notified System</p>
        `,
        text: 'This is a test email from the Notified system.',
      });

      logger.info(`Test email sent to ${testEmail}`);

      return {
        success: true,
        message: 'Test email sent successfully',
        recipient: testEmail,
      };
    } catch (error) {
      logger.error('Error in testEmailConfig:', error);
      return {
        success: false,
        message: `Email test failed: ${error.message}`,
      };
    }
  }

  /**
   * Get email history (from records)
   */
  async getEmailHistory(userId, filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      const query = {
        recordType: RECORD_TYPES.EMAIL_SENT,
      };

      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      }

      const [emails, total] = await Promise.all([
        Record.find(query)
          .populate('performedBy', 'name email')
          .populate('student', 'studentNumber firstName lastName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Record.countDocuments(query),
      ]);

      return {
        emails,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Error in getEmailHistory:', error);
      throw error;
    }
  }

  /**
   * Format email content as HTML
   */
  formatEmailContent(message) {
    // Convert line breaks to HTML paragraphs
    const paragraphs = message
      .split('\n\n')
      .filter((p) => p.trim())
      .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${paragraphs}
        <br>
        <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <strong>Notified System</strong><br>
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;
  }
}

module.exports = new EmailService();
