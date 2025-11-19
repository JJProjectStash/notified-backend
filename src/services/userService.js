const { User, Record } = require('../models');
const { ROLES, RECORD_TYPES, ERROR_MESSAGES } = require('../config/constants');
const ValidationUtil = require('../utils/validationUtil');
const { EmailUtil } = require('../utils/emailUtil');
const logger = require('../utils/logger');

/**
 * User Management Service
 * Handles business logic for user management (Admin operations)
 */
class UserService {
  /**
   * Get all users with pagination and filters
   * @param {Object} filters - Filter options (role, isActive)
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Paginated users
   */
  async getAllUsers(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      if (filters.role) query.role = filters.role;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-refreshToken') // Exclude refresh token
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {String} id - User ID
   * @returns {Promise<Object>} User details
   */
  async getUserById(id) {
    try {
      const user = await User.findById(id).select('-refreshToken').lean();

      if (!user) {
        const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      return user;
    } catch (error) {
      logger.error('Error in getUserById:', error);
      throw error;
    }
  }

  /**
   * Create new user (Admin operation)
   * @param {Object} userData - User data
   * @param {String} adminId - Admin user ID creating the user
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData, adminId) {
    try {
      const { name, email, password, role } = userData;

      // Validate email format
      if (!ValidationUtil.isValidEmail(email)) {
        const error = new Error(ERROR_MESSAGES.INVALID_EMAIL);
        error.statusCode = 400;
        throw error;
      }

      // Validate password strength
      const passwordValidation = ValidationUtil.validatePassword(password);
      if (!passwordValidation.isValid) {
        const error = new Error(passwordValidation.message);
        error.statusCode = 400;
        throw error;
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        const error = new Error(ERROR_MESSAGES.USER_EXISTS);
        error.statusCode = 409;
        throw error;
      }

      // Validate role
      if (role && !Object.values(ROLES).includes(role)) {
        const error = new Error('Invalid role');
        error.statusCode = 400;
        throw error;
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role: role || ROLES.STAFF, // Default to staff
      });

      // Create activity record
      await Record.create({
        recordType: RECORD_TYPES.STUDENT_ADDED, // Reusing as generic user activity
        recordData: `User ${user.name} (${user.email}) created with role ${user.role}`,
        performedBy: adminId,
      });

      // Send welcome email
      try {
        await EmailUtil.sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
        // Don't throw - email failure shouldn't fail user creation
      }

      logger.info(`User created: ${user.email} by admin ${adminId}`);

      // Return user without password
      const userObject = user.toObject();
      delete userObject.password;
      delete userObject.refreshToken;

      return userObject;
    } catch (error) {
      logger.error('Error in createUser:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {String} id - User ID
   * @param {Object} updateData - Data to update
   * @param {String} adminId - Admin user ID performing update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(id, updateData, adminId) {
    try {
      const user = await User.findById(id);

      if (!user) {
        const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Prevent updating password through this method
      if (updateData.password) {
        delete updateData.password;
      }

      // If updating email, check uniqueness
      if (updateData.email && updateData.email !== user.email) {
        if (!ValidationUtil.isValidEmail(updateData.email)) {
          const error = new Error(ERROR_MESSAGES.INVALID_EMAIL);
          error.statusCode = 400;
          throw error;
        }

        const existingUser = await User.findOne({
          email: updateData.email,
          _id: { $ne: id },
        });

        if (existingUser) {
          const error = new Error(ERROR_MESSAGES.USER_EXISTS);
          error.statusCode = 409;
          throw error;
        }
      }

      // Validate role if being updated
      if (updateData.role && !Object.values(ROLES).includes(updateData.role)) {
        const error = new Error('Invalid role');
        error.statusCode = 400;
        throw error;
      }

      // Update user
      Object.assign(user, updateData);
      await user.save();

      // Create activity record
      await Record.create({
        recordType: RECORD_TYPES.STUDENT_UPDATED,
        recordData: `User ${user.name} updated`,
        performedBy: adminId,
      });

      logger.info(`User updated: ${user.email} by admin ${adminId}`);

      const userObject = user.toObject();
      delete userObject.password;
      delete userObject.refreshToken;

      return userObject;
    } catch (error) {
      logger.error('Error in updateUser:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   * @param {String} id - User ID
   * @param {String} adminId - Admin user ID performing deletion
   * @returns {Promise<Object>} Deleted user
   */
  async deleteUser(id, adminId) {
    try {
      const user = await User.findById(id);

      if (!user) {
        const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Prevent self-deletion
      if (id === adminId) {
        const error = new Error('Cannot delete your own account');
        error.statusCode = 400;
        throw error;
      }

      // Prevent deleting superadmin
      if (user.role === ROLES.SUPERADMIN) {
        const error = new Error('Cannot delete superadmin account');
        error.statusCode = 403;
        throw error;
      }

      // Soft delete
      user.isActive = false;
      await user.save();

      // Create activity record
      await Record.create({
        recordType: RECORD_TYPES.STUDENT_DELETED,
        recordData: `User ${user.name} (${user.email}) deleted`,
        performedBy: adminId,
      });

      logger.info(`User deleted: ${user.email} by admin ${adminId}`);

      const userObject = user.toObject();
      delete userObject.password;
      delete userObject.refreshToken;

      return userObject;
    } catch (error) {
      logger.error('Error in deleteUser:', error);
      throw error;
    }
  }

  /**
   * Toggle user active status
   * @param {String} id - User ID
   * @param {String} adminId - Admin user ID performing action
   * @returns {Promise<Object>} Updated user
   */
  async toggleUserStatus(id, adminId) {
    try {
      const user = await User.findById(id);

      if (!user) {
        const error = new Error(ERROR_MESSAGES.USER_NOT_FOUND);
        error.statusCode = 404;
        throw error;
      }

      // Prevent self-action
      if (id === adminId) {
        const error = new Error('Cannot modify your own status');
        error.statusCode = 400;
        throw error;
      }

      // Prevent modifying superadmin
      if (user.role === ROLES.SUPERADMIN) {
        const error = new Error('Cannot modify superadmin status');
        error.statusCode = 403;
        throw error;
      }

      user.isActive = !user.isActive;
      await user.save();

      // Create activity record
      await Record.create({
        recordType: RECORD_TYPES.STUDENT_UPDATED,
        recordData: `User ${user.name} status changed to ${user.isActive ? 'active' : 'inactive'}`,
        performedBy: adminId,
      });

      logger.info(`User status toggled: ${user.email} by admin ${adminId}`);

      const userObject = user.toObject();
      delete userObject.password;
      delete userObject.refreshToken;

      return userObject;
    } catch (error) {
      logger.error('Error in toggleUserStatus:', error);
      throw error;
    }
  }

  /**
   * Search users
   * @param {String} searchTerm - Search term
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Search results
   */
  async searchUsers(searchTerm, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = ValidationUtil.validatePagination(pagination);
      const skip = (page - 1) * limit;

      const searchRegex = new RegExp(searchTerm, 'i');
      const query = {
        $or: [{ name: searchRegex }, { email: searchRegex }],
      };

      const [users, total] = await Promise.all([
        User.find(query).select('-refreshToken').sort({ name: 1 }).skip(skip).limit(limit).lean(),
        User.countDocuments(query),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error in searchUsers:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    try {
      const [total, active, byRole] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);

      return {
        total,
        active,
        inactive: total - active,
        byRole: byRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      };
    } catch (error) {
      logger.error('Error in getUserStats:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
