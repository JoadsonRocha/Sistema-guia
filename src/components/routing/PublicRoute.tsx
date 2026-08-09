import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/SupabaseProvider';
import { ComponentLoader } from './ProtectedRoute';

export function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <ComponentLoader />;
  }

  const isLoggedIn = !!user;

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
