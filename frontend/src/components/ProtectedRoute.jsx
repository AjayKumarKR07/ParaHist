// ProtectedRoute.jsx — Route guard requiring authentication
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '6rem 2rem', display: 'flex', justifyContent: 'center' }}>
        <LoadingSpinner size="lg" text="Verifying authentication session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated user to /login with state to redirect back after login
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
