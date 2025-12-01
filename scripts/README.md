# Scripts

This directory contains helper scripts for database and system maintenance. Use with caution — many scripts perform data modifications.

## reset-db-contents.js

Usage:

```bash
node scripts/reset-db-contents.js [--dry-run] [--force] [--exclude=users,sessions] [--include=students,attendance] [--uri=mongodb://localhost:27017/db]
```

- `--dry-run` (or `-d`) only shows document counts per collection; no deletions will be performed.
- `--force` (or `-f`) bypasses interactive confirmation prompt and proceeds.
- `--exclude` comma-separated collection list to skip during the sweep. Default exclusions include `users`, `roles`, `migrations`, and `sessions`.
- `--include` comma-separated collection list to explicitly sweep only those collections (overrides exclude).
- `--uri` explicit MongoDB connection string (falls back to `MONGODB_URI` in `.env`).

This script will call `deleteMany({})` on each selected collection to remove all documents, preserving collection structures and indexes.

**Safety Notes**:
- This script is destructive — ensure backups exist (mongodump) before running in non-test environments.
- Avoid running this in production unless intended. Use `--include` to explicitly target dev collections.

## seed-sample-data.js

Usage:

```bash
node scripts/seed-sample-data.js [--count=10] [--subjects=3] [--dry-run] [--wipe] [--force]
```

Defaults: creates 10 students and 3 subjects and 3 days of attendance records.

- `--count` number of students to create (default 10)
- `--subjects` number of subjects to create (default 3)
- `--dry-run` log planned operations instead of performing them
- `--wipe` delete sample documents (students, subjects, attendance, enrollments) before seeding
- `--force` skip confirmation prompts

**Note**: The script uses the default admin credentials from `.env` if present, otherwise creates an admin user using defaults in `.env`.

## cleanup-db.js

Usage:

```bash
node scripts/cleanup-db.js [--dry-run] [--force] [--include=students,attendance] [--exclude=users] [--preserve-admins]
```

- `--dry-run`: show collection counts only
- `--force`: skip interactive confirmation
- `--include`: only operate on specified collections (comma-separated)
- `--exclude`: skip specified collections (comma-separated)
- `--preserve-admins`: when removing documents from `users` collection, keep documents with role `admin` or `superadmin`

