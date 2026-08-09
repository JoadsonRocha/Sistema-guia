import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../lib/SupabaseProvider';
import { safeLocalStorage } from '../utils/safeStorage';
import { ComponentLoader } from '../components/routing/ProtectedRoute';

const CoordinatorDashboard = lazy(() => import('../components/CoordinatorDashboard'));
const CaboDashboard = lazy(() => import('../components/CaboDashboard'));

export function DashboardPage() {
  const { user, isAdmin, isLeader } = useAuth();
  
  const [view, setView] = useState<'coord' | 'cabo'>('coord');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (safeLocalStorage.getItem('urna360-theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (user) {
      setView(isLeader ? 'cabo' : 'coord');
    }
  }, [user, isAdmin, isLeader]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    safeLocalStorage.setItem('urna360-theme', theme);
  }, [theme]);

  return (
    <div className={`${theme} min-h-screen transition-colors duration-300 relative flex flex-col`}>
      <Suspense fallback={<ComponentLoader />}>
        {view === 'coord' ? (
          <CoordinatorDashboard 
            theme={theme} 
            setTheme={setTheme} 
          />
        ) : (
          <CaboDashboard 
            theme={theme} 
            setTheme={setTheme} 
          />
        )}
      </Suspense>
    </div>
  );
}
