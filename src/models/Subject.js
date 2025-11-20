/**
 * Subject Model
 * Mongoose schema for subject management
 * Based on the JavaFX SubjectEntry model
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    days: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: [],
    },
    startTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format'],
    },
    room: {
      type: String,
      trim: true,
      maxlength: [50, 'Room cannot exceed 50 characters'],
    },
    building: {
      type: String,
      trim: true,
      maxlength: [100, 'Building cannot exceed 100 characters'],
    },
  },
  { _id: false }
);

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      required: [true, 'Subject code is required'],
      uppercase: true,
      trim: true,
      match: [
        /^[A-Z0-9-]+$/,
        'Subject code can only contain uppercase letters, numbers, and hyphens',
      ],
    },
    subjectName: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      minlength: [2, 'Subject name must be at least 2 characters'],
      maxlength: [100, 'Subject name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    yearLevel: {
      type: Number,
      required: [true, 'Year level is required'],
      min: [1, 'Year level must be at least 1'],
      max: [12, 'Year level cannot exceed 12'],
    },
    section: {
      type: String,
      trim: true,
      default: '',
    },
    schedule: {
      type: scheduleSchema,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for faster queries
subjectSchema.index({ subjectCode: 1 }, { unique: true });
subjectSchema.index({ yearLevel: 1 });
subjectSchema.index({ section: 1 });

// Virtual populate for enrolled students (through attendance/enrollment records)
subjectSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'subject',
});

// Static method to find by subject code
subjectSchema.statics.findByCode = function (subjectCode) {
  return this.findOne({ subjectCode: subjectCode.toUpperCase() });
};

// Static method to find by year level and section
subjectSchema.statics.findByYearAndSection = function (yearLevel, section) {
  return this.find({ yearLevel, section });
};

// Instance method to get enrolled student count
subjectSchema.methods.getEnrollmentCount = async function () {
  const Enrollment = mongoose.model('Enrollment');
  return await Enrollment.countDocuments({ subject: this._id, isActive: true });
};

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
