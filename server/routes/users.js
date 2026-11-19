// ============================================================
// StudySprint - User Management Routes (Admin Only)
// ============================================================
const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes here require authentication + admin role
router.use(authenticate);
router.use(authorize('admin'));

// ── GET /api/users ──────────────────────────────────────────
// Returns all users (admin only). Used for the Admin Dashboard.
router.get('/', (req, res) => {
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
router.get('/stats', (req, res) => {
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
router.patch('/:id/status', (req, res) => {
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

module.exports = router;
