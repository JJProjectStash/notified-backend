#!/usr/bin/env node

/**
 * Environment Configuration Wizard
 * Helps set up JWT, Email, and other settings
 */

const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function configureEnv() {
  console.log(
    `${colors.cyan}${colors.bold}╔════════════════════════════════════════════╗${colors.reset}`
  );
  console.log(
    `${colors.cyan}${colors.bold}║   Environment Configuration Wizard        ║${colors.reset}`
  );
  console.log(
    `${colors.cyan}${colors.bold}╚════════════════════════════════════════════╝${colors.reset}\n`
  );

  console.log(`${colors.yellow}This wizard will help you configure:${colors.reset}`);
  console.log(`  1. JWT Secrets (Security)`);
  console.log(`  2. Email Settings (Optional)`);
  console.log(`  3. Rate Limiting`);
  console.log(`  4. Logging\n`);

  const envPath = '.env';

  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.red}❌ .env file not found!${colors.reset}`);
    console.log(`${colors.yellow}Run ./setup.sh first to create .env file${colors.reset}\n`);
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, 'utf8');

  console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.cyan}${colors.bold}1. JWT Configuration${colors.reset}\n`);

  const currentJwtSecret = envContent.match(/JWT_SECRET=(.+)/)?.[1] || '';
  const currentRefreshSecret = envContent.match(/JWT_REFRESH_SECRET=(.+)/)?.[1] || '';

  if (
    currentJwtSecret.includes('change-this') ||
    currentJwtSecret === 'your-super-secret-jwt-key-change-this-in-production'
  ) {
    console.log(`${colors.yellow}⚠️  You're using default JWT secrets!${colors.reset}`);
    console.log(
      `${colors.yellow}This is INSECURE. Let me generate secure ones...${colors.reset}\n`
    );

    const newJwtSecret = crypto.randomBytes(64).toString('hex');
    const newRefreshSecret = crypto.randomBytes(64).toString('hex');

    envContent = envContent.replace(/JWT_SECRET=.+/, `JWT_SECRET=${newJwtSecret}`);
    envContent = envContent.replace(
      /JWT_REFRESH_SECRET=.+/,
      `JWT_REFRESH_SECRET=${newRefreshSecret}`
    );

    console.log(`${colors.green}✅ Generated secure JWT secrets!${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✅ JWT secrets already configured${colors.reset}\n`);
  }

  console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.cyan}${colors.bold}2. Email Configuration${colors.reset}\n`);

  const configureEmail = await ask(
    `${colors.yellow}Do you want to configure email now? (y/n): ${colors.reset}`
  );

  if (configureEmail.toLowerCase() === 'y') {
    console.log(`\n${colors.cyan}Choose email provider:${colors.reset}`);
    console.log(`  1. Gmail (for production/testing)`);
    console.log(`  2. Mailtrap (for development - emails don't actually send)`);
    console.log(`  3. SendGrid (for production)`);
    console.log(`  4. Skip for now\n`);

    const emailChoice = await ask(`${colors.yellow}Enter choice (1-4): ${colors.reset}`);

    switch (emailChoice) {
      case '1': // Gmail
        console.log(`\n${colors.cyan}Gmail Setup:${colors.reset}`);
        console.log(`${colors.yellow}You need a Gmail App Password.${colors.reset}`);
        console.log(
          `${colors.yellow}Get it from: https://myaccount.google.com/apppasswords${colors.reset}\n`
        );

        const gmailAddress = await ask('Enter your Gmail address: ');
        const gmailPassword = await ask('Enter your Gmail App Password: ');

        envContent = envContent.replace(/EMAIL_HOST=.+/, 'EMAIL_HOST=smtp.gmail.com');
        envContent = envContent.replace(/EMAIL_PORT=.+/, 'EMAIL_PORT=587');
        envContent = envContent.replace(/EMAIL_USERNAME=.+/, `EMAIL_USERNAME=${gmailAddress}`);
        envContent = envContent.replace(/EMAIL_PASSWORD=.+/, `EMAIL_PASSWORD=${gmailPassword}`);

        console.log(`${colors.green}✅ Gmail configured!${colors.reset}\n`);
        break;

      case '2': // Mailtrap
        console.log(`\n${colors.cyan}Mailtrap Setup:${colors.reset}`);
        console.log(`${colors.yellow}Get credentials from: https://mailtrap.io/${colors.reset}\n`);

        const mailtrapUser = await ask('Enter Mailtrap username: ');
        const mailtrapPass = await ask('Enter Mailtrap password: ');

        envContent = envContent.replace(/EMAIL_HOST=.+/, 'EMAIL_HOST=smtp.mailtrap.io');
        envContent = envContent.replace(/EMAIL_PORT=.+/, 'EMAIL_PORT=2525');
        envContent = envContent.replace(/EMAIL_USERNAME=.+/, `EMAIL_USERNAME=${mailtrapUser}`);
        envContent = envContent.replace(/EMAIL_PASSWORD=.+/, `EMAIL_PASSWORD=${mailtrapPass}`);

        console.log(`${colors.green}✅ Mailtrap configured!${colors.reset}\n`);
        break;

      case '3': // SendGrid
        console.log(`\n${colors.cyan}SendGrid Setup:${colors.reset}`);
        console.log(`${colors.yellow}Get API key from: https://app.sendgrid.com/${colors.reset}\n`);

        const sendgridKey = await ask('Enter SendGrid API Key: ');

        envContent = envContent.replace(/EMAIL_HOST=.+/, 'EMAIL_HOST=smtp.sendgrid.net');
        envContent = envContent.replace(/EMAIL_PORT=.+/, 'EMAIL_PORT=587');
        envContent = envContent.replace(/EMAIL_USERNAME=.+/, 'EMAIL_USERNAME=apikey');
        envContent = envContent.replace(/EMAIL_PASSWORD=.+/, `EMAIL_PASSWORD=${sendgridKey}`);

        console.log(`${colors.green}✅ SendGrid configured!${colors.reset}\n`);
        break;

      default:
        console.log(`${colors.yellow}⏭️  Skipping email configuration${colors.reset}\n`);
    }
  } else {
    console.log(`${colors.yellow}⏭️  Skipping email configuration${colors.reset}\n`);
  }

  console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.cyan}${colors.bold}3. Rate Limiting${colors.reset}\n`);

  const adjustRateLimit = await ask(
    `${colors.yellow}Adjust rate limiting? (y/n, current: 100 req/15min): ${colors.reset}`
  );

  if (adjustRateLimit.toLowerCase() === 'y') {
    console.log(`\n${colors.cyan}Recommended settings:${colors.reset}`);
    console.log(`  Development: 1000 requests / 15 minutes`);
    console.log(`  Production: 100 requests / 15 minutes`);
    console.log(`  Strict: 50 requests / 1 minute\n`);

    const maxRequests = (await ask('Max requests (default 100): ')) || '100';
    const windowMinutes = (await ask('Window in minutes (default 15): ')) || '15';
    const windowMs = parseInt(windowMinutes) * 60 * 1000;

    envContent = envContent.replace(/RATE_LIMIT_WINDOW_MS=.+/, `RATE_LIMIT_WINDOW_MS=${windowMs}`);
    envContent = envContent.replace(
      /RATE_LIMIT_MAX_REQUESTS=.+/,
      `RATE_LIMIT_MAX_REQUESTS=${maxRequests}`
    );

    console.log(
      `${colors.green}✅ Rate limiting configured: ${maxRequests} requests / ${windowMinutes} minutes${colors.reset}\n`
    );
  } else {
    console.log(`${colors.green}✅ Keeping current rate limit settings${colors.reset}\n`);
  }

  console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.cyan}${colors.bold}4. Logging${colors.reset}\n`);

  const adjustLogging = await ask(
    `${colors.yellow}Adjust logging level? (y/n, current: info): ${colors.reset}`
  );

  if (adjustLogging.toLowerCase() === 'y') {
    console.log(`\n${colors.cyan}Log levels:${colors.reset}`);
    console.log(`  1. error - Only errors (production)`);
    console.log(`  2. warn - Warnings and errors`);
    console.log(`  3. info - Info, warnings, errors (recommended)`);
    console.log(`  4. debug - Everything (development)\n`);

    const logChoice = await ask('Enter choice (1-4): ');
    const logLevels = { 1: 'error', 2: 'warn', 3: 'info', 4: 'debug' };
    const logLevel = logLevels[logChoice] || 'info';

    envContent = envContent.replace(/LOG_LEVEL=.+/, `LOG_LEVEL=${logLevel}`);

    console.log(`${colors.green}✅ Log level set to: ${logLevel}${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✅ Keeping current log level${colors.reset}\n`);
  }

  // Save .env file
  fs.writeFileSync(envPath, envContent);

  console.log(
    `${colors.green}${colors.bold}╔════════════════════════════════════════════╗${colors.reset}`
  );
  console.log(
    `${colors.green}${colors.bold}║   ✅ Configuration Complete!               ║${colors.reset}`
  );
  console.log(
    `${colors.green}${colors.bold}╚════════════════════════════════════════════╝${colors.reset}\n`
  );

  console.log(`${colors.cyan}📋 Summary:${colors.reset}`);
  console.log(`  ✅ JWT secrets configured`);
  console.log(`  ✅ .env file updated`);
  console.log(`  ✅ Ready for development!\n`);

  console.log(`${colors.cyan}🚀 Next steps:${colors.reset}`);
  console.log(
    `  1. Test MongoDB: ${colors.yellow}node scripts/test-db-connection.js${colors.reset}`
  );
  console.log(`  2. Initialize DB: ${colors.yellow}node scripts/init-database.js${colors.reset}`);
  console.log(`  3. Start server: ${colors.yellow}npm run dev${colors.reset}\n`);

  console.log(`${colors.cyan}📚 Documentation:${colors.reset}`);
  console.log(`  • Full guide: ${colors.yellow}CONFIGURATION_GUIDE.md${colors.reset}`);
  console.log(`  • MongoDB setup: ${colors.yellow}MONGODB_FOR_BEGINNERS.md${colors.reset}\n`);

  rl.close();
}

configureEnv().catch((error) => {
  console.error(`${colors.red}Error:${colors.reset}`, error.message);
  rl.close();
  process.exit(1);
});
