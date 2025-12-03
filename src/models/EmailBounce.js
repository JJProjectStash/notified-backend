/**
 * Email Bounce Model
 * Mongoose schema for tracking bounced emails
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

const emailBounceSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['hard', 'soft'],
      required: [true, 'Bounce type is required'],
    },
    reason: String,
    originalEmailId: String,
    bounceCount: {
      type: Number,
      default: 1,
    },
    lastBounceAt: {
      type: Date,
      default: Date.now,
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

module.exports = mongoose.model('EmailBounce', emailBounceSchema);
