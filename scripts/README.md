# Scripts

Utility scripts for database management and seeding.

## Commands

| Command | Description |
|---------|-------------|
| `npm run seed` | Seeds demo accounts + sample data (subjects, students, enrollments, attendance) |
| `npm run seed:accounts` | Seeds only demo user accounts |
| `npm run db:cleanup` | **WIPES ALL DATA** from the database (preserves users by default) |

---

## Seed

```bash
npm run seed
```

Seeds the complete demo environment:
- **5 demo user accounts** (all roles)
- **4 subjects** (CC105, CC106, GE103, PE102)
- **8 students** with Filipino names
- **Enrollments** for all students in all subjects
- **Attendance records** for the last 5 days

### Seed Options
```bash
npm run seed -- --force   # Skip confirmation prompts
```

### Demo Account Credentials

| Role | Email | Password |
|------|-------|----------|
| superadmin | superadmin@notified.com | SuperAdmin123! |
| admin | admin@notified.com | Admin123! |
| staff | staff@notified.com | Staff123! |
| professor | professor@notified.com | Professor123! |
| registrar | registrar@notified.com | Registrar123! |

---

## Seed Accounts Only

```bash
npm run seed:accounts
```

Seeds only the demo user accounts without sample data. Useful for production environments where you only need admin users.

---

## Database Cleanup

```bash
npm run db:cleanup
```

⚠️ **WARNING**: This deletes ALL data from the database!

Deletes:
- All attendance records
- All enrollments
- All activity records
- All students
- All subjects

**Users are preserved** by default. To also delete users:

```bash
npm run db:cleanup -- --include-users
```

### Cleanup Options
```bash
npm run db:cleanup -- --force          # Skip confirmation prompt
npm run db:cleanup -- --include-users  # Also delete user accounts
```
