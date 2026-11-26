// ============================================================
// StudySprint - Admin Content Moderation (FR-010)
// ============================================================
import { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { FiShield, FiCheckCircle, FiTrash2, FiFlag } from 'react-icons/fi';

export default function AdminModeration() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const showAlert = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
  };

  const fetchQueue = async () => {
    try {
      const res = await api.get('/users/moderation');
      setQuizzes(res.data.quizzes || []);
    } catch (err) {
      showAlert('error', 'Failed to load moderation queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleClearFlag = async (quizId) => {
    try {
      const res = await api.patch(`/users/moderation/${quizId}/clear`);
      showAlert('success', res.data.message);
      fetchQueue();
    } catch (err) {
      showAlert('error', 'Failed to dismiss flag.');
    }
  };

  const handleRemoveQuiz = async (quizId) => {
    if (!window.confirm('Permanently remove this shared quiz?')) return;
    try {
      const res = await api.delete(`/users/moderation/${quizId}`);
      showAlert('success', res.data.message);
      fetchQueue();
    } catch (err) {
      showAlert('error', 'Failed to remove quiz.');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="loading-state">Loading moderation queue...</div>
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
            <h1 className="page-title"><FiShield size={24} /> Content Moderation</h1>
            <p className="subtitle-muted">Review shared and flagged quizzes across the platform and remove inappropriate content.</p>
          </div>
        </div>

        {statusMsg.text && (
          <div className={`alert ${statusMsg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {statusMsg.text}
          </div>
        )}

        {quizzes.length === 0 ? (
          <div className="empty-state">
            <FiShield size={44} />
            <p>No shared or flagged quizzes to review right now.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Author</th>
                  <th>Questions</th>
                  <th>Status</th>
                  <th>Flag Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <strong>{q.title}</strong>
                      {q.summary && <div className="subtitle-muted" style={{ fontSize: '0.78rem' }}>{q.summary.slice(0, 70)}...</div>}
                    </td>
                    <td>{q.authorName} (@{q.authorUsername})</td>
                    <td>{q.questionCount}</td>
                    <td>
                      {q.isFlagged ? (
                        <span className="status-badge status-suspended"><FiFlag size={11} /> Flagged</span>
                      ) : (
                        <span className="status-badge status-active">Shared</span>
                      )}
                    </td>
                    <td>{q.flagReason || '—'}</td>
                    <td>
                      <div className="table-actions">
                        {q.isFlagged === 1 && (
                          <button className="btn-sm btn-success" onClick={() => handleClearFlag(q.id)}>
                            <FiCheckCircle size={13} /> Dismiss Flag
                          </button>
                        )}
                        <button className="btn-sm btn-danger" onClick={() => handleRemoveQuiz(q.id)}>
                          <FiTrash2 size={13} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
