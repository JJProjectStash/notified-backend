#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * Tests if your email settings are working correctly
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

async function testEmailConfig() {
  console.log(
    `${colors.cyan}${colors.bold}╔════════════════════════════════════════════╗${colors.reset}`
  );
  console.log(
    `${colors.cyan}${colors.bold}║   Email Configuration Test                ║${colors.reset}`
  );
  console.log(
    `${colors.cyan}${colors.bold}╚════════════════════════════════════════════╝${colors.reset}\n`
  );

  // Check if email is configured
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_PORT ||
    !process.env.EMAIL_USERNAME ||
    !process.env.EMAIL_PASSWORD
  ) {
    console.log(`${colors.red}❌ Email not configured in .env file${colors.reset}\n`);
    console.log(`${colors.yellow}Required settings:${colors.reset}`);
    console.log(`  EMAIL_HOST`);
    console.log(`  EMAIL_PORT`);
    console.log(`  EMAIL_USERNAME`);
    console.log(`  EMAIL_PASSWORD\n`);
    console.log(
      `${colors.cyan}Run: ${colors.yellow}node scripts/configure-env.js${colors.cyan} to set up email${colors.reset}\n`
    );
    process.exit(1);
  }

  console.log(`${colors.cyan}📋 Current Configuration:${colors.reset}`);
  console.log(`  Host: ${colors.yellow}${process.env.EMAIL_HOST}${colors.reset}`);
  console.log(`  Port: ${colors.yellow}${process.env.EMAIL_PORT}${colors.reset}`);
  console.log(`  Username: ${colors.yellow}${process.env.EMAIL_USERNAME}${colors.reset}`);
  console.log(`  From: ${colors.yellow}${process.env.EMAIL_FROM}${colors.reset}\n`);

  try {
    console.log(`${colors.cyan}🔄 Creating email transporter...${colors.reset}`);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log(`${colors.green}✅ Transporter created${colors.reset}\n`);

    console.log(`${colors.cyan}🔄 Verifying connection...${colors.reset}`);
    await transporter.verify();
    console.log(`${colors.green}✅ Connection verified${colors.reset}\n`);

    console.log(`${colors.cyan}🔄 Sending test email...${colors.reset}`);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USERNAME, // Send to yourself
      subject: '✅ Notified Backend - Email Test Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">✅ Email Configuration Successful!</h1>
          <p>Your email configuration is working correctly.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <h2>Configuration Details:</h2>
          <ul>
            <li><strong>Host:</strong> ${process.env.EMAIL_HOST}</li>
            <li><strong>Port:</strong> ${process.env.EMAIL_PORT}</li>
            <li><strong>From:</strong> ${process.env.EMAIL_FROM}</li>
          </ul>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated test email from the Notified Backend system.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            Timestamp: ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    console.log(`${colors.green}✅ Test email sent successfully!${colors.reset}\n`);
    console.log(`${colors.cyan}📧 Email Details:${colors.reset}`);
    console.log(`  Message ID: ${colors.yellow}${info.messageId}${colors.reset}`);
    console.log(`  To: ${colors.yellow}${process.env.EMAIL_USERNAME}${colors.reset}\n`);

    if (process.env.EMAIL_HOST.includes('mailtrap')) {
      console.log(`${colors.yellow}📬 Check your Mailtrap inbox at:${colors.reset}`);
      console.log(`${colors.yellow}   https://mailtrap.io/inboxes${colors.reset}\n`);
    } else if (process.env.EMAIL_HOST.includes('gmail')) {
      console.log(`${colors.yellow}📬 Check your Gmail inbox${colors.reset}\n`);
    }

    console.log(
      `${colors.green}${colors.bold}╔════════════════════════════════════════════╗${colors.reset}`
    );
    console.log(
      `${colors.green}${colors.bold}║   ✅ All Email Tests Passed!               ║${colors.reset}`
    );
    console.log(
      `${colors.green}${colors.bold}╚════════════════════════════════════════════╝${colors.reset}\n`
    );

    console.log(`${colors.cyan}✨ Your email is ready to use!${colors.reset}`);
    console.log(
      `${colors.cyan}The attendance service will now send notifications for absences/tardiness.${colors.reset}\n`
    );
  } catch (error) {
    console.log(`${colors.red}${colors.bold}❌ Email Test Failed${colors.reset}\n`);
    console.log(`${colors.red}Error: ${error.message}${colors.reset}\n`);

    console.log(`${colors.yellow}🔧 Troubleshooting:${colors.reset}\n`);

    if (error.code === 'EAUTH') {
      console.log(`${colors.yellow}Authentication failed. Check:${colors.reset}`);
      console.log(`  • Username and password are correct`);
      console.log(`  • For Gmail, use App Password (not regular password)`);
      console.log(`  • Get Gmail App Password: https://myaccount.google.com/apppasswords\n`);
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.log(`${colors.yellow}Connection failed. Check:${colors.reset}`);
      console.log(`  • Email host and port are correct`);
      console.log(`  • Firewall is not blocking the connection`);
      console.log(`  • Internet connection is stable\n`);
    } else {
      console.log(`${colors.yellow}Check your email configuration in .env file${colors.reset}`);
      console.log(
        `${colors.yellow}Run: node scripts/configure-env.js to reconfigure${colors.reset}\n`
      );
    }

    console.log(`${colors.cyan}📚 See CONFIGURATION_GUIDE.md for detailed help${colors.reset}\n`);
    process.exit(1);
  }
}

testEmailConfig();
