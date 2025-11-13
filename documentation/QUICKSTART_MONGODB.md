# 🚀 Quick Start Guide - MongoDB Setup

## For Beginners: 3 Simple Steps

### ⚡ Step 1: Test Your MongoDB Connection

Run this command to test if MongoDB is working:

```bash
node scripts/test-db-connection.js
```

**What you should see:**

- ✅ "Successfully connected to MongoDB!"
- Your database name and collections

**If you see an error:**

- Check the troubleshooting section below

---

### ⚡ Step 2: Initialize Your Database

This creates the admin user and sets up indexes:

```bash
node scripts/init-database.js
```

**What this does:**

- Creates database indexes (makes queries fast)
- Creates a default admin user
- Shows your login credentials

**Default Admin Credentials:**

- Email: `admin@notified.com`
- Password: `Admin@123`

⚠️ **IMPORTANT**: Change this password after first login!

---

### ⚡ Step 3: Start Your Server

```bash
npm run dev
```

**What you should see:**

```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
```

**Now you can:**

- Open Postman or your browser
- Test the API at `http://localhost:5000/api/v1/auth/login`
- Use the admin credentials to login

---

## 🔧 Your MongoDB Connection (Current Setup)

Looking at your `.env` file, you're using **MongoDB Atlas** (cloud MongoDB).

### ⚠️ Your Connection String Needs Fixing

Your current connection string is incomplete. It should look like this:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/notified_db?retryWrites=true&w=majority
```

### How to Get the Correct Connection String:

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Login** to your account
3. **Click on your cluster** (should see your cluster name)
4. **Click "Connect"** button
5. **Choose "Connect your application"**
6. **Copy the connection string**
7. **Replace** `<password>` with your actual password
8. **Replace** `myFirstDatabase` with `notified_db`
9. **Paste** it in your `.env` file

### Example:

```env
# Before (incorrect)
MONGODB_URI=mongodb+srv://dalupangjuztyneclever1:uCsM7xoBkvnMeXO1@cluster.mongodb.net/notified-db

# After (correct)
MONGODB_URI=mongodb+srv://dalupangjuztyneclever1:uCsM7xoBkvnMeXO1@cluster0.a1b2c3.mongodb.net/notified_db?retryWrites=true&w=majority
```

---

## 🆘 Troubleshooting

### Problem: "MongoNetworkError" or "ECONNREFUSED"

**Solution 1 - Whitelist Your IP Address:**

1. Go to MongoDB Atlas
2. Click "Network Access" in left sidebar
3. Click "Add IP Address"
4. Click "Allow Access from Anywhere" (for development)
5. Click "Confirm"
6. Wait 1-2 minutes for changes to apply

**Solution 2 - Check Your Connection String:**

1. Make sure you copied the FULL connection string from Atlas
2. Make sure you replaced `<password>` with your real password
3. Make sure there are no extra spaces

### Problem: "Authentication failed"

**Solution:**

1. Go to MongoDB Atlas
2. Click "Database Access"
3. Make sure your user exists
4. Reset the password if needed
5. Update the password in your `.env` file

### Problem: "Cannot find module 'dotenv'"

**Solution:**

```bash
npm install
```

This installs all required packages.

---

## 📊 Understanding MongoDB Collections

Think of collections like "tables" in SQL, but simpler:

| Collection        | What It Stores        | Created When                      |
| ----------------- | --------------------- | --------------------------------- |
| **users**         | Admin, staff accounts | You register first user           |
| **students**      | Student information   | You add first student             |
| **subjects**      | Courses/classes       | You create first subject          |
| **attendances**   | Attendance records    | You mark first attendance         |
| **notifications** | User notifications    | System creates first notification |
| **records**       | Activity logs         | System creates automatically      |
| **enrollments**   | Student-subject links | You enroll first student          |

**Good News:** You don't need to create these manually! MongoDB creates them automatically when you insert the first document.

---

## 🎯 Testing Your Setup

### Test 1: Connection Test

```bash
node scripts/test-db-connection.js
```

Should show: ✅ Successfully connected

### Test 2: Database Initialization

```bash
node scripts/init-database.js
```

Should show: ✅ Admin user created

### Test 3: Start Server

```bash
npm run dev
```

Should show: ✅ MongoDB connected successfully

### Test 4: API Test (Using curl)

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notified.com","password":"Admin@123"}'
```

Should return: JWT token and user info

---

## 📱 Viewing Your Data

### Option 1: MongoDB Atlas Website

1. Go to https://cloud.mongodb.com/
2. Click "Browse Collections"
3. See your data

### Option 2: MongoDB Compass (Recommended)

1. Download: https://www.mongodb.com/try/download/compass
2. Install the app
3. Paste your connection string
4. Browse your data visually

### Option 3: VS Code Extension

1. Install "MongoDB for VS Code" extension
2. Add your connection
3. Browse from VS Code

---

## 🎓 What You Need to Know About MongoDB

### 1. No Schema Required

Unlike SQL, you don't need to define tables first. Just save data!

### 2. Documents = Rows

Each record is called a "document" (like a JSON object)

### 3. Collections = Tables

Groups of documents are called "collections"

### 4. Automatic Creation

Collections are created automatically when you insert data

### 5. Flexible Structure

You can add fields without changing the schema

---

## 🔐 Security Checklist

- [ ] Change admin password after first login
- [ ] Don't commit `.env` file to git (already in `.gitignore`)
- [ ] Use strong passwords
- [ ] Whitelist only necessary IPs in production
- [ ] Regularly backup your database

---

## 🎯 Next Steps After Setup

1. ✅ Run connection test
2. ✅ Run database initialization
3. ✅ Start the server
4. ✅ Login with admin credentials
5. ✅ Change admin password
6. ✅ Create your first student
7. ✅ Create your first subject
8. ✅ Mark attendance

---

## 📚 Helpful Resources

- **Full MongoDB Guide**: `MONGODB_SETUP_GUIDE.md`
- **API Documentation**: `README.md`
- **All Endpoints**: `API_REFERENCE.md`
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/

---

## 💬 Need More Help?

If you're stuck, check:

1. `MONGODB_SETUP_GUIDE.md` - Detailed MongoDB guide
2. `README.md` - API documentation
3. MongoDB Atlas Support - https://support.mongodb.com/

---

**Remember:** MongoDB is much simpler than traditional SQL databases. You don't need to create tables, define schemas, or run migrations. Just connect and start using it! 🚀
