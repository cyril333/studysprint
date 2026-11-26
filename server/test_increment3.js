// ============================================================
// StudySprint - Increment 3 End-to-End Integration Tests
// ============================================================
require('dotenv').config();
const express = require('express');
const db = require('./config/database');

const app = express();
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/sessions', require('./routes/sessions'));

const PORT = 5098;
const BASE = `http://127.0.0.1:${PORT}/api`;

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  return { status: res.status, data };
}

function assert(condition, label) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
    throw new Error(`Assertion failed: ${label}`);
  }
  console.log(`PASS: ${label}`);
}

const server = app.listen(PORT, '127.0.0.1', async () => {
  const unique = Date.now();
  const testEmail = `inc3_${unique}@cit.edu`;
  const testUsername = `inc3_${unique}`;

  try {
    console.log('\n--- Starting Increment 3 End-to-End Tests ---\n');

    // 1. Register & Login Student
    const reg = await request('POST', '/auth/register', {
      fullName: 'Increment Three Tester',
      email: testEmail,
      username: testUsername,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    assert(reg.status === 201, '1. Student registration succeeds');

    const login = await request('POST', '/auth/login', {
      login: testUsername,
      password: 'Password123!'
    });
    assert(login.status === 200 && login.data.token, '2. Student login returns JWT token');
    const studentToken = login.data.token;

    // 2. Subject, Topic & Note Creation (FR-002)
    const subj = await request('POST', '/subjects', {
      name: 'Systems Integration & Architecture 1',
      code: 'IT342-G01'
    }, studentToken);
    assert(subj.status === 201 && subj.data.subject.id, '3. Create Subject (FR-002)');
    const subjectId = subj.data.subject.id;

    const topic = await request('POST', `/subjects/${subjectId}/topics`, {
      name: 'Authentication & Stateless APIs'
    }, studentToken);
    assert(topic.status === 201 && topic.data.topic.id, '4. Create Topic under Subject (FR-002)');
    const topicId = topic.data.topic.id;

    const noteContent = [
      'JSON Web Token (JWT) is an open standard used to share security information between a client and a server.',
      'Bcrypt is a password-hashing function designed to be computationally expensive to resist brute-force attacks.',
      'Role-Based Access Control (RBAC) restricts system access to authorized users based on their assigned roles.',
      'RESTful APIs use standard HTTP methods such as GET, POST, PUT, PATCH, and DELETE for resource operations.',
      'SQLite is an embedded relational database engine that stores the entire database in a single cross-platform file.',
      'Cross-Origin Resource Sharing (CORS) is a browser security mechanism that controls cross-domain API requests.'
    ].join('\n');

    const note = await request('POST', `/subjects/topics/${topicId}/notes`, {
      title: 'Web Security Fundamentals',
      content: noteContent
    }, studentToken);
    assert(note.status === 201 && note.data.note.id, '5. Create Study Note under Topic (FR-002)');
    const noteId = note.data.note.id;

    // 3. AI Quiz Generation (FR-003)
    const gen = await request('POST', '/quizzes/generate', {
      noteId,
      questionCount: 10
    }, studentToken);
    assert(
      gen.status === 200 &&
      gen.data.draft.questions.length === 10 &&
      gen.data.generationTimeMs < 30000,
      `6. Generate 10-question AI quiz in ${gen.data.generationTimeMs}ms (<30s, FR-003)`
    );

    // Modify first question prompt to verify edit-before-save (FR-003)
    const draft = gen.data.draft;
    draft.questions[0].prompt = `[Edited] ${draft.questions[0].prompt}`;

    const savedQuiz = await request('POST', '/quizzes', {
      noteId,
      title: draft.title,
      summary: draft.summary,
      questions: draft.questions
    }, studentToken);
    assert(savedQuiz.status === 201 && savedQuiz.data.quiz.id, '7. Save customized quiz to DB (FR-003)');
    const quizId = savedQuiz.data.quiz.id;

    // 4. Quiz Taking & Auto-Grading (FR-004)
    const fetchedQuiz = await request('GET', `/quizzes/${quizId}`, null, studentToken);
    assert(fetchedQuiz.status === 200 && fetchedQuiz.data.questions.length === 10, '8. Fetch quiz questions for interactive view (FR-004)');

    const answers = {};
    fetchedQuiz.data.questions.forEach((q, idx) => {
      answers[q.id] = draft.questions[idx].correctIndex;
    });

    const attempt = await request('POST', `/quizzes/${quizId}/attempt`, { answers }, studentToken);
    assert(
      attempt.status === 201 && attempt.data.attempt.score === 10 && attempt.data.attempt.percentage === 100,
      '9. Auto-grade quiz attempt (10/10 = 100%) and record attempt (FR-004)'
    );

    // 5. Study Session Scheduling (FR-005)
    const session = await request('POST', '/sessions', {
      title: 'IT342 Quiz Review Session',
      subjectId,
      topicId,
      scheduledAt: '2026-12-01T19:00',
      durationMinutes: 60
    }, studentToken);
    assert(session.status === 201 && session.data.session.id, '10. Schedule study session (FR-005)');

    const completeSession = await request('PATCH', `/sessions/${session.data.session.id}/status`, {
      status: 'completed'
    }, studentToken);
    assert(completeSession.status === 200, '11. Mark study session completed (FR-005)');

    // 6. Progress Analytics Dashboard (FR-008)
    const studDash = await request('GET', '/dashboard/student', null, studentToken);
    assert(
      studDash.status === 200 &&
      studDash.data.dashboard.notesUploaded >= 1 &&
      studDash.data.dashboard.quizzesTaken >= 1 &&
      studDash.data.dashboard.averageScore === 100 &&
      studDash.data.dashboard.studyStreak >= 1,
      '12. Student Dashboard reflects real DB metrics & analytics (FR-008)'
    );

    // 7. Collaborative Quiz Sharing & Flagging (FR-009 & FR-010)
    const shareRes = await request('POST', `/quizzes/${quizId}/share`, {}, studentToken);
    assert(shareRes.status === 200 && shareRes.data.isShared && shareRes.data.shareToken, '13. Generate shareable quiz link (FR-009)');
    const shareToken = shareRes.data.shareToken;

    const sharedFetch = await request('GET', `/quizzes/shared/${shareToken}`, null, studentToken);
    assert(sharedFetch.status === 200 && sharedFetch.data.questions.length === 10, '14. Access shared quiz via shareToken (FR-009)');

    const flagRes = await request('POST', `/quizzes/shared/${shareToken}/flag`, {
      reason: 'Test moderation flag'
    }, studentToken);
    assert(flagRes.status === 200, '15. Flag shared quiz for admin moderation (FR-010)');

    // 8. RBAC Check + Admin Content Moderation (FR-010)
    const deniedMod = await request('GET', '/users/moderation', null, studentToken);
    assert(deniedMod.status === 403, '16. Student blocked from Admin Moderation endpoint (403 RBAC)');

    const adminLogin = await request('POST', '/auth/login', {
      login: 'admin',
      password: 'Admin@123'
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, '17. Admin login succeeds');
    const adminToken = adminLogin.data.token;

    const modQueue = await request('GET', '/users/moderation', null, adminToken);
    assert(
      modQueue.status === 200 && modQueue.data.quizzes.some((q) => q.id === quizId && q.isFlagged === 1),
      '18. Admin sees flagged quiz in moderation queue (FR-010)'
    );

    const delMod = await request('DELETE', `/users/moderation/${quizId}`, null, adminToken);
    assert(delMod.status === 200, '19. Admin removes flagged quiz (FR-010)');

    // Cleanup test user
    db.prepare('DELETE FROM users WHERE email = ?').run(testEmail);
    console.log('\n--- All 19 Increment 3 Integration Tests PASSED! ---\n');
  } catch (err) {
    console.error('Test suite error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
