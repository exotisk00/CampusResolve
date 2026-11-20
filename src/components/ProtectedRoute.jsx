/**
 * Protected Route Component
 * Redirects unauthenticated users to /login
 * Optionally restricts by role (e.g., 'staff')
 *
 * CampusResolve AI — LPU Phagwara Campus
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  // Show nothing while auth state is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-content-secondary text-sm font-medium">Loading your session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-restricted route: check Firestore profile role
  if (requiredRole && userProfile?.role !== requiredRole) {
    if (userProfile?.role === 'student' && requiredRole === 'staff') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
