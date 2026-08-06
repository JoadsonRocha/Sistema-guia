import React from 'react';
import { ShoppingCart, LogOut, Crown, Shield, Users, Sparkles, FileText } from 'lucide-react';
import { UserRole } from '../lib/SupabaseProvider';

interface DemoHeaderBannerProps {
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onGoToSalesPage: () => void;
  onExitDemo: () => void;
  onDownloadDoc?: () => void;
}

export const DemoHeaderBanner: React.FC<DemoHeaderBannerProps> = ({
  activeRole,
  onSelectRole,
  onGoToSalesPage,
  onExitDemo,
  onDownloadDoc
}) => {
  return (
    <div className="bg-zinc-950 border-b border-blue-500/40 text-white z-50 sticky top-0 shadow-2xl">
      {/* Top Main Banner */}
      <div className="px-3 py-2.5 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left: Mode Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
          </span>
          <span className="uppercase text-[10px] tracking-widest font-black text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/30 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            <span>TESTE AO VIVO</span>
          </span>
        </div>

        {/* Center: Role Switcher Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <span className="text-[10px] uppercase font-black text-zinc-400 px-2 hidden sm:inline tracking-wider">
            Alternar Perfil:
          </span>

          {/* Coordenador Geral */}
          <button
            onClick={() => onSelectRole('coordenador_geral')}
            className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeRole === 'coordenador_geral'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Coordenador Geral</span>
          </button>

          {/* Coordenador Regional */}
          <button
            onClick={() => onSelectRole('coordenador_regional')}
            className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeRole === 'coordenador_regional'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-blue-300 shrink-0" />
            <span>Coord. Regional</span>
          </button>

          {/* Líder de Bairro */}
          <button
            onClick={() => onSelectRole('lider')}
            className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeRole === 'lider'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>Líder / Equipe</span>
          </button>
        </div>

        {/* Right: Plan Purchase & Exit */}
        <div className="flex items-center gap-2 shrink-0">
          {onDownloadDoc && (
            <button
              onClick={onDownloadDoc}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 border border-blue-400/40"
              title="Baixar Documento de Arquitetura e Requisitos (.DOC)"
            >
              <FileText className="w-3.5 h-3.5 text-blue-200" />
              <span>Doc (.DOC)</span>
            </button>
          )}

          <button
            onClick={onGoToSalesPage}
            className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Adquirir Plano 2026</span>
          </button>

          <button
            onClick={onExitDemo}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all border border-zinc-700"
            title="Sair da demonstração"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* Role Feature Helper Strip */}
      <div className="bg-gradient-to-r from-blue-950/80 via-zinc-900 to-blue-950/80 border-t border-zinc-800/80 px-4 py-1.5 text-center text-[11px] font-bold text-blue-200">
        {activeRole === 'coordenador_geral' && (
          <span>
            👑 <strong>Visão Coordenador Geral:</strong> Controle macro da campanha, Coordenadores Regionais, Análise Eleitoral TRE 2026, Equipes, Demandas e Materiais.
          </span>
        )}
        {activeRole === 'coordenador_regional' && (
          <span>
            🛡️ <strong>Visão Coordenador Regional (Região 1):</strong> Articulação local, gestão de líderes e equipes da regional, agenda de campo e mapeamento de redutos.
          </span>
        )}
        {activeRole === 'lider' && (
          <span>
            🚩 <strong>Visão Líder de Bairro / Cabo Eleitoral:</strong> Painel tático de rua, cadastro de eleitores (com trava de demo), solicitação de combustível, notas de voz e ouvidoria.
          </span>
        )}
      </div>
    </div>
  );
};
