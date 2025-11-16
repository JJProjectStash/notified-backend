const attendanceService = require('../services/attendanceService');
const { ApiResponse } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * Mark attendance
 * @route POST /api/v1/attendance
 * @access Private (Staff)
 */
exports.markAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.markAttendance(req.body, req.user.id);
  res.status(201).json(
    ApiResponse.created(attendance, SUCCESS_MESSAGES.ATTENDANCE_MARKED)
  );
});

/**
 * Get attendance by date range
 * @route GET /api/v1/attendance/range
 * @access Private
 */
exports.getAttendanceByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate, studentId, subjectId, status, page, limit } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json(
      ApiResponse.error('Start date and end date are required')
    );
  }

  const filters = {};
  if (studentId) filters.studentId = studentId;
  if (subjectId) filters.subjectId = subjectId;
  if (status) filters.status = status;

  const result = await attendanceService.getAttendanceByDateRange(
    startDate,
    endDate,
    filters,
    { page, limit }
  );

  res.json(
    ApiResponse.paginated(
      result.records,
      result.pagination,
      SUCCESS_MESSAGES.ATTENDANCE_RETRIEVED
    )
  );
});

/**
 * Get student attendance
 * @route GET /api/v1/attendance/student/:studentId
 * @access Private
 */
exports.getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { subjectId, startDate, endDate, page, limit } = req.query;

  const filters = {};
  if (subjectId) filters.subjectId = subjectId;
  if (startDate && endDate) {
    filters.startDate = startDate;
    filters.endDate = endDate;
  }

  const result = await attendanceService.getStudentAttendance(
    studentId,
    filters,
    { page, limit }
  );

  res.json(ApiResponse.success(result, SUCCESS_MESSAGES.ATTENDANCE_RETRIEVED));
});

/**
 * Get subject attendance
 * @route GET /api/v1/attendance/subject/:subjectId
 * @access Private
 */
exports.getSubjectAttendance = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { date, status, page, limit } = req.query;

  const filters = {};
  if (date) filters.date = date;
  if (status) filters.status = status;

  const result = await attendanceService.getSubjectAttendance(
    subjectId,
    filters,
    { page, limit }
  );

  res.json(ApiResponse.success(result, SUCCESS_MESSAGES.ATTENDANCE_RETRIEVED));
});

/**
 * Get attendance summary for a student
 * @route GET /api/v1/attendance/student/:studentId/summary
 * @access Private
 */
exports.getAttendanceSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { subjectId } = req.query;

  const summary = await attendanceService.getAttendanceSummary(studentId, subjectId);

  res.json(ApiResponse.success(summary, 'Attendance summary retrieved successfully'));
});

/**
 * Update attendance
 * @route PUT /api/v1/attendance/:id
 * @access Private (Staff)
 */
exports.updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.updateAttendance(
    req.params.id,
    req.body,
    req.user.id
  );
  res.json(ApiResponse.success(attendance, SUCCESS_MESSAGES.ATTENDANCE_UPDATED));
});

/**
 * Delete attendance
 * @route DELETE /api/v1/attendance/:id
 * @access Private (Admin)
 */
exports.deleteAttendance = asyncHandler(async (req, res) => {
  await attendanceService.deleteAttendance(req.params.id, req.user.id);
  res.json(ApiResponse.success(null, SUCCESS_MESSAGES.ATTENDANCE_DELETED));
});

/**
 * Get today's attendance for a subject
 * @route GET /api/v1/attendance/subject/:subjectId/today
 * @access Private
 */
exports.getTodayAttendance = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const records = await attendanceService.getTodayAttendance(subjectId);
  res.json(ApiResponse.success(records, "Today's attendance retrieved successfully"));
});

/**
 * Bulk mark attendance
 * @route POST /api/v1/attendance/bulk-mark
 * @access Private (Staff)
 */
exports.bulkMarkAttendance = asyncHandler(async (req, res) => {
  const { records } = req.body;
  const result = await attendanceService.bulkMarkAttendance(records, req.user.id);
  res.status(201).json(
    ApiResponse.success(result, 'Bulk attendance marked successfully')
  );
});

/**
 * Get attendance records with filters
 * @route GET /api/v1/attendance/records
 * @access Private
 */
exports.getAttendanceRecords = asyncHandler(async (req, res) => {
  const { startDate, endDate, studentId, subjectId, status, page, limit } = req.query;

  const filters = {};
  if (studentId) filters.studentId = studentId;
  if (subjectId) filters.subjectId = subjectId;
  if (status) filters.status = status;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const result = await attendanceService.getAttendanceRecords(
    filters,
    { page, limit }
  );

  res.json(
    ApiResponse.paginated(
      result.records,
      result.pagination,
      'Attendance records retrieved successfully'
    )
  );
});

/**
 * Get daily attendance summary
 * @route GET /api/v1/attendance/summary/daily/:date
 * @access Private
 */
exports.getDailySummary = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const { subjectId } = req.query;
  
  const summary = await attendanceService.getDailySummary(date, subjectId);
  res.json(ApiResponse.success(summary, 'Daily summary retrieved successfully'));
});

/**
 * Get all students attendance summary
 * @route GET /api/v1/attendance/summary/students
 * @access Private
 */
exports.getStudentsSummary = asyncHandler(async (req, res) => {
  const { subjectId, startDate, endDate } = req.query;
  
  const filters = {};
  if (subjectId) filters.subjectId = subjectId;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const summary = await attendanceService.getStudentsSummary(filters);
  res.json(ApiResponse.success(summary, 'Students summary retrieved successfully'));
});

/**
 * Import attendance from Excel
 * @route POST /api/v1/attendance/import/excel
 * @access Private (Staff)
 */
exports.importFromExcel = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json(
      ApiResponse.error('No file uploaded')
    );
  }

  const file = req.files.file;
  const result = await attendanceService.importFromExcel(file, req.user.id);
  
  res.status(201).json(
    ApiResponse.success(result, 'Attendance imported successfully')
  );
});

/**
 * Export attendance to Excel
 * @route GET /api/v1/attendance/export/excel
 * @access Private
 */
exports.exportToExcel = asyncHandler(async (req, res) => {
  const { startDate, endDate, studentId, subjectId, status } = req.query;

  const filters = {};
  if (studentId) filters.studentId = studentId;
  if (subjectId) filters.subjectId = subjectId;
  if (status) filters.status = status;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const buffer = await attendanceService.exportToExcel(filters);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=attendance-${Date.now()}.xlsx`
  );
  res.send(buffer);
});
