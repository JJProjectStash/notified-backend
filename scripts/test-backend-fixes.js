/**
 * Backend Fixes Verification Script
 * Tests all critical fixes implemented
 *
 * @author Notified Development Team
 * @version 1.0.0
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let authToken = '';
let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Helper function to log test results
const logTest = (testName, passed, message = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? colors.green : colors.red;
  console.log(`${color}${status}${colors.reset} - ${testName}`);
  if (message) console.log(`  ${message}`);

  testResults.tests.push({ testName, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
};

// Test 1: Authentication
const testAuthentication = async () => {
  console.log(`\n${colors.blue}=== Test 1: Authentication ===${colors.reset}`);

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: process.env.TEST_USER_EMAIL || 'admin@notified.com',
      password: process.env.TEST_USER_PASSWORD || 'admin123',
    });

    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      logTest('Login successful', true, `Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logTest('Login failed', false, 'No token received');
      return false;
    }
  } catch (error) {
    logTest('Login failed', false, error.response?.data?.message || error.message);
    return false;
  }
};

// Test 2: validatePagination - Subjects endpoint
const testSubjectsPagination = async () => {
  console.log(
    `\n${colors.blue}=== Test 2: Subjects Pagination (validatePagination fix) ===${colors.reset}`
  );

  try {
    const response = await axios.get(`${API_BASE_URL}/subjects?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.status === 200 && response.data.success) {
      logTest(
        'GET /subjects with pagination',
        true,
        `Found ${response.data.pagination?.total || 0} subjects`
      );
      return true;
    } else {
      logTest('GET /subjects with pagination', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const isPaginationError = errorMsg.includes('validatePagination');
    logTest('GET /subjects with pagination', false, errorMsg);
    if (isPaginationError) {
      console.log(
        `  ${colors.red}❌ CRITICAL: validatePagination error still exists!${colors.reset}`
      );
    }
    return false;
  }
};

// Test 3: validatePagination - Records endpoint
const testRecordsPagination = async () => {
  console.log(
    `\n${colors.blue}=== Test 3: Records Pagination (validatePagination fix) ===${colors.reset}`
  );

  try {
    const response = await axios.get(`${API_BASE_URL}/records?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.status === 200 && response.data.success) {
      logTest(
        'GET /records with pagination',
        true,
        `Found ${response.data.pagination?.total || 0} records`
      );
      return true;
    } else {
      logTest('GET /records with pagination', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const isPaginationError = errorMsg.includes('validatePagination');
    logTest('GET /records with pagination', false, errorMsg);
    if (isPaginationError) {
      console.log(
        `  ${colors.red}❌ CRITICAL: validatePagination error still exists!${colors.reset}`
      );
    }
    return false;
  }
};

// Test 4: isValidSubjectCode - Create subject
const testSubjectCreation = async () => {
  console.log(
    `\n${colors.blue}=== Test 4: Subject Creation (isValidSubjectCode fix) ===${colors.reset}`
  );

  const testSubject = {
    subjectCode: `TEST-${Date.now()}`,
    subjectName: 'Test Subject for Validation',
    yearLevel: 1,
    section: 'A',
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/subjects`, testSubject, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.status === 201 && response.data.success) {
      logTest('POST /subjects (create)', true, `Created subject: ${testSubject.subjectCode}`);

      // Clean up - delete the test subject
      try {
        await axios.delete(`${API_BASE_URL}/subjects/${response.data.data._id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (e) {
        // Ignore cleanup errors
      }

      return true;
    } else {
      logTest('POST /subjects (create)', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const isValidationError = errorMsg.includes('isValidSubjectCode');
    logTest('POST /subjects (create)', false, errorMsg);
    if (isValidationError) {
      console.log(
        `  ${colors.red}❌ CRITICAL: isValidSubjectCode error still exists!${colors.reset}`
      );
    }
    return false;
  }
};

// Test 5: Record Stats API
const testRecordStats = async () => {
  console.log(
    `\n${colors.blue}=== Test 5: Record Stats API (response format fix) ===${colors.reset}`
  );

  try {
    const response = await axios.get(`${API_BASE_URL}/records/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.status === 200 && response.data.success) {
      logTest('GET /records/stats', true, `Total records: ${response.data.data?.total || 0}`);
      console.log(`  Stats:`, JSON.stringify(response.data.data, null, 2));
      return true;
    } else {
      logTest('GET /records/stats', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const isFormatError = errorMsg.includes('success');
    logTest('GET /records/stats', false, errorMsg);
    if (isFormatError) {
      console.log(`  ${colors.red}❌ CRITICAL: Response format error still exists!${colors.reset}`);
    }
    return false;
  }
};

// Test 6: Email Configuration Status
const testEmailConfig = async () => {
  console.log(`\n${colors.blue}=== Test 6: Email Service Endpoints ===${colors.reset}`);

  try {
    const response = await axios.get(`${API_BASE_URL}/emails/config`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.status === 200 && response.data.success) {
      const config = response.data.data;
      logTest(
        'GET /emails/config',
        true,
        `Configured: ${config.configured}, Valid: ${config.connectionValid}`
      );
      console.log(`  Email Provider: ${config.provider}`);
      console.log(`  From Address: ${config.from}`);
      return true;
    } else {
      logTest('GET /emails/config', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    const is404 = error.response?.status === 404;
    const errorMsg = error.response?.data?.message || error.message;
    logTest('GET /emails/config', !is404, errorMsg);
    if (is404) {
      console.log(`  ${colors.red}❌ CRITICAL: Email endpoints not found!${colors.reset}`);
    }
    return !is404;
  }
};

// Test 7: Student CRUD operations
const testStudentOperations = async () => {
  console.log(
    `\n${colors.blue}=== Test 7: Student CRUD Operations (hard delete fix) ===${colors.reset}`
  );

  const testStudent = {
    studentNumber: `99-9999`,
    firstName: 'Test',
    lastName: 'Student',
    email: `test.student.${Date.now()}@example.com`,
    guardianName: 'Test Guardian',
    guardianEmail: 'guardian@example.com',
  };

  let studentId = null;

  try {
    // Create student
    const createResponse = await axios.post(`${API_BASE_URL}/students`, testStudent, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (createResponse.status === 201 && createResponse.data.success) {
      studentId = createResponse.data.data._id;
      logTest('POST /students (create)', true, `Created student: ${testStudent.studentNumber}`);
    } else {
      logTest('POST /students (create)', false, 'Failed to create student');
      return false;
    }

    // Get student count before deletion
    const beforeResponse = await axios.get(`${API_BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const countBefore = beforeResponse.data.pagination?.total || 0;

    // Delete student
    const deleteResponse = await axios.delete(`${API_BASE_URL}/students/${studentId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (deleteResponse.status === 200 && deleteResponse.data.success) {
      logTest('DELETE /students/:id', true, 'Student deleted');
    } else {
      logTest('DELETE /students/:id', false, 'Failed to delete student');
      return false;
    }

    // Verify student is actually removed (not just soft-deleted)
    const afterResponse = await axios.get(`${API_BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const countAfter = afterResponse.data.pagination?.total || 0;

    const wasHardDeleted = countAfter < countBefore;
    logTest(
      'Student hard delete verification',
      wasHardDeleted,
      `Before: ${countBefore}, After: ${countAfter}`
    );

    return wasHardDeleted;
  } catch (error) {
    logTest('Student CRUD operations', false, error.response?.data?.message || error.message);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log(`${colors.blue}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  Backend Fixes Verification Test Suite        ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`API Base URL: ${API_BASE_URL}`);

  // Run tests
  const authSuccess = await testAuthentication();

  if (!authSuccess) {
    console.log(
      `\n${colors.red}❌ Authentication failed. Cannot proceed with other tests.${colors.reset}`
    );
    console.log(`${colors.yellow}Please check:${colors.reset}`);
    console.log(`  1. Backend server is running`);
    console.log(`  2. MongoDB is connected`);
    console.log(`  3. Test user credentials are correct`);
    process.exit(1);
  }

  await testSubjectsPagination();
  await testRecordsPagination();
  await testSubjectCreation();
  await testRecordStats();
  await testEmailConfig();
  await testStudentOperations();

  // Print summary
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  Test Summary                                  ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════╝${colors.reset}`);

  const totalTests = testResults.passed + testResults.failed;
  const passRate = ((testResults.passed / totalTests) * 100).toFixed(1);

  console.log(`${colors.green}✅ Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.blue}📊 Pass Rate: ${passRate}%${colors.reset}`);

  if (testResults.failed === 0) {
    console.log(
      `\n${colors.green}🎉 All tests passed! Backend fixes verified successfully.${colors.reset}`
    );
  } else {
    console.log(
      `\n${colors.yellow}⚠️  Some tests failed. Please review the output above.${colors.reset}`
    );
  }

  process.exit(testResults.failed === 0 ? 0 : 1);
};

// Run the tests
runAllTests().catch((error) => {
  console.error(`${colors.red}❌ Test suite failed:${colors.reset}`, error.message);
  process.exit(1);
});
