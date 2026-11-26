// ============================================================
// StudySprint - Admin Dashboard
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { FiUsers, FiUserCheck, FiUserX, FiActivity, FiArrowRight } from 'react-icons/fi';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/admin');
        setData(response.data);
      } catch (error) {
        console.error('Failed to load admin dashboard:', error);
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

  const stats = data?.stats || {};
  const recentUsers = data?.recentUsers || [];

  return (
    <>
      <Navbar />
      <div className="page-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>Admin Dashboard</h1>
            <p>Welcome, {user?.fullName}. Here's your system overview.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-blue">
            <div className="stat-icon"><FiUsers size={24} /></div>
            <div className="stat-info">
              <h3>{stats.total || 0}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon"><FiUserCheck size={24} /></div>
            <div className="stat-info">
              <h3>{stats.active || 0}</h3>
              <p>Active Users</p>
            </div>
          </div>
          <div className="stat-card stat-red">
            <div className="stat-icon"><FiUserX size={24} /></div>
            <div className="stat-info">
              <h3>{stats.suspended || 0}</h3>
              <p>Suspended</p>
            </div>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-icon"><FiActivity size={24} /></div>
            <div className="stat-info">
              <h3>{stats.students || 0}</h3>
              <p>Students</p>
            </div>
          </div>
          <Link to="/admin/moderation" className="stat-card stat-orange" style={{ textDecoration: 'none' }}>
            <div className="stat-icon"><FiActivity size={24} /></div>
            <div className="stat-info">
              <h3>{stats.flaggedQuizzes || 0}</h3>
              <p>Flagged Quizzes</p>
            </div>
          </Link>
        </div>

        {/* Recent Users Table */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Registrations</h2>
            <Link to="/admin/users" className="view-all-link">
              View All Users <FiArrowRight size={16} />
            </Link>
          </div>

          {recentUsers.length === 0 ? (
            <div className="empty-state">
              <FiUsers size={48} />
              <p>No users registered yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.slice(0, 5).map((u) => (
                    <tr key={u.id}>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>@{u.username}</td>
                      <td>
                        <span className={`role-badge ${u.role === 'admin' ? 'role-admin' : 'role-student'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${u.status}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
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
