/**
 * Authentication Service
 * Business logic for user authentication
 * 
 * @author Notified Development Team
 * @version 1.0.0
 */

const { User } = require('../models');
const JWTUtil = require('../utils/jwtUtil');
const ValidationUtil = require('../utils/validationUtil');
const EmailUtil = require('../utils/emailUtil');
const logger = require('../utils/logger');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, ROLES } = require('../config/constants');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user and tokens
   */
  async register(userData) {
    const { name, email, password, role } = userData;

    // Validate email
    if (!ValidationUtil.isValidEmail(email)) {
      throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
    }

    // Validate password
    const passwordValidation = ValidationUtil.validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error(ERROR_MESSAGES.USER_EXISTS);
    }

    // Create user
    const user = await User.create({
      name: ValidationUtil.sanitizeInput(name),
      email: email.toLowerCase(),
      password,
      role: role || ROLES.STAFF,
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Send welcome email (non-blocking)
    EmailUtil.sendWelcomeEmail(user.email, user.name).catch((err) => {
      logger.error(`Failed to send welcome email: ${err.message}`);
    });

    logger.info(`New user registered: ${user.email}`);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Login user
   * @param {String} email - User email
   * @param {String} password - User password
   * @returns {Promise<Object>} User and tokens
   */
  async login(email, password) {
    // Validate inputs
    if (!email || !password) {
      throw new Error(ERROR_MESSAGES.REQUIRED_FIELDS);
    }

    // Find user and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Your account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
      tokens,
    };
  }

  /**
   * Logout user
   * @param {String} userId - User ID
   * @returns {Promise<void>}
   */
  async logout(userId) {
    await User.findByIdAndUpdate(userId, {
      refreshToken: null,
    });

    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Refresh access token
   * @param {String} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = JWTUtil.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }

    // Find user and verify refresh token
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    logger.info(`Tokens refreshed for user: ${user.email}`);

    return tokens;
  }

  /**
   * Get current user profile
   * @param {String} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, updateData) {
    const { name, email } = updateData;

    const user = await User.findById(userId);

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Update fields
    if (name) user.name = ValidationUtil.sanitizeInput(name);
    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new Error(ERROR_MESSAGES.USER_EXISTS);
      }
      user.email = email.toLowerCase();
    }

    await user.save();

    logger.info(`User profile updated: ${user.email}`);

    return user;
  }

  /**
   * Change user password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    const passwordValidation = ValidationUtil.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
  }

  /**
   * Generate JWT tokens
   * @param {Object} user - User object
   * @returns {Object} Access and refresh tokens
   * @private
   */
  generateTokens(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = JWTUtil.generateAccessToken(payload);
    const refreshToken = JWTUtil.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();
