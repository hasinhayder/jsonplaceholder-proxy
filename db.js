const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'cache.sqlite');

// Ensure /app/data exists
fs.mkdirSync(dataDir, { recursive: true });

// Open database
const db = new Database(dbPath);

// WAL = better concurrency
db.pragma('journal_mode = WAL');

// Create cache table
db.prepare(`
  CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    response TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`).run();

module.exports = db;
