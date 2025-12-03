/**
 * Alert Configuration Model
 * Mongoose schema for alert system configuration
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

const alertConfigSchema = new mongoose.Schema(
  {
    consecutiveAbsenceThreshold: {
      type: Number,
      default: 3,
      min: [1, 'Threshold must be at least 1'],
      max: [30, 'Threshold cannot exceed 30'],
    },
    lowAttendanceThreshold: {
      type: Number,
      default: 80,
      min: [0, 'Threshold must be at least 0'],
      max: [100, 'Threshold cannot exceed 100'],
    },
    enableConsecutiveAlerts: {
      type: Boolean,
      default: true,
    },
    enableLowAttendanceAlerts: {
      type: Boolean,
      default: true,
    },
    enablePatternAlerts: {
      type: Boolean,
      default: true,
    },
    autoSendEmail: {
      type: Boolean,
      default: false,
    },
    emailRecipients: [
      {
        type: String,
        enum: ['guardian', 'student', 'admin'],
      },
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
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

module.exports = mongoose.model('AlertConfig', alertConfigSchema);
