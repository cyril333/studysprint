// ============================================================
// StudySprint - Study Session Scheduling (FR-005)
// ============================================================
import { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { FiCalendar, FiPlus, FiCheckCircle, FiTrash2, FiClock } from 'react-icons/fi';

export default function StudentSchedule() {
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    title: '',
    subjectId: '',
    topicId: '',
    scheduledAt: '',
    durationMinutes: 45
  });

  const showAlert = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
  };

  const fetchData = async () => {
    try {
      const [sessRes, subjRes] = await Promise.all([
        api.get('/sessions'),
        api.get('/subjects')
      ]);
      setSessions(sessRes.data.sessions || []);
      setSubjects(subjRes.data.subjects || []);
    } catch (err) {
      showAlert('error', 'Failed to load study schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedSubject = subjects.find((s) => String(s.id) === String(form.subjectId));

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sessions', {
        title: form.title,
        subjectId: form.subjectId || null,
        topicId: form.topicId || null,
        scheduledAt: form.scheduledAt,
        durationMinutes: Number(form.durationMinutes)
      });
      setForm({ title: '', subjectId: '', topicId: '', scheduledAt: '', durationMinutes: 45 });
      setShowForm(false);
      showAlert('success', 'Study session scheduled.');
      fetchData();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Could not schedule session.');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/sessions/${id}/status`, { status });
      showAlert('success', `Session marked as ${status}.`);
      fetchData();
    } catch (err) {
      showAlert('error', 'Failed to update session.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this scheduled study session?')) return;
    try {
      await api.delete(`/sessions/${id}`);
      showAlert('success', 'Session removed.');
      fetchData();
    } catch (err) {
      showAlert('error', 'Failed to delete session.');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="loading-state">Loading study schedule...</div>
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
            <h1 className="page-title"><FiCalendar size={24} /> Study Session Schedule</h1>
            <p className="subtitle-muted">Plan dedicated study blocks by subject and track completed sessions.</p>
          </div>
          <button className="btn-primary btn-inline" onClick={() => setShowForm(!showForm)}>
            <FiPlus size={16} /> Schedule Session
          </button>
        </div>

        {statusMsg.text && (
          <div className={`alert ${statusMsg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {statusMsg.text}
          </div>
        )}

        {showForm && (
          <form className="panel-card mb-4" onSubmit={handleCreateSession}>
            <h3 className="mb-3">New Study Session</h3>
            <div className="form-row-2">
              <div className="form-group">
                <label>Session Title *</label>
                <input
                  type="text"
                  className="plain-input"
                  placeholder="e.g., Midterm Review: REST API Security"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date &amp; Time *</label>
                <input
                  type="datetime-local"
                  className="plain-input"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label>Subject (Optional)</label>
                <select
                  className="plain-input"
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value, topicId: '' })}
                >
                  <option value="">— General Study —</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Topic (Optional)</label>
                <select
                  className="plain-input"
                  value={form.topicId}
                  onChange={(e) => setForm({ ...form, topicId: e.target.value })}
                  disabled={!selectedSubject}
                >
                  <option value="">— Any Topic —</option>
                  {selectedSubject?.topics?.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Duration (Minutes)</label>
                <input
                  type="number"
                  min="10"
                  max="480"
                  className="plain-input"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary btn-inline">Save Session</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        {sessions.length === 0 ? (
          <div className="empty-state">
            <FiCalendar size={44} />
            <p>No study sessions scheduled yet. Click "Schedule Session" to plan your next sprint.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session Title</th>
                  <th>Subject / Topic</th>
                  <th>Scheduled Date &amp; Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.title}</strong></td>
                    <td>
                      {s.subjectName ? (
                        <span>{s.subjectName}{s.topicName ? ` / ${s.topicName}` : ''}</span>
                      ) : (
                        <span className="subtitle-muted">General</span>
                      )}
                    </td>
                    <td>{new Date(s.scheduledAt).toLocaleString()}</td>
                    <td><FiClock size={13} /> {s.durationMinutes} mins</td>
                    <td>
                      <span className={`status-badge ${s.status === 'completed' ? 'status-active' : 'status-planned'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {s.status !== 'completed' && (
                          <button
                            className="btn-sm btn-success"
                            onClick={() => handleUpdateStatus(s.id, 'completed')}
                          >
                            <FiCheckCircle size={13} /> Complete
                          </button>
                        )}
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => handleDelete(s.id)}
                          title="Delete Session"
                        >
                          <FiTrash2 size={13} />
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
