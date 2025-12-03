/**
 * Unsubscribe Model
 * Mongoose schema for email unsubscribe management (GDPR-compliant)
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const unsubscribeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    reason: String,
    status: {
      type: String,
      enum: ['unsubscribed', 'resubscribed'],
      default: 'unsubscribed',
    },
    resubscribedAt: Date,
    token: {
      type: String,
      index: true,
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

// Generate unsubscribe token before saving
unsubscribeSchema.pre('save', function (next) {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Unsubscribe', unsubscribeSchema);
