// ============================================================
// StudySprint - Main App Component
// ============================================================
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Landing from './pages/Landing';
import StudentDashboard from './pages/StudentDashboard';
import StudentNotes from './pages/StudentNotes';
import StudentQuizzes from './pages/StudentQuizzes';
import QuizRunner from './pages/QuizRunner';
import StudentSchedule from './pages/StudentSchedule';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminModeration from './pages/AdminModeration';
import './App.css';

// Redirect authenticated users away from login/register
function PublicRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* Shared Authenticated Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={['student', 'admin']}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/notes"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentNotes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quizzes"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentQuizzes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quizzes/:id"
        element={
          <ProtectedRoute roles={['student']}>
            <QuizRunner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/schedule"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentSchedule />
          </ProtectedRoute>
        }
      />

      {/* Shared Quiz Route (any authenticated user) */}
      <Route
        path="/shared-quiz/:shareToken"
        element={
          <ProtectedRoute roles={['student', 'admin']}>
            <QuizRunner />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/moderation"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminModeration />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
