import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../lib/FirebaseProvider';
import { safeLocalStorage } from '../utils/safeStorage';
import { DemoBlockModal } from '../components/DemoBlockModal';
import { ComponentLoader } from '../components/routing/ProtectedRoute';
import { useNavigate } from 'react-router-dom';

const CoordinatorDashboard = lazy(() => import('../components/CoordinatorDashboard'));
const CaboDashboard = lazy(() => import('../components/CaboDashboard'));

export function DashboardPage() {
  const { user, isAdmin, isLeader, demoRole } = useAuth();
  const navigate = useNavigate();
  
  const [view, setView] = useState<'coord' | 'cabo'>('coord');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (safeLocalStorage.getItem('urna360-theme') as 'light' | 'dark') || 'light';
  });

  const [showDemoBlockModal, setShowDemoBlockModal] = useState(false);

  useEffect(() => {
    if (demoRole) {
      setView(demoRole === 'lider' ? 'cabo' : 'coord');
    } else if (user) {
      setView(isLeader ? 'cabo' : 'coord'); // fixed bug: isLeader now goes to cabo correctly
    }
  }, [user, isAdmin, isLeader, demoRole]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    safeLocalStorage.setItem('urna360-theme', theme);
  }, [theme]);

  const handleBlockDemo = () => setShowDemoBlockModal(true);

  return (
    <div className={`${theme} min-h-screen transition-colors duration-300 relative flex flex-col`}>
      <DemoBlockModal
        isOpen={showDemoBlockModal}
        onClose={() => setShowDemoBlockModal(false)}
        onGoToSalesPage={() => {
          setShowDemoBlockModal(false);
          navigate('/');
        }}
      />

      <Suspense fallback={<ComponentLoader />}>
        {view === 'coord' ? (
          <CoordinatorDashboard 
            theme={theme} 
            setTheme={setTheme} 
            isDemoMode={!!demoRole}
            onBlockDemoVoterRegistration={handleBlockDemo}
          />
        ) : (
          <CaboDashboard 
            theme={theme} 
            setTheme={setTheme} 
            isDemoMode={!!demoRole}
            onBlockDemoVoterRegistration={handleBlockDemo}
          />
        )}
      </Suspense>
    </div>
  );
}
