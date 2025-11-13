#!/usr/bin/env node

/**
 * Database Initialization Script
 * - Creates default admin user
 * - Sets up indexes for optimal performance
 * - Verifies collections
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function initializeDatabase() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   Database Initialization Script          ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // Connect to MongoDB
    console.log(`${colors.yellow}⏳ Connecting to MongoDB...${colors.reset}`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✅ Connected to MongoDB${colors.reset}\n`);

    const db = mongoose.connection.db;

    // Step 1: Create indexes for optimal performance
    console.log(`${colors.cyan}📊 Step 1: Creating Database Indexes${colors.reset}`);
    console.log(`${colors.cyan}${'─'.repeat(50)}${colors.reset}`);

    const indexes = [
      {
        collection: 'users',
        indexes: [
          { key: { email: 1 }, options: { unique: true } },
          { key: { role: 1 } },
          { key: { isActive: 1 } },
        ],
      },
      {
        collection: 'students',
        indexes: [
          { key: { studentNumber: 1 }, options: { unique: true } },
          { key: { email: 1 } },
          { key: { section: 1 } },
          { key: { firstName: 1, lastName: 1 } },
          { key: { isActive: 1 } },
        ],
      },
      {
        collection: 'subjects',
        indexes: [
          { key: { subjectCode: 1 }, options: { unique: true } },
          { key: { yearLevel: 1, section: 1 } },
          { key: { isActive: 1 } },
        ],
      },
      {
        collection: 'attendances',
        indexes: [
          { key: { student: 1, subject: 1, date: 1 }, options: { unique: true } },
          { key: { date: 1 } },
          { key: { status: 1 } },
        ],
      },
      {
        collection: 'records',
        indexes: [
          { key: { recordType: 1 } },
          { key: { student: 1 } },
          { key: { subject: 1 } },
          { key: { performedBy: 1 } },
          { key: { createdAt: -1 } },
        ],
      },
      {
        collection: 'notifications',
        indexes: [
          { key: { recipient: 1, isRead: 1 } },
          { key: { type: 1 } },
          { key: { priority: 1 } },
          { key: { createdAt: -1 } },
        ],
      },
      {
        collection: 'enrollments',
        indexes: [
          { key: { student: 1, subject: 1 }, options: { unique: true } },
          { key: { student: 1 } },
          { key: { subject: 1 } },
          { key: { isActive: 1 } },
        ],
      },
    ];

    for (const { collection, indexes: collIndexes } of indexes) {
      try {
        const coll = db.collection(collection);
        for (const { key, options = {} } of collIndexes) {
          await coll.createIndex(key, options);
        }
        console.log(`  ✅ ${collection}: ${collIndexes.length} indexes created`);
      } catch (error) {
        if (error.code === 85 || error.code === 86) {
          console.log(`  ℹ️  ${collection}: indexes already exist`);
        } else {
          console.log(`  ⚠️  ${collection}: ${error.message}`);
        }
      }
    }

    // Step 2: Create default admin user
    console.log(`\n${colors.cyan}👤 Step 2: Creating Default Admin User${colors.reset}`);
    console.log(`${colors.cyan}${'─'.repeat(50)}${colors.reset}`);

    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@notified.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.DEFAULT_ADMIN_NAME || 'System Administrator';

    const usersCollection = db.collection('users');
    const existingAdmin = await usersCollection.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`  ℹ️  Admin user already exists: ${colors.yellow}${adminEmail}${colors.reset}`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      await usersCollection.insertOne({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'superadmin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`  ✅ Admin user created successfully!`);
      console.log(`     Email: ${colors.green}${adminEmail}${colors.reset}`);
      console.log(`     Password: ${colors.green}${adminPassword}${colors.reset}`);
      console.log(
        `     ${colors.red}⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!${colors.reset}`
      );
    }

    // Step 3: Verify collections
    console.log(`\n${colors.cyan}📁 Step 3: Verifying Collections${colors.reset}`);
    console.log(`${colors.cyan}${'─'.repeat(50)}${colors.reset}`);

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    const expectedCollections = [
      'users',
      'students',
      'subjects',
      'attendances',
      'records',
      'notifications',
      'enrollments',
    ];

    for (const collName of expectedCollections) {
      if (collectionNames.includes(collName)) {
        const count = await db.collection(collName).countDocuments();
        console.log(`  ✅ ${collName}: ${colors.green}${count} documents${colors.reset}`);
      } else {
        console.log(
          `  ⚠️  ${collName}: ${colors.yellow}will be created on first insert${colors.reset}`
        );
      }
    }

    // Step 4: Summary
    console.log(`\n${colors.green}╔════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║   ✅ Database Initialization Complete!    ║${colors.reset}`);
    console.log(`${colors.green}╚════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.cyan}📋 Summary:${colors.reset}`);
    console.log(`  ✅ Database: ${colors.green}${db.databaseName}${colors.reset}`);
    console.log(`  ✅ Indexes: ${colors.green}Created for 7 collections${colors.reset}`);
    console.log(`  ✅ Admin User: ${colors.green}${adminEmail}${colors.reset}`);
    console.log(`  ✅ Collections: ${colors.green}Ready for data${colors.reset}\n`);

    console.log(`${colors.cyan}🚀 Next Steps:${colors.reset}`);
    console.log(`  1. Start the server: ${colors.yellow}npm run dev${colors.reset}`);
    console.log(`  2. Login with admin credentials above`);
    console.log(`  3. Change the admin password immediately`);
    console.log(`  4. Start using the API!\n`);

    console.log(`${colors.cyan}📚 API Documentation:${colors.reset}`);
    console.log(`  • README.md - Complete API guide`);
    console.log(`  • API_REFERENCE.md - All endpoints`);
    console.log(`  • Postman Collection - Test the API\n`);
  } catch (error) {
    console.log(`${colors.red}❌ Initialization failed!${colors.reset}\n`);
    console.log(`${colors.red}Error:${colors.reset} ${error.message}\n`);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.cyan}🔒 Database connection closed${colors.reset}\n`);
  }
}

// Run initialization
initializeDatabase();
