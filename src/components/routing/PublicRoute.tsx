import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/FirebaseProvider';
import { ComponentLoader } from './ProtectedRoute';

export function PublicRoute() {
  const { user, loading, demoRole } = useAuth();

  if (loading) {
    return <ComponentLoader />;
  }

  const isLoggedIn = !!user || !!demoRole;

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
