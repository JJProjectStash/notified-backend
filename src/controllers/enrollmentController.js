const enrollmentService = require('../services/enrollmentService');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Enroll a student in a subject
 * @route POST /api/v1/subjects/:id/enroll
 * @access Private (Staff/Admin)
 */
exports.enrollStudent = asyncHandler(async (req, res) => {
  const { id: subjectId } = req.params;
  const { studentId } = req.body;

  const enrollment = await enrollmentService.enrollStudent(subjectId, studentId, req.user.id);

  res.status(201).json(ApiResponse.created(enrollment, 'Student enrolled successfully'));
});

/**
 * Unenroll a student from a subject
 * @route DELETE /api/v1/subjects/:id/enroll/:studentId
 * @access Private (Staff/Admin)
 */
exports.unenrollStudent = asyncHandler(async (req, res) => {
  const { id: subjectId, studentId } = req.params;

  await enrollmentService.unenrollStudent(subjectId, studentId, req.user.id);

  res.json(ApiResponse.success(null, 'Student unenrolled successfully'));
});

/**
 * Get all enrolled students for a subject
 * @route GET /api/v1/subjects/:id/students
 * @access Private
 */
exports.getEnrolledStudents = asyncHandler(async (req, res) => {
  const { id: subjectId } = req.params;

  const students = await enrollmentService.getEnrolledStudents(subjectId);

  res.json(ApiResponse.success(students, 'Enrolled students retrieved successfully'));
});

/**
 * Bulk enroll students in a subject
 * @route POST /api/v1/subjects/:id/students/bulk
 * @access Private (Staff/Admin)
 */
exports.bulkEnrollStudents = asyncHandler(async (req, res) => {
  const { id: subjectId } = req.params;
  const { studentIds } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json(ApiResponse.error('studentIds must be a non-empty array'));
  }

  const result = await enrollmentService.bulkEnrollStudents(subjectId, studentIds, req.user.id);

  res
    .status(201)
    .json(
      ApiResponse.success(
        result,
        `Bulk enrollment completed: ${result.successful.length}/${result.total} successful`
      )
    );
});

/**
 * Check if student is enrolled in subject
 * @route GET /api/v1/subjects/:id/students/:studentId/enrolled
 * @access Private
 */
exports.checkEnrollment = asyncHandler(async (req, res) => {
  const { id: subjectId, studentId } = req.params;

  const isEnrolled = await enrollmentService.isStudentEnrolled(subjectId, studentId);

  res.json(
    ApiResponse.success(
      { isEnrolled },
      isEnrolled ? 'Student is enrolled' : 'Student is not enrolled'
    )
  );
});

/**
 * Get student's enrollments
 * @route GET /api/v1/students/:studentId/enrollments
 * @access Private
 */
exports.getStudentEnrollments = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const enrollments = await enrollmentService.getStudentEnrollments(studentId);

  res.json(ApiResponse.success(enrollments, 'Student enrollments retrieved successfully'));
});
