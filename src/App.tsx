import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ProtectedRoute, ComponentLoader } from './components/routing/ProtectedRoute';
import { PublicRoute } from './components/routing/PublicRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { ForcePasswordChangePage } from './pages/ForcePasswordChangePage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdvancedDashboardPage } from './pages/AdvancedDashboardPage';

// Lazy loading heavy components
const PublicVoterRegister = lazy(() => import('./components/PublicVoterRegister'));
const SalesLandingPage = lazy(() => import('./components/SalesLandingPage').then(m => ({ default: m.SalesLandingPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const CookiesPage = lazy(() => import('./pages/CookiesPage').then(m => ({ default: m.CookiesPage })));

import { useAuth } from './lib/SupabaseProvider';
import { supabaseService } from './lib/supabaseService';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';

function SyncIndicator() {
  return null;
}

function SalesLandingWrapper() {
  const navigate = useNavigate();
  const { user, sessionLocked } = useAuth();
  const isLoggedIn = !!user && !sessionLocked;

  // Check URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const hasAccessParams = searchParams.has('email') || searchParams.has('access_token') || searchParams.has('role');
  const hasVoterRegisterParams = !hasAccessParams && (
    searchParams.has('leaderId') || 
    searchParams.has('liderId') || 
    searchParams.has('teamId') || 
    searchParams.has('coordinatorId') || 
    searchParams.has('inviter')
  );

  // 1. Redirecionar links de acesso operacional (coordenadores / líderes) diretamente para /login
  if (hasAccessParams && !isLoggedIn) {
    return <Navigate to={`/login?${searchParams.toString()}`} replace />;
  }

  // 2. Se já estiver logado, ir para o dashboard
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Se for link exclusivo de cadastro de eleitor na raiz, redirecionar para a rota canônica /cadastro
  if (hasVoterRegisterParams) {
    return <Navigate to={`/cadastro?${searchParams.toString()}`} replace />;
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

  const leaderId = searchParams.get('leaderId') || searchParams.get('liderId') || undefined;
  const teamId = searchParams.get('teamId') || undefined;
  const coordinatorId = searchParams.get('coordinatorId') || undefined;
  
  return <PublicVoterRegister leaderId={leaderId} teamId={teamId} coordinatorId={coordinatorId} />;
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

        {/* Legal Pages */}
        <Route path="/termos" element={<TermsPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
        <Route path="/cookies" element={<CookiesPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<ForcePasswordChangePage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/powerbi" element={<AdvancedDashboardPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
    </>
  );
}
