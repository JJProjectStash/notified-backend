# Quick Test Guide - Subject Creation Fix

## 🎯 Quick Test (5 minutes)

### Option 1: Using Postman/Thunder Client

1. **Login to get token**:

   ```http
   POST http://localhost:5000/api/v1/auth/login
   Content-Type: application/json

   {
     "email": "admin@notified.com",
     "password": "your_password"
   }
   ```

2. **Create a subject** (copy the token from login response):

   ```http
   POST http://localhost:5000/api/v1/subjects
   Content-Type: application/json
   Authorization: Bearer YOUR_TOKEN_HERE

   {
     "subjectCode": "CS101",
     "subjectName": "Introduction to Computer Science",
     "description": "Fundamentals of programming",
     "yearLevel": 1,
     "section": "A"
   }
   ```

3. **Expected Result**:
   - ✅ Status: `201 Created`
   - ✅ Response contains subject data
   - ❌ NO "Record validation failed: recordType" error

---

### Option 2: Using cURL

```bash
# Step 1: Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@notified.com","password":"your_password"}' \
  | jq -r '.data.token')

# Step 2: Create Subject
curl -X POST http://localhost:5000/api/v1/subjects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "subjectCode": "CS101",
    "subjectName": "Introduction to Computer Science",
    "description": "Fundamentals of programming",
    "yearLevel": 1,
    "section": "A"
  }' | jq
```

---

### Option 3: Using Test Script

```bash
# Step 1: Get your auth token (login via Postman or frontend)

# Step 2: Run test script
node scripts/test-subject-creation.js "YOUR_TOKEN_HERE"
```

---

## 🔍 Verify the Fix

### Check Logs

```bash
tail -f logs/combined.log
```

**Before Fix**:

```
ERROR: Record validation failed: recordType: Record type is required
```

**After Fix**:

```
INFO: Subject created: CS101 by user 673627...
POST /api/v1/subjects 201 42.123 ms
```

### Check Database

```javascript
// 1. Check subject was created
db.subjects.findOne({ subjectCode: 'CS101' });

// 2. Check audit record exists
db.records
  .find({
    recordType: 'SUBJECT_ADDED',
  })
  .sort({ createdAt: -1 })
  .limit(1);
```

Expected audit record:

```json
{
  "subject": ObjectId("..."),
  "recordType": "SUBJECT_ADDED",  // ✅ Not undefined!
  "recordData": "Subject CS101 - Introduction to Computer Science created",
  "performedBy": ObjectId("..."),
  "createdAt": ISODate("...")
}
```

---

## ❌ Common Issues

### Issue 1: "Section is required"

**Cause**: Backend requires `section` field  
**Fix**: Add `"section": "A"` to your request

### Issue 2: "Subject code already exists"

**Cause**: Subject code must be unique  
**Fix**: Use a different subject code (e.g., `CS102`, `MATH101`)

### Issue 3: "Invalid token"

**Cause**: Token expired or invalid  
**Fix**: Login again to get a fresh token

### Issue 4: 403 Forbidden

**Cause**: User doesn't have permission (requires staff/admin role)  
**Fix**: Login with a staff or admin account

---

## 🎯 Success Criteria

✅ **Fix is Working If**:

- Subject creation returns `201 Created`
- Response contains the created subject data
- No "Record validation failed: recordType" error
- Audit record is created in database with `recordType: "SUBJECT_ADDED"`
- Logs show: "Subject created: CS101 by user..."

❌ **Fix Needs Attention If**:

- Still getting "Record validation failed: recordType" error
- Subject is created but no audit record exists
- Server crashes or restarts unexpectedly

---

## 📝 Quick Checklist

- [ ] Backend server is running (`node src/app.js` or `npm start`)
- [ ] MongoDB is connected (check logs for "MongoDB Connected")
- [ ] You have a valid authentication token
- [ ] Your user has staff or admin role
- [ ] You're using the correct field names (`subjectCode`, `subjectName`, etc.)
- [ ] Section field is included in request

---

## 🆘 Need Help?

**Server not starting?**

```bash
cd /home/josh/notified-backend
npm install
npm start
```

**MongoDB connection issues?**

- Check `.env` file has correct `MONGODB_URI`
- Verify IP is whitelisted in MongoDB Atlas
- Check internet connection

**Token issues?**

- Make sure you're copying the full token
- Check token isn't expired (default: 24 hours)
- Verify `Authorization` header format: `Bearer <token>`

---

## 🔗 Related Documentation

- **Full Fix Documentation**: `documentation/SUBJECT_CREATION_FIX.md`
- **API Reference**: `documentation/API_REFERENCE.md`
- **Frontend Integration**: `documentation/FRONTEND_BACKEND_SYNC.md`

---

**Last Updated**: November 14, 2025  
**Status**: ✅ Ready for Testing
