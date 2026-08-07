import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ProtectedRoute, ComponentLoader } from './components/routing/ProtectedRoute';
import { PublicRoute } from './components/routing/PublicRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { ForcePasswordChangePage } from './pages/ForcePasswordChangePage';
import { DashboardPage } from './pages/DashboardPage';

// Lazy loading heavy components
const PublicVoterRegister = lazy(() => import('./components/PublicVoterRegister'));
const SalesLandingPage = lazy(() => import('./components/SalesLandingPage').then(m => ({ default: m.SalesLandingPage })));

function SalesLandingWrapper() {
  const navigate = useNavigate();

  const handleAccessSystem = () => {
    // Landing page is isolated from auth state: always send users to login
    navigate('/login');
  };

  const handleStartDemoMode = () => {
    // Start demo via login query param so demo activation happens within auth context
    navigate('/login?demo=coordenador_geral');
  };

  return (
    <SalesLandingPage 
      onAccessSystem={handleAccessSystem}
      onStartDemoMode={handleStartDemoMode}
      onLogout={isLoggedIn ? logout : undefined}
      isLoggedIn={isLoggedIn}
    />
  );
}

// Wrapper to handle external registration URL parameters vs route params
function PublicRegisterWrapper() {
  const searchParams = new URLSearchParams(window.location.search);
  const leaderId = searchParams.get('leaderId') || searchParams.get('liderId') || undefined;
  const teamId = searchParams.get('teamId') || undefined;
  
  return <PublicVoterRegister leaderId={leaderId} teamId={teamId} />;
}

export default function App() {
  return (
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
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
