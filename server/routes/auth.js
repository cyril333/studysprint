// ============================================================
// StudySprint - Authentication Routes
// ============================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/auth/register ─────────────────────────────────
// Creates a new student account.
router.post('/register', (req, res) => {
  try {
    const { fullName, email, username, password, confirmPassword } = req.body;

    // --- Validate required fields ---
    if (!fullName || !email || !username || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // --- Validate full name ---
    if (fullName.trim().length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
    }

    // --- Validate email format ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    // --- Validate username ---
    if (username.trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores.' });
    }

    // --- Validate password ---
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // --- Confirm password match ---
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // --- Check for duplicate email ---
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // --- Check for duplicate username ---
    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username.toLowerCase());
    if (existingUsername) {
      return res.status(409).json({ message: 'This username is already taken.' });
    }

    // --- Hash password with bcrypt (10 salt rounds) ---
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // --- Insert user with default 'student' role ---
    const stmt = db.prepare(`
      INSERT INTO users (fullName, email, username, password, role, status)
      VALUES (?, ?, ?, ?, 'student', 'active')
    `);

    const result = stmt.run(fullName.trim(), email.toLowerCase(), username.toLowerCase(), hashedPassword);

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: result.lastInsertRowid,
        fullName: fullName.trim(),
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        role: 'student'
      }
    });

  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// ── POST /api/auth/login ────────────────────────────────────
// Authenticates a user and returns a JWT token.
router.post('/login', (req, res) => {
  try {
    const { login, password } = req.body;

    // --- Validate fields ---
    if (!login || !password) {
      return res.status(400).json({ message: 'Email/username and password are required.' });
    }

    // --- Find user by email OR username ---
    const user = db.prepare(
      'SELECT * FROM users WHERE email = ? OR username = ?'
    ).get(login.toLowerCase(), login.toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'Invalid email/username or password.' });
    }

    // --- Check if account is suspended ---
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact an administrator.' });
    }

    // --- Verify password ---
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email/username or password.' });
    }

    // --- Generate JWT token ---
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'studysprint_jwt_secret_key_2026_secure',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────
// Returns the currently authenticated user's profile.
router.get('/me', authenticate, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, fullName, email, username, role, status, createdAt FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('[Me Error]', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/auth/forgot-password ──────────────────────────
// Generates a secure, expiring, single-use password reset token.
router.post('/forgot-password', (req, res) => {
  try {
    const { login } = req.body;

    if (!login || !login.trim()) {
      return res.status(400).json({ message: 'Please provide your registered email or username.' });
    }

    const trimmedLogin = login.trim().toLowerCase();
    const user = db.prepare(
      'SELECT id, fullName, email, username, status FROM users WHERE email = ? OR username = ?'
    ).get(trimmedLogin, trimmedLogin);

    if (!user) {
      return res.status(404).json({ message: 'No account found with that email or username.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'This account has been suspended. Please contact an administrator.' });
    }

    // Invalidate previous unused reset tokens for this user
    db.prepare('UPDATE password_resets SET used = 1 WHERE userId = ? AND used = 0').run(user.id);

    // Generate a cryptographically secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO password_resets (userId, token, expiresAt, used)
      VALUES (?, ?, ?, 0)
    `).run(user.id, token, expiresAt);

    // Return success response with token for local/lab evaluation
    res.json({
      message: 'Password reset request verified. Proceed to set your new password.',
      token,
      resetUrl: `/reset-password?token=${token}`,
      email: user.email,
      expiresIn: '30 minutes'
    });

  } catch (error) {
    console.error('[Forgot Password Error]', error);
    res.status(500).json({ message: 'Server error while generating reset token.' });
  }
});

// ── GET /api/auth/verify-reset-token/:token ──────────────────
// Validates whether a reset token is valid, unused, and unexpired.
router.get('/verify-reset-token/:token', (req, res) => {
  try {
    const { token } = req.params;

    const resetRecord = db.prepare(`
      SELECT pr.*, u.email, u.username
      FROM password_resets pr
      JOIN users u ON u.id = pr.userId
      WHERE pr.token = ?
    `).get(token);

    if (!resetRecord) {
      return res.status(400).json({ valid: false, message: 'Invalid reset token.' });
    }

    if (resetRecord.used === 1) {
      return res.status(400).json({ valid: false, message: 'This reset token has already been used.' });
    }

    if (new Date(resetRecord.expiresAt) < new Date()) {
      return res.status(400).json({ valid: false, message: 'This reset token has expired. Please request a new one.' });
    }

    res.json({
      valid: true,
      email: resetRecord.email,
      username: resetRecord.username
    });

  } catch (error) {
    console.error('[Verify Reset Token Error]', error);
    res.status(500).json({ valid: false, message: 'Server error while validating token.' });
  }
});

// ── POST /api/auth/reset-password ───────────────────────────
// Resets user password using the single-use token.
router.post('/reset-password', (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Token, new password, and confirmation are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const resetRecord = db.prepare(
      'SELECT * FROM password_resets WHERE token = ?'
    ).get(token);

    if (!resetRecord) {
      return res.status(400).json({ message: 'Invalid reset token.' });
    }

    if (resetRecord.used === 1) {
      return res.status(400).json({ message: 'This reset token has already been used.' });
    }

    if (new Date(resetRecord.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'This reset token has expired. Please request a new one.' });
    }

    // Hash new password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    // Update user password and mark token as used
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, resetRecord.userId);
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRecord.id);

    res.json({ message: 'Password has been reset successfully. You may now sign in with your new password.' });

  } catch (error) {
    console.error('[Reset Password Error]', error);
    res.status(500).json({ message: 'Server error while resetting password.' });
  }
});

// ── POST /api/auth/change-password ─────────────────────────
// Authenticated password change endpoint
router.post('/change-password', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Current password, new password, and confirmation are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirmation do not match.' });
    }

    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isCurrentValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isCurrentValid) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const isSamePassword = bcrypt.compareSync(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password cannot be the same as your current password.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    db.prepare(`
      UPDATE users
      SET password = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hashedPassword, userId);

    res.json({ message: 'Password changed successfully! Please use your new password next time you sign in.' });

  } catch (error) {
    console.error('[Change Password Error]', error);
    res.status(500).json({ message: 'Server error while changing password.' });
  }
});

module.exports = router;
