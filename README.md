# Notified Backend

**Enterprise-grade Node.js REST API for Student Attendance and Notification Management System**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Overview

A modular, scalable REST API backend for the **Notified** system — converted from the original JavaFX application. This backend provides comprehensive student attendance tracking, user management, notification services, and reporting capabilities with enterprise-level security and role-based access control.

---

## ✨ Features

- **🔐 Secure Authentication**: JWT-based authentication with refresh tokens
- **👥 Role-Based Access Control**: Superadmin, Admin, and Staff roles with granular permissions
- **📚 Student Management**: Complete CRUD operations with guardian information
- **📖 Subject Management**: Course and subject tracking with year levels
- **✅ Attendance Tracking**: Mark, update, and query attendance records
- **📊 Activity Records**: Audit log system for all system activities
- **🔔 Notifications**: Real-time notification system for alerts and updates
- **📧 Email Integration**: Automated email notifications using Nodemailer
- **🛡️ Security**: Helmet, CORS, rate limiting, input sanitization, XSS protection
- **📝 Logging**: Comprehensive logging with Winston
- **✔️ Validation**: Request validation using express-validator
- **📄 Pagination**: Efficient data pagination for all list endpoints

---

## 🛠️ Tech Stack

### Core
- **Node.js** (18+) - Runtime environment
- **Express.js** (4.18+) - Web framework
- **MongoDB** (6.0+) - Database
- **Mongoose** (8.0+) - ODM

### Security
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting
- **express-mongo-sanitize** - NoSQL injection prevention
- **xss-clean** - XSS protection

### Utilities
- **winston** - Logging
- **morgan** - HTTP request logging
- **nodemailer** - Email service
- **express-validator** - Input validation
- **joi** - Schema validation
- **compression** - Response compression

### Development
- **nodemon** - Development auto-reload
- **eslint** - Code linting
- **prettier** - Code formatting

---

## 📁 Project Structure

```
notified-backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   └── constants.js     # Application constants
│   ├── controllers/         # Route controllers
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   └── ...
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # Authentication middleware
│   │   ├── rbac.js          # Role-based access control
│   │   ├── errorHandler.js  # Error handling
│   │   └── validate.js      # Request validation
│   ├── models/              # Mongoose models
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Subject.js
│   │   ├── Attendance.js
│   │   ├── Record.js
│   │   ├── Notification.js
│   │   └── Enrollment.js
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   └── ...
│   ├── services/            # Business logic
│   │   ├── authService.js
│   │   ├── studentService.js
│   │   └── ...
│   ├── utils/               # Utility functions
│   │   ├── logger.js
│   │   ├── apiResponse.js
│   │   ├── jwtUtil.js
│   │   ├── validationUtil.js
│   │   └── emailUtil.js
│   └── app.js               # Express application
├── logs/                    # Log files
├── .env.example             # Environment variables template
├── .eslintrc.json           # ESLint configuration
├── .prettierrc.json         # Prettier configuration
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm 9+
- **MongoDB** 6.0+ (local or MongoDB Atlas)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Java-Project-IM/notified-backend.git
   cd notified-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key (use a strong, random string)
   - `JWT_REFRESH_SECRET` - Refresh token secret
   - Email configuration (for Nodemailer)
   - CORS origins
   - Other settings as needed

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod

   # Or use MongoDB Atlas connection string in .env
   ```

5. **Run the application**

   **Development mode:**
   ```bash
   npm run dev
   ```

   **Production mode:**
   ```bash
   npm start
   ```

6. **Verify server is running**
   ```bash
   curl http://localhost:5000/health
   ```

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "staff"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "staff"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Profile
```http
GET /api/v1/auth/profile
Authorization: Bearer <access_token>
```

### Student Endpoints

#### Get All Students
```http
GET /api/v1/students?page=1&limit=10&section=A
Authorization: Bearer <access_token>
```

#### Create Student
```http
POST /api/v1/students
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "studentNumber": "25-0001",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "section": "A",
  "guardianName": "Robert Smith",
  "guardianEmail": "robert.smith@example.com"
}
```

#### Update Student
```http
PUT /api/v1/students/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "section": "B"
}
```

#### Delete Student
```http
DELETE /api/v1/students/:id
Authorization: Bearer <access_token>
```

#### Generate Student Number
```http
GET /api/v1/students/generate/student-number?yearPrefix=25
Authorization: Bearer <access_token>
```

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 🔒 Authentication & Authorization

### JWT Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### Refresh Tokens

Refresh tokens are stored in httpOnly cookies for enhanced security. Use the `/auth/refresh-token` endpoint to get a new access token.

### User Roles

| Role | Permissions |
|------|------------|
| **Superadmin** | Full system access, can manage all users and settings |
| **Admin** | Can manage students, subjects, attendance, view all records |
| **Staff** | Can mark attendance, view students, basic operations |

---

## 🛡️ Security Features

- **Password Hashing**: bcrypt with configurable salt rounds
- **JWT**: Secure token-based authentication with refresh tokens
- **CORS**: Configured for specific origins
- **Rate Limiting**: Prevents brute force attacks
- **Helmet**: Sets security HTTP headers
- **Input Sanitization**: Prevents NoSQL injection
- **XSS Protection**: Sanitizes user input
- **HTTPS Ready**: Secure cookies for production
- **Environment Variables**: Sensitive data protected

---

## 📧 Email Configuration

Configure Nodemailer in `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@notified.com
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_PASSWORD`

---

## 🔧 Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `NODE_ENV` - development | production
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - Allowed origins (comma-separated)

---

## 🧪 Development

### Code Quality

```bash
# Run ESLint
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 🚢 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use strong, unique `JWT_SECRET` and `JWT_REFRESH_SECRET`
3. Configure production MongoDB URI
4. Enable HTTPS and secure cookies
5. Configure email service
6. Set appropriate CORS origins

### Deployment Platforms

**Render / Railway / Heroku:**
1. Connect GitHub repository
2. Set environment variables
3. Deploy

**Docker:**
```bash
docker build -t notified-backend .
docker run -p 5000:5000 --env-file .env notified-backend
```

**PM2 (Production):**
```bash
npm install -g pm2
pm2 start src/app.js --name notified-backend
pm2 save
pm2 startup
```

---

## 📊 Monitoring

- **Logs**: Check `logs/` directory for error and combined logs
- **Health Check**: `GET /health`
- **MongoDB**: Monitor with MongoDB Atlas or Compass
- **PM2**: `pm2 monit` for process monitoring

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Authors

**Notified Development Team**
- Original JavaFX Application: [Java-Project-IM/notified](https://github.com/Java-Project-IM/notified)
- Backend API: Built by Senior Backend Architect

---

## 🙏 Acknowledgments

- Original JavaFX application team
- Node.js and Express.js communities
- MongoDB team
- All open-source contributors

---

## 📞 Support

For issues, questions, or contributions:
- **GitHub Issues**: [Create an issue](https://github.com/Java-Project-IM/notified-backend/issues)
- **Email**: support@notified.com

---

## 🗺️ Roadmap

- [ ] Complete all service implementations (Subject, Attendance, Notifications)
- [ ] Add Swagger/OpenAPI documentation
- [ ] Implement comprehensive test suite
- [ ] Add WebSocket support for real-time notifications
- [ ] Implement file upload for profile pictures
- [ ] Add report generation (PDF/Excel)
- [ ] Implement caching with Redis
- [ ] Add GraphQL API support
- [ ] Create admin dashboard
- [ ] Mobile app integration

---

**Built with ❤️ for efficient student management**
