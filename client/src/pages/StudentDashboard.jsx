// ============================================================
// StudySprint - Student Dashboard (FR-008 Progress Analytics)
// ============================================================
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { FiBookOpen, FiAward, FiTrendingUp, FiUpload, FiPlay, FiCalendar, FiClock } from 'react-icons/fi';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/student');
        setDashboardData(response.data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="loading-state">Loading dashboard...</div>
        </div>
      </>
    );
  }

  const stats = dashboardData?.dashboard || {};
  const recentActivity = stats.recentActivity || [];
  const perSubject = stats.perSubjectPerformance || [];
  const upcomingSessions = stats.upcomingSessions || [];

  return (
    <>
      <Navbar />
      <div className="page-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>Welcome back, {user?.fullName?.split(' ')[0]}</h1>
            <p>Ready to supercharge your study session? Organize notes, generate quizzes, and track mastery.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-blue">
            <div className="stat-icon"><FiTrendingUp size={24} /></div>
            <div className="stat-info">
              <h3>{stats.studyStreak || 0}</h3>
              <p>Active Study Days</p>
            </div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon"><FiAward size={24} /></div>
            <div className="stat-info">
              <h3>{stats.quizzesTaken || 0}</h3>
              <p>Quizzes Attempted</p>
            </div>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-icon"><FiBookOpen size={24} /></div>
            <div className="stat-info">
              <h3>{stats.notesUploaded || 0}</h3>
              <p>Notes Uploaded</p>
            </div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-icon"><FiAward size={24} /></div>
            <div className="stat-info">
              <h3>{stats.averageScore || 0}%</h3>
              <p>Avg Accuracy</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-card" onClick={() => navigate('/student/notes')}>
              <FiUpload size={28} />
              <span>Upload &amp; Organize Notes</span>
            </button>
            <button className="action-card" onClick={() => navigate('/student/quizzes')}>
              <FiPlay size={28} />
              <span>Take a Practice Quiz</span>
            </button>
            <button className="action-card" onClick={() => navigate('/student/schedule')}>
              <FiCalendar size={28} />
              <span>Schedule Study Session</span>
            </button>
          </div>
        </div>

        {/* Per-Subject Performance Analytics (FR-008) */}
        {perSubject.length > 0 && (
          <div className="section">
            <h2 className="section-title">Per-Subject Quiz Accuracy</h2>
            <div className="panel-card">
              <div className="analytics-bars">
                {perSubject.map((item, idx) => (
                  <div key={idx} className="analytics-bar-row">
                    <div className="analytics-bar-label">
                      <strong>{item.subjectName}</strong>
                      <span>{item.avgPercentage}% ({item.attempts} attempts)</span>
                    </div>
                    <div className="analytics-bar-track">
                      <div
                        className="analytics-bar-fill"
                        style={{ width: `${Math.min(100, item.avgPercentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Study Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Upcoming Study Sessions</h2>
              <Link to="/student/schedule" className="view-all-link">Manage Schedule →</Link>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Subject</th>
                    <th>Scheduled Time</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingSessions.map((s) => (
                    <tr key={s.id}>
                      <td><strong>{s.title}</strong></td>
                      <td>{s.subjectName || 'General'}</td>
                      <td>{new Date(s.scheduledAt).toLocaleString()}</td>
                      <td><FiClock size={13} /> {s.durationMinutes} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Quiz Activity */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Quiz Attempts</h2>
            <Link to="/student/quizzes" className="view-all-link">View All Quizzes →</Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <FiBookOpen size={48} />
              <p>No quiz attempts yet. Upload study notes to generate and take your first AI quiz!</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Accuracy</th>
                    <th>Completed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((act) => (
                    <tr key={act.id}>
                      <td><strong>{act.quizTitle}</strong></td>
                      <td>{act.score} / {act.totalQuestions}</td>
                      <td><strong>{act.percentage}%</strong></td>
                      <td>{new Date(act.completedAt).toLocaleString()}</td>
                      <td>
                        <Link to={`/student/quizzes/${act.quizId}`} className="btn-sm">Retake</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
