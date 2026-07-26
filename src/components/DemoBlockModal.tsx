import React from 'react';
import { Lock, Sparkles, MessageSquare, ArrowRight, X, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DemoBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToSalesPage: () => void;
}

export const DemoBlockModal: React.FC<DemoBlockModalProps> = ({ isOpen, onClose, onGoToSalesPage }) => {
  if (!isOpen) return null;

  const whatsappMessage = encodeURIComponent(
    "Olá! Estou testando a Demonstração ao Vivo do Nexus Política (Edição Eleições 2026) e gostaria de contratar uma licença comercial para a minha campanha."
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn">
      <div className="max-w-lg w-full bg-zinc-900 border-2 border-blue-500/80 rounded-2xl p-6 md:p-8 text-zinc-100 shadow-2xl relative overflow-hidden text-left space-y-6">
        
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/80 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Recurso Bloqueado na Demonstração</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
            Desbloqueie o Cadastro Ilimitado de Eleitores
          </h2>
          <p className="text-xs text-zinc-300 font-medium leading-relaxed">
            No modo de demonstração, você pode cadastrar <strong className="text-emerald-400">Coordenadores</strong> e <strong className="text-emerald-400">Líderes de Equipe</strong> para testar a estrutura tática da plataforma.
          </p>
        </div>

        {/* Plan Benefits Highlights */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-2.5 text-xs">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
            Com a Licença Comercial Ativa (Eleições 2026):
          </p>
          <ul className="space-y-2 text-zinc-300 font-bold">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cadastro ilimitado de eleitores por bairro e zona</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Disparos de mensagens WhatsApp em 1 clique (100% grátis)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Mapa de calor tático e dados históricos por seção TRE</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Controle de materiais de logística e metas por líder</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              onClose();
              onGoToSalesPage();
            }}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all active:scale-95"
          >
            <span>Ver Planos & Adquirir Minha Licença</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href={`https://wa.me/5511999999999?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-6 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Falar com Consultor Comercial no WhatsApp</span>
          </a>
        </div>

        <p className="text-[9px] text-zinc-500 font-bold text-center uppercase tracking-wider">
          Nexus Política • Sistema Tático de Gestão Eleitoral 2026
        </p>
      </div>
    </div>
  );
};
