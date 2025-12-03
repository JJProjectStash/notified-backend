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
    scheduleSlot: req.body.scheduleSlot, // Include schedule slot
  };

  const attendance = await subjectAttendanceService.markSubjectAttendance(
    attendanceData,
    req.user.id
  );

  // attendance may be returned as { attendance, isUpdate } for consistency
  const result = attendance.attendance ? attendance.attendance : attendance;

  res.status(201).json({
    success: true,
    message: 'Attendance marked successfully',
    data: result,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Bulk mark attendance for a subject
 * @route POST /api/v1/attendance/subject/bulk-mark
 * @access Private (Staff/Admin)
 */
exports.bulkMarkSubjectAttendance = asyncHandler(async (req, res) => {
  const { subjectId, attendanceData, studentIds, status, date, timeSlot, remarks, scheduleSlot } =
    req.body;

  let dataToProcess = attendanceData;

  // Support frontend format: { studentIds: [], status: '...', ... }
  if (!dataToProcess && studentIds && Array.isArray(studentIds)) {
    dataToProcess = studentIds.map((studentId) => ({
      studentId,
      status,
      date: date || new Date(),
      timeSlot: timeSlot || 'arrival',
      scheduleSlot, // Include schedule slot
      remarks,
    }));
  }

  if (!Array.isArray(dataToProcess) || dataToProcess.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid attendance data. Expected attendanceData array or studentIds array.',
      timestamp: new Date().toISOString(),
    });
  }

  const result = await subjectAttendanceService.bulkMarkSubjectAttendance(
    subjectId,
    dataToProcess,
    req.user.id
  );

  res.status(201).json({
    success: true,
    message: `Bulk attendance marked: ${result.successful.length}/${result.total} successful`,
    data: {
      updated: result.summary?.updated || 0,
      created: result.summary?.created || 0,
      total: result.total,
      records: result.records || [],
      successful: result.successful,
      failed: result.failed,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get attendance for a subject on a specific date
 * @route GET /api/v1/attendance/subject/:id/date/:date
 * @access Private
 */
exports.getSubjectAttendanceByDate = asyncHandler(async (req, res) => {
  const { id: subjectId, date } = req.params;
  const { scheduleSlot } = req.query;

  const result = await subjectAttendanceService.getSubjectAttendanceByDate(
    subjectId,
    date,
    scheduleSlot
  );

  // Transform the service response to match frontend expectations
  // Frontend expects an array of attendance records with specific fields
  let records = [];

  if (result) {
    if (Array.isArray(result)) {
      // If service returns an array directly, use it
      records = result;
    } else if (result.students && Array.isArray(result.students)) {
      // Transform students array to attendance records format
      records = result.students
        .filter((student) => student.status && student.status !== 'unmarked')
        .map((student) => ({
          id: student._id?.toString() || student.id,
          studentId: student._id?.toString() || student.id,
          subjectId: result.subjectId?.toString() || subjectId,
          date: result.date || date,
          status: student.status,
          scheduleSlot: student.scheduleSlot || scheduleSlot || null,
          timeSlot: student.timeSlot || null,
          remarks: student.remarks || null,
          notes: student.notes || null,
          createdAt: student.markedAt || new Date().toISOString(),
          updatedAt: student.markedAt || new Date().toISOString(),
          // Include student details for convenience
          student: {
            _id: student._id,
            studentNumber: student.studentId,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
          },
          markedBy: student.markedBy,
        }));
    } else if (result.records && Array.isArray(result.records)) {
      // If service returns { records: [...] } format
      records = result.records;
    }
  }

  // Always return an array, even if empty
  res.json({
    success: true,
    message: 'Attendance records retrieved successfully',
    data: records,
    count: records.length,
    // Include summary stats if available
    stats: result?.stats || null,
    timestamp: new Date().toISOString(),
  });
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

  res.json({
    success: true,
    message: 'Attendance summary retrieved successfully',
    data: summary,
    timestamp: new Date().toISOString(),
  });
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
    return res.status(400).json({
      success: false,
      message: 'Start date and end date are required',
      timestamp: new Date().toISOString(),
    });
  }

  const stats = await subjectAttendanceService.getSubjectAttendanceStats(
    subjectId,
    startDate,
    endDate
  );

  res.json({
    success: true,
    message: 'Attendance statistics retrieved successfully',
    data: stats,
    timestamp: new Date().toISOString(),
  });
});
