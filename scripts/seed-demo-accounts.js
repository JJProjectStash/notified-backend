/*
 * Seed Demo Accounts Script
 * Creates demo users: superadmin, admin, and staff.
 * Usage: node scripts/seed-demo-accounts.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const { User } = require('../src/models');
const { ROLES } = require('../src/config/constants');

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment');
  }
  await mongoose.connect(uri, {
    // Use default mongoose options configured by the library
  });
}

async function upsertUser({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`✔ User exists: ${email} (${existing.role})`);
    return existing;
  }

  const user = new User({ name, email, password, role });
  await user.save();
  console.log(`➕ Created user: ${email} (${role})`);
  return user;
}

async function seed() {
  console.log('Seeding demo accounts...');

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

  for (const u of demoUsers) {
    await upsertUser(u);
  }

  console.log('✅ Demo accounts seeding complete');
}

(async () => {
  try {
    await connect();
    await seed();
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
