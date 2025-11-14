/**
 * Attendance Routes
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect, requireAdmin, requireStaff, validate } = require('../middleware');
const attendanceController = require('../controllers/attendanceController');

/**
 * All routes require authentication
 */
router.use(protect);

// Validation rules
const markAttendanceValidation = [
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('subjectId')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isMongoId()
    .withMessage('Invalid subject ID'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Invalid status'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must not exceed 500 characters'),
];

const updateAttendanceValidation = [
  body('status')
    .optional()
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Invalid status'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must not exceed 500 characters'),
];

// Routes
router.get('/range', attendanceController.getAttendanceByDateRange);
router.get('/student/:studentId/summary', attendanceController.getAttendanceSummary);
router.get('/student/:studentId', attendanceController.getStudentAttendance);
router.get('/subject/:subjectId/today', attendanceController.getTodayAttendance);
router.get('/subject/:subjectId', attendanceController.getSubjectAttendance);
router.post(
  '/',
  requireStaff,
  markAttendanceValidation,
  validate,
  attendanceController.markAttendance
);
router.put(
  '/:id',
  requireStaff,
  updateAttendanceValidation,
  validate,
  attendanceController.updateAttendance
);
router.delete('/:id', requireAdmin, attendanceController.deleteAttendance);

module.exports = router;
