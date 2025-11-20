const subjectAttendanceService = require('../services/subjectAttendanceService');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Mark attendance for a subject
 * @route POST /api/v1/attendance/subject/mark
 * @access Private (Staff/Admin)
 */
exports.markSubjectAttendance = asyncHandler(async (req, res) => {
  const attendanceData = {
    subjectId: req.body.subjectId,
    studentId: req.body.studentId,
    date: req.body.date || new Date(),
    status: req.body.status,
    remarks: req.body.remarks,
    timeSlot: req.body.timeSlot,
  };

  const attendance = await subjectAttendanceService.markSubjectAttendance(
    attendanceData,
    req.user.id
  );

  res.status(201).json(ApiResponse.created(attendance, 'Attendance marked successfully'));
});

/**
 * Bulk mark attendance for a subject
 * @route POST /api/v1/attendance/subject/bulk-mark
 * @access Private (Staff/Admin)
 */
exports.bulkMarkSubjectAttendance = asyncHandler(async (req, res) => {
  const { subjectId, attendanceData } = req.body;

  if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
    return res.status(400).json(ApiResponse.error('attendanceData must be a non-empty array'));
  }

  const result = await subjectAttendanceService.bulkMarkSubjectAttendance(
    subjectId,
    attendanceData,
    req.user.id
  );

  res
    .status(201)
    .json(
      ApiResponse.success(
        result,
        `Bulk attendance marked: ${result.successful.length}/${result.total} successful`
      )
    );
});

/**
 * Get attendance for a subject on a specific date
 * @route GET /api/v1/attendance/subject/:id/date/:date
 * @access Private
 */
exports.getSubjectAttendanceByDate = asyncHandler(async (req, res) => {
  const { id: subjectId, date } = req.params;

  const records = await subjectAttendanceService.getSubjectAttendanceByDate(subjectId, date);

  res.json(ApiResponse.success(records, 'Attendance records retrieved successfully'));
});

/**
 * Get attendance summary for a subject
 * @route GET /api/v1/attendance/subject/:id/summary
 * @access Private
 */
exports.getSubjectAttendanceSummary = asyncHandler(async (req, res) => {
  const { id: subjectId } = req.params;
  const { date } = req.query;

  const summary = await subjectAttendanceService.getSubjectAttendanceSummary(
    subjectId,
    date || new Date()
  );

  res.json(ApiResponse.success(summary, 'Attendance summary retrieved successfully'));
});

/**
 * Get attendance statistics for a subject over a date range
 * @route GET /api/v1/attendance/subject/:id/stats
 * @access Private
 */
exports.getSubjectAttendanceStats = asyncHandler(async (req, res) => {
  const { id: subjectId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json(ApiResponse.error('Start date and end date are required'));
  }

  const stats = await subjectAttendanceService.getSubjectAttendanceStats(
    subjectId,
    startDate,
    endDate
  );

  res.json(ApiResponse.success(stats, 'Attendance statistics retrieved successfully'));
});
