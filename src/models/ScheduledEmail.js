/**
 * Scheduled Email Model
 * Mongoose schema for scheduled/queued emails
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

const scheduledEmailSchema = new mongoose.Schema(
  {
    to: [
      {
        type: String,
        required: [true, 'Recipient email is required'],
        lowercase: true,
        trim: true,
      },
    ],
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    html: {
      type: String,
      required: [true, 'HTML content is required'],
    },
    text: String,
    attachments: [
      {
        filename: String,
        content: String,
        contentType: String,
        encoding: String,
      },
    ],
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled time is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    sentAt: Date,
    error: String,
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    tags: [String],
    createdBy: {
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

// Index for the scheduled email worker
scheduledEmailSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('ScheduledEmail', scheduledEmailSchema);
