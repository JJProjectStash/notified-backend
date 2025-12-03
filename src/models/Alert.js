/**
 * Alert Model
 * Mongoose schema for attendance alerts and warnings
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['consecutive_absence', 'low_attendance', 'pattern_warning'],
      required: [true, 'Alert type is required'],
      index: true,
    },
    severity: {
      type: String,
      enum: ['warning', 'critical', 'info'],
      required: [true, 'Severity is required'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    message: {
      type: String,
      required: [true, 'Alert message is required'],
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    details: {
      consecutiveDays: Number,
      attendanceRate: Number,
      threshold: Number,
      startDate: Date,
      endDate: Date,
    },
    acknowledged: {
      type: Boolean,
      default: false,
      index: true,
    },
    acknowledgedAt: Date,
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notificationSentAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for common queries
alertSchema.index({ student: 1, type: 1, acknowledged: 1 });
alertSchema.index({ severity: 1, acknowledged: 1 });
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
