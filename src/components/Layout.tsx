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

      <Outlet />

      {/* Connectivity & Offline Sync Status Bar */}
      <OfflineSyncBar coordinatorId={user?.uid} />
    </>
  );
}
