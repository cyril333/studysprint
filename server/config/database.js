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

  -- ── Increment 3: Core StudySprint Tables ──────────────────
  CREATE TABLE IF NOT EXISTS subjects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    userId      INTEGER NOT NULL,
    name        TEXT    NOT NULL,
    code        TEXT    DEFAULT '',
    description TEXT    DEFAULT '',
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS topics (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    subjectId   INTEGER NOT NULL,
    userId      INTEGER NOT NULL,
    name        TEXT    NOT NULL,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    topicId     INTEGER NOT NULL,
    userId      INTEGER NOT NULL,
    title       TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topicId) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    noteId      INTEGER NOT NULL,
    userId      INTEGER NOT NULL,
    title       TEXT    NOT NULL,
    summary     TEXT    DEFAULT '',
    shareToken  TEXT    UNIQUE,
    isShared    INTEGER NOT NULL DEFAULT 0,
    isFlagged   INTEGER NOT NULL DEFAULT 0,
    flagReason  TEXT    DEFAULT '',
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (noteId) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS questions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    quizId       INTEGER NOT NULL,
    prompt       TEXT    NOT NULL,
    options      TEXT    NOT NULL,
    correctIndex INTEGER NOT NULL,
    explanation  TEXT    DEFAULT '',
    FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    quizId         INTEGER NOT NULL,
    userId         INTEGER NOT NULL,
    score          INTEGER NOT NULL,
    totalQuestions INTEGER NOT NULL,
    percentage     REAL    NOT NULL,
    answers        TEXT    NOT NULL,
    completedAt    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS study_sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    userId          INTEGER NOT NULL,
    subjectId       INTEGER,
    topicId         INTEGER,
    title           TEXT    NOT NULL,
    scheduledAt     DATETIME NOT NULL,
    durationMinutes INTEGER NOT NULL DEFAULT 45,
    status          TEXT    NOT NULL DEFAULT 'planned',
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE SET NULL,
    FOREIGN KEY (topicId) REFERENCES topics(id) ON DELETE SET NULL
  );
`);

// Safely ensure bio column exists on users table
try {
  db.exec("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''");
} catch (e) {
  // Column already exists, safe to ignore
}

console.log('[DB] SQLite database initialized at:', dbPath);

module.exports = db;
