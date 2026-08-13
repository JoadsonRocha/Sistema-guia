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

  // Check URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const hasAccessParams = searchParams.has('email') || searchParams.has('access_token') || searchParams.has('role');
  const hasVoterRegisterParams = !hasAccessParams && (searchParams.has('leaderId') || searchParams.has('liderId') || searchParams.has('inviter'));

  // 1. Redirecionar links de acesso operacional (coordenadores / líderes) diretamente para /login
  if (hasAccessParams && !isLoggedIn) {
    return <Navigate to={`/login?${searchParams.toString()}`} replace />;
  }

  // 2. Se já estiver logado, ir para o dashboard
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Se for link exclusivo de cadastro de eleitor na raiz, renderizar cadastro público
  if (hasVoterRegisterParams) {
    const leaderId = searchParams.get('leaderId') || searchParams.get('liderId') || searchParams.get('coordinatorId') || undefined;
    const teamId = searchParams.get('teamId') || undefined;
    return <PublicVoterRegister leaderId={leaderId} teamId={teamId} />;
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
  const hasAccessParams = searchParams.has('email') && (searchParams.has('access_token') || searchParams.has('role'));

  // Se alguém acessar /cadastro com link de coordenador/líder, redirecionar para /login
  if (hasAccessParams) {
    return <Navigate to={`/login?${searchParams.toString()}`} replace />;
  }

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
