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

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    name TEXT,
    age INTEGER,
    preferred_language TEXT DEFAULT 'en',
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

module.exports = {
  db,
  DB_PATH
};
