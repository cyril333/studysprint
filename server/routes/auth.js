// ============================================================
// StudySprint - Authentication Routes
// ============================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
      process.env.JWT_SECRET,
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

module.exports = router;
