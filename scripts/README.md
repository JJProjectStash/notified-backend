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
