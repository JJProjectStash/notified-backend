/**
 * Student Model
 * Mongoose schema for student management
 * Based on the JavaFX StudentEntry model
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentNumber: {
      type: String,
      required: [true, 'Student number is required'],
      trim: true,
      match: [/^\d{2}-\d{4}$/, 'Student number must be in format YY-NNNN (e.g., 25-0001)'],
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    section: {
      type: String,
      trim: true,
      default: '',
    },
    guardianName: {
      type: String,
      required: [true, 'Guardian name is required'],
      trim: true,
      maxlength: [100, 'Guardian name cannot exceed 100 characters'],
    },
    guardianEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid guardian email address',
      ],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated', 'transferred', 'suspended', 'dropped'],
      default: 'active',
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

// Indexes for faster queries
studentSchema.index({ studentNumber: 1 }, { unique: true });
studentSchema.index({ email: 1 });
studentSchema.index({ section: 1 });
studentSchema.index({ firstName: 1, lastName: 1 });

// Virtual for full name
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual populate for attendance records
studentSchema.virtual('attendanceRecords', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'student',
});

// Static method to generate next student number
studentSchema.statics.generateNextStudentNumber = async function (yearPrefix = '25') {
  const lastStudent = await this.findOne({
    studentNumber: new RegExp(`^${yearPrefix}-`),
  })
    .sort({ studentNumber: -1 })
    .limit(1);

  if (!lastStudent) {
    return `${yearPrefix}-0001`;
  }

  const lastNumber = parseInt(lastStudent.studentNumber.split('-')[1], 10);
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
  return `${yearPrefix}-${nextNumber}`;
};

// Static method to find by student number
studentSchema.statics.findByStudentNumber = function (studentNumber) {
  return this.findOne({ studentNumber });
};

// Instance method to get student's attendance summary
studentSchema.methods.getAttendanceSummary = async function () {
  const Attendance = mongoose.model('Attendance');
  const summary = await Attendance.aggregate([
    { $match: { student: this._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  return summary;
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
