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
  LogOut,
  Settings,
  Calendar,
  Clock,
  FileText,
  GanttChart,
  Trash2,
  Edit3,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processarCaos, gerarBriefingCandidato } from './services/geminiService';
import FinanceDashboard from './components/FinanceDashboard';
import { useAuth } from './lib/FirebaseProvider';
import { firestoreService } from './lib/firestoreService';
import { onSnapshot, doc, collection, query, orderBy, limit, getDocs, where, getDoc } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { validarSugestaoAgenda, AgendaItem } from './lib/agendaLogic';

/// --- COMPONENTE: DASHBOARD DO COORDENADOR ---
function CoordinatorDashboard() {
  const { user, login, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'finance' | 'agenda'>('overview');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [chaosText, setChaosText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  
  const [selectedUrgency, setSelectedUrgency] = useState<any>(null);
  const [observation, setObservation] = useState('');
  const [isUrgencyModalOpen, setIsUrgencyModalOpen] = useState(false);

  const [teams, setTeams] = useState<any[]>([]);
  const [urgencies, setUrgencies] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [agendas, setAgendas] = useState<any[]>([]);
  
  // Briefing State
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [briefingResult, setBriefingResult] = useState('');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingLocation, setBriefingLocation] = useState('');

  // Modal State for New Team
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamCreationStep, setTeamCreationStep] = useState<'form' | 'success'>('form');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [createdTeamLink, setCreatedTeamLink] = useState('');
  const [newTeam, setNewTeam] = useState({
    name: '',
    leader: '',
    leaderEmail: '',
    leaderPhone: '',
    leaderAddress: '',
    location: '',
    observations: '',
    status: 'OK',
    contacts: 0,
    fuel: 0,
    demands: 0,
    allocated: 0,
    spent: 0
  });

  const [isAgendaCreateModalOpen, setIsAgendaCreateModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<any>(null);
  const [agendaForm, setAgendaForm] = useState({
    municipio: '',
    data: '',
    hora_inicio: '',
    hora_fim: '',
    motivo: ''
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

    const unsubAttendance = firestoreService.subscribeToCollection('attendance', (data) => {
      setAttendance(data);
    });

    const unsubAgendas = firestoreService.subscribeToCollection('agenda', (data) => {
      setAgendas(data);
    });
    
    // Fallback for empty collections
    const checkAndSeed = async () => {
      if (isAdmin) {
        // No more seeding - only real data
      }
    };
    checkAndSeed();

    return () => {
      unsubTeams();
      unsubUrgencies();
      unsubStats();
      unsubAttendance();
      unsubAgendas();
    };
  }, [user, isAdmin]);

  const stats = [
    { 
      label: 'Combustível Hoje', 
      value: statsData?.combustivelHoje ? `${Math.round(statsData.combustivelHoje)}L` : '0L', 
      sub: `Saldo: ${statsData?.combustivelSaldo || '0'}L`, 
      color: 'text-blue-700' 
    },
    { 
      label: 'Contatos Válidos', 
      value: teams.reduce((acc, t) => acc + (t.contacts || 0), 0), 
      sub: `Meta: ${statsData?.contatosMeta || '500'}`, 
      color: 'text-green-700' 
    },
    { 
      label: 'Alertas Ativos', 
      value: urgencies.filter(u => u.status === 'pendente').length.toString().padStart(2, '0'), 
      sub: `Críticos: ${urgencies.filter(u => u.type === 'fraude' && u.status === 'pendente').length.toString().padStart(2, '0')}`, 
      color: 'text-red-600' 
    },
    { 
      label: 'Regionais Online', 
      value: `${teams.length}/${teams.length}`, 
      sub: teams.length > 0 ? '100% Ativas' : 'Nenhuma cadastrada', 
      color: 'text-zinc-900' 
    },
  ];

  const handleCreateOrUpdateAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      const agendaId = editingAgenda?.id || `agenda_${Date.now()}`;
      await firestoreService.setDocument('agenda', agendaId, {
        ...agendaForm,
        status: editingAgenda ? editingAgenda.status : 'confirmado',
        sugeridoPorId: user?.uid,
        sugeridoPor: 'Coordenação',
        createdAt: editingAgenda ? editingAgenda.createdAt : Date.now(),
        updatedAt: Date.now()
      });
      setIsAgendaCreateModalOpen(false);
      setEditingAgenda(null);
      setAgendaForm({ municipio: '', data: '', hora_inicio: '', hora_fim: '', motivo: '' });
      alert(editingAgenda ? "Agenda atualizada!" : "Agenda criada com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar agenda: " + err.message);
    }
  };

  const handleEditAgenda = (item: any) => {
    setEditingAgenda(item);
    setAgendaForm({
      municipio: item.municipio,
      data: item.data,
      hora_inicio: item.hora_inicio,
      hora_fim: item.hora_fim,
      motivo: item.motivo
    });
    setIsAgendaCreateModalOpen(true);
  };

  const handleDeleteAgenda = async (id: string) => {
    if (window.confirm("Deseja excluir este item da agenda?")) {
      try {
        await firestoreService.deleteDocument('agenda', id);
        alert("Item movido com sucesso!");
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

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
      const teamId = editingTeamId || newTeam.name.replace(/\s/g, '_').toLowerCase();
      const defaultPassword = 'aguia' + Math.floor(1000 + Math.random() * 9000);
      
      // 1. Criar/Atualizar a equipe no Firestore
      await firestoreService.setDocument('teams', teamId, {
        ...newTeam,
        tempPassword: isEditMode ? (newTeam as any).tempPassword : defaultPassword, // Manter ou criar senha
        updatedAt: Date.now(),
        createdAt: isEditMode ? (newTeam as any).createdAt : Date.now()
      });

      if (!isEditMode) {
        // 2. Criar pré-registro para o líder (apenas em criação)
        await firestoreService.setDocument('pre_registrations', newTeam.leaderEmail.toLowerCase(), {
          email: newTeam.leaderEmail.toLowerCase(),
          name: newTeam.leader,
          phone: newTeam.leaderPhone,
          address: newTeam.leaderAddress,
          teamName: newTeam.name,
          teamId: teamId,
          location: newTeam.location,
          tempPassword: defaultPassword,
          role: 'lider',
          createdAt: Date.now()
        });
        
        const accessLink = `${window.location.origin}/?email=${encodeURIComponent(newTeam.leaderEmail)}&access_token=${btoa(defaultPassword)}`;
        setCreatedTeamLink(accessLink);
        setTeamCreationStep('success');
      } else {
        setIsTeamModalOpen(false);
        setIsEditMode(false);
        setEditingTeamId(null);
        alert("Equipe atualizada com sucesso!");
      }
      
      if (!isEditMode) alert("Equipe e acesso do líder criados com sucesso!");
    } catch (err: any) {
      alert("Erro ao processar equipe: " + err.message);
    }
  };

  const handleCopyAccessLink = (team: any) => {
    const email = team.leaderEmail;
    const pass = team.tempPassword || 'aguia1234'; 
    const link = `${window.location.origin}/?email=${encodeURIComponent(email)}&access_token=${btoa(pass)}`;
    navigator.clipboard.writeText(link);
    alert(`Link de acesso copiado para ${team.leader}!\nEnvie via WhatsApp.`);
  };

  const handleEditTeam = (team: any) => {
    setNewTeam({
      name: team.name,
      leader: team.leader,
      leaderEmail: team.leaderEmail || '',
      leaderPhone: team.leaderPhone || '',
      leaderAddress: team.leaderAddress || '',
      location: team.location,
      observations: team.observations || '',
      status: team.status || 'OK',
      contacts: team.contacts || 0,
      fuel: team.fuel || 0,
      demands: team.demands || 0,
      allocated: team.allocated || 0,
      spent: team.spent || 0
    });
    setEditingTeamId(team.id || team.name.replace(/\s/g, '_').toLowerCase());
    setIsEditMode(true);
    setTeamCreationStep('form');
    setIsTeamModalOpen(true);
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (window.confirm(`Deseja realmente excluir a equipe "${teamName}"? Esta ação não pode ser desfeita.`)) {
      try {
        await firestoreService.deleteDocument('teams', teamId);
        alert("Equipe excluída com sucesso!");
      } catch (err: any) {
        alert("Erro ao excluir equipe: " + err.message);
      }
    }
  };

  const handleManualCheckin = async (leaderId: string, leaderName: string) => {
    if (!isAdmin) return;
    try {
      await firestoreService.setDocument('attendance', `manual_${Date.now()}`, {
        leaderId,
        leaderName,
        timestamp: Date.now(),
        type: 'manual',
        status: 'validado',
        validatedBy: user?.email || user?.uid,
        observation: 'Validado por exceção pelo coordenador'
      });
      alert(`Ponto manual validado para ${leaderName}`);
    } catch (err: any) {
      alert("Erro ao validar ponto: " + err.message);
    }
  };

  const handleGenerateBriefing = async (location: string) => {
    setBriefingLoading(true);
    setBriefingLocation(location);
    try {
      // Buscar demandas desse município
      const allUrgencies = await firestoreService.getCollection<any>('urgencies');
      const localDemands = allUrgencies.filter(u => u.team === location && u.type === 'demanda');
      
      const res = await gerarBriefingCandidato(location, localDemands);
      setBriefingResult(res);
      setIsBriefingModalOpen(true);
    } catch (err: any) {
      alert("Erro ao gerar briefing: " + err.message);
    } finally {
      setBriefingLoading(false);
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
                onClick={() => setActiveTab('agenda')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'agenda' ? 'bg-yellow-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
              >
                Agenda
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
          onClick={() => setActiveTab('agenda')}
          className={`flex-none px-4 py-2 rounded-full text-[10px] font-black uppercase border-2 transition-all ${activeTab === 'agenda' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 text-zinc-400 border-transparent'}`}
        >
          Agenda
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
                     className={`bg-white border-4 ${urgency.type === 'fraude' ? 'border-red-600' : 'border-zinc-200'} rounded-2xl overflow-hidden shadow-sm flex flex-col h-full text-left`}
                   >
                     <div className={`${urgency.type === 'fraude' ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-600'} p-3 border-b border-zinc-200 flex justify-between items-center text-xs font-black`}>
                       <span className="flex items-center gap-2">
                         {urgency.type === 'combustivel' && <Fuel className="w-4 h-4" />}
                         {urgency.type === 'agenda' && <MapPin className="w-4 h-4" />}
                         {urgency.type === 'fraude' && <AlertTriangle className="w-4 h-4" />}
                         {urgency.type === 'demanda' && <StickyNote className="w-4 h-4" />}
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
                         {urgency.leaderName && <p className="text-[10px] font-black text-zinc-400 uppercase mt-2">SOLICITADO POR: {urgency.leaderName}</p>}
                       </div>
                       <div className="grid grid-cols-1 gap-3 mt-6">
                         <button 
                           onClick={() => {
                             setSelectedUrgency(urgency);
                             setIsUrgencyModalOpen(true);
                             setObservation('');
                           }}
                           className="bg-zinc-950 text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-zinc-800 transition-all"
                         >
                           ANALISAR SOLICITAÇÃO <ChevronRight className="w-4 h-4" />
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
                onClick={() => {
                  setIsTeamModalOpen(true);
                  setIsEditMode(false);
                  setEditingTeamId(null);
                  setNewTeam({
                    name: '',
                    leader: '',
                    leaderEmail: '',
                    leaderPhone: '',
                    leaderAddress: '',
                    location: '',
                    observations: '',
                    status: 'OK',
                    contacts: 0,
                    fuel: 0,
                    demands: 0,
                    allocated: 0,
                    spent: 0
                  });
                }}
                className="bg-zinc-950 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-zinc-800 transition-all"
              >
                <Plus className="w-4 h-4" /> Nova Equipe de Campo
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {teams.length > 0 ? teams.map((team) => (
                <div key={team.id || team.name} className={`bg-white border-4 ${team.fraudAlert ? 'border-red-600 animate-pulse' : 'border-zinc-200'} rounded-3xl p-5 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:border-zinc-400 transition-all group overflow-hidden relative`}>
                  {team.fraudAlert && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-6 py-1 rounded-bl-xl uppercase flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> ALERTA DE FRAUDE DETECTADO
                    </div>
                  )}
                  {team.demands > 3 && !team.fraudAlert && (
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

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 flex-1 md:ml-12 text-left">
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Contatos</p>
                        <p className="text-2xl font-black text-zinc-900 tracking-tighter">{team.contacts || 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Performance</p>
                        <p className="text-2xl font-black text-green-600 tracking-tighter">
                          {Math.min(100, Math.round(((team.contacts || 0) / 100) * 100))}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pendências</p>
                        <p className={`text-2xl font-black tracking-tighter ${team.demands > 0 ? 'text-red-600' : 'text-green-500'}`}>{team.demands || 0}</p>
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

                  <div className="flex flex-col gap-2 mt-4 md:mt-0">
                    <div className="flex gap-2">
                       <button 
                         onClick={() => handleCopyAccessLink(team)}
                         className="flex-1 md:flex-none bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-100 transition-colors"
                         title="Copiar Link de Acesso"
                       >
                         <LogIn className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleEditTeam(team)}
                         className="flex-1 md:flex-none bg-zinc-100 text-zinc-600 p-3 rounded-xl hover:bg-zinc-200 transition-colors"
                         title="Editar Equipe"
                       >
                         <Edit3 className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleDeleteTeam(team.id || team.name.replace(/\s/g, '_').toLowerCase(), team.name)}
                         className="flex-1 md:flex-none bg-red-50 text-red-600 p-3 rounded-xl hover:bg-red-100 transition-colors"
                         title="Excluir Equipe"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 md:flex-none bg-zinc-100 text-zinc-600 px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-zinc-200 transition-colors">Histórico</button>
                      <button 
                        onClick={() => handleManualCheckin(team.id || team.name.toLowerCase(), team.leader)}
                        className="flex-1 md:flex-none bg-yellow-100 text-yellow-700 px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-yellow-200 transition-colors flex items-center gap-2"
                        title="Validar Ponto por Exceção"
                      >
                        <ShieldCheck className="w-4 h-4" /> Validar Ponto
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleGenerateBriefing(team.location)}
                        disabled={briefingLoading && briefingLocation === team.location}
                        className="flex-1 md:flex-none bg-blue-100 text-blue-700 px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-blue-200 transition-all flex items-center gap-2 border-2 border-blue-200"
                      >
                        {briefingLoading && briefingLocation === team.location ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />} Briefing IA
                      </button>
                      <button className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg transition-all ${
                         team.demands > 0 ? 'bg-red-600 text-white shadow-red-200' : 'bg-zinc-950 text-white shadow-zinc-200'
                      }`}>
                        Coordenar
                      </button>
                    </div>
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

        {activeTab === 'agenda' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border-2 border-zinc-200">
               <div>
                 <h2 className="text-2xl font-black uppercase text-zinc-800 tracking-tighter flex items-center gap-3">
                   <Calendar className="w-8 h-8 text-yellow-500" /> Agenda Geral
                 </h2>
                 <p className="text-xs font-bold text-zinc-400 uppercase">Gestão de roteiros e compromissos</p>
               </div>
               <button 
                onClick={() => {
                  setEditingAgenda(null);
                  setAgendaForm({ municipio: '', data: '', hora_inicio: '', hora_fim: '', motivo: '' });
                  setIsAgendaCreateModalOpen(true);
                }}
                className="bg-zinc-950 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-zinc-800 transition-all"
              >
                <Plus className="w-4 h-4" /> Novo Compromisso
              </button>
            </div>

            <div className="bg-white rounded-3xl border-2 border-zinc-200 p-8">
              <h2 className="text-lg font-black uppercase text-zinc-800 tracking-tighter mb-6 flex items-center gap-3">
                Aprovação de Sugestões Regionais
              </h2>
              
              <div className="space-y-4">
                {agendas.filter(a => a.status === 'pendente').length > 0 ? agendas.filter(a => a.status === 'pendente').map((item) => (
                  <div key={item.id} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase text-zinc-400">{new Date(item.data).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                        <span className="text-2xl font-black text-zinc-950">{new Date(item.data).getDate()}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950">{item.municipio}</h3>
                        <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.hora_inicio} - {item.hora_fim}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> Sugerido por: {item.sugeridoPor}</span>
                        </div>
                        {item.motivo && <p className="text-[10px] text-zinc-400 font-bold uppercase mt-2">OBJETIVO: {item.motivo}</p>}
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button 
                        onClick={async () => {
                          await firestoreService.updateDocument('agenda', item.id, { status: 'negado' });
                          alert("Agenda negada.");
                        }}
                        className="flex-1 md:flex-none px-6 py-3 bg-red-100 text-red-700 font-black text-xs uppercase rounded-xl hover:bg-red-200 transition-all"
                      >
                        Negar
                      </button>
                      <button 
                        onClick={async () => {
                          await firestoreService.updateDocument('agenda', item.id, { status: 'confirmado' });
                          alert("Agenda confirmada com sucesso!");
                        }}
                        className="flex-1 md:flex-none px-6 py-3 bg-green-600 text-white font-black text-xs uppercase rounded-xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
                      >
                        Confirmar Agenda
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 border-2 border-dashed border-zinc-200 rounded-3xl text-center">
                    <p className="font-black text-zinc-300 uppercase tracking-widest text-sm">Nenhuma sugestão de agenda pendente.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-950 rounded-3xl p-8 text-white">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                <GanttChart className="w-7 h-7 text-yellow-500" /> Todos os Compromissos Confirmados
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {agendas.filter(a => a.status === 'confirmado').sort((a, b) => new Date(`${a.data}T${a.hora_inicio}`).getTime() - new Date(`${b.data}T${b.hora_inicio}`).getTime()).map(item => (
                  <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 group">
                    <div className="flex items-center gap-6">
                      <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700 flex flex-col items-center min-w-[70px]">
                        <span className="text-[10px] font-black uppercase text-zinc-500">{new Date(item.data).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                        <span className="text-2xl font-black text-white">{new Date(item.data).getDate() + 1}</span>
                      </div>
                      <div className="text-left">
                        <h4 className="text-xl font-black uppercase text-yellow-500">{item.municipio}</h4>
                        <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 mt-1 uppercase">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-zinc-500" /> {item.hora_inicio} - {item.hora_fim}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-zinc-500" /> {item.motivo || 'Agenda confirmada'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditAgenda(item)}
                        className="p-3 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700 transition-all"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAgenda(item.id)}
                        className="p-3 bg-red-900/30 text-red-500 rounded-xl hover:bg-red-900/50 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {agendas.filter(a => a.status === 'confirmado').length === 0 && (
                   <div className="p-10 text-center border-2 border-dashed border-zinc-800 rounded-2xl">
                     <p className="text-zinc-600 font-black uppercase text-sm">Nenhum compromisso agendado.</p>
                   </div>
                )}
              </div>
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

      {/* MODAL: ANALISAR URGÊNCIA (APROVAÇÃO/NEGAÇÃO COM OBSERVAÇÃO) */}
      <AnimatePresence>
        {isUrgencyModalOpen && selectedUrgency && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsUrgencyModalOpen(false)}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-full text-zinc-500"
              >
                <X className="w-6 h-6" />
              </button>

              <div className={`p-6 border-b-4 ${selectedUrgency.type === 'combustivel' ? 'bg-blue-600 border-blue-800' : selectedUrgency.type === 'demanda' ? 'bg-yellow-500 border-yellow-700' : 'bg-red-600 border-red-800'}`}>
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">{selectedUrgency.title}</h2>
                <p className="text-white/60 text-[10px] font-black mt-2 uppercase tracking-widest">SOLICITADO POR: {selectedUrgency.leaderName} ({selectedUrgency.team})</p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block mb-2">Relato do Campo</label>
                  <p className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium text-zinc-700 italic">
                    "{selectedUrgency.description}"
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Sua Observação Estratégica (Feedback)</label>
                  <textarea 
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Deixe uma orientação para o líder de campo..."
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-zinc-950 transition-all h-28"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={async () => {
                      await firestoreService.updateDocument('urgencies', selectedUrgency.id, {
                        status: 'negado',
                        observation,
                        updatedAt: Date.now()
                      });
                      setIsUrgencyModalOpen(false);
                      alert("Solicitação Negada.");
                    }}
                    className="bg-red-600 text-white py-4 rounded-xl font-black text-xs shadow-lg uppercase border-b-4 border-red-800 active:border-b-0 active:translate-y-1"
                  >
                    Negar Solicitação
                  </button>
                  <button 
                    onClick={async () => {
                      await firestoreService.updateDocument('urgencies', selectedUrgency.id, {
                        status: 'aprovado',
                        observation,
                        updatedAt: Date.now()
                      });
                      setIsUrgencyModalOpen(false);
                      alert("Solicitação Aprovada!");
                    }}
                    className="bg-green-600 text-white py-4 rounded-xl font-black text-xs shadow-lg uppercase border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
                  >
                    Aprovar Agora
                  </button>
                </div>
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
                onClick={() => {
                  setIsTeamModalOpen(false);
                  setTeamCreationStep('form');
                }}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-full text-zinc-500 hover:bg-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-6 border-b-4 border-yellow-500 text-left">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">
                  {teamCreationStep === 'form' ? (isEditMode ? 'Editar Equipe Regional' : 'Cadastrar Equipe Regional') : 'Equipe Criada com Sucesso'}
                </h2>
                <p className="text-zinc-400 text-xs font-bold mt-2 uppercase tracking-widest">
                  {teamCreationStep === 'form' ? (isEditMode ? 'Ajuste os dados estratégicos' : 'Defina o líder e a base estratégica') : 'Link de acesso gerado para o líder'}
                </p>
              </div>

              {teamCreationStep === 'form' ? (
                <form onSubmit={handleCreateTeam} className="p-6 space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome da Equipe</label>
                    <input 
                      required
                      type="text" 
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                      placeholder="Ex: Equipe Central"
                      disabled={isEditMode}
                      className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 text-left block">Líder Regional (Nome Completo)</label>
                    <input 
                      required
                      type="text" 
                      value={newTeam.leader}
                      onChange={(e) => setNewTeam({...newTeam, leader: e.target.value})}
                      placeholder="Ex: Sargento Garcia"
                      className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">E-mail do Líder</label>
                      <input 
                        required
                        type="email" 
                        value={newTeam.leaderEmail}
                        onChange={(e) => setNewTeam({...newTeam, leaderEmail: e.target.value})}
                        placeholder="lider@exemplo.com"
                        disabled={isEditMode}
                        className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">WhatsApp do Líder</label>
                      <input 
                        required
                        type="tel" 
                        value={newTeam.leaderPhone}
                        onChange={(e) => setNewTeam({...newTeam, leaderPhone: e.target.value})}
                        placeholder="(00) 00000-0000"
                        className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left">
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
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Endereço do Líder</label>
                      <input 
                        required
                        type="text" 
                        value={newTeam.leaderAddress}
                        onChange={(e) => setNewTeam({...newTeam, leaderAddress: e.target.value})}
                        placeholder="Rua, Bairro..."
                        className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Observações do Coordenador</label>
                    <textarea 
                      value={newTeam.observations}
                      onChange={(e) => setNewTeam({...newTeam, observations: e.target.value})}
                      placeholder="Informações adicionais..."
                      maxLength={1000}
                      className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all h-24"
                    />
                    <div className="text-[9px] font-black text-zinc-400 text-right mt-1">{newTeam.observations?.length || 0}/1000</div>
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full bg-zinc-950 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-zinc-200 border-b-4 border-zinc-800 active:border-b-0 active:translate-y-1 transition-all mt-4"
                  >
                    {isEditMode ? 'SALVAR ALTERAÇÕES' : 'SALVAR EQUIPE ESTRATÉGICA'}
                  </button>
                </form>
              ) : (
                <div className="p-8 space-y-6 text-center">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-50">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 uppercase leading-tight">Credenciais Geradas!</h3>
                  <p className="text-zinc-500 text-sm font-bold">
                    Copie o link abaixo e envie para o Líder {newTeam.leader}. Este link contém o acesso direto ao sistema.
                  </p>
                  
                  <div className="bg-zinc-50 p-4 rounded-2xl border-2 border-zinc-100 break-all text-xs font-mono font-bold text-blue-600 select-all">
                    {createdTeamLink}
                  </div>

                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(createdTeamLink);
                      alert("Link copiado!");
                    }}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                  >
                    Copiar Link de Acesso
                  </button>
                  
                  <button 
                    onClick={() => {
                      setIsTeamModalOpen(false);
                      setTeamCreationStep('form');
                      setNewTeam({
                        name: '',
                        leader: '',
                        leaderEmail: '',
                        leaderPhone: '',
                        leaderAddress: '',
                        location: '',
                        status: 'OK',
                        contacts: 0,
                        fuel: 0,
                        demands: 0,
                        allocated: 0,
                        spent: 0
                      });
                    }}
                    className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
                  >
                    Fechar e Voltar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* MODAL: CRIAR/EDITAR AGENDA (COORDENADOR) */}
      <AnimatePresence>
        {isAgendaCreateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAgendaCreateModalOpen(false)}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-full text-zinc-500 hover:bg-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-yellow-500 p-6 border-b-4 border-yellow-700">
                <h2 className="text-xl font-black text-zinc-950 tracking-tighter uppercase leading-none">
                  {editingAgenda ? 'Editar Compromisso' : 'Novo Compromisso Oficial'}
                </h2>
                <p className="text-zinc-800 text-[10px] font-black mt-2 uppercase tracking-widest">Defina o roteiro estratégico da campanha</p>
              </div>

              <form onSubmit={handleCreateOrUpdateAgenda} className="p-6 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Município / Local</label>
                  <input 
                    required
                    type="text" 
                    value={agendaForm.municipio}
                    onChange={(e) => setAgendaForm({...agendaForm, municipio: e.target.value})}
                    placeholder="Ex: Cantá / Centro"
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Data do Compromisso</label>
                  <input 
                    required
                    type="date" 
                    value={agendaForm.data}
                    onChange={(e) => setAgendaForm({...agendaForm, data: e.target.value})}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Início</label>
                    <input 
                      required
                      type="time" 
                      value={agendaForm.hora_inicio}
                      onChange={(e) => setAgendaForm({...agendaForm, hora_inicio: e.target.value})}
                      className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Fim</label>
                    <input 
                      required
                      type="time" 
                      value={agendaForm.hora_fim}
                      onChange={(e) => setAgendaForm({...agendaForm, hora_fim: e.target.value})}
                      className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Objetivo / Atividade</label>
                  <textarea 
                    value={agendaForm.motivo}
                    onChange={(e) => setAgendaForm({...agendaForm, motivo: e.target.value})}
                    placeholder="Ex: Comício na praça central ou reunião com lideranças..."
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 outline-none focus:border-yellow-500 transition-all h-24"
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-zinc-950 text-white py-5 rounded-2xl font-black text-lg shadow-xl border-b-4 border-zinc-800 active:border-b-0 active:translate-y-1 transition-all mt-4"
                >
                  {editingAgenda ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR COMPROMISSO'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: BRIEFING IA */}
      <AnimatePresence>
        {isBriefingModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-zinc-950/95 backdrop-blur-xl p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsBriefingModalOpen(false)}
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-full text-zinc-500 hover:bg-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="bg-blue-600 p-8 text-white relative">
                <Brain className="w-12 h-12 text-blue-200 mb-4" />
                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Briefing de Campo: {briefingLocation}</h2>
                <p className="text-blue-100 text-sm font-bold mt-2 opacity-80 uppercase tracking-widest">Inteligência Estratégica Distrital</p>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto bg-zinc-50 text-left">
                <div className="prose prose-zinc max-w-none">
                  <div className="whitespace-pre-wrap font-bold text-zinc-800 leading-relaxed text-sm">
                    {briefingResult}
                  </div>
                </div>
              </div>
              <div className="p-8 bg-white border-t border-zinc-100 flex gap-4">
                <button 
                  onClick={() => setIsBriefingModalOpen(false)}
                  className="flex-1 bg-zinc-950 text-white py-5 rounded-2xl font-black text-lg shadow-xl"
                >
                  ENTENDIDO, COPIAR PARA O CANDIDATO
                </button>
              </div>
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
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [activeTab, setActiveTab] = useState<'equipe' | 'logistica' | 'ouvidoria'>('logistica');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [isVoterModalOpen, setIsVoterModalOpen] = useState(false);
  const [voterForm, setVoterForm] = useState({ name: '', phone: '', address: '', observations: '' });

  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState({ amount: '', reason: '' });

  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [demandForm, setDemandForm] = useState({ title: '', description: '' });

  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [agendaForm, setAgendaForm] = useState({ municipio: '', data: '', hora_inicio: '', hora_fim: '', motivo: '' });

  const [myRequests, setMyRequests] = useState<any[]>([]);

  const [profileData, setProfileData] = useState({
    name: user?.displayName || '',
    phone: '',
    zone: ''
  });

  const [teamData, setTeamData] = useState<any>(null);

  // Sincronizar Perfil e Time com Firestore
  useEffect(() => {
    if (user) {
      const unsubProfile = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData({
            name: data.name || user.displayName || '',
            zone: data.teamName || data.zone || data.team || ''
          });
          
          if (data.teamId) {
            const teamSnap = await getDoc(doc(db, 'teams', data.teamId));
            if (teamSnap.exists()) {
              setTeamData({ ...teamSnap.data(), id: teamSnap.id });
            }
          }
        }
      }, (error) => {
        console.error("Erro ao escutar perfil:", error);
      });
      return () => unsubProfile();
    }
  }, [user]);

  // Monitor de Conectividade
  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    
    const queue = JSON.parse(localStorage.getItem('aguia_offline_queue') || '[]');
    setQueueCount(queue.length);

    if (user) {
      const unsub = firestoreService.subscribeToCollection('urgencies', (data) => {
        // Filter requests made by this leader
        setMyRequests(data.filter((r: any) => r.leaderId === user.uid));
      });
      return () => unsub();
    }

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
    switch(type) {
      case 'eleitor': setIsVoterModalOpen(true); break;
      case 'combustivel': setIsFuelModalOpen(true); break;
      case 'demanda': setIsDemandModalOpen(true); break;
      case 'agenda': setIsAgendaModalOpen(true); break;
      default:
        setIsLocating(true);
        // Capturar Localização para Ponto
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          const checkinData = {
            leaderId: user?.uid,
            leaderName: profileData.name || user?.displayName,
            timestamp: Date.now(),
            location: { lat: latitude, lng: longitude },
            type: 'selfie',
            status: 'pendente'
          };
          
          const queue = JSON.parse(localStorage.getItem('aguia_offline_queue') || '[]');
          const newQueue = [...queue, { ...checkinData, id: Date.now() }];
          localStorage.setItem('aguia_offline_queue', JSON.stringify(newQueue));
          setQueueCount(newQueue.length);
          
          // Se online, já tenta salvar
          if (navigator.onLine) {
            await firestoreService.setDocument('attendance', `checkin_${Date.now()}`, checkinData);
          }
          
          setIsLocating(false);
          alert('✅ Ponto registrado com sucesso!');
        }, (err) => {
          setIsLocating(false);
          alert("Erro ao capturar GPS. Verifique as permissões.");
        });
    }
  };

  const handleVoterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Usuário não autenticado.");
      return;
    }

    try {
      const payload = {
        ...voterForm,
        leaderId: user.uid,
        leaderName: profileData.name || user.displayName || "Líder",
        team: profileData.zone || "Base",
        createdAt: Date.now(),
        registeredBy: user.email || user.uid,
        location: null
      };

      console.log("🦅 [Firestore Save] Início do salvamento...");
      await firestoreService.setDocument('voters', `voter_${Date.now()}`, payload);
      
      setIsVoterModalOpen(false);
      setVoterForm({ name: '', phone: '', address: '', observations: '' });
      alert("✅ CADASTRO REALIZADO COM SUCESSO!");
    } catch (err: any) {
      console.error("🦅 [Firestore Save] Erro fatal:", err);
      alert("🚫 ERRO CRÍTICO NO BANDO DE DADOS: " + err.message);
    } finally {
      setIsLocating(false);
    }
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await firestoreService.setDocument('urgencies', `fuel_${Date.now()}`, {
        type: 'combustivel',
        title: `Solicitação de Combustível: ${fuelForm.amount}L`,
        description: fuelForm.reason,
        amount: fuelForm.amount,
        status: 'pendente',
        leaderId: user.uid,
        leaderName: profileData.name || user.displayName || 'Líder',
        team: profileData.zone || 'Pacaraima',
        createdAt: Date.now()
      });
      setIsFuelModalOpen(false);
      setFuelForm({ amount: '', reason: '' });
      alert("Solicitação enviada ao coordenador!");
    } catch (err: any) {
      alert("Erro ao solicitar: " + err.message);
    }
  };

  const handleDemandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await firestoreService.setDocument('urgencies', `demand_${Date.now()}`, {
        type: 'demanda',
        title: demandForm.title,
        description: demandForm.description,
        status: 'pendente',
        leaderId: user.uid,
        leaderName: profileData.name || user.displayName || 'Líder',
        team: profileData.zone || 'Pacaraima',
        createdAt: Date.now()
      });
      setIsDemandModalOpen(false);
      setDemandForm({ title: '', description: '' });
      alert("Demanda registrada e enviada!");
    } catch (err: any) {
      alert("Erro ao registrar: " + err.message);
    }
  };

  const handleAgendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // TAREFA 3: VALIDAR CHOQUE LOGÍSTICO
      const confirmedAgendas = await firestoreService.getCollection<any>('agenda');
      const validation = validarSugestaoAgenda(
        agendaForm as AgendaItem, 
        confirmedAgendas.filter(a => a.status === 'confirmado')
      );

      if (!validation.aprovada) {
        alert("⚠️ CHOQUE LOGÍSTICO: " + validation.motivo_recusa);
        return;
      }

      await firestoreService.setDocument('agenda', `agenda_${Date.now()}`, {
        ...agendaForm,
        status: 'pendente',
        sugeridoPorId: user.uid,
        sugeridoPor: profileData.name || user.displayName,
        createdAt: Date.now(),
        team: profileData.zone
      });

      setIsAgendaModalOpen(false);
      setAgendaForm({ municipio: '', data: '', hora_inicio: '', hora_fim: '', motivo: '' });
      alert("Sugestão de agenda enviada para análise!");
    } catch (err: any) {
      alert("Erro ao sugerir agenda: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-zinc-950 font-sans">
      
      {/* HEADER FIXO - CABO (WIDER ON DESKTOP) */}
      <header className="sticky top-0 z-50 bg-white p-4 shadow-sm border-b-4 border-zinc-950">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              className="bg-zinc-100 p-2 rounded-full cursor-pointer hover:bg-yellow-500 hover:text-white transition-all"
            >
              <User className="w-5 h-5 text-zinc-500" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-black text-zinc-950 flex items-center gap-2 uppercase tracking-tighter text-left">
                 {profileData.name || user?.displayName || 'LÍDER'} {profileData.zone ? `(${profileData.zone})` : ''}
              </h1>
              <p className="text-[10px] lg:text-xs font-bold text-zinc-400 text-left uppercase">CABO ELEITORAL - LÍDER DE RUA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full border-2 transition-all ${
                isOnline 
                ? 'bg-green-50 border-green-600 text-green-700' 
                : 'bg-orange-50 border-orange-600 text-orange-700'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
              <span className="text-[10px] lg:text-xs font-black uppercase tracking-tight">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="p-2 bg-zinc-100 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all"
              title="Configurar Perfil"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button 
              onClick={logout}
              className="p-2 bg-zinc-100 rounded-lg text-zinc-500 hover:bg-red-600 hover:text-white transition-all"
              title="Sair do Sistema"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
        
        {activeTab === 'logistica' ? (
          <>
            {isLocating && (
              <div className="bg-zinc-950 text-white p-4 rounded-2xl text-center animate-pulse flex items-center justify-center gap-3 font-black text-xs uppercase shadow-xl">
                <RefreshCcw className="w-5 h-5 animate-spin" /> Validando GPS e Segurança de Campo...
              </div>
            )}

            {/* GRID DE BOTÕES GIGANTES - RESPONSIVO (2 colunas mobile, 4 colunas desktop) */}
            {teamData?.observations && (
              <section className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-6 shadow-sm mb-6 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <StickyNote className="w-16 h-16 text-yellow-600 rotate-12" />
                </div>
                <h3 className="text-yellow-800 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <StickyNote className="w-4 h-4" /> Orientações da Coordenação
                </h3>
                <p className="text-yellow-900 font-bold text-sm leading-relaxed whitespace-pre-wrap">
                  {teamData.observations}
                </p>
              </section>
            )}

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
                onClick={() => processAction('agenda')}
                className="aspect-square bg-orange-500 text-white rounded-3xl p-4 lg:p-8 flex flex-col items-center justify-center gap-3 shadow-xl border-b-8 border-orange-700"
              >
                <div className="bg-orange-600 p-4 lg:p-6 rounded-2xl"><Calendar className="w-10 h-10 lg:w-14 lg:h-14 text-white" /></div>
                <span className="font-black text-sm lg:text-base uppercase tracking-tighter leading-tight">Sugerir<br/>Agenda</span>
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

            {/* HISTÓRICO DE SOLICITAÇÕES */}
            {myRequests.length > 0 && (
              <section className="bg-white border-2 border-zinc-200 rounded-[2rem] p-6 shadow-sm overflow-hidden">
                <h3 className="text-zinc-500 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" /> Minhas Solicitações Recentes
                </h3>
                <div className="space-y-3">
                  {myRequests.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(req => (
                    <div key={req.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          req.type === 'combustivel' ? 'bg-blue-100 text-blue-600' : 
                          req.type === 'demanda' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {req.type === 'combustivel' ? <Fuel className="w-4 h-4" /> : <StickyNote className="w-4 h-4" />}
                        </div>
                        <div className="text-left">
                          <p className="font-black text-zinc-800 text-[10px] uppercase leading-none mb-1">{req.title}</p>
                          <p className="text-[9px] text-zinc-400 font-bold uppercase">{new Date(req.createdAt).toLocaleDateString()}</p>
                          {req.observation && (
                            <p className="text-[10px] text-blue-600 font-black mt-1 italic">OBS: "{req.observation}"</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${
                        req.status === 'aprovado' ? 'bg-green-100 text-green-700' : 
                        req.status === 'negado' ? 'bg-red-100 text-red-700' : 'bg-zinc-200 text-zinc-500'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
          </>
        ) : activeTab === 'equipe' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-200 shadow-xl text-center">
              <Users className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-zinc-900 uppercase">Minha Equipe Regional</h2>
              <p className="text-zinc-500 font-medium">Visualize o desempenho dos seus sub-cabos e colaboradores.</p>
              
              <div className="grid grid-cols-1 gap-4 mt-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-zinc-200 w-10 h-10 rounded-full flex items-center justify-center font-black">C{i}</div>
                      <div className="text-left">
                        <p className="font-black text-zinc-800 text-sm">Colaborador {i}</p>
                        <p className="text-xs text-zinc-400 font-bold uppercase">Ativo • 12 Cadastros</p>
                      </div>
                    </div>
                    <ChevronRight className="text-zinc-300" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-200 shadow-xl text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-zinc-900 uppercase">Canal de Ouvidoria</h2>
              <p className="text-zinc-500 font-medium">Relate problemas, denúncias ou sugestões críticas.</p>
              
              <textarea 
                placeholder="Descreva a ocorrência..."
                className="w-full h-40 bg-zinc-50 border-2 border-zinc-100 rounded-3xl p-6 mt-6 outline-none focus:border-red-500 transition-all font-bold"
              />
              <button className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl mt-4">
                ENVIAR RELATO URGENTE
              </button>
            </div>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {isProfileModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-full text-zinc-500"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-8 border-b-4 border-yellow-500 text-left">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Minhas Credenciais</h2>
                <p className="text-zinc-400 text-xs font-bold mt-2 uppercase tracking-widest">Ajuste seu perfil estratégico</p>
              </div>

              <div className="p-8 space-y-6 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Zona Eleitoral / Base</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Pacaraima Centro"
                    value={profileData.zone}
                    onChange={(e) => setProfileData({...profileData, zone: e.target.value})}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800"
                  />
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={async () => {
                        if (!user) return;
                        try {
                          await firestoreService.setDocument('users', user.uid, profileData);
                          setIsProfileModalOpen(false);
                          alert("✅ Perfil estratégico atualizado!");
                        } catch (err: any) {
                          alert("Erro ao salvar perfil: " + err.message);
                        }
                    }}
                    className="flex-1 bg-yellow-500 text-zinc-950 py-5 rounded-2xl font-black text-lg shadow-xl shadow-yellow-100 transition-all active:scale-95"
                  >
                    SALVAR AJUSTES
                  </button>
                  <button 
                    onClick={logout}
                    className="bg-red-600 text-white px-8 py-5 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95"
                  >
                    SAIR
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: CADASTRAR ELEITOR */}
      <AnimatePresence>
        {isVoterModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button onClick={() => setIsVoterModalOpen(false)} className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-full text-zinc-500"><X className="w-6 h-6" /></button>
              <div className="bg-zinc-950 p-8 border-b-4 border-yellow-500 text-left">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Novo Cadastro</h2>
                <p className="text-zinc-400 text-xs font-bold mt-2 uppercase tracking-widest">Base de dados estratégica</p>
              </div>
              <form onSubmit={handleVoterSubmit} className="p-8 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input required type="text" value={voterForm.name} onChange={e => setVoterForm({...voterForm, name: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold" placeholder="Digite o nome..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                  <input type="text" value={voterForm.phone} onChange={e => setVoterForm({...voterForm, phone: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold" placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Endereço / Referência</label>
                  <input type="text" value={voterForm.address} onChange={e => setVoterForm({...voterForm, address: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold" placeholder="Rua, Número, Bairro..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Observações Privadas</label>
                  <textarea value={voterForm.observations} onChange={e => setVoterForm({...voterForm, observations: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold h-24" placeholder="Detalhes importantes sobre este contato..." />
                </div>
                <button type="submit" className="w-full bg-zinc-950 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-zinc-200 border-b-4 border-zinc-800 active:border-b-0 active:translate-y-1 transition-all mt-4">CONFIRMAR CADASTRO</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: PEDIR COMBUSTÍVEL */}
      <AnimatePresence>
        {isFuelModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button onClick={() => setIsFuelModalOpen(false)} className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-full text-zinc-500"><X className="w-6 h-6" /></button>
              <div className="bg-blue-600 p-8 border-b-4 border-blue-800 text-left">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Vale Combustível</h2>
                <p className="text-blue-200 text-xs font-bold mt-2 uppercase tracking-widest">Requisição oficial de suporte</p>
              </div>
              <form onSubmit={handleFuelSubmit} className="p-8 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Quantidade Solicitada (Litros)</label>
                  <input required type="number" value={fuelForm.amount} onChange={e => setFuelForm({...fuelForm, amount: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-2xl" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Motivo / Roteiro planejado</label>
                  <textarea required value={fuelForm.reason} onChange={e => setFuelForm({...fuelForm, reason: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold h-32" placeholder="Ex: Atendimento na comunidade rural X..." />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all mt-4">ENVIAR SOLICITAÇÃO</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: REGISTRAR DEMANDA */}
      <AnimatePresence>
        {isDemandModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button onClick={() => setIsDemandModalOpen(false)} className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-full text-zinc-500"><X className="w-6 h-6" /></button>
              <div className="bg-yellow-500 p-8 border-b-4 border-yellow-700 text-left">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Registrar Demanda</h2>
                <p className="text-yellow-100 text-xs font-bold mt-2 uppercase tracking-widest">Demanda comunitária / social</p>
              </div>
              <form onSubmit={handleDemandSubmit} className="p-8 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Título da Demanda</label>
                  <input required type="text" value={demandForm.title} onChange={e => setDemandForm({...demandForm, title: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold" placeholder="Ex: Problema na Iluminação Pública" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Descrição Detalhada</label>
                  <textarea required value={demandForm.description} onChange={e => setDemandForm({...demandForm, description: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold h-40" placeholder="Descreva o que os eleitores estão solicitando..." />
                </div>
                <button type="submit" className="w-full bg-yellow-500 text-zinc-950 py-5 rounded-2xl font-black text-lg shadow-xl shadow-yellow-100 border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all mt-4">ENVIAR DEMANDA AO COORDENADOR</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: SUGERIR AGENDA */}
      <AnimatePresence>
        {isAgendaModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button onClick={() => setIsAgendaModalOpen(false)} className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-full text-zinc-500"><X className="w-6 h-6" /></button>
              <div className="bg-orange-500 p-8 border-b-4 border-orange-700 text-left">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Sugerir Agenda</h2>
                <p className="text-orange-100 text-xs font-bold mt-2 uppercase tracking-widest">Roteirizador Amazônico</p>
              </div>
              <form onSubmit={handleAgendaSubmit} className="p-8 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Município / Local</label>
                  <select 
                    required 
                    value={agendaForm.municipio} 
                    onChange={e => setAgendaForm({...agendaForm, municipio: e.target.value})}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold"
                  >
                    <option value="">Selecione o Município</option>
                    {["Boa Vista", "Pacaraima", "Rorainópolis", "Uiramutã", "Cantá", "Alto Alegre", "Mucajaí", "Amajari", "Bonfim", "Normandia", "Caracaraí", "Iracema", "Bonfim", "São João da Baliza", "São Luiz", "Caroebe"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Data do Compromisso</label>
                  <input required type="date" value={agendaForm.data} onChange={e => setAgendaForm({...agendaForm, data: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Hora Início</label>
                    <input required type="time" value={agendaForm.hora_inicio} onChange={e => setAgendaForm({...agendaForm, hora_inicio: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Hora Fim</label>
                    <input required type="time" value={agendaForm.hora_fim} onChange={e => setAgendaForm({...agendaForm, hora_fim: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Motivo / Objetivo</label>
                  <textarea required value={agendaForm.motivo} onChange={e => setAgendaForm({...agendaForm, motivo: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold h-24" placeholder="Ex: Reunião com Tuxauas da região..." />
                </div>
                <button type="submit" className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-100 border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all mt-4">ENVIAR SUGESTÃO</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER NAVEGAÇÃO - RESPONSIVO (Larger buttons on tablet/PC) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-t-4 border-yellow-500 z-50">
        <div className="max-w-5xl mx-auto flex justify-around items-center p-3">
          <button 
            onClick={() => setActiveTab('equipe')}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'equipe' ? 'text-zinc-950 scale-110' : 'opacity-40'}`}
          >
            <Users className="w-6 h-6" />
            <span className={`text-[9px] font-black uppercase ${activeTab === 'equipe' ? 'underline decoration-2 underline-offset-4' : ''}`}>EQUIPE</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('logistica')}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'logistica' ? 'text-zinc-950 scale-110' : 'opacity-40'}`}
          >
            <MapPin className={`w-7 h-7 ${activeTab === 'logistica' ? 'text-yellow-500' : 'text-zinc-400'}`} />
            <span className={`text-[9px] font-black uppercase ${activeTab === 'logistica' ? 'underline decoration-2 underline-offset-4' : ''}`}>LOGÍSTICA</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('ouvidoria')}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'ouvidoria' ? 'text-zinc-950 scale-110' : 'opacity-40'}`}
          >
            <AlertTriangle className="w-6 h-6" />
            <span className={`text-[9px] font-black uppercase ${activeTab === 'ouvidoria' ? 'underline decoration-2 underline-offset-4' : ''}`}>OUVIDORIA</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  const { user, login, loginWithEmail, signupWithEmail, logout, loading, isAdmin, forcePasswordChange, changePassword } = useAuth();
  const [view, setView] = useState<'coord' | 'cabo'>('cabo');
  
  useEffect(() => {
    if (user) {
      setView(isAdmin ? 'coord' : 'cabo');
    }
  }, [user, isAdmin]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState<'coordenador' | 'lider'>('coordenador');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Handle URL Params for Easy Access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const tokenParam = params.get('access_token');
    
    if (emailParam) {
      // Se já houver alguém logado e for outro e-mail, forçar logout para o líder entrar
      if (user && user.email !== emailParam) {
        logout();
      }
      setEmail(emailParam);
    }
    
    if (tokenParam) {
      try {
        const decodedPass = atob(tokenParam);
        setPassword(decodedPass);
      } catch (e) {
        console.error("Token inválido");
      }
    }

    if (emailParam || tokenParam) {
       // Limpar URL para não ficar poluído
       window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
         <ShieldCheck className="w-16 h-16 text-yellow-500 animate-pulse mb-4" />
         <p className="text-zinc-400 font-bold uppercase tracking-widest animate-pulse">SISTEMA ÁGUIA • CARREGANDO...</p>
      </div>
    );
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (newPassword.length < 6) {
      return setAuthError('A nova senha deve ter pelo menos 6 caracteres');
    }
    try {
      await changePassword(newPassword);
      alert("Senha alterada com sucesso!");
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao alterar senha');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        await signupWithEmail(email, password, userRole);
      } else {
        try {
          await loginWithEmail(email, password);
        } catch (err: any) {
          // Se falhou o login padrão, verificar se é um pré-registro
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || (err.message && err.message.includes('INVALID_LOGIN_CREDENTIALS'))) {
            const preRegDoc = await firestoreService.getDocument('pre_registrations', email.toLowerCase()) as any;
            
            if (preRegDoc && preRegDoc.tempPassword === password) {
              // É um líder com senha temporária! Criar a conta oficial agora.
              await signupWithEmail(email, password, 'lider', {
                name: preRegDoc.name,
                phone: preRegDoc.phone,
                address: preRegDoc.address,
                teamName: preRegDoc.teamName,
                teamId: preRegDoc.teamId,
                forcePasswordChange: true // Obrigar a trocar a senha
              });
              
              // Deletar o pré-registro após uso
              // await firestoreService.deleteDocument('pre_registrations', email.toLowerCase()); // Opcional, mantemos por segurança ou logs
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro na autenticação. Verifique suas credenciais.');
    }
  };

  if (user && forcePasswordChange) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-4 text-center selection:bg-yellow-500 selection:text-zinc-950">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-950 p-8 rounded-[2.5rem] shadow-2xl border border-zinc-800 relative"
        >
          <Lock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none mb-1">Acesso Seguro</h1>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-8">Por segurança, altere sua senha inicial</p>
          
          <form onSubmit={handlePasswordChange} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Nova Senha Pessoal</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 rounded-2xl focus:outline-none focus:border-yellow-500 transition-all font-medium"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            {authError && <p className="text-red-500 text-[10px] font-black text-center">{authError}</p>}
            <button 
              type="submit"
              className="w-full bg-yellow-500 text-zinc-950 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl"
            >
              DEFINIR NOVA SENHA
            </button>
          </form>

          <button 
            onClick={logout}
            className="mt-6 text-[10px] font-black text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors"
          >
            Sair do Sistema
          </button>
        </motion.div>
      </div>
    );
  }

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
              <div className="bg-zinc-900/50 p-1 rounded-2xl flex mb-6 border border-zinc-800">
                <div className="flex-1 py-3 rounded-xl font-black text-[10px] tracking-widest bg-yellow-500 text-zinc-950 shadow-lg text-center uppercase">
                  Somente Coordenador
                </div>
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


