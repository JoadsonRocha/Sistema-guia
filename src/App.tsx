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

import { useAuth } from './lib/SupabaseProvider';
import { supabaseService } from './lib/supabaseService';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';

function SyncIndicator() {
  const [queueCount, setQueueCount] = React.useState(0);
  const [isOnline, setIsOnline] = React.useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    const updateQueue = () => {
      const q = supabaseService.getQueue();
      setQueueCount(q.length);
      if (q.length > 0 && window.navigator.onLine) {
        setIsSyncing(true);
        // Timeout para dar feedback visual antes de sumir
        setTimeout(() => setIsSyncing(false), 2000); 
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
    };
  }, []);

  if (queueCount === 0 && isOnline) return null;

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[9999] mt-2">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
        !isOnline ? 'bg-red-500 text-white' : 
        isSyncing ? 'bg-amber-500 text-white animate-pulse' : 
        'bg-emerald-500 text-white'
      }`}>
        {!isOnline && <CloudOff className="w-4 h-4" />}
        {isOnline && isSyncing && <RefreshCw className="w-4 h-4 animate-spin" />}
        {isOnline && !isSyncing && queueCount > 0 && <CheckCircle2 className="w-4 h-4" />}
        
        {!isOnline ? `Modo Offline (${queueCount} pendentes)` : 
         isSyncing ? `Sincronizando ${queueCount} itens...` : 
         'Sincronizado!'}
      </div>
    </div>
  );
}

function SalesLandingWrapper() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;

  const handleAccessSystem = () => {
    // Landing page is isolated from auth state: always send users to login
    navigate('/login');
  };

  return (
    <SalesLandingPage 
      onAccessSystem={handleAccessSystem}
      onStartDemoMode={() => {}}
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
          </Route>
        </Route>
      </Routes>
    </Suspense>
    </>
  );
}
