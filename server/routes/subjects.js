// ============================================================
// StudySprint - Subject, Topic & Notes Management (FR-002)
// ============================================================
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max
});

// All routes require authentication
router.use(authenticate);

// ── POST /api/subjects/extract-pdf ──────────────────────────
// Extracts text content from an uploaded PDF file.
router.post('/extract-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded.' });
    }
    if (req.file.mimetype !== 'application/pdf' && !req.file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ message: 'Please upload a valid .pdf file.' });
    }

    const parsed = await pdfParse(req.file.buffer);
    const extractedText = (parsed.text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!extractedText || extractedText.length < 20) {
      return res.status(400).json({
        message: 'Could not extract readable text from this PDF (it may be scanned images only).'
      });
    }

    res.json({
      message: `Extracted ${parsed.numpages} pages from PDF.`,
      pages: parsed.numpages,
      title: req.file.originalname.replace(/\.pdf$/i, ''),
      content: extractedText
    });
  } catch (error) {
    console.error('[Extract PDF Error]', error);
    res.status(500).json({ message: 'Failed to parse PDF file.' });
  }
});

// ── GET /api/subjects ───────────────────────────────────────
// Lists all subjects for the current user along with their topics and notes.
router.get('/', (req, res) => {
  try {
    const subjects = db.prepare(
      'SELECT * FROM subjects WHERE userId = ? ORDER BY createdAt DESC'
    ).all(req.user.id);

    const topicsStmt = db.prepare(
      'SELECT * FROM topics WHERE subjectId = ? AND userId = ? ORDER BY createdAt ASC'
    );
    const notesStmt = db.prepare(
      'SELECT id, topicId, title, content, createdAt, updatedAt FROM notes WHERE topicId = ? AND userId = ? ORDER BY createdAt DESC'
    );

    const enriched = subjects.map((subj) => {
      const topics = topicsStmt.all(subj.id, req.user.id).map((topic) => ({
        ...topic,
        notes: notesStmt.all(topic.id, req.user.id)
      }));
      return { ...subj, topics };
    });

    res.json({ subjects: enriched });
  } catch (error) {
    console.error('[Get Subjects Error]', error);
    res.status(500).json({ message: 'Failed to load subjects.' });
  }
});

// ── POST /api/subjects ──────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { name, code = '', description = '' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Subject name is required.' });
    }

    const result = db.prepare(
      'INSERT INTO subjects (userId, name, code, description) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, name.trim(), code.trim(), description.trim());

    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Subject created successfully.', subject: { ...subject, topics: [] } });
  } catch (error) {
    console.error('[Create Subject Error]', error);
    res.status(500).json({ message: 'Failed to create subject.' });
  }
});

// ── PUT /api/subjects/:id ───────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const { name, code = '', description = '' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Subject name is required.' });
    }

    const existing = db.prepare('SELECT * FROM subjects WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'Subject not found.' });
    }

    db.prepare(
      'UPDATE subjects SET name = ?, code = ?, description = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(name.trim(), code.trim(), description.trim(), req.params.id);

    const updated = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    res.json({ message: 'Subject updated.', subject: updated });
  } catch (error) {
    console.error('[Update Subject Error]', error);
    res.status(500).json({ message: 'Failed to update subject.' });
  }
});

// ── DELETE /api/subjects/:id ────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM subjects WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'Subject not found.' });
    }

    db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Subject and associated topics/notes deleted.' });
  } catch (error) {
    console.error('[Delete Subject Error]', error);
    res.status(500).json({ message: 'Failed to delete subject.' });
  }
});

// ── POST /api/subjects/:subjectId/topics ────────────────────
router.post('/:subjectId/topics', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Topic name is required.' });
    }

    const subject = db.prepare('SELECT id FROM subjects WHERE id = ? AND userId = ?').get(req.params.subjectId, req.user.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found.' });
    }

    const result = db.prepare(
      'INSERT INTO topics (subjectId, userId, name) VALUES (?, ?, ?)'
    ).run(req.params.subjectId, req.user.id, name.trim());

    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Topic created.', topic: { ...topic, notes: [] } });
  } catch (error) {
    console.error('[Create Topic Error]', error);
    res.status(500).json({ message: 'Failed to create topic.' });
  }
});

// ── PUT /api/subjects/topics/:topicId ───────────────────────
router.put('/topics/:topicId', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Topic name is required.' });
    }

    const existing = db.prepare('SELECT id FROM topics WHERE id = ? AND userId = ?').get(req.params.topicId, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'Topic not found.' });
    }

    db.prepare('UPDATE topics SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(name.trim(), req.params.topicId);
    const updated = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.topicId);
    res.json({ message: 'Topic updated.', topic: updated });
  } catch (error) {
    console.error('[Update Topic Error]', error);
    res.status(500).json({ message: 'Failed to update topic.' });
  }
});

// ── DELETE /api/subjects/topics/:topicId ────────────────────
router.delete('/topics/:topicId', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM topics WHERE id = ? AND userId = ?').get(req.params.topicId, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'Topic not found.' });
    }

    db.prepare('DELETE FROM topics WHERE id = ?').run(req.params.topicId);
    res.json({ message: 'Topic deleted.' });
  } catch (error) {
    console.error('[Delete Topic Error]', error);
    res.status(500).json({ message: 'Failed to delete topic.' });
  }
});

// ── POST /api/subjects/topics/:topicId/notes ────────────────
router.post('/topics/:topicId/notes', (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ message: 'Note title and content are required.' });
    }

    if (content.trim().length < 20) {
      return res.status(400).json({ message: 'Note content must be at least 20 characters.' });
    }

    const topic = db.prepare('SELECT id FROM topics WHERE id = ? AND userId = ?').get(req.params.topicId, req.user.id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found.' });
    }

    const result = db.prepare(
      'INSERT INTO notes (topicId, userId, title, content) VALUES (?, ?, ?, ?)'
    ).run(req.params.topicId, req.user.id, title.trim(), content.trim());

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Note saved successfully.', note });
  } catch (error) {
    console.error('[Create Note Error]', error);
    res.status(500).json({ message: 'Failed to save note.' });
  }
});

// ── PUT /api/subjects/notes/:noteId ─────────────────────────
router.put('/notes/:noteId', (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ message: 'Note title and content are required.' });
    }

    const existing = db.prepare('SELECT id FROM notes WHERE id = ? AND userId = ?').get(req.params.noteId, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    db.prepare(
      'UPDATE notes SET title = ?, content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(title.trim(), content.trim(), req.params.noteId);

    const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.noteId);
    res.json({ message: 'Note updated.', note: updated });
  } catch (error) {
    console.error('[Update Note Error]', error);
    res.status(500).json({ message: 'Failed to update note.' });
  }
});

// ── DELETE /api/subjects/notes/:noteId ──────────────────────
router.delete('/notes/:noteId', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM notes WHERE id = ? AND userId = ?').get(req.params.noteId, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.noteId);
    res.json({ message: 'Note deleted.' });
  } catch (error) {
    console.error('[Delete Note Error]', error);
    res.status(500).json({ message: 'Failed to delete note.' });
  }
});

module.exports = router;
