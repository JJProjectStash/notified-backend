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
const subjectAttendanceController = require('../controllers/subjectAttendanceController');

/**
 * All routes require authentication
 */
router.use(protect);

// Validation rules
const markAttendanceValidation = [
  // Ensure student ID is present (supports legacy `student`/`student_id`) and validate format
  body().custom((_, { req }) => {
    const sid = req.body.studentId || req.body.student || req.body.student_id;
    if (!sid) {
      throw new Error('Student ID is required');
    }
    return true;
  }),
  // Validate that any provided subject identifiers are valid Mongo IDs (subject is optional)
  body('subjectId').optional().isMongoId().withMessage('Invalid subject ID'),
  body('subject').optional().isMongoId().withMessage('Invalid subject ID'),
  body('subject_id').optional().isMongoId().withMessage('Invalid subject ID'),
  // Also validate student id format when provided in any of the accepted keys
  body('studentId').optional().isMongoId().withMessage('Invalid student ID'),
  body('student').optional().isMongoId().withMessage('Invalid student ID'),
  body('student_id').optional().isMongoId().withMessage('Invalid student ID'),
  // Date is optional; if provided it should be ISO8601. Controller will coerce common formats.
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Invalid status'),
  body('timeSlot').optional().isIn(['arrival', 'departure']).withMessage('Invalid time slot'),
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
  body('timeSlot').optional().isIn(['arrival', 'departure']).withMessage('Invalid time slot'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must not exceed 500 characters'),
];

// Bulk mark validation
const bulkMarkValidation = [
  body('records').isArray({ min: 1 }).withMessage('Records must be a non-empty array'),
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
  body('records.*.date').optional().isISO8601().withMessage('Invalid date format'),
];

// Subject-specific attendance validation
const markSubjectAttendanceValidation = [
  body('subjectId')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isMongoId()
    .withMessage('Invalid subject ID'),
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Invalid status'),
  body('timeSlot').optional().isIn(['arrival', 'departure']).withMessage('Invalid time slot'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must not exceed 500 characters'),
];

const bulkMarkSubjectAttendanceValidation = [
  body('subjectId')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isMongoId()
    .withMessage('Invalid subject ID'),
  body('attendanceData')
    .isArray({ min: 1 })
    .withMessage('attendanceData must be a non-empty array'),
  body('attendanceData.*.studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('attendanceData.*.status')
    .notEmpty()
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Invalid status'),
  body('attendanceData.*.date').optional().isISO8601().withMessage('Invalid date format'),
];

// Subject-specific attendance routes
router.post(
  '/subject/mark',
  requireStaff,
  markSubjectAttendanceValidation,
  validate,
  subjectAttendanceController.markSubjectAttendance
);

router.post(
  '/subject/bulk-mark',
  requireStaff,
  bulkMarkSubjectAttendanceValidation,
  validate,
  subjectAttendanceController.bulkMarkSubjectAttendance
);

router.get('/subject/:id/date/:date', subjectAttendanceController.getSubjectAttendanceByDate);

router.get('/subject/:id/summary', subjectAttendanceController.getSubjectAttendanceSummary);

router.get('/subject/:id/stats', subjectAttendanceController.getSubjectAttendanceStats);

// General attendance routes
router.post(
  '/mark',
  requireStaff,
  markAttendanceValidation,
  validate,
  attendanceController.markAttendance
);

// Short alias for frontend: GET /api/v1/attendance => returns filtered records
router.get('/', attendanceController.getAttendanceRecords);

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

router.post('/import/excel', requireStaff, attendanceController.importFromExcel);

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
