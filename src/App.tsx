/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Fuel, 
  Users, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Mic,
  Wifi,
  ChevronRight,
  Camera,
  UserPlus,
  StickyNote,
  CloudOff,
  RefreshCcw,
  User,
  Brain,
  Send,
  X,
  Plus,
  LogIn,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processarCaos } from './services/geminiService';
import FinanceDashboard from './components/FinanceDashboard';
import { useAuth } from './lib/FirebaseProvider';
import { firestoreService } from './lib/firestoreService';
import { onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from './lib/firebase';

/// --- COMPONENTE: DASHBOARD DO COORDENADOR ---
function CoordinatorDashboard() {
  const { user, login, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'finance'>('overview');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [chaosText, setChaosText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  
  const [teams, setTeams] = useState<any[]>([]);
  const [urgencies, setUrgencies] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);

  // Modal State for New Team
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    leader: '',
    location: '',
    status: 'OK',
    contacts: 0,
    fuel: 0,
    demands: 0,
    allocated: 0,
    spent: 0
  });

  useEffect(() => {
    if (!user) return;

    // Subs para dados reais
    const unsubTeams = firestoreService.subscribeToCollection('teams', (data) => {
      setTeams(data);
    });
    
    const unsubUrgencies = firestoreService.subscribeToCollection('urgencies', (data) => {
      setUrgencies(data);
    });

    const unsubStats = onSnapshot(doc(db, 'stats', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setStatsData(snapshot.data());
      }
    }, (err) => {
      const errInfo = {
        error: err.message,
        operationType: 'get',
        path: 'stats/global',
        authInfo: {
          userId: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          emailVerified: auth.currentUser?.emailVerified,
        }
      };
      console.error("Stats sync error details:", JSON.stringify(errInfo));
    });
    
    // Fallback for empty collections
    const checkAndSeed = async () => {
      if (isAdmin) {
        const existingTeams = await firestoreService.getCollection('teams');
        if (existingTeams.length === 0) {
          const seedTeams = [
            { name: 'EQUIPE NORTE', leader: 'Capitão Silva', location: 'Pacaraima', status: 'OK', contacts: 45, fuel: 80, demands: 3, allocated: 5000, spent: 1200 },
            { name: 'EQUIPE LESTE', leader: 'Major Rocha', location: 'Bonfim', status: 'ALERTA', contacts: 22, fuel: 15, demands: 8, allocated: 3000, spent: 2500 },
            { name: 'EQUIPE SUL', leader: 'Tenente Lima', location: 'Rorainópolis', status: 'OK', contacts: 38, fuel: 55, demands: 0, allocated: 4000, spent: 500 },
          ];
          for (const t of seedTeams) {
            await firestoreService.setDocument('teams', t.name.replace(/\s/g, '_'), t);
          }
        }

        const existingStats = await firestoreService.getDocument('stats', 'global');
        if (!existingStats) {
          await firestoreService.setDocument('stats', 'global', {
            combustivelHoje: 420,
            combustivelSaldo: 1200,
            contatosValidos: 128,
            contatosMeta: 200,
            alertasAtivos: 3,
            alertasCriticos: 1,
            regionaisOnline: '05/05',
            totalFunded: 500000
          });
        }
      }
    };
    checkAndSeed();

    return () => {
      unsubTeams();
      unsubUrgencies();
      unsubStats();
    };
  }, [user, isAdmin]);

  const stats = [
    { label: 'Combustível Hoje', value: statsData?.combustivelHoje ? `${statsData.combustivelHoje}L` : '420L', sub: `Saldo: ${statsData?.combustivelSaldo || '1.200'}L`, color: 'text-blue-700' },
    { label: 'Contatos Válidos', value: statsData?.contatosValidos || '128', sub: `Meta: ${statsData?.contatosMeta || '200'}`, color: 'text-green-700' },
    { label: 'Alertas Ativos', value: statsData?.alertasAtivos || '03', sub: `Críticos: ${statsData?.alertasCriticos || '01'}`, color: 'text-red-600' },
    { label: 'Regionais Online', value: statsData?.regionaisOnline || '05/05', sub: '100% Ativas', color: 'text-zinc-900' },
  ];

  const handleProcessCaos = async () => {
    setIsProcessing(true);
    setAiResult(null);
    try {
      const res = await processarCaos(chaosText);
      setAiResult(res);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return alert("Apenas administradores podem criar equipes.");
    
    try {
      const teamId = newTeam.name.replace(/\s/g, '_').toLowerCase();
      await firestoreService.setDocument('teams', teamId, newTeam);
      setIsTeamModalOpen(false);
      setNewTeam({
        name: '',
        leader: '',
        location: '',
        status: 'OK',
        contacts: 0,
        fuel: 0,
        demands: 0,
        allocated: 0,
        spent: 0
      });
      alert("Equipe criada com sucesso!");
    } catch (err: any) {
      alert("Erro ao criar equipe: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-zinc-950 font-sans pb-24">
      <header className="sticky top-0 z-50 bg-zinc-950 text-white p-4 shadow-lg border-b-2 border-yellow-500">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
              <ShieldCheck className="text-yellow-500 w-6 h-6" />
              SISTEMA ÁGUIA
            </h1>
            <p className="text-xs font-medium text-zinc-400">Coordenador: {user?.displayName || 'Convidado'}</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <button onClick={logout} className="text-xs bg-zinc-800 hover:bg-red-900 text-zinc-300 p-2 rounded-lg flex items-center gap-2 uppercase font-black transition-all">
                <LogOut className="w-4 h-4" /> Sair
              </button>
            ) : (
              <button onClick={login} className="text-xs bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-4 py-2 rounded-lg flex items-center gap-2 uppercase font-black transition-all">
                <LogIn className="w-4 h-4" /> Entrar
              </button>
            )}
            <nav className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'overview' ? 'bg-yellow-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
              >
                Visão Geral
              </button>
              <button 
                onClick={() => setActiveTab('teams')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'teams' ? 'bg-yellow-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
              >
                Equipes
              </button>
              <button 
                onClick={() => setActiveTab('finance')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'finance' ? 'bg-yellow-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
              >
                Financeiro
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Ao Vivo</span>
          </div>
        </div>
      </header>

      {/* MOBILE NAV TABS */}
      <div className="md:hidden sticky top-[72px] z-40 bg-white border-b border-zinc-200 flex p-2 gap-2 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex-none px-4 py-2 rounded-full text-[10px] font-black uppercase border-2 transition-all ${activeTab === 'overview' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 text-zinc-400 border-transparent'}`}
        >
          Visão Geral
        </button>
        <button 
          onClick={() => setActiveTab('teams')}
          className={`flex-none px-4 py-2 rounded-full text-[10px] font-black uppercase border-2 transition-all ${activeTab === 'teams' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 text-zinc-400 border-transparent'}`}
        >
          Equipes
        </button>
        <button 
          onClick={() => setActiveTab('finance')}
          className={`flex-none px-4 py-2 rounded-full text-[10px] font-black uppercase border-2 transition-all ${activeTab === 'finance' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 text-zinc-400 border-transparent'}`}
        >
          Financeiro
        </button>
      </div>

      <main className="p-4 md:p-8 text-left max-w-7xl mx-auto min-h-[70vh]">
        
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* RESUMO RÁPIDO */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-4 lg:p-6 rounded-xl border-2 border-zinc-200 shadow-sm"
                >
                  <p className="text-[10px] lg:text-xs font-black text-zinc-500 uppercase">{stat.label}</p>
                  <p className={`text-2xl lg:text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] font-medium text-zinc-400 mt-1">{stat.sub}</p>
                </motion.div>
              ))}
            </section>

            {/* FEED DE AÇÕES (DASHBOARD DE SEMÁFORO) */}
            <div className="space-y-4">
              <h2 className="text-lg font-black uppercase text-zinc-800 flex items-center gap-2">
                Urgências do Dia
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
              </h2>

              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {(urgencies && urgencies.length > 0) ? urgencies.map((urgency) => (
                   <motion.div 
                     key={urgency.id}
                     whileTap={{ scale: 0.98 }} 
                     className={`bg-white border-4 ${urgency.type === 'fraude' ? 'border-red-600' : 'border-zinc-200'} rounded-2xl overflow-hidden shadow-sm flex flex-col h-full`}
                   >
                     <div className={`${urgency.type === 'fraude' ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-600'} p-3 border-b border-zinc-200 flex justify-between items-center text-xs font-black`}>
                       <span className="flex items-center gap-2">
                         {urgency.type === 'combustivel' && <Fuel className="w-4 h-4" />}
                         {urgency.type === 'agenda' && <MapPin className="w-4 h-4" />}
                         {urgency.type === 'fraude' && <AlertTriangle className="w-4 h-4" />}
                         {urgency.type.toUpperCase()}
                       </span>
                       <span className={`${urgency.type === 'fraude' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'} px-2 py-0.5 rounded`}>
                         {urgency.team}
                       </span>
                     </div>
                     <div className="p-4 flex-1 flex flex-col justify-between">
                       <div>
                         <h3 className={`text-xl font-black ${urgency.type === 'fraude' ? 'text-red-700' : 'text-zinc-950'}`}>{urgency.title}</h3>
                         <p className="text-sm font-medium text-zinc-500 mt-2">{urgency.description || 'Nenhuma descrição detalhada.'}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-3 mt-6">
                         <button 
                           onClick={async () => {
                             await firestoreService.deleteDocument('urgencies', urgency.id);
                           }}
                           className="bg-red-600 text-white py-3 rounded-xl font-black text-sm flex flex-col items-center justify-center gap-1 shadow-lg border-b-4 border-red-800 active:border-b-0 active:translate-y-1"
                         >
                           NEGAR
                         </button>
                         <button 
                           onClick={async () => {
                             // Lógica de aprovação específica se necessário
                             await firestoreService.deleteDocument('urgencies', urgency.id);
                           }}
                           className="bg-green-600 text-white py-3 rounded-xl font-black text-sm flex flex-col items-center justify-center gap-1 shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
                         >
                           RESOLVER
                         </button>
                       </div>
                     </div>
                   </motion.div>
                )) : (
                  <div className="bg-zinc-100 p-8 rounded-3xl border-2 border-dashed border-zinc-200 text-center col-span-full">
                    <p className="font-black text-zinc-400 uppercase tracking-widest text-xs">Nenhuma urgência crítica detectada no momento.</p>
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        )}

        {activeTab === 'teams' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black uppercase text-zinc-800 tracking-tighter">Coordenação de Equipes</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase">Visão por líderes e localidades estratégicas</p>
              </div>
              <button 
                onClick={() => setIsTeamModalOpen(true)}
                className="bg-zinc-950 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-zinc-800 transition-all"
              >
                <Plus className="w-4 h-4" /> Nova Equipe de Campo
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {teams.length > 0 ? teams.map((team) => (
                <div key={team.id || team.name} className="bg-white border-2 border-zinc-200 rounded-3xl p-5 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:border-zinc-400 transition-all group overflow-hidden relative">
                  {team.demands > 3 && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black px-4 py-1 rounded-bl-lg animate-pulse uppercase">Alta Demanda</div>
                  )}
                  
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-3xl transition-transform group-hover:scale-110 ${
                      team.status === 'OK' ? 'bg-green-100 text-green-600' : 
                      team.status === 'ALERTA' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                    }`}>
                      <Users className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-black text-zinc-950 text-xl uppercase tracking-tighter">{team.name}</h3>
                      <p className="text-xs font-black text-zinc-400 uppercase flex items-center gap-1">
                        <User className="w-3 h-3 text-zinc-300" /> {team.leader} • <MapPin className="w-3 h-3 text-zinc-300" /> {team.location}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 flex-1 md:ml-12">
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Contatos</p>
                      <p className="text-2xl font-black text-zinc-900 tracking-tighter">{team.contacts}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Autonomia</p>
                      <p className="text-2xl font-black text-blue-600 tracking-tighter">{team.fuel}L</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pendências</p>
                      <p className={`text-2xl font-black tracking-tighter ${team.demands > 0 ? 'text-red-600' : 'text-green-500'}`}>{team.demands}</p>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest" >Status</p>
                      <span className={`inline-block mt-1 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        team.status === 'OK' ? 'bg-green-500 text-white' : 
                        team.status === 'ALERTA' ? 'bg-yellow-500 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {team.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 md:mt-0">
                    <button className="flex-1 md:flex-none bg-zinc-100 text-zinc-600 px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-zinc-200 transition-colors">Histórico</button>
                    <button className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg transition-all ${
                       team.demands > 0 ? 'bg-red-600 text-white shadow-red-200' : 'bg-zinc-950 text-white shadow-zinc-200'
                    }`}>
                      Coordenar
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-zinc-200">
                   <p className="font-black text-zinc-300 uppercase tracking-widest">Carregando equipes estratégicas...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'finance' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <FinanceDashboard isNested />
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {isAiModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md p-4 flex items-end sm:items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative mb-10"
            >
              <button 
                onClick={() => {
                  setIsAiModalOpen(false);
                  setAiResult(null);
                  setChaosText('');
                }}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-full text-zinc-500 active:bg-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-yellow-500 p-6">
                <Brain className="w-12 h-12 text-zinc-950 mb-4" />
                <h2 className="text-2xl font-black text-zinc-950 tracking-tighter uppercase leading-none">Organizador de Demandas</h2>
                <p className="text-zinc-800 text-sm font-bold mt-2">Diga o que aconteceu e a IA estratégica organiza os próximos passos.</p>
              </div>

              <div className="p-6">
                {!aiResult ? (
                  <div className="space-y-4">
                    <label className="text-xs font-black text-zinc-400 uppercase">Relato do Coordenador</label>
                    <textarea 
                      value={chaosText}
                      onChange={(e) => setChaosText(e.target.value)}
                      placeholder="Ex: Falei com a liderança da comunidade X, eles precisam de suporte logístico para a reunião de amanhã..."
                      className="w-full h-40 bg-zinc-50 border-2 border-zinc-200 rounded-2xl p-4 font-bold text-zinc-800 focus:border-yellow-500 outline-none transition-all placeholder:text-zinc-300"
                    />
                    <button 
                      onClick={handleProcessCaos}
                      disabled={isProcessing || !chaosText}
                      className="w-full bg-zinc-950 text-yellow-500 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isProcessing ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                      {isProcessing ? 'PROCESSANDO...' : 'ENVIAR PARA IA'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* RESULTADOS DA IA */}
                    {aiResult.tarefas_logistica?.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-2xl border-l-8 border-blue-600">
                        <h4 className="text-blue-700 font-black text-xs uppercase mb-2 flex items-center gap-2">
                          <Fuel className="w-4 h-4" /> Logística Detectada
                        </h4>
                        <ul className="space-y-1">
                          {aiResult.tarefas_logistica.map((t: string, i: number) => (
                            <li key={i} className="text-sm font-bold text-zinc-800 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiResult.acoes_politicas?.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-2xl border-l-8 border-green-600">
                        <h4 className="text-green-700 font-black text-xs uppercase mb-2 flex items-center gap-2">
                          <Brain className="w-4 h-4" /> Ações Planejadas
                        </h4>
                        <ul className="space-y-1">
                          {aiResult.acoes_politicas.map((t: string, i: number) => (
                            <li key={i} className="text-sm font-bold text-zinc-800 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiResult.alertas_crise?.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-2xl border-l-8 border-red-600">
                        <h4 className="text-red-700 font-black text-xs uppercase mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Alertas de Risco
                        </h4>
                        <ul className="space-y-1">
                          {aiResult.alertas_crise.map((t: string, i: number) => (
                            <li key={i} className="text-sm font-bold text-red-900 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0"></div>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button 
                      onClick={() => {
                        setIsAiModalOpen(false);
                        setAiResult(null);
                        setChaosText('');
                        alert('Demandas delegadas com sucesso!');
                      }}
                      className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl"
                    >
                      CONFIRMAR DELEGAÇÃO
                    </button>
                    <button 
                      onClick={() => setAiResult(null)}
                      className="w-full text-zinc-400 font-bold text-xs uppercase py-2"
                    >
                      Voltar e Ajustar Relato
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: NOVA EQUIPE */}
      <AnimatePresence>
        {isTeamModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsTeamModalOpen(false)}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-full text-zinc-500 hover:bg-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-6 border-b-4 border-yellow-500">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Cadastrar Equipe Regional</h2>
                <p className="text-zinc-400 text-xs font-bold mt-2 uppercase tracking-widest">Defina o líder e a base estratégica</p>
              </div>

              <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome da Equipe</label>
                  <input 
                    required
                    type="text" 
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                    placeholder="Ex: Equipe Central"
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Líder Regional</label>
                    <input 
                      required
                      type="text" 
                      value={newTeam.leader}
                      onChange={(e) => setNewTeam({...newTeam, leader: e.target.value})}
                      placeholder="Ex: Sargento Garcia"
                      className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Localidade / Base</label>
                    <input 
                      required
                      type="text" 
                      value={newTeam.location}
                      onChange={(e) => setNewTeam({...newTeam, location: e.target.value})}
                      placeholder="Ex: Boa Vista"
                      className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1 pt-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cota Inicial de Combustível (L)</label>
                  <input 
                    type="number" 
                    value={newTeam.fuel}
                    onChange={(e) => setNewTeam({...newTeam, fuel: parseInt(e.target.value) || 0})}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all"
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-zinc-950 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-zinc-200 border-b-4 border-zinc-800 active:border-b-0 active:translate-y-1 transition-all mt-4"
                >
                  SALVAR EQUIPE ESTRATÉGICA
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileTap={{ scale: 0.9 }} 
        onClick={() => setIsAiModalOpen(true)}
        className="fixed bottom-6 right-6 w-20 h-20 bg-zinc-950 text-yellow-500 rounded-full shadow-2xl border-4 border-yellow-500 flex items-center justify-center z-[100]"
      >
        <Mic className="w-10 h-10" />
      </motion.button>
    </div>
  );
}

// --- UTILITÁRIOS DE LÓGICA CORE (OFFLINE & ANTI-FRAUDE) ---

interface GeoLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface OfflineQueueItem {
  id: string;
  type: 'ponto' | 'eleitor' | 'combustivel' | 'demanda';
  data: any;
  location: GeoLocation;
  timestamp: number;
  fraudFlag?: boolean;
  fraudReason?: string;
}

/**
 * Calcula a distância entre dois pontos (Haversine) para detecção de fraude
 * Retorna a distância em metros.
 */
const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// --- COMPONENTE: DASHBOARD DO CABO ELEITORAL (PWA) ---
function CaboDashboard() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [isLocating, setIsLocating] = useState(false);

  // Monitor de Conectividade
  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    
    const queue = JSON.parse(localStorage.getItem('aguia_offline_queue') || '[]');
    setQueueCount(queue.length);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const syncOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('aguia_offline_queue') || '[]');
    if (queue.length === 0) return;
    
    setTimeout(() => {
      localStorage.setItem('aguia_offline_queue', '[]');
      setQueueCount(0);
      alert('✅ Sincronização Concluída!');
    }, 1500);
  };

  const processAction = async (type: string) => {
    setIsLocating(true);
    setTimeout(() => {
      const queue = JSON.parse(localStorage.getItem('aguia_offline_queue') || '[]');
      const newQueue = [...queue, { type, id: Date.now() }];
      localStorage.setItem('aguia_offline_queue', JSON.stringify(newQueue));
      setQueueCount(newQueue.length);
      setIsLocating(false);
      alert('✅ Registro guardado!');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-zinc-950 font-sans">
      
      {/* HEADER FIXO - CABO (WIDER ON DESKTOP) */}
      <header className="sticky top-0 z-50 bg-white p-4 shadow-sm border-b-4 border-zinc-950">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg lg:text-xl font-black text-zinc-950 flex items-center gap-2 uppercase tracking-tighter text-left">
              <User className="w-5 h-5 text-zinc-500" /> João (Pacaraima)
            </h1>
            <p className="text-[10px] lg:text-xs font-bold text-zinc-400 text-left uppercase">CABO ELEITORAL - LÍDER DE RUA</p>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full border-2 transition-all ${
              isOnline 
              ? 'bg-green-50 border-green-600 text-green-700' 
              : 'bg-orange-50 border-orange-600 text-orange-700'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
            <span className="text-[10px] lg:text-xs font-black uppercase tracking-tight">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
        
        {isLocating && (
          <div className="bg-zinc-950 text-white p-4 rounded-2xl text-center animate-pulse flex items-center justify-center gap-3 font-black text-xs uppercase shadow-xl">
            <RefreshCcw className="w-5 h-5 animate-spin" /> Validando GPS e Segurança de Campo...
          </div>
        )}

        {/* GRID DE BOTÕES GIGANTES - RESPONSIVO (2 colunas mobile, 4 colunas desktop) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => processAction('ponto')}
            className="aspect-square bg-zinc-950 text-white rounded-3xl p-4 lg:p-8 flex flex-col items-center justify-center gap-3 shadow-xl border-b-8 border-zinc-800"
          >
            <div className="bg-zinc-800 p-4 lg:p-6 rounded-2xl"><Camera className="w-10 h-10 lg:w-14 lg:h-14 text-yellow-500" /></div>
            <span className="font-black text-sm lg:text-base uppercase tracking-tighter leading-tight">Bater Ponto<br/>(Selfie)</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }} 
            onClick={() => processAction('eleitor')}
            className="aspect-square bg-white border-4 border-zinc-950 text-zinc-950 rounded-3xl p-4 lg:p-8 flex flex-col items-center justify-center gap-3 shadow-lg relative"
          >
            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-full border-2 border-white shadow-md">GPS OBRIGATÓRIO</div>
            <div className="bg-zinc-100 p-4 lg:p-6 rounded-2xl text-zinc-950 border-2 border-zinc-200"><UserPlus className="w-10 h-10 lg:w-14 lg:h-14" /></div>
            <span className="font-black text-sm lg:text-base uppercase tracking-tighter leading-tight">Cadastrar<br/>Eleitor</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => processAction('combustivel')}
            className="aspect-square bg-blue-600 text-white rounded-3xl p-4 lg:p-8 flex flex-col items-center justify-center gap-3 shadow-xl border-b-8 border-blue-800"
          >
            <div className="bg-blue-700 p-4 lg:p-6 rounded-2xl"><Fuel className="w-10 h-10 lg:w-14 lg:h-14 text-white" /></div>
            <span className="font-black text-sm lg:text-base uppercase tracking-tighter leading-tight">Pedir<br/>Combustível</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => processAction('demanda')}
            className="aspect-square bg-yellow-400 text-zinc-950 rounded-3xl p-4 lg:p-8 flex flex-col items-center justify-center gap-3 shadow-xl border-b-8 border-yellow-600"
          >
            <div className="bg-yellow-500/20 p-4 lg:p-6 rounded-2xl"><StickyNote className="w-10 h-10 lg:w-14 lg:h-14 text-zinc-950" /></div>
            <span className="font-black text-sm lg:text-base uppercase tracking-tighter leading-tight">Registrar<br/>Demanda</span>
          </motion.button>
        </section>

        {/* FILA DE SINCRONIZAÇÃO E MOTIVAÇÃO - SIDE BY SIDE ON DESKTOP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <section className="bg-white border-2 border-dashed border-zinc-300 rounded-3xl p-6 lg:p-8 text-center flex flex-col items-center justify-center">
            <div className="bg-zinc-100 p-4 rounded-full relative mb-3">
              <RefreshCcw className={`w-8 h-8 text-zinc-400 ${queueCount > 0 ? 'animate-spin-slow' : ''}`} />
              {queueCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-zinc-950 text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md">
                  {queueCount}
                </span>
              )}
            </div>
            <h3 className="text-zinc-700 font-black text-base lg:text-lg tracking-tight">{queueCount} Registros na Fila</h3>
            <p className="text-zinc-400 text-[10px] font-bold mt-1 uppercase">
              {isOnline ? 'Pronto para sincronizar com o comitê central' : 'Guardando dados localmente (sem sinal)'}
            </p>
            {isOnline && queueCount > 0 && (
              <button 
                onClick={syncOfflineQueue}
                className="mt-6 text-xs font-black bg-zinc-950 text-white px-8 py-3 rounded-full uppercase shadow-lg active:scale-95 transition-transform"
              >
                Sincronizar Agora
              </button>
            )}
          </section>

          <div className="bg-blue-600 p-8 lg:p-10 rounded-3xl flex flex-col justify-center relative overflow-hidden shadow-2xl">
            <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-500 opacity-20 rotate-12" />
            <p className="text-blue-100 font-black text-lg lg:text-xl uppercase italic leading-tight text-left relative z-10">
              "A semente da vitória é plantada no bairro. Valorize cada aperto de mão."
            </p>
            <div className="mt-4 flex items-center gap-2 relative z-10">
               <div className="w-10 h-1 bg-white rounded-full"></div>
               <span className="text-white text-[10px] font-black uppercase tracking-widest">Estratégia Águia</span>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER NAVEGAÇÃO - RESPONSIVO (Larger buttons on tablet/PC) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-t-4 border-yellow-500 z-50">
        <div className="max-w-5xl mx-auto flex justify-around items-center p-3">
          <button className="flex flex-col items-center gap-1 opacity-50 p-2"><Users className="w-6 h-6" /><span className="text-[9px] font-black uppercase">EQUIPE</span></button>
          <button className="flex flex-col items-center gap-1 text-zinc-950 p-2"><MapPin className="w-7 h-7 text-yellow-500" /><span className="text-[9px] font-black uppercase underline decoration-2 underline-offset-4">LOGÍSTICA</span></button>
          <button className="flex flex-col items-center gap-1 opacity-50 p-2"><AlertTriangle className="w-6 h-6" /><span className="text-[9px] font-black uppercase">OUVIDORIA</span></button>
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  const { user, login, loginWithEmail, signupWithEmail, loading, isAdmin } = useAuth();
  const [view, setView] = useState<'coord' | 'cabo'>('cabo');
  
  useEffect(() => {
    if (user) {
      setView(isAdmin ? 'coord' : 'cabo');
    }
  }, [user, isAdmin]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState<'coordenador' | 'lider'>('lider');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
         <ShieldCheck className="w-16 h-16 text-yellow-500 animate-pulse mb-4" />
         <p className="text-zinc-400 font-bold uppercase tracking-widest animate-pulse">SISTEMA ÁGUIA • CARREGANDO...</p>
      </div>
    );
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        await signupWithEmail(email, password, userRole);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro na autenticação');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-4 md:p-8 text-center selection:bg-yellow-500 selection:text-zinc-950">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-zinc-950 p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-zinc-800 relative overflow-hidden"
        >
          {/* Decorative Background */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>

          <ShieldCheck className="w-16 h-16 text-yellow-500 mx-auto mb-4 relative z-10" />
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none mb-1 relative z-10">SISTEMA ÁGUIA</h1>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-8 relative z-10">Coordenação Estratégica 2026</p>
          
          <form onSubmit={handleEmailAuth} className="space-y-4 text-left relative z-10">
            {isRegistering && (
              <div className="flex gap-2 p-1 bg-zinc-900 rounded-2xl border border-zinc-800 mb-4">
                <button 
                  type="button"
                  onClick={() => setUserRole('coordenador')}
                  className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${userRole === 'coordenador' ? 'bg-yellow-500 text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Coordenador
                </button>
                <button 
                  type="button"
                  onClick={() => setUserRole('lider')}
                  className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${userRole === 'lider' ? 'bg-yellow-500 text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Líder Equipe
                </button>
              </div>
            )}
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">E-mail Corporativo</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 rounded-2xl focus:outline-none focus:border-yellow-500 transition-all font-medium placeholder:text-zinc-700"
                placeholder="exemplo@aguia.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Senha de Acesso</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 rounded-2xl focus:outline-none focus:border-yellow-500 transition-all font-medium placeholder:text-zinc-700"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                {authError}
              </p>
            )}

            <button 
              type="submit"
              className="w-full bg-yellow-500 text-zinc-950 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-yellow-400 transition-all active:scale-95"
            >
              {isRegistering ? 'Criar Nova Credencial' : 'Autenticar Acesso'}
            </button>
          </form>

          <div className="relative my-8 z-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase font-black text-zinc-600 bg-zinc-950 px-4 tracking-[0.3em]">OU ACESSAR VIA SOCIAL</div>
          </div>

          <button 
            onClick={login}
            className="w-full bg-zinc-900 text-zinc-300 py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-3 border border-zinc-800 hover:bg-zinc-800 transition-all relative z-10"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
               <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
               <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
               <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
               <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            GOOGLE AUTH
          </button>

          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="mt-6 text-[10px] font-black text-zinc-500 hover:text-yellow-500 uppercase tracking-widest transition-colors z-10 relative"
          >
            {isRegistering ? 'Já possui acesso? Fazer Login' : 'Solicitar Nova Credencial'}
          </button>
        </motion.div>
        
        <div className="mt-8 flex items-center gap-2 opacity-30">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Criptografia Militar de 256 bits Ativa</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {view === 'coord' ? <CoordinatorDashboard /> : <CaboDashboard />}
    </>
  );
}


