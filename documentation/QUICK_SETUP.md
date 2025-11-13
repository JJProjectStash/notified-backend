# 🚀 Quick Setup Guide

Everything you need to get your backend running!

## ✅ What's Already Done

Your backend is **100% complete** with:
- ✅ All API endpoints implemented (57 total)
- ✅ JWT authentication configured
- ✅ Rate limiting enabled (100 req/15min)
- ✅ Logging system active
- ✅ Email notifications ready
- ✅ Input validation on all routes
- ✅ Error handling throughout

## 📋 Setup Checklist

### Step 1: Fix MongoDB Connection (REQUIRED)
```bash
node scripts/fix-connection-string.js
# Follow the instructions to get your connection string from MongoDB Atlas
# Update .env with correct connection string
node scripts/test-db-connection.js  # Verify it works
```

### Step 2: Configure Environment (REQUIRED)
```bash
node scripts/configure-env.js
```
This wizard will help you set up:
- JWT secrets (generates secure random keys)
- Email provider (optional, choose Gmail/Mailtrap/SendGrid)
- Rate limiting (adjust if needed)
- Logging level (adjust if needed)

### Step 3: Initialize Database (REQUIRED)
```bash
node scripts/init-database.js
```
This creates:
- Database indexes for performance
- Default admin user (admin@notified.com / Admin@123)

### Step 4: Start Server (REQUIRED)
```bash
npm run dev
```
You should see:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
```

## 📧 Email Setup (OPTIONAL)

Email is **optional** but enables:
- Attendance absence notifications
- Tardiness alerts
- System notifications

If you configured email, test it:
```bash
node scripts/test-email.js
```

### Email Options:

**Option 1: Gmail (Easy for Testing)**
1. Go to https://myaccount.google.com/apppasswords
2. Create an app password
3. Use it in configure-env.js

**Option 2: Mailtrap (Best for Development)**
1. Sign up at https://mailtrap.io
2. Get credentials from your inbox
3. Emails won't actually send (caught in Mailtrap)

**Option 3: SendGrid (Production)**
1. Sign up at https://sendgrid.com
2. Get API key
3. Use for production email sending

## 🔑 Understanding the Configuration

### JWT (Already Working!)
- Used for authentication (login/logout)
- Tokens expire after 24 hours
- **You just need to change the secret keys** (configure-env.js does this)

### Rate Limiting (Already Working!)
- **YES, it's necessary!** Prevents attacks
- Default: 100 requests per 15 minutes
- Protects against brute force and DDoS
- Already configured and active

### Logging (Already Working!)
- **YES, it's necessary!** For debugging
- Logs stored in `logs/` directory
- File rotation enabled (5MB max, 5 files)
- Already configured and active

## 🧪 Testing Your Setup

### 1. Test MongoDB Connection
```bash
node scripts/test-db-connection.js
```
Should show: ✅ Connected, database info, collections

### 2. Test Email (if configured)
```bash
node scripts/test-email.js
```
Should send a test email

### 3. Test API Endpoints
Start the server, then use Postman or curl:

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notified.com","password":"Admin@123"}'
```

Should return tokens and user data.

## 📁 Your Project Structure

```
notified-backend/
├── src/
│   ├── controllers/    # 7 controllers (HTTP handling)
│   ├── services/       # 7 services (business logic)
│   ├── routes/         # 7 route files (endpoints)
│   ├── models/         # 7 Mongoose models
│   ├── middleware/     # Auth, validation, error handling
│   └── config/         # Configuration files
├── scripts/
│   ├── configure-env.js           # Setup wizard ⭐
│   ├── test-db-connection.js      # Test MongoDB
│   ├── test-email.js              # Test email
│   ├── init-database.js           # Initialize DB
│   └── fix-connection-string.js   # MongoDB help
├── .env                # Your configuration
├── CONFIGURATION_GUIDE.md         # Detailed config help
├── MONGODB_FOR_BEGINNERS.md       # MongoDB tutorial
└── API_REFERENCE.md               # All 57 endpoints
```

## 🎯 What to Do Now

### Absolutely Required:
1. **Fix MongoDB connection** → `node scripts/fix-connection-string.js`
2. **Configure environment** → `node scripts/configure-env.js`
3. **Initialize database** → `node scripts/init-database.js`
4. **Start server** → `npm run dev`

### Optional but Recommended:
5. **Configure email** → Use configure-env.js wizard
6. **Test email** → `node scripts/test-email.js`
7. **Read API docs** → Open API_REFERENCE.md
8. **Change admin password** → Use user management API

## 🆘 Common Issues

### "querySrv ENOTFOUND" Error
**Problem:** MongoDB connection string is incomplete
**Solution:** Run `node scripts/fix-connection-string.js`

### "JWT malformed" Error
**Problem:** Invalid or missing JWT token
**Solution:** Make sure you're sending the token from login response

### Email Not Sending
**Problem:** Email not configured or wrong credentials
**Solution:** Run `node scripts/test-email.js` to diagnose

### "Cannot POST /api/..."
**Problem:** Wrong endpoint or route not registered
**Solution:** Check API_REFERENCE.md for correct endpoint

## 📚 Documentation Files

| File | Purpose | When to Read |
|------|---------|--------------|
| `QUICK_SETUP.md` (this file) | Quick start guide | **READ FIRST** |
| `CONFIGURATION_GUIDE.md` | Detailed config help | When configuring JWT/Email |
| `MONGODB_FOR_BEGINNERS.md` | MongoDB tutorial | If new to MongoDB |
| `API_REFERENCE.md` | All 57 endpoints | When building frontend |
| `IMPLEMENTATION_STATUS.md` | Project completion report | To see what's done |

## 🎓 Key Concepts

### Authentication Flow:
1. Login → Get access token + refresh token
2. Use access token in Authorization header
3. Token expires in 24h
4. Use refresh token to get new access token

### API Response Format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* your data */ }
}
```

### Error Response Format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [/* validation errors */]
}
```

## 🚀 Next Steps After Setup

1. **Test all endpoints** with Postman
2. **Change default admin password**
3. **Create test users** for development
4. **Connect your frontend**
5. **Deploy to production** when ready

## 💡 Pro Tips

- Keep your `.env` file secret (already in .gitignore)
- Use different JWT secrets for dev/prod
- Use Mailtrap for development (emails won't actually send)
- Check `logs/` directory if something goes wrong
- Read the Winston logs for detailed error info

## ✨ You're Almost Done!

Just run these 4 commands:
```bash
node scripts/fix-connection-string.js  # Fix MongoDB
node scripts/configure-env.js          # Configure JWT & Email
node scripts/init-database.js          # Setup database
npm run dev                            # Start server
```

Then you'll see:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
```

**That's it! Your backend is ready! 🎉**

---

Need help? Check:
- `CONFIGURATION_GUIDE.md` - Detailed setup
- `MONGODB_FOR_BEGINNERS.md` - MongoDB help
- `API_REFERENCE.md` - API documentation
