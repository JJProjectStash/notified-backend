# 📋 Attendance API Endpoints Documentation

Complete documentation for all attendance-related API endpoints, including the new frontend-required endpoints.

## 🔗 Base URL

```
http://localhost:5000/api/v1/attendance
```

---

## 📌 New Frontend-Required Endpoints

### 1. Mark Single Attendance

**POST** `/api/attendance/mark`

Mark attendance for a single student.

**Authentication:** Required (Staff role)

**Request Body:**

```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "subjectId": "507f1f77bcf86cd799439012",
  "date": "2025-11-16T00:00:00.000Z",
  "status": "present",
  "remarks": "Optional remarks"
}
```

**Parameters:**

- `studentId` (required): MongoDB ObjectId of the student
- `subjectId` (required): MongoDB ObjectId of the subject
- `date` (required): ISO 8601 date string
- `status` (required): One of `present`, `absent`, `late`, `excused`
- `remarks` (optional): Additional notes (max 500 characters)

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "student": {
      "_id": "507f1f77bcf86cd799439011",
      "studentNumber": "2024001",
      "firstName": "John",
      "lastName": "Doe"
    },
    "subject": {
      "_id": "507f1f77bcf86cd799439012",
      "subjectCode": "CS101",
      "subjectName": "Introduction to Programming"
    },
    "date": "2025-11-16T00:00:00.000Z",
    "status": "present",
    "remarks": "Optional remarks",
    "markedBy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Jane Smith",
      "email": "jane@school.com"
    },
    "createdAt": "2025-11-16T10:30:00.000Z",
    "updatedAt": "2025-11-16T10:30:00.000Z"
  }
}
```

---

### 2. Bulk Mark Attendance

**POST** `/api/attendance/bulk-mark`

Mark attendance for multiple students at once.

**Authentication:** Required (Staff role)

**Request Body:**

```json
{
  "records": [
    {
      "studentId": "507f1f77bcf86cd799439011",
      "subjectId": "507f1f77bcf86cd799439012",
      "status": "present",
      "date": "2025-11-16T00:00:00.000Z"
    },
    {
      "studentId": "507f1f77bcf86cd799439015",
      "subjectId": "507f1f77bcf86cd799439012",
      "status": "late",
      "remarks": "Arrived 15 minutes late"
    }
  ]
}
```

**Parameters:**

- `records` (required): Array of attendance records
  - Each record must have: `studentId`, `subjectId`, `status`
  - Optional: `date` (defaults to today), `remarks`

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Bulk attendance marked successfully",
  "data": {
    "successful": [
      {
        "studentId": "507f1f77bcf86cd799439011",
        "attendance": {
          /* attendance object */
        }
      }
    ],
    "failed": [
      {
        "studentId": "507f1f77bcf86cd799439015",
        "error": "Attendance already exists for this date"
      }
    ],
    "total": 2
  }
}
```

---

### 3. Get Attendance Records

**GET** `/api/attendance/records` (also available via `GET /api/v1/attendance`)

Retrieve attendance records with flexible filtering and pagination.

**Authentication:** Required

**Query Parameters:**

- `startDate` (optional): Start date for filtering (ISO 8601)
- `endDate` (optional): End date for filtering (ISO 8601)
- `studentId` (optional): Filter by student ID
- `subjectId` (optional): Filter by subject ID
- `status` (optional): Filter by status (`present`, `absent`, `late`, `excused`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)

**Example Request:**

```
GET /api/attendance/records?subjectId=507f1f77bcf86cd799439012&status=absent&page=1&limit=20
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Attendance records retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "student": {
        "studentNumber": "2024001",
        "firstName": "John",
        "lastName": "Doe",
        "section": "A"
      },
      "subject": {
        "subjectCode": "CS101",
        "subjectName": "Introduction to Programming"
      },
      "date": "2025-11-16T00:00:00.000Z",
      "status": "present",
      "remarks": "",
      "markedBy": {
        "name": "Jane Smith",
        "email": "jane@school.com"
      },
      "createdAt": "2025-11-16T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### 4. Get Daily Summary

**GET** `/api/attendance/summary/daily/:date`

Get attendance summary for a specific date.

**Authentication:** Required

**URL Parameters:**

- `date` (required): Date in YYYY-MM-DD format

**Query Parameters:**

- `subjectId` (optional): Filter by subject

**Example Request:**

```
GET /api/attendance/summary/daily/2025-11-16?subjectId=507f1f77bcf86cd799439012
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Daily summary retrieved successfully",
  "data": {
    "date": "2025-11-16T00:00:00.000Z",
    "total": 30,
    "present": 25,
    "absent": 2,
    "late": 2,
    "excused": 1,
    "attendanceRate": "83.33"
  }
}
```

---

### 5. Get Students Summary

**GET** `/api/attendance/summary/students`

Get attendance summary for all students with statistics.

**Authentication:** Required

**Query Parameters:**

- `subjectId` (optional): Filter by subject
- `startDate` (optional): Start date for period
- `endDate` (optional): End date for period

**Example Request:**

```
GET /api/attendance/summary/students?subjectId=507f1f77bcf86cd799439012&startDate=2025-11-01&endDate=2025-11-16
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Students summary retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "studentNumber": "2024001",
      "firstName": "John",
      "lastName": "Doe",
      "section": "A",
      "totalDays": 15,
      "present": 13,
      "absent": 1,
      "late": 1,
      "excused": 0,
      "attendanceRate": 86.67
    },
    {
      "_id": "507f1f77bcf86cd799439015",
      "studentNumber": "2024002",
      "firstName": "Jane",
      "lastName": "Smith",
      "section": "A",
      "totalDays": 15,
      "present": 15,
      "absent": 0,
      "late": 0,
      "excused": 0,
      "attendanceRate": 100
    }
  ]
}
```

---

### 6. Import from Excel

**POST** `/api/attendance/import/excel`

Import attendance records from an Excel file.

**Authentication:** Required (Staff role)

**Request:**

- Content-Type: `multipart/form-data`
- File field name: `file`
- Max file size: 10MB

**Excel Format:**
Column headers in first row:
| Student ID | Subject ID | Date | Status | Remarks |
|------------|------------|------|--------|---------|
| 507f1f77... | 507f1f77... | 2025-11-16 | present | |
| 507f1f77... | 507f1f77... | 2025-11-16 | late | Late arrival |

**Example Request (cURL):**

```bash
curl -X POST http://localhost:5000/api/v1/attendance/import/excel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@attendance.xlsx"
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Attendance imported successfully",
  "data": {
    "success": true,
    "imported": 28,
    "failed": 2,
    "total": 30,
    "errors": [
      {
        "studentId": "507f1f77bcf86cd799439016",
        "error": "Student not found"
      },
      {
        "studentId": "507f1f77bcf86cd799439017",
        "error": "Attendance already exists for this date"
      }
    ]
  }
}
```

---

### 7. Export to Excel

**GET** `/api/attendance/export/excel`

Export attendance records to an Excel file.

**Authentication:** Required

**Query Parameters:**

- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering
- `studentId` (optional): Filter by student
- `subjectId` (optional): Filter by subject
- `status` (optional): Filter by status

**Example Request:**

```
GET /api/attendance/export/excel?subjectId=507f1f77bcf86cd799439012&startDate=2025-11-01&endDate=2025-11-16
```

**Response:**

- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename=attendance-{timestamp}.xlsx`
- Body: Excel file binary data

**Excel Output Format:**
| Student Number | Student Name | Section | Subject Code | Subject Name | Date | Status | Remarks | Marked By |
|---------------|--------------|---------|--------------|--------------|------|--------|---------|-----------|
| 2024001 | John Doe | A | CS101 | Intro to Programming | 11/16/2025 | present | | Jane Smith |

---

## 📌 Existing Endpoints

### 8. Get Attendance by Date Range

**GET** `/api/attendance/range`

Retrieve attendance records within a date range.

**Query Parameters:**

- `startDate` (required): Start date
- `endDate` (required): End date
- `studentId` (optional): Filter by student
- `subjectId` (optional): Filter by subject
- `status` (optional): Filter by status
- `page`, `limit`: Pagination

---

### 9. Get Student Attendance

**GET** `/api/attendance/student/:studentId`

Get all attendance records for a specific student.

**URL Parameters:**

- `studentId`: Student's MongoDB ObjectId

**Query Parameters:**

- `subjectId`, `startDate`, `endDate`, `page`, `limit`

---

### 10. Get Subject Attendance

**GET** `/api/attendance/subject/:subjectId`

Get all attendance records for a specific subject.

**URL Parameters:**

- `subjectId`: Subject's MongoDB ObjectId

**Query Parameters:**

- `date`, `status`, `page`, `limit`

---

### 11. Get Student Attendance Summary

**GET** `/api/attendance/student/:studentId/summary`

Get attendance statistics for a student.

**URL Parameters:**

- `studentId`: Student's MongoDB ObjectId

**Query Parameters:**

- `subjectId` (optional): Filter by subject

---

### 12. Get Today's Attendance

**GET** `/api/attendance/subject/:subjectId/today`

Get today's attendance for a subject.

**URL Parameters:**

- `subjectId`: Subject's MongoDB ObjectId

---

### 13. Update Attendance

**PUT** `/api/attendance/:id`

Update an existing attendance record.

**Authentication:** Required (Staff role)

**URL Parameters:**

- `id`: Attendance record ID

**Request Body:**

```json
{
  "status": "excused",
  "timeSlot": "arrival",
  "remarks": "Doctor's appointment"
}
```

---

### 14. Delete Attendance

**DELETE** `/api/attendance/:id`

Delete an attendance record.

**Authentication:** Required (Admin role)

**URL Parameters:**

- `id`: Attendance record ID

---

## 🔐 Authentication

All endpoints require authentication via JWT token:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Role Requirements:

- **GET requests**: Any authenticated user
- **POST/PUT requests**: Staff or Admin role
- **DELETE requests**: Admin role only

---

## ⚠️ Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "studentId",
      "message": "Student ID is required"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Not authorized, token failed"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Student not found"
}
```

### 409 Conflict

```json
{
  "success": false,
  "message": "Attendance already exists for this student and date",
  "data": {
    /* existing attendance record returned for frontend to open edit modal */
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Server error",
  "error": "Error details..."
}
```

---

## 📊 Status Values

Valid attendance status values:

- `present` - Student was present
- `absent` - Student was absent
- `late` - Student arrived late
- `excused` - Excused absence

---

## 🧪 Testing

Run the test script to verify all endpoints:

```bash
node scripts/test-attendance-endpoints.js
```

---

## 📝 Notes

1. All dates should be in ISO 8601 format
2. MongoDB ObjectIds must be valid 24-character hex strings
3. Excel imports support up to 10MB file size
4. Bulk operations process records sequentially
5. Failed bulk operations return partial success with error details
6. Notifications are automatically sent for absent/late status
7. Email notifications require guardian email to be set on student record

---

## 🔄 Integration with Frontend

The frontend attendance features expect these endpoints to be available at:

```
BASE_URL/api/v1/attendance/*
```

Make sure your `.env` file has:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

For frontend integration, see `ATTENDANCE_INTEGRATION.md` in the frontend documentation.
