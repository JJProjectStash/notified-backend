# Deployment Guide - Notified Backend

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Deployment](#local-deployment)
3. [Production Deployment](#production-deployment)
4. [Platform-Specific Guides](#platform-specific-guides)
5. [Database Setup](#database-setup)
6. [Environment Configuration](#environment-configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Software
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **MongoDB**: 6.0 or higher (local or Atlas)
- **Git**: Latest version

### Accounts Needed
- MongoDB Atlas account (for cloud database)
- Email service (Gmail/SendGrid) for notifications
- Deployment platform account (Render/Railway/Heroku/DigitalOcean)

---

## Local Deployment

### Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/Java-Project-IM/notified-backend.git
cd notified-backend

# Install dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

Minimal configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/notified_db
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters
```

### Step 3: Start MongoDB (if local)

```bash
# Start MongoDB service
sudo systemctl start mongod

# Or using brew on macOS
brew services start mongodb-community
```

### Step 4: Run Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### Step 5: Verify Installation

```bash
# Check health endpoint
curl http://localhost:5000/health

# Expected response:
# {"success":true,"message":"Server is running","environment":"development"}
```

---

## Production Deployment

### Security Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique `JWT_SECRET` (32+ characters)
- [ ] Use strong, unique `JWT_REFRESH_SECRET`
- [ ] Configure production MongoDB URI with authentication
- [ ] Set appropriate `CORS_ORIGIN` (your frontend URLs)
- [ ] Enable HTTPS/SSL
- [ ] Configure email service with valid credentials
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting appropriately
- [ ] Remove/disable development tools

### Generate Secure Secrets

```bash
# Generate JWT secrets using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Platform-Specific Guides

### 1. Render

**Step 1: Create Web Service**
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: notified-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

**Step 2: Environment Variables**
Add in Render Dashboard → Environment:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notified_db
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
CORS_ORIGIN=https://your-frontend.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Step 3: Deploy**
- Click "Create Web Service"
- Render will automatically deploy on every push to main branch

**Custom Domain (Optional):**
- Dashboard → Settings → Custom Domain
- Add your domain and update DNS records

---

### 2. Railway

**Step 1: Deploy from GitHub**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to GitHub
railway link
```

**Step 2: Environment Variables**
```bash
# Set variables via CLI
railway variables set NODE_ENV=production
railway variables set MONGODB_URI=<your-uri>
railway variables set JWT_SECRET=<your-secret>

# Or add via Railway Dashboard
```

**Step 3: Deploy**
```bash
railway up
```

---

### 3. Heroku

**Step 1: Create App**
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create notified-backend

# Add MongoDB addon (optional)
heroku addons:create mongolab
```

**Step 2: Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=<your-secret>
heroku config:set JWT_REFRESH_SECRET=<your-refresh-secret>
heroku config:set CORS_ORIGIN=https://your-frontend.com
```

**Step 3: Deploy**
```bash
git push heroku main
```

---

### 4. DigitalOcean (Droplet)

**Step 1: Create Droplet**
- Ubuntu 22.04 LTS
- Basic plan: $6/month
- SSH key authentication

**Step 2: SSH and Setup**
```bash
# SSH into droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx
```

**Step 3: Deploy Application**
```bash
# Clone repository
cd /var/www
git clone https://github.com/Java-Project-IM/notified-backend.git
cd notified-backend

# Install dependencies
npm install --production

# Create .env file
nano .env
# (Add your environment variables)

# Start with PM2
pm2 start src/app.js --name notified-backend
pm2 save
pm2 startup
```

**Step 4: Configure Nginx**
```bash
nano /etc/nginx/sites-available/notified-backend
```

Add:
```nginx
server {
    listen 80;
    server_name api.yoursite.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/notified-backend /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Install SSL with Let's Encrypt
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.yoursite.com
```

---

## Database Setup

### MongoDB Atlas (Recommended for Production)

**Step 1: Create Cluster**
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Choose region closest to your server

**Step 2: Configure Security**
1. **Database Access**: Create database user
   - Username: notified_user
   - Password: Generate strong password
   - Role: Read and write to any database

2. **Network Access**: Add IP addresses
   - Add current IP
   - Add `0.0.0.0/0` for production (or specific IPs)

**Step 3: Get Connection String**
1. Clusters → Connect → Connect your application
2. Copy connection string
3. Replace `<password>` with your user's password
4. Update `MONGODB_URI` in `.env`

```
mongodb+srv://notified_user:<password>@cluster0.xxxxx.mongodb.net/notified_db?retryWrites=true&w=majority
```

---

## Environment Configuration

### Complete Production .env

```env
# Environment
NODE_ENV=production

# Server
PORT=5000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/notified_db

# JWT
JWT_SECRET=<64-char-random-string>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<64-char-random-string>
JWT_REFRESH_EXPIRES_IN=30d
JWT_COOKIE_EXPIRES_IN=7

# Bcrypt
BCRYPT_SALT_ROUNDS=12

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=yourapp@gmail.com
EMAIL_PASSWORD=<app-password>
EMAIL_FROM=noreply@notified.com

# CORS
CORS_ORIGIN=https://yourfrontend.com,https://www.yourfrontend.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Frontend URL (for email links)
FRONTEND_URL=https://yourfrontend.com
```

---

## Monitoring & Maintenance

### Using PM2

```bash
# View status
pm2 status

# View logs
pm2 logs notified-backend

# Monitor resources
pm2 monit

# Restart app
pm2 restart notified-backend

# Stop app
pm2 stop notified-backend

# Delete app
pm2 delete notified-backend
```

### Database Backups

```bash
# MongoDB dump (local)
mongodump --db notified_db --out /backup/$(date +%Y%m%d)

# MongoDB Atlas backups
# Configure in Atlas Dashboard → Backup tab
```

### Log Rotation

```bash
# Install logrotate
apt install -y logrotate

# Create config
nano /etc/logrotate.d/notified-backend
```

Add:
```
/var/www/notified-backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### Health Monitoring

Set up monitoring with:
- **UptimeRobot**: Free uptime monitoring
- **Sentry**: Error tracking
- **DataDog**: APM and logging
- **New Relic**: Performance monitoring

---

## Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```bash
# Check MongoDB is running
systemctl status mongod

# Check connection string format
# Ensure username, password, and database name are correct
```

**2. Port Already in Use**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

**3. Environment Variables Not Loading**
```bash
# Ensure .env file exists
ls -la .env

# Check file permissions
chmod 600 .env
```

**4. JWT Verification Errors**
- Ensure JWT secrets are the same across restarts
- Check token expiration settings
- Verify client is sending valid token format

---

## Post-Deployment

### 1. Create Admin User
```bash
# Use MongoDB shell or Compass
# Or create via API with superadmin registration
```

### 2. Test API Endpoints
```bash
# Health check
curl https://api.yoursite.com/health

# Login test
curl -X POST https://api.yoursite.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notified.com","password":"password"}'
```

### 3. Configure Frontend
Update frontend `.env`:
```
VITE_API_URL=https://api.yoursite.com/api/v1
```

---

## Security Best Practices

1. **Never commit `.env` file to Git**
2. **Use strong passwords** (20+ characters)
3. **Enable HTTPS** for all production environments
4. **Regular security updates**: `npm audit fix`
5. **Monitor logs** for suspicious activity
6. **Backup database** regularly
7. **Use environment-specific secrets**
8. **Implement rate limiting**
9. **Keep dependencies updated**: `npm update`
10. **Use CORS** restrictively

---

## Support

- **Issues**: [GitHub Issues](https://github.com/Java-Project-IM/notified-backend/issues)
- **Documentation**: Check README.md
- **Email**: support@notified.com

---

**Happy Deploying! 🚀**
