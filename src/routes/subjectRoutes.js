/**
 * Subject Routes
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect, requireAdmin, requireStaff, validate } = require('../middleware');
const subjectController = require('../controllers/subjectController');

/**
 * Subject Routes
 * All routes require authentication
 */

// Validation rules
const createSubjectValidation = [
  body('subjectCode')
    .trim()
    .notEmpty()
    .withMessage('Subject code is required')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Subject code must contain only uppercase letters, numbers, and hyphens')
    .isLength({ min: 2, max: 20 })
    .withMessage('Subject code must be between 2 and 20 characters'),
  body('subjectName')
    .trim()
    .notEmpty()
    .withMessage('Subject name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Subject name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('yearLevel')
    .notEmpty()
    .withMessage('Year level is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Year level must be between 1 and 12'),
  body('section')
    .trim()
    .notEmpty()
    .withMessage('Section is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Section must be between 1 and 50 characters'),
];

const updateSubjectValidation = [
  body('subjectCode')
    .optional()
    .trim()
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Subject code must contain only uppercase letters, numbers, and hyphens')
    .isLength({ min: 2, max: 20 })
    .withMessage('Subject code must be between 2 and 20 characters'),
  body('subjectName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Subject name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('yearLevel')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Year level must be between 1 and 12'),
  body('section')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Section must be between 1 and 50 characters'),
];

// Routes
router.get('/search', protect, subjectController.searchSubjects);
router.get(
  '/year/:yearLevel/section/:section',
  protect,
  subjectController.getSubjectsByYearAndSection
);
router.get('/code/:subjectCode', protect, subjectController.getSubjectByCode);
router.get('/:id/enrollments', protect, subjectController.getSubjectEnrollments);
router.get('/:id', protect, subjectController.getSubjectById);
router.get('/', protect, subjectController.getAllSubjects);
router.post(
  '/',
  protect,
  requireStaff,
  createSubjectValidation,
  validate,
  subjectController.createSubject
);
router.put(
  '/:id',
  protect,
  requireStaff,
  updateSubjectValidation,
  validate,
  subjectController.updateSubject
);
router.delete('/:id', protect, requireAdmin, subjectController.deleteSubject);

module.exports = router;
