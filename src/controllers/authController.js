/**
 * Authentication Controller
 * Handles HTTP requests for authentication
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const authService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  ApiResponse.created(
    res,
    {
      user: result.user,
      accessToken: result.tokens.accessToken,
    },
    SUCCESS_MESSAGES.USER_CREATED
  );
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  ApiResponse.success(
    res,
    {
      user: result.user,
      accessToken: result.tokens.accessToken,
    },
    SUCCESS_MESSAGES.LOGIN_SUCCESS
  );
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  ApiResponse.success(res, null, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
});

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const tokens = await authService.refreshToken(refreshToken);

  // Update refresh token cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  ApiResponse.success(res, { accessToken: tokens.accessToken }, 'Token refreshed successfully');
});

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  ApiResponse.success(res, user, 'Profile retrieved successfully');
});

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  ApiResponse.success(res, user, 'Profile updated successfully');
});

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, currentPassword, newPassword);
  ApiResponse.success(res, null, 'Password changed successfully');
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
};
