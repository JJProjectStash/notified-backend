#!/usr/bin/env node
/**
 * Reset DB Contents Script
 * Removes all documents from collections while preserving collection structure (indexes and schema).
 * Use with care. This script is interactive by default and requires confirmation.
 *
 * Usage:
 *  node scripts/reset-db-contents.js --dry-run --exclude=users,migrations
 *  node scripts/reset-db-contents.js --force --include=students,attendance
 *
 * Options:
 *  --dry-run       Show what would be deleted (counts) without performing deletions
 *  --force         Skip interactive confirmation
 *  --exclude       Comma-separated list of collection names to exclude (optional)
 *  --include       Comma-separated list of collection names to include (optional, overrides exclude)
 *  --uri           MongoDB URI (optional - defaults to MONGODB_URI in .env)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const readline = require('readline');

// Minimal CLI args parsing (avoid extra dependencies like yargs)
const rawArgs = process.argv.slice(2);
const parseArg = (key) => {
  const arg = rawArgs.find((a) => a.startsWith(`--${key}=`));
  return arg ? arg.split('=')[1] : null;
};

const hasFlag = (flag) => rawArgs.includes(`--${flag}`) || rawArgs.includes(`-${flag}`);

const DRY_RUN = hasFlag('dry-run') || hasFlag('d');
const FORCE = hasFlag('force') || hasFlag('f');
const INCLUDE = parseArg('include') ? parseArg('include').split(',').map((s) => s.trim()).filter(Boolean) : null;
const EXCLUDE = parseArg('exclude') ? parseArg('exclude').split(',').map((s) => s.trim()).filter(Boolean) : [];
const URI = parseArg('uri') || process.env.MONGODB_URI;

const defaultExclusions = [
  'users',
  'roles',
  'migrations',
  'sessions',
  'system.indexes',
  'system.profile',
  'system.users',
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (question) =>
  new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });

const estimateDocuments = async (db, collName) => {
  try {
    const coll = db.collection(collName);
    const count = await coll.countDocuments();
    return count;
  } catch (err) {
    return -1;
  }
};

const main = async () => {
  if (!URI) {
    console.error('❌ MongoDB URI not provided. Set MONGODB_URI in your .env or pass --uri.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await connectDB();

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const collNames = collections.map((c) => c.name).filter(Boolean);

  const exclusions = new Set([...defaultExclusions, ...EXCLUDE]);
  if (INCLUDE && INCLUDE.length) {
    // If include is set, only operate on these collections
    const toProcess = collNames.filter((n) => INCLUDE.includes(n));
    if (toProcess.length === 0) {
      console.log('⚠️  No collections matched the --include list. Aborting.');
      process.exit(1);
    }
    console.log('📋 Collections to process (include list):', toProcess.join(', '));
    await processCollections(db, toProcess);
    await mongoose.connection.close();
    process.exit(0);
  }

  const toProcess = collNames.filter((n) => !exclusions.has(n) && !n.startsWith('system.'));

  console.log('\n🌐 Identified Collections:');
  console.log('All Collections:', collNames.join(', '));
  console.log('\nExcluded Collections:', Array.from(exclusions).join(', '));
  console.log('\nCollections to sweep:', toProcess.join(', '));

  if (toProcess.length === 0) {
    console.log('✅ No collections to process. Exiting.');
    await mongoose.connection.close();
    process.exit(0);
  }

  // Dry-run: just show counts
  if (DRY_RUN) {
    console.log('\n🔎 Dry run mode: fetching document counts (no deletions)');
    let total = 0;
    for (const c of toProcess) {
      const count = await estimateDocuments(db, c);
      total += count >= 0 ? count : 0;
      console.log(` - ${c}: ${count >= 0 ? count : 'unknown'}`);
    }
    console.log(`\nℹ️  Total documents across selected collections: ${total}`);
    await mongoose.connection.close();
    process.exit(0);
  }

  // Confirm interactive unless forced
  if (!FORCE) {
    const answer = await ask('\n⚠️  This will delete ALL documents in the listed collections (indexes and collections remain). Are you sure? (type YES to continue) ');
    if (answer.trim() !== 'YES') {
      console.log('Aborting. No changes made.');
      await mongoose.connection.close();
      process.exit(0);
    }
  }

  console.log('\n🚿 Proceeding to delete documents...');
  await processCollections(db, toProcess);
  console.log('\n✅ Sweep completed.');
  await mongoose.connection.close();
  process.exit(0);
};

const processCollections = async (db, toProcess) => {
  const summary = [];
  for (const name of toProcess) {
    try {
      const coll = db.collection(name);
      const before = await coll.countDocuments();
      if (before === 0) {
        console.log(` - ${name}: already empty`);
        summary.push({ name, before, deleted: 0 });
        continue;
      }
      const result = await coll.deleteMany({});
      const after = await coll.countDocuments();
      const deleted = before - after;
      console.log(` - ${name}: deleted ${deleted} document(s)`);
      summary.push({ name, before, deleted });
    } catch (error) {
      console.error(`❌ Failed processing ${name}:`, error.message || error);
      summary.push({ name, before: -1, deleted: -1, error: error.message || error });
    }
  }

  // Summary
  console.log('\n📊 Sweep Summary');
  for (const s of summary) {
    console.log(` - ${s.name}: deleted ${s.deleted} (before=${s.before})`);
  }
};

// Run script
main().catch(async (err) => {
  console.error('❌ Script failed:', err);
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(1);
});
