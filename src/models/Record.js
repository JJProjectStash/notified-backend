/**
 * Record Model
 * Mongoose schema for system activity records/audit logs
 * Based on the JavaFX RecordEntry model
 * 
 * @author Notified Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const { RECORD_TYPES } = require('../config/constants');

const recordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    recordType: {
      type: String,
      enum: Object.values(RECORD_TYPES),
      required: [true, 'Record type is required'],
    },
    recordData: {
      type: String,
      required: [true, 'Record data is required'],
      maxlength: [1000, 'Record data cannot exceed 1000 characters'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
recordSchema.index({ recordType: 1 });
recordSchema.index({ student: 1 });
recordSchema.index({ subject: 1 });
recordSchema.index({ createdAt: -1 });

// Static method to create a student-related record
recordSchema.statics.createStudentRecord = function (
  studentId,
  recordType,
  recordData,
  userId
) {
  return this.create({
    student: studentId,
    recordType,
    recordData,
    performedBy: userId,
  });
};

// Static method to create a subject-related record
recordSchema.statics.createSubjectRecord = function (
  subjectId,
  recordType,
  recordData,
  userId
) {
  return this.create({
    subject: subjectId,
    recordType,
    recordData,
    performedBy: userId,
  });
};

// Static method to create an enrollment record
recordSchema.statics.createEnrollmentRecord = function (
  studentId,
  subjectId,
  recordData,
  userId
) {
  return this.create({
    student: studentId,
    subject: subjectId,
    recordType: RECORD_TYPES.ENROLLMENT,
    recordData,
    performedBy: userId,
  });
};

// Static method to get records by type
recordSchema.statics.findByType = function (recordType, limit = 50) {
  return this.find({ recordType })
    .populate('student', 'studentNumber firstName lastName')
    .populate('subject', 'subjectCode subjectName')
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get records by date range
recordSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .populate('student', 'studentNumber firstName lastName')
    .populate('subject', 'subjectCode subjectName')
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get today's records
recordSchema.statics.getTodayRecords = function () {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  }).populate('student', 'studentNumber firstName lastName');
};

const Record = mongoose.model('Record', recordSchema);

module.exports = Record;
