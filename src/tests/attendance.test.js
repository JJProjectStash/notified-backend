const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { User, Student, Subject, Attendance } = require('../models');
const attendanceService = require('../services/attendanceService');
const { ATTENDANCE_STATUS } = require('../config/constants');

describe('Attendance Service tests', () => {
  let testUser;
  let testStudent;
  let testSubject;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    testUser = (await User.findOne({ role: 'staff' })) || (await User.findOne({ role: 'admin' }));
    testStudent = await Student.findOne();
    testSubject = await Subject.findOne();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // Ensure no test attendance remains after each test (isolate tests)
  afterEach(async () => {
    if (testStudent) {
      await Attendance.deleteMany({
        student: testStudent._id,
        date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      });
    }
  });

  test('duplicate attendance returns 409 with data', async () => {
    const payload = {
      studentId: testStudent._id.toString(),
      subjectId: testSubject._id.toString(),
      date: new Date(),
      status: ATTENDANCE_STATUS.PRESENT,
    };

    // Ensure clean state for this student
    await Attendance.deleteMany({
      student: testStudent._id,
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    // First success
    const created = await attendanceService.markAttendance(payload, testUser._id);
    expect(created).toBeTruthy();

    // Duplicate should throw
    try {
      await attendanceService.markAttendance(payload, testUser._id);
      // if no error thrown, fail
      throw new Error('Expected duplicate to throw 409');
    } catch (err) {
      expect(err.statusCode).toBe(409);
      expect(err.data).toBeTruthy();
      expect(String(err.data.student._id)).toBe(String(testStudent._id));
    }
  });

  test('update attendance returns updated record', async () => {
    // Create record
    const payload = {
      studentId: testStudent._id.toString(),
      subjectId: testSubject._id.toString(),
      date: new Date(),
      status: ATTENDANCE_STATUS.PRESENT,
    };

    const created = await attendanceService.markAttendance(payload, testUser._id);
    const id = created._id;

    const updated = await attendanceService.updateAttendance(
      id,
      { status: 'late', remarks: 'Testing update' },
      testUser._id
    );

    expect(updated.status).toBe('late');
    expect(updated.remarks).toBe('Testing update');
    expect(updated.editedAt).toBeTruthy();
    expect(updated.editedBy).toBeTruthy();
  });
});
