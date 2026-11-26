// ============================================================
// StudySprint - Study Session Scheduling Routes (FR-005)
// ============================================================
const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// ── GET /api/sessions ───────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const sessions = db.prepare(
      `SELECT ss.*, s.name as subjectName, t.name as topicName
       FROM study_sessions ss
       LEFT JOIN subjects s ON ss.subjectId = s.id
       LEFT JOIN topics t ON ss.topicId = t.id
       WHERE ss.userId = ?
       ORDER BY ss.scheduledAt ASC`
    ).all(req.user.id);

    res.json({ sessions });
  } catch (error) {
    console.error('[Get Sessions Error]', error);
    res.status(500).json({ message: 'Failed to load study sessions.' });
  }
});

// ── POST /api/sessions ──────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { title, subjectId = null, topicId = null, scheduledAt, durationMinutes = 45 } = req.body;

    if (!title || !title.trim() || !scheduledAt) {
      return res.status(400).json({ message: 'Session title and scheduled date/time are required.' });
    }

    const dur = Number(durationMinutes);
    if (isNaN(dur) || dur < 10 || dur > 480) {
      return res.status(400).json({ message: 'Duration must be between 10 and 480 minutes.' });
    }

    const result = db.prepare(
      'INSERT INTO study_sessions (userId, subjectId, topicId, title, scheduledAt, durationMinutes, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, subjectId || null, topicId || null, title.trim(), scheduledAt, dur, 'planned');

    const session = db.prepare(
      `SELECT ss.*, s.name as subjectName, t.name as topicName
       FROM study_sessions ss
       LEFT JOIN subjects s ON ss.subjectId = s.id
       LEFT JOIN topics t ON ss.topicId = t.id
       WHERE ss.id = ?`
    ).get(result.lastInsertRowid);

    res.status(201).json({ message: 'Study session scheduled.', session });
  } catch (error) {
    console.error('[Create Session Error]', error);
    res.status(500).json({ message: 'Failed to schedule study session.' });
  }
});

// ── PATCH /api/sessions/:id/status ──────────────────────────
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['planned', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const existing = db.prepare('SELECT id FROM study_sessions WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'Study session not found.' });
    }

    db.prepare('UPDATE study_sessions SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: `Session marked as ${status}.` });
  } catch (error) {
    console.error('[Update Session Error]', error);
    res.status(500).json({ message: 'Failed to update study session.' });
  }
});

// ── DELETE /api/sessions/:id ────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM study_sessions WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'Study session not found.' });
    }

    db.prepare('DELETE FROM study_sessions WHERE id = ?').run(req.params.id);
    res.json({ message: 'Study session removed.' });
  } catch (error) {
    console.error('[Delete Session Error]', error);
    res.status(500).json({ message: 'Failed to delete study session.' });
  }
});

module.exports = router;
