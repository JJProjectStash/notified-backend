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
  /**
   * Send single email
   */
  async sendSingleEmail(emailData) {
    try {
      const { to, subject, message, userId } = emailData;

      // Validate email
      if (!ValidationUtil.isValidEmail(to)) {
        throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
      }

      // Send email
      const result = await emailUtil.sendEmail({
        to,
        subject,
        html: this.formatEmailContent(message),
        text: message,
      });

      // Create activity record
      await Record.create({
        recordType: RECORD_TYPES.EMAIL_SENT,
        description: `Email sent to ${to}: ${subject}`,
        performedBy: userId,
        metadata: {
          recipient: to,
          subject,
        },
      });

      logger.info(`Email sent to ${to} by user ${userId}`);

      return {
        success: true,
        recipient: to,
        messageId: result.messageId,
      };
    } catch (error) {
      logger.error('Error in sendSingleEmail:', error);
      throw error;
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmail(emailData) {
    try {
      const { recipients, subject, message, userId } = emailData;

      const results = [];
      const errors = [];

      // Send emails sequentially to avoid overwhelming the SMTP server
      for (const recipient of recipients) {
        try {
          // Validate email
          if (!ValidationUtil.isValidEmail(recipient)) {
            errors.push({ recipient, error: 'Invalid email format' });
            continue;
          }

          await emailUtil.sendEmail({
            to: recipient,
            subject,
            html: this.formatEmailContent(message),
            text: message,
          });

          results.push({ recipient, status: 'sent' });

          // Small delay to prevent rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          errors.push({ recipient, error: error.message });
          logger.error(`Failed to send email to ${recipient}:`, error);
        }
      }

      // Create activity record
      await Record.create({
        recordType: RECORD_TYPES.EMAIL_SENT,
        description: `Bulk email sent to ${results.length} recipients: ${subject}`,
        performedBy: userId,
        metadata: {
          sentCount: results.length,
          failedCount: errors.length,
          subject,
        },
      });

      logger.info(
        `Bulk email sent to ${results.length}/${recipients.length} recipients by user ${userId}`
      );

      return {
        success: true,
        sentCount: results.length,
        failedCount: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error('Error in sendBulkEmail:', error);
      throw error;
    }
  }

  /**
   * Send email to student's guardian
   */
  async sendGuardianEmail(emailData) {
    try {
      const { studentId, guardianEmail, subject, message, userId } = emailData;

      // Get student data
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
      }

      // Use provided guardian email or student's guardian email
      const recipientEmail = guardianEmail || student.guardianEmail;

      if (!recipientEmail) {
        throw new Error('Guardian email not found for this student');
      }

      // Validate email
      if (!ValidationUtil.isValidEmail(recipientEmail)) {
        throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
      }

      // Format message with student context
      const contextualMessage = `
        <p>Dear ${student.guardianName || 'Guardian'},</p>
        <p>Regarding: <strong>${student.firstName} ${student.lastName}</strong> (${student.studentNumber})</p>
        <hr>
        ${this.formatEmailContent(message)}
        <hr>
        <p>If you have any questions, please contact the school administration.</p>
      `;

      // Send email
      const result = await emailUtil.sendEmail({
        to: recipientEmail,
        subject,
        html: contextualMessage,
        text: message,
      });

      // Create activity record
      await Record.createStudentRecord(
        studentId,
        RECORD_TYPES.EMAIL_SENT,
        `Email sent to guardian (${recipientEmail}): ${subject}`,
        userId
      );

      logger.info(`Guardian email sent for student ${student.studentNumber}`);

      return {
        success: true,
        recipient: recipientEmail,
        student: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          studentNumber: student.studentNumber,
        },
        messageId: result.messageId,
      };
    } catch (error) {
      logger.error('Error in sendGuardianEmail:', error);
      throw error;
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
