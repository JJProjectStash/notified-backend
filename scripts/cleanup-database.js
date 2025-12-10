/**
 * Database Cleanup Script
 * Wipes all data from the database (students, subjects, enrollments, attendance, records)
 * Preserves user accounts.
 *
 * Usage: npm run db:cleanup
 *        npm run db:cleanup -- --include-users  (also wipes users except for your own)
 *
 * @author Notified Development Team
 * @version 2.0.0
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const logger = require('../src/utils/logger');
const { Student, Subject, Record, User, Enrollment, Attendance } = require('../src/models');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, (a) => resolve(a)));

const INCLUDE_USERS = process.argv.includes('--include-users');
const FORCE = process.argv.includes('--force') || process.argv.includes('-f');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    logger.info('Database cleanup script started');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const displayStats = async () => {
  console.log('\n📊 Database Statistics:');
  const stats = {
    students: await Student.countDocuments(),
    subjects: await Subject.countDocuments(),
    enrollments: await Enrollment.countDocuments(),
    attendances: await Attendance.countDocuments(),
    records: await Record.countDocuments(),
    users: await User.countDocuments(),
  };
  console.log(`  Students: ${stats.students}`);
  console.log(`  Subjects: ${stats.subjects}`);
  console.log(`  Enrollments: ${stats.enrollments}`);
  console.log(`  Attendances: ${stats.attendances}`);
  console.log(`  Records: ${stats.records}`);
  console.log(`  Users: ${stats.users}`);
  return stats;
};

const wipeData = async () => {
  console.log('\n🧹 Wiping data...');

  // Delete in order (dependencies first)
  const attendanceResult = await Attendance.deleteMany({});
  console.log(`  ✅ Deleted ${attendanceResult.deletedCount} attendance records`);

  const enrollmentResult = await Enrollment.deleteMany({});
  console.log(`  ✅ Deleted ${enrollmentResult.deletedCount} enrollments`);

  const recordResult = await Record.deleteMany({});
  console.log(`  ✅ Deleted ${recordResult.deletedCount} activity records`);

  const studentResult = await Student.deleteMany({});
  console.log(`  ✅ Deleted ${studentResult.deletedCount} students`);

  const subjectResult = await Subject.deleteMany({});
  console.log(`  ✅ Deleted ${subjectResult.deletedCount} subjects`);

  if (INCLUDE_USERS) {
    const userResult = await User.deleteMany({});
    console.log(`  ✅ Deleted ${userResult.deletedCount} users`);
  } else {
    console.log('  ℹ️  Users preserved (use --include-users to also wipe users)');
  }
};

// Main execution
const main = async () => {
  console.log('🧹 Database Cleanup Script\n');
  console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!');
  if (INCLUDE_USERS) {
    console.log('⚠️  --include-users flag detected: Users will also be deleted!');
  }

  await connectDB();

  // Display current stats
  await displayStats();

  // Confirm deletion
  if (!FORCE) {
    const confirm = await ask('\n⚠️  Type "DELETE ALL" to confirm data deletion: ');
    if (confirm.trim() !== 'DELETE ALL') {
      console.log('❌ Aborted by user');
      process.exit(0);
    }
  }

  // Wipe data
  await wipeData();

  // Display final stats
  await displayStats();

  console.log('\n✅ Database cleanup completed!');

  rl.close();
  await mongoose.connection.close();
  process.exit(0);
};

// Run the script
main().catch(async (error) => {
  console.error('❌ Script failed:', error);
  rl.close();
  await mongoose.connection.close();
  process.exit(1);
});
