/**
 * Enrollment Model
 * Mongoose schema for student-subject enrollment
 * 
 * @author Notified Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    enrolledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate enrollments
enrollmentSchema.index({ student: 1, subject: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ subject: 1 });

// Static method to enroll student
enrollmentSchema.statics.enrollStudent = function (studentId, subjectId, userId) {
  return this.create({
    student: studentId,
    subject: subjectId,
    enrolledBy: userId,
  });
};

// Static method to get student's enrollments
enrollmentSchema.statics.getStudentEnrollments = function (studentId) {
  return this.find({ student: studentId, isActive: true }).populate(
    'subject',
    'subjectCode subjectName yearLevel'
  );
};

// Static method to get subject's enrollments
enrollmentSchema.statics.getSubjectEnrollments = function (subjectId) {
  return this.find({ subject: subjectId, isActive: true }).populate(
    'student',
    'studentNumber firstName lastName email'
  );
};

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;
