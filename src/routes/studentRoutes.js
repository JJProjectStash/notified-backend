/**
 * Student Routes
 * 
 * @author Notified Development Team
 * @version 1.0.0
 */

const express = require('express');
const { body } = require('express-validator');
const studentController = require('../controllers/studentController');
const { protect, requireStaff, requireAdmin, validate } = require('../middleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const studentValidation = [
  body('studentNumber')
    .matches(/^\d{2}-\d{4}$/)
    .withMessage('Student number must be in format YY-NNNN'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('guardianName').trim().notEmpty().withMessage('Guardian name is required'),
];

// Routes
router.get('/', getAllStudents);
router.get('/generate/student-number', generateStudentNumber);
router.get('/number/:studentNumber', getStudentByNumber);
router.get('/:id', getStudentById);
router.post('/', requireStaff, studentValidation, validate, createStudent);
router.put('/:id', requireStaff, updateStudent);
router.delete('/:id', requireAdmin, deleteStudent);

// Import controller functions
const {
  getAllStudents,
  getStudentById,
  getStudentByNumber,
  createStudent,
  updateStudent,
  deleteStudent,
  generateStudentNumber,
} = studentController;

module.exports = router;
