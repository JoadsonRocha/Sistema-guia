import React from 'react';
import { UserCheck, MapPin, Plus, RefreshCw, LogOut } from 'lucide-react';
import logoImg from '../../assets/logo.png';

interface CaboHeaderProps {
  leaderName: string;
  region?: string;
  onOpenCheckin: () => void;
  onOpenNewVoter: () => void;
  onLogout: () => void;
}

export const CaboHeader: React.FC<CaboHeaderProps> = ({
  leaderName,
  region,
  onOpenCheckin,
  onOpenNewVoter,
  onLogout,
}) => {
  return (
    <header className="bg-zinc-900/90 border-b border-zinc-800 backdrop-blur-md sticky top-0 z-40 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Leader Profile */}
        <div className="flex items-center space-x-3">
          <img 
            src={logoImg} 
            onError={(e) => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = '/logo.png'; } }}
            alt="Logo Nexus Política" 
            className="w-9 h-9 object-contain"
          />
          <div>
            <h2 className="text-sm font-black text-white leading-tight">{leaderName}</h2>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
              Líder de Campo • {region || 'Base Regional'}
            </span>
          </div>
        </div>

        {/* Quick Touch Actions for Field Leader */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenCheckin}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95"
            title="Bater Ponto com Validação GPS"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Assinar Ponto</span>
          </button>

          <button
            onClick={onOpenNewVoter}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95"
            title="Cadastrar Novo Eleitor"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo Eleitor</span>
          </button>

        </div>
      </div>
    </header>
  );
};
