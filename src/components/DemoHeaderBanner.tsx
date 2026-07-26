import React from 'react';
import { Sparkles, ShoppingCart, LogOut } from 'lucide-react';

interface DemoHeaderBannerProps {
  onGoToSalesPage: () => void;
  onExitDemo: () => void;
}

export const DemoHeaderBanner: React.FC<DemoHeaderBannerProps> = ({ onGoToSalesPage, onExitDemo }) => {
  return (
    <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg border-b border-blue-400/30 text-xs font-bold z-50 sticky top-0">
      <div className="flex items-center gap-2 text-center sm:text-left">
        <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0" />
        <span className="uppercase text-[10px] tracking-widest font-black text-amber-300 bg-black/20 px-2 py-0.5 rounded border border-amber-400/30 shrink-0">
          Modo Demonstração
        </span>
        <span className="text-[11px] font-semibold text-blue-100 hidden md:inline">
          Navegue pelas telas, cadastre Coordenadores e crie Equipes. Para cadastrar eleitores na rua, adquira o plano 2026.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onGoToSalesPage}
          className="px-3 py-1 rounded bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Adquirir Plano 2026</span>
        </button>

        <button
          onClick={onExitDemo}
          className="px-2.5 py-1 rounded bg-black/30 hover:bg-black/50 text-blue-100 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all border border-blue-400/30"
          title="Sair do modo de demonstração"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </div>
  );
};
