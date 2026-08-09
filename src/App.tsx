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
  const [queueCount, setQueueCount] = React.useState(0);
  const [isOnline, setIsOnline] = React.useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [showSyncedMsg, setShowSyncedMsg] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    let timer: any = null;
    const updateQueue = () => {
      const q = supabaseService.getQueue();
      const previousCount = queueCount;
      setQueueCount(q.length);

      if (q.length > 0 && window.navigator.onLine) {
        setIsSyncing(true);
        setShowSyncedMsg(false);
      } else if (q.length === 0 && previousCount > 0 && window.navigator.onLine) {
        setIsSyncing(false);
        setShowSyncedMsg(true);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => setShowSyncedMsg(false), 2500);
      } else {
        setIsSyncing(false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline_queue_updated', updateQueue);
    
    updateQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline_queue_updated', updateQueue);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (isOnline && queueCount === 0 && !showSyncedMsg && !isSyncing) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-md text-xs font-semibold tracking-normal transition-all duration-300 backdrop-blur-md ${
        !isOnline ? 'bg-red-600/95 text-white' : 
        isSyncing ? 'bg-amber-500/95 text-zinc-950 animate-pulse' : 
        'bg-emerald-600/95 text-white'
      }`}>
        {!isOnline && <CloudOff className="w-3.5 h-3.5" />}
        {isOnline && isSyncing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
        {isOnline && !isSyncing && <CheckCircle2 className="w-3.5 h-3.5" />}
        
        {!isOnline ? `Modo offline (${queueCount} pendentes)` : 
         isSyncing ? `Sincronizando ${queueCount} alterações...` : 
         'Sincronizado'}
      </div>
    </div>
  );
}

function SalesLandingWrapper() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;

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
  const leaderId = searchParams.get('leaderId') || searchParams.get('liderId') || undefined;
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
