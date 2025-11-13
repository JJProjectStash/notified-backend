# 🔗 API Routes Guide - Frontend/Backend Sync

## ⚠️ Current Issue

**Backend routes:** `/api/v1/*`  
**Frontend is calling:** `/api/*` (without v1)

## 🎯 Solution Options

### Option 1: Update Frontend (Recommended)

Change all frontend API calls to use `/api/v1/` prefix:

**Before:**

```javascript
POST / api / auth / login;
GET / api / students;
```

**After:**

```javascript
POST / api / v1 / auth / login;
GET / api / v1 / students;
```

### Option 2: Add Compatibility Routes in Backend

Add non-versioned routes that redirect to v1 routes.

### Option 3: Remove Version from Backend

Change backend routes from `/api/v1/` to `/api/`

---

## 📋 Complete Backend API Routes

All routes are prefixed with `/api/v1/`

### 🔐 Authentication Routes (`/api/v1/auth`)

```
POST   /api/v1/auth/register         - Register new user (superadmin only)
POST   /api/v1/auth/login            - Login
POST   /api/v1/auth/logout           - Logout
POST   /api/v1/auth/refresh-token    - Refresh access token
GET    /api/v1/auth/me               - Get current user
PUT    /api/v1/auth/update-password  - Update password
PUT    /api/v1/auth/update-profile   - Update profile
```

### 👤 User Management Routes (`/api/v1/users`)

```
GET    /api/v1/users                 - Get all users (admin only)
GET    /api/v1/users/stats           - Get user statistics
GET    /api/v1/users/:id             - Get user by ID
POST   /api/v1/users                 - Create user (admin only)
PUT    /api/v1/users/:id             - Update user
PUT    /api/v1/users/:id/toggle      - Toggle user active status
DELETE /api/v1/users/:id             - Delete user (admin only)
GET    /api/v1/users/search?q=...    - Search users
```

### 👨‍🎓 Student Routes (`/api/v1/students`)

```
GET    /api/v1/students                         - Get all students
GET    /api/v1/students/generate/student-number - Generate next student number
GET    /api/v1/students/number/:studentNumber   - Get student by number
GET    /api/v1/students/:id                     - Get student by ID
POST   /api/v1/students                         - Create student (staff+)
PUT    /api/v1/students/:id                     - Update student (staff+)
DELETE /api/v1/students/:id                     - Delete student (admin only)
```

### 📚 Subject Routes (`/api/v1/subjects`)

```
GET    /api/v1/subjects                  - Get all subjects
GET    /api/v1/subjects/search?q=...     - Search subjects
GET    /api/v1/subjects/year/:year       - Get subjects by year level
GET    /api/v1/subjects/code/:code       - Get subject by code
GET    /api/v1/subjects/:id              - Get subject by ID
GET    /api/v1/subjects/:id/enrollments  - Get subject enrollments
POST   /api/v1/subjects                  - Create subject (staff+)
PUT    /api/v1/subjects/:id              - Update subject (staff+)
DELETE /api/v1/subjects/:id              - Delete subject (admin only)
```

### ✅ Attendance Routes (`/api/v1/attendance`)

```
GET    /api/v1/attendance                 - Get all attendance
GET    /api/v1/attendance/today           - Get today's attendance
GET    /api/v1/attendance/summary         - Get attendance summary
GET    /api/v1/attendance/student/:id     - Get student attendance
GET    /api/v1/attendance/subject/:id     - Get subject attendance
GET    /api/v1/attendance/:id             - Get attendance by ID
POST   /api/v1/attendance                 - Mark attendance (staff+)
PUT    /api/v1/attendance/:id             - Update attendance (staff+)
DELETE /api/v1/attendance/:id             - Delete attendance (admin only)
```

### 📝 Record Routes (`/api/v1/records`)

```
GET    /api/v1/records              - Get all records (staff+)
GET    /api/v1/records/today        - Get today's records
GET    /api/v1/records/stats        - Get record statistics
GET    /api/v1/records/student/:id  - Get student records
GET    /api/v1/records/subject/:id  - Get subject records
GET    /api/v1/records/type/:type   - Get records by type
GET    /api/v1/records/:id          - Get record by ID
DELETE /api/v1/records/:id          - Delete record (admin only)
```

### 🔔 Notification Routes (`/api/v1/notifications`)

```
GET    /api/v1/notifications              - Get all notifications
GET    /api/v1/notifications/unread       - Get unread count
GET    /api/v1/notifications/stats        - Get notification stats
GET    /api/v1/notifications/:id          - Get notification by ID
POST   /api/v1/notifications              - Create notification (staff+)
PUT    /api/v1/notifications/:id/read     - Mark as read
PUT    /api/v1/notifications/read-all     - Mark all as read
DELETE /api/v1/notifications/:id          - Delete notification
DELETE /api/v1/notifications/read         - Delete all read
```

---

## 🛠️ Quick Fixes

### For Frontend Development

**If using axios/fetch with a base URL:**

```javascript
// src/config/api.js or similar
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Usage
api.post('/auth/login', { email, password }); // Calls /api/v1/auth/login
```

**Environment Variables (.env):**

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### For Backend Quick Fix

**Add compatibility routes (app.js):**

```javascript
// Add after other routes
// Compatibility routes (redirect /api/* to /api/v1/*)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/notifications', notificationRoutes);
```

---

## 📱 CORS Configuration

Make sure your backend allows your frontend origin:

**Backend (.env):**

```env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

**Frontend should send credentials:**

```javascript
axios.defaults.withCredentials = true;
// or
fetch(url, { credentials: 'include' });
```

---

## 🧪 Testing Routes

**Test Backend:**

```bash
# Test auth login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notified.com","password":"Admin@123"}'

# Test health check
curl http://localhost:5000/health
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

## ✅ Recommended Approach

**Option 1 is best:** Update frontend to use `/api/v1/` prefix. This maintains versioning for future API changes.

1. Update frontend API base URL
2. Test all endpoints
3. Update documentation

Let me know which option you prefer!
