import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../lib/SupabaseProvider';
import { ShieldCheck, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { DemoHeaderBanner } from './DemoHeaderBanner';
import { DocDownloadModal } from './DocDownloadModal';
import { OfflineSyncBar } from './OfflineSyncBar';

export function Layout() {
  const { user, isLeader, demoRole, setDemoRole } = useAuth();
  const navigate = useNavigate();
  const [showDocModal, setShowDocModal] = useState(false);

  const handleSelectDemoRole = (newRole: UserRole) => {
    setDemoRole(newRole);
  };

  const handleExitDemoMode = () => {
    setDemoRole(null);
    navigate('/');
  };

  return (
    <>
      {demoRole && (
        <div className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/90 backdrop-blur-xl">
          <DemoHeaderBanner 
            activeRole={demoRole}
            onSelectRole={handleSelectDemoRole}
            onGoToSalesPage={() => navigate('/')} 
            onExitDemo={handleExitDemoMode}
            onDownloadDoc={() => setShowDocModal(true)}
          />
        </div>
      )}

      <DocDownloadModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
      />

      {/* Removed fixed 'Área protegida' badge to simplify dashboard UI */}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDocModal(true)}
        className="fixed bottom-5 right-5 z-40 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs uppercase tracking-wider border-2 border-white/20 transition-all"
        title="Especificação de Requisitos e Arquitetura em .DOC"
      >
        <FileText className="w-4 h-4 text-blue-200" />
        <span className="hidden sm:inline">Baixar Doc (.DOC)</span>
      </motion.button>

      <Outlet />

      {/* Connectivity & Offline Sync Status Bar */}
      <OfflineSyncBar coordinatorId={user?.uid} />
    </>
  );
}
