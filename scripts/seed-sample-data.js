#!/usr/bin/env node
/**
 * Database Seeding Script - Sample Data
 * Create sample admin, students, subjects, and attendance records for development.
 * Safe to run multiple times; avoid creating duplicate users/students/subjects.
 * Optional flags: --wipe (remove existing sample data), --force (skip confirmation), --count (number of students, default 10), --subjects (number of subjects default 3), --dry-run
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Subject = require('../src/models/Subject');
const Attendance = require('../src/models/Attendance');
const Enrollment = require('../src/models/Enrollment');
const logger = require('../src/utils/logger');
const readline = require('readline');

// Minimal CLI parsing
const rawArgs = process.argv.slice(2);
const parseArg = (key) => {
  const arg = rawArgs.find((a) => a.startsWith(`--${key}=`));
  return arg ? arg.split('=')[1] : null;
};
const hasFlag = (flag) => rawArgs.includes(`--${flag}`) || rawArgs.includes(`-${flag}`);

const DRY_RUN = hasFlag('dry-run') || hasFlag('d');
const FORCE = hasFlag('force') || hasFlag('f');
const WIPE = hasFlag('wipe') || hasFlag('w');
const COUNT = parseInt(parseArg('count'), 10) || 10;
const SUBJECTS = parseInt(parseArg('subjects'), 10) || 3;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, (a) => resolve(a)));

const sampleSubjects = [
  { subjectCode: 'MATH101', subjectName: 'Mathematics 101', yearLevel: 10, section: 'A' },
  { subjectCode: 'ENG101', subjectName: 'English 101', yearLevel: 10, section: 'A' },
  { subjectCode: 'SCI101', subjectName: 'Science 101', yearLevel: 10, section: 'A' },
  { subjectCode: 'HIST101', subjectName: 'History 101', yearLevel: 10, section: 'A' },
  { subjectCode: 'PE101', subjectName: 'PE 101', yearLevel: 10, section: 'A' },
];

const statuses = ['present', 'absent', 'late', 'excused'];

const createAdminIfMissing = async () => {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@notified.com';
  const adminName = process.env.DEFAULT_ADMIN_NAME || 'System Administrator';
  const adminPass = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';

  let admin = await User.findOne({ email: adminEmail });
  if (admin) {
    logger.info('Admin user already exists:', adminEmail);
    return admin;
  }

  if (DRY_RUN) {
    logger.info('[DRY RUN] Would create admin:', adminEmail);
    return null;
  }

  admin = await User.create({ name: adminName, email: adminEmail, password: adminPass, role: 'admin' });
  logger.info('Created admin user:', adminEmail);
  return admin;
};

const createSubjects = async (count, createdBy) => {
  const created = [];
  for (let i = 0; i < count; i++) {
    const s = sampleSubjects[i] || sampleSubjects[i % sampleSubjects.length];
    const existing = await Subject.findOne({ subjectCode: s.subjectCode });
    if (existing) {
      created.push(existing);
      continue;
    }
    if (DRY_RUN) {
      logger.info('[DRY RUN] Would create subject', s.subjectCode);
      continue;
    }
    const subj = await Subject.create({ ...s, createdBy });
    created.push(subj);
    logger.info('Created subject:', subj.subjectCode);
  }
  return created;
};

const createStudents = async (count, createdBy) => {
  const students = [];
  for (let i = 0; i < count; i++) {
    const year = (new Date().getFullYear() % 100).toString().padStart(2, '0');
    // generate a next number using generator
    const number = await Student.generateNextStudentNumber(year);
    const email = `student${number.replace('-', '')}@example.com`;
    const existing = await Student.findOne({ studentNumber: number });
    if (existing) {
      students.push(existing);
      continue;
    }
    if (DRY_RUN) {
      logger.info('[DRY RUN] Would create student:', number);
      continue;
    }
    const student = await Student.create({
      studentNumber: number,
      firstName: `FN-${number}`,
      lastName: `LN-${number}`,
      email,
      section: 'A',
      guardianName: `Parent ${number}`,
      guardianEmail: `guardian${number.replace('-', '')}@example.com`,
      createdBy,
    });
    students.push(student);
    logger.info('Created student:', student.studentNumber);
  }
  return students;
};

const createAttendance = async (students, subjects, adminId, days = 3) => {
  if (DRY_RUN) {
    logger.info('[DRY RUN] Would create attendance records for students:', students.length, 'subjects:', subjects.length);
    return [];
  }
  const created = [];
  const now = new Date();
  for (let s of students) {
    for (let subj of subjects) {
      for (let d = 1; d <= days; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        date.setHours(0, 0, 0, 0);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        // check if attendance exists
        const exists = await Attendance.findOne({ student: s._id, subject: subj._id, date });
        if (exists) continue;
        const att = await Attendance.create({
          student: s._id,
          subject: subj._id,
          date,
          status,
          timeSlot: 'arrival',
          remarks: '',
          markedBy: adminId,
        });
        created.push(att);
      }
    }
  }
  logger.info(`Created ${created.length} attendance records`);
  return created;
};

const wipeCollections = async () => {
  // remove sample data (students, subjects, attendance, enrollments)
  logger.warn('Wiping sample collections: students, subjects, attendance, enrollments (this is destructive)');
  if (DRY_RUN) return;
  await Attendance.deleteMany({});
  await Enrollment.deleteMany({});
  await Student.deleteMany({});
  await Subject.deleteMany({ subjectCode: { $in: sampleSubjects.map((s) => s.subjectCode) } });
};

const main = async () => {
  await connectDB();
  logger.info('Connected to DB');

  if (WIPE) {
    if (!FORCE) {
      const ans = await ask('⚠️  WIPE mode: this will delete documents in students/subjects/attendance. Type YES to proceed: ');
      if (ans.trim() !== 'YES') {
        logger.info('Aborted by user');
        process.exit(0);
      }
    }
    await wipeCollections();
    logger.info('Wipe complete');
  }

  if (!FORCE && !DRY_RUN) {
    const ans = await ask(`Seed script will create ${COUNT} students, ${SUBJECTS} subjects and attendance records. Continue? (YES) `);
    if (ans.trim() !== 'YES') {
      logger.info('Aborted by user');
      process.exit(0);
    }
  }

  const admin = await createAdminIfMissing();
  const createdSubjects = await createSubjects(SUBJECTS, admin ? admin._id : null);
  const createdStudents = await createStudents(COUNT, admin ? admin._id : null);
  await createAttendance(createdStudents, createdSubjects, admin ? admin._id : null, 3);

  logger.info('Seeding finished');
  try {
    await mongoose.connection.close();
  } catch (err) {
    logger.warn('Error closing DB connection', err);
  }
  process.exit(0);
};

main().catch(async (err) => {
  logger.error('Seeding failed:', err);
  try {
    await mongoose.connection.close();
  } catch (err2) {}
  process.exit(1);
});
