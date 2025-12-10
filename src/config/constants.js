/**
 * Application Constants
 * Centralized constants for the Notified backend
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

module.exports = {
  // User Roles
  ROLES: {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    STAFF: 'staff',
    PROFESSOR: 'professor',
    REGISTRAR: 'registrar',
  },

  // Record Types (matching Java application)
  RECORD_TYPES: {
    EMAIL_SENT: 'EMAIL_SENT',
    STUDENT_ADDED: 'STUDENT_ADDED',
    STUDENT_UPDATED: 'STUDENT_UPDATED',
    STUDENT_DELETED: 'STUDENT_DELETED',
    ENROLLMENT: 'ENROLLMENT',
    SUBJECT_ADDED: 'SUBJECT_ADDED',
    SUBJECT_UPDATED: 'SUBJECT_UPDATED',
    SUBJECT_DELETED: 'SUBJECT_DELETED',
    ATTENDANCE_MARKED: 'ATTENDANCE_MARKED',
  },

  // Attendance Status
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    EXCUSED: 'excused',
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    ATTENDANCE_ALERT: 'attendance_alert',
    GRADE_UPDATE: 'grade_update',
    ANNOUNCEMENT: 'announcement',
    REMINDER: 'reminder',
    SYSTEM: 'system',
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },

  // Error Messages
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'You are not authorized to access this resource',
    TOKEN_EXPIRED: 'Your session has expired. Please login again',
    TOKEN_INVALID: 'Invalid token. Please login again',
    USER_EXISTS: 'User with this email already exists',
    USER_NOT_FOUND: 'User not found',
    STUDENT_EXISTS: 'Student with this student number already exists',
    STUDENT_NOT_FOUND: 'Student not found',
    SUBJECT_EXISTS: 'Subject with this code already exists',
    SUBJECT_NOT_FOUND: 'Subject not found',
    SUBJECT_CODE_EXISTS: 'Subject with this code already exists',
    SUBJECT_HAS_ENROLLMENTS: 'Cannot delete subject with active enrollments',
    INVALID_SUBJECT_CODE: 'Invalid subject code format',
    ATTENDANCE_NOT_FOUND: 'Attendance record not found',
    ATTENDANCE_EXISTS: 'Attendance already marked for this student and subject today',
    NOTIFICATION_NOT_FOUND: 'Notification not found',
    RECORD_NOT_FOUND: 'Record not found',
    ENROLLMENT_EXISTS: 'Student is already enrolled in this subject',
    ENROLLMENT_NOT_FOUND: 'Enrollment not found',
    VALIDATION_ERROR: 'Validation failed',
    INTERNAL_ERROR: 'An internal server error occurred',
    WEAK_PASSWORD: 'Password must be at least 8 characters with letters and numbers',
    INVALID_EMAIL: 'Please provide a valid email address',
    REQUIRED_FIELDS: 'Please provide all required fields',
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    USER_CREATED: 'User created successfully',
    USER_UPDATED: 'User updated successfully',
    USER_DELETED: 'User deleted successfully',
    USER_RETRIEVED: 'User retrieved successfully',
    USERS_RETRIEVED: 'Users retrieved successfully',
    STUDENT_ADDED: 'Student added successfully',
    STUDENT_UPDATED: 'Student updated successfully',
    STUDENT_DELETED: 'Student deleted successfully',
    STUDENT_RETRIEVED: 'Student retrieved successfully',
    STUDENTS_RETRIEVED: 'Students retrieved successfully',
    SUBJECT_CREATED: 'Subject created successfully',
    SUBJECT_UPDATED: 'Subject updated successfully',
    SUBJECT_DELETED: 'Subject deleted successfully',
    SUBJECT_RETRIEVED: 'Subject retrieved successfully',
    SUBJECTS_RETRIEVED: 'Subjects retrieved successfully',
    ATTENDANCE_MARKED: 'Attendance marked successfully',
    ATTENDANCE_UPDATED: 'Attendance updated successfully',
    ATTENDANCE_DELETED: 'Attendance deleted successfully',
    ATTENDANCE_RETRIEVED: 'Attendance retrieved successfully',
    NOTIFICATION_CREATED: 'Notification created successfully',
    NOTIFICATION_UPDATED: 'Notification updated successfully',
    NOTIFICATION_DELETED: 'Notification deleted successfully',
    NOTIFICATION_RETRIEVED: 'Notification retrieved successfully',
    NOTIFICATIONS_RETRIEVED: 'Notifications retrieved successfully',
    RECORD_RETRIEVED: 'Record retrieved successfully',
    RECORDS_RETRIEVED: 'Records retrieved successfully',
    EMAIL_SENT: 'Email sent successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
  },

  // Validation Rules
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 8,
    STUDENT_NUMBER_PATTERN: /^\d{2}-\d{4}$/,
    SUBJECT_CODE_PATTERN: /^[A-Z0-9-]+$/,
    NAME_PATTERN: /^[a-zA-Z\s\-']+$/,
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // Default Year Prefix
  DEFAULT_YEAR_PREFIX: '25',
};
