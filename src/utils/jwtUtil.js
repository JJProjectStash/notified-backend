/**
 * JWT Utility
 * Functions for generating and verifying JWT tokens
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');

class JWTUtil {
  /**
   * Generate access token
   * @param {Object} payload - Token payload
   * @returns {String} JWT token
   */
  static generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }

  /**
   * Generate refresh token
   * @param {Object} payload - Token payload
   * @returns {String} Refresh token
   */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    });
  }

  /**
   * Verify access token
   * @param {String} token - JWT token
   * @returns {Object} Decoded payload
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   * @param {String} token - Refresh token
   * @returns {Object} Decoded payload
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Decode token without verifying
   * @param {String} token - JWT token
   * @returns {Object} Decoded payload
   */
  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTUtil;
