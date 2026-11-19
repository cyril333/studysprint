// ============================================================
// StudySprint - Database Configuration (SQLite)
// ============================================================
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'studysprint.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Create Users Table ──────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName    TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    username    TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'student',
    status      TEXT    NOT NULL DEFAULT 'active',
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('[DB] SQLite database initialized at:', dbPath);

module.exports = db;
