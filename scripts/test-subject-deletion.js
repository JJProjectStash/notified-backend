/**
 * Test Script: Subject Deletion (Hard Delete) Verification
 *
 * Usage:
 *   node scripts/test-subject-deletion.js <AUTH_TOKEN>
 *
 * Verifies that subjects are hard-deleted and do not appear in GET /subjects
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const API_VERSION = '/api/v1';

async function main(authToken) {
  if (!authToken) {
    console.error('Usage: node scripts/test-subject-deletion.js <AUTH_TOKEN>');
    process.exit(1);
  }

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  try {
    // Create a new subject
    const testSubject = {
      subjectCode: `DEL${Date.now()}`,
      subjectName: 'Delete Test Subject',
      description: 'Subject for testing DELETE behavior',
      yearLevel: 1,
      section: 'A',
    };

    console.log('Creating subject...');
    const createRes = await axios.post(`${BASE_URL}${API_VERSION}/subjects`, testSubject, {
      ...config,
      headers: { 'Content-Type': 'application/json', ...config.headers },
    });
    const created = createRes.data.data;
    console.log('Created subject:', created._id, created.subjectCode);

    // Delete the subject
    console.log('Deleting subject...');
    await axios.delete(`${BASE_URL}${API_VERSION}/subjects/${created._id}`, config);
    console.log('Deleted subject successfully');

    // Verify that GET /subjects (without specifying isActive) does NOT return the deleted subject
    console.log('Fetching subjects (default isActive=true)...');
    const listRes = await axios.get(`${BASE_URL}${API_VERSION}/subjects`, config);
    const subjects = listRes.data.data;

    const found = subjects.find((s) => s._id === created._id);

    if (found) {
      console.error('❌ Failure: Deleted subject is still present in GET /subjects');
      console.log('Subject found:', found);
      process.exit(1);
    }

    console.log('✅ Success: Deleted subject not found in GET /subjects');

    // Try to fetch by ID (should return 404)
    try {
      await axios.get(`${BASE_URL}${API_VERSION}/subjects/${created._id}`, config);
      console.error('❌ Failure: GET /subjects/:id returned deleted subject');
      process.exit(1);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('✅ Success: GET by id returns 404 for deleted subject');
      } else {
        console.error('❌ Failure: Unexpected error while fetching deleted subject by id:');
        console.error(err.response ? err.response.data : err.message);
        process.exit(1);
      }
    }

    console.log('\nAll deletion checks passed.');
    process.exit(0);
  } catch (err) {
    console.error('Error during test:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

const token = process.argv[2];
main(token);
