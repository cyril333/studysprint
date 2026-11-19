// ============================================================
// StudySprint - Navbar Component
// ============================================================
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiUser, FiHome, FiUsers, FiBookOpen, FiLayout } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to={isAdmin ? '/admin/dashboard' : '/student/dashboard'}>
          <span className="brand-icon">SS</span>
          <span className="brand-text">StudySprint</span>
        </Link>
      </div>

      <div className="navbar-menu">
        {isAdmin ? (
          <>
            <Link to="/admin/dashboard" className="nav-link">
              <FiLayout size={16} /> Dashboard
            </Link>
            <Link to="/admin/users" className="nav-link">
              <FiUsers size={16} /> Users
            </Link>
          </>
        ) : (
          <>
            <Link to="/student/dashboard" className="nav-link">
              <FiHome size={16} /> Dashboard
            </Link>
            <Link to="/student/notes" className="nav-link">
              <FiBookOpen size={16} /> Notes
            </Link>
          </>
        )}
      </div>

      <div className="navbar-user">
        <div className="user-info">
          <FiUser size={16} />
          <span>{user?.fullName}</span>
          <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-student'}`}>
            {user?.role}
          </span>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          <FiLogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
