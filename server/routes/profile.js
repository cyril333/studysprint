// ============================================================
// StudySprint - Profile Route Alias
// ============================================================
const express = require('express');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/profile
router.get('/', (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, fullName, email, username, role, status, createdAt, updatedAt FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('[Get Profile Error]', error);
    res.status(500).json({ message: 'Server error while fetching profile.' });
  }
});

// PUT /api/profile
router.put('/', (req, res) => {
  try {
    const { fullName, email, username } = req.body;
    const currentUserId = req.user.id;

    if (!fullName || !email || !username) {
      return res.status(400).json({ message: 'Full name, email, and username are required.' });
    }

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim().toLowerCase();

    if (trimmedFullName.length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (trimmedUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores.' });
    }

    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(trimmedEmail, currentUserId);
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(trimmedUsername, currentUserId);
    if (existingUsername) {
      return res.status(409).json({ message: 'This username is already taken.' });
    }

    db.prepare(`
      UPDATE users
      SET fullName = ?, email = ?, username = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(trimmedFullName, trimmedEmail, trimmedUsername, currentUserId);

    const updatedUser = db.prepare(
      'SELECT id, fullName, email, username, role, status, createdAt, updatedAt FROM users WHERE id = ?'
    ).get(currentUserId);

    const token = jwt.sign(
      { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role },
      process.env.JWT_SECRET || 'studysprint_jwt_secret_key_2026_secure',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Profile updated successfully!',
      user: updatedUser,
      token
    });

  } catch (error) {
    console.error('[Update Profile Error]', error);
    res.status(500).json({ message: 'Server error while updating profile.' });
  }
});

// PUT /api/profile/password
router.put('/password', (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const currentUserId = req.user.id;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All password fields are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match.' });
    }

    const user = db.prepare('SELECT id, password FROM users WHERE id = ?').get(currentUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isCurrentValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isCurrentValid) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    if (bcrypt.compareSync(newPassword, user.password)) {
      return res.status(400).json({ message: 'New password cannot be the same as your current password.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, currentUserId);

    res.json({ message: 'Password changed successfully! Please use your new password next time you sign in.' });

  } catch (error) {
    console.error('[Change Password Error]', error);
    res.status(500).json({ message: 'Server error while changing password.' });
  }
});

module.exports = router;
