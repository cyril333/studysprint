// ============================================================
// StudySprint - Student Dashboard
// ============================================================
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { FiBookOpen, FiAward, FiTrendingUp, FiUpload, FiPlay, FiCalendar } from 'react-icons/fi';

export default function StudentDashboard() {
  const { user } = useAuth();
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

  return (
    <>
      <Navbar />
      <div className="page-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>Welcome back, {user?.fullName?.split(' ')[0]}! 👋</h1>
            <p>Ready to supercharge your study session? Let's get started.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-blue">
            <div className="stat-icon"><FiTrendingUp size={24} /></div>
            <div className="stat-info">
              <h3>{stats.studyStreak || 0}</h3>
              <p>Day Streak</p>
            </div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon"><FiAward size={24} /></div>
            <div className="stat-info">
              <h3>{stats.quizzesTaken || 0}</h3>
              <p>Quizzes Taken</p>
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
              <p>Avg Score</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-card">
              <FiUpload size={28} />
              <span>Upload Notes</span>
            </button>
            <button className="action-card">
              <FiPlay size={28} />
              <span>Take a Quiz</span>
            </button>
            <button className="action-card">
              <FiCalendar size={28} />
              <span>View Schedule</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="empty-state">
            <FiBookOpen size={48} />
            <p>No recent activity yet. Start by uploading your study notes!</p>
          </div>
        </div>
      </div>
    </>
  );
}
