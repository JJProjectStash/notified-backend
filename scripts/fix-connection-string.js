#!/usr/bin/env node

/**
 * MongoDB Connection String Fixer
 * Helps you get the correct connection string
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

console.log(
  `${colors.cyan}${colors.bold}╔══════════════════════════════════════════════════════╗${colors.reset}`
);
console.log(
  `${colors.cyan}${colors.bold}║   MongoDB Connection String Helper                  ║${colors.reset}`
);
console.log(
  `${colors.cyan}${colors.bold}╚══════════════════════════════════════════════════════╝${colors.reset}\n`
);

console.log(`${colors.red}❌ Your current connection string is incomplete!${colors.reset}\n`);

console.log(`${colors.yellow}Current (broken):${colors.reset}`);
console.log(`mongodb+srv://username:password@cluster.mongodb.net/notified-db\n`);
console.log(
  `${colors.red}                                    ^^^^^^^ MISSING CLUSTER ID!${colors.reset}\n`
);

console.log(`${colors.green}Correct format should be:${colors.reset}`);
console.log(`mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/notified_db\n`);
console.log(
  `${colors.green}                                    ^^^^^^^ ^^^^^ CLUSTER ID!${colors.reset}\n`
);

console.log(`${colors.cyan}${colors.bold}📋 How to Fix (Step-by-Step):${colors.reset}\n`);

console.log(`${colors.yellow}Step 1:${colors.reset} Open MongoDB Atlas`);
console.log(`   Go to: ${colors.blue}https://cloud.mongodb.com/${colors.reset}\n`);

console.log(`${colors.yellow}Step 2:${colors.reset} Login to your account\n`);

console.log(`${colors.yellow}Step 3:${colors.reset} Click on your cluster`);
console.log(`   (You should see your cluster name on the dashboard)\n`);

console.log(
  `${colors.yellow}Step 4:${colors.reset} Click the ${colors.green}"Connect"${colors.reset} button\n`
);

console.log(
  `${colors.yellow}Step 5:${colors.reset} Choose ${colors.green}"Connect your application"${colors.reset}\n`
);

console.log(`${colors.yellow}Step 6:${colors.reset} Copy the connection string`);
console.log(`   It will look like:`);
console.log(
  `   ${colors.green}mongodb+srv://user:<password>@cluster0.xxxxx.mongodb.net/myFirstDatabase${colors.reset}\n`
);

console.log(`${colors.yellow}Step 7:${colors.reset} Modify it:`);
console.log(
  `   • Replace ${colors.red}<password>${colors.reset} with: ${colors.green}uCsM7xoBkvnMeXO1${colors.reset}`
);
console.log(
  `   • Replace ${colors.red}myFirstDatabase${colors.reset} with: ${colors.green}notified_db${colors.reset}`
);
console.log(`   • Keep everything else the same!\n`);

console.log(`${colors.yellow}Step 8:${colors.reset} Update your .env file`);
console.log(`   Open: ${colors.cyan}.env${colors.reset}`);
console.log(`   Find the line: ${colors.red}MONGODB_URI=...${colors.reset}`);
console.log(`   Replace with your new connection string\n`);

console.log(`${colors.cyan}${colors.bold}Example of correct .env line:${colors.reset}\n`);
console.log(
  `${colors.green}MONGODB_URI=mongodb+srv://dalupangjuztyneclever1:uCsM7xoBkvnMeXO1@cluster0.a1b2c3.mongodb.net/notified_db?retryWrites=true&w=majority${colors.reset}\n`
);
console.log(
  `${colors.yellow}                                                                   ^^^^^^^ ^^^^^^ YOUR CLUSTER ID WILL BE HERE${colors.reset}\n`
);

console.log(`${colors.cyan}${colors.bold}🔐 Security Note:${colors.reset}`);
console.log(`   Your password is visible in this file. After fixing:`);
console.log(`   1. ${colors.yellow}Never${colors.reset} commit the .env file to git`);
console.log(`   2. Consider changing your MongoDB password\n`);

console.log(`${colors.cyan}${colors.bold}✅ After updating your .env file:${colors.reset}\n`);
console.log(`   Run: ${colors.green}node scripts/test-db-connection.js${colors.reset}`);
console.log(`   Should see: ${colors.green}✅ Successfully connected to MongoDB!${colors.reset}\n`);

console.log(`${colors.cyan}${colors.bold}🆘 Still having issues?${colors.reset}\n`);
console.log(`   1. Make sure your IP is whitelisted in Atlas:`);
console.log(`      • Go to "Network Access" in Atlas`);
console.log(`      • Click "Add IP Address"`);
console.log(`      • Click "Allow Access from Anywhere" (for testing)`);
console.log(`      • Wait 1-2 minutes for it to apply\n`);
console.log(`   2. Verify your username and password in Atlas:`);
console.log(`      • Go to "Database Access"`);
console.log(`      • Check your username: ${colors.green}dalupangjuztyneclever1${colors.reset}`);
console.log(`      • Reset password if needed\n`);
console.log(`   3. Check the full guide:`);
console.log(`      • Read: ${colors.cyan}QUICKSTART_MONGODB.md${colors.reset}`);
console.log(`      • Or: ${colors.cyan}MONGODB_SETUP_GUIDE.md${colors.reset}\n`);
