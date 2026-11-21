const crypto = require('node:crypto');
const { db } = require('./db.js');

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function registerUser({ email, password, name, age, preferredLanguage = 'en' }) {
  if (!email || !email.includes('@')) {
    throw new Error('Valid email address is required.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const existingStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const existing = existingStmt.get(email.toLowerCase().trim());
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const id = crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const createdAt = new Date().toISOString();
  const userAge = age !== undefined && age !== null && !isNaN(parseInt(age)) ? parseInt(age) : null;

  const insertStmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, salt, name, age, preferred_language, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertStmt.run(id, email.toLowerCase().trim(), passwordHash, salt, name || 'User', userAge, preferredLanguage, createdAt);

  const token = createSession(id);
  return {
    user: {
      id,
      email: email.toLowerCase().trim(),
      name: name || 'User',
      age: userAge,
      preferred_language: preferredLanguage,
      is_admin: false,
      created_at: createdAt
    },
    token
  };
}

function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email.toLowerCase().trim());
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const expectedHash = hashPassword(password, user.salt);
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  const actualBuf = Buffer.from(user.password_hash, 'hex');

  // Constant-time comparison to prevent side-channel timing attacks
  if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    throw new Error('Invalid email or password.');
  }

  const token = createSession(user.id);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      preferred_language: user.preferred_language,
      is_admin: Boolean(user.is_admin),
      created_at: user.created_at
    },
    token
  };
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  const stmt = db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)');
  stmt.run(token, userId, createdAt, expiresAt);
  return token;
}

function getUserByToken(token) {
  if (!token) return null;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    SELECT u.id, u.email, u.name, u.age, u.preferred_language, u.is_admin, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `);
  const row = stmt.get(token, now);
  if (!row) return null;
  return {
    ...row,
    is_admin: Boolean(row.is_admin)
  };
}

function logoutUser(token) {
  if (!token) return;
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

function updateProfile(userId, { name, age, preferredLanguage }) {
  const userAge = age !== undefined && age !== null && !isNaN(parseInt(age)) ? parseInt(age) : null;
  const stmt = db.prepare(`
    UPDATE users 
    SET name = COALESCE(?, name),
        age = COALESCE(?, age),
        preferred_language = COALESCE(?, preferred_language)
    WHERE id = ?
  `);
  stmt.run(name || null, userAge, preferredLanguage || null, userId);

  const getStmt = db.prepare('SELECT id, email, name, age, preferred_language, created_at FROM users WHERE id = ?');
  return getStmt.get(userId);
}

function requestPasswordReset(email) {
  if (!email) throw new Error('Email is required.');
  const userStmt = db.prepare('SELECT id, email FROM users WHERE email = ?');
  const user = userStmt.get(email.toLowerCase().trim());
  if (!user) {
    // Return mock success for security so we don't leak whether email exists
    return { success: true, message: 'If this email exists, a reset instructions token has been generated.' };
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  const insertStmt = db.prepare('INSERT INTO password_resets (token, email, expires_at, used) VALUES (?, ?, ?, 0)');
  insertStmt.run(token, user.email, expiresAt);

  const isProd = process.env.NODE_ENV === 'production';
  return {
    success: true,
    ...(isProd ? {} : { resetToken: token }),
    message: isProd
      ? 'If this account exists, a password reset link has been dispatched to your registered email.'
      : 'Reset token generated successfully. Valid for 1 hour.'
  };
}

function resetPassword({ token, newPassword }) {
  if (!token || !newPassword || newPassword.length < 6) {
    throw new Error('Valid token and password of at least 6 characters are required.');
  }

  const now = new Date().toISOString();
  const resetStmt = db.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > ?');
  const record = resetStmt.get(token, now);
  if (!record) {
    throw new Error('Reset token is invalid or has expired.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(newPassword, salt);

  const updateStmt = db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE email = ?');
  updateStmt.run(passwordHash, salt, record.email);

  const markUsedStmt = db.prepare('UPDATE password_resets SET used = 1 WHERE token = ?');
  markUsedStmt.run(token);

  return { success: true, message: 'Password has been updated successfully.' };
}

function deleteUserAccount(userId) {
  if (!userId) return false;
  db.prepare('DELETE FROM reports WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  return true;
}

module.exports = {
  hashPassword,
  registerUser,
  loginUser,
  getUserByToken,
  logoutUser,
  updateProfile,
  requestPasswordReset,
  resetPassword,
  deleteUserAccount
};
