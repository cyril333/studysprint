// ============================================================
// StudySprint - User Management & Profile Routes
// ============================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ── GET /api/users/profile ──────────────────────────────────
// Returns the profile of the currently authenticated user.
router.get('/profile', (req, res) => {
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

// ── PUT /api/users/profile ──────────────────────────────────
// Updates the authenticated user's own profile (preventing unauthorized modifications).
router.put('/profile', (req, res) => {
  try {
    const { fullName, email, username } = req.body;
    const currentUserId = req.user.id;

    if (!fullName || !email || !username) {
      return res.status(400).json({ message: 'Full name, email, and username are required.' });
    }

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim().toLowerCase();

    // Validate full name
    if (trimmedFullName.length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    // Validate username format
    if (trimmedUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores.' });
    }

    // Check email uniqueness excluding current user
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(trimmedEmail, currentUserId);
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Check username uniqueness excluding current user
    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(trimmedUsername, currentUserId);
    if (existingUsername) {
      return res.status(409).json({ message: 'This username is already taken.' });
    }

    // Update user profile in database
    db.prepare(`
      UPDATE users
      SET fullName = ?, email = ?, username = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(trimmedFullName, trimmedEmail, trimmedUsername, currentUserId);

    // Fetch updated user details
    const updatedUser = db.prepare(
      'SELECT id, fullName, email, username, role, status, createdAt, updatedAt FROM users WHERE id = ?'
    ).get(currentUserId);

    // Issue refreshed token
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

// ── PUT /api/users/change-password ──────────────────────────
// Changes the authenticated user's password after verifying current password.
router.put('/change-password', (req, res) => {
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

    // Fetch current user's hashed password
    const user = db.prepare('SELECT id, password FROM users WHERE id = ?').get(currentUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify current password
    const isCurrentValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isCurrentValid) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // Ensure new password differs from current password
    if (bcrypt.compareSync(newPassword, user.password)) {
      return res.status(400).json({ message: 'New password cannot be the same as your current password.' });
    }

    // Hash new password and update
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, currentUserId);

    res.json({ message: 'Password changed successfully! Please use your new password next time you sign in.' });

  } catch (error) {
    console.error('[Change Password Error]', error);
    res.status(500).json({ message: 'Server error while changing password.' });
  }
});

// ── ADMIN ONLY ROUTES ────────────────────────────────────────

// ── GET /api/users ──────────────────────────────────────────
// Returns all users (admin only). Used for the Admin Dashboard.
router.get('/', authorize('admin'), (req, res) => {
  try {
    const users = db.prepare(
      'SELECT id, fullName, email, username, role, status, createdAt FROM users ORDER BY createdAt DESC'
    ).all();

    res.json({ users });
  } catch (error) {
    console.error('[Get Users Error]', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/users/stats ────────────────────────────────────
// Returns user statistics for the Admin Dashboard.
router.get('/stats',  authorize('admin'), (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const active = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get().count;
    const suspended = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'suspended'").get().count;
    const students = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
    const admins = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;

    // Recent registrations (last 7 days)
    const recentUsers = db.prepare(
      "SELECT id, fullName, email, username, role, status, createdAt FROM users WHERE createdAt >= datetime('now', '-7 days') ORDER BY createdAt DESC"
    ).all();

    res.json({
      stats: { total, active, suspended, students, admins },
      recentUsers
    });
  } catch (error) {
    console.error('[Stats Error]', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── PATCH /api/users/:id/status ─────────────────────────────
// Suspend or activate a user account (admin only).
router.patch('/:id/status', authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "active" or "suspended".' });
    }

    // Prevent admin from suspending themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own account status.' });
    }

    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    db.prepare('UPDATE users SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

    res.json({ message: `User account ${status === 'active' ? 'activated' : 'suspended'} successfully.` });
  } catch (error) {
    console.error('[Update Status Error]', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/users/moderation ───────────────────────────────
// Lists all shared and flagged quizzes for Admin Content Moderation (FR-010).
router.get('/moderation', authorize('admin'), (req, res) => {
  try {
    const quizzes = db.prepare(`
      SELECT q.id, q.title, q.summary, q.shareToken, q.isShared, q.isFlagged, q.flagReason, q.createdAt,
             u.id as authorId, u.fullName as authorName, u.username as authorUsername, u.status as authorStatus,
             (SELECT COUNT(*) FROM questions WHERE quizId = q.id) as questionCount
      FROM quizzes q
      JOIN users u ON q.userId = u.id
      WHERE q.isShared = 1 OR q.isFlagged = 1
      ORDER BY q.isFlagged DESC, q.createdAt DESC
    `).all();

    res.json({ quizzes });
  } catch (error) {
    console.error('[Moderation List Error]', error);
    res.status(500).json({ message: 'Failed to load moderation queue.' });
  }
});

// ── PATCH /api/users/moderation/:quizId/clear ───────────────
// Dismisses a flag on a shared quiz (admin only).
router.patch('/moderation/:quizId/clear', authorize('admin'), (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(req.params.quizId);
    if (!existing) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    db.prepare("UPDATE quizzes SET isFlagged = 0, flagReason = '' WHERE id = ?").run(req.params.quizId);
    res.json({ message: 'Quiz flag dismissed.' });
  } catch (error) {
    console.error('[Clear Flag Error]', error);
    res.status(500).json({ message: 'Failed to dismiss flag.' });
  }
});

// ── DELETE /api/users/moderation/:quizId ────────────────────
// Removes an inappropriate shared quiz (admin only, FR-010).
router.delete('/moderation/:quizId', authorize('admin'), (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(req.params.quizId);
    if (!existing) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    db.prepare('DELETE FROM quizzes WHERE id = ?').run(req.params.quizId);
    res.json({ message: 'Inappropriate quiz removed by administrator.' });
  } catch (error) {
    console.error('[Remove Quiz Error]', error);
    res.status(500).json({ message: 'Failed to remove quiz.' });
  }
});

module.exports = router;
