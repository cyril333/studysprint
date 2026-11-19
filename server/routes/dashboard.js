// ============================================================
// StudySprint - Dashboard Routes
// ============================================================
const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/dashboard/student ──────────────────────────────
// Returns student-specific dashboard data.
router.get('/student', authenticate, authorize('student'), (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, fullName, username, email, role, createdAt FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Placeholder data for future features (quiz scores, streaks, etc.)
    res.json({
      user,
      dashboard: {
        studyStreak: 0,
        quizzesTaken: 0,
        averageScore: 0,
        notesUploaded: 0,
        recentActivity: []
      }
    });
  } catch (error) {
    console.error('[Student Dashboard Error]', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/dashboard/admin ────────────────────────────────
// Returns admin-specific dashboard data.
router.get('/admin', authenticate, authorize('admin'), (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const active = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get().count;
    const suspended = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'suspended'").get().count;
    const students = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;

    const recentUsers = db.prepare(
      "SELECT id, fullName, email, username, role, status, createdAt FROM users ORDER BY createdAt DESC LIMIT 10"
    ).all();

    res.json({
      stats: { total, active, suspended, students },
      recentUsers
    });
  } catch (error) {
    console.error('[Admin Dashboard Error]', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
