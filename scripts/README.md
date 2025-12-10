# Scripts

This directory contains utility scripts for database management and seeding.

## Available Scripts

### Seed Demo Accounts
```bash
npm run seed:accounts
```
Creates demo user accounts for all roles:
- **superadmin@notified.com** - SuperAdmin123! (Full system access)
- **admin@notified.com** - Admin123! (Admin panel access)
- **staff@notified.com** - Staff123! (Staff operations)
- **professor@notified.com** - Professor123! (View/mark attendance)
- **registrar@notified.com** - Registrar123! (Student/subject management)

### Seed Sample Data
```bash
npm run seed:data
```
Creates sample students, subjects, and attendance records for development.

**Options:**
- `--wipe` - Remove existing sample data first
- `--force` - Skip confirmation prompts
- `--count=N` - Number of students to create (default: 10)
- `--subjects=N` - Number of subjects to create (default: 3)
- `--dry-run` - Preview changes without making them

### Database Cleanup
```bash
npm run db:cleanup
```
Cleans up orphaned records and checks data integrity:
- Finds and optionally removes orphaned student records
- Checks for orphaned activity records
- Verifies data integrity (duplicates, missing fields)
- Reindexes collections
- Displays database statistics
