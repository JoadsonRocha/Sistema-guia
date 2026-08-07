import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import { supabaseDataService } from '../lib/supabaseService';

export const OfflineSyncBar: React.FC<{ coordinatorId?: string }> = ({ coordinatorId }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Check pending offline items in local storage
  const checkPendingItems = () => {
    try {
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Count any localStorage key used for offline items.
        // Treat both item keys and list keys (suffix `_list`) as 1 pending unit each.
        if (key && key.startsWith('nexus_sb_')) {
          // Optionally ignore internal metadata keys if present
          if (key.endsWith('_meta')) continue;
          count++;
        }
      }
      setPendingCount(count);
    } catch (e) {
      setPendingCount(0);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncMessage('Conexão restabelecida. Sincronizando dados...');
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncMessage('Você está sem sinal de internet. Modo offline ativo.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPendingItems();
    const interval = setInterval(checkPendingItems, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    setSyncMessage('Sincronizando registros pendentes...');

    try {
      // Sync local records with Supabase if online
      if (coordinatorId) {
        const localVoters = localStorage.getItem('nexus_sb_voters_list');
        if (localVoters) {
          const parsed = JSON.parse(localVoters);
          await supabaseDataService.syncCampaignState(coordinatorId, { voters: parsed });
        }
      }
      checkPendingItems();
      setSyncMessage('Todos os dados foram sincronizados com sucesso!');
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err) {
      console.warn('Erro ao sincronizar offline:', err);
      setSyncMessage('Falha ao sincronizar. Tentaremos novamente em breve.');
    } finally {
      setIsSyncing(false);
    }
  };

  const shouldShow = !isOnline || pendingCount > 0;

  if (!shouldShow) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
      !isOnline 
        ? 'bg-amber-950/95 border-t border-amber-600/50 text-amber-200 backdrop-blur-md shadow-lg shadow-amber-950/50' 
        : 'bg-blue-950/95 border-t border-blue-600/50 text-blue-200 backdrop-blur-md shadow-lg shadow-blue-950/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs font-medium">
        <div className="flex items-center space-x-2.5">
          {!isOnline ? (
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-amber-100">Modo Offline Ativo</span>
            </div>
          ) : pendingCount > 0 ? (
            <div className="flex items-center space-x-2">
              <CloudUpload className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-blue-100">Sincronização Pendente</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conectado à Central</span>
            </div>
          )}

          <span className="hidden md:inline border-l border-zinc-700/60 pl-2.5 text-zinc-300">
            {syncMessage || (!isOnline 
              ? `${pendingCount} registro(s) salvos no dispositivo.` 
              : `${pendingCount} item(ns) prontos para sincronizar.`)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {pendingCount > 0 && isOnline && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="flex items-center space-x-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-all text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
            </button>
          )}

          {!isOnline && (
            <span className="text-[10px] bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700/50 text-amber-300 font-mono">
              SEM INTERNET
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
