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
  // Accept either `studentId` or `student` (legacy frontend); validate presence
  body().custom((_, { req }) => {
    if (!req.body.studentId && !req.body.student) {
      throw new Error('Student ID is required');
    }
    return true;
  }),
  // Accept either `subjectId` or `subject` (legacy frontend)
  body().custom((_, { req }) => {
    if (!req.body.subjectId && !req.body.subject && !req.body.subject_id) {
      throw new Error('Subject ID is required');
    }
    return true;
  }),
  // Date is optional; if provided it should be ISO8601. Controller will coerce common formats.
  body('date')
    .optional()
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

// Bulk mark validation
const bulkMarkValidation = [
  body('records')
    .isArray({ min: 1 })
    .withMessage('Records must be a non-empty array'),
  body('records.*.studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('records.*.subjectId')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isMongoId()
    .withMessage('Invalid subject ID'),
  body('records.*.status')
    .notEmpty()
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Invalid status'),
  body('records.*.date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
];

// Routes

// New frontend-required endpoints
router.post(
  '/mark',
  requireStaff,
  markAttendanceValidation,
  validate,
  attendanceController.markAttendance
);

router.post(
  '/bulk-mark',
  requireStaff,
  bulkMarkValidation,
  validate,
  attendanceController.bulkMarkAttendance
);

router.get('/records', attendanceController.getAttendanceRecords);

router.get('/summary/daily/:date', attendanceController.getDailySummary);

router.get('/summary/students', attendanceController.getStudentsSummary);

router.post(
  '/import/excel',
  requireStaff,
  attendanceController.importFromExcel
);

router.get('/export/excel', attendanceController.exportToExcel);

// Existing routes
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
