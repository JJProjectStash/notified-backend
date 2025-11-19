/**
 * Model Index
 * Exports all Mongoose models
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const User = require('./User');
const Student = require('./Student');
const Subject = require('./Subject');
const Attendance = require('./Attendance');
const Record = require('./Record');
const Notification = require('./Notification');
const Enrollment = require('./Enrollment');

module.exports = {
  User,
  Student,
  Subject,
  Attendance,
  Record,
  Notification,
  Enrollment,
};
