# Frontend Email Service Integration Guide

## 📧 Backend Email Endpoints Now Available

The backend now provides complete email functionality. Update your frontend to use these endpoints.

---

## 🔗 Available Endpoints

### Base URL

```
POST   /api/v1/emails/send
POST   /api/v1/emails/send-bulk
POST   /api/v1/emails/send-guardian
GET    /api/v1/emails/config
POST   /api/v1/emails/test
GET    /api/v1/emails/history
```

---

## 📝 Frontend Service Implementation

Update `/home/josh/notified-frontend/src/services/email.service.ts`:

```typescript
import api from './api';

export interface SendEmailRequest {
  to: string;
  subject: string;
  message: string;
}

export interface SendBulkEmailRequest {
  recipients: string[];
  subject: string;
  message: string;
}

export interface SendGuardianEmailRequest {
  studentId: string;
  guardianEmail?: string;
  subject: string;
  message: string;
}

export interface EmailConfigResponse {
  configured: boolean;
  connectionValid: boolean;
  provider: string;
  from: string;
}

export interface EmailResponse {
  success: boolean;
  recipient?: string;
  recipients?: string[];
  sentCount?: number;
  failedCount?: number;
  messageId?: string;
  message: string;
}

class EmailService {
  /**
   * Send single email
   */
  async sendEmail(data: SendEmailRequest): Promise<EmailResponse> {
    const response = await api.post('/emails/send', data);
    return response.data;
  }

  /**
   * Send bulk emails to multiple recipients
   */
  async sendBulkEmail(data: SendBulkEmailRequest): Promise<EmailResponse> {
    const response = await api.post('/emails/send-bulk', data);
    return response.data;
  }

  /**
   * Send email to student's guardian
   */
  async sendGuardianEmail(data: SendGuardianEmailRequest): Promise<EmailResponse> {
    const response = await api.post('/emails/send-guardian', data);
    return response.data;
  }

  /**
   * Check email configuration status
   */
  async getEmailConfig(): Promise<EmailConfigResponse> {
    const response = await api.get('/emails/config');
    return response.data;
  }

  /**
   * Test email configuration
   */
  async testEmailConfig(email: string): Promise<EmailResponse> {
    const response = await api.post('/emails/test', { email });
    return response.data;
  }

  /**
   * Get email history
   */
  async getEmailHistory(page = 1, limit = 20) {
    const response = await api.get('/emails/history', {
      params: { page, limit },
    });
    return response.data;
  }
}

export default new EmailService();
```

---

## 🎨 Update Email Modal Component

Update `/home/josh/notified-frontend/src/components/modals/EmailModal.tsx`:

### Remove Mock Warning

Replace:

```typescript
// ❌ Remove this
toast.error('Email service not configured on backend');
```

With:

```typescript
// ✅ Add this
import emailService from '@/services/email.service';
```

### Update Send Single Email

```typescript
const handleSendEmail = async () => {
  try {
    setLoading(true);

    await emailService.sendEmail({
      to: formData.to,
      subject: formData.subject,
      message: formData.message,
    });

    toast.success('Email sent successfully!');
    onClose();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to send email');
  } finally {
    setLoading(false);
  }
};
```

### Update Send Bulk Email

```typescript
const handleSendBulkEmail = async () => {
  try {
    setLoading(true);

    const result = await emailService.sendBulkEmail({
      recipients: selectedStudents.map((s) => s.email),
      subject: formData.subject,
      message: formData.message,
    });

    toast.success(`Email sent to ${result.sentCount} students!`);

    if (result.failedCount && result.failedCount > 0) {
      toast.warning(`Failed to send to ${result.failedCount} recipients`);
    }

    onClose();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to send bulk email');
  } finally {
    setLoading(false);
  }
};
```

### Update Send Guardian Email

```typescript
const handleSendGuardianEmail = async (studentId: string) => {
  try {
    setLoading(true);

    await emailService.sendGuardianEmail({
      studentId,
      subject: formData.subject,
      message: formData.message,
    });

    toast.success('Email sent to guardian successfully!');
    onClose();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to send guardian email');
  } finally {
    setLoading(false);
  }
};
```

### Add Email Configuration Check

```typescript
// Add this to check email configuration on component mount
useEffect(() => {
  const checkEmailConfig = async () => {
    try {
      const config = await emailService.getEmailConfig();

      if (!config.configured) {
        toast.warning('Email service not configured. Please contact administrator.');
        setEmailConfigured(false);
      } else if (!config.connectionValid) {
        toast.warning('Email service configuration invalid. Please contact administrator.');
        setEmailConfigured(false);
      } else {
        setEmailConfigured(true);
      }
    } catch (error) {
      console.error('Failed to check email config:', error);
      setEmailConfigured(false);
    }
  };

  checkEmailConfig();
}, []);

// Add state
const [emailConfigured, setEmailConfigured] = useState(true);

// Disable send button if not configured
<Button
  onClick={handleSendEmail}
  disabled={loading || !emailConfigured}
>
  {loading ? 'Sending...' : 'Send Email'}
</Button>
```

---

## 🧪 Testing the Integration

### 1. Test Single Email

```typescript
// In your component or test file
import emailService from '@/services/email.service';

const testSingleEmail = async () => {
  try {
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      message: 'This is a test email from Notified.',
    });

    console.log('✅ Email sent:', result);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
};
```

### 2. Test Bulk Email

```typescript
const testBulkEmail = async () => {
  try {
    const result = await emailService.sendBulkEmail({
      recipients: ['student1@example.com', 'student2@example.com'],
      subject: 'Class Announcement',
      message: 'Hello students! This is a bulk email test.',
    });

    console.log('✅ Bulk email sent:', result);
    console.log(`Sent to ${result.sentCount} recipients`);
    if (result.failedCount) {
      console.log(`Failed: ${result.failedCount} recipients`);
    }
  } catch (error) {
    console.error('❌ Failed to send bulk email:', error);
  }
};
```

### 3. Test Guardian Email

```typescript
const testGuardianEmail = async (studentId: string) => {
  try {
    const result = await emailService.sendGuardianEmail({
      studentId,
      subject: 'Student Attendance Notice',
      message: 'Your child was absent today. Please contact the school.',
    });

    console.log('✅ Guardian email sent:', result);
  } catch (error) {
    console.error('❌ Failed to send guardian email:', error);
  }
};
```

### 4. Check Email Configuration

```typescript
const checkConfig = async () => {
  try {
    const config = await emailService.getEmailConfig();

    console.log('Email Configuration:');
    console.log(`Configured: ${config.configured}`);
    console.log(`Valid: ${config.connectionValid}`);
    console.log(`Provider: ${config.provider}`);
    console.log(`From: ${config.from}`);
  } catch (error) {
    console.error('❌ Failed to check config:', error);
  }
};
```

---

## 🎯 Feature Enhancements

### Add Email History View

Create a new component to view email history:

```typescript
import { useEffect, useState } from 'react';
import emailService from '@/services/email.service';

const EmailHistoryPage = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  useEffect(() => {
    loadEmailHistory();
  }, [pagination.page]);

  const loadEmailHistory = async () => {
    try {
      setLoading(true);
      const result = await emailService.getEmailHistory(
        pagination.page,
        pagination.limit
      );

      setEmails(result.emails);
      setPagination(prev => ({
        ...prev,
        total: result.total,
      }));
    } catch (error) {
      console.error('Failed to load email history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Email History</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Sent By</th>
            </tr>
          </thead>
          <tbody>
            {emails.map(email => (
              <tr key={email._id}>
                <td>{new Date(email.createdAt).toLocaleDateString()}</td>
                <td>{email.recordType}</td>
                <td>{email.description}</td>
                <td>{email.performedBy?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EmailHistoryPage;
```

---

## ⚙️ Configuration Tips

### Environment Variables

Ensure your frontend `.env` has:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### API Service Base Configuration

Ensure `/home/josh/notified-frontend/src/services/api.ts` is configured:

```typescript
import axios from 'axios';
import { authStore } from '@/store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 📊 Error Handling

### Common Errors and Solutions

#### Error: "Email service not configured"

**Solution:** Backend needs email environment variables:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### Error: "Invalid email format"

**Solution:** Frontend should validate email before sending:

```typescript
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

if (!isValidEmail(formData.to)) {
  toast.error('Please enter a valid email address');
  return;
}
```

#### Error: "Student not found"

**Solution:** Ensure student ID is valid before sending guardian email:

```typescript
if (!studentId || studentId === '') {
  toast.error('Invalid student ID');
  return;
}
```

---

## ✅ Testing Checklist

After integration, test the following:

- [ ] Single email sends successfully
- [ ] Bulk email sends to multiple recipients
- [ ] Guardian email uses student's guardian email
- [ ] Email configuration check works
- [ ] Toast notifications appear for success/error
- [ ] Loading states work correctly
- [ ] Email validation prevents invalid addresses
- [ ] Error messages are user-friendly
- [ ] Email modal closes after successful send
- [ ] Form resets after sending

---

## 🎉 Success!

Once integrated, your frontend will have:

- ✅ Full email functionality
- ✅ Guardian email integration
- ✅ Bulk email support
- ✅ Email configuration validation
- ✅ Proper error handling
- ✅ Professional toast notifications

---

**Last Updated:** November 14, 2025  
**Backend Version:** 1.0.0  
**Status:** Ready for Integration
