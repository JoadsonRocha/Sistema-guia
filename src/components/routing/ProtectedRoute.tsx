import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/SupabaseProvider';
import { motion } from 'motion/react';
import logoImg from '../../assets/logo.png';

export const ComponentLoader = () => (
  <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-8 transition-colors duration-500">
    <div className="relative">
      <div className="flex items-center justify-center bg-transparent">
        <img 
          src={logoImg} 
          onError={(e) => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = '/logo.png'; } }} 
          alt="Logo Nexus Política" 
          className="max-h-40 md:max-h-48 w-auto object-contain relative z-10 animate-pulse" 
        />
      </div>
      <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 animate-pulse"></div>
    </div>
    <div className="space-y-3 text-center mt-6">
      <p className="text-[var(--text-secondary)] font-black uppercase tracking-widest text-[10px] opacity-60">Carregando Sistema...</p>
    </div>
    <div className="mt-10 w-48 h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="w-full h-full bg-blue-600"
      />
    </div>
  </div>
);

export function ProtectedRoute() {
  const { user, loading, forcePasswordChange, demoRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <ComponentLoader />;
  }

  const isLoggedIn = !!user || !!demoRole;

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is logged in but needs to change password, redirect to change password page.
  if (forcePasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // Se já alterou a senha mas está tentando acessar a rota de change-password, joga pro dashboard
  if (!forcePasswordChange && location.pathname === '/change-password') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
