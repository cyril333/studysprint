// ============================================================
// StudySprint - AI Quizzes, Attempts & Sharing (FR-003, FR-004, FR-009)
// ============================================================
const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateQuizFromNote } = require('../utils/quizGenerator');

const router = express.Router();

router.use(authenticate);

// ── POST /api/quizzes/generate ──────────────────────────────
// Generates a draft quiz (>= 10 questions) and summary from a student's note.
// Students can review and edit questions before saving (FR-003).
router.post('/generate', async (req, res) => {
  try {
    const { noteId, questionCount = 10 } = req.body;
    if (!noteId) {
      return res.status(400).json({ message: 'Please select a note to generate a quiz from.' });
    }

    const note = db.prepare(
      `SELECT n.*, t.name as topicName, s.name as subjectName
       FROM notes n
       JOIN topics t ON n.topicId = t.id
       JOIN subjects s ON t.subjectId = s.id
       WHERE n.id = ? AND n.userId = ?`
    ).get(noteId, req.user.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    if (note.content.trim().length < 40) {
      return res.status(400).json({
        message: 'Note content is too short to generate a meaningful 10-question quiz (minimum 40 characters).'
      });
    }

    const startTime = Date.now();
    const generated = await generateQuizFromNote(note.title, note.content, questionCount);
    const durationMs = Date.now() - startTime;

    res.json({
      message: 'Quiz draft generated successfully.',
      generationTimeMs: durationMs,
      provider: generated.provider,
      draft: {
        noteId: note.id,
        title: `${note.title} — Practice Quiz`,
        subjectName: note.subjectName,
        topicName: note.topicName,
        summary: generated.summary,
        questions: generated.questions
      }
    });
  } catch (error) {
    console.error('[Generate Quiz Error]', error);
    res.status(500).json({ message: 'Failed to generate quiz. Please try again.' });
  }
});

// ── POST /api/quizzes ───────────────────────────────────────
// Saves a reviewed/edited quiz and its questions to the database.
router.post('/', (req, res) => {
  try {
    const { noteId, title, summary = '', questions } = req.body;

    if (!noteId || !title || !title.trim()) {
      return res.status(400).json({ message: 'Note ID and quiz title are required.' });
    }

    if (!Array.isArray(questions) || questions.length < 1) {
      return res.status(400).json({ message: 'Quiz must contain at least 1 question.' });
    }

    const note = db.prepare('SELECT id FROM notes WHERE id = ? AND userId = ?').get(noteId, req.user.id);
    if (!note) {
      return res.status(404).json({ message: 'Associated note not found.' });
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt || !q.prompt.trim() || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ message: `Question ${i + 1} is incomplete.` });
      }
      if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        return res.status(400).json({ message: `Question ${i + 1} has an invalid correct answer index.` });
      }
    }

    const saveTransaction = db.transaction(() => {
      const quizRes = db.prepare(
        'INSERT INTO quizzes (noteId, userId, title, summary) VALUES (?, ?, ?, ?)'
      ).run(noteId, req.user.id, title.trim(), summary.trim());

      const quizId = quizRes.lastInsertRowid;
      const insertQ = db.prepare(
        'INSERT INTO questions (quizId, prompt, options, correctIndex, explanation) VALUES (?, ?, ?, ?, ?)'
      );

      for (const q of questions) {
        insertQ.run(
          quizId,
          q.prompt.trim(),
          JSON.stringify(q.options.map((o) => String(o).trim())),
          q.correctIndex,
          (q.explanation || '').trim()
        );
      }

      return quizId;
    });

    const quizId = saveTransaction();
    const savedQuiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId);

    res.status(201).json({
      message: 'Quiz saved successfully!',
      quiz: savedQuiz
    });
  } catch (error) {
    console.error('[Save Quiz Error]', error);
    res.status(500).json({ message: 'Failed to save quiz.' });
  }
});

// ── GET /api/quizzes ────────────────────────────────────────
// Lists all quizzes created by the logged-in student with attempt counts & best score.
router.get('/', (req, res) => {
  try {
    const quizzes = db.prepare(
      `SELECT q.*, n.title as noteTitle, t.name as topicName, s.name as subjectName,
              (SELECT COUNT(*) FROM questions WHERE quizId = q.id) as questionCount,
              (SELECT COUNT(*) FROM quiz_attempts WHERE quizId = q.id AND userId = ?) as attemptCount,
              (SELECT MAX(percentage) FROM quiz_attempts WHERE quizId = q.id AND userId = ?) as bestScore
       FROM quizzes q
       JOIN notes n ON q.noteId = n.id
       JOIN topics t ON n.topicId = t.id
       JOIN subjects s ON t.subjectId = s.id
       WHERE q.userId = ?
       ORDER BY q.createdAt DESC`
    ).all(req.user.id, req.user.id, req.user.id);

    res.json({ quizzes });
  } catch (error) {
    console.error('[List Quizzes Error]', error);
    res.status(500).json({ message: 'Failed to load quizzes.' });
  }
});

// ── GET /api/quizzes/shared/:shareToken ─────────────────────
// Allows any authenticated user (classmate) to view a shared quiz.
router.get('/shared/:shareToken', (req, res) => {
  try {
    const quiz = db.prepare(
      `SELECT q.*, u.fullName as authorName, n.title as noteTitle, t.name as topicName, s.name as subjectName
       FROM quizzes q
       JOIN users u ON q.userId = u.id
       JOIN notes n ON q.noteId = n.id
       JOIN topics t ON n.topicId = t.id
       JOIN subjects s ON t.subjectId = s.id
       WHERE q.shareToken = ? AND q.isShared = 1`
    ).get(req.params.shareToken);

    if (!quiz) {
      return res.status(404).json({ message: 'Shared quiz not found or sharing has been disabled.' });
    }

    const questions = db.prepare(
      'SELECT id, prompt, options FROM questions WHERE quizId = ?'
    ).all(quiz.id).map((q) => ({
      ...q,
      options: JSON.parse(q.options)
    }));

    const attempts = db.prepare(
      'SELECT id, score, totalQuestions, percentage, completedAt FROM quiz_attempts WHERE quizId = ? AND userId = ? ORDER BY completedAt DESC'
    ).all(quiz.id, req.user.id);

    res.json({ quiz, questions, attempts });
  } catch (error) {
    console.error('[Get Shared Quiz Error]', error);
    res.status(500).json({ message: 'Failed to load shared quiz.' });
  }
});

// ── POST /api/quizzes/shared/:shareToken/flag ───────────────
// Allows an authenticated user to flag a shared quiz for admin moderation (FR-010).
router.post('/shared/:shareToken/flag', (req, res) => {
  try {
    const { reason = 'Inappropriate or inaccurate content' } = req.body;
    const quiz = db.prepare('SELECT id FROM quizzes WHERE shareToken = ? AND isShared = 1').get(req.params.shareToken);
    if (!quiz) {
      return res.status(404).json({ message: 'Shared quiz not found.' });
    }

    db.prepare('UPDATE quizzes SET isFlagged = 1, flagReason = ? WHERE id = ?').run(reason.trim(), quiz.id);
    res.json({ message: 'Quiz has been flagged for administrator review.' });
  } catch (error) {
    console.error('[Flag Quiz Error]', error);
    res.status(500).json({ message: 'Failed to flag quiz.' });
  }
});

// ── GET /api/quizzes/:id ────────────────────────────────────
// Returns a quiz with its questions and user's historical attempts.
router.get('/:id', (req, res) => {
  try {
    const quiz = db.prepare(
      `SELECT q.*, n.title as noteTitle, t.name as topicName, s.name as subjectName
       FROM quizzes q
       JOIN notes n ON q.noteId = n.id
       JOIN topics t ON n.topicId = t.id
       JOIN subjects s ON t.subjectId = s.id
       WHERE q.id = ? AND (q.userId = ? OR q.isShared = 1)`
    ).get(req.params.id, req.user.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const questions = db.prepare(
      'SELECT id, prompt, options FROM questions WHERE quizId = ?'
    ).all(quiz.id).map((q) => ({
      ...q,
      options: JSON.parse(q.options)
    }));

    const attempts = db.prepare(
      'SELECT id, score, totalQuestions, percentage, completedAt FROM quiz_attempts WHERE quizId = ? AND userId = ? ORDER BY completedAt DESC'
    ).all(quiz.id, req.user.id);

    res.json({ quiz, questions, attempts });
  } catch (error) {
    console.error('[Get Quiz Error]', error);
    res.status(500).json({ message: 'Failed to load quiz.' });
  }
});

// ── DELETE /api/quizzes/:id ─────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM quizzes WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    db.prepare('DELETE FROM quizzes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Quiz deleted.' });
  } catch (error) {
    console.error('[Delete Quiz Error]', error);
    res.status(500).json({ message: 'Failed to delete quiz.' });
  }
});

// ── POST /api/quizzes/:id/share ─────────────────────────────
// Generates or toggles a shareable URL token for a quiz (FR-009).
router.post('/:id/share', (req, res) => {
  try {
    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const shareToken = quiz.shareToken || crypto.randomBytes(8).toString('hex');
    const nextShared = quiz.isShared ? 0 : 1;

    db.prepare('UPDATE quizzes SET isShared = ?, shareToken = ? WHERE id = ?').run(nextShared, shareToken, quiz.id);

    res.json({
      message: nextShared ? 'Quiz sharing enabled.' : 'Quiz sharing disabled.',
      isShared: Boolean(nextShared),
      shareToken: nextShared ? shareToken : null
    });
  } catch (error) {
    console.error('[Share Quiz Error]', error);
    res.status(500).json({ message: 'Failed to update quiz sharing.' });
  }
});

// ── POST /api/quizzes/:id/attempt ───────────────────────────
// Grades submitted answers automatically, records attempt, and returns feedback (FR-004).
router.post('/:id/attempt', (req, res) => {
  try {
    const { answers } = req.body; // { [questionId]: selectedIndex }

    const quiz = db.prepare(
      'SELECT * FROM quizzes WHERE id = ? AND (userId = ? OR isShared = 1)'
    ).get(req.params.id, req.user.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const questions = db.prepare('SELECT * FROM questions WHERE quizId = ?').all(quiz.id);
    if (questions.length === 0) {
      return res.status(400).json({ message: 'Quiz has no questions.' });
    }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ message: 'Submitted answers are required.' });
    }

    let score = 0;
    const feedback = questions.map((q) => {
      const selectedIndex = answers[q.id] !== undefined ? Number(answers[q.id]) : -1;
      const isCorrect = selectedIndex === q.correctIndex;
      if (isCorrect) score++;

      return {
        questionId: q.id,
        prompt: q.prompt,
        options: JSON.parse(q.options),
        selectedIndex,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation
      };
    });

    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 1000) / 10;

    const result = db.prepare(
      'INSERT INTO quiz_attempts (quizId, userId, score, totalQuestions, percentage, answers) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(quiz.id, req.user.id, score, totalQuestions, percentage, JSON.stringify(answers));

    res.status(201).json({
      message: 'Quiz graded and attempt recorded!',
      attempt: {
        id: result.lastInsertRowid,
        score,
        totalQuestions,
        percentage
      },
      feedback
    });
  } catch (error) {
    console.error('[Submit Attempt Error]', error);
    res.status(500).json({ message: 'Failed to grade quiz attempt.' });
  }
});

module.exports = router;
