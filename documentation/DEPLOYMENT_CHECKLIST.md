# 🚀 Deployment Checklist - Enterprise Grade

## Pre-Deployment Verification

### ✅ Code Quality

- [x] No compilation errors (`npm run build` passes)
- [x] All routes use centralized middleware imports
- [x] ValidationUtil import fixed (no destructuring)
- [x] ApiResponse supports both patterns (backward compatible)
- [x] Rate limiting implemented (30 emails/min per user)
- [x] Input sanitization implemented
- [x] All endpoints have proper JSDoc comments
- [x] Error handling consistent across all controllers
- [x] Logging comprehensive (info, debug, error levels)

### ✅ Security

- [x] Helmet middleware enabled
- [x] CORS properly configured
- [x] MongoDB sanitization enabled
- [x] Rate limiting configured (100 req/15min per IP)
- [x] JWT tokens properly validated
- [x] Role-based authorization implemented
- [x] Input validation with express-validator
- [x] Password hashing with bcrypt
- [x] Environment variables not committed to Git

### ✅ API Endpoints

#### Authentication

- [x] POST `/api/v1/auth/login` - User login
- [x] POST `/api/v1/auth/signup` - User registration
- [x] POST `/api/v1/auth/logout` - User logout
- [x] POST `/api/v1/auth/refresh-token` - Refresh JWT token
- [x] GET `/api/v1/auth/me` - Get current user

#### Students

- [x] GET `/api/v1/students` - List students (pagination)
- [x] GET `/api/v1/students/:id` - Get student by ID
- [x] POST `/api/v1/students` - Create student
- [x] PUT `/api/v1/students/:id` - Update student
- [x] DELETE `/api/v1/students/:id` - Delete student (hard delete)
- [x] GET `/api/v1/students/search` - Search students

#### Subjects

- [x] GET `/api/v1/subjects` - List subjects (pagination)
- [x] GET `/api/v1/subjects/:id` - Get subject by ID
- [x] POST `/api/v1/subjects` - Create subject
- [x] PUT `/api/v1/subjects/:id` - Update subject
- [x] DELETE `/api/v1/subjects/:id` - Delete subject
- [x] GET `/api/v1/subjects/search` - Search subjects

#### Email ⭐ NEW

- [x] POST `/api/v1/emails/send` - Send single email
- [x] POST `/api/v1/emails/send-bulk` - Send bulk emails (admin/staff)
- [x] POST `/api/v1/emails/send-guardian` - Send to guardian
- [x] GET `/api/v1/emails/config` - Check email config (admin)
- [x] POST `/api/v1/emails/test` - Test email config (admin)
- [x] GET `/api/v1/emails/history` - Email history

#### Records

- [x] GET `/api/v1/records` - List records (pagination)
- [x] GET `/api/v1/records/stats` - Dashboard statistics
- [x] GET `/api/v1/records/today` - Today's records
- [x] GET `/api/v1/records/:id` - Get record by ID
- [x] DELETE `/api/v1/records/:id` - Delete record (admin)

#### Attendance

- [x] POST `/api/v1/attendance` - Mark attendance (staff)
- [x] GET `/api/v1/attendance/student/:id` - Get student attendance
- [x] PUT `/api/v1/attendance/:id` - Update attendance (staff)
- [x] DELETE `/api/v1/attendance/:id` - Delete attendance (admin)

#### Notifications

- [x] GET `/api/v1/notifications` - List notifications
- [x] PUT `/api/v1/notifications/:id/read` - Mark as read
- [x] DELETE `/api/v1/notifications/:id` - Delete notification
- [x] GET `/api/v1/notifications/unread/count` - Unread count

#### Users (Admin)

- [x] GET `/api/v1/users` - List users (admin)
- [x] POST `/api/v1/users` - Create user (admin)
- [x] PUT `/api/v1/users/:id` - Update user (admin)
- [x] DELETE `/api/v1/users/:id` - Delete user (admin)

### ✅ Environment Configuration

**Required Variables:**

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notified-db

# JWT
JWT_SECRET=your-production-secret-key-min-32-characters
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRE=30d

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Notified <noreply@notified.com>

# Server
PORT=5000
NODE_ENV=production

# Security
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Security Notes:**

- ✅ JWT_SECRET must be at least 32 characters
- ✅ Use Gmail App Password (not regular password)
- ✅ Enable 2FA on Gmail account
- ✅ Set strong MongoDB password
- ✅ Restrict CORS_ORIGIN to your domain only
- ✅ Never commit .env to Git

### ✅ Database

- [x] MongoDB Atlas cluster created
- [x] Database user created with read/write permissions
- [x] IP whitelist configured (0.0.0.0/0 for cloud hosting)
- [x] Connection string tested
- [x] Indexes created on:
  - students.studentNumber (unique)
  - students.email
  - students.section
  - users.email (unique)
  - subjects.subjectCode (unique)
- [x] Database backups scheduled

### ✅ Testing

**Automated Tests:**

```bash
# Run test suite
cd /home/josh/notified-backend
export API_BASE_URL=http://localhost:5000/api/v1
export TEST_USER_EMAIL=admin@notified.com
export TEST_USER_PASSWORD=admin123
node scripts/test-backend-fixes.js
```

**Expected Results:**

- ✅ 7/7 tests passed
- ✅ All validation errors handled
- ✅ Rate limiting works
- ✅ Authentication required for protected routes
- ✅ Role-based authorization enforced

**Manual Tests:**

- [x] User can login
- [x] User can create student
- [x] User can send email
- [x] Admin can send bulk email
- [x] Staff cannot access admin-only routes
- [x] Invalid inputs return 400 with proper message
- [x] Rate limit triggers after 30 emails
- [x] Dashboard loads without errors

---

## Deployment Steps

### 1. Prepare Production Environment

```bash
# SSH into production server
ssh user@your-server.com

# Clone repository
git clone https://github.com/Java-Project-IM/notified-backend.git
cd notified-backend

# Switch to production branch
git checkout main
```

### 2. Install Dependencies

```bash
# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
npm ci --production

# Install PM2 globally
sudo npm install -g pm2
```

### 3. Configure Environment

```bash
# Create .env file
nano .env

# Paste production environment variables
# (See Environment Configuration above)

# Verify .env is not tracked by Git
cat .gitignore | grep .env
# Should show: .env
```

### 4. Database Setup

```bash
# Test MongoDB connection
node scripts/test-db-connection.js

# Expected output:
# ✅ MongoDB Connected successfully
# Database: notified-db

# Initialize database (if needed)
node scripts/init-database.js

# Run cleanup (optional - removes soft-deleted students)
node scripts/cleanup-database.js
```

### 5. Email Configuration

```bash
# Test email configuration
node scripts/test-email.js

# Expected output:
# ✅ Email configuration valid
# ✅ Test email sent successfully
```

### 6. Start Application

```bash
# Start with PM2
pm2 start src/app.js --name notified-backend --node-args="--max-old-space-size=2048"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions printed

# Check status
pm2 status

# View logs
pm2 logs notified-backend
```

### 7. Configure Nginx (Reverse Proxy)

```bash
# Install Nginx (if not installed)
sudo apt install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/notified-api

# Paste configuration:
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Security headers
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # Increase body size for file uploads
    client_max_body_size 10M;
}

# Rate limit zone
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/notified-api /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 8. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Certbot will automatically update Nginx config

# Test auto-renewal
sudo certbot renew --dry-run
```

### 9. Configure Firewall

```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 10. Setup Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Install PM2 web monitoring (optional)
pm2 web
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
# Test server health
curl https://api.yourdomain.com/health

# Expected:
# {
#   "success": true,
#   "message": "Server is running",
#   "environment": "production",
#   "timestamp": "2025-11-14T..."
# }
```

### 2. API Endpoints

```bash
# Test login endpoint
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notified.com","password":"your-password"}'

# Should return JWT token

# Test protected endpoint
curl -X GET https://api.yourdomain.com/api/v1/students \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return students list
```

### 3. Email Service

```bash
# Test email config (admin token required)
curl -X GET https://api.yourdomain.com/api/v1/emails/config \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected:
# {
#   "success": true,
#   "data": {
#     "configured": true,
#     "connectionValid": true,
#     "provider": "smtp.gmail.com"
#   }
# }

# Send test email
curl -X POST https://api.yourdomain.com/api/v1/emails/test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

### 4. Logging

```bash
# Check PM2 logs
pm2 logs notified-backend --lines 50

# Check error logs
tail -f logs/error.log

# Check app logs
tail -f logs/app.log

# No critical errors should appear
```

### 5. Performance

```bash
# Check memory usage
pm2 monit

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.yourdomain.com/health

# Create curl-format.txt:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer:  %{time_pretransfer}\n
time_redirect:  %{time_redirect}\n
time_starttransfer:  %{time_starttransfer}\n
----------\n
time_total:  %{time_total}\n

# Expected: time_total < 500ms
```

---

## Rollback Plan

### If Deployment Fails

```bash
# 1. Stop new deployment
pm2 stop notified-backend

# 2. Switch to previous version
git checkout previous-stable-tag

# 3. Reinstall dependencies
npm ci --production

# 4. Restart application
pm2 restart notified-backend

# 5. Verify rollback
curl https://api.yourdomain.com/health
```

### If Database Issues

```bash
# Restore from backup
mongorestore --uri="mongodb+srv://..." --archive=backup.archive

# Verify restoration
mongo your-connection-string --eval "db.students.count()"
```

---

## Maintenance Tasks

### Daily

```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs notified-backend --err --lines 20

# Monitor email service
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.yourdomain.com/api/v1/emails/config
```

### Weekly

```bash
# Backup database
mongodump --uri="mongodb+srv://..." --out=backup-$(date +%Y%m%d)

# Compress backup
tar -czf backup-$(date +%Y%m%d).tar.gz backup-$(date +%Y%m%d)/

# Check disk space
df -h

# Review error logs
cat logs/error.log | grep "ERROR" | wc -l

# Update dependencies (security patches only)
npm audit
npm audit fix
```

### Monthly

```bash
# Update Node.js (LTS version)
# Follow official Node.js upgrade guide

# Review SSL certificate expiry
sudo certbot certificates

# Performance audit
# Use tools like New Relic, DataDog, or PM2 Plus

# Security audit
npm audit
nmap localhost -p 5000
```

---

## Troubleshooting

### Server Won't Start

```bash
# Check PM2 logs
pm2 logs notified-backend --err

# Common issues:
# 1. Port 5000 already in use
lsof -i :5000
kill -9 PID

# 2. MongoDB connection failed
node scripts/test-db-connection.js

# 3. Missing environment variables
cat .env | grep EMAIL_HOST
```

### Email Not Sending

```bash
# Check email configuration
node scripts/test-email.js

# Common issues:
# 1. Gmail App Password not set
# 2. 2FA not enabled on Gmail
# 3. SMTP blocked by firewall
# 4. Rate limit exceeded

# Check email service logs
pm2 logs notified-backend | grep "email"
```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# If memory > 500MB:
# 1. Check for memory leaks
pm2 logs notified-backend | grep "memory"

# 2. Increase Node.js memory limit
pm2 delete notified-backend
pm2 start src/app.js --name notified-backend \
  --node-args="--max-old-space-size=4096"

# 3. Restart application
pm2 restart notified-backend
```

### Database Connection Issues

```bash
# Test connection
node scripts/test-db-connection.js

# Common issues:
# 1. IP not whitelisted in MongoDB Atlas
# 2. Incorrect connection string
# 3. Network issues

# Check MongoDB Atlas dashboard
# Ensure IP 0.0.0.0/0 is whitelisted (for cloud hosting)
```

---

## Support Contacts

### Technical Support

- **Email:** support@notified.com
- **Documentation:** https://github.com/Java-Project-IM/notified-backend/tree/main/documentation
- **Issue Tracker:** https://github.com/Java-Project-IM/notified-backend/issues

### Emergency Contacts

- **System Admin:** admin@notified.com
- **DevOps:** devops@notified.com

---

## ✅ Final Checklist

Before going live:

- [ ] All tests passed
- [ ] Environment variables configured
- [ ] MongoDB connected
- [ ] Email service working
- [ ] SSL certificate installed
- [ ] Nginx configured
- [ ] Firewall configured
- [ ] PM2 running and saved
- [ ] Logs rotation configured
- [ ] Monitoring setup
- [ ] Backup system configured
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Documentation updated

---

**Deployment Date:** ******\_\_\_******
**Deployed By:** ******\_\_\_******
**Production URL:** https://api.yourdomain.com
**Status:** ✅ Ready for Production
**Version:** 1.0.0 (Enterprise Grade)
