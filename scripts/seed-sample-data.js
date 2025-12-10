#!/usr/bin/env node
/**
 * Database Seeding Script
 * Seeds demo accounts AND sample data in one command.
 *
 * Usage:
 *   npm run seed              - Seeds accounts + sample data
 *   npm run seed -- --force   - Skip confirmation prompts
 *   npm run seed:accounts     - Seeds only demo accounts (separate script)
 *
 * @author Notified Development Team
 * @version 2.0.0
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const connectDB = require('../src/config/database');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Subject = require('../src/models/Subject');
const Attendance = require('../src/models/Attendance');
const Enrollment = require('../src/models/Enrollment');
const { ROLES } = require('../src/config/constants');
const logger = require('../src/utils/logger');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, (a) => resolve(a)));

const FORCE = process.argv.includes('--force') || process.argv.includes('-f');

// ===== DEMO ACCOUNTS =====
const demoUsers = [
  {
    name: 'Demo Super Admin',
    email: 'superadmin@notified.com',
    password: 'SuperAdmin123!',
    role: ROLES.SUPERADMIN,
  },
  {
    name: 'Demo Admin',
    email: 'admin@notified.com',
    password: 'Admin123!',
    role: ROLES.ADMIN,
  },
  {
    name: 'Demo Staff',
    email: 'staff@notified.com',
    password: 'Staff123!',
    role: ROLES.STAFF,
  },
  {
    name: 'Demo Professor',
    email: 'professor@notified.com',
    password: 'Professor123!',
    role: ROLES.PROFESSOR,
  },
  {
    name: 'Demo Registrar',
    email: 'registrar@notified.com',
    password: 'Registrar123!',
    role: ROLES.REGISTRAR,
  },
];

// ===== SAMPLE DATA =====
const sampleSubjects = [
  { subjectCode: 'CC105', subjectName: 'Information Management', yearLevel: 2, section: '2-D' },
  { subjectCode: 'CC106', subjectName: 'Application Development', yearLevel: 2, section: '2-D' },
  { subjectCode: 'GE103', subjectName: 'Ethics', yearLevel: 2, section: '2-D' },
  { subjectCode: 'PE102', subjectName: 'Physical Education 2', yearLevel: 2, section: '2-D' },
];

const sampleStudents = [
  { firstName: 'Juan', lastName: 'Dela Cruz', section: '2-D' },
  { firstName: 'Maria', lastName: 'Santos', section: '2-D' },
  { firstName: 'Jose', lastName: 'Rizal', section: '2-D' },
  { firstName: 'Andres', lastName: 'Bonifacio', section: '2-D' },
  { firstName: 'Emilio', lastName: 'Aguinaldo', section: '2-D' },
  { firstName: 'Gabriela', lastName: 'Silang', section: '2-D' },
  { firstName: 'Melchora', lastName: 'Aquino', section: '2-D' },
  { firstName: 'Antonio', lastName: 'Luna', section: '2-D' },
];

const statuses = ['present', 'absent', 'late', 'excused'];

async function upsertUser({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`  ✔ User exists: ${email} (${existing.role})`);
    return existing;
  }
  const user = new User({ name, email, password, role });
  await user.save();
  console.log(`  ➕ Created user: ${email} (${role})`);
  return user;
}

async function seedAccounts() {
  console.log('\n👤 Seeding demo accounts...');
  for (const u of demoUsers) {
    await upsertUser(u);
  }
  console.log('✅ Demo accounts seeded');
}

async function seedSubjects(adminId) {
  console.log('\n📚 Seeding subjects...');
  const created = [];
  for (const s of sampleSubjects) {
    const existing = await Subject.findOne({ subjectCode: s.subjectCode });
    if (existing) {
      console.log(`  ✔ Subject exists: ${s.subjectCode}`);
      created.push(existing);
      continue;
    }
    const subj = await Subject.create({ ...s, createdBy: adminId });
    console.log(`  ➕ Created subject: ${subj.subjectCode} - ${subj.subjectName}`);
    created.push(subj);
  }
  console.log(`✅ ${created.length} subjects ready`);
  return created;
}

async function seedStudents(adminId) {
  console.log('\n🎓 Seeding students...');
  const created = [];
  for (const s of sampleStudents) {
    const year = (new Date().getFullYear() % 100).toString().padStart(2, '0');
    const studentNumber = await Student.generateNextStudentNumber(year);
    const email = `${s.firstName.toLowerCase().replace(/\s+/g, '')}.${s.lastName.toLowerCase().replace(/\s+/g, '')}@student.edu`;

    const existing = await Student.findOne({ email });
    if (existing) {
      console.log(`  ✔ Student exists: ${existing.studentNumber}`);
      created.push(existing);
      continue;
    }

    const student = await Student.create({
      studentNumber,
      firstName: s.firstName,
      lastName: s.lastName,
      email,
      section: s.section,
      guardianName: `Parent of ${s.firstName}`,
      guardianEmail: `parent.${s.lastName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      createdBy: adminId,
    });
    console.log(`  ➕ Created student: ${student.studentNumber} - ${student.firstName} ${student.lastName}`);
    created.push(student);
  }
  console.log(`✅ ${created.length} students ready`);
  return created;
}

async function seedEnrollments(students, subjects, adminId) {
  console.log('\n📝 Seeding enrollments...');
  let count = 0;
  for (const student of students) {
    for (const subject of subjects) {
      const existing = await Enrollment.findOne({ student: student._id, subject: subject._id });
      if (existing) continue;

      await Enrollment.create({
        student: student._id,
        subject: subject._id,
        enrolledBy: adminId,
      });
      count++;
    }
  }
  console.log(`✅ ${count} enrollments created`);
}

async function seedAttendance(students, subjects, adminId) {
  console.log('\n📅 Seeding attendance records...');
  let count = 0;
  const today = new Date();

  for (const student of students) {
    for (const subject of subjects) {
      // Create attendance for the last 5 days
      for (let d = 0; d < 5; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        date.setHours(0, 0, 0, 0);

        const existing = await Attendance.findOne({
          student: student._id,
          subject: subject._id,
          date,
        });
        if (existing) continue;

        const status = statuses[Math.floor(Math.random() * statuses.length)];
        await Attendance.create({
          student: student._id,
          subject: subject._id,
          date,
          status,
          timeSlot: 'arrival',
          markedBy: adminId,
        });
        count++;
      }
    }
  }
  console.log(`✅ ${count} attendance records created`);
}

async function main() {
  console.log('🌱 Database Seed Script\n');

  await connectDB();

  // Confirm seeding
  if (!FORCE) {
    const confirm = await ask('This will seed demo accounts and sample data. Continue? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ Aborted by user');
      process.exit(0);
    }
  }

  // Seed accounts first
  await seedAccounts();

  // Get admin user for createdBy references
  const admin = await User.findOne({ email: 'admin@notified.com' });
  if (!admin) {
    console.error('❌ Admin user not found. Cannot seed sample data.');
    process.exit(1);
  }

  // Seed sample data
  const subjects = await seedSubjects(admin._id);
  const students = await seedStudents(admin._id);
  await seedEnrollments(students, subjects, admin._id);
  await seedAttendance(students, subjects, admin._id);

  console.log('\n✅ Database seeding complete!');
  console.log('\n📝 Demo account credentials:');
  demoUsers.forEach((u) => {
    console.log(`   ${u.role.padEnd(12)} - ${u.email} / ${u.password}`);
  });

  rl.close();
  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('❌ Seeding failed:', err);
  rl.close();
  await mongoose.connection.close();
  process.exit(1);
});
