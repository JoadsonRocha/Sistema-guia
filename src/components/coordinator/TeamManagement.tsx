import React, { useState } from 'react';
import { Users, Plus, MapPin, DollarSign, Award, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Team {
  id: string;
  name: string;
  leaderName: string;
  region: string;
  voterCount: number;
  allocatedBudget: number;
  spentBudget: number;
}

interface TeamManagementProps {
  teams: Team[];
  onAddTeam?: () => void;
  onAllocateBudget?: (teamId: string, amount: number) => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  teams,
  onAddTeam,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.leaderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>Gestão de Equipes & Lideranças</span>
          </h3>
          <p className="text-xs text-zinc-400">Monitore o desempenho por base regional e distribua recursos.</p>
        </div>

        <button
          onClick={onAddTeam}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Equipe</span>
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por equipe, líder ou região..."
          className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all"
        />
      </div>

      {/* Lista de Equipes em Cards Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((team) => (
          <motion.div
            key={team.id}
            whileHover={{ y: -2 }}
            className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 p-5 rounded-2xl space-y-4 shadow-md backdrop-blur-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                  {team.region}
                </span>
                <h4 className="text-lg font-extrabold text-white mt-1">{team.name}</h4>
                <p className="text-xs text-zinc-400 font-medium">Líder: <strong className="text-zinc-200">{team.leaderName}</strong></p>
              </div>
              <div className="p-2 bg-zinc-800 rounded-xl text-zinc-400">
                <MapPin className="w-4 h-4" />
              </div>
            </div>

            {/* Métricas Internas da Equipe */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/50">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Eleitores Cadastrados</span>
                <p className="text-base font-black text-white mt-0.5">{team.voterCount}</p>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/50">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Verba Alocada</span>
                <p className="text-base font-black text-emerald-400 mt-0.5">
                  R$ {team.allocatedBudget.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredTeams.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 text-sm">
            Nenhuma equipe encontrada com os critérios pesquisados.
          </div>
        )}
      </div>
    </div>
  );
};
