# Quick Start - Testing Backend Fixes

## 🚀 Quick Setup

### 1. Restart the Backend Server

```bash
cd /home/josh/notified-backend

# Stop the server if it's running
# Ctrl+C or:
pm2 stop notified-backend

# Start the server
npm start
# OR with PM2:
pm2 start npm --name notified-backend -- start
```

### 2. Verify Server is Running

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "success": true,
  "message": "Server is running",
  "environment": "development",
  "timestamp": "2025-11-14T..."
}
```

---

## ✅ Test Each Fix

### Fix 1: Subjects Pagination (validatePagination)

```bash
# Get your auth token first
TOKEN="your-jwt-token-here"

# Test subjects endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/subjects?page=1&limit=10
```

**Expected:** Status 200, no "validatePagination" error

---

### Fix 2: Records Pagination (validatePagination)

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/records?page=1&limit=10
```

**Expected:** Status 200, no "validatePagination" error

---

### Fix 3: Subject Creation (isValidSubjectCode)

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectCode": "CS101",
    "subjectName": "Computer Science 101",
    "yearLevel": 1,
    "section": "A"
  }' \
  http://localhost:5000/api/v1/subjects
```

**Expected:** Status 201, subject created successfully

---

### Fix 4: Record Stats API

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/records/stats
```

**Expected:** Status 200 with proper JSON format:

```json
{
  "success": true,
  "data": {
    "total": 123,
    "byType": {...},
    "topPerformers": [...]
  }
}
```

---

### Fix 5: Email Endpoints

```bash
# Check email configuration
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/emails/config

# Expected: Status 200 (not 404)
```

---

### Fix 6: Student Hard Delete

```bash
# Create a test student
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentNumber": "25-9999",
    "firstName": "Test",
    "lastName": "Delete",
    "email": "test.delete@example.com",
    "guardianName": "Test Guardian"
  }' \
  http://localhost:5000/api/v1/students

# Get the student ID from response, then:
STUDENT_ID="the-id-from-response"

# Get count before
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/students | jq '.pagination.total'

# Delete the student
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/students/$STUDENT_ID

# Get count after
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/students | jq '.pagination.total'
```

**Expected:** Count decreases by 1 (hard delete confirmed)

---

## 🧪 Run Automated Test Suite

```bash
# Set up environment variables
export API_BASE_URL=http://localhost:5000/api/v1
export TEST_USER_EMAIL=admin@notified.com
export TEST_USER_PASSWORD=admin123

# Run the test suite
cd /home/josh/notified-backend
node scripts/test-backend-fixes.js
```

**Expected:** All tests pass (✅)

---

## 🧹 Run Database Cleanup (Optional)

```bash
cd /home/josh/notified-backend
node scripts/cleanup-database.js
```

This script will:

- Find orphaned records
- Check data integrity
- Display statistics
- Reindex collections

**Note:** The script is safe by default and won't delete data unless you uncomment the deletion code.

---

## 📧 Test Email Functionality

### Setup Email Configuration

Add to your `.env` file:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Notified <noreply@notified.com>
```

### Send Test Email

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}' \
  http://localhost:5000/api/v1/emails/test
```

**Expected:** Test email received in inbox

---

## 🎯 Frontend Integration Test

1. **Open the frontend** (http://localhost:5173)

2. **Test Dashboard:**
   - Verify all stat cards load
   - Check student count
   - Check subject count
   - Check record count

3. **Test Students Page:**
  ### Reset Database Contents

  If you need to wipe documents from all collections while preserving indexes and collection structure, you can use the reset script:

  ```bash
  node scripts/reset-db-contents.js --dry-run
  ```

  When ready, run without `--dry-run` and confirm the interactive prompt (or use `--force` to skip confirmation):

  ```bash
  node scripts/reset-db-contents.js --force --exclude=users
  ```

  Use `--include` to target specific collections only, for example: `--include=students,attendance`.

   - Create a new student
   - Edit the student
   - Delete the student
   - Verify count decreases

4. **Test Subjects Page:**
   - List subjects (pagination works)
   - Create a new subject (validation works)
   - Edit the subject
   - Delete the subject

5. **Test Records Page:**
   - List records (pagination works)
   - Filter by type
   - Filter by date

6. **Test Email Modal:**
   - Open email modal
   - Send single email
   - Send bulk email
   - Send guardian email

---

## 📊 Check Logs

```bash
# Real-time log monitoring
tail -f /home/josh/notified-backend/logs/combined.log

# Check for errors
tail -f /home/josh/notified-backend/logs/error.log

# Look for specific issues
grep -i "validatePagination" /home/josh/notified-backend/logs/error.log
grep -i "isValidSubjectCode" /home/josh/notified-backend/logs/error.log
grep -i "Cannot read properties" /home/josh/notified-backend/logs/error.log
```

**Expected:** No critical errors in logs

---

## ✅ Success Checklist

After testing, all of these should be ✅:

- [ ] Server starts without errors
- [ ] Health check returns 200
- [ ] Subjects pagination works
- [ ] Records pagination works
- [ ] Subject creation works
- [ ] Record stats API works
- [ ] Email config endpoint exists (not 404)
- [ ] Student deletion decreases count
- [ ] Dashboard loads all stats
- [ ] No "validatePagination" errors in logs
- [ ] No "isValidSubjectCode" errors in logs
- [ ] Test suite passes all tests

---

## 🐛 Troubleshooting

### Issue: "validatePagination" still undefined

**Solution:**

```bash
# Restart the server
pm2 restart notified-backend
# OR
npm start
```

### Issue: Email endpoints return 404

**Check:**

```bash
# Verify email routes are registered
grep -r "emailRoutes" /home/josh/notified-backend/src/app.js
```

### Issue: Test suite fails authentication

**Check:**

1. Server is running: `curl http://localhost:5000/health`
2. MongoDB is connected: `node scripts/test-db-connection.js`
3. User credentials are correct in `.env`

### Issue: Student count still wrong

**Run cleanup:**

```bash
node scripts/cleanup-database.js
```

---

## 📞 Need Help?

1. Check the full documentation: `documentation/BACKEND_FIXES_SUMMARY.md`
2. Review the logs: `tail -f logs/error.log`
3. Run the test suite: `node scripts/test-backend-fixes.js`

---

**Last Updated:** November 14, 2025  
**Status:** Ready for Testing
