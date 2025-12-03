/**
 * Attendance Model
 * Mongoose schema for attendance tracking
 * Based on the JavaFX attendance and records system
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      required: [true, 'Attendance status is required'],
      default: ATTENDANCE_STATUS.PRESENT,
    },
    timeSlot: {
      type: String,
      enum: ['arrival', 'departure'],
    },
    scheduleSlot: {
      type: String,
      trim: true,
      maxlength: [50, 'Schedule slot name cannot exceed 50 characters'],
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },
    editedAt: {
      type: Date,
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    history: [
      {
        status: String,
        timeSlot: String,
        scheduleSlot: String,
        remarks: String,
        editedAt: Date,
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Marker user is required'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        // Handle populated vs unpopulated student field
        ret.studentId = ret.student && ret.student._id ? ret.student._id.toString() : (ret.student ? ret.student.toString() : null);
        // Handle populated vs unpopulated subject field
        ret.subjectId = ret.subject && ret.subject._id ? ret.subject._id.toString() : (ret.subject ? ret.subject.toString() : null);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        // Handle populated vs unpopulated student field
        ret.studentId = ret.student && ret.student._id ? ret.student._id.toString() : (ret.student ? ret.student.toString() : null);
        // Handle populated vs unpopulated subject field
        ret.subjectId = ret.subject && ret.subject._id ? ret.subject._id.toString() : (ret.subject ? ret.subject.toString() : null);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ subject: 1, date: -1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });

// Updated unique index to include scheduleSlot for multiple sessions per day
attendanceSchema.index(
  { student: 1, subject: 1, date: 1, scheduleSlot: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { subject: { $exists: true } },
  }
);

// Static method to get attendance by date range
attendanceSchema.statics.findByDateRange = function (startDate, endDate, filters = {}) {
  return this.find({
    date: { $gte: startDate, $lte: endDate },
    ...filters,
  })
    .populate('student', 'studentNumber firstName lastName')
    .populate('subject', 'subjectCode subjectName')
    .sort({ date: -1 });
};

// Static method to get attendance summary
attendanceSchema.statics.getAttendanceSummary = async function (filters = {}) {
  return await this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
};

// Static method to get student attendance history
attendanceSchema.statics.getStudentHistory = function (studentId, limit = 10) {
  return this.find({ student: studentId })
    .populate('subject', 'subjectCode subjectName')
    .populate('markedBy', 'name')
    .sort({ date: -1 })
    .limit(limit);
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
