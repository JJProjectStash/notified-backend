const subjectService = require('../services/subjectService');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * Get all subjects with pagination and filters
 * @route GET /api/v1/subjects
 * @access Private
 */
exports.getAllSubjects = asyncHandler(async (req, res) => {
  const { page, limit, yearLevel, section, isActive } = req.query;

  const filters = {};
  if (yearLevel) filters.yearLevel = parseInt(yearLevel);
  if (section) filters.section = section;
  if (isActive !== undefined) filters.isActive = isActive === 'true';

  const result = await subjectService.getAllSubjects(filters, { page, limit });

  res.json(
    ApiResponse.paginated(
      result.subjects,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      SUCCESS_MESSAGES.SUBJECTS_RETRIEVED
    )
  );
});

/**
 * Get subject by ID
 * @route GET /api/v1/subjects/:id
 * @access Private
 */
exports.getSubjectById = asyncHandler(async (req, res) => {
  const subject = await subjectService.getSubjectById(req.params.id);
  res.json(ApiResponse.success(subject, SUCCESS_MESSAGES.SUBJECT_RETRIEVED));
});

/**
 * Get subject by subject code
 * @route GET /api/v1/subjects/code/:subjectCode
 * @access Private
 */
exports.getSubjectByCode = asyncHandler(async (req, res) => {
  const subject = await subjectService.getSubjectByCode(req.params.subjectCode);
  res.json(ApiResponse.success(subject, SUCCESS_MESSAGES.SUBJECT_RETRIEVED));
});

/**
 * Create new subject
 * @route POST /api/v1/subjects
 * @access Private (Admin/Staff)
 */
exports.createSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.createSubject(req.body, req.user.id);
  res.status(201).json(ApiResponse.created(subject, SUCCESS_MESSAGES.SUBJECT_CREATED));
});

/**
 * Update subject
 * @route PUT /api/v1/subjects/:id
 * @access Private (Admin/Staff)
 */
exports.updateSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.updateSubject(req.params.id, req.body, req.user.id);
  res.json(ApiResponse.success(subject, SUCCESS_MESSAGES.SUBJECT_UPDATED));
});

/**
 * Update subject schedules
 * @route PUT /api/v1/subjects/:id/schedules
 * @access Private (Admin/Staff)
 */
exports.updateSubjectSchedules = asyncHandler(async (req, res) => {
  const subject = await subjectService.updateSubjectSchedules(
    req.params.id,
    req.body.schedules,
    req.user.id
  );
  res.json(ApiResponse.success(subject, 'Subject schedules updated successfully'));
});

/**
 * Delete subject
 * @route DELETE /api/v1/subjects/:id
 * @access Private (Admin)
 */
exports.deleteSubject = asyncHandler(async (req, res) => {
  await subjectService.deleteSubject(req.params.id, req.user.id);
  res.json(ApiResponse.success(null, SUCCESS_MESSAGES.SUBJECT_DELETED));
});

/**
 * Search subjects
 * @route GET /api/v1/subjects/search
 * @access Private
 */
exports.searchSubjects = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;

  if (!q) {
    return res.status(400).json(ApiResponse.error('Search query is required'));
  }

  const result = await subjectService.searchSubjects(q, { page, limit });

  res.json(
    ApiResponse.paginated(
      result.subjects,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      SUCCESS_MESSAGES.SUBJECTS_RETRIEVED
    )
  );
});

/**
 * Get subjects by year level and section
 * @route GET /api/v1/subjects/year/:yearLevel/section/:section
 * @access Private
 */
exports.getSubjectsByYearAndSection = asyncHandler(async (req, res) => {
  const { yearLevel, section } = req.params;
  const subjects = await subjectService.getSubjectsByYearAndSection(parseInt(yearLevel), section);
  res.json(ApiResponse.success(subjects, SUCCESS_MESSAGES.SUBJECTS_RETRIEVED));
});

/**
 * Get subject enrollments
 * @route GET /api/v1/subjects/:id/enrollments
 * @access Private
 */
exports.getSubjectEnrollments = asyncHandler(async (req, res) => {
  const result = await subjectService.getSubjectEnrollments(req.params.id);
  res.json(ApiResponse.success(result, 'Subject enrollments retrieved successfully'));
});
