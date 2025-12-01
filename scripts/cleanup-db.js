#!/usr/bin/env node
/**
 * Cleanup DB script - Data only (preserve structure/indexes)
 * Usage:
 *  node scripts/cleanup-db.js --dry-run --include=students,attendance
 *  node scripts/cleanup-db.js --force --exclude=users
 * Options:
 *  --dry-run: print counts without deleting documents
 *  --force: skip interactive confirmation
 *  --include: comma separated collection names to process only
 *  --exclude: comma separated collection names to skip
 *  --preserve-admins: keep admin users (role=superadmin or admin) if deleting users
 */

require('dotenv').config();
const connectDB = require('../src/config/database');
const mongoose = require('mongoose');
const readline = require('readline');
const logger = require('../src/utils/logger');

const rawArgs = process.argv.slice(2);
const parseArg = (key) => {
  const rv = rawArgs.find((a) => a.startsWith(`--${key}=`));
  return rv ? rv.split('=')[1] : null;
};
const hasFlag = (flag) => rawArgs.includes(`--${flag}`) || rawArgs.includes(`-${flag}`);

const DRY_RUN = hasFlag('dry-run') || hasFlag('d');
const FORCE = hasFlag('force') || hasFlag('f');
const INCLUDE = parseArg('include') ? parseArg('include').split(',').map((s) => s.trim()).filter(Boolean) : null;
const EXCLUDE = parseArg('exclude') ? parseArg('exclude').split(',').map((s) => s.trim()).filter(Boolean) : [];
const PRESERVE_ADMINS = hasFlag('preserve-admins');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, (a) => r(a)));

const defaultExclusions = new Set(['roles', 'migrations', 'system.indexes', 'system.profile', 'system.users', 'sessions']);
const globalExclusions = new Set([...defaultExclusions, ...EXCLUDE]);

async function main() {
  await connectDB();
  const db = mongoose.connection.db;
  const collections = (await db.listCollections().toArray()).map((c) => c.name);

  let toProcess;
  if (INCLUDE && INCLUDE.length) {
    toProcess = collections.filter((n) => INCLUDE.includes(n) && !n.startsWith('system.'));
  } else {
    toProcess = collections.filter((n) => !globalExclusions.has(n) && !n.startsWith('system.'));
  }

  if (toProcess.length === 0) {
    console.log('No collections to process (after exclusions). Exiting.');
    process.exit(0);
  }

  console.log('Collections to process:', toProcess.join(', '));
  if (DRY_RUN) {
    console.log('\nDRY RUN: showing document counts...');
    for (const c of toProcess) {
      try {
        const count = await db.collection(c).countDocuments();
        console.log(` - ${c}: ${count}`);
      } catch (err) {
        console.error(` - ${c}: (error counting)`, err.message || err);
      }
    }
    await mongoose.connection.close();
    process.exit(0);
  }

  if (!FORCE) {
    const ans = await ask('\nThis will DELETE ALL DOCUMENTS from the selected collections (structure is preserved). Type YES to continue: ');
    if (ans.trim() !== 'YES') {
      console.log('Aborted. No changes made.');
      await mongoose.connection.close();
      process.exit(0);
    }
  }

  const summary = [];
  for (const name of toProcess) {
    try {
      if (name === 'users' && PRESERVE_ADMINS) {
        const { deletedCount } = await db.collection('users').deleteMany({ role: { $nin: ['admin', 'superadmin'] } });
        summary.push({ name, deleted: deletedCount });
        console.log(` - ${name}: deleted ${deletedCount} non-admin users (preserved admin users)`);
        continue;
      }

      const before = await db.collection(name).countDocuments();
      if (before === 0) {
        console.log(` - ${name}: already empty`);
        summary.push({ name, deleted: 0 });
        continue;
      }

      const { deletedCount } = await db.collection(name).deleteMany({});
      console.log(` - ${name}: deleted ${deletedCount} document(s)`);
      summary.push({ name, deleted: deletedCount });
    } catch (err) {
      console.error(`Failed to process ${name}:`, err.message || err);
      summary.push({ name, deleted: -1, error: err.message || String(err) });
    }
  }

  console.log('\nSummary:');
  for (const s of summary) console.log(` - ${s.name}: deleted ${s.deleted}`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Script failed:', err);
  try { await mongoose.connection.close(); } catch (e) {}
  process.exit(1);
});
