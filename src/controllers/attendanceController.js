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
