import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { firestoreService } from '../lib/firestoreService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2,
  Bookmark,
  Calendar,
  Sparkles,
  Award
} from 'lucide-react';

interface PublicVoterRegisterProps {
  leaderId: string | null;
  teamId: string | null;
}

export default function PublicVoterRegister({ leaderId, teamId }: PublicVoterRegisterProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [leaderInfo, setLeaderInfo] = useState<{
    id: string;
    name: string;
    teamName: string;
    coordinatorId: string;
    teamId: string;
  } | null>(null);

  const [voterForm, setVoterForm] = useState({
    name: '',
    phone: '',
    address: '',
    observations: '',
    referredBy: '',
    tags: [] as string[],
    cpf: '',
    rg: '',
    titulo: '',
    zona: '',
    secao: '',
    localVotacao: ''
  });

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        let resolvedLeaderId = '';
        let resolvedLeaderName = 'Líder';
        let resolvedTeamName = 'Base';
        let resolvedCoordinatorId = '';
        let resolvedTeamId = '';

        const activeLeaderId = leaderId;
        const activeTeamId = teamId;

        if (activeLeaderId) {
          // 1. Tentar carregar de 'users'
          const userDoc = await getDoc(doc(db, 'users', activeLeaderId));
          if (userDoc.exists() && userDoc.data()?.role === 'lider') {
            const uData = userDoc.data();
            resolvedLeaderId = activeLeaderId;
            resolvedLeaderName = uData.name || 'Líder';
            resolvedTeamName = uData.teamName || uData.zone || uData.team || 'Base';
            resolvedCoordinatorId = uData.coordinatorId || '';
            resolvedTeamId = uData.teamId || '';
          } else {
            // Se não encontrou em users, tentar carregar como se fosse teamId da coleção 'teams'
            const teamDoc = await getDoc(doc(db, 'teams', activeLeaderId));
            if (teamDoc.exists()) {
              const tData = teamDoc.data();
              resolvedTeamId = activeLeaderId;
              resolvedLeaderName = tData.leader || 'Líder';
              resolvedTeamName = tData.name || 'Base';
              resolvedCoordinatorId = tData.coordinatorId || '';
              
              // Tentar resolver leaderId real buscando na coleção 'users'
              const userQ = query(
                collection(db, 'users'), 
                where('teamId', '==', activeLeaderId), 
                where('role', '==', 'lider')
              );
              const userSnap = await getDocs(userQ);
              if (!userSnap.empty) {
                resolvedLeaderId = userSnap.docs[0].id;
              } else {
                resolvedLeaderId = activeLeaderId; // Fallback
              }
            } else {
              throw new Error("Líder ou Equipe não encontrados no sistema.");
            }
          }
        } else if (activeTeamId) {
          // 2. Tentar carregar de 'teams'
          const teamDoc = await getDoc(doc(db, 'teams', activeTeamId));
          if (teamDoc.exists()) {
            const tData = teamDoc.data();
            resolvedTeamId = activeTeamId;
            resolvedLeaderName = tData.leader || 'Líder';
            resolvedTeamName = tData.name || 'Base';
            resolvedCoordinatorId = tData.coordinatorId || '';
            
            // Tentar resolver leaderId real buscando na coleção 'users'
            const userQ = query(
              collection(db, 'users'), 
              where('teamId', '==', activeTeamId), 
              where('role', '==', 'lider')
            );
            const userSnap = await getDocs(userQ);
            if (!userSnap.empty) {
              resolvedLeaderId = userSnap.docs[0].id;
            } else {
              resolvedLeaderId = activeTeamId; // Fallback
            }
          } else {
            throw new Error("Equipe não encontrada no sistema.");
          }
        } else {
          throw new Error("Link inválido. Identificação da equipe ausente.");
        }

        // Se o coordinatorId estiver em falta, tentar buscar do primeiro coordenador do sistema
        if (!resolvedCoordinatorId) {
          const qCoords = query(collection(db, 'users'), where('role', '==', 'coordenador'), limit(1));
          const snapCoords = await getDocs(qCoords);
          if (!snapCoords.empty) {
            resolvedCoordinatorId = snapCoords.docs[0].id;
          }
        }

        setLeaderInfo({
          id: resolvedLeaderId,
          name: resolvedLeaderName,
          teamName: resolvedTeamName,
          coordinatorId: resolvedCoordinatorId,
          teamId: resolvedTeamId
        });
      } catch (err: any) {
        console.error("Error loading external registration details:", err);
        setError(err.message || "Não foi possível carregar os dados da equipe.");
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [leaderId, teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderInfo) return;
    
    setIsSubmitting(true);
    try {
      // 1. Validar duplicado por telefone se informado
      if (voterForm.phone && voterForm.phone.length > 5) {
        const q = query(
          collection(db, 'voters'), 
          where('phone', '==', voterForm.phone),
          where('coordinatorId', '==', leaderInfo.coordinatorId)
        );
        const checkSnap = await getDocs(q);
        if (!checkSnap.empty) {
          alert("⚠️ Este número de telefone já está cadastrado nesta coordenação!");
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Salvar eleitor
      const payload = {
        ...voterForm,
        leaderId: leaderInfo.id,
        leaderName: leaderInfo.name,
        team: leaderInfo.teamName,
        teamId: leaderInfo.teamId,
        createdAt: Date.now(),
        registeredBy: 'link_externo',
        createdBy: 'link_externo',
        coordinatorId: leaderInfo.coordinatorId,
        location: null
      };

      await firestoreService.setDocument('voters', `voter_${Date.now()}`, payload);
      setSuccess(true);
    } catch (err: any) {
      alert("Erro ao realizar cadastro: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-8">
        <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
        <p className="text-zinc-600 font-black text-xs uppercase tracking-widest animate-pulse">Carregando Formulário...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-10 rounded-sm border border-zinc-200 shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-sm flex items-center justify-center mx-auto mb-6 border border-red-200">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-black text-zinc-900 uppercase tracking-tighter mb-3">Falha de Conexão</h1>
          <p className="text-zinc-500 text-sm font-bold mb-8">{error}</p>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">SISTEMA ÁGUIA • 2026</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8 selection:bg-yellow-500 selection:text-zinc-950">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-zinc-950 rounded-sm shadow-xl border border-white/5 mb-4">
            <ShieldCheck className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tighter uppercase leading-none mb-1">SISTEMA ÁGUIA</h1>
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Plataforma de Alistamento Cívico</p>
          
          {leaderInfo && (
            <div className="bg-zinc-950 text-white rounded-sm p-4 inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-6 border border-white/10 shadow-lg">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Líder:</span>
                <span className="text-[11px] font-black uppercase tracking-wider text-white">{leaderInfo.name}</span>
              </div>
              <div className="hidden sm:block h-3 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-yellow-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Equipe:</span>
                <span className="text-[11px] font-black uppercase tracking-wider text-white">{leaderInfo.teamName}</span>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-2 border-emerald-500 rounded-sm p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
              <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500 rounded-sm flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-zinc-950 uppercase tracking-tighter mb-4">Cadastro Realizado!</h2>
              <p className="text-zinc-600 font-bold text-sm mb-10 max-w-md mx-auto leading-relaxed">
                Suas informações foram integradas com sucesso à base tática da equipe <strong className="text-zinc-950 uppercase">{leaderInfo?.teamName}</strong>. Agradecemos pelo seu apoio!
              </p>
              <button
                onClick={() => {
                  setSuccess(false);
                  setVoterForm({
                    name: '', phone: '', address: '', observations: '', referredBy: '', tags: [], cpf: '', rg: '', titulo: '', zona: '', secao: '', localVotacao: ''
                  });
                }}
                className="bg-zinc-950 text-white font-black text-[10px] uppercase tracking-widest py-4 px-8 rounded-sm hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
              >
                Cadastrar Outro Eleitor
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="bg-white rounded-sm border border-zinc-200 p-6 sm:p-10 shadow-xl space-y-8"
            >
              
              {/* DADOS PESSOAIS */}
              <div className="space-y-5">
                <div className="border-b border-zinc-100 pb-3 flex items-center gap-2.5">
                  <User className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-black text-xs uppercase tracking-widest text-zinc-950">Dados Pessoais</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Nome Completo *</label>
                  <input 
                    required 
                    type="text" 
                    value={voterForm.name} 
                    onChange={e => setVoterForm({...voterForm, name: e.target.value})} 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-sm text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" 
                    placeholder="Digite seu nome completo..." 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">WhatsApp / Celular *</label>
                    <input 
                      required
                      type="text" 
                      value={voterForm.phone} 
                      onChange={e => setVoterForm({...voterForm, phone: e.target.value})} 
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-sm text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" 
                      placeholder="(00) 90000-0000" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Quem indicou? (Opcional)</label>
                    <input 
                      type="text" 
                      value={voterForm.referredBy} 
                      onChange={e => setVoterForm({...voterForm, referredBy: e.target.value})} 
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-sm text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" 
                      placeholder="Nome de quem te indicou..." 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">CPF (Opcional)</label>
                    <input 
                      type="text" 
                      value={voterForm.cpf} 
                      onChange={e => setVoterForm({...voterForm, cpf: e.target.value})} 
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-sm text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" 
                      placeholder="000.000.000-00" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">RG (Opcional)</label>
                    <input 
                      type="text" 
                      value={voterForm.rg} 
                      onChange={e => setVoterForm({...voterForm, rg: e.target.value})} 
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-sm text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" 
                      placeholder="Seu documento RG..." 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Endereço Completo</label>
                  <input 
                    type="text" 
                    value={voterForm.address} 
                    onChange={e => setVoterForm({...voterForm, address: e.target.value})} 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-sm text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" 
                    placeholder="Rua, Número, Bairro, Cidade..." 
                  />
                </div>
              </div>

              {/* DADOS ELEITORAIS */}
              <div className="space-y-5">
                <div className="border-b border-zinc-100 pb-3 flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-black text-xs uppercase tracking-widest text-zinc-950">Dados Eleitorais (Opcional)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Título de Eleitor</label>
                    <input 
                      type="text" 
                      value={voterForm.titulo} 
                      onChange={e => setVoterForm({...voterForm, titulo: e.target.value})} 
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-sm text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" 
                      placeholder="Nº do título..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Zona</label>
                    <input 
                      type="text" 
                      value={voterForm.zona} 
                      onChange={e => setVoterForm({...voterForm, zona: e.target.value})} 
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-sm text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" 
                      placeholder="Zona..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Seção</label>
                    <input 
                      type="text" 
                      value={voterForm.secao} 
                      onChange={e => setVoterForm({...voterForm, secao: e.target.value})} 
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-sm text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" 
                      placeholder="Seção..." 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Local de Votação (Nome do Colégio)</label>
                  <input 
                    type="text" 
                    value={voterForm.localVotacao} 
                    onChange={e => setVoterForm({...voterForm, localVotacao: e.target.value})} 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-sm text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" 
                    placeholder="Nome da Escola ou Seção de Voto..." 
                  />
                </div>
              </div>

              {/* OBSERVACÕES */}
              <div className="space-y-5">
                <div className="border-b border-zinc-100 pb-3 flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-black text-xs uppercase tracking-widest text-zinc-950">Observações ou Demandas</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Mensagem / Observação</label>
                  <textarea 
                    value={voterForm.observations} 
                    onChange={e => setVoterForm({...voterForm, observations: e.target.value})} 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-sm text-zinc-900 outline-none focus:border-yellow-500 transition-all h-28 resize-none placeholder:text-zinc-300" 
                    placeholder="Insira demandas de asfalto, saneamento, ou observações importantes sobre seu cadastro..." 
                  />
                </div>
              </div>

              {/* BUTTON */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-zinc-950 text-white hover:bg-zinc-800 disabled:bg-zinc-700 py-5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    Enviando Cadastro...
                  </>
                ) : (
                  'Confirmar meu Alistamento'
                )}
              </button>

            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em]">SISTEMA ÁGUIA • DIREÇÃO GERAL DE CAMPANHA 2026</p>
      </div>
    </div>
  );
}
