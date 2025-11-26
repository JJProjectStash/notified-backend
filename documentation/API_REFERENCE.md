# Notified Backend API - Complete Endpoint Reference

## 📌 Base URL

```
http://localhost:5000/api/v1
```

Note: Operational endpoints such as `/ping`, `/health`, and `/favicon.ico` are mounted at the root of the server (e.g., `http://localhost:5000/ping`) and are not under `/api/v1`.

## 🔐 Authentication

All endpoints except `/auth/register` and `/auth/login` require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 📚 API Endpoints

### 0. Operational / Health & Ping

| Method | Endpoint             | Access | Description                                |
| ------ | -------------------- | ------ | ------------------------------------------ |
| GET    | `/ping`              | Public | Lightweight public ping endpoint (fast)    |
| GET    | `/health`            | Public | Backwards-compatible health endpoint (fast)|
| GET    | `/api/v1/health`     | Public | Backwards-compatible health endpoint (fast)|

Notes: These endpoints are intentionally lightweight and do not perform DB checks by default (use `?db=true` when available to request DB state if the implementation is configured to check it). They are not rate-limited and are suitable for uptime probes and keep-alive pings.


### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint           | Access  | Description              |
| ------ | ------------------ | ------- | ------------------------ |
| POST   | `/register`        | Public  | Register new user        |
| POST   | `/login`           | Public  | User login               |
| POST   | `/logout`          | Private | User logout              |
| POST   | `/refresh-token`   | Public  | Refresh access token     |
| GET    | `/profile`         | Private | Get current user profile |
| PUT    | `/profile`         | Private | Update user profile      |
| PUT    | `/change-password` | Private | Change password          |

---

### 2. Students (`/api/v1/students`)

| Method | Endpoint                   | Access  | Description                              |
| ------ | -------------------------- | ------- | ---------------------------------------- |
| GET    | `/`                        | Private | Get all students (paginated, searchable) |
| GET    | `/search`                  | Private | Search students                          |
| GET    | `/generate/student-number` | Private | Generate next student number             |
| GET    | `/number/:studentNumber`   | Private | Get student by student number            |
| GET    | `/:id`                     | Private | Get student by ID                        |
| POST   | `/`                        | Staff   | Create new student                       |
| PUT    | `/:id`                     | Staff   | Update student                           |
| DELETE | `/:id`                     | Admin   | Delete student                           |

**Query Parameters for GET /**:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search term
- `section` (string): Filter by section
- `isActive` (boolean): Filter by active status

---

### 3. Subjects (`/api/v1/subjects`)

| Method | Endpoint                            | Access  | Description                      |
| ------ | ----------------------------------- | ------- | -------------------------------- |
| GET    | `/`                                 | Private | Get all subjects (paginated)     |
| GET    | `/search`                           | Private | Search subjects                  |
| GET    | `/code/:subjectCode`                | Private | Get subject by code              |
| GET    | `/year/:yearLevel/section/:section` | Private | Get subjects by year and section |
| GET    | `/:id`                              | Private | Get subject by ID                |
| GET    | `/:id/enrollments`                  | Private | Get subject enrollments          |
| POST   | `/`                                 | Staff   | Create new subject               |
| PUT    | `/:id`                              | Staff   | Update subject                   |
| DELETE | `/:id`                              | Admin   | Delete subject                   |

**Query Parameters for GET /**:

- `page` (number): Page number
- `limit` (number): Items per page
- `yearLevel` (number): Filter by year level (1-12)
- `section` (string): Filter by section
- `isActive` (boolean): Filter by active status

| Method | Endpoint                      | Access  | Description                                                |
| ------ | ----------------------------- | ------- | ---------------------------------------------------------- |
| GET    | `/`                            | Private | Get attendance records (alias for `/records`)             |
| GET    | `/records`                     | Private | Get attendance records (paginated, searchable, filtered)  |
| GET    | `/range`                       | Private | Get attendance by date range                              |
| GET    | `/student/:studentId`          | Private | Get student attendance (paginated)                        |
| GET    | `/student/:studentId/summary`  | Private | Get attendance summary for student                        |
| GET    | `/subject/:subjectId`          | Private | Get subject attendance                                    |
| GET    | `/subject/:subjectId/today`    | Private | Get today's attendance for subject                       |
| POST   | `/` or `/mark`                 | Staff   | Mark attendance (create record)                           |
| PUT    | `/:id`                         | Staff   | Update attendance record (audit/history fields added)     |
| DELETE | `/:id`                         | Admin   | Delete attendance record                                   |
| POST   | `/bulk-mark`                   | Staff   | Bulk mark attendance using array of records               |
| POST   | `/import/excel`                | Staff   | Import attendance from Excel file (multipart/form-data)   |
| GET    | `/export/excel`                | Staff   | Export filtered attendance to Excel file                  |
| POST   | `/subject/bulk-mark`           | Staff   | Bulk mark attendance for a subject                        |

**Query Parameters**:

- `/`: `studentId`, `subjectId`, `status`, `timeSlot`, `startDate`, `endDate`, `page`, `limit`
- `/range`: `startDate`, `endDate`, `studentId`, `subjectId`, `status`, `timeSlot`, `page`, `limit`
- `/student/:studentId`: `subjectId`, `startDate`, `endDate`, `page`, `limit`
- `/subject/:subjectId`: `date`, `status`, `page`, `limit`

**Request Body for POST** (Mark Attendance):

```json
{
  "studentId": "mongoId",
  "subjectId": "mongoId",
  "date": "2024-11-13",
  "status": "present|absent|late|excused",
  "timeSlot": "arrival|departure (optional)",
  "scheduleSlot": "Optional schedule slot name",
  "remarks": "Optional remarks"
}
```
9. **Error Payload Extras**: For client errors (4xx), the API may include an additional `data` property in the error response to help the client react (e.g., the existing attendance object is provided on 409 Conflict for duplicate attendance). Check `response.data` for axios clients.

---
#### Subject-specific and Bulk mark

POST `/api/v1/attendance/subject/mark` and POST `/api/v1/attendance/subject/bulk-mark` support subject-attendance flows and accept `subjectId` and `studentId` (or arrays of student IDs / attendanceData objects). Validation rules accept both ObjectId and numeric IDs where applicable.

----
### Importing attendance (Excel)

POST `/api/v1/attendance/import/excel` — Accepts multipart/form-data with a single `file` field containing an xlsx or xls workbook. This import endpoint:

- Accepts a workbook with a header row and supports flexible column positions — header names are mapped case-insensitively to canonical keys (e.g. `Student Number`, `Email`, `Student ID`, `Subject Code`, `Subject ID`, `Date`, `Status`, `Remarks`, `Time Slot`).
- Resolves students by ID, studentNumber, or email; resolves subjects by ID or subject code. If subject IDs or codes aren't provided, subject is optional and arrival-only marks are supported.
- Accepts ISO date strings or Excel date values for `date` and coerces them to the date boundary (00:00:00 UTC).
- Normalizes status values and synonyms (present/p, absent/a, late/l, excused/e, checked-in, checked-in etc.) to canonical `present|absent|late|excused`.
- Uses header mapping to read values; if headers don't exist, the importer falls back to legacy column indexing (field-by-field — per field fallback avoids column shifts resulting in reading the wrong column such as email for status).
- Returns `success: false` with `errors` details if parsing errors occur or no rows are valid; import is aborted and no attendance is written if validation errors are present in rows.
- When import succeeds (or partially), the response includes `imported`, `failed`, `total`, and `errors` array with per-row messages. `errors` may include a `debug` object of raw cell values for each row to help troubleshoot mapping issues.

Example request:

```bash
curl -X POST http://localhost:5000/api/v1/attendance/import/excel \
  -H "Authorization: Bearer <your-jwt-token>" \
  -F "file=@attendance.xlsx;type=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
```

Example successful response (HTTP 201):

```json
{
  "success": true,
  "imported": 12,
  "failed": 0,
  "total": 12
}
```

Example failure response (HTTP 400/422) — parsing errors:

```json
{
  "success": false,
  "imported": 0,
  "failed": 0,
  "total": 3,
  "errors": [
    { "row": 3, "error": "Missing required fields", "debug": { "statusRaw": "john.doe@example.com" } }
  ]
}
```

----
### Mark Attendance Conflict (Duplicate)
When a `POST /api/v1/attendance` (or `/mark`) attempt is made for an existing attendance (same student/date/subject/timeSlot according to schema unique index), the API returns HTTP 409 Conflict and includes the existing attendance document in the `data` field of the error response so the frontend can display it (for example, to open an edit modal).

Example 409 response:

```json
HTTP/1.1 409 Conflict
{
  "success": false,
  "message": "Attendance already marked for this student and subject today",
  "data": {
    "id": "64a5f123456789abcdef0001",
    "studentId": "64a5f123456789abcdef0002",
    "status": "present",
    "date": "2025-11-20T00:00:00.000Z",
    "timeSlot": "arrival",
    "remarks": "Marked earlier",
    "markedBy": { "name": "Admin User", "email": "admin@example.com" }
  },
  "timestamp": "2025-11-26T12:00:00.000Z"
}
```

----
### Update Attendance (PUT /api/v1/attendance/:id)
Allowed fields in update: `status`, `timeSlot` (`arrival|departure`), `scheduleSlot`, and `remarks`. Updates append a `history` entry for the previous state and set `editedAt` and `editedBy`.

Example request:

```json
{
  "status": "late",
  "remarks": "Updated: student arrived late"
}
```

Example successful response (HTTP 200):

```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "data": {
    "id": "64a5f123456789abcdef0001",
    "status": "late",
    "remarks": "Updated: student arrived late",
    "editedAt": "2025-11-20T09:30:35.123Z",
    "editedBy": "64a5f123...",
    "history": [
      { "status": "present", "remarks": "Marked earlier", "editedAt": "2025-11-20T08:32:11.000Z" }
    ]
  }
}
```

### 5. Notifications (`/api/v1/notifications`)

| Method | Endpoint        | Access  | Description                            |
| ------ | --------------- | ------- | -------------------------------------- |
| GET    | `/`             | Private | Get all notifications for current user |
| GET    | `/stats`        | Private | Get notification statistics            |
| GET    | `/unread/count` | Private | Get unread notification count          |
| GET    | `/:id`          | Private | Get notification by ID                 |
| POST   | `/`             | Staff   | Create notification                    |
| PUT    | `/read-all`     | Private | Mark all as read                       |
| PUT    | `/:id/read`     | Private | Mark notification as read              |
| DELETE | `/read`         | Private | Delete all read notifications          |
| DELETE | `/:id`          | Private | Delete notification                    |

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

| Method | Endpoint              | Access  | Description                           |
| ------ | --------------------- | ------- | ------------------------------------- |
| GET    | `/`                   | Staff   | Get all records (paginated, filtered) |
| GET    | `/stats`              | Staff   | Get record statistics                 |
| GET    | `/today`              | Staff   | Get today's records                   |
| GET    | `/range`              | Staff   | Get records by date range             |
| GET    | `/type/:recordType`   | Staff   | Get records by type                   |
| GET    | `/student/:studentId` | Private | Get student records                   |
| GET    | `/subject/:subjectId` | Private | Get subject records                   |
| GET    | `/:id`                | Staff   | Get record by ID                      |
| DELETE | `/:id`                | Admin   | Delete record                         |

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

| Method | Endpoint             | Access | Description               |
| ------ | -------------------- | ------ | ------------------------- |
| GET    | `/`                  | Admin  | Get all users (paginated) |
| GET    | `/stats`             | Admin  | Get user statistics       |
| GET    | `/search`            | Admin  | Search users              |
| GET    | `/:id`               | Admin  | Get user by ID            |
| POST   | `/`                  | Admin  | Create new user           |
| PUT    | `/:id`               | Admin  | Update user               |
| PATCH  | `/:id/toggle-status` | Admin  | Toggle user active status |
| DELETE | `/:id`               | Admin  | Delete user (soft delete) |

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

### Ping / Health

```bash
curl -X GET http://localhost:5000/ping
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
5. **Soft Delete**: Most delete operations set `isActive: false` instead of removing records. NOTE: Some resources use hard delete; for example, Student and Subject endpoints permanently remove the document when deleted (hard delete), while other modules (e.g., Users) still use soft-delete.
8. **Service Ping & Health**: There are lightweight endpoints at `/ping`, `/health`, and `/api/v1/health` suitable for uptime probes. These endpoints are intentionally lightweight and are not rate-limited by default.
9. **Favicon**: The server responds to `/favicon.ico` with 204 No Content to avoid log noise from missing favicon requests.
10. **Attendance Extended Fields**: Attendance records now include `timeSlot` (`arrival|departure`), `scheduleSlot`, `editedAt`, `editedBy`, and a `history` array of prior states. These are returned in the attendance record objects.
11. **Excel Import & Header Mapping**: The Excel importer supports flexible header to column mapping, resolves student (by id/number/email), subject (by id/code), normalizes dates and status synonyms, and provides per-row debug information when there are parsing errors; fallbacks to legacy column indices are applied field-by-field if headers are missing.
6. **Activity Logging**: Most operations create audit records automatically
7. **Email Notifications**: Sent for critical events (attendance alerts, password reset, etc.)

---

## 🔧 Error Codes

| Status Code | Meaning               |
| ----------- | --------------------- |
| 200         | Success               |
| 201         | Created               |
| 204         | No Content            |
| 400         | Bad Request           |
| 401         | Unauthorized          |
| 403         | Forbidden             |
| 404         | Not Found             |
| 409         | Conflict              |
| 422         | Unprocessable Entity  |
| 500         | Internal Server Error |

---

**Last Updated**: November 26, 2025
**API Version**: 1.0.0
