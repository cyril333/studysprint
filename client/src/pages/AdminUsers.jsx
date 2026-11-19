// ============================================================
// StudySprint - Admin User Management Page
// ============================================================
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { FiUsers, FiSearch, FiUserCheck, FiUserX } from 'react-icons/fi';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const response = await api.patch(`/users/${userId}/status`, { status: newStatus });
      setStatusMessage(response.data.message);
      fetchUsers(); // Refresh list
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      setStatusMessage(error.response?.data?.message || 'Failed to update status.');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="loading-state">Loading users...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="section-header">
          <h1 className="page-title">
            <FiUsers size={28} /> User Management
          </h1>
        </div>

        {statusMessage && <div className="alert alert-success">{statusMessage}</div>}

        {/* Search Bar */}
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Users Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
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
                    <td>
                      {u.id !== currentUser.id && (
                        <button
                          className={`btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(u.id, u.status)}
                        >
                          {u.status === 'active' ? (
                            <><FiUserX size={14} /> Suspend</>
                          ) : (
                            <><FiUserCheck size={14} /> Activate</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
