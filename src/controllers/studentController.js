/**
 * Student Controller
 * Handles HTTP requests for student management
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const studentService = require('../services/studentService');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware');
const { SUCCESS_MESSAGES } = require('../config/constants');

/**
 * @route   GET /api/v1/students
 * @desc    Get all students with pagination
 * @access  Private
 */
const getAllStudents = asyncHandler(async (req, res) => {
  const { page, limit, section, search, status } = req.query;

  let result;
  if (search) {
    result = await studentService.searchStudents(search, parseInt(page), parseInt(limit));
  } else {
    const filters = {};
    if (section) filters.section = section;
    if (status) filters.status = status;
    result = await studentService.getAllStudents(
      parseInt(page) || 1,
      parseInt(limit) || 10,
      filters
    );
  }

  ApiResponse.paginated(
    res,
    result.students,
    result.page,
    result.limit,
    result.total,
    'Students retrieved successfully'
  );
});

/**
 * @route   GET /api/v1/students/:id
 * @desc    Get student by ID
 * @access  Private
 */
const getStudentById = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.params.id);
  ApiResponse.success(res, student, 'Student retrieved successfully');
});

/**
 * @route   GET /api/v1/students/number/:studentNumber
 * @desc    Get student by student number
 * @access  Private
 */
const getStudentByNumber = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentByNumber(req.params.studentNumber);
  ApiResponse.success(res, student, 'Student retrieved successfully');
});

/**
 * @route   POST /api/v1/students
 * @desc    Create new student
 * @access  Private (Admin/Staff)
 */
const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.body, req.user._id);
  ApiResponse.created(res, student, SUCCESS_MESSAGES.STUDENT_ADDED);
});

/**
 * @route   PUT /api/v1/students/:id
 * @desc    Update student
 * @access  Private (Admin/Staff)
 */
const updateStudent = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body, req.user._id);
  ApiResponse.success(res, student, SUCCESS_MESSAGES.STUDENT_UPDATED);
});

/**
 * @route   DELETE /api/v1/students/:id
 * @desc    Delete student (soft delete)
 * @access  Private (Admin)
 */
const deleteStudent = asyncHandler(async (req, res) => {
  await studentService.deleteStudent(req.params.id, req.user._id);
  ApiResponse.success(res, null, SUCCESS_MESSAGES.STUDENT_DELETED);
});

/**
 * @route   GET /api/v1/students/generate/student-number
 * @desc    Generate next student number
 * @access  Private
 */
const generateStudentNumber = asyncHandler(async (req, res) => {
  const { yearPrefix } = req.query;
  const studentNumber = await studentService.generateNextStudentNumber(yearPrefix);
  ApiResponse.success(res, { studentNumber }, 'Student number generated successfully');
});

/**
 * @route   GET /api/v1/students/:studentId/attendance/summary
 * @desc    Get attendance summary for a student
 * @access  Private
 */
const getStudentAttendanceSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const summary = await studentService.getStudentAttendanceSummary(studentId);
  ApiResponse.success(res, summary, 'Attendance summary retrieved successfully');
});

module.exports = {
  getAllStudents,
  getStudentById,
  getStudentByNumber,
  createStudent,
  updateStudent,
  deleteStudent,
  generateStudentNumber,
  getStudentAttendanceSummary,
};
