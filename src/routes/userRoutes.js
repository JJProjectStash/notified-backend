/**
 * User Routes (Admin Management)
 * 
 * @author Notified Development Team
 * @version 1.0.0
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const userController = require('../controllers/userController');

/**
 * All routes require authentication and admin privileges
 */
router.use(protect);
router.use(requireAdmin);

// Validation rules
const createUserValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  body('role')
    .optional()
    .isIn(['superadmin', 'admin', 'staff'])
    .withMessage('Invalid role'),
];

const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['superadmin', 'admin', 'staff'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

// Routes (order matters - specific routes before parameterized ones)
router.get('/stats', userController.getUserStats);
router.get('/search', userController.searchUsers);
router.get('/:id', userController.getUserById);
router.get('/', userController.getAllUsers);
router.post('/', createUserValidation, validate, userController.createUser);
router.put('/:id', updateUserValidation, validate, userController.updateUser);
router.patch('/:id/toggle-status', userController.toggleUserStatus);
router.delete('/:id', userController.deleteUser);

module.exports = router;
