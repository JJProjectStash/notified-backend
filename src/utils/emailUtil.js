/**
 * Email Utility
 * Functions for sending emails using Nodemailer
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailUtil {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Send email
   * @param {Object} options - Email options { to, subject, text, html }
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Notified <noreply@notified.com>',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Email send error: ${error.message}`);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send welcome email to new user
   * @param {String} email - Recipient email
   * @param {String} name - Recipient name
   * @returns {Promise<Object>} Send result
   */
  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to Notified';
    const html = `
      <h1>Welcome to Notified, ${name}!</h1>
      <p>Thank you for joining our student attendance and notification system.</p>
      <p>You can now log in and start managing your students and attendance records.</p>
      <br>
      <p>Best regards,<br>The Notified Team</p>
    `;

    return await this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send attendance notification to guardian
   * @param {String} guardianEmail - Guardian's email
   * @param {Object} studentData - Student information
   * @param {Object} attendanceData - Attendance information
   * @returns {Promise<Object>} Send result
   */
  async sendAttendanceNotification(guardianEmail, studentData, attendanceData) {
    const subject = `Attendance Alert for ${studentData.firstName} ${studentData.lastName}`;
    const html = `
      <h2>Attendance Notification</h2>
      <p>Dear Guardian,</p>
      <p>This is to inform you about the attendance status of your ward:</p>
      <ul>
        <li><strong>Student:</strong> ${studentData.firstName} ${studentData.lastName} (${studentData.studentNumber})</li>
        <li><strong>Date:</strong> ${new Date(attendanceData.date).toLocaleDateString()}</li>
        <li><strong>Status:</strong> ${attendanceData.status.toUpperCase()}</li>
        ${attendanceData.subject ? `<li><strong>Subject:</strong> ${attendanceData.subject}</li>` : ''}
        ${attendanceData.remarks ? `<li><strong>Remarks:</strong> ${attendanceData.remarks}</li>` : ''}
      </ul>
      <p>If you have any questions, please contact the school administration.</p>
      <br>
      <p>Best regards,<br>Notified System</p>
    `;

    return await this.sendEmail({ to: guardianEmail, subject, html });
  }

  /**
   * Send password reset email
   * @param {String} email - Recipient email
   * @param {String} resetToken - Password reset token
   * @returns {Promise<Object>} Send result
   */
  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <br>
      <p>Best regards,<br>The Notified Team</p>
    `;

    return await this.sendEmail({ to: email, subject, html });
  }

  /**
   * Verify email configuration
   * @returns {Promise<Boolean>} True if configuration is valid
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email transporter verified successfully');
      return true;
    } catch (error) {
      logger.error(`Email configuration error: ${error.message}`);
      return false;
    }
  }
}

module.exports = new EmailUtil();
