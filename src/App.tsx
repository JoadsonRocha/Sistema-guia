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
  Lock,
  Phone,
  LayoutDashboard,
  DollarSign,
  Briefcase,
  Target,
  Wallet,
  History,
  TrendingUp,
  Printer,
  Zap,
  MessageSquare,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processarCaos, gerarBriefingCandidato, processarNotaAudio } from './services/geminiService';
import FinanceDashboard from './components/FinanceDashboard';
import { useAuth } from './lib/FirebaseProvider';
import { firestoreService } from './lib/firestoreService';
import { onSnapshot, doc, collection, query, orderBy, limit, getDocs, where, getDoc } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { validarSugestaoAgenda, AgendaItem } from './lib/agendaLogic';

/// --- COMPONENTE: CARD DE NOTA (ESTILO FÓRUM) ---
function NoteCard({ note, user, isAdmin, onDelete }: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'notes', note.id, 'comments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [note.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await firestoreService.setDocument(`notes/${note.id}/comments`, commentId, {
        id: commentId,
        text: newComment,
        authorId: user.uid,
        authorName: user.displayName || 'Membro Águia',
        createdAt: Date.now()
      });
      setNewComment('');
    } catch (err) {
      console.error("Erro ao comentar:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-zinc-200 rounded-[2rem] p-6 shadow-sm hover:border-yellow-500/50 transition-all flex flex-col h-full text-left"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest leading-none ${note.type === 'private' ? 'bg-zinc-100 text-zinc-500' : 'bg-zinc-950 text-white'}`}>
            {note.type === 'private' ? 'Pessoal' : (note.team || 'Campo')}
          </span>
          {note.type === 'private' && <Lock className="w-3 h-3 text-zinc-400" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(note.createdAt).toLocaleDateString()}</span>
          {(isAdmin || note.leaderId === user?.uid || note.authorId === user?.uid) && (
             <button onClick={onDelete} className="text-zinc-300 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-lg">
               <Trash2 className="w-3.5 h-3.5" />
             </button>
          )}
        </div>
      </div>

      <p className="text-zinc-800 font-bold text-sm leading-relaxed mb-6 italic whitespace-pre-wrap">"{note.text}"</p>

      <div className="mt-auto">
        <div className="pt-4 border-t border-zinc-50 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-500 flex items-center justify-center font-black text-[10px] text-zinc-950 shadow-sm border border-white">
              {(note.leaderName || note.authorName || 'U').charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest leading-none">Registrado por</p>
              <p className="text-[9px] font-black text-zinc-900 uppercase tracking-tight mt-1 leading-none">{note.leaderName || note.authorName}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-lg ${showComments ? 'bg-zinc-950 text-white' : 'text-zinc-400 hover:text-yellow-600'}`}
          >
            <MessageSquare className="w-3 h-3" /> {comments.length}
          </button>
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4 pt-2"
            >
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {comments.length > 0 ? comments.map((comment) => (
                  <div key={comment.id} className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100 group/msg">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[8px] font-black text-zinc-950 uppercase tracking-tighter">{comment.authorName}</span>
                      <span className="text-[7px] font-bold text-zinc-400 uppercase">{new Date(comment.createdAt).toLocaleTimeString().slice(0, 5)}</span>
                    </div>
                    <p className="text-[11px] font-medium text-zinc-600 leading-relaxed">{comment.text}</p>
                  </div>
                )) : (
                  <p className="text-[8px] font-black text-zinc-300 uppercase text-center py-4 tracking-widest italic">Nenhum comentário ainda.</p>
                )}
              </div>
              
              <form onSubmit={handlePostComment} className="flex gap-2 pt-2">
                <input 
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Comentar..."
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-[10px] font-bold text-zinc-800 outline-none focus:border-yellow-500 shadow-inner"
                />
                <button 
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-zinc-950 text-white p-3 rounded-xl active:scale-95 disabled:opacity-50 shadow-lg"
                  type="submit"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/// --- COMPONENTE: DASHBOARD DO COORDENADOR ---
function CoordinatorDashboard() {
  const { user, login, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'finance' | 'agenda' | 'notes'>('overview');
  const [noteSubTab, setNoteSubTab] = useState<'tactical' | 'private'>('tactical');
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
  const [notes, setNotes] = useState<any[]>([]);

  // Profile State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    teams: any[],
    notes: any[],
    agendas: any[]
  }>({ teams: [], notes: [], agendas: [] });

  const [isTeamManagementOpen, setIsTeamManagementOpen] = useState(false);
  const [selectedManagingTeam, setSelectedManagingTeam] = useState<any>(null);
  const [managingTeamVoters, setManagingTeamVoters] = useState<any[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<any>(null);
  const [isVoterEditModalOpen, setIsVoterEditModalOpen] = useState(false);
  const [voterEditForm, setVoterEditForm] = useState({ name: '', phone: '', address: '', observations: '' });

  // Briefing State
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryTeam, setSelectedHistoryTeam] = useState<any>(null);
  const [teamHistory, setTeamHistory] = useState<any[]>([]);
  
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
  const [selectedAgenda, setSelectedAgenda] = useState<any>(null);
  const [isAgendaDetailModalOpen, setIsAgendaDetailModalOpen] = useState(false);
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

    const unsubNotes = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
    const unsubNotesSnap = onSnapshot(unsubNotes, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setProfileData(snapshot.data());
      }
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
      unsubNotesSnap();
    };
  }, [user, isAdmin]);

  // --- GLOBAL SEARCH LOGIC ---
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults({ teams: [], notes: [], agendas: [] });
      return;
    }

    const queryLower = searchQuery.toLowerCase();

    const filteredTeams = teams.filter(t => 
      t.zone?.toLowerCase().includes(queryLower) || 
      t.leaderName?.toLowerCase().includes(queryLower)
    );

    const filteredNotes = notes.filter(n => 
      n.text?.toLowerCase().includes(queryLower) ||
      n.leaderName?.toLowerCase().includes(queryLower) ||
      n.team?.toLowerCase().includes(queryLower)
    );

    const filteredAgendas = agendas.filter(a => 
      a.municipio?.toLowerCase().includes(queryLower) || 
      a.motivo?.toLowerCase().includes(queryLower)
    );

    setSearchResults({
      teams: filteredTeams,
      notes: filteredNotes,
      agendas: filteredAgendas
    });
  }, [searchQuery, teams, notes, agendas]);

  const totalResults = searchResults.teams.length + searchResults.notes.length + searchResults.agendas.length;

  const stats = [
    { 
      label: 'Equipes Ativas', 
      value: teams.length, 
      sub: 'Gestão de Líderes', 
      color: 'text-zinc-900',
      action: () => setActiveTab('teams')
    },
    { 
      label: 'Contatos Base', 
      value: teams.reduce((acc, t) => acc + (t.contacts || 0), 0), 
      sub: 'Monitoramento Real', 
      color: 'text-green-700',
      action: () => setActiveTab('teams')
    },
    { 
      label: 'Agenda Pendente', 
      value: agendas.filter(a => a.status === 'pendente').length, 
      sub: 'Compromissos Hoje', 
      color: 'text-blue-600',
      action: () => setActiveTab('agenda')
    },
    { 
      label: 'Recursos Totais', 
      value: `R$ ${teams.reduce((acc, t) => acc + (t.allocated || 0), 0).toLocaleString()}`, 
      sub: 'Gestão Financeira', 
      color: 'text-yellow-600',
      action: () => setActiveTab('finance')
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

  // Sincronizar eleitores da equipe gerenciada pelo coordenador
  useEffect(() => {
    if (selectedManagingTeam && isAdmin) {
      const leaderEmail = selectedManagingTeam.leaderEmail?.toLowerCase();
      if (!leaderEmail) return;

      const fetchLeaderAndVoters = async () => {
        try {
          const usersRef = collection(db, 'users');
          const qUser = query(usersRef, where('email', '==', leaderEmail));
          const userSnap = await getDocs(qUser);
          
          if (!userSnap.empty) {
            const leaderId = userSnap.docs[0].id;
            const votersRef = collection(db, 'voters');
            const qVoters = query(votersRef, where('leaderId', '==', leaderId));
            
            const unsub = onSnapshot(qVoters, (snapshot) => {
              const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setManagingTeamVoters(data);
            });
            return unsub;
          }
        } catch (err) {
          console.error("Erro ao buscar eleitores da equipe:", err);
        }
      };

      let unsub: any;
      fetchLeaderAndVoters().then(u => unsub = u);
      return () => unsub && unsub();
    }
  }, [selectedManagingTeam, isAdmin]);

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

  const handleSaveAsPrivateNote = async () => {
    if (!user || !chaosText.trim()) return;
    setIsProcessing(true);
    try {
      const noteId = `note_coord_${Date.now()}`;
      await firestoreService.setDocument('notes', noteId, {
        id: noteId,
        text: chaosText,
        authorId: user.uid,
        authorName: profileData?.name || 'Coordenador',
        authorRole: 'coordinator',
        type: 'private',
        createdAt: Date.now()
      });
      setChaosText('');
      setAiResult(null);
      setIsAiModalOpen(false);
      alert('Observação salva na sua área pessoal!');
    } catch (err) {
      console.error(err);
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
        allocated: Number(newTeam.allocated) || 0,
        spent: Number(newTeam.spent) || 0,
        contacts: Number(newTeam.contacts) || 0,
        demands: Number(newTeam.demands) || 0,
        fuel: Number(newTeam.fuel) || 0,
        tempPassword: isEditMode ? ((newTeam as any).tempPassword || defaultPassword) : defaultPassword, // Manter ou criar senha
        updatedAt: Date.now(),
        createdAt: isEditMode ? ((newTeam as any).createdAt || Date.now()) : Date.now()
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
      ...team,
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

  const handleVoterEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoter) return;
    try {
      await firestoreService.updateDocument('voters', selectedVoter.id, voterEditForm);
      setIsVoterEditModalOpen(false);
      setSelectedVoter(null);
      alert("Eleitor atualizado com sucesso!");
    } catch (err: any) {
      alert("Erro ao atualizar eleitor: " + err.message);
    }
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

  const handleShowTeamHistory = async (team: any) => {
    setSelectedHistoryTeam(team);
    setIsHistoryModalOpen(true);
    try {
      const q = query(
        collection(db, 'transactions'),
        where('team', '==', team.name),
        orderBy('date', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeamHistory(data);
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
    }
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-zinc-900 font-sans overflow-hidden">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-zinc-200 py-8 px-6 overflow-y-auto">
        <div className="mb-10 px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-zinc-950 rounded-md shadow-lg">
              <ShieldCheck className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tighter text-zinc-950 uppercase italic leading-none">
                ÁGUIA
              </h1>
              <p className="text-[8px] font-black text-yellow-600 uppercase tracking-widest mt-1">
                Estratégia 2026
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'teams', label: 'Equipes', icon: <Users className="w-4 h-4" /> },
            { id: 'agenda', label: 'Mapa & Agenda', icon: <Calendar className="w-4 h-4" /> },
            { id: 'finance', label: 'Financeiro', icon: <DollarSign className="w-4 h-4" /> },
            { id: 'notes', label: 'Anotações', icon: <MessageSquare className="w-4 h-4" /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === item.id 
                ? 'bg-yellow-500 text-zinc-950 shadow-md' 
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <div className={activeTab === item.id ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-600'}>
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-8 space-y-2">
          <button 
            onClick={() => setIsAiModalOpen(true)}
            className="w-full flex items-center justify-center gap-2.5 bg-zinc-950 text-white p-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg"
          >
            <Brain className="w-4 h-4 text-yellow-500" /> Nova Tarefa IA
          </button>
          
          <div className="pt-6 border-t border-zinc-100 space-y-1">
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-all"
            >
              <Settings className="w-4 h-4" /> Configurações
            </button>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" /> Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB] overflow-hidden relative">
        {/* TOP BAR / COMMAND CENTER */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 z-30 shrink-0">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-full max-w-sm hidden md:block">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-zinc-400" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar zonas, líderes ou demandas..."
                className="w-full bg-zinc-100 border-none rounded-lg py-2 pl-11 pr-4 text-xs font-medium text-zinc-900 placeholder:text-zinc-500 focus:ring-1 focus:ring-yellow-500/20 outline-none transition-all"
              />

              {/* SEARCH RESULTS PANEL */}
              <AnimatePresence>
                {searchQuery.length >= 2 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto p-2"
                  >
                    {totalResults > 0 ? (
                      <div className="p-1 space-y-3">
                        {searchResults.teams.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 mb-1">Equipes / Zonas</p>
                            {searchResults.teams.map(t => (
                              <button key={t.id} onClick={() => { setActiveTab('teams'); setSearchQuery(''); }} className="w-full flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-lg transition-colors text-left">
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center"><Users className="w-4 h-4 text-zinc-900" /></div>
                                <div>
                                  <p className="text-xs font-bold text-zinc-900 uppercase">{t.zone}</p>
                                  <p className="text-[10px] text-zinc-500 uppercase">{t.leaderName}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.agendas.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 mb-1">Agenda / Demandas</p>
                            {searchResults.agendas.map(a => (
                              <button key={a.id} onClick={() => { setActiveTab('agenda'); setSearchQuery(''); }} className="w-full flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-lg transition-colors text-left">
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center"><Calendar className="w-4 h-4 text-zinc-900" /></div>
                                <div>
                                  <p className="text-xs font-bold text-zinc-900 uppercase">{a.motivo}</p>
                                  <p className="text-[10px] text-zinc-500 uppercase">{a.municipio} • {a.data}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.notes.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 mb-1">Notas Táticas</p>
                            {searchResults.notes.map(n => (
                              <button key={n.id} onClick={() => { setActiveTab('notes'); setSearchQuery(''); }} className="w-full flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-lg transition-colors text-left">
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-zinc-900" /></div>
                                <div>
                                  <p className="text-[10px] text-zinc-800 font-medium italic line-clamp-1">"{n.text}"</p>
                                  <p className="text-[8px] text-zinc-400 font-black uppercase tracking-widest leading-none mt-1">{n.leaderName} • {n.team}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Search className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                        <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Sem resultados para "{searchQuery}"</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="lg:hidden flex items-center gap-2">
              <div className="p-1.5 bg-zinc-950 rounded-md">
                <ShieldCheck className="w-4 h-4 text-yellow-500" />
              </div>
              <h1 className="text-base font-black text-zinc-950 uppercase italic leading-none">ÁGUIA</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 px-3 h-10 bg-zinc-50 rounded-lg border border-zinc-100">
               <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>
               <span className="text-[9px] font-black text-zinc-900 uppercase tracking-widest">SINALIZADOR ATIVO</span>
            </div>
            
            <div className="h-8 w-px bg-zinc-200 hidden sm:block"></div>

            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 hover:bg-zinc-50 p-1 rounded-full transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center font-black text-xs text-zinc-950 overflow-hidden shadow-sm border border-zinc-200">
                {profileData?.photoURL ? (
                  <img src={profileData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (profileData?.name || user?.email || 'A').charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-[11px] font-black text-zinc-950 leading-none mb-0.5">{profileData?.name || user?.email?.split('@')[0]}</p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{isAdmin ? 'Coordenador' : 'Agente'}</p>
              </div>
            </button>
          </div>
        </header>

        {/* MOBILE NAVIGATION TABS (REPLACES SIDEBAR ON MOBILE) */}
        <div className="lg:hidden h-14 bg-white border-b border-zinc-200 flex items-center px-4 gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'overview', label: 'Dash' },
            { id: 'teams', label: 'Equipes' },
            { id: 'agenda', label: 'Agenda' },
            { id: 'finance', label: 'Finanças' },
            { id: 'notes', label: 'Notas' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-none px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-yellow-500 text-zinc-950 shadow-sm' : 'text-zinc-500 hover:bg-zinc-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-12 pb-20">
            
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex-col gap-1 flex">
                <h2 className="text-lg font-black text-zinc-950 tracking-tighter uppercase leading-none italic">Painel de Operações</h2>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Monitoramento estratégico em tempo real</p>
              </div>

              {/* STATS GRID */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={stat.action}
                    className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-yellow-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`p-2 bg-zinc-50 rounded-lg group-hover:bg-yellow-500 transition-colors`}>
                        {i === 0 && <Target className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950" />}
                        {i === 1 && <Users className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950" />}
                        {i === 2 && <Calendar className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950" />}
                        {i === 3 && <DollarSign className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950" />}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[7px] font-black py-0.5 px-2 bg-green-100 text-green-700 rounded-md uppercase tracking-widest border border-green-100">Estável</span>
                      </div>
                    </div>
                    <p className="text-xl font-black tracking-tighter text-zinc-950 mb-0.5 leading-none">{stat.value}</p>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.1em]">{stat.label}</p>
                    <div className="mt-4 pt-3 border-t border-zinc-50 flex items-center justify-between">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{stat.sub}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-yellow-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </section>

                <div className="pt-2 flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-5">
                  </div>

                  <div className="w-full lg:w-72 space-y-6">

                    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-black uppercase tracking-tighter text-zinc-950 mb-4 flex items-center gap-2 italic">
                        < Zap className="w-3.5 h-3.5 text-yellow-500" /> Atividade Recente
                      </h3>
                      <div className="space-y-4">
                        {teams.slice(0, 3).map((team, i) => (
                          <div key={i} className="flex gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                              <Users className="w-3.5 h-3.5 text-zinc-500" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-zinc-900 uppercase leading-none">{team.name}</p>
                              <p className="text-[7.5px] font-bold text-zinc-400 mt-1 uppercase tracking-tight">Status OK • {10 + i}m atrás</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'teams' && (
              <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-zinc-200 pb-6">
                  <div>
                    <h2 className="text-2xl font-black uppercase text-zinc-950 tracking-tighter leading-none italic">Gestão de Equipes</h2>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">Controle tático de recursos e unidades</p>
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
                    className="bg-yellow-500 text-zinc-950 px-6 py-3.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2.5 shadow-lg shadow-yellow-500/10 hover:scale-[1.01] active:scale-95 transition-all w-full md:w-auto"
                  >
                    <Plus className="w-4 h-4 text-zinc-950" /> Cadastrar Nova Unidade
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {teams.length > 0 ? teams.map((team) => (
                    <motion.div 
                      key={team.id || team.name} 
                      layout
                      className={`bg-white border ${team.fraudAlert ? 'border-red-600 shadow-md animate-pulse' : 'border-zinc-200'} rounded-2xl p-5 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-zinc-300 transition-all group relative`}
                    >
                      {team.fraudAlert && (
                        <div className="absolute top-0 right-8 bg-red-600 text-white text-[8px] font-black px-6 py-1.5 rounded-b-xl uppercase flex items-center gap-1.5 shadow-lg z-10">
                          <AlertTriangle className="w-3 h-3" /> Alerta Crítico
                        </div>
                      )}
                      
                      <div className="flex items-center gap-5 min-w-[240px]">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-3 ${
                          team.status === 'OK' ? 'bg-green-50 text-green-600' : 
                          team.status === 'ALERTA' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                        }`}>
                          <Users className="w-7 h-7" />
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="font-black text-zinc-950 text-xl uppercase tracking-tighter italic leading-none">{team.name}</h3>
                          <div className="flex flex-col gap-0.5 pt-1">
                            <p className="text-[9px] font-black text-zinc-400 uppercase flex items-center gap-1.5 tracking-widest">
                              <User className="w-2.5 h-2.5 text-yellow-500" /> Líder: {team.leader}
                            </p>
                            <p className="text-[9px] font-black text-zinc-400 uppercase flex items-center gap-1.5 tracking-widest">
                              <MapPin className="w-2.5 h-2.5 text-yellow-500" /> Base: {team.location}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 flex-1 text-left">
                        <div>
                          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5 leading-none">Contatos</p>
                          <p className="text-2xl font-black text-zinc-950 tracking-tighter">{team.contacts || 0}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5 leading-none">Engajamento</p>
                          <p className="text-2xl font-black text-green-600 tracking-tighter leading-none">
                            {Math.min(100, Math.round(((team.contacts || 0) / 100) * 100))}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5 leading-none">Alertas</p>
                          <p className={`text-2xl font-black tracking-tighter leading-none ${team.demands > 0 ? 'text-red-600' : 'text-zinc-200'}`}>{team.demands || 0}</p>
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">Status</p>
                           <span className={`inline-flex items-center gap-1.5 text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border ${
                            team.status === 'OK' ? 'bg-green-50 text-green-700 border-green-100' : 
                            team.status === 'ALERTA' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${team.status === 'OK' ? 'bg-green-500' : team.status === 'ALERTA' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            {team.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col gap-2 justify-end">
                        <div className="flex gap-1.5">
                           <button 
                             onClick={() => handleCopyAccessLink(team)}
                             className="p-3 bg-zinc-50 text-zinc-500 rounded-xl hover:bg-zinc-950 hover:text-white transition-all shadow-sm"
                             title="Copiar Credenciais"
                           >
                             <LogIn className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleEditTeam(team)}
                             className="p-3 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-zinc-950 hover:text-white transition-all shadow-md active:scale-95"
                             title="Editar Unidade"
                           >
                             <Edit3 className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDeleteTeam(team.id || team.name.replace(/\s/g, '_').toLowerCase(), team.name)}
                             className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-md active:scale-95"
                             title="Excluir"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedManagingTeam(team);
                            setIsTeamManagementOpen(true);
                          }}
                          className={`w-full px-5 py-3 rounded-xl font-black text-[9px] uppercase shadow-md transition-all active:translate-y-0.5 ${
                            team.demands > 0 ? 'bg-red-600 text-white' : 'bg-zinc-950 text-white'
                          }`}
                        >
                          Mais Detalhes
                        </button>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="p-20 text-center bg-white rounded-2xl border-2 border-dashed border-zinc-200">
                       <RefreshCcw className="w-10 h-10 text-zinc-200 animate-spin mx-auto mb-4" />
                       <p className="font-black text-zinc-300 uppercase tracking-[0.2em] text-[9px]">Sincronizando unidades...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'agenda' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/10">
                      <Calendar className="w-6 h-6 text-zinc-950" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase text-zinc-950 tracking-tighter leading-none italic">Agenda</h2>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">Logística e compromissos oficiais</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingAgenda(null);
                      setAgendaForm({ municipio: '', data: '', hora_inicio: '', hora_fim: '', motivo: '' });
                      setIsAgendaCreateModalOpen(true);
                    }}
                    className="bg-zinc-950 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-2.5 shadow-xl shadow-zinc-200 hover:scale-[1.01] active:scale-95 transition-all w-full md:w-auto"
                  >
                    <Plus className="w-4 h-4 text-yellow-500" /> Agendar Evento
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                      <h3 className="text-lg font-black uppercase text-zinc-950 tracking-tighter mb-6 flex items-center gap-3 italic">
                        Solicitações
                      </h3>
                      
                      <div className="space-y-4">
                        {agendas.filter(a => a.status === 'pendente').length > 0 ? agendas.filter(a => a.status === 'pendente').map((item) => (
                          <motion.div key={item.id} layout className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 lg:p-6 flex flex-col md:flex-row justify-between items-center gap-6 group">
                            <div className="flex items-center gap-6">
                              <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-zinc-100 flex flex-col items-center min-w-[70px]">
                                <span className="text-[8px] font-black uppercase text-zinc-400 mb-0.5">{new Date(item.data).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                <span className="text-2xl font-black text-zinc-950 leading-none">{new Date(item.data).getDate()}</span>
                              </div>
                              <div className="space-y-1.5">
                                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950 group-hover:text-yellow-600 transition-colors">{item.municipio}</h3>
                                <div className="flex flex-wrap items-center gap-3 text-[9px] font-black text-zinc-400 tracking-widest uppercase">
                                  <span className="flex items-center gap-1.5"><Clock className="w-2.5 h-2.5 text-yellow-500" /> {item.hora_inicio} - {item.hora_fim}</span>
                                  <span className="flex items-center gap-1.5"><User className="w-2.5 h-2.5 text-yellow-500" /> {item.sugeridoPor}</span>
                                </div>
                                {item.motivo && <p className="text-[10px] text-zinc-500 font-bold bg-zinc-100 px-2.5 py-0.5 rounded-md inline-block">{item.motivo}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2.5 w-full md:w-auto">
                              <button 
                                onClick={async () => {
                                  await firestoreService.updateDocument('agenda', item.id, { status: 'negado' });
                                }}
                                className="flex-1 md:flex-none px-6 py-3 bg-red-50 text-red-600 font-black text-[9px] uppercase rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              >
                                Negar
                              </button>
                              <button 
                                onClick={async () => {
                                  await firestoreService.updateDocument('agenda', item.id, { status: 'confirmado' });
                                }}
                                className="flex-1 md:flex-none px-6 py-3 bg-green-600 text-white font-black text-[9px] uppercase rounded-xl shadow-xl shadow-green-100 hover:bg-green-700 transition-all border-b-2 border-green-800 active:border-b-0 active:translate-y-0.5"
                              >
                                Confirmar
                              </button>
                            </div>
                          </motion.div>
                        )) : (
                          <div className="p-12 border border-dashed border-zinc-200 rounded-xl text-center">
                            <CheckCircle2 className="w-8 h-8 text-green-200 mx-auto mb-3" />
                            <p className="font-black text-zinc-300 uppercase tracking-[0.15em] text-[9px]">Nenhuma solicitação pendente.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-zinc-950 rounded-2xl p-6 lg:p-8 text-white shadow-2xl min-h-[500px] relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-5">
                         <Calendar className="w-32 h-32" />
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-tighter mb-6 italic flex items-center gap-3">
                         Cronograma Confirmado
                      </h3>
                      <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {agendas.filter(a => a.status === 'confirmado').sort((a, b) => new Date(`${a.data}T${a.hora_inicio}`).getTime() - new Date(`${b.data}T${b.hora_inicio}`).getTime()).map(item => (
                          <motion.div 
                            key={item.id} 
                            layout
                            onClick={() => {
                              setSelectedAgenda(item);
                              setIsAgendaDetailModalOpen(true);
                            }}
                            className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-5 group cursor-pointer hover:border-yellow-500/50 transition-all"
                          >
                            <div className="flex flex-col items-center justify-center bg-zinc-800 w-12 h-12 rounded-xl shrink-0 group-hover:bg-yellow-500 transition-colors">
                              <span className="text-[8px] font-black uppercase text-zinc-500 group-hover:text-zinc-950 leading-none mb-0.5">{new Date(item.data).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                              <span className="text-xl font-black text-white group-hover:text-zinc-950 leading-none">{new Date(item.data).getDate()}</span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <h4 className="text-base font-black uppercase text-white truncate italic group-hover:text-yellow-500 transition-colors leading-none">{item.municipio}</h4>
                              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <Clock className="w-2.5 h-2.5" /> {item.hora_inicio}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-yellow-500 transition-all" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'finance' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <FinanceDashboard isNested />
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center shadow-sm">
                      <MessageSquare className="w-6 h-6 text-zinc-950" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase text-zinc-950 tracking-tighter leading-none italic">Anotações Táticas</h2>
                      <div className="flex gap-4 mt-4">
                        <button 
                          onClick={() => setNoteSubTab('tactical')}
                          className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${noteSubTab === 'tactical' ? 'bg-zinc-950 text-white shadow-xl' : 'bg-white text-zinc-400 border border-zinc-100 hover:border-zinc-200'}`}
                        >
                          Equipe (Fórum)
                        </button>
                        <button 
                          onClick={() => setNoteSubTab('private')}
                          className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${noteSubTab === 'private' ? 'bg-zinc-950 text-white shadow-xl' : 'bg-white text-zinc-400 border border-zinc-100 hover:border-zinc-200'}`}
                        >
                          Minhas Observações
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {noteSubTab === 'private' && (
                    <button 
                      onClick={() => setIsAiModalOpen(true)}
                      className="bg-yellow-500 text-zinc-950 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-zinc-950 hover:text-white transition-all flex items-center gap-2 italic"
                    >
                      <Plus className="w-4 h-4" /> Nova Observação
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notes.filter(n => noteSubTab === 'private' ? n.type === 'private' : (n.type === 'tactical' || !n.type)).length > 0 ? (
                    notes.filter(n => noteSubTab === 'private' ? n.type === 'private' : (n.type === 'tactical' || !n.type)).map((note) => (
                      <NoteCard key={note.id} note={note} user={user} isAdmin={isAdmin} onDelete={() => firestoreService.deleteDocument('notes', note.id)} />
                    ))
                  ) : (
                    <div className="col-span-full py-20 bg-white border-2 border-dashed border-zinc-200 rounded-2xl text-center">
                      <Clock className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                      <p className="font-black text-zinc-300 uppercase tracking-[0.2em] text-xs">Nenhuma anotação registrada nesta categoria.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>

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
              className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative mb-10 border border-zinc-200"
            >
              <button 
                onClick={() => {
                  setIsAiModalOpen(false);
                  setAiResult(null);
                  setChaosText('');
                }}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-lg text-zinc-500 active:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="bg-yellow-500 p-6">
                <Brain className="w-10 h-10 text-zinc-950 mb-4" />
                <h2 className="text-xl font-black text-zinc-950 tracking-tighter uppercase leading-none italic">Análise de IA</h2>
                <p className="text-zinc-900 text-[10px] font-black mt-2 uppercase tracking-widest leading-tight">Mapeamento Estratégico de Demandas</p>
              </div>

              <div className="p-6">
                {!aiResult ? (
                  <div className="space-y-4">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Relato de Campo</label>
                    <textarea 
                      value={chaosText}
                      onChange={(e) => setChaosText(e.target.value)}
                      placeholder="Descreva a situação em tempo real..."
                      className="w-full h-40 bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-bold text-xs text-zinc-800 focus:border-yellow-500 outline-none transition-all placeholder:text-zinc-300 resize-none"
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={handleProcessCaos}
                        disabled={isProcessing || !chaosText}
                        className="flex-1 bg-zinc-950 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-950 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4 cursor-pointer" />}
                        {isProcessing ? 'Processando...' : 'Analisar IA'}
                      </button>
                      <button 
                        onClick={handleSaveAsPrivateNote}
                        disabled={isProcessing || !chaosText}
                        className="flex-1 bg-zinc-100 text-zinc-900 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Salvar Nota
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* RESULTADOS DA IA */}
                    {aiResult.tarefas_logistica?.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-600">
                        <h4 className="text-blue-700 font-black text-[9px] uppercase mb-2 flex items-center gap-2 tracking-widest leading-none">
                          <Fuel className="w-3.5 h-3.5" /> Logística
                        </h4>
                        <ul className="space-y-1.5">
                          {aiResult.tarefas_logistica.map((t: string, i: number) => (
                            <li key={i} className="text-[11px] font-bold text-zinc-800 flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiResult.acoes_politicas?.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-600">
                        <h4 className="text-green-700 font-black text-[9px] uppercase mb-2 flex items-center gap-2 tracking-widest leading-none">
                          <Brain className="w-3.5 h-3.5" /> Ações Planejadas
                        </h4>
                        <ul className="space-y-1.5">
                          {aiResult.acoes_politicas.map((t: string, i: number) => (
                            <li key={i} className="text-[11px] font-bold text-zinc-800 flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiResult.alertas_crise?.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-600">
                        <h4 className="text-red-700 font-black text-[9px] uppercase mb-2 flex items-center gap-2 tracking-widest leading-none">
                          <AlertTriangle className="w-3.5 h-3.5" /> Alertas
                        </h4>
                        <ul className="space-y-1.5">
                          {aiResult.alertas_crise.map((t: string, i: number) => (
                            <li key={i} className="text-[11px] font-bold text-red-900 flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-red-600 mt-1.5 flex-shrink-0"></div>
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
                      className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/10 hover:bg-green-700 transition-all mb-2"
                    >
                      CONFIRMAR DELEGAÇÃO
                    </button>
                    <button 
                      onClick={() => {
                        const summary = Array.isArray(aiResult.summary) ? aiResult.summary.join('. ') : aiResult.summary;
                        setChaosText(`${aiResult.title}: ${summary}`);
                        handleSaveAsPrivateNote();
                      }}
                      className="w-full bg-zinc-950 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-950 transition-all"
                    >
                      Salvar como Nota Pessoal
                    </button>
                    <button 
                      onClick={() => setAiResult(null)}
                      className="w-full text-zinc-400 font-black text-[8px] uppercase py-2 tracking-widest hover:text-zinc-600 transition-colors"
                    >
                      Ajustar Relato
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
                className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-200"
              >
                <button 
                  onClick={() => setIsUrgencyModalOpen(false)}
                  className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-lg text-zinc-500 z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className={`p-6 ${selectedUrgency.type === 'combustivel' ? 'bg-blue-600' : selectedUrgency.type === 'demanda' ? 'bg-yellow-500' : 'bg-red-600'}`}>
                  <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none italic">{selectedUrgency.title}</h2>
                  <p className="text-white/70 text-[9px] font-black mt-2 uppercase tracking-widest leading-none">{selectedUrgency.leaderName} • {selectedUrgency.team}</p>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block mb-2 leading-none italic">Relato de Campo</label>
                    <p className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-700 italic leading-relaxed">
                      "{selectedUrgency.description}"
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block leading-none italic">Feedback Estratégico</label>
                    <textarea 
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      placeholder="Oriente o líder regional..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-bold text-xs text-zinc-800 outline-none focus:border-zinc-950 transition-all h-28 resize-none placeholder:text-zinc-300"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
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
                      className="bg-red-50 text-red-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm shadow-red-500/5 active:scale-95"
                    >
                      Negar
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
                      className="bg-green-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/10 hover:bg-zinc-950 transition-all active:scale-95"
                    >
                      Aprovar
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
              className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => {
                  setIsTeamModalOpen(false);
                  setTeamCreationStep('form');
                }}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="bg-zinc-950 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none italic">
                  {teamCreationStep === 'form' ? (isEditMode ? 'Editar Unidade' : 'Cadastrar Unidade') : 'Unidade Ativada'}
                </h2>
                <p className="text-zinc-400 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">
                  {teamCreationStep === 'form' ? (isEditMode ? 'Ajuste de Inteligência' : 'Definição de Base Estratégica') : 'Credencial Digital Gerada'}
                </p>
              </div>

              {teamCreationStep === 'form' ? (
                <form onSubmit={handleCreateTeam} className="p-6 space-y-4 text-left font-sans">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Identificação da Equipe</label>
                    <input 
                      required
                      type="text" 
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                      placeholder="Ex: Tropa de Elite"
                      disabled={isEditMode}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all disabled:opacity-50 placeholder:text-zinc-300"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 text-left block">Responsável Regional</label>
                    <input 
                      required
                      type="text" 
                      value={newTeam.leader}
                      onChange={(e) => setNewTeam({...newTeam, leader: e.target.value})}
                      placeholder="Nome Completo"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                      <input 
                        required
                        type="email" 
                        value={newTeam.leaderEmail}
                        onChange={(e) => setNewTeam({...newTeam, leaderEmail: e.target.value})}
                        placeholder="lider@sistema.org"
                        disabled={isEditMode}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all disabled:opacity-50 placeholder:text-zinc-300"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">WhatsApp</label>
                      <input 
                        required
                        type="tel" 
                        value={newTeam.leaderPhone}
                        onChange={(e) => setNewTeam({...newTeam, leaderPhone: e.target.value})}
                        placeholder="(00) 00000-0000"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Base / Polo</label>
                      <input 
                        required
                        type="text" 
                        value={newTeam.location}
                        onChange={(e) => setNewTeam({...newTeam, location: e.target.value})}
                        placeholder="Ex: Boa Vista - Polo Sul"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Endereço Físico</label>
                      <input 
                        required
                        type="text" 
                        value={newTeam.leaderAddress}
                        onChange={(e) => setNewTeam({...newTeam, leaderAddress: e.target.value})}
                        placeholder="Logradouro completo"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Briefing Estratégico</label>
                    <textarea 
                      value={newTeam.observations}
                      onChange={(e) => setNewTeam({...newTeam, observations: e.target.value})}
                      placeholder="Diretrizes e observações cruciais..."
                      maxLength={1000}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-yellow-500 transition-all h-24 placeholder:text-zinc-300 resize-none"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full bg-zinc-950 text-yellow-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-zinc-950/10 hover:bg-zinc-900 transition-all active:scale-[0.98] mt-2 italic"
                  >
                    {isEditMode ? 'SALVAR ALTERAÇÕES' : 'EFETIVAR CADASTRO'}
                  </button>
                </form>
              ) : (
                <div className="p-8 space-y-6 text-center">
                  <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-100">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter italic">Credenciais Geradas</h3>
                  <p className="text-zinc-500 text-xs font-bold leading-relaxed px-4">
                    Transmita o link de segurança abaixo para <span className="text-zinc-950">{newTeam.leader}</span>. Acesso imediato e restrito via Token Único.
                  </p>
                  
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 break-all text-[9px] font-mono font-black text-blue-600 select-all italic">
                    {createdTeamLink}
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(createdTeamLink);
                        alert("Link copiado!");
                      }}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-95"
                    >
                      Copiar Link de Segurança
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
                      className="w-full bg-zinc-100 text-zinc-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all"
                    >
                      Fechar
                    </button>
                  </div>
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
              className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsAgendaCreateModalOpen(false)}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="bg-yellow-500 p-6">
                <h2 className="text-xl font-black text-zinc-950 tracking-tighter uppercase leading-none italic">
                  {editingAgenda ? 'Editar Evento' : 'Novo Evento Estratégico'}
                </h2>
                <p className="text-zinc-900 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Cronograma Oficial de Campanha</p>
              </div>

              <form onSubmit={handleCreateOrUpdateAgenda} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Localidade / Município</label>
                  <input 
                    required
                    type="text" 
                    value={agendaForm.municipio}
                    onChange={(e) => setAgendaForm({...agendaForm, municipio: e.target.value})}
                    placeholder="Ex: Boa Vista / Centro"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Data da Operação</label>
                  <input 
                    required
                    type="date" 
                    value={agendaForm.data}
                    onChange={(e) => setAgendaForm({...agendaForm, data: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Início</label>
                    <input 
                      required
                      type="time" 
                      value={agendaForm.hora_inicio}
                      onChange={(e) => setAgendaForm({...agendaForm, hora_inicio: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Fim</label>
                    <input 
                      required
                      type="time" 
                      value={agendaForm.hora_fim}
                      onChange={(e) => setAgendaForm({...agendaForm, hora_fim: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Objetivo / Atividade</label>
                   <textarea 
                     value={agendaForm.motivo}
                     onChange={(e) => setAgendaForm({...agendaForm, motivo: e.target.value})}
                     placeholder="Breve descrição do objetivo..."
                     className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-yellow-500 transition-all h-24 resize-none placeholder:text-zinc-300"
                   />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-zinc-950 text-yellow-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl border-zinc-950 hover:bg-zinc-900 transition-all mt-2 italic"
                >
                  {editingAgenda ? 'ATUALIZAR CRONOGRAMA' : 'PUBLICAR EVENTO'}
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

      {/* MODAL: GESTÃO DE EQUIPE (DETALHAMENTO) */}
      <AnimatePresence>
        {isTeamManagementOpen && selectedManagingTeam && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-zinc-950/95 backdrop-blur-xl p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 40 }}
              className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => {
                  setIsTeamManagementOpen(false);
                  setSelectedManagingTeam(null);
                  setManagingTeamVoters([]);
                }} 
                className="absolute top-8 right-8 bg-zinc-100 p-3 rounded-full text-zinc-500 hover:bg-zinc-200 transition-all z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-10 border-b-8 border-yellow-500 text-left">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="bg-yellow-500 text-zinc-950 w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl shadow-lg shadow-yellow-500/20">
                      {selectedManagingTeam.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-2">{selectedManagingTeam.name}</h2>
                      <div className="flex items-center gap-4 text-zinc-400 font-bold uppercase text-[10px] tracking-widest">
                         <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedManagingTeam.location}</span>
                         <span className="bg-zinc-800 px-2 py-0.5 rounded text-green-400">Ativa</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => handleEditTeam(selectedManagingTeam)}
                       className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-700 hover:bg-zinc-700 shadow-lg"
                     >
                       Editar Equipe
                     </button>
                     <button 
                       onClick={() => handleDeleteTeam(selectedManagingTeam.id || selectedManagingTeam.name.toLowerCase(), selectedManagingTeam.name)}
                       className="bg-red-950/30 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-900/20 hover:bg-red-900/40"
                     >
                       Excluir Equipe
                     </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-1 space-y-8">
                     <div className="bg-zinc-50 p-6 rounded-[2rem] border-2 border-zinc-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Líder e Contato</p>
                        <div className="flex items-center gap-4 mb-6">
                           <div className="bg-zinc-200 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-zinc-600">
                              {selectedManagingTeam.leader.charAt(0).toUpperCase()}
                           </div>
                           <div className="text-left font-sans">
                              <p className="font-black text-zinc-900 leading-none mb-1 uppercase tracking-tight">{selectedManagingTeam.leader}</p>
                              <button 
                                onClick={() => window.open(`https://wa.me/55${selectedManagingTeam.leaderPhone?.replace(/\D/g, '')}`, '_blank')}
                                className="text-blue-600 text-xs font-black flex items-center gap-1 hover:underline"
                              >
                                {selectedManagingTeam.leaderPhone} <Phone className="w-3 h-3" />
                              </button>
                           </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-zinc-200 font-sans">
                           <div className="flex justify-between items-center text-left">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase">E-mail de Acesso</span>
                              <span className="text-xs font-black text-zinc-600 break-all ml-4 line-clamp-1">{selectedManagingTeam.leaderEmail}</span>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 font-sans">
                        <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-center">
                           <p className="text-2xl font-black text-green-700 leading-none">{managingTeamVoters.length}</p>
                           <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mt-2">Membros</p>
                        </div>
                        <div className="bg-zinc-900 p-6 rounded-3xl text-center">
                           <p className="text-2xl font-black text-yellow-500 leading-none">ATIVO</p>
                           <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-2">Status</p>
                        </div>
                     </div>
                  </div>

                  <div className="lg:col-span-2 text-left font-sans">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tighter flex items-center gap-3">
                           Membros Cadastrados <span className="bg-zinc-100 text-zinc-400 px-3 py-1 rounded-full text-xs">{managingTeamVoters.length}</span>
                        </h3>
                     </div>

                     <div className="space-y-3">
                        {managingTeamVoters.length > 0 ? (
                          managingTeamVoters.sort((a,b) => a.name.localeCompare(b.name)).map((vx) => (
                           <div key={vx.id} className="group bg-white p-5 rounded-3xl border-2 border-zinc-100 hover:border-yellow-500 transition-all flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-4">
                                 <div className="bg-zinc-100 group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-colors w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg">
                                    {vx.name.charAt(0).toUpperCase()}
                                 </div>
                                 <div>
                                    <p className="font-black text-zinc-950 text-base uppercase tracking-tight leading-none mb-1">{vx.name}</p>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{vx.phone} • {vx.address}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <button 
                                   onClick={() => {
                                      const cleanPhone = vx.phone.replace(/\D/g, '');
                                      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
                                   }}
                                   className="p-3 bg-zinc-50 rounded-xl text-zinc-400 hover:text-green-600 hover:bg-green-50 transition-all"
                                 >
                                    <Phone className="w-4 h-4" />
                                 </button>
                                 <button 
                                   onClick={() => {
                                      setVoterEditForm({
                                        name: vx.name,
                                        phone: vx.phone,
                                        address: vx.address,
                                        observations: vx.observations || ''
                                      });
                                      setSelectedVoter(vx);
                                      setIsVoterEditModalOpen(true);
                                   }}
                                   className="p-3 bg-zinc-50 rounded-xl text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                 >
                                    <Edit3 className="w-4 h-4" />
                                 </button>
                                 <button 
                                   onClick={async () => {
                                      if(window.confirm(`Remover o eleitor ${vx.name}?`)) {
                                         try {
                                            await firestoreService.deleteDocument('voters', vx.id);
                                            alert("Membro removido com sucesso!");
                                         } catch (err: any) {
                                            alert("Erro ao excluir: " + err.message);
                                         }
                                      }
                                   }}
                                   className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-md transition-all active:scale-95"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                        ))) : (
                           <div className="py-20 text-center bg-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-200">
                              <p className="font-black text-zinc-300 uppercase tracking-widest italic">Nenhum eleitor registrado por este líder ainda.</p>
                           </div>
                        )}
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: EDITAR ELEITOR (COORDENADOR) */}
      <AnimatePresence>
        {isVoterEditModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => {
                   setIsVoterEditModalOpen(false);
                   setSelectedVoter(null);
                }} 
                className="absolute top-5 right-5 bg-zinc-100 p-2 rounded-full text-zinc-500 hover:bg-zinc-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="bg-zinc-950 p-6 border-b-4 border-yellow-500 text-left">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">
                  Editar Eleitor
                </h2>
                <p className="text-zinc-400 text-[10px] font-bold mt-2 uppercase tracking-widest">Base de dados da equipe {selectedManagingTeam?.name}</p>
              </div>
              <form onSubmit={handleVoterEditSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input required type="text" value={voterEditForm.name} onChange={e => setVoterEditForm({...voterEditForm, name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm" placeholder="Digite o nome..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                  <input type="text" value={voterEditForm.phone} onChange={e => setVoterEditForm({...voterEditForm, phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm" placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Endereço / Referência</label>
                  <input type="text" value={voterEditForm.address} onChange={e => setVoterEditForm({...voterEditForm, address: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm" placeholder="Rua, Bairro, N..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Observações Estratégicas</label>
                  <textarea value={voterEditForm.observations} onChange={e => setVoterEditForm({...voterEditForm, observations: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm h-24" placeholder="Ex: Prioritário, transporte necessário..."></textarea>
                </div>
                
                <button type="submit" className="w-full bg-zinc-950 text-white py-4 rounded-xl font-black text-base shadow-xl shadow-zinc-200 mt-2 active:scale-95 transition-all">
                  SALVAR ALTERAÇÕES
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsProfileModalOpen(false)} 
                className="absolute top-5 right-5 bg-zinc-100 p-2 rounded-full text-zinc-500 hover:bg-zinc-200 z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="bg-zinc-950 p-6 border-b-4 border-yellow-500 text-left">
                <div className="flex items-center gap-4">
                   <div className="relative group">
                      <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center border-2 border-zinc-700 overflow-hidden">
                         {profileData?.photoUrl ? (
                           <img src={profileData.photoUrl} alt="Perfil" className="w-full h-full object-cover" />
                         ) : (
                           <User className="w-8 h-8 text-zinc-600" />
                         )}
                      </div>
                      <button className="absolute -bottom-1 -right-1 bg-yellow-500 p-1.5 rounded-lg text-zinc-950 shadow-lg hover:scale-110 transition-all">
                         <Camera className="w-3.5 h-3.5" />
                      </button>
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">
                        Meu Perfil
                      </h2>
                      <p className="text-yellow-500 text-[8px] font-black mt-2 uppercase tracking-widest">Acesso de Coordenação Geral</p>
                   </div>
                </div>
              </div>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const updates = {
                    name: formData.get('name') as string,
                    phone: formData.get('phone') as string,
                    bio: formData.get('bio') as string,
                    updatedAt: Date.now()
                  };
                  try {
                    await firestoreService.setDocument('users', user?.uid || '', updates, true);
                    setIsProfileModalOpen(false);
                    alert("Perfil atualizado com sucesso!");
                  } catch (err: any) {
                    alert("Erro ao atualizar perfil: " + err.message);
                  }
                }} 
                className="p-6 space-y-3.5 text-left font-sans"
              >
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input defaultValue={profileData?.name} name="name" type="text" className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm" placeholder="Seu nome real..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Telefone Profissional</label>
                  <input defaultValue={profileData?.phone} name="phone" type="text" className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm" placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cargo / Biografia</label>
                  <textarea defaultValue={profileData?.bio} name="bio" className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm h-24" placeholder="Ex: Coordenador de Logística e Transmissão..."></textarea>
                </div>
                
                <button type="submit" className="w-full bg-zinc-950 text-white py-4 rounded-xl font-black text-base shadow-xl shadow-zinc-200 mt-2 active:scale-95 transition-all">
                  SALVAR CONFIGURAÇÕES
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAgendaDetailModalOpen && selectedAgenda && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAgendaDetailModalOpen(false)}
                className="absolute top-8 right-8 bg-zinc-100 p-2 rounded-full text-zinc-500 hover:bg-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-12 text-left">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-yellow-500 rounded-3xl flex flex-col items-center justify-center text-zinc-950 text-center">
                      <span className="text-[10px] font-black uppercase leading-none">{new Date(selectedAgenda.data).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                      <span className="text-3xl font-black">{new Date(selectedAgenda.data).getDate()}</span>
                   </div>
                   <div>
                      <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                        Compromisso Oficial
                      </h2>
                      <p className="text-yellow-500 text-xs font-black mt-2 uppercase tracking-widest">{selectedAgenda.municipio}</p>
                   </div>
                </div>
              </div>

              <div className="p-12 space-y-8 text-left">
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Horário</p>
                      <p className="text-lg font-black text-zinc-900">{selectedAgenda.hora_inicio} às {selectedAgenda.hora_fim}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Equipe Responsável</p>
                      <p className="text-lg font-black text-zinc-900">{selectedAgenda.sugeridoPor}</p>
                   </div>
                </div>

                <div className="bg-zinc-50 p-8 rounded-3xl border-2 border-zinc-100">
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Objetivo Estratégico</p>
                   <p className="text-xl font-bold text-zinc-700 leading-relaxed italic">
                      "{selectedAgenda.motivo || 'Nenhum motivo detalhado informado.'}"
                   </p>
                </div>

                <div className="flex items-center gap-4 pt-4">
                   <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl flex items-center gap-3 flex-1 border border-blue-100">
                      <Users className="w-6 h-6" />
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-tighter">Mobilização</p>
                         <p className="text-sm font-bold">Equipe e Membros</p>
                      </div>
                   </div>
                   <div className="p-4 bg-green-50 text-green-600 rounded-2xl flex items-center gap-3 flex-1 border border-green-100">
                      <CheckCircle2 className="w-6 h-6" />
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-tighter">Status</p>
                         <p className="text-sm font-bold">Agenda Confirmada</p>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHistoryModalOpen && selectedHistoryTeam && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="absolute top-8 right-8 bg-zinc-100 p-2 rounded-full text-zinc-500 hover:bg-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-10 border-b-4 border-yellow-500 text-left">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                  Histórico Estratégico
                </h2>
                <p className="text-yellow-500 text-xs font-black mt-2 uppercase tracking-widest">Equipe: {selectedHistoryTeam.name}</p>
              </div>

              <div className="p-10 space-y-6 text-left max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                   <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Contatos</p>
                      <p className="text-xl font-black">{selectedHistoryTeam.contacts || 0}</p>
                   </div>
                   <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest text-center">Alocado</p>
                      <p className="text-xl font-black text-blue-600">R$ {selectedHistoryTeam.allocated || 0}</p>
                   </div>
                   <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest text-center">Gasto</p>
                      <p className="text-xl font-black text-red-600">R$ {selectedHistoryTeam.spent || 0}</p>
                   </div>
                   <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest text-center">Ponto</p>
                      <p className="text-sm font-black text-green-600">OK (98%)</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Últimas Movimentações Financeiras</h3>
                   {teamHistory.length > 0 ? teamHistory.map((tx: any) => (
                     <div key={tx.id} className="p-4 bg-white border border-zinc-100 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="text-left">
                           <p className="text-sm font-black uppercase text-zinc-800">{tx.description || 'Movimentação sem descrição'}</p>
                           <p className="text-[10px] text-zinc-500 italic">{tx.purpose || 'Uso operacional'}</p>
                        </div>
                        <div className="text-right">
                           <p className={`font-black text-sm ${tx.type === 'alocacao' ? 'text-blue-600' : 'text-red-600'}`}>
                             {tx.type === 'alocacao' ? '+' : '-'} R$ {tx.amount?.toLocaleString()}
                           </p>
                           <p className="text-[9px] text-zinc-400">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                     </div>
                   )) : (
                     <p className="text-center py-10 text-zinc-400 text-[10px] font-black uppercase italic">Nenhuma movimentação para esta equipe.</p>
                   )}
                </div>
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
  const [activeTab, setActiveTab] = useState<'equipe' | 'logistica' | 'ouvidoria' | 'financeiro' | 'notas'>('logistica');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Notas State
  const [notes, setNotes] = useState<any[]>([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingNote, setIsProcessingNote] = useState(false);

  // Finance State for Leader
  const [teamTransactions, setTeamTransactions] = useState<any[]>([]);
  const [isSignReceiptModalOpen, setIsSignReceiptModalOpen] = useState(false);
  const [selectedTxToSign, setSelectedTxToSign] = useState<any>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isExpenseVoucherModalOpen, setIsExpenseVoucherModalOpen] = useState(false);
  const [selectedExpenseForVoucher, setSelectedExpenseForVoucher] = useState<any>(null);
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', purpose: '' });
  
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
  const [voters, setVoters] = useState<any[]>([]);
  const [myAgendas, setMyAgendas] = useState<any[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<any>(null);
  const [isVoterDetailOpen, setIsVoterDetailOpen] = useState(false);
  const [isEditingVoter, setIsEditingVoter] = useState(false);
  const [editingVoterId, setEditingVoterId] = useState<string | null>(null);

  // Sincronizar Perfil, Time e Eleitores com Firestore
  useEffect(() => {
    if (user) {
      let unsubTx: (() => void) | null = null;
      
      const unsubProfile = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const teamName = data.teamName || data.zone || data.team || '';
          setProfileData({
            name: data.name || user.displayName || '',
            zone: teamName
          });
          
          if (data.teamId) {
            const teamSnap = await getDoc(doc(db, 'teams', data.teamId));
            if (teamSnap.exists()) {
              setTeamData({ ...teamSnap.data(), id: teamSnap.id });
            }
          }

          // Subscribe to transactions whenever team info is available
          if (teamName) {
            if (unsubTx) unsubTx();
            const txQuery = query(collection(db, 'transactions'), where('team', '==', teamName));
            unsubTx = onSnapshot(txQuery, (snapshot) => {
              const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
              setTeamTransactions(txs.sort((a, b) => (b.date || 0) - (a.date || 0)));
            }, (err) => {
              console.error("Erro ao escutar transações da equipe:", err);
            });
          }
        }
      }, (error) => {
        console.error("Erro ao escutar perfil:", error);
      });

      const votersQuery = query(collection(db, 'voters'), where('leaderId', '==', user.uid));
      const unsubVoters = onSnapshot(votersQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVoters(data);
      }, (err) => {
        console.error("Erro ao escutar eleitores:", err);
      });

      const agendasQuery = query(collection(db, 'agenda'), where('sugeridoPorId', '==', user.uid));
      const unsubAgendas = onSnapshot(agendasQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyAgendas(data);
      }, (err) => {
        console.error("Erro ao escutar agendas do líder:", err);
      });

      const notesQuery = query(collection(db, 'notes'), where('leaderId', '==', user.uid), orderBy('createdAt', 'desc'));
      const unsubNotes = onSnapshot(notesQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotes(data);
      }, (err) => {
        console.error("Erro ao escutar notas:", err);
      });

      return () => {
        unsubProfile();
        unsubVoters();
        unsubAgendas();
        unsubNotes();
        if (unsubTx) unsubTx();
      };
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

  const handleDeleteVoter = async (voterId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este eleitor? Esta ação é irreversível.")) {
      try {
        await firestoreService.deleteDocument('voters', voterId);
        setIsVoterDetailOpen(false);
        setSelectedVoter(null);
        alert("Eleitor excluído com sucesso.");
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  const handleVoterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Usuário não autenticado.");
      return;
    }

    try {
      if (isEditingVoter && editingVoterId) {
        await firestoreService.updateDocument('voters', editingVoterId, {
          ...voterForm,
          updatedAt: Date.now()
        });
        alert("✅ CADASTRO ATUALIZADO COM SUCESSO!");
      } else {
        const payload = {
          ...voterForm,
          leaderId: user.uid,
          leaderName: profileData.name || user.displayName || "Líder",
          team: profileData.zone || "Base",
          createdAt: Date.now(),
          registeredBy: user.email || user.uid,
          location: null
        };
        await firestoreService.setDocument('voters', `voter_${Date.now()}`, payload);
        alert("✅ CADASTRO REALIZADO COM SUCESSO!");
      }
      
      setIsVoterModalOpen(false);
      setIsEditingVoter(false);
      setEditingVoterId(null);
      setVoterForm({ name: '', phone: '', address: '', observations: '' });
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
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

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !teamData) return;
    
    const val = parseFloat(expenseForm.amount);
    if (isNaN(val) || val <= 0) return;

    // Check balance
    const currentBalance = (teamData.allocated || 0) - (teamData.spent || 0);
    if (val > currentBalance) {
      alert(`⚠️ SALDO INSUFICIENTE!\nSeu saldo atual é de R$ ${currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      return;
    }

    try {
      // 1. Update Team Spent
      await firestoreService.updateDocument('teams', teamData.id, {
        spent: (teamData.spent || 0) + val
      });

      // 2. Create Transaction
      const txId = `tx_spent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await firestoreService.setDocument('transactions', txId, {
        id: txId,
        type: 'gasto',
        amount: val,
        team: teamData.name,
        description: expenseForm.description,
        purpose: expenseForm.purpose,
        date: Date.now()
      });

      setIsExpenseModalOpen(false);
      setExpenseForm({ amount: '', description: '', purpose: '' });
      alert("✅ GASTO REGISTRADO COM SUCESSO!");
    } catch (err: any) {
      alert("Erro ao registrar gasto: " + err.message);
    }
  };

  const handleSignReceipt = async (tx: any) => {
    if (!window.confirm("⚠️ CONFIRMAÇÃO DE RECEBIMENTO\nAo assinar, você confirma que recebeu integralmente este recurso e assume a responsabilidade pela prestação de contas.")) {
      return;
    }
    
    try {
      await firestoreService.updateDocument('transactions', tx.id, {
        receiptStatus: 'assinado',
        signedAt: Date.now(),
        signedBy: profileData.name || user?.displayName || user?.email
      });
      setIsSignReceiptModalOpen(false);
      alert("✅ RECIBO ASSINADO DIGITALMENTE!");
    } catch (err: any) {
      alert("Erro ao assinar recibo: " + err.message);
    }
  };

  const startVoiceNote = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz direto. Por favor, digite sua nota.");
      setIsNoteModalOpen(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setIsNoteModalOpen(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setNoteText(speechToText);
    };

    recognition.onerror = (event: any) => {
      console.error("Erro no reconhecimento de voz:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleNoteSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !noteText.trim()) return;

    setIsProcessingNote(true);
    try {
      const processedNote = await processarNotaAudio(noteText);
      const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await firestoreService.setDocument('notes', noteId, {
        id: noteId,
        text: processedNote,
        originalText: noteText,
        leaderId: user.uid,
        leaderName: profileData.name,
        team: profileData.zone,
        type: 'tactical',
        createdAt: Date.now()
      });
      setNoteText('');
      setIsNoteModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      alert("Erro ao salvar nota.");
    } finally {
      setIsProcessingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm("Deseja excluir esta nota?")) {
      await firestoreService.deleteDocument('notes', id);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans selection:bg-yellow-500 selection:text-zinc-950 flex overflow-hidden">
      
      {/* SIDEBAR - DESKTOP ONLY */}
      <aside className="hidden lg:flex w-72 bg-zinc-950 border-r border-white/5 flex-col flex-shrink-0 relative z-20">
        <div className="p-6 border-b border-white/5 bg-gradient-to-br from-zinc-900 to-black">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-yellow-500 p-2.5 rounded-xl shadow-lg shadow-yellow-500/10">
              <ShieldCheck className="w-6 h-6 text-zinc-950" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tighter leading-none italic uppercase">Rede Águia</h2>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Líder Regional</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-all">
              <User className="w-16 h-16" />
            </div>
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Perfil Ativo</p>
            <h3 className="text-xs font-black text-white uppercase truncate">
              {profileData.name || user?.displayName || 'LÍDER'}
            </h3>
            <p className="text-[8px] font-bold text-yellow-500 mt-2 uppercase tracking-tighter">
              {profileData.zone || 'SETOR NÃO DEFINIDO'}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto custom-scrollbar">
          {[
            { id: 'logistica', label: 'Painel Tático', icon: <MapPin className="w-4 h-4" /> },
            { id: 'equipe', label: 'Base de Eleitores', icon: <Users className="w-4 h-4" /> },
            { id: 'financeiro', label: 'Operacional Financeiro', icon: <Wallet className="w-4 h-4" /> },
            { id: 'notas', label: 'Notas de Voz', icon: <Mic className="w-4 h-4" /> },
            { id: 'ouvidoria', label: 'Feed de Atividade', icon: <History className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all group ${
                activeTab === tab.id 
                ? 'bg-yellow-500 text-zinc-950 shadow-xl shadow-yellow-500/10' 
                : 'text-zinc-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={`${activeTab === tab.id ? 'text-zinc-950' : 'text-zinc-600 group-hover:text-yellow-500'} transition-colors`}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-5 border-t border-white/5">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-red-500/10 text-red-500 font-black text-[9px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-lg"
          >
            <LogOut className="w-3.5 h-3.5" /> Desligar Terminal
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 px-6 lg:px-10 flex items-center justify-between flex-shrink-0 relative z-30">
          <div className="flex items-center gap-3 lg:hidden">
            <ShieldCheck className="w-6 h-6 text-yellow-500" />
            <h1 className="font-black text-base uppercase tracking-tighter italic">Líder Águia</h1>
          </div>

          <div className="hidden lg:flex items-center gap-3">
             <div className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-full border border-yellow-500/20 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                Setor: {profileData.zone || 'Identificando...'}
             </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                isOnline 
                ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4 animate-pulse" /> : <CloudOff className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                {isOnline ? 'Conexão Segura' : 'Modo Offline Ativo'}
              </span>
            </div>

            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 hover:bg-zinc-800 hover:text-yellow-500 transition-all shadow-xl"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-12 custom-scrollbar pb-32 lg:pb-12 bg-gradient-to-b from-[#0A0A0A] to-zinc-950">
          <div className="max-w-6xl mx-auto space-y-10">
            
            {activeTab === 'logistica' ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                {isLocating && (
                  <div className="bg-yellow-500/10 border-2 border-yellow-500/20 text-yellow-500 p-6 rounded-3xl text-center flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.2em] shadow-2xl">
                    <RefreshCcw className="w-6 h-6 animate-spin" /> Verificando Assinatura de GPS e Segurança de Campo...
                  </div>
                )}

                {teamData?.observations && (
                  <section className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all pointer-events-none">
                      <StickyNote className="w-32 h-32 text-zinc-900 rotate-12" />
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-zinc-950 p-3 rounded-2xl"><StickyNote className="w-6 h-6 text-yellow-500" /></div>
                      <h3 className="text-zinc-950 font-black text-xl uppercase tracking-tighter italic">Comunicações da Central</h3>
                    </div>
                    <p className="text-zinc-600 font-bold text-lg leading-relaxed whitespace-pre-wrap pl-2 border-l-4 border-yellow-500">
                      {teamData.observations}
                    </p>
                  </section>
                )}

                <section className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                  {[
                    { id: 'ponto', label: 'Assinar Ponto', sub: 'GEOLOCALIZAÇÃO', icon: <Camera className="w-8 h-8 lg:w-10 lg:h-10" />, color: 'yellow' },
                    { id: 'eleitor', label: 'Cadastrar Eleitor', sub: 'EXPANSÃO DE BASE', icon: <UserPlus className="w-8 h-8 lg:w-10 lg:h-10" />, color: 'blue' },
                    { id: 'agenda', label: 'Sugerir Agenda', sub: 'MISSÕES LOCAIS', icon: <Calendar className="w-8 h-8 lg:w-10 lg:h-10" />, color: 'emerald' },
                    { id: 'combustivel', label: 'Suporte / Fuel', sub: 'RECURSOS', icon: <Fuel className="w-8 h-8 lg:w-10 lg:h-10" />, color: 'orange' },
                    { id: 'demanda', label: 'Ouvidoria / Feed', sub: 'PROBLEMAS', icon: <StickyNote className="w-8 h-8 lg:w-10 lg:h-10" />, color: 'purple' }
                  ].map(action => (
                    <motion.button 
                      key={action.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => processAction(action.id as any)}
                      className={`aspect-square bg-zinc-900 text-white rounded-[2.5rem] p-6 lg:p-8 flex flex-col items-center justify-center gap-6 shadow-2xl border border-white/5 hover:bg-zinc-800 transition-all group relative overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                        {action.icon}
                      </div>
                      <div className={`bg-${action.color}-500/10 p-5 rounded-2xl group-hover:bg-${action.color}-500/20 transition-all shadow-inner`}>
                        <div className={`text-${action.color}-500`}>{action.icon}</div>
                      </div>
                      <div className="text-center">
                        <span className="font-black text-sm lg:text-base uppercase tracking-widest leading-none block">
                          {action.label}
                        </span>
                        <span className="text-[9px] font-black text-zinc-500 mt-2 block tracking-[0.2em] uppercase opacity-60">
                          {action.sub}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12">
                  {myRequests.length > 0 && (
                    <section className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-10 shadow-sm overflow-hidden flex flex-col h-full group">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-zinc-950 font-black text-lg uppercase tracking-tighter flex items-center gap-3 italic">
                          <div className="bg-zinc-100 p-2 rounded-xl group-hover:bg-zinc-950 group-hover:text-white transition-all"><RefreshCcw className="w-5 h-5 text-zinc-400 group-hover:text-yellow-500" /></div>
                          Fluxo de Suporte
                        </h3>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Últimas 5</span>
                      </div>
                      <div className="space-y-4 flex-1">
                        {myRequests.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(req => (
                          <motion.div 
                            key={req.id} 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-between gap-6 hover:bg-zinc-100 transition-all group/item"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-4 rounded-2xl shadow-sm ${
                                req.type === 'combustivel' ? 'bg-blue-100 text-blue-600' : 
                                req.type === 'demanda' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                              }`}>
                                {req.type === 'combustivel' ? <Fuel className="w-5 h-5" /> : <StickyNote className="w-5 h-5" />}
                              </div>
                              <div className="text-left">
                                <p className="font-black text-zinc-950 text-xs uppercase leading-none mb-2 tracking-tight group-hover/item:text-blue-600 transition-colors">{req.title}</p>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{new Date(req.createdAt).toLocaleDateString()} • {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-sm ${
                              req.status === 'aprovado' ? 'bg-green-100 text-green-700' : 
                              req.status === 'negado' ? 'bg-red-100 text-red-700' : 'bg-white text-zinc-400 border border-zinc-200'
                            }`}>
                              {req.status}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {myAgendas.length > 0 && (
                    <section className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-10 shadow-sm overflow-hidden flex flex-col h-full group">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-zinc-950 font-black text-lg uppercase tracking-tighter flex items-center gap-3 italic">
                          <div className="bg-zinc-100 p-2 rounded-xl group-hover:bg-zinc-950 group-hover:text-white transition-all"><Calendar className="w-5 h-5 text-zinc-400 group-hover:text-emerald-500" /></div>
                          Monitor de Agenda
                        </h3>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ativas</span>
                      </div>
                      <div className="space-y-4 flex-1">
                        {myAgendas.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(agenda => (
                          <motion.div 
                            key={agenda.id} 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-between gap-6 hover:bg-zinc-100 transition-all group/item"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-4 rounded-2xl shadow-sm ${
                                agenda.status === 'confirmado' ? 'bg-green-100 text-green-600' : 
                                agenda.status === 'negado' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                              }`}>
                                <Calendar className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                <p className="font-black text-zinc-950 text-xs uppercase leading-none mb-2 tracking-tight">{agenda.municipio}</p>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{new Date(agenda.data).toLocaleDateString()} • {agenda.hora_inicio}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-sm ${
                                agenda.status === 'confirmado' ? 'bg-green-100 text-green-700' : 
                                agenda.status === 'negado' ? 'bg-red-100 text-red-700' : 'bg-white text-orange-600 border border-orange-100'
                              }`}>
                                {agenda.status === 'confirmado' ? 'APROVADA' : agenda.status === 'negado' ? 'NEGADA' : 'PENDENTE'}
                              </span>
                              {agenda.status === 'pendente' && (
                                <button 
                                  onClick={async () => {
                                    if(window.confirm("Abortar sugestão estratégica?")) {
                                      await firestoreService.deleteDocument('agenda', agenda.id);
                                    }
                                  }}
                                  className="text-[9px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest underline transition-colors"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="bg-zinc-950 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent"></div>
                    <div className="bg-zinc-900/50 p-4 rounded-full relative mb-6 w-max mx-auto shadow-inner border border-white/5">
                      <RefreshCcw className={`w-10 h-10 text-yellow-500 ${queueCount > 0 ? 'animate-spin-slow' : ''}`} />
                      {queueCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-yellow-500 text-zinc-950 text-xs font-black w-8 h-8 flex items-center justify-center rounded-full border-4 border-zinc-950 shadow-2xl">
                          {queueCount}
                        </span>
                      )}
                    </div>
                    <div className="text-center relative z-10">
                      <h3 className="text-white font-black text-2xl tracking-tighter uppercase italic">{queueCount} Pacotes Offline</h3>
                      <p className="text-zinc-500 text-[10px] font-black mt-3 uppercase tracking-[0.3em]">
                        {isOnline ? 'Conexão estável com o terminal central' : 'Armazenamento local criptografado (sem rede)'}
                      </p>
                      {isOnline && queueCount > 0 && (
                        <button 
                          onClick={syncOfflineQueue}
                          className="mt-10 w-full bg-yellow-500 text-zinc-950 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-white transition-all active:scale-95"
                        >
                          Sincronizar Terminal
                        </button>
                      )}
                    </div>
                  </section>

                  <div className="bg-blue-600 p-10 rounded-[2.5rem] flex flex-col justify-center relative overflow-hidden shadow-2xl group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-transparent opacity-20"></div>
                    <ShieldCheck className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12 group-hover:rotate-6 transition-all duration-500" />
                    <p className="text-white font-black text-2xl lg:text-3xl uppercase italic leading-tight text-left relative z-10 tracking-tighter">
                      "A vitória é o resultado do trabalho silencioso em cada bairro."
                    </p>
                    <div className="mt-8 flex items-center gap-4 relative z-10">
                       <div className="w-16 h-1 bg-white/30 rounded-full overflow-hidden">
                          <motion.div initial={{ x: -100 }} animate={{ x: 0 }} transition={{ duration: 2, repeat: Infinity }} className="w-full h-full bg-white"></motion.div>
                       </div>
                       <span className="text-blue-100 text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Comando Estratégico Águia</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'equipe' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-200 shadow-xl text-center">
              <Users className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Minha Equipe Regional</h2>
              <p className="text-zinc-500 font-medium text-sm">Base estratégica de eleitores fidelizados em campo.</p>
              
              <div className="grid grid-cols-1 gap-4 mt-8">
                {voters.length > 0 ? voters.sort((a, b) => a.name.localeCompare(b.name)).map((voter) => (
                  <motion.div 
                    key={voter.id} 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedVoter(voter);
                      setIsVoterDetailOpen(true);
                    }}
                    className="flex justify-between items-center p-5 bg-white rounded-3xl border-2 border-zinc-100 shadow-sm hover:border-yellow-500 transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-zinc-100 text-zinc-400 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg">
                        {voter.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-zinc-950 text-base uppercase tracking-tight leading-none mb-1">{voter.name}</p>
                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{voter.phone || 'Sem Telefone'}</p>
                      </div>
                    </div>
                    <ChevronRight className="text-zinc-300" />
                  </motion.div>
                )) : (
                  <div className="p-12 border-2 border-dashed border-zinc-200 rounded-3xl text-center">
                    <p className="font-black text-zinc-300 uppercase tracking-widest text-sm italic">Nenhum eleitor cadastrado ainda.</p>
                    <button 
                      onClick={() => setActiveTab('logistica')}
                      className="mt-4 text-xs font-black text-yellow-600 underline uppercase"
                    >
                      Ir para logística cadastrar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'financeiro' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-zinc-950 p-8 rounded-[2.5rem] border-b-8 border-green-500 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Wallet className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase text-green-500 tracking-widest mb-1">Saldo em Caixa da Equipe</p>
                <h2 className="text-5xl font-black tracking-tighter">
                  R$ {((teamData?.allocated || 0) - (teamData?.spent || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
                <div className="flex gap-8 mt-6">
                   <div>
                      <p className="text-[10px] font-black uppercase text-zinc-500">Recibido (Total)</p>
                      <p className="text-lg font-black">{ (teamData?.allocated || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-zinc-500">Gasto Atual</p>
                      <p className="text-lg font-black text-red-500">{ (teamData?.spent || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-white p-8 rounded-3xl border-2 border-zinc-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" /> Alocações do Coordenador
                  </h3>
                </div>
                <div className="space-y-3">
                  {teamTransactions.filter(t => t.type === 'alocacao').length > 0 ? teamTransactions.filter(t => t.type === 'alocacao').map(tx => (
                    <div key={tx.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center">
                      <div className="text-left">
                        <p className="font-black text-sm uppercase text-zinc-800">Recurso Recebido</p>
                        <p className="text-[10px] text-zinc-500 font-bold italic">"{tx.purpose || 'Uso em campo'}"</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-black text-blue-600 text-sm">+ R$ {tx.amount.toLocaleString()}</p>
                          <p className="text-[9px] text-zinc-400 font-bold">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                        {tx.receiptStatus !== 'assinado' ? (
                          <button 
                            onClick={() => {
                              setSelectedTxToSign(tx);
                              setIsSignReceiptModalOpen(true);
                            }}
                            className="bg-yellow-500 text-zinc-950 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase shadow-lg shadow-yellow-100"
                          >
                            Assinar Recibo
                          </button>
                        ) : (
                          <div className="bg-green-100 text-green-600 p-1.5 rounded-full" title="Recibo Assinado">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-10 text-zinc-300 text-[10px] font-black uppercase italic">Nenhuma alocação registrada.</p>
                  )}
                </div>
              </section>

              <section className="bg-white p-8 rounded-3xl border-2 border-zinc-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-red-500" /> Histórico de Gastos
                  </h3>
                  <button 
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="bg-zinc-950 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Adicionar Gasto
                  </button>
                </div>
                <div className="space-y-3">
                  {teamTransactions.filter(t => t.type === 'gasto').length > 0 ? teamTransactions.filter(t => t.type === 'gasto').map(tx => (
                    <div 
                      key={tx.id} 
                      onClick={() => {
                        setSelectedExpenseForVoucher(tx);
                        setIsExpenseVoucherModalOpen(true);
                      }}
                      className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center cursor-pointer hover:bg-zinc-100 transition-all border-l-4 border-l-red-500"
                    >
                      <div className="text-left">
                        <p className="font-black text-sm uppercase text-zinc-800">{tx.description}</p>
                        <p className="text-[10px] text-zinc-500 font-bold italic">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <p className="font-black text-red-600 text-sm">- R$ {tx.amount.toLocaleString()}</p>
                        <FileText className="w-4 h-4 text-zinc-300" />
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-10 text-zinc-300 text-[10px] font-black uppercase italic">Nenhum gasto registrado ainda.</p>
                  )}
                </div>
              </section>
            </div>
          </motion.div>
        ) : activeTab === 'ouvidoria' ? (
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
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-200 shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <div className="text-left text-zinc-950">
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">Notas Estratégicas</h2>
                  <p className="text-zinc-500 font-medium text-sm">Registre impressões, nomes e lembretes rápidos via áudio.</p>
                </div>
                <button 
                  onClick={startVoiceNote}
                  className="flex items-center gap-3 bg-zinc-950 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-950 transition-all shadow-xl active:scale-95 group"
                >
                  <Mic className="w-5 h-5 text-yellow-500 group-hover:text-zinc-950" />
                  Gravar Nova Nota
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.length > 0 ? notes.map((note) => (
                  <NoteCard key={note.id} note={note} user={user} isAdmin={false} onDelete={() => handleDeleteNote(note.id)} />
                )) : (
                  <div className="col-span-full p-20 border-2 border-dashed border-zinc-200 rounded-[2.5rem] text-center">
                    <Mic className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                    <p className="font-black text-zinc-300 uppercase tracking-[0.2em] text-xs">Seu diário estratégico está vazio.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
          </div>
        </main>
      </div>

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

      <AnimatePresence>
        {isVoterDetailOpen && selectedVoter && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setIsVoterDetailOpen(false);
                  setSelectedVoter(null);
                }} 
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-full text-zinc-500 hover:bg-zinc-200 transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-8 border-b-4 border-yellow-500 text-left">
                <div className="flex items-center gap-4 mb-2">
                   <div className="bg-yellow-500 text-zinc-950 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl">
                      {selectedVoter.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">{selectedVoter.name}</h2>
                      <p className="text-zinc-400 text-[10px] font-black mt-1 uppercase tracking-widest leading-none">Perfil do Eleitor Fidelizado</p>
                   </div>
                </div>
              </div>

              <div className="p-8 space-y-6 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm font-black text-green-600 uppercase">Fidelizado</p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Cadastro em</p>
                    <p className="text-sm font-black text-zinc-800 uppercase">{new Date(selectedVoter.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Phone className="w-5 h-5" /></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Contato</p>
                      <button 
                        onClick={() => {
                          const cleanPhone = selectedVoter.phone.replace(/\D/g, '');
                          window.open(`https://wa.me/55${cleanPhone}`, '_blank');
                        }}
                        className="text-lg font-black text-zinc-900 border-b-2 border-blue-500 flex items-center gap-2"
                      >
                        {selectedVoter.phone || 'Sem Telefone'}
                        <div className="bg-green-500 w-2 h-2 rounded-full animate-pulse"></div>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-zinc-100 p-3 rounded-xl text-zinc-950"><MapPin className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Localização / Base</p>
                      <p className="text-base font-bold text-zinc-800 leading-tight">{selectedVoter.address || 'Não informado'}</p>
                    </div>
                  </div>

                  {selectedVoter.observations && (
                    <div className="flex items-start gap-4">
                      <div className="bg-yellow-50 p-3 rounded-xl text-yellow-600"><StickyNote className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Observações de Campo</p>
                        <p className="text-sm font-bold text-zinc-600 italic">"{selectedVoter.observations}"</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t-2 border-zinc-50">
                  <button 
                    onClick={() => {
                      setVoterForm({
                        name: selectedVoter.name,
                        phone: selectedVoter.phone,
                        address: selectedVoter.address,
                        observations: selectedVoter.observations
                      });
                      setEditingVoterId(selectedVoter.id);
                      setIsEditingVoter(true);
                      setIsVoterModalOpen(true);
                      setIsVoterDetailOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-950 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm active:bg-zinc-200 transition-all"
                  >
                    <Settings className="w-4 h-4" /> Editar Dados
                  </button>
                  <button 
                    onClick={() => handleDeleteVoter(selectedVoter.id)}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-red-700 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir Registro
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
              className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => {
                   setIsVoterModalOpen(false);
                   setIsEditingVoter(false);
                   setEditingVoterId(null);
                   setVoterForm({ name: '', phone: '', address: '', observations: '' });
                }} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-zinc-950 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none italic">
                  {isEditingVoter ? 'Editar Registro' : 'Novo Alistamento'}
                </h2>
                <p className="text-zinc-400 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Inteligência Territorial e Base de Dados</p>
              </div>
              <form onSubmit={handleVoterSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome Completo do Cidadão</label>
                  <input required type="text" value={voterForm.name} onChange={e => setVoterForm({...voterForm, name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Digite identificação oficial..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">WhatsApp / Terminal Celular</label>
                  <input type="text" value={voterForm.phone} onChange={e => setVoterForm({...voterForm, phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Localização Operacional</label>
                  <input type="text" value={voterForm.address} onChange={e => setVoterForm({...voterForm, address: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Rua, Bairro ou Referência..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Observações Técnicas de Campo</label>
                  <textarea value={voterForm.observations} onChange={e => setVoterForm({...voterForm, observations: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-yellow-500 transition-all h-24 resize-none placeholder:text-zinc-300" placeholder="Histórico de engajamento ou demandas específicas..." />
                </div>
                <button type="submit" className="w-full bg-zinc-950 text-yellow-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-zinc-950/10 hover:bg-zinc-900 transition-all active:scale-[0.98] mt-2 italic">EFETIVAR REGISTRO TÁTICO</button>
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
              className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsFuelModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-blue-600 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none italic">Logística de Suporte</h2>
                <p className="text-blue-200 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Requisição Oficial de Combustível</p>
              </div>
              <form onSubmit={handleFuelSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Volume Necessário (Operação em Litros)</label>
                  <input required type="number" value={fuelForm.amount} onChange={e => setFuelForm({...fuelForm, amount: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-2xl text-zinc-900 outline-none focus:border-blue-500 transition-all placeholder:text-zinc-300" placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Roteiro Planejado e Justificativa</label>
                  <textarea required value={fuelForm.reason} onChange={e => setFuelForm({...fuelForm, reason: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-blue-500 transition-all h-32 resize-none placeholder:text-zinc-300" placeholder="Descreva o trajeto e comunidades atendidas..." />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-[0.98] mt-2 italic">ENVIAR REQUISIÇÃO</button>
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
              className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsDemandModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-yellow-500 p-6">
                <h2 className="text-xl font-black text-zinc-950 tracking-tighter uppercase leading-none italic">Demanda Territorial</h2>
                <p className="text-zinc-900 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Monitoramento de Necessidades Sociais</p>
              </div>
              <form onSubmit={handleDemandSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Natureza da Demanda</label>
                  <input required type="text" value={demandForm.title} onChange={e => setDemandForm({...demandForm, title: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-600 transition-all placeholder:text-zinc-300" placeholder="Ex: Saneamento, Saúde, Infraestrutura..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Briefing Detalhado</label>
                  <textarea required value={demandForm.description} onChange={e => setDemandForm({...demandForm, description: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-yellow-600 transition-all h-32 resize-none placeholder:text-zinc-300" placeholder="Descreva a urgência e o impacto na comunidade..." />
                </div>
                <button type="submit" className="w-full bg-yellow-500 text-zinc-950 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-yellow-500/10 hover:bg-yellow-600 transition-all active:scale-[0.98] mt-2 italic">ENVIAR PARA COORDENAÇÃO</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: COMPROVANTE DE GASTO (VOUCHER) */}
      <AnimatePresence>
        {isExpenseVoucherModalOpen && selectedExpenseForVoucher && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-xl p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl relative p-8 md:p-12 text-zinc-950 border border-zinc-200"
            >
              <button 
                onClick={() => setIsExpenseVoucherModalOpen(false)}
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95 print:hidden"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border border-zinc-200 p-6 md:p-8 rounded-xl space-y-6 md:space-y-8 relative">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-3">
                      <div className="bg-red-600 p-2 rounded-lg"><DollarSign className="text-white w-5 h-5 md:w-6 md:h-6" /></div>
                      <div>
                        <h3 className="font-black text-lg md:text-xl leading-none italic uppercase tracking-tighter">VOUCHER DE GASTO</h3>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Comprovante de Saída Operacional</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">ID Operação</p>
                      <p className="font-mono text-xs font-black uppercase text-zinc-950">{selectedExpenseForVoucher.id.split('_').pop()}</p>
                   </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                   <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">Discriminação</p>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                         <div>
                            <p className="text-xl font-black text-zinc-950 leading-tight uppercase italic">{selectedExpenseForVoucher.description}</p>
                            <p className="text-[10px] font-bold text-zinc-500 italic mt-1">Finalidade: {selectedExpenseForVoucher.purpose}</p>
                            <p className="text-[8px] font-black text-zinc-400 uppercase mt-4 tracking-widest">Data/Hora: {new Date(selectedExpenseForVoucher.date).toLocaleString('pt-BR')}</p>
                         </div>
                         <div className="text-left md:text-right w-full md:w-auto">
                            <p className="text-2xl md:text-3xl font-black text-red-600 tracking-tighter">R$ {selectedExpenseForVoucher.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                         </div>
                      </div>
                   </div>

                   <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">Unidade Responsável</p>
                      <p className="text-base font-black text-zinc-950 uppercase italic tracking-tight">{selectedExpenseForVoucher.team}</p>
                      <p className="text-[10px] font-bold text-zinc-500 mt-0.5">Líder: {profileData.name}</p>
                   </div>

                   <p className="text-[8px] font-black leading-relaxed text-zinc-400 text-center uppercase tracking-[0.2em] pt-4">
                      Protocolo Digital Gerado via Rede Águia
                   </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 print:hidden">
                 <button 
                   onClick={() => window.print()}
                   className="flex items-center gap-2 bg-zinc-950 text-white px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-xl shadow-zinc-200 italic"
                 >
                   <Printer className="w-4 h-4" /> Gerar Documento (PDF)
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: ASSINAR RECIBO */}
      <AnimatePresence>
        {isSignReceiptModalOpen && selectedTxToSign && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-xl p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl relative p-8 md:p-12 text-zinc-950 border border-zinc-200"
            >
              <button 
                onClick={() => setIsSignReceiptModalOpen(false)}
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95 print:hidden"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border border-zinc-200 p-6 md:p-8 rounded-xl space-y-6 md:space-y-8 relative">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-3">
                      <div className="bg-zinc-950 p-2 rounded-lg"><ShieldCheck className="text-yellow-500 w-5 h-5 md:w-6 md:h-6" /></div>
                      <div>
                        <h3 className="font-black text-lg md:text-xl leading-none italic uppercase tracking-tighter">PROTOCOLO ÁGUIA</h3>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Comprovante de Transferência Digital</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Nº Doc</p>
                      <p className="font-mono text-xs font-black text-zinc-950">{selectedTxToSign.id.split('_').pop()?.toUpperCase()}</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">Beneficiário e Valor</p>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                         <div>
                            <p className="text-xl font-black text-zinc-950 leading-tight uppercase italic">{selectedTxToSign.team}</p>
                            <p className="text-[10px] font-bold text-zinc-500 italic mt-1">Finalidade: {selectedTxToSign.purpose || 'Uso Operacional'}</p>
                         </div>
                         <div className="text-left md:text-right w-full md:w-auto">
                            <p className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tighter italic">R$ {selectedTxToSign.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                         </div>
                      </div>
                   </div>

                   <p className="text-[11px] font-medium leading-relaxed text-zinc-600 text-justify bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                      Eu, líder da equipe regional <strong className="text-zinc-950 font-black">{selectedTxToSign.team}</strong>, declaro ter recebido em {new Date(selectedTxToSign.date).toLocaleDateString('pt-BR')} a importância acima, comprometendo-me com as diretrizes táticas do sistema.
                   </p>

                   <div className="pt-8 grid grid-cols-2 gap-8">
                      <div className="text-center border-t border-zinc-200 pt-4">
                         <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Origem Operacional</p>
                         <p className="font-black text-[9px] uppercase tracking-tighter text-zinc-950">Validado Eletronicamente</p>
                      </div>
                      <div className="text-center border-t border-zinc-200 pt-4">
                         <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Receptor / Líder</p>
                         <p className="text-zinc-400 font-bold text-[9px] italic uppercase">Assinatura Pendente</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col md:flex-row justify-end gap-3 print:hidden">
                 <button 
                   onClick={() => window.print()}
                   className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-600 px-6 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-zinc-200 transition-all font-sans"
                 >
                   <Printer className="w-4 h-4" /> Imprimir Recibo
                 </button>
                 <button 
                   onClick={() => handleSignReceipt(selectedTxToSign)}
                   className="bg-green-600 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-green-700 transition-all shadow-xl shadow-green-100 italic"
                 >
                   Confirmar e Assinar
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: ADICIONAR GASTO */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsExpenseModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-red-600 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none italic">Controle de Saídas</h2>
                <p className="text-red-100 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Registro de Despesa da Equipe</p>
              </div>
              <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Descrição do Gasto</label>
                  <input required type="text" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-red-500 transition-all placeholder:text-zinc-300" placeholder="Ex: Alimentação Equipe Campo..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Finalidade / Categoria Operacional</label>
                  <input required type="text" value={expenseForm.purpose} onChange={e => setExpenseForm({...expenseForm, purpose: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-red-500 transition-all placeholder:text-zinc-300" placeholder="Ex: Logística, Emergência, Apoio..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Montante (Valores em R$)</label>
                  <input required type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-2xl text-zinc-900 outline-none focus:border-red-500 transition-all placeholder:text-zinc-300" placeholder="0,00" />
                </div>
                <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/10 hover:bg-red-700 transition-all active:scale-[0.98] mt-2 italic">EFETIVAR SAÍDA</button>
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
              className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsAgendaModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-orange-500 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none italic">Logística Proativa</h2>
                <p className="text-orange-100 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Proposta de Itinerário Estratégico</p>
              </div>
              <form onSubmit={handleAgendaSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Local Operacional (Município)</label>
                  <select 
                    required 
                    value={agendaForm.municipio} 
                    onChange={e => setAgendaForm({...agendaForm, municipio: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-orange-500 transition-all"
                  >
                    <option value="" className="font-black">Selecione localidade...</option>
                    {["Boa Vista", "Pacaraima", "Rorainópolis", "Uiramutã", "Cantá", "Alto Alegre", "Mucajaí", "Amajari", "Bonfim", "Normandia", "Caracaraí", "Iracema", "Bonfim", "São João da Baliza", "São Luiz", "Caroebe"].map(m => (
                      <option key={m} value={m} className="font-bold">{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Data da Missão Sugerida</label>
                  <input required type="date" value={agendaForm.data} onChange={e => setAgendaForm({...agendaForm, data: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-orange-500 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Horário Início</label>
                    <input required type="time" value={agendaForm.hora_inicio} onChange={e => setAgendaForm({...agendaForm, hora_inicio: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-orange-500 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Horário Fim</label>
                    <input required type="time" value={agendaForm.hora_fim} onChange={e => setAgendaForm({...agendaForm, hora_fim: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-orange-500 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block leading-none">Justificativa e Objetivos Táticos</label>
                  <textarea required value={agendaForm.motivo} onChange={e => setAgendaForm({...agendaForm, motivo: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-orange-500 transition-all h-24 resize-none placeholder:text-zinc-300" placeholder="Descreva os objetivos da diligência..." />
                </div>
                <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-orange-500/10 hover:bg-orange-700 transition-all active:scale-[0.98] mt-2 italic">ENVIAR PROPOSTA</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: GRAVAR NOTA */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsNoteModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-zinc-950 p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`}>
                  <Mic className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none italic">Anotação Tática</h2>
                  <p className="text-zinc-500 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">
                    {isRecording ? 'Escutando relato...' : 'Transcrição ou Digitação'}
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Conteúdo da Nota</label>
                  <textarea 
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 font-bold text-zinc-800 text-sm h-48 outline-none focus:border-yellow-500 transition-all resize-none"
                    placeholder="O que você está pensando? Ou continue gravando..."
                  />
                </div>
                
                <div className="flex gap-3">
                  {!isRecording ? (
                    <button 
                      onClick={startVoiceNote}
                      className="flex-1 bg-zinc-100 text-zinc-900 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Mic className="w-4 h-4" /> REINICIAR VOZ
                    </button>
                  ) : (
                    <div className="flex-1 bg-red-100 text-red-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-red-600 animate-ping"></div> ESCUTANDO...
                    </div>
                  )}
                  <button 
                    onClick={() => handleNoteSubmit()}
                    disabled={isProcessingNote || !noteText.trim()}
                    className={`flex-1 ${isProcessingNote ? 'bg-zinc-400' : 'bg-yellow-500'} text-zinc-950 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 italic`}
                  >
                    {isProcessingNote ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isProcessingNote ? 'PROCESSANDO...' : 'SALVAR NOTA'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-20 bg-neutral-950/90 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-around px-4 z-50 shadow-2xl">
        {[
          { id: 'logistica', label: 'Tático', icon: <MapPin className="w-5 h-5" /> },
          { id: 'equipe', label: 'Equipe', icon: <Users className="w-5 h-5" /> },
          { id: 'notas', label: 'Notas', icon: <Mic className="w-5 h-5" /> },
          { id: 'financeiro', label: 'Caixa', icon: <Wallet className="w-5 h-5" /> },
          { id: 'ouvidoria', label: 'Feed', icon: <History className="w-5 h-5" /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.id 
              ? 'text-yellow-500 scale-110' 
              : 'text-zinc-500'
            }`}
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-yellow-500/10' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.1em]">
              {tab.label}
            </span>
          </button>
        ))}
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


