/**
 * Record Routes
 * 
 * @author Notified Development Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin, requireStaff } = require('../middleware/rbac');
const recordController = require('../controllers/recordController');

/**
 * All routes require authentication
 */
router.use(protect);

// Routes (order matters - specific routes before parameterized ones)
router.get('/stats', requireStaff, recordController.getRecordStats);
router.get('/today', requireStaff, recordController.getTodayRecords);
router.get('/range', requireStaff, recordController.getRecordsByDateRange);
router.get('/type/:recordType', requireStaff, recordController.getRecordsByType);
router.get('/student/:studentId', recordController.getStudentRecords);
router.get('/subject/:subjectId', recordController.getSubjectRecords);
router.get('/:id', requireStaff, recordController.getRecordById);
router.get('/', requireStaff, recordController.getAllRecords);
router.delete('/:id', requireAdmin, recordController.deleteRecord);

module.exports = router;
