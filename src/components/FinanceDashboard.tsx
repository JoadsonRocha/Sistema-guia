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
  ShieldCheck,
  X,
  FileText,
  CheckCircle2,
  Trash2,
  Edit3,
  AlertTriangle,
  Printer,
  Calendar,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  origin?: string; // Origin of income
  purpose?: string; // Purpose of allocation/expense
  receiptStatus?: 'pendente' | 'assinado';
  signedReceiptUrl?: string;
}

const fmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function FinanceDashboard({ isNested = false }: { isNested?: boolean }) {
  const { user, isAdmin } = useAuth();
  // --- ESTADO FINANCEIRO (ESTADO DO CAIXA FORTE) ---
  const [totalFunded, setTotalFunded] = useState(0);
  const [teams, setTeams] = useState<TeamFinance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to teams and transactions
    const unsubTeams = firestoreService.subscribeToCollection('teams', (data: any[]) => {
       setTeams(data as TeamFinance[]);
    });

    let unsubTransactions = () => {};
    if (isAdmin) {
      unsubTransactions = firestoreService.subscribeToCollection('transactions', (data: any[]) => {
        const sorted = [...data].sort((a, b) => b.date - a.date);
        setTransactions(sorted as Transaction[]);
      });
    }

    // Subscribe to global stats for totalFunded
    const unsubStats = onSnapshot(doc(db, 'stats', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.totalFunded !== undefined) {
          setTotalFunded(Number(data.totalFunded) || 0);
        }
      } else if (isAdmin) {
        // Initialize if doesn't exist
        firestoreService.setDocument('stats', 'global', { 
          totalFunded: 0,
          combustivelHoje: 0,
          combustivelSaldo: 0
        }, true);
      }
    });

    return () => {
      unsubTeams();
      unsubTransactions();
      unsubStats();
    };
  }, [user, isAdmin]);

  // Form states
  const [allocAmount, setAllocAmount] = useState('');
  const [allocQuantity, setAllocQuantity] = useState('1');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [allocPurpose, setAllocPurpose] = useState('');
  const [allocDate, setAllocDate] = useState(new Date().toISOString().split('T')[0]);

  // Derived total for allocation
  const allocTotal = useMemo(() => {
    const amt = parseFloat(allocAmount) || 0;
    const qty = parseFloat(allocQuantity) || 0;
    return amt * qty;
  }, [allocAmount, allocQuantity]);

  // Income Modal State
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeData, setIncomeData] = useState({
    amount: '',
    origin: '',
    description: '',
    id: '' 
  });

  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Receipt Modal State
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseData, setExpenseData] = useState({
    amount: '',
    description: '',
    team: ''
  });

  // --- CÁLCULOS TÉCNICOS (REATIVOS) ---
  const totalAllocated = useMemo(() => teams.reduce((acc, t) => acc + (Number(t.allocated) || 0), 0), [teams]);
  const totalSpent = useMemo(() => teams.reduce((acc, t) => acc + (Number(t.spent) || 0), 0), [teams]);
  const freeBalance = totalFunded - totalAllocated;

  // --- LÓGICA DE NEGÓCIO (BLOCO 3.2) ---

  const salvarEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return alert("Ação restrita a Administradores.");
    const val = parseFloat(incomeData.amount);
    if (isNaN(val) || val <= 0) return;

    try {
      const txId = incomeData.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const oldAmount = incomeData.id ? Number(transactions.find(t => t.id === incomeData.id)?.amount) || 0 : 0;
      
      const diff = val - oldAmount;
      const newTotal = totalFunded + diff;

      // Update global stats
      await firestoreService.setDocument('stats', 'global', { totalFunded: Number(newTotal) }, true);

      // Create/Update transaction
      await firestoreService.setDocument('transactions', txId, {
        id: txId,
        type: 'entrada',
        amount: val,
        origin: incomeData.origin,
        description: incomeData.description || 'Arrecadação de Fundo',
        date: incomeData.id ? transactions.find(t => t.id === incomeData.id)?.date : Date.now()
      });

      setIsIncomeModalOpen(false);
      setIncomeData({ amount: '', origin: '', description: '', id: '' });
    } catch (err: any) {
      alert("Erro ao salvar entrada: " + err.message);
    }
  };

  const ajeitarSaldoEquipe = async (teamName: string, amountDiff: number, field: 'allocated' | 'spent') => {
    const team = teams.find(t => t.name === teamName);
    if (!team) return;
    const teamId = team.id || team.name.replace(/\s/g, '_').toLowerCase();
    
    const currentValue = Number(team[field]) || 0;
    await firestoreService.updateDocument('teams', teamId, {
      [field]: Math.max(0, currentValue + amountDiff)
    });
  };

  const deletarTransacao = async (tx: Transaction) => {
    if (!isAdmin) return;
    if (!window.confirm(`Deseja realmente excluir esta movimentação de ${fmt.format(tx.amount)}?`)) return;

    try {
      if (tx.type === 'entrada') {
        const newTotal = totalFunded - Number(tx.amount);
        await firestoreService.setDocument('stats', 'global', { totalFunded: Number(newTotal) }, true);
      } else if (tx.type === 'alocacao' || tx.type === 'gasto') {
        const field = tx.type === 'alocacao' ? 'allocated' : 'spent';
        await ajeitarSaldoEquipe(tx.team || '', -Number(tx.amount), field);
      }

      await firestoreService.deleteDocument('transactions', tx.id);
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const prepararEdicao = (tx: Transaction) => {
    if (tx.type === 'entrada') {
      setIncomeData({
         amount: String(tx.amount),
         origin: tx.origin || '',
         description: tx.description || '',
         id: tx.id
      });
      setIsIncomeModalOpen(true);
    } else if (tx.type === 'alocacao') {
      setSelectedTeam(tx.team || '');
      setAllocAmount(String(tx.amount));
      setAllocQuantity('1');
      setAllocPurpose(tx.purpose || '');
      setAllocDate(new Date(tx.date).toISOString().split('T')[0]);
      setEditingTransaction(tx);
      // Scroll to allocation section
      window.scrollTo({ top: 400, behavior: 'smooth' });
    } else if (tx.type === 'gasto') {
      setExpenseData({
        amount: String(tx.amount),
        description: tx.description || '',
        team: tx.team || ''
      });
      setEditingTransaction(tx);
      setIsExpenseModalOpen(true);
    }
  };

  const alocarParaEquipe = async () => {
    if (!isAdmin) return alert("Ação restrita a Administradores.");
    const valTotal = allocTotal;
    if (valTotal <= 0) return;

    const oldAmount = editingTransaction?.type === 'alocacao' ? Number(editingTransaction.amount) : 0;
    
    if (valTotal - oldAmount > freeBalance + 0.01) { 
      alert("ERRO: Saldo Livre insuficiente no Caixa Forte para esta alocação.");
      return;
    }

    const teamName = selectedTeam || editingTransaction?.team;
    const team = teams.find(t => t.name === teamName);
    if (!team) return;

    try {
      // Adjustment logic: subtract old, add new
      const teamId = team.id || team.name.replace(/\s/g, '_').toLowerCase();
      await firestoreService.updateDocument('teams', teamId, {
        allocated: Math.max(0, (Number(team.allocated) || 0) - oldAmount + valTotal)
      });

      const txId = editingTransaction?.id || `tx_alloc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await firestoreService.setDocument('transactions', txId, {
        id: txId,
        type: 'alocacao',
        amount: valTotal,
        team: teamName,
        description: `Alocação (${allocQuantity}x): ${teamName}`,
        purpose: allocPurpose,
        date: editingTransaction ? editingTransaction.date : new Date(allocDate).getTime(),
        receiptStatus: editingTransaction?.receiptStatus || 'pendente'
      });
      
      setAllocAmount('');
      setAllocQuantity('1');
      setAllocPurpose('');
      setEditingTransaction(null);
      alert(editingTransaction ? "Alocação atualizada!" : "Recurso fatiado com sucesso!");
    } catch (err: any) {
      alert("Erro ao processar alocação: " + err.message);
    }
  };

  const zerarFinanceiro = async () => {
    if (!isAdmin) return;
    if (window.confirm("CUIDADO: Deseja realmente ZERAR todo o financeiro? Isso apagará arrecadações, alocações e transações para começar do zero com dados REAIS.")) {
      try {
        await firestoreService.setDocument('stats', 'global', { 
           totalFunded: 0,
           combustivelHoje: 0,
           combustivelSaldo: 0
        }, true);
        
        // Limpar transações
        const txs = await firestoreService.getCollection<any>('transactions');
        for (const tx of txs) {
          await firestoreService.deleteDocument('transactions', tx.id);
        }
        
        // Resetar equipes
        for (const team of teams) {
          await firestoreService.updateDocument('teams', team.id || team.name.replace(/\s/g, '_').toLowerCase(), {
            allocated: 0,
            spent: 0
          });
        }
        
        alert("Financeiro limpo com sucesso! Pronto para inserção de dados reais.");
      } catch (err: any) {
        alert("Erro ao limpar dados: " + err.message);
      }
    }
  };

  const handleRegistrarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return alert("Ação restrita a Administradores.");
    
    const val = parseFloat(expenseData.amount);
    if (isNaN(val) || val <= 0) return;
    
    const teamName = expenseData.team || editingTransaction?.team;
    const team = teams.find(t => t.name === teamName);
    if (!team) return;
    
    const oldAmount = editingTransaction?.type === 'gasto' ? Number(editingTransaction.amount) : 0;
    
    const teamAllocated = Number(team.allocated) || 0;
    const teamSpent = Number(team.spent) || 0;
    const balance = teamAllocated - (teamSpent - oldAmount);
    
    if (balance < val - 0.01) { 
      alert(`BLOQUEIO: Equipe ${teamName} não tem saldo suficiente. Saldo disponível: ${fmt.format(balance)}`);
      return;
    }

    try {
      const teamId = team.id || team.name.replace(/\s/g, '_').toLowerCase();
      await firestoreService.updateDocument('teams', teamId, {
        spent: Math.max(0, teamSpent - oldAmount + val)
      });

      const txId = editingTransaction?.id || `tx_spent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await firestoreService.setDocument('transactions', txId, {
        id: txId,
        type: 'gasto',
        amount: val,
        team: teamName,
        description: expenseData.description,
        date: editingTransaction ? editingTransaction.date : Date.now()
      });

      setIsExpenseModalOpen(false);
      setExpenseData({ amount: '', description: '', team: '' });
      setEditingTransaction(null);
      alert(editingTransaction ? "Gasto atualizado!" : "Gasto registrado com sucesso!");
    } catch (err: any) {
      alert("Erro ao processar gasto: " + err.message);
    }
  };

  return (
    <div className={`min-h-screen font-sans pb-24 overflow-x-hidden ${isNested ? 'bg-transparent' : 'bg-zinc-50'}`}>
      
      {/* HEADER FINANCEIRO (ONLY IF NOT NESTED) */}
      {!isNested && (
        <header className="bg-white border-b border-zinc-200 p-5 sticky top-0 z-50 shadow-sm">
          <div className="flex justify-between items-center max-w-7xl mx-auto px-4 md:px-8">
            <div>
              <h1 className="text-lg font-black uppercase text-zinc-950 tracking-tighter flex items-center gap-3 leading-none">
                Gestão Financeira
              </h1>
              <p className="text-[9px] font-black text-zinc-400 uppercase mt-1 tracking-widest leading-none">Auditoria e Distribuição de Recursos</p>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button 
                  onClick={zerarFinanceiro}
                  className="bg-red-50 text-red-600 px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                >
                  Hard Reset
                </button>
              )}
              <div className="bg-zinc-950 px-5 py-2.5 rounded-lg border border-zinc-900 text-left">
                 <p className="text-[8px] font-black text-zinc-500 uppercase leading-none tracking-widest mb-1">Status do Sistema</p>
                 <p className="text-[9px] text-green-500 font-black uppercase tracking-widest flex items-center gap-2">
                   <ShieldCheck className="w-3 h-3" /> Blindagem Ativa
                 </p>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* CARDS SUPERIORES - VISÃO GERAL */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 ${isNested ? '' : 'px-4 md:px-8 max-w-7xl mx-auto'}`}>
        <div className="bg-zinc-950 text-white p-6 rounded-2xl border border-zinc-900 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 p-6 opacity-10 group-hover:opacity-20 transition-all duration-700">
            <TrendingUp className="w-20 h-20 text-yellow-500" />
          </div>
          <div className="relative z-10">
            <div className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-1 bg-yellow-500 rounded-full" /> Arrecadação 
            </div>
            <p className="text-[12px] sm:text-[14px] font-black text-white mt-3 tracking-tighter leading-none truncate" title={fmt.format(totalFunded)}>
              {fmt.format(totalFunded)}
            </p>
            <div className="mt-5">
              <button 
                onClick={() => {
                  setIncomeData({ amount: '', origin: '', description: '', id: '' });
                  setIsIncomeModalOpen(true);
                }} 
                className="w-full bg-yellow-500 text-zinc-950 p-2.5 rounded-xl shadow-lg transition-all font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Injetar Recurso
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-all duration-700 rotate-12">
            <Users className="w-20 h-20 text-zinc-900" />
          </div>
          <div className="relative z-10">
            <div className="text-[7px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-1 bg-zinc-400 rounded-full" /> Total Alocado
            </div>
            <p className="text-[12px] sm:text-[14px] font-black text-zinc-900 mt-3 tracking-tighter leading-none truncate" title={fmt.format(totalAllocated)}>
              {fmt.format(totalAllocated)}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-[7px] text-zinc-400 uppercase font-black tracking-widest">Frentes: {teams.length}</span>
            <div className="flex -space-x-1.5">
              {[1, 2].map(i => (
                <div key={i} className="w-4 h-4 rounded-full border border-white bg-zinc-100 flex items-center justify-center text-[6px] font-black text-zinc-400">{i}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-all duration-700 -rotate-12">
             <ArrowDownRight className="w-20 h-20 text-red-500" />
          </div>
          <div className="relative z-10">
            <div className="text-[7px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-1 bg-red-500 rounded-full" /> Executado
            </div>
            <p className="text-[12px] sm:text-[14px] font-black text-red-600 mt-3 tracking-tighter leading-none truncate" title={fmt.format(totalSpent)}>
              {fmt.format(totalSpent)}
            </p>
          </div>
          <div className="mt-6">
            <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
               <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((totalSpent/totalAllocated)*100 || 0, 100)}%` }} />
            </div>
            <p className="text-[6px] font-black text-zinc-400 uppercase tracking-widest mt-1.5">Queima: {((totalSpent/totalAllocated)*100 || 0).toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-yellow-500 p-6 rounded-2xl relative overflow-hidden shadow-lg flex flex-col justify-between group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Wallet className="w-20 h-20 text-zinc-950" />
          </div>
          <div className="relative z-10">
            <div className="text-[7px] font-black text-zinc-950/60 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-1 bg-zinc-950/40 rounded-full" /> Saldo em Vault
            </div>
            <p className="text-[12px] sm:text-[14px] font-black text-zinc-950 mt-3 tracking-tighter leading-none truncate" title={fmt.format(freeBalance)}>
              {fmt.format(freeBalance)}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-zinc-950/10 pt-3">
            <span className="text-[6px] text-zinc-950/60 uppercase tracking-widest font-black">Operação Especial</span>
            <ShieldCheck className="w-2.5 h-2.5 text-zinc-950/40" />
          </div>
        </div>
      </div>

      <div className={`mt-8 ${isNested ? '' : 'px-4 md:px-8 max-w-7xl mx-auto'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MÓDULO DE FATIAMENTO E EQUIPES (ESQUERDA - 2 COLUNAS) */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-zinc-950 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden group border border-zinc-900">
              <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-1/2 -translate-y-1/2">
                <ArrowUpRight className="w-56 h-56" />
              </div>
              <h2 className="text-lg font-black uppercase text-white mb-6 flex items-center gap-3 tracking-tighter leading-none italic">
                <span className="p-2 bg-yellow-500 rounded-xl shadow-lg shadow-yellow-500/20 inline-flex items-center justify-center"><DollarSign className="text-zinc-950 w-5 h-5" /></span>
                Fatiamento Estratégico
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Frente de Atuação</label>
                  <select 
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 font-black text-[10px] text-white outline-none focus:border-yellow-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Selecione a equipe...</option>
                    {teams.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Valor Unitário (R$)</label>
                  <input 
                    type="number" 
                    value={allocAmount}
                    onChange={(e) => setAllocAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 font-black text-sm text-white outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Quantidade</label>
                  <input 
                    type="number" 
                    value={allocQuantity}
                    onChange={(e) => setAllocQuantity(e.target.value)}
                    placeholder="1"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 font-black text-sm text-white outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-700"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-2 space-y-1.5">
                  <label className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Objetivo Estratégico</label>
                  <input 
                    type="text" 
                    value={allocPurpose}
                    onChange={(e) => setAllocPurpose(e.target.value)}
                    placeholder="Ex: Operação Logística..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 font-bold text-[10px] text-white outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-700"
                  />
                </div>
                <div className="flex flex-col justify-end">
                   <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex justify-between items-center h-[48px] shadow-inner">
                      <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Alocação Total</span>
                      <span className="text-sm font-black text-yellow-500 tracking-tighter">{fmt.format(allocTotal)}</span>
                   </div>
                </div>
                <div className="sm:col-span-2 lg:col-span-3 mt-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={alocarParaEquipe}
                      className="flex-1 bg-yellow-500 text-zinc-950 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-yellow-500/10 hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                    >
                      {editingTransaction ? 'ATUALIZAR ALOCAÇÃO' : 'EFETIVAR ALOCAÇÃO'} <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </button>
                    {editingTransaction && (
                      <button 
                        onClick={() => {
                          setEditingTransaction(null);
                          setAllocAmount('');
                          setAllocPurpose('');
                        }}
                        className="bg-zinc-800 text-white px-4 rounded-xl hover:bg-zinc-700 transition-all font-black text-[9px] uppercase"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-black uppercase text-zinc-900 tracking-tighter flex items-center gap-3 leading-none italic">
                  Controle por Frente
                </h2>
                <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                   {teams.length} Unidades
                </div>
              </div>
              
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
                      className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:border-zinc-300 transition-all group"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${balance > 100 ? 'bg-green-500' : 'bg-red-500'}`} />
                          <h3 className="font-black text-zinc-950 text-sm uppercase tracking-tighter italic leading-none">{team.name}</h3>
                        </div>
                        <button 
                          onClick={() => {
                            setExpenseData({ ...expenseData, team: team.name });
                            setIsExpenseModalOpen(true);
                          }}
                          className="bg-zinc-950 text-white p-2 rounded-xl hover:bg-yellow-500 hover:text-zinc-950 transition-all shadow-lg active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div>
                          <p className="text-[6px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">Alocado</p>
                          <p className="font-black text-zinc-900 text-[9px] tracking-tight">{fmt.format(team.allocated)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[6px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">Gasto</p>
                          <p className="font-black text-red-600 text-[9px] tracking-tight">{fmt.format(team.spent)}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-widest px-1">
                          <span className="text-zinc-500">Saldo Operacional</span>
                          <span className={balance < 1000 ? "text-red-600 animate-pulse" : "text-zinc-950"}>{fmt.format(balance)}</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(usagePercent, 100)}%` }}
                            className={`h-full rounded-full ${barColor} shadow-sm`}
                          />
                        </div>
                        <div className="text-[6px] text-zinc-400 font-bold text-right px-1 uppercase tracking-widest">
                           {usagePercent.toFixed(1)}% Consumido
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* COLUNA DE TRANSAÇÕES (DIREITA - 1 COLUNA) */}
          <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full lg:max-h-[900px]">
            <div className="bg-zinc-950 p-5 border-b border-zinc-900">
              <h2 className="text-base font-black uppercase tracking-tighter text-white flex items-center gap-2 italic">
                <History className="w-4 h-4 text-yellow-500" /> Auditoria
              </h2>
              <p className="text-[8px] font-black text-zinc-500 uppercase mt-1 tracking-widest">Logs de Transações Digitais</p>
            </div>
            <div className="divide-y divide-zinc-100 overflow-y-auto flex-1 custom-scrollbar">
              {transactions.length > 0 ? transactions.map(t => (
                <div key={t.id} className="p-3.5 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${
                      t.type === 'entrada' ? 'bg-green-50 text-green-600' : 
                      t.type === 'alocacao' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {t.type === 'entrada' ? <TrendingUp className="w-3.5 h-3.5" /> : 
                      t.type === 'alocacao' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[9px] font-black uppercase text-zinc-950 truncate leading-none" title={t.description}>
                        {t.description}
                      </h4>
                      <p className="text-[7px] font-bold text-zinc-400 mt-1 uppercase truncate" title={t.origin || t.purpose || 'DIRETO'}>
                        {t.origin || t.purpose || 'DIRETO'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 px-1 min-w-[80px]">
                    <p className={`font-black tracking-tighter text-[10px] whitespace-nowrap ${
                      t.type === 'entrada' ? 'text-green-600' : 
                      t.type === 'alocacao' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {t.type === 'entrada' ? '+' : '-'} {fmt.format(t.amount)}
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => prepararEdicao(t)}
                        className="p-1.5 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-950 hover:text-white transition-all shadow-sm"
                        title="Editar"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      {t.type === 'alocacao' && (
                        <button 
                          onClick={() => {
                            setSelectedReceiptTx(t);
                            setIsReceiptModalOpen(true);
                          }}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Ver Recibo"
                        >
                          <FileText className="w-3 h-3" />
                        </button>
                      )}
                      <button 
                        onClick={() => deletarTransacao(t)}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        title="Excluir"
                      >
                         <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-6 text-center text-zinc-300 uppercase text-[8px] font-black italic tracking-widest">Sem movimentos registrados</div>
              )}
            </div>
          </section>
        </div>
      </div>
    
      {/* MODAL: NOVO GASTO */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="bg-zinc-950 p-6">
                <div className={`${editingTransaction ? 'bg-zinc-800' : 'bg-red-500'} w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-red-500/20`}>
                  {editingTransaction ? <Edit3 className="text-white w-5 h-5" /> : <ArrowDownRight className="text-zinc-950 w-5 h-5" />}
                </div>
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none italic">
                  {editingTransaction ? 'Editar Despesa' : 'Lançar Despesa'}
                </h2>
                <p className="text-zinc-500 text-[8px] font-black mt-2 uppercase tracking-widest">Unidade: {expenseData.team || editingTransaction?.team}</p>
              </div>

              <form onSubmit={handleRegistrarGasto} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Finalidade</label>
                  <input 
                    required
                    type="text" 
                    value={expenseData.description}
                    onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
                    placeholder="Ex: Combustível, Alimentação..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-950 outline-none focus:border-red-500 transition-all placeholder:text-zinc-300"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                  <input 
                    required
                    type="number" 
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})}
                    placeholder="0,00"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-xl text-zinc-950 outline-none focus:border-red-500 transition-all placeholder:text-zinc-300"
                  />
                </div>
                
                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/10 hover:bg-zinc-950 transition-all active:translate-y-0.5"
                  >
                    Confirmar Saída
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: NOVA ENTRADA / FUNDO */}
      <AnimatePresence>
        {isIncomeModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsIncomeModalOpen(false)}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="bg-zinc-950 p-6">
                <div className={`${incomeData.id ? 'bg-zinc-800' : 'bg-green-500'} w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/20`}>
                  {incomeData.id ? <Edit3 className="text-white w-5 h-5" /> : <TrendingUp className="text-zinc-950 w-5 h-5" />}
                </div>
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none italic">
                  {incomeData.id ? 'Editar Capital' : 'Injetar Capital'}
                </h2>
                <p className="text-zinc-500 text-[8px] font-black mt-2 uppercase tracking-widest leading-none">Alimentação da Vault</p>
              </div>

              <form onSubmit={salvarEntrada} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Origem do Ativo</label>
                  <input 
                    required 
                    type="text" 
                    value={incomeData.origin} 
                    onChange={e => setIncomeData({...incomeData, origin: e.target.value})} 
                    placeholder="Ex: Fundo Partidário..." 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-950 outline-none focus:border-green-500 transition-all placeholder:text-zinc-300" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Valor Bruto (R$)</label>
                  <input 
                    required 
                    type="number" 
                    value={incomeData.amount} 
                    onChange={e => setIncomeData({...incomeData, amount: e.target.value})} 
                    placeholder="0,00" 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-xl text-zinc-950 outline-none focus:border-green-500 transition-all placeholder:text-zinc-300" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Observações</label>
                  <textarea 
                    value={incomeData.description} 
                    onChange={e => setIncomeData({...incomeData, description: e.target.value})} 
                    placeholder="Detalhes..." 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-bold text-[10px] text-zinc-950 h-24 outline-none focus:border-green-500 transition-all placeholder:text-zinc-300 resize-none"
                  ></textarea>
                </div>
                
                <div className="pt-2">
                  <button 
                    type="submit" 
                    className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/10 hover:bg-zinc-950 transition-all active:translate-y-0.5"
                  >
                    Efetivar Entrada
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: RECIBO DE ALOCAÇÃO */}
      <AnimatePresence>
        {isReceiptModalOpen && selectedReceiptTx && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-xl p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl relative p-8 lg:p-12 text-zinc-950 border border-zinc-200"
            >
              <button 
                onClick={() => setIsReceiptModalOpen(false)}
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all print:hidden active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border border-zinc-100 p-6 lg:p-10 rounded-2xl space-y-8 relative">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-3">
                      <div className="bg-zinc-950 p-2 rounded-xl">
                        <ShieldCheck className="text-yellow-500 w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-xl leading-none tracking-tighter italic">SISTEMA ÁGUIA</h3>
                        <p className="text-[8px] font-black text-zinc-400 uppercase mt-1 tracking-widest">Digital Certificate</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest leading-none mb-1">Doc Code</p>
                      <p className="font-mono text-[10px] font-black bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100 italic">
                        {selectedReceiptTx.id?.split('_').pop()?.toUpperCase() || 'N/A'}
                      </p>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-zinc-50 p-6 lg:p-8 rounded-xl border border-zinc-100 relative overflow-hidden group">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-4 border-b border-zinc-200 pb-1 inline-block italic">Alocação</p>
                      <div className="flex justify-between items-end relative z-10">
                         <div>
                            <p className="text-2xl font-black tracking-tighter uppercase italic">{selectedReceiptTx.team}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                               <p className="text-[10px] font-bold text-zinc-500">Motivo: {selectedReceiptTx.purpose || 'Operacional'}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">Valor Transferido</p>
                            <p className="text-3xl font-black text-zinc-950 tracking-tighter italic">{fmt.format(selectedReceiptTx.amount)}</p>
                         </div>
                      </div>
                   </div>

                   <p className="text-xs font-bold leading-relaxed text-zinc-500 text-justify">
                      Eu, líder da equipe regional <span className="text-zinc-950">{selectedReceiptTx.team}</span>, declaro formalmente ter recebido nesta data ({new Date(selectedReceiptTx.date).toLocaleDateString('pt-BR')}) a importância acima discriminada para execução das atividades operacionais. Comprometo-me a realizar a prestação de contas integral conforme os protocolos de segurança e integridade do comando central.
                   </p>

                   <div className="pt-8 grid grid-cols-2 gap-8">
                      <div className="text-center">
                         <div className="border-t border-zinc-200 pt-4">
                            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Coordenação Central</p>
                            <p className="font-black text-[10px] text-zinc-950 uppercase tracking-widest italic">Autenticado</p>
                         </div>
                      </div>
                      <div className="text-center">
                         <div className="border-t border-zinc-200 pt-4">
                            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Responsável Regional</p>
                            {selectedReceiptTx.receiptStatus === 'assinado' ? (
                              <p className="text-green-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 italic">
                                <CheckCircle2 className="w-3 h-3" /> Assinado
                              </p>
                            ) : (
                              <p className="text-zinc-300 font-black text-[10px] italic uppercase tracking-widest">Pendente</p>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 print:hidden">
                 <button 
                   onClick={() => window.print()}
                   className="flex items-center gap-2 bg-zinc-50 text-zinc-600 px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-zinc-100 transition-all border border-zinc-100 shadow-sm"
                 >
                   <FileText className="w-3.5 h-3.5" /> Exportar
                 </button>
                 <button 
                   onClick={() => setIsReceiptModalOpen(false)}
                   className="bg-zinc-950 text-white px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-950/10"
                 >
                   Fechar
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
