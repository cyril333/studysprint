// ============================================================
// StudySprint - Protected Route Component
// ============================================================
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protects routes that require authentication.
// If `roles` is provided, also checks that the user has one of those roles.
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard if wrong role
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return children;
}
