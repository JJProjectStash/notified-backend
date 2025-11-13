const recordService = require('../services/recordService');
const { ApiResponse } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * Get all records with filters and pagination
 * @route GET /api/v1/records
 * @access Private (Admin/Staff)
 */
exports.getAllRecords = asyncHandler(async (req, res) => {
  const { recordType, studentId, subjectId, performedBy, startDate, endDate, page, limit } =
    req.query;

  const filters = {};
  if (recordType) filters.recordType = recordType;
  if (studentId) filters.studentId = studentId;
  if (subjectId) filters.subjectId = subjectId;
  if (performedBy) filters.performedBy = performedBy;
  if (startDate && endDate) {
    filters.startDate = startDate;
    filters.endDate = endDate;
  }

  const result = await recordService.getAllRecords(filters, { page, limit });

  res.json(
    ApiResponse.paginated(
      result.records,
      result.pagination,
      SUCCESS_MESSAGES.RECORDS_RETRIEVED
    )
  );
});

/**
 * Get record by ID
 * @route GET /api/v1/records/:id
 * @access Private (Admin/Staff)
 */
exports.getRecordById = asyncHandler(async (req, res) => {
  const record = await recordService.getRecordById(req.params.id);
  res.json(ApiResponse.success(record, SUCCESS_MESSAGES.RECORD_RETRIEVED));
});

/**
 * Get records by type
 * @route GET /api/v1/records/type/:recordType
 * @access Private (Admin/Staff)
 */
exports.getRecordsByType = asyncHandler(async (req, res) => {
  const { recordType } = req.params;
  const { page, limit } = req.query;

  const result = await recordService.getRecordsByType(recordType, { page, limit });

  res.json(
    ApiResponse.paginated(
      result.records,
      result.pagination,
      SUCCESS_MESSAGES.RECORDS_RETRIEVED
    )
  );
});

/**
 * Get records by date range
 * @route GET /api/v1/records/range
 * @access Private (Admin/Staff)
 */
exports.getRecordsByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate, page, limit } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json(
      ApiResponse.error('Start date and end date are required')
    );
  }

  const result = await recordService.getRecordsByDateRange(startDate, endDate, {
    page,
    limit,
  });

  res.json(
    ApiResponse.paginated(
      result.records,
      result.pagination,
      SUCCESS_MESSAGES.RECORDS_RETRIEVED
    )
  );
});

/**
 * Get student records
 * @route GET /api/v1/records/student/:studentId
 * @access Private
 */
exports.getStudentRecords = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { recordType, subjectId, startDate, endDate, page, limit } = req.query;

  const filters = {};
  if (recordType) filters.recordType = recordType;
  if (subjectId) filters.subjectId = subjectId;
  if (startDate && endDate) {
    filters.startDate = startDate;
    filters.endDate = endDate;
  }

  const result = await recordService.getStudentRecords(studentId, filters, { page, limit });

  res.json(ApiResponse.success(result, SUCCESS_MESSAGES.RECORDS_RETRIEVED));
});

/**
 * Get subject records
 * @route GET /api/v1/records/subject/:subjectId
 * @access Private
 */
exports.getSubjectRecords = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { recordType, studentId, startDate, endDate, page, limit } = req.query;

  const filters = {};
  if (recordType) filters.recordType = recordType;
  if (studentId) filters.studentId = studentId;
  if (startDate && endDate) {
    filters.startDate = startDate;
    filters.endDate = endDate;
  }

  const result = await recordService.getSubjectRecords(subjectId, filters, { page, limit });

  res.json(ApiResponse.success(result, SUCCESS_MESSAGES.RECORDS_RETRIEVED));
});

/**
 * Get today's records
 * @route GET /api/v1/records/today
 * @access Private (Admin/Staff)
 */
exports.getTodayRecords = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await recordService.getTodayRecords({ page, limit });

  res.json(
    ApiResponse.paginated(
      result.records,
      result.pagination,
      "Today's records retrieved successfully"
    )
  );
});

/**
 * Delete record
 * @route DELETE /api/v1/records/:id
 * @access Private (Admin)
 */
exports.deleteRecord = asyncHandler(async (req, res) => {
  await recordService.deleteRecord(req.params.id, req.user.id);
  res.json(ApiResponse.success(null, 'Record deleted successfully'));
});

/**
 * Get record statistics
 * @route GET /api/v1/records/stats
 * @access Private (Admin/Staff)
 */
exports.getRecordStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const filters = {};
  if (startDate && endDate) {
    filters.startDate = startDate;
    filters.endDate = endDate;
  }

  const stats = await recordService.getRecordStats(filters);

  ApiResponse.success(res, stats, 'Record statistics retrieved successfully');
});
