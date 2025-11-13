# MongoDB Setup Guide for Notified Backend

## 📋 Overview

MongoDB is a NoSQL database that stores data in "collections" (similar to tables in SQL). The great news is that **MongoDB automatically creates collections when you first insert data**, so you don't need to manually create them!

---

## 🎯 Quick Start Options

You have **two options** for running MongoDB:

### Option 1: MongoDB Atlas (Cloud) - **RECOMMENDED** ✅

- Already configured in your `.env` file
- No installation needed
- Free tier available
- Automatic backups

### Option 2: Local MongoDB (Your Computer)

- Need to install MongoDB locally
- Good for development/testing
- No internet required

---

## 🌐 Option 1: MongoDB Atlas (Cloud) Setup

### Step 1: Verify Your Connection String

Your current MongoDB URI in `.env`:

```
MONGODB_URI=mongodb+srv://dalupangjuztyneclever1:uCsM7xoBkvnMeXO1@cluster.mongodb.net/notified-db
```

**⚠️ SECURITY WARNING**: This connection string is visible in your code. For production:

1. Change the password in MongoDB Atlas
2. Never commit `.env` to git (it's already in `.gitignore`)

### Step 2: Fix Your Connection String

Your current string is missing the cluster name. Update it to:

```
MONGODB_URI=mongodb+srv://dalupangjuztyneclever1:uCsM7xoBkvnMeXO1@cluster0.xxxxx.mongodb.net/notified_db?retryWrites=true&w=majority
```

Replace:

- `cluster0` with your actual cluster name
- `xxxxx` with your cluster ID (you can find this in MongoDB Atlas)
- `notified_db` is your database name (you can keep this or change it)

### Step 3: Get the Correct Connection String from Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Click on your cluster
4. Click "Connect" button
5. Choose "Connect your application"
6. Copy the connection string
7. Replace `<password>` with your actual password
8. Replace `myFirstDatabase` with `notified_db`

### Step 4: Whitelist Your IP Address

1. In MongoDB Atlas, go to "Network Access"
2. Click "Add IP Address"
3. Either:
   - Click "Add Current IP Address"
   - Or click "Allow Access from Anywhere" (0.0.0.0/0) for development

---

## 💻 Option 2: Local MongoDB Setup

### On Ubuntu/Linux:

```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod
```

### Update your .env for local MongoDB:

```env
MONGODB_URI=mongodb://localhost:27017/notified_db
```

---

## 🗄️ Understanding MongoDB Collections

MongoDB will automatically create these collections when you use the app:

1. **users** - User accounts (admin, staff)
2. **students** - Student information
3. **subjects** - Course/subject data
4. **attendances** - Attendance records
5. **records** - Activity audit logs
6. **notifications** - User notifications
7. **enrollments** - Student-subject enrollments

**You don't need to create these manually!** They're created automatically when you first save data to them.

---

## 🚀 Testing Your Connection

### Method 1: Run the Backend

```bash
cd /home/josh/notified-backend
npm run dev
```

Look for this message:

```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
```

### Method 2: Use the Connection Test Script

Run the test script I'll create for you:

```bash
node scripts/test-db-connection.js
```

---

## 📊 Viewing Your Data

### Option 1: MongoDB Atlas Web Interface

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click "Browse Collections"
3. Select your database (`notified_db`)
4. View your collections

### Option 2: MongoDB Compass (Desktop App)

1. Download from [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Install and open
3. Paste your connection string
4. Connect and browse your data

### Option 3: VS Code Extension

1. Install "MongoDB for VS Code" extension
2. Click MongoDB icon in sidebar
3. Add connection with your URI
4. Browse collections

---

## 🔧 Database Initialization Script

After connecting, run the initialization script to:

- Create a default admin user
- Set up indexes for performance
- Verify all collections work

```bash
node scripts/init-database.js
```

---

## 🆘 Common Connection Issues

### Issue 1: "MongoNetworkError: connect ECONNREFUSED"

**Solution**: MongoDB is not running or wrong connection string

- For local: Start MongoDB with `sudo systemctl start mongod`
- For Atlas: Check connection string and network access

### Issue 2: "MongoServerError: Authentication failed"

**Solution**: Wrong username or password

- Verify credentials in MongoDB Atlas
- Update `.env` file with correct password

### Issue 3: "MongooseServerSelectionError: connect ETIMEDOUT"

**Solution**: IP not whitelisted or network issue

- Add your IP to Network Access in Atlas
- Check firewall settings

### Issue 4: "Database name is missing"

**Solution**: Add database name to connection string

```
mongodb+srv://user:pass@cluster.mongodb.net/notified_db
                                            ^^^^^^^^^^^
```

---

## 📝 Next Steps After Connection

1. ✅ Test connection with `npm run dev`
2. ✅ Run database initialization: `node scripts/init-database.js`
3. ✅ Register first user via API: `POST /api/v1/auth/register`
4. ✅ Start using the API endpoints

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use strong passwords** - Change default passwords
3. **Whitelist specific IPs** - Don't use 0.0.0.0/0 in production
4. **Enable encryption** - MongoDB Atlas does this by default
5. **Regular backups** - Atlas provides automatic backups
6. **Use environment variables** - Never hardcode credentials

---

## 📚 Useful MongoDB Commands

### Using MongoDB Shell (mongosh)

```bash
# Connect to local MongoDB
mongosh

# Connect to Atlas
mongosh "mongodb+srv://cluster.mongodb.net/notified_db" --username yourUsername

# Show databases
show dbs

# Use your database
use notified_db

# Show collections
show collections

# Count documents
db.users.countDocuments()

# Find all users
db.users.find().pretty()

# Find one user
db.users.findOne({ email: "admin@notified.com" })

# Delete all data (CAREFUL!)
db.dropDatabase()
```

---

## 🎓 Learning Resources

- [MongoDB Atlas Tutorial](https://docs.atlas.mongodb.com/getting-started/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB University](https://university.mongodb.com/) - Free courses

---

**Need help?** Check the troubleshooting section or run the test scripts!
