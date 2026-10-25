import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-darkBackground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (adminOnly && !user.is_admin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
