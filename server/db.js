// Suppress internal SQLite experimental warnings for clean log output
if (typeof process !== 'undefined' && process.emitWarning) {
  const origEmit = process.emitWarning;
  process.emitWarning = function(warning, ...args) {
    if (typeof warning === 'string' && (warning.includes('SQLite') || warning.includes('experimental'))) return;
    if (args.length > 0 && typeof args[0] === 'string' && (args[0].includes('SQLite') || args[0].includes('ExperimentalWarning'))) return;
    if (args.length > 1 && typeof args[1] === 'string' && (args[1].includes('SQLite') || args[1].includes('ExperimentalWarning'))) return;
    if (warning && (warning.name === 'ExperimentalWarning' || (warning.message && warning.message.includes('SQLite')))) return;
    return origEmit.apply(process, [warning, ...args]);
  };
}

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'see_and_solve.db');
const db = new DatabaseSync(DB_PATH);

// Initialize schema
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    name TEXT,
    age INTEGER,
    preferred_language TEXT DEFAULT 'en',
    is_admin INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    guest_session_id TEXT,
    image_path TEXT,
    description TEXT NOT NULL,
    voice_used INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en',
    location_city TEXT,
    location_district TEXT,
    location_coords TEXT,
    ai_analysis_json TEXT,
    troubleshooting_json TEXT,
    videos_json TEXT,
    technicians_json TEXT,
    gov_complaint_json TEXT,
    status TEXT DEFAULT 'analyzed',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0
  );
`);

// Migration for existing tables: add is_admin if not present
try {
  db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;`);
} catch (e) {
  // Column already present
}

module.exports = {
  db,
  DB_PATH
};
