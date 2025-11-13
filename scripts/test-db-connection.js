#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests MongoDB connection and displays database information
 */

require('dotenv').config();
const mongoose = require('mongoose');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testConnection() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   MongoDB Connection Test                 ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log(`${colors.red}❌ Error: MONGODB_URI not found in .env file${colors.reset}`);
    console.log(`${colors.yellow}Please create a .env file with MONGODB_URI${colors.reset}\n`);
    process.exit(1);
  }

  // Mask password in URI for display
  const maskedUri = mongoUri.replace(/:[^:@]+@/, ':****@');
  console.log(`${colors.blue}🔗 Connection String:${colors.reset} ${maskedUri}\n`);

  try {
    console.log(`${colors.yellow}⏳ Connecting to MongoDB...${colors.reset}`);

    await mongoose.connect(mongoUri);

    console.log(`${colors.green}✅ Successfully connected to MongoDB!${colors.reset}\n`);

    // Get database info
    const db = mongoose.connection.db;
    const admin = db.admin();

    console.log(`${colors.cyan}📊 Database Information:${colors.reset}`);
    console.log(`${colors.cyan}${'─'.repeat(50)}${colors.reset}`);

    // Database name
    console.log(`Database Name: ${colors.green}${db.databaseName}${colors.reset}`);

    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`Collections: ${colors.green}${collections.length}${colors.reset}`);

    if (collections.length > 0) {
      console.log(`\n${colors.cyan}📁 Existing Collections:${colors.reset}`);
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`  • ${collection.name}: ${colors.green}${count} documents${colors.reset}`);
      }
    } else {
      console.log(`${colors.yellow}\n⚠️  No collections found yet.${colors.reset}`);
      console.log(
        `${colors.yellow}Collections will be created automatically when you insert data.${colors.reset}`
      );
    }

    // Server info
    try {
      const serverStatus = await admin.serverStatus();
      console.log(`\n${colors.cyan}🖥️  Server Information:${colors.reset}`);
      console.log(`${colors.cyan}${'─'.repeat(50)}${colors.reset}`);
      console.log(`Version: ${colors.green}${serverStatus.version}${colors.reset}`);
      console.log(`Host: ${colors.green}${serverStatus.host}${colors.reset}`);
      console.log(
        `Uptime: ${colors.green}${Math.floor(serverStatus.uptime / 60)} minutes${colors.reset}`
      );
    } catch (error) {
      // Atlas doesn't allow serverStatus, skip this section
      console.log(`\n${colors.yellow}ℹ️  Using MongoDB Atlas (Cloud)${colors.reset}`);
    }

    console.log(`\n${colors.green}✅ Connection test completed successfully!${colors.reset}`);
    console.log(`${colors.green}✅ Your MongoDB is ready to use!${colors.reset}\n`);

    console.log(`${colors.cyan}Next steps:${colors.reset}`);
    console.log(
      `  1. Run: ${colors.yellow}node scripts/init-database.js${colors.reset} (to create admin user)`
    );
    console.log(`  2. Run: ${colors.yellow}npm run dev${colors.reset} (to start the server)`);
    console.log(
      `  3. Test API: ${colors.yellow}POST http://localhost:5000/api/v1/auth/register${colors.reset}\n`
    );
  } catch (error) {
    console.log(`${colors.red}❌ Connection failed!${colors.reset}\n`);
    console.log(`${colors.red}Error:${colors.reset} ${error.message}\n`);

    console.log(`${colors.yellow}Common solutions:${colors.reset}`);
    console.log(`  1. Check your MONGODB_URI in .env file`);
    console.log(`  2. For Atlas: Verify IP whitelist in Network Access`);
    console.log(`  3. For Atlas: Verify username and password`);
    console.log(`  4. For Local: Start MongoDB with: sudo systemctl start mongod`);
    console.log(`  5. For Local: Check if MongoDB is running: sudo systemctl status mongod\n`);

    console.log(`${colors.yellow}Need help? Check:${colors.reset}`);
    console.log(`  📖 MONGODB_SETUP_GUIDE.md\n`);

    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the test
testConnection();
