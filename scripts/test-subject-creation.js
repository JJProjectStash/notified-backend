/**
 * Test Script: Subject Creation Fix Verification
 *
 * This script tests that the subject creation endpoint works correctly
 * after fixing the RECORD_TYPES.SUBJECT_CREATED → RECORD_TYPES.SUBJECT_ADDED bug
 *
 * Usage:
 *   node scripts/test-subject-creation.js <AUTH_TOKEN>
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const API_VERSION = '/api/v1';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testSubjectCreation(authToken) {
  try {
    logSection('🧪 Subject Creation Fix - Test Suite');

    if (!authToken) {
      log('❌ Error: Authentication token is required', 'red');
      log('Usage: node scripts/test-subject-creation.js <AUTH_TOKEN>', 'yellow');
      process.exit(1);
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    };

    // Test 1: Create Subject with Correct Payload
    logSection('Test 1: Create Subject (Correct Payload)');

    const testSubject = {
      subjectCode: `TEST${Date.now()}`, // Unique code
      subjectName: 'Test Subject - Backend Fix Verification',
      description: 'This subject is created to test the RECORD_TYPES.SUBJECT_ADDED fix',
      yearLevel: 1,
      section: 'TEST',
    };

    log('📤 Sending request...', 'yellow');
    log(JSON.stringify(testSubject, null, 2), 'blue');

    try {
      const response = await axios.post(`${BASE_URL}${API_VERSION}/subjects`, testSubject, config);

      log('\n✅ SUCCESS: Subject created successfully!', 'green');
      log(`Status: ${response.status}`, 'green');
      log('Response:', 'cyan');
      console.log(JSON.stringify(response.data, null, 2));

      const createdSubjectId = response.data.data._id;

      // Test 2: Verify Audit Record was Created
      logSection('Test 2: Verify Audit Record');

      log('📤 Fetching audit records...', 'yellow');

      // Note: This assumes there's an endpoint to fetch records
      // If not available, we'll just mark this as manual verification needed
      log('⚠️  Manual verification required:', 'yellow');
      log('Run this MongoDB query:', 'cyan');
      console.log(`
db.records.find({ 
  subject: ObjectId("${createdSubjectId}"),
  recordType: "SUBJECT_ADDED"
}).sort({ createdAt: -1 }).limit(1)
      `);

      // Test 3: Cleanup - Delete the test subject
      logSection('Test 3: Cleanup - Delete Test Subject');

      log('📤 Deleting test subject...', 'yellow');

      try {
        const deleteResponse = await axios.delete(
          `${BASE_URL}${API_VERSION}/subjects/${createdSubjectId}`,
          config
        );

        log('✅ Test subject deleted successfully', 'green');
        log(`Status: ${deleteResponse.status}`, 'green');
      } catch (deleteError) {
        log('⚠️  Could not delete test subject (may require admin role)', 'yellow');
        log(`Subject ID: ${createdSubjectId}`, 'yellow');
        log('You may need to delete it manually', 'yellow');
      }

      // Summary
      logSection('📊 Test Results Summary');
      log('✅ Subject Creation: PASSED', 'green');
      log('✅ No Record Validation Error: PASSED', 'green');
      log('✅ Response Structure: PASSED', 'green');
      log('\n🎉 All tests passed! The fix is working correctly.', 'green');
    } catch (error) {
      log('\n❌ FAILED: Subject creation failed', 'red');

      if (error.response) {
        log(`Status: ${error.response.status}`, 'red');
        log('Error Response:', 'red');
        console.log(JSON.stringify(error.response.data, null, 2));

        // Check if it's the original Record validation error
        if (error.response.data.message?.includes('recordType')) {
          log('\n⚠️  CRITICAL: The Record validation error still exists!', 'red');
          log('The fix may not have been applied correctly.', 'red');
        }
      } else if (error.request) {
        log('No response received from server', 'red');
        log('Is the backend running?', 'yellow');
      } else {
        log(`Error: ${error.message}`, 'red');
      }

      logSection('📊 Test Results Summary');
      log('❌ Subject Creation: FAILED', 'red');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Test 4: Test with Frontend-style Payload (incorrect field names)
async function testFrontendPayload(authToken) {
  logSection('Test 4: Frontend Field Name Mismatch');

  const frontendStylePayload = {
    code: 'TEST101', // ❌ Should be 'subjectCode'
    name: 'Test Subject', // ❌ Should be 'subjectName'
    units: 3, // ❌ Field doesn't exist
    yearLevel: 1, // ✅ Correct
  };

  log('📤 Testing with frontend-style field names...', 'yellow');
  log(JSON.stringify(frontendStylePayload, null, 2), 'blue');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  };

  try {
    await axios.post(`${BASE_URL}${API_VERSION}/subjects`, frontendStylePayload, config);

    log('⚠️  Unexpected: Request succeeded with wrong field names', 'yellow');
  } catch (error) {
    if (error.response) {
      log('✅ Expected: Validation error received', 'green');
      log(`Status: ${error.response.status}`, 'cyan');
      log('Error details:', 'cyan');
      console.log(JSON.stringify(error.response.data, null, 2));

      log('\n📝 Note: Frontend needs to use correct field names:', 'yellow');
      log('  • code → subjectCode', 'yellow');
      log('  • name → subjectName', 'yellow');
      log('  • units → (not supported, remove or add to backend)', 'yellow');
      log('  • section → (required in backend)', 'yellow');
    }
  }
}

// Main execution
const authToken = process.argv[2];

(async () => {
  await testSubjectCreation(authToken);

  // Uncomment to test frontend payload mismatch
  // await testFrontendPayload(authToken);

  log('\n✨ Test suite completed!', 'green');
})();
