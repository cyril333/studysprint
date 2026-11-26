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

    const notesUploaded = db.prepare('SELECT COUNT(*) as count FROM notes WHERE userId = ?').get(req.user.id).count;
    const subjectsCount = db.prepare('SELECT COUNT(*) as count FROM subjects WHERE userId = ?').get(req.user.id).count;
    const quizzesCreated = db.prepare('SELECT COUNT(*) as count FROM quizzes WHERE userId = ?').get(req.user.id).count;
    const attemptsSummary = db.prepare(
      'SELECT COUNT(*) as count, COALESCE(AVG(percentage), 0) as avgScore FROM quiz_attempts WHERE userId = ?'
    ).get(req.user.id);

    const completedSessions = db.prepare(
      "SELECT COUNT(*) as count FROM study_sessions WHERE userId = ? AND status = 'completed'"
    ).get(req.user.id).count;

    // Calculate distinct active study days from quiz attempts and completed sessions
    const activeDays = db.prepare(`
      SELECT COUNT(DISTINCT d) as streak FROM (
        SELECT DATE(completedAt) as d FROM quiz_attempts WHERE userId = ?
        UNION
        SELECT DATE(scheduledAt) as d FROM study_sessions WHERE userId = ? AND status = 'completed'
      )
    `).get(req.user.id, req.user.id).streak;

    const perSubjectPerformance = db.prepare(`
      SELECT s.name as subjectName,
             COUNT(qa.id) as attempts,
             ROUND(AVG(qa.percentage), 1) as avgPercentage
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quizId = q.id
      JOIN notes n ON q.noteId = n.id
      JOIN topics t ON n.topicId = t.id
      JOIN subjects s ON t.subjectId = s.id
      WHERE qa.userId = ?
      GROUP BY s.id
      ORDER BY avgPercentage DESC
    `).all(req.user.id);

    const recentActivity = db.prepare(`
      SELECT qa.id, q.id as quizId, q.title as quizTitle, qa.score, qa.totalQuestions, qa.percentage, qa.completedAt
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quizId = q.id
      WHERE qa.userId = ?
      ORDER BY qa.completedAt DESC
      LIMIT 5
    `).all(req.user.id);

    const upcomingSessions = db.prepare(`
      SELECT ss.id, ss.title, ss.scheduledAt, ss.durationMinutes, s.name as subjectName
      FROM study_sessions ss
      LEFT JOIN subjects s ON ss.subjectId = s.id
      WHERE ss.userId = ? AND ss.status = 'planned'
      ORDER BY ss.scheduledAt ASC
      LIMIT 4
    `).all(req.user.id);

    res.json({
      user,
      dashboard: {
        studyStreak: activeDays,
        quizzesTaken: attemptsSummary.count,
        quizzesCreated,
        averageScore: Math.round(attemptsSummary.avgScore * 10) / 10,
        notesUploaded,
        subjectsCount,
        completedSessions,
        perSubjectPerformance,
        recentActivity,
        upcomingSessions
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
    const totalQuizzes = db.prepare('SELECT COUNT(*) as count FROM quizzes').get().count;
    const sharedQuizzes = db.prepare('SELECT COUNT(*) as count FROM quizzes WHERE isShared = 1').get().count;
    const flaggedQuizzes = db.prepare('SELECT COUNT(*) as count FROM quizzes WHERE isFlagged = 1').get().count;

    const recentUsers = db.prepare(
      "SELECT id, fullName, email, username, role, status, createdAt FROM users ORDER BY createdAt DESC LIMIT 10"
    ).all();

    res.json({
      stats: { total, active, suspended, students, totalQuizzes, sharedQuizzes, flaggedQuizzes },
      recentUsers
    });
  } catch (error) {
    console.error('[Admin Dashboard Error]', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
