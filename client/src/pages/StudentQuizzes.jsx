// ============================================================
// StudySprint - Student Quizzes List & Sharing (FR-004 & FR-009)
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { FiCheckSquare, FiPlay, FiShare2, FiTrash2, FiCopy, FiPlus } from 'react-icons/fi';

export default function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchQuizzes = async () => {
    try {
      const res = await api.get('/quizzes');
      setQuizzes(res.data.quizzes || []);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleToggleShare = async (quizId) => {
    try {
      const res = await api.post(`/quizzes/${quizId}/share`);
      setStatusMsg(res.data.message);
      await fetchQuizzes();
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('Could not update sharing.');
    }
  };

  const handleCopyShareLink = (shareToken) => {
    const url = `${window.location.origin}/shared-quiz/${shareToken}`;
    navigator.clipboard.writeText(url);
    setStatusMsg(`Copied shareable link: ${url}`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Delete this quiz and all its attempt records?')) return;
    try {
      await api.delete(`/quizzes/${quizId}`);
      await fetchQuizzes();
      setStatusMsg('Quiz deleted.');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('Failed to delete quiz.');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="loading-state">Loading quizzes...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="section-header">
          <div>
            <h1 className="page-title"><FiCheckSquare size={24} /> Practice Quizzes</h1>
            <p className="subtitle-muted">Take AI-generated quizzes, review attempt scores, and share quizzes with classmates.</p>
          </div>
          <Link to="/student/notes" className="btn-primary btn-inline">
            <FiPlus size={16} /> Generate From Notes
          </Link>
        </div>

        {statusMsg && <div className="alert alert-success">{statusMsg}</div>}

        {quizzes.length === 0 ? (
          <div className="empty-state">
            <FiCheckSquare size={44} />
            <p>No quizzes generated yet. Go to Notes, add study material, and click "Generate AI Quiz".</p>
            <Link to="/student/notes" className="btn-primary btn-inline">Go to Study Notes</Link>
          </div>
        ) : (
          <div className="quizzes-grid">
            {quizzes.map((q) => (
              <div key={q.id} className="quiz-card">
                <div className="quiz-card-top">
                  <span className="code-tag">{q.subjectName} / {q.topicName}</span>
                  {q.isFlagged === 1 && <span className="status-badge status-suspended">Flagged</span>}
                </div>

                <h3>{q.title}</h3>
                {q.summary && <p className="quiz-summary">{q.summary}</p>}

                <div className="quiz-meta-row">
                  <span>Questions: <strong>{q.questionCount}</strong></span>
                  <span>Attempts: <strong>{q.attemptCount}</strong></span>
                  <span>Best: <strong>{q.bestScore !== null ? `${q.bestScore}%` : '—'}</strong></span>
                </div>

                <div className="quiz-card-actions">
                  <Link to={`/student/quizzes/${q.id}`} className="btn-primary btn-sm-solid">
                    <FiPlay size={14} /> Take Quiz
                  </Link>
                  <button className="btn-sm" onClick={() => handleToggleShare(q.id)}>
                    <FiShare2 size={14} /> {q.isShared ? 'Shared' : 'Share'}
                  </button>
                  {q.isShared === 1 && q.shareToken && (
                    <button className="btn-sm" onClick={() => handleCopyShareLink(q.shareToken)} title="Copy Share URL">
                      <FiCopy size={14} /> Copy Link
                    </button>
                  )}
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(q.id)} title="Delete Quiz">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
