/**
 * Test Script for New Attendance Endpoints
 * Tests all the frontend-required attendance endpoints
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Attendance, Student, Subject, User } = require('../src/models');
const attendanceService = require('../src/services/attendanceService');
const { ATTENDANCE_STATUS } = require('../src/config/constants');

// Test data
let testUser, testStudent1, testStudent2, testSubject;

/**
 * Connect to database
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Create test data
 */
async function createTestData() {
  console.log('\n📦 Creating test data...');

  try {
    // Find or create a test user
    testUser = (await User.findOne({ role: 'staff' })) || (await User.findOne({ role: 'admin' }));

    if (!testUser) {
      console.error('❌ No staff or admin user found. Please create one first.');
      process.exit(1);
    }
    console.log('✅ Test user found:', testUser.email);

    // Find or create test students
    const students = await Student.find().limit(2);
    if (students.length < 2) {
      console.error('❌ Need at least 2 students in database');
      process.exit(1);
    }
    [testStudent1, testStudent2] = students;
    console.log('✅ Test students found:', testStudent1.fullName, testStudent2.fullName);

    // Find or create test subject
    testSubject = await Subject.findOne();
    if (!testSubject) {
      console.error('❌ No subject found. Please create one first.');
      process.exit(1);
    }
    console.log('✅ Test subject found:', testSubject.subjectName);

    // Clean up any existing test attendance
    await Attendance.deleteMany({
      student: { $in: [testStudent1._id, testStudent2._id] },
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });
    console.log('✅ Cleaned up existing test data');
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

/**
 * Test 1: Mark single attendance
 */
async function testMarkAttendance() {
  console.log('\n🧪 Test 1: POST /api/attendance/mark');

  try {
    const result = await attendanceService.markAttendance(
      {
        studentId: testStudent1._id.toString(),
        subjectId: testSubject._id.toString(),
        date: new Date(),
        status: ATTENDANCE_STATUS.PRESENT,
        remarks: 'Test attendance',
      },
      testUser._id
    );

    console.log('✅ Single attendance marked successfully');
    console.log('   Student:', result.student.firstName, result.student.lastName);
    console.log('   Status:', result.status);
    return true;
  } catch (error) {
    console.error('❌ Failed to mark attendance:', error.message);
    return false;
  }
}

/**
 * Test duplicate marking returns 409 with existing attendance data
 */
async function testDuplicateMarkReturnsConflict() {
  console.log('\n🧪 Test: Duplicate mark returns 409 with existing attendance data');

  try {
    const payload = {
      studentId: testStudent1._id.toString(),
      subjectId: testSubject._id.toString(),
      date: new Date(),
      status: ATTENDANCE_STATUS.PRESENT,
      remarks: 'Duplicate record test',
    };

    // Ensure clean state for this student before first mark
    await Attendance.deleteMany({
      student: testStudent1._id,
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });
    // First mark
    await attendanceService.markAttendance(payload, testUser._id);

    // Duplicate should error with statusCode 409 and include data
    try {
      await attendanceService.markAttendance(payload, testUser._id);
      console.error('❌ Duplicate mark did not throw an error');
      return false;
    } catch (dupErr) {
      if (dupErr.statusCode === 409 && dupErr.data) {
        console.log('✅ Duplicate mark returns 409 and data is present');
        console.log('   Existing record student:', dupErr.data.student._id.toString());
        return true;
      }
      console.error('❌ Duplicate mark did not return expected structure:', dupErr.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error in duplicate mark test:', error.message);
    return false;
  }
}

/**
 * Test 2: Bulk mark attendance
 */
async function testBulkMarkAttendance() {
  console.log('\n🧪 Test 2: POST /api/attendance/bulk-mark');

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = [
      {
        studentId: testStudent1._id.toString(),
        subjectId: testSubject._id.toString(),
        date: tomorrow,
        status: ATTENDANCE_STATUS.PRESENT,
      },
      {
        studentId: testStudent2._id.toString(),
        subjectId: testSubject._id.toString(),
        date: tomorrow,
        status: ATTENDANCE_STATUS.LATE,
      },
    ];

    const result = await attendanceService.bulkMarkAttendance(records, testUser._id);

    console.log('✅ Bulk attendance marked successfully');
    console.log('   Total:', result.total);
    console.log('   Successful:', result.successful.length);
    console.log('   Failed:', result.failed.length);
    return true;
  } catch (error) {
    console.error('❌ Failed to bulk mark attendance:', error.message);
    return false;
  }
}

/**
 * Test 3: Get attendance records
 */
async function testGetAttendanceRecords() {
  console.log('\n🧪 Test 3: GET /api/attendance/records');

  try {
    const result = await attendanceService.getAttendanceRecords(
      {
        subjectId: testSubject._id.toString(),
      },
      { page: 1, limit: 10 }
    );

    console.log('✅ Attendance records retrieved successfully');
    console.log('   Total records:', result.pagination.total);
    console.log('   Records on page:', result.records.length);
    return true;
  } catch (error) {
    console.error('❌ Failed to get attendance records:', error.message);
    return false;
  }
}

/**
 * Test 4: Get daily summary
 */
async function testGetDailySummary() {
  console.log('\n🧪 Test 4: GET /api/attendance/summary/daily/:date');

  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await attendanceService.getDailySummary(today, testSubject._id.toString());

    console.log('✅ Daily summary retrieved successfully');
    console.log('   Date:', result.date);
    console.log('   Total:', result.total);
    console.log('   Present:', result.present);
    console.log('   Absent:', result.absent);
    console.log('   Late:', result.late);
    console.log('   Attendance Rate:', result.attendanceRate + '%');
    return true;
  } catch (error) {
    console.error('❌ Failed to get daily summary:', error.message);
    return false;
  }
}

/**
 * Test 5: Get students summary
 */
async function testGetStudentsSummary() {
  console.log('\n🧪 Test 5: GET /api/attendance/summary/students');

  try {
    const result = await attendanceService.getStudentsSummary({
      subjectId: testSubject._id.toString(),
    });

    console.log('✅ Students summary retrieved successfully');
    console.log('   Total students:', result.length);
    if (result.length > 0) {
      console.log('   Sample:', {
        student: result[0].firstName + ' ' + result[0].lastName,
        totalDays: result[0].totalDays,
        present: result[0].present,
        attendanceRate: result[0].attendanceRate?.toFixed(2) + '%',
      });
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to get students summary:', error.message);
    return false;
  }
}

/**
 * Test updating an attendance record works via service
 */
async function testUpdateAttendance() {
  console.log('\n🧪 Test: Update attendance via service');

  try {
    // Create a new attendance to update
    const created = await attendanceService.markAttendance(
      {
        studentId: testStudent2._id.toString(),
        subjectId: testSubject._id.toString(),
        date: new Date(),
        status: ATTENDANCE_STATUS.PRESENT,
      },
      testUser._id
    );

    const id = created._id;
    const update = { status: 'late', remarks: 'Updated: student arrived late' };

    const updated = await attendanceService.updateAttendance(id, update, testUser._id);

    if (updated.status === 'late' && updated.remarks === update.remarks) {
      console.log('✅ Attendance updated successfully:', updated._id);
      return true;
    }

    console.error('❌ Attendance update did not reflect changes');
    return false;
  } catch (error) {
    console.error('❌ Failed to update attendance:', error.message);
    return false;
  }
}

/**
 * Test 6: Export to Excel
 */
async function testExportToExcel() {
  console.log('\n🧪 Test 6: GET /api/attendance/export/excel');

  try {
    const buffer = await attendanceService.exportToExcel({
      subjectId: testSubject._id.toString(),
    });

    console.log('✅ Excel export successful');
    console.log('   Buffer size:', (buffer.length / 1024).toFixed(2), 'KB');
    return true;
  } catch (error) {
    console.error('❌ Failed to export to Excel:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Attendance Endpoints Tests\n');
  console.log('='.repeat(60));

  try {
    await connectDB();
    await createTestData();

    const tests = [
      { name: 'Mark Single Attendance', fn: testMarkAttendance },
      { name: 'Duplicate mark returns 409', fn: testDuplicateMarkReturnsConflict },
      { name: 'Update attendance', fn: testUpdateAttendance },
      { name: 'Bulk Mark Attendance', fn: testBulkMarkAttendance },
      { name: 'Get Attendance Records', fn: testGetAttendanceRecords },
      { name: 'Get Daily Summary', fn: testGetDailySummary },
      { name: 'Get Students Summary', fn: testGetStudentsSummary },
      { name: 'Export to Excel', fn: testExportToExcel },
    ];

    const results = [];
    for (const test of tests) {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY\n');

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    results.forEach((result) => {
      console.log(result.passed ? '✅' : '❌', result.name);
    });

    console.log('\n' + '='.repeat(60));
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

    if (failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run tests
runTests();
