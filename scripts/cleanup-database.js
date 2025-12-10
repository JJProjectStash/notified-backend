/**
 * Database Cleanup Script
 * Removes orphaned records and fixes data integrity issues
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../src/utils/logger');
const { Student, Subject, Record, User, Enrollment, Attendance } = require('../src/models');

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

// Cleanup functions
const cleanupOrphanedStudents = async () => {
  try {
    console.log('\n🔍 Checking for orphaned student records...');

    // Find students with soft delete flags
    const softDeleted = await Student.find({
      $or: [{ isDeleted: true }, { deleted: true }, { isActive: false }],
    });

    console.log(`Found ${softDeleted.length} soft-deleted students`);

    if (softDeleted.length > 0) {
      console.log('Students to clean:');
      softDeleted.forEach((s) => {
        console.log(`  - ${s.studentNumber}: ${s.firstName} ${s.lastName}`);
      });

      // Option 1: Remove them (hard delete)
      // Uncomment the following line to permanently delete
      // const result = await Student.deleteMany({ _id: { $in: softDeleted.map(s => s._id) } });
      // console.log(`✅ Removed ${result.deletedCount} orphaned student records`);

      // Option 2: Just remove the soft delete flags
      const result = await Student.updateMany(
        { _id: { $in: softDeleted.map((s) => s._id) } },
        { $unset: { isDeleted: '', deleted: '' }, $set: { isActive: true } }
      );
      console.log(`✅ Cleaned ${result.modifiedCount} student records (removed soft delete flags)`);
    } else {
      console.log('✅ No orphaned student records found');
    }

    return softDeleted.length;
  } catch (error) {
    console.error('❌ Error cleaning orphaned students:', error.message);
    return 0;
  }
};

const cleanupOrphanedRecords = async () => {
  try {
    console.log('\n🔍 Checking for orphaned activity records...');

    // Get all valid student IDs
    const validStudentIds = (await Student.find({}, { _id: 1 })).map((s) => s._id.toString());

    // Find records with invalid student references
    const orphanedRecords = await Record.find({
      student: { $exists: true, $ne: null },
    });

    const invalidRecords = orphanedRecords.filter(
      (r) => r.student && !validStudentIds.includes(r.student.toString())
    );

    console.log(`Found ${invalidRecords.length} orphaned activity records`);

    if (invalidRecords.length > 0) {
      // Remove orphaned records
      const result = await Record.deleteMany({ _id: { $in: invalidRecords.map(r => r._id) } });
      console.log(`✅ Removed ${result.deletedCount} orphaned activity records`);
    } else {
      console.log('✅ No orphaned activity records found');
    }

    return invalidRecords.length;
  } catch (error) {
    console.error('❌ Error cleaning orphaned records:', error.message);
    return 0;
  }
};

const checkDataIntegrity = async () => {
  try {
    console.log('\n🔍 Checking data integrity...');

    // Check for duplicate student numbers
    const duplicates = await Student.aggregate([
      { $group: { _id: '$studentNumber', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } },
    ]);

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate student numbers:`);
      duplicates.forEach((d) => {
        console.log(`  - ${d._id}: ${d.count} occurrences`);
      });
    } else {
      console.log('✅ No duplicate student numbers found');
    }

    // Check for missing required fields
    const missingFields = await Student.find({
      $or: [
        { studentNumber: { $exists: false } },
        { email: { $exists: false } },
        { firstName: { $exists: false } },
        { lastName: { $exists: false } },
      ],
    });

    if (missingFields.length > 0) {
      console.log(`⚠️  Found ${missingFields.length} students with missing required fields`);
    } else {
      console.log('✅ All students have required fields');
    }

    return duplicates.length + missingFields.length;
  } catch (error) {
    console.error('❌ Error checking data integrity:', error.message);
    return 0;
  }
};

const displayCollectionInfo = async () => {
  try {
    console.log('\n🔍 Checking collections...');

    const collections = ['students', 'subjects', 'records', 'users', 'enrollments', 'attendances'];

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`  ${collectionName}: ${count} documents`);
      } catch (err) {
        console.log(`  ${collectionName}: (not found)`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking collections:', error.message);
  }
};

const displayStats = async () => {
  try {
    console.log('\n📊 Database Statistics:');

    const stats = {
      students: await Student.countDocuments(),
      subjects: await Subject.countDocuments(),
      records: await Record.countDocuments(),
      users: await User.countDocuments(),
    };

    console.log(`  Students: ${stats.students}`);
    console.log(`  Subjects: ${stats.subjects}`);
    console.log(`  Records: ${stats.records}`);
    console.log(`  Users: ${stats.users}`);
  } catch (error) {
    console.error('❌ Error getting stats:', error.message);
  }
};

// Main execution
const main = async () => {
  console.log('🧹 Starting Database Cleanup...\n');

  await connectDB();

  // Display initial stats
  await displayStats();

  // Run cleanup functions
  await cleanupOrphanedStudents();
  await cleanupOrphanedRecords();
  await checkDataIntegrity();
  await displayCollectionInfo();

  // Display final stats
  await displayStats();

  console.log('\n✅ Database cleanup completed!');
  console.log('⚠️  Review the output above and uncomment deletion code if needed\n');

  await mongoose.connection.close();
  process.exit(0);
};

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
