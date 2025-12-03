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
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize or reinitialize the email transporter
   */
  initializeTransporter() {
    const isProduction = process.env.NODE_ENV === 'production';
    const emailPort = parseInt(process.env.EMAIL_PORT, 10) || 587;

    // Determine secure setting based on port
    // Port 465 uses implicit TLS (secure: true)
    // Port 587 uses STARTTLS (secure: false, but upgrades via tls options)
    const useSecure = emailPort === 465;

    const transportConfig = {
      host: process.env.EMAIL_HOST,
      port: emailPort,
      secure: useSecure,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Connection timeout settings for production reliability
      connectionTimeout: 30000, // 30 seconds to establish connection
      greetingTimeout: 30000, // 30 seconds for SMTP greeting
      socketTimeout: 60000, // 60 seconds for socket inactivity
      // Connection pool settings
      pool: isProduction, // Enable pooling in production
      maxConnections: isProduction ? 5 : 1, // Max concurrent connections
      maxMessages: isProduction ? 100 : 10, // Max messages per connection
      rateDelta: 1000, // Time window for rate limiting
      rateLimit: isProduction ? 10 : 5, // Max emails per rateDelta
      // TLS settings for production
      tls: {
        // Allow self-signed certificates in development
        rejectUnauthorized: isProduction,
        // Use modern TLS
        minVersion: 'TLSv1.2',
      },
      // Debug logging in development
      debug: !isProduction,
      logger: !isProduction,
    };

    this.transporter = nodemailer.createTransport(transportConfig);

    logger.info(
      `Email transporter initialized (${isProduction ? 'production' : 'development'} mode, port ${emailPort})`
    );
  }

  /**
   * Send email with retry logic
   * @param {Object} options - Email options { to, subject, text, html }
   * @param {Number} retries - Number of retry attempts
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(options, retries = 3) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Notified <noreply@notified.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        logger.info(`Email sent successfully to ${options.to} (attempt ${attempt})`);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        lastError = error;
        logger.warn(`Email send attempt ${attempt}/${retries} failed: ${error.message}`);

        // If it's a connection error and we have retries left, try reinitializing
        if (attempt < retries && this.isConnectionError(error)) {
          logger.info('Reinitializing email transporter...');
          this.initializeTransporter();
          // Wait before retry with exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        } else if (attempt < retries) {
          // Simple delay for other errors
          await this.delay(1000 * attempt);
        }
      }
    }

    logger.error(`Email send error after ${retries} attempts: ${lastError.message}`);
    throw new Error(`Failed to send email: ${lastError.message}`);
  }

  /**
   * Check if error is a connection-related error
   * @param {Error} error - The error to check
   * @returns {boolean} True if connection error
   */
  isConnectionError(error) {
    const connectionErrors = [
      'ECONNECTION',
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'ESOCKET',
      'Connection timeout',
      'ENOTFOUND',
    ];
    return connectionErrors.some(
      (errType) => error.message.includes(errType) || error.code === errType
    );
  }

  /**
   * Delay helper for retry logic
   * @param {Number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
