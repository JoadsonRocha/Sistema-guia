/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  History, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  PiggyBank,
  Users,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firestoreService } from '../lib/firestoreService';
import { useAuth } from '../lib/FirebaseProvider';

interface TeamFinance {
  id?: string;
  name: string;
  allocated: number;
  spent: number;
}

interface Transaction {
  id: string;
  type: 'entrada' | 'alocacao' | 'gasto';
  amount: number;
  description: string;
  team?: string;
  date: number;
}

const fmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function FinanceDashboard({ isNested = false }: { isNested?: boolean }) {
  const { user, isAdmin } = useAuth();
  // --- ESTADO FINANCEIRO (ESTADO DO CAIXA FORTE) ---
  const [totalFunded, setTotalFunded] = useState(500000);
  const [teams, setTeams] = useState<TeamFinance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to teams and transactions
    const unsubTeams = firestoreService.subscribeToCollection('teams', (data: any[]) => {
       // Filter or map if necessary
       setTeams(data as TeamFinance[]);
    });

    const unsubTransactions = firestoreService.subscribeToCollection('transactions', (data: any[]) => {
      // Sort by date desc
      const sorted = [...data].sort((a, b) => b.date - a.date);
      setTransactions(sorted as Transaction[]);
    });

    const fetchGlobalStats = async () => {
      const stats = await firestoreService.getDocument('stats', 'global');
      if (stats && stats.totalFunded) {
        setTotalFunded(stats.totalFunded);
      }
    };
    fetchGlobalStats();

    return () => {
      unsubTeams();
      unsubTransactions();
    };
  }, [user]);

  // Form states
  const [allocAmount, setAllocAmount] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(teams[0].name);
  const [fundAmount, setFundAmount] = useState('');

  // --- CÁLCULOS TÉCNICOS (REATIVOS) ---
  const totalAllocated = useMemo(() => teams.reduce((acc, t) => acc + t.allocated, 0), [teams]);
  const freeBalance = totalFunded - totalAllocated;

  // --- LÓGICA DE NEGÓCIO (BLOCO 3.2) ---

  const adicionarFundos = async () => {
    if (!isAdmin) return alert("Ação restrita a Administradores.");
    const val = parseFloat(fundAmount);
    if (isNaN(val) || val <= 0) return;

    const newTotal = totalFunded + val;
    setTotalFunded(newTotal);
    
    // Update global stats
    await firestoreService.updateDocument('stats', 'global', { totalFunded: newTotal });

    // Create transaction
    const txId = Math.random().toString(36).substr(2, 9);
    await firestoreService.setDocument('transactions', txId, {
      type: 'entrada',
      amount: val,
      description: 'Nova Arrecadação / Fundo',
      date: Date.now()
    });
    
    setFundAmount('');
  };

  const alocarParaEquipa = async () => {
    if (!isAdmin) return alert("Ação restrita a Administradores.");
    const val = parseFloat(allocAmount);
    if (isNaN(val) || val <= 0) return;
    if (val > freeBalance) {
      alert("ERRO: Saldo Livre insuficiente no Caixa Forte para esta alocação.");
      return;
    }

    const team = teams.find(t => t.name === selectedTeam);
    if (!team) return;

    await firestoreService.updateDocument('teams', team.id || team.name.replace(/\s/g, '_'), {
      allocated: team.allocated + val
    });

    const txId = Math.random().toString(36).substr(2, 9);
    await firestoreService.setDocument('transactions', txId, {
      type: 'alocacao',
      amount: val,
      team: selectedTeam,
      description: `Alocação de Cota: ${selectedTeam}`,
      date: Date.now()
    });
    
    setAllocAmount('');
  };

  const registrarGastoSimulado = async (teamName: string) => {
    if (!isAdmin) return alert("Ação restrita a Administradores.");
    const val = 500; // Simulação de gasto fixo (combustível)
    const team = teams.find(t => t.name === teamName);
    if (!team || (team.allocated - team.spent) < val) {
      alert(`BLOQUEIO: Equipe ${teamName} atingiu o teto semanal. Vales travados.`);
      return;
    }

    await firestoreService.updateDocument('teams', team.id || team.name.replace(/\s/g, '_'), {
      spent: team.spent + val
    });

    const txId = Math.random().toString(36).substr(2, 9);
    await firestoreService.setDocument('transactions', txId, {
      type: 'gasto',
      amount: val,
      team: teamName,
      description: `Gasto: Combustível (Vale Digital)`,
      date: Date.now()
    });
  };

  return (
    <div className={`min-h-screen font-sans pb-10 overflow-x-hidden ${isNested ? 'bg-transparent' : 'bg-zinc-50'}`}>
      
      {/* HEADER FINANCEIRO (ONLY IF NOT NESTED) */}
      {!isNested && (
        <header className="bg-zinc-950 text-white p-6 shadow-xl border-b-4 border-green-500 sticky top-0 z-50">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <PiggyBank className="text-green-500 w-8 h-8" />
              CAIXA FORTE <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded hidden sm:inline">BLOCO 3.2</span>
            </h1>
            <div className="bg-zinc-800 p-2 rounded-lg text-right">
               <p className="text-[10px] font-black text-zinc-400 uppercase leading-none">Status de Auditoria</p>
               <p className="text-[10px] text-green-400 font-bold">CONCILIADO</p>
            </div>
          </div>
        </header>
      )}

      {/* CARDS SUPERIORES - VISÃO GERAL */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 ${isNested ? '' : 'px-4 md:px-8 max-w-7xl mx-auto'}`}>
        <div className="bg-zinc-900 text-white p-4 rounded-2xl border border-zinc-800 shadow-xl">
          <p className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-500" /> Total Arrecadado
          </p>
          <p className="text-xl font-black text-white mt-1">{fmt.format(totalFunded)}</p>
          <div className="mt-4 flex gap-2">
            <input 
              type="number" 
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              placeholder="Adicionar Fundo"
              className="bg-zinc-800 text-xs p-2 rounded-lg w-full outline-none focus:ring-1 ring-green-500"
            />
            <button onClick={adicionarFundos} className="bg-green-600 p-2 rounded-lg"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border-2 border-zinc-200 shadow-sm">
          <p className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-1">
            <Plus className="w-3 h-3 text-blue-500" /> Total Alocado (Fatiado)
          </p>
          <p className="text-xl font-black text-zinc-900 mt-1">{fmt.format(totalAllocated)}</p>
          <p className="text-[10px] text-zinc-400 mt-1">Recursos distribuídos entre {teams.length} equipes.</p>
        </div>
        <div className="bg-zinc-950 p-4 rounded-2xl border-4 border-green-500 relative overflow-hidden shadow-2xl">
          <div className="absolute -right-2 -top-2 opacity-10"><Wallet className="w-16 h-16 text-white" /></div>
          <p className="text-[10px] font-black text-green-500 uppercase">Saldo Livre (Em Caixa)</p>
          <p className="text-2xl font-black text-white mt-1">{fmt.format(freeBalance)}</p>
          <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-black flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Blindado
          </p>
        </div>
      </div>

      <div className={`mt-6 ${isNested ? '' : 'p-4 md:p-8 max-w-7xl mx-auto'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MÓDULO DE FATIAMENTO E EQUIPES (ESQUERDA - 2 COLUNAS) */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white border-2 border-zinc-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-black uppercase text-zinc-800 mb-4 flex items-center gap-2">
                <ArrowUpRight className="text-blue-600" /> Fatiamento de Recursos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">Equipe Regional</label>
                  <select 
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full bg-zinc-100 border-2 border-zinc-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-blue-500"
                  >
                    {teams.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">Valor da Cota (R$)</label>
                  <input 
                    type="number" 
                    value={allocAmount}
                    onChange={(e) => setAllocAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-zinc-100 border-2 border-zinc-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={alocarParaEquipa}
                    className="w-full bg-blue-600 text-white p-3 py-4 rounded-xl font-black text-xs uppercase shadow-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
                  >
                    Transferir Cota
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase text-zinc-800 flex items-center gap-2">
                <Users className="text-zinc-400" /> Saldos das Equipes Regionais
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teams.map((team, idx) => {
                  const balance = team.allocated - team.spent;
                  const usagePercent = (team.spent / team.allocated) * 100;
                  let barColor = "bg-green-500";
                  if (usagePercent > 70) barColor = "bg-yellow-500";
                  if (usagePercent > 90) barColor = "bg-red-600";

                  return (
                    <motion.div 
                      key={idx}
                      className="bg-white border-2 border-zinc-200 rounded-2xl p-4 shadow-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-black text-zinc-900 uppercase tracking-tight">{team.name}</h3>
                        <button 
                          onClick={() => registrarGastoSimulado(team.name)}
                          className="text-[9px] font-black bg-zinc-100 text-zinc-500 px-2 py-1 rounded hover:bg-zinc-200"
                        >
                          SIMULAR GASTO
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div>
                          <p className="text-[9px] font-black text-zinc-400 uppercase">Cota Recebida</p>
                          <p className="font-black text-zinc-800 text-sm">{fmt.format(team.allocated)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-zinc-400 uppercase">Gasto Executado</p>
                          <p className="font-black text-red-600 text-sm">{fmt.format(team.spent)}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                          <span className="text-zinc-500">Saldo Restante</span>
                          <span className={balance < 1000 ? "text-red-600" : "text-zinc-800"}>{fmt.format(balance)}</span>
                        </div>
                        <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(usagePercent, 100)}%` }}
                            className={`h-full ${barColor}`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* COLUNA DE TRANSAÇÕES (DIREITA - 1 COLUNA) */}
          <section className="bg-zinc-900 text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full lg:max-h-[800px]">
            <div className="bg-zinc-800 p-4 border-b border-zinc-700 flex justify-between items-center">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-400" /> Registro de Atividades
              </h2>
            </div>
            <div className="divide-y divide-zinc-800 overflow-y-auto flex-1 custom-scrollbar">
              {transactions.map(t => (
                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      t.type === 'entrada' ? 'bg-green-900/50 text-green-500' : 
                      t.type === 'alocacao' ? 'bg-blue-900/50 text-blue-400' : 'bg-red-900/50 text-red-500'
                    }`}>
                      {t.type === 'entrada' ? <TrendingUp className="w-4 h-4" /> : 
                      t.type === 'alocacao' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-black tracking-tight">{t.description}</h4>
                      <p className="text-[10px] text-zinc-500">{new Date(t.date).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black tracking-tighter text-xs ${
                      t.type === 'entrada' ? 'text-green-500' : 
                      t.type === 'alocacao' ? 'text-blue-400' : 'text-red-500'
                    }`}>
                      {t.type === 'entrada' ? '+' : '-'} {fmt.format(t.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-max px-4 py-3 bg-zinc-950 text-white rounded-full shadow-2xl border border-zinc-800 flex items-center gap-4 z-[100]">
         <div className="flex items-center gap-2 pr-4 border-r border-zinc-800">
           <ShieldCheck className="text-green-500 w-4 h-4" />
           <span className="text-[10px] font-black uppercase">Blindagem Ativa</span>
         </div>
         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
           Roraima 2026 • Auditoria em Tempo Real
         </p>
      </div>

    </div>
  );
}
