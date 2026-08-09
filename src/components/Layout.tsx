import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/SupabaseProvider';
import { FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { DocDownloadModal } from './DocDownloadModal';
import { OfflineSyncBar } from './OfflineSyncBar';

export function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDocModal, setShowDocModal] = useState(false);

  return (
    <>

      <DocDownloadModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
      />

      {/* Removed fixed 'Área protegida' badge to simplify dashboard UI */}

      <motion.div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowDocModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md shadow-md text-sm font-semibold transition-all"
          title="Especificação de Requisitos e Arquitetura (.DOC)"
          aria-label="Baixar especificação do sistema"
        >
          <FileText className="w-4 h-4 text-white" />
          <span className="hidden md:inline">Baixar Doc</span>
        </motion.button>
      </motion.div>

      <Outlet />

      {/* Connectivity & Offline Sync Status Bar */}
      <OfflineSyncBar coordinatorId={user?.uid} />
    </>
  );
}
