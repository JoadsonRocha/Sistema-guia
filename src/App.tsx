import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ProtectedRoute, ComponentLoader } from './components/routing/ProtectedRoute';
import { PublicRoute } from './components/routing/PublicRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { ForcePasswordChangePage } from './pages/ForcePasswordChangePage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';

// Lazy loading heavy components
const PublicVoterRegister = lazy(() => import('./components/PublicVoterRegister'));
const SalesLandingPage = lazy(() => import('./components/SalesLandingPage').then(m => ({ default: m.SalesLandingPage })));

import { useAuth } from './lib/SupabaseProvider';
import { supabaseService } from './lib/supabaseService';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';

function SyncIndicator() {
  return null;
}

function SalesLandingWrapper() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  // Check if URL search params contain voter registration link parameters
  const searchParams = new URLSearchParams(window.location.search);
  const hasRegisterParams = searchParams.has('leaderId') || searchParams.has('liderId') || searchParams.has('teamId') || searchParams.has('coordinatorId') || searchParams.has('inviter');
  const hasAccessParams = searchParams.has('email') && (searchParams.has('access_token') || searchParams.has('role'));

  if (hasRegisterParams) {
    const leaderId = searchParams.get('leaderId') || searchParams.get('liderId') || searchParams.get('coordinatorId') || undefined;
    const teamId = searchParams.get('teamId') || undefined;
    return <PublicVoterRegister leaderId={leaderId} teamId={teamId} />;
  }

  // Redirecionar links de acesso de regionais/líderes (email+access_token) para /login
  if (hasAccessParams && !isLoggedIn) {
    return <Navigate to={`/login?${searchParams.toString()}`} replace />;
  }

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAccessSystem = () => {
    navigate('/login');
  };

  return (
    <SalesLandingPage 
      onAccessSystem={handleAccessSystem}
    />
  );
}

// Wrapper to handle external registration URL parameters vs route params
function PublicRegisterWrapper() {
  const searchParams = new URLSearchParams(window.location.search);
  const leaderId = searchParams.get('leaderId') || searchParams.get('liderId') || searchParams.get('coordinatorId') || undefined;
  const teamId = searchParams.get('teamId') || undefined;
  
  return <PublicVoterRegister leaderId={leaderId} teamId={teamId} />;
}

export default function App() {
  return (
    <>
      <SyncIndicator />
      <Suspense fallback={<ComponentLoader />}>
        <Routes>
        {/* Landing Page */}
        <Route path="/" element={<SalesLandingWrapper />} />

        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Public external register */}
        <Route path="/cadastro" element={<PublicRegisterWrapper />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<ForcePasswordChangePage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
    </>
  );
}
