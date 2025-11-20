# 🚀 Quick Start Guide - Attendance Backend

## ✅ What's Been Implemented

All **7 frontend-required attendance endpoints** are now ready to use!

---

## 📦 Prerequisites

Make sure you have:
- ✅ Node.js v18+ installed
- ✅ MongoDB running (local or Atlas)
- ✅ `.env` file configured

---

## ⚡ Quick Start (3 Steps)

### Step 1: Start the Server

```bash
cd notified-backend
npm run dev
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running in development mode on port 5000
```

---

### Step 2: Test the Endpoints

Run the comprehensive test script:

```bash
node scripts/test-attendance-endpoints.js
```

Expected output:
```
🚀 Starting Attendance Endpoints Tests
============================================================

📦 Creating test data...
✅ Test user found: staff@school.com
✅ Test students found: John Doe Jane Smith
✅ Test subject found: Introduction to Programming

🧪 Test 1: POST /api/attendance/mark
✅ Single attendance marked successfully

🧪 Test 2: POST /api/attendance/bulk-mark
✅ Bulk attendance marked successfully

🧪 Test 3: GET /api/attendance/records
✅ Attendance records retrieved successfully

🧪 Test 4: GET /api/attendance/summary/daily/:date
✅ Daily summary retrieved successfully

🧪 Test 5: GET /api/attendance/summary/students
✅ Students summary retrieved successfully

🧪 Test 6: GET /api/attendance/export/excel
✅ Excel export successful

============================================================
📊 TEST SUMMARY

✅ Mark Single Attendance
✅ Bulk Mark Attendance
✅ Get Attendance Records
✅ Get Daily Summary
✅ Get Students Summary
✅ Export to Excel

============================================================
Total: 6 | Passed: 6 | Failed: 0

🎉 All tests passed!
```

---

### Step 3: Import Postman Collection

1. Open Postman
2. Import → `Notified_API.postman_collection.json`
3. Set variables:
   - `baseUrl`: `http://localhost:5000/api/v1`
   - `accessToken`: Get from login endpoint
4. Test all 12 attendance endpoints!

---

## 📋 Available Endpoints

### New Endpoints (Frontend Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/attendance/mark` | Mark single attendance |
| POST | `/api/attendance/bulk-mark` | Bulk mark attendance |
| GET | `/api/attendance/records` | Get filtered records |
| GET | `/api/attendance/summary/daily/:date` | Daily summary |
| GET | `/api/attendance/summary/students` | Students summary |
| POST | `/api/attendance/import/excel` | Import from Excel |
| GET | `/api/attendance/export/excel` | Export to Excel |

### Existing Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/attendance/range` | Get by date range |
| GET | `/api/attendance/student/:id` | Student attendance |
| GET | `/api/attendance/subject/:id` | Subject attendance |
| GET | `/api/attendance/student/:id/summary` | Student summary |
| GET | `/api/attendance/subject/:id/today` | Today's attendance |
| PUT | `/api/attendance/:id` | Update attendance |
| DELETE | `/api/attendance/:id` | Delete attendance |

---

## 🧪 Manual Testing with cURL

### 1. Login First
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"staff@school.com\",\"password\":\"yourpassword\"}"
```

Save the token from response.

### 2. Mark Attendance
```bash
curl -X POST http://localhost:5000/api/v1/attendance/mark \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{
    \"studentId\": \"YOUR_STUDENT_ID\",
    \"subjectId\": \"YOUR_SUBJECT_ID\",
    \"date\": \"2025-11-16T00:00:00.000Z\",
    \"status\": \"present\"
  }"
```

### 3. Get Records
```bash
curl -X GET "http://localhost:5000/api/v1/attendance/records?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Get Daily Summary
```bash
curl -X GET "http://localhost:5000/api/v1/attendance/summary/daily/2025-11-16" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Export to Excel
```bash
curl -X GET "http://localhost:5000/api/v1/attendance/export/excel" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output attendance.xlsx
```

---

## 🔧 Configuration

### Environment Variables

Make sure your `.env` file has:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/notified
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notified

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRE=30d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:5174

# Email (Optional for testing)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📊 Test Data Requirements

The test script requires:
- ✅ At least 1 staff or admin user
- ✅ At least 2 students
- ✅ At least 1 subject

### Create Test Data Manually

```bash
# Initialize database with sample data
node scripts/init-database.js
```

Or create via API:

**1. Create User:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Staff User\",
    \"email\": \"staff@school.com\",
    \"password\": \"Password123\",
    \"role\": \"staff\"
  }"
```

**2. Create Student:**
```bash
curl -X POST http://localhost:5000/api/v1/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{
    \"studentNumber\": \"2024001\",
    \"firstName\": \"John\",
    \"lastName\": \"Doe\",
    \"email\": \"john.doe@student.com\",
    \"section\": \"A\"
  }"
```

**3. Create Subject:**
```bash
curl -X POST http://localhost:5000/api/v1/subjects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{
    \"subjectCode\": \"CS101\",
    \"subjectName\": \"Introduction to Programming\",
    \"section\": \"A\"
  }"
```

---

## 📖 Documentation

Full documentation available:

- **API Endpoints:** `documentation/ATTENDANCE_API_ENDPOINTS.md`
- **Implementation Summary:** `documentation/ATTENDANCE_BACKEND_COMPLETE.md`
- **Postman Collection:** `Notified_API.postman_collection.json`

---

## 🔗 Frontend Integration

### API Base URL

In your frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Service Configuration

The frontend service is already configured:
```typescript
// src/services/enhanced-attendance.service.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

Just start both servers:
```bash
# Terminal 1 - Backend
cd notified-backend
npm run dev

# Terminal 2 - Frontend
cd notified-frontend
npm run dev
```

---

## ⚠️ Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution:**
- Check if MongoDB is running: `mongod --version`
- Verify `MONGODB_URI` in `.env`
- For Atlas, check network access and IP whitelist

### Issue: "Unauthorized" errors
**Solution:**
- Make sure you're logged in
- Include `Authorization: Bearer TOKEN` header
- Check token hasn't expired (default: 7 days)

### Issue: "Student/Subject not found"
**Solution:**
- Run `node scripts/init-database.js` to create test data
- Verify IDs are valid MongoDB ObjectIds (24 hex characters)

### Issue: "Attendance already exists"
**Solution:**
- Each student can have only one attendance per subject per day
- Use PUT `/api/attendance/:id` to update existing attendance
- Or delete the old record first

### Issue: Excel import fails
**Solution:**
- Check file format matches template (see documentation)
- Ensure file size < 10MB
- Verify column headers: Student ID, Subject ID, Date, Status, Remarks
- Check IDs are valid MongoDB ObjectIds

---

## 🎯 Next Steps

1. ✅ **Backend Running** - Start server with `npm run dev`
2. ✅ **Tests Passing** - Run `node scripts/test-attendance-endpoints.js`
3. ⬜ **Frontend Connected** - Update `VITE_API_BASE_URL`
4. ⬜ **Test Full Flow** - Mark attendance from UI
5. ⬜ **Deploy** - Push to production

---

## 📝 Quick Reference

### Status Values
- `present` - Student was present
- `absent` - Student was absent
- `late` - Student arrived late
- `excused` - Excused absence

### Required Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### Response Format
```json
{
  "success": true,
  "message": "Success message",
  "data": { /* response data */ }
}
```

---

## 🆘 Need Help?

- Check documentation: `documentation/ATTENDANCE_API_ENDPOINTS.md`
- Review test script: `scripts/test-attendance-endpoints.js`
- Import Postman collection: `Notified_API.postman_collection.json`
- Check logs: `logs/` directory

---

## 🎊 You're Ready!

All backend endpoints are implemented and ready to use. Start your server and begin testing! 🚀
