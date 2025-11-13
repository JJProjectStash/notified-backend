# Notified Backend API - Complete Endpoint Reference

## 📌 Base URL
```
http://localhost:5000/api/v1
```

## 🔐 Authentication
All endpoints except `/auth/register` and `/auth/login` require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📚 API Endpoints

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | User login |
| POST | `/logout` | Private | User logout |
| POST | `/refresh-token` | Public | Refresh access token |
| GET | `/profile` | Private | Get current user profile |
| PUT | `/profile` | Private | Update user profile |
| PUT | `/change-password` | Private | Change password |

---

### 2. Students (`/api/v1/students`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Private | Get all students (paginated, searchable) |
| GET | `/search` | Private | Search students |
| GET | `/generate/student-number` | Private | Generate next student number |
| GET | `/number/:studentNumber` | Private | Get student by student number |
| GET | `/:id` | Private | Get student by ID |
| POST | `/` | Staff | Create new student |
| PUT | `/:id` | Staff | Update student |
| DELETE | `/:id` | Admin | Delete student |

**Query Parameters for GET /**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search term
- `section` (string): Filter by section
- `isActive` (boolean): Filter by active status

---

### 3. Subjects (`/api/v1/subjects`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Private | Get all subjects (paginated) |
| GET | `/search` | Private | Search subjects |
| GET | `/code/:subjectCode` | Private | Get subject by code |
| GET | `/year/:yearLevel/section/:section` | Private | Get subjects by year and section |
| GET | `/:id` | Private | Get subject by ID |
| GET | `/:id/enrollments` | Private | Get subject enrollments |
| POST | `/` | Staff | Create new subject |
| PUT | `/:id` | Staff | Update subject |
| DELETE | `/:id` | Admin | Delete subject |

**Query Parameters for GET /**:
- `page` (number): Page number
- `limit` (number): Items per page
- `yearLevel` (number): Filter by year level (1-12)
- `section` (string): Filter by section
- `isActive` (boolean): Filter by active status

---

### 4. Attendance (`/api/v1/attendance`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/range` | Private | Get attendance by date range |
| GET | `/student/:studentId` | Private | Get student attendance |
| GET | `/student/:studentId/summary` | Private | Get attendance summary for student |
| GET | `/subject/:subjectId` | Private | Get subject attendance |
| GET | `/subject/:subjectId/today` | Private | Get today's attendance for subject |
| POST | `/` | Staff | Mark attendance |
| PUT | `/:id` | Staff | Update attendance record |
| DELETE | `/:id` | Admin | Delete attendance record |

**Query Parameters**:
- `/range`: `startDate`, `endDate`, `studentId`, `subjectId`, `status`, `page`, `limit`
- `/student/:studentId`: `subjectId`, `startDate`, `endDate`, `page`, `limit`
- `/subject/:subjectId`: `date`, `status`, `page`, `limit`

**Request Body for POST** (Mark Attendance):
```json
{
  "studentId": "mongoId",
  "subjectId": "mongoId",
  "date": "2024-11-13",
  "status": "present|absent|late|excused",
  "remarks": "Optional remarks"
}
```

---

### 5. Notifications (`/api/v1/notifications`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Private | Get all notifications for current user |
| GET | `/stats` | Private | Get notification statistics |
| GET | `/unread/count` | Private | Get unread notification count |
| GET | `/:id` | Private | Get notification by ID |
| POST | `/` | Staff | Create notification |
| PUT | `/read-all` | Private | Mark all as read |
| PUT | `/:id/read` | Private | Mark notification as read |
| DELETE | `/read` | Private | Delete all read notifications |
| DELETE | `/:id` | Private | Delete notification |

**Query Parameters for GET /**:
- `isRead` (boolean): Filter by read status
- `type` (string): Filter by type
- `priority` (string): Filter by priority
- `page`, `limit`: Pagination

**Request Body for POST**:
```json
{
  "recipient": "userId",
  "type": "attendance_alert|grade_update|announcement|reminder|system",
  "title": "Notification title",
  "message": "Notification message",
  "priority": "low|medium|high|urgent",
  "student": "studentId (optional)"
}
```

---

### 6. Records (`/api/v1/records`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Staff | Get all records (paginated, filtered) |
| GET | `/stats` | Staff | Get record statistics |
| GET | `/today` | Staff | Get today's records |
| GET | `/range` | Staff | Get records by date range |
| GET | `/type/:recordType` | Staff | Get records by type |
| GET | `/student/:studentId` | Private | Get student records |
| GET | `/subject/:subjectId` | Private | Get subject records |
| GET | `/:id` | Staff | Get record by ID |
| DELETE | `/:id` | Admin | Delete record |

**Query Parameters**:
- `/`: `recordType`, `studentId`, `subjectId`, `performedBy`, `startDate`, `endDate`, `page`, `limit`
- `/range`: `startDate`, `endDate`, `page`, `limit`
- `/student/:studentId`: `recordType`, `subjectId`, `startDate`, `endDate`, `page`, `limit`
- `/subject/:subjectId`: `recordType`, `studentId`, `startDate`, `endDate`, `page`, `limit`

**Record Types**:
- `EMAIL_SENT`
- `STUDENT_ADDED`, `STUDENT_UPDATED`, `STUDENT_DELETED`
- `ENROLLMENT`
- `SUBJECT_ADDED`, `SUBJECT_UPDATED`, `SUBJECT_DELETED`
- `ATTENDANCE_MARKED`

---

### 7. Users (`/api/v1/users`) - Admin Only

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Admin | Get all users (paginated) |
| GET | `/stats` | Admin | Get user statistics |
| GET | `/search` | Admin | Search users |
| GET | `/:id` | Admin | Get user by ID |
| POST | `/` | Admin | Create new user |
| PUT | `/:id` | Admin | Update user |
| PATCH | `/:id/toggle-status` | Admin | Toggle user active status |
| DELETE | `/:id` | Admin | Delete user (soft delete) |

**Query Parameters for GET /**:
- `role` (string): Filter by role (superadmin, admin, staff)
- `isActive` (boolean): Filter by active status
- `page`, `limit`: Pagination

**Request Body for POST**:
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "admin|staff"
}
```

---

## 🔒 Access Levels

### Public
- No authentication required

### Private
- Requires valid JWT token
- Any authenticated user can access

### Staff
- Requires authentication
- User role must be `staff`, `admin`, or `superadmin`

### Admin
- Requires authentication
- User role must be `admin` or `superadmin`

### Superadmin
- Requires authentication
- User role must be `superadmin`

---

## 📊 Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-11-13T10:30:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  },
  "timestamp": "2024-11-13T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information",
  "timestamp": "2024-11-13T10:30:00.000Z"
}
```

---

## 🚀 Example API Calls

### Register User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get All Students
```bash
curl -X GET "http://localhost:5000/api/v1/students?page=1&limit=10" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Mark Attendance
```bash
curl -X POST http://localhost:5000/api/v1/attendance \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "64a5f123456789abcdef0001",
    "subjectId": "64a5f123456789abcdef0002",
    "date": "2024-11-13",
    "status": "present"
  }'
```

### Create Subject
```bash
curl -X POST http://localhost:5000/api/v1/subjects \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectCode": "MATH101",
    "subjectName": "Mathematics 101",
    "description": "Introduction to Algebra",
    "yearLevel": 10,
    "section": "A"
  }'
```

---

## 📝 Notes

1. **Pagination**: Default page is 1, default limit is 10, max limit is 100
2. **Dates**: Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)
3. **MongoDB IDs**: All IDs are MongoDB ObjectIds (24 hex characters)
4. **Search**: Search queries are case-insensitive
5. **Soft Delete**: Delete operations set `isActive: false` instead of removing records
6. **Activity Logging**: Most operations create audit records automatically
7. **Email Notifications**: Sent for critical events (attendance alerts, password reset, etc.)

---

## 🔧 Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |

---

**Last Updated**: November 13, 2024
**API Version**: 1.0.0
