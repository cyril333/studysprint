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

// ── Create Tables ───────────────────────────────────────────
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
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    userId      INTEGER NOT NULL,
    token       TEXT    NOT NULL UNIQUE,
    expiresAt   DATETIME NOT NULL,
    used        INTEGER NOT NULL DEFAULT 0,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TRIGGER IF NOT EXISTS update_users_timestamp
  AFTER UPDATE ON users
  BEGIN
    UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
  END;
`);

// Safely ensure bio column exists on users table
try {
  db.exec("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''");
} catch (e) {
  // Column already exists, safe to ignore
}

console.log('[DB] SQLite database initialized at:', dbPath);

module.exports = db;
