import React from 'react';
import { Users, ShieldAlert, DollarSign, Target, Award, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface CoordinatorOverviewProps {
  stats: {
    totalVoters: number;
    totalTeams: number;
    totalUrgencies: number;
    totalAllocatedBudget: number;
    goalPercentage: number;
  };
  orderOfDay: string;
  onUpdateOrderOfDay?: (newOrder: string) => void;
}

export const CoordinatorOverview: React.FC<CoordinatorOverviewProps> = ({
  stats,
  orderOfDay,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner: Ordem do Dia */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-zinc-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md"
      >
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Diretriz Estratégica do Comando</span>
            <h3 className="text-base font-extrabold text-white">Ordem do Dia (Transmitida a Todas as Equipes)</h3>
          </div>
        </div>
        <p className="text-sm text-zinc-300 font-medium pl-10">
          "{orderOfDay || 'Mobilização total nas vicinais e bairros prioritários. Foco na checagem de cadastro do e-Título.'}"
        </p>
      </motion.div>

      {/* Grid de Cards de Métricas Chave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Eleitores Mapeados */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Eleitores na Base</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-3xl font-black text-white">{stats.totalVoters.toLocaleString()}</h4>
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
                  style={{ width: `${Math.min(stats.goalPercentage, 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-blue-400">{stats.goalPercentage.toFixed(1)}% da Meta</span>
            </div>
          </div>
        </div>

        {/* Equipes Ativas */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Equipes de Campo</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-3xl font-black text-white">{stats.totalTeams}</h4>
            <p className="text-xs text-emerald-400 font-semibold mt-1">✓ Lideranças Regionais Ativas</p>
          </div>
        </div>

        {/* Urgências Pendentes */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Urgências & Combustível</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-3xl font-black text-white">{stats.totalUrgencies}</h4>
            <p className="text-xs text-amber-400 font-semibold mt-1">
              {stats.totalUrgencies > 0 ? '⚠️ Pedidos Pendentes de Triagem' : '✓ Tudo em Dia no Campo'}
            </p>
          </div>
        </div>

        {/* Verba Alocada Total */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cota Fatiada (Caixa)</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-2xl font-black text-white">R$ {stats.totalAllocatedBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
            <p className="text-xs text-purple-400 font-semibold mt-1">Recursos Alocados para Lideranças</p>
          </div>
        </div>
      </div>
    </div>
  );
};
