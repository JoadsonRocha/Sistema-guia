import React, { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';
import { TreLocationFields } from './TreLocationFields';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { firestoreService } from '../lib/firestoreService';
import { candidateService, CandidateInfo, DEFAULT_CANDIDATE_INFO } from '../lib/candidateService';
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
  Award,
  UserPlus,
  Heart,
  ChevronRight,
  ChevronLeft,
  Mail,
  Home,
  MessageSquare,
  Check
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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [showFullBio, setShowFullBio] = useState(false);

  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>(DEFAULT_CANDIDATE_INFO);

  const [leaderInfo, setLeaderInfo] = useState<{
    id: string;
    name: string;
    teamName: string;
    coordinatorId: string;
    teamId: string;
  } | null>(null);

  const [voterForm, setVoterForm] = useState({
    name: '',
    email: '',
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

  const [acceptedLgpd, setAcceptedLgpd] = useState(false);

  // Escutar dados do candidato padronizados do Firestore
  useEffect(() => {
    const unsub = candidateService.subscribeCandidateInfo((info) => {
      setCandidateInfo(info);
    });
    return () => unsub();
  }, []);

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
          if (userDoc.exists()) {
            const uData = userDoc.data();
            resolvedLeaderId = activeLeaderId;
            resolvedLeaderName = uData.name || uData.displayName || 'Líder';
            resolvedTeamName = uData.teamName || uData.zone || uData.team || 'Base';
            resolvedCoordinatorId = uData.coordinatorId || uData.uid || activeLeaderId;
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
              
              const userQ = query(
                collection(db, 'users'), 
                where('teamId', '==', activeLeaderId), 
                where('role', '==', 'lider')
              );
              const userSnap = await getDocs(userQ);
              if (!userSnap.empty) {
                resolvedLeaderId = userSnap.docs[0].id;
              } else {
                resolvedLeaderId = activeLeaderId;
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
            
            const userQ = query(
              collection(db, 'users'), 
              where('teamId', '==', activeTeamId), 
              where('role', '==', 'lider')
            );
            const userSnap = await getDocs(userQ);
            if (!userSnap.empty) {
              resolvedLeaderId = userSnap.docs[0].id;
            } else {
              resolvedLeaderId = activeTeamId;
            }
          } else {
            throw new Error("Equipe não encontrada no sistema.");
          }
        } else {
          // General coordinator link
          const urlParams = new URLSearchParams(window.location.search);
          const activeCoordId = urlParams.get('coordinatorId');
          resolvedCoordinatorId = activeCoordId || '';
          resolvedLeaderName = 'Coordenação Geral';
          resolvedTeamName = 'Nexus Política';
          resolvedLeaderId = 'geral';
        }

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

    if (!acceptedLgpd) {
      alert("Por favor, aceite os termos de proteção de dados (LGPD) para prosseguir.");
      return;
    }
    
    setIsSubmitting(true);
    try {
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
        location: null,
        lgpdConsent: acceptedLgpd,
        lgpdConsentDate: Date.now()
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
      <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-8">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-zinc-600 font-black text-xs uppercase tracking-widest animate-pulse">Carregando Formulário do Projeto...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-10 rounded-2xl border border-zinc-200 shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-200">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-black text-zinc-900 uppercase tracking-tighter mb-3">Falha de Conexão</h1>
          <p className="text-zinc-500 text-sm font-bold mb-8">{error}</p>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">SISTEMA ELEITORAL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-200/60 py-6 px-3 sm:px-6 lg:px-8 flex items-center justify-center selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-zinc-200/80 my-4">
        
        {/* ESQUERDA: BANNER / CARD DO CANDIDATO */}
        <div className="lg:col-span-5 bg-gradient-to-b from-blue-600 via-blue-600 to-blue-700 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          
          {/* Elementos decorativos de fundo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            
            {/* BADGE: VOCÊ FOI CONVIDADO POR */}
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/90 mb-2">
              VOCÊ FOI CONVIDADO POR
            </p>
            <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30 inline-flex items-center gap-2 max-w-full justify-center shadow-lg mb-6">
              <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-white truncate max-w-[220px]">
                {leaderInfo?.name || 'Coordenação Geral'}
              </span>
            </div>

            {/* FOTO DO CANDIDATO */}
            <div className="relative mx-auto my-3">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-blue-500 flex items-center justify-center relative z-10">
                <img 
                  src={candidateInfo.photoUrl} 
                  alt={candidateInfo.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_CANDIDATE_INFO.photoUrl;
                  }}
                />
              </div>

              {/* Tag Quero Participar */}
              <div className="-mt-4 relative z-20 flex justify-center">
                <span className="bg-white/25 backdrop-blur-md border border-white/40 text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xl">
                  <UserPlus className="w-3.5 h-3.5" /> Quero Participar
                </span>
              </div>
            </div>

            {/* NOME DO CANDIDATO */}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mt-4 mb-1">
              {candidateInfo.name}
            </h1>
            <p className="text-xs font-bold text-blue-100/90 uppercase tracking-widest mb-4">
              {candidateInfo.title}
            </p>

            <div className="w-full border-t border-white/20 my-3" />

            {/* APRESENTAÇÃO / BIOGRAFIA */}
            <div className="text-xs text-blue-50/95 leading-relaxed text-center font-medium px-2">
              <p>
                {showFullBio ? candidateInfo.bio : `${candidateInfo.bio.slice(0, 150)}${candidateInfo.bio.length > 150 ? '...' : ''}`}
                {candidateInfo.bio.length > 150 && (
                  <button 
                    type="button"
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="ml-1 text-white underline font-bold hover:text-blue-200 transition-colors cursor-pointer inline-block"
                  >
                    {showFullBio ? 'Ver menos' : 'Ver mais'}
                  </button>
                )}
              </p>
            </div>

          </div>

          {/* RODAPÉ DO BANNER */}
          <div className="relative z-10 mt-8 pt-4 border-t border-white/15 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-blue-100 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Base Tática Oficial • {leaderInfo?.teamName || 'Nexus Política'}</span>
            </div>
          </div>

        </div>

        {/* DIREITA: FORMULÁRIO DE CADASTRO COM ETAPAS */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-10 flex flex-col justify-between">
          
          <div>
            {/* Ícone e Título da Campanha */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Heart className="w-6 h-6 fill-emerald-600" />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight mb-2">
                {candidateInfo.badgeTitle || 'Faça Parte do Nosso Projeto! 🎉'}
              </h2>
              
              <p className="text-zinc-600 font-bold text-xs max-w-lg mx-auto leading-relaxed mb-2">
                {candidateInfo.subtitle || 'Preencha o formulário abaixo e ajude a construir um futuro melhor para nossa comunidade.'}
              </p>
              
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Seus dados estão seguros e protegidos.
              </p>
            </div>

            {/* ETAPAS / STEPPER INDICATOR */}
            <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-8 border-b border-zinc-100 pb-4 text-center">
              {[
                { step: 1, label: 'DADOS PESSOAIS', icon: User },
                { step: 2, label: 'ENDEREÇO', icon: Home },
                { step: 3, label: 'SUGESTÕES & DEMANDAS', icon: FileText },
                { step: 4, label: 'CONFIRMAÇÃO', icon: ShieldCheck }
              ].map((s) => {
                const Icon = s.icon;
                const isActive = currentStep === s.step;
                const isCompleted = currentStep > s.step;
                
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setCurrentStep(s.step as any)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600 font-black border border-blue-200 shadow-sm' 
                        : isCompleted 
                        ? 'text-emerald-600 font-bold' 
                        : 'text-zinc-400 font-medium hover:text-zinc-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs font-black transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : s.step}
                    </div>
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-tighter leading-none hidden sm:block">
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CONTEÚDO DO FORMULÁRIO */}
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-8 text-center shadow-xl relative overflow-hidden my-auto"
                >
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-zinc-950 uppercase tracking-tighter mb-3">Cadastro Confirmado!</h2>
                  <p className="text-zinc-700 font-bold text-sm mb-8 max-w-md mx-auto leading-relaxed">
                    Sua participação no projeto <strong className="text-zinc-950">{candidateInfo.name}</strong> foi registrada com sucesso sob a coordenação da equipe <strong className="text-zinc-950 uppercase">{leaderInfo?.teamName}</strong>!
                  </p>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setAcceptedLgpd(false);
                      setCurrentStep(1);
                      setVoterForm({
                        name: '', email: '', phone: '', address: '', observations: '', referredBy: '', tags: [], cpf: '', rg: '', titulo: '', zona: '', secao: '', localVotacao: ''
                      });
                    }}
                    className="bg-zinc-950 text-white font-black text-xs uppercase tracking-widest py-4 px-8 rounded-xl hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
                  >
                    Cadastrar Outra Pessoa
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* STEP 1: DADOS PESSOAIS */}
                  {currentStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 mb-4">
                        <User className="w-5 h-5 text-blue-600" />
                        <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900">Informações Pessoais</h3>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Nome Completo *</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                          <input 
                            required 
                            type="text" 
                            value={voterForm.name} 
                            onChange={e => setVoterForm({...voterForm, name: e.target.value})} 
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 pl-10 font-bold text-xs text-zinc-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-zinc-300" 
                            placeholder="Seu nome completo" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">E-mail</label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                            <input 
                              type="email" 
                              value={voterForm.email} 
                              onChange={e => setVoterForm({...voterForm, email: e.target.value})} 
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 pl-10 font-bold text-xs text-zinc-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-zinc-300" 
                              placeholder="seu@email.com" 
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Telefone / WhatsApp *</label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                            <input 
                              required
                              type="text" 
                              value={voterForm.phone} 
                              onChange={e => setVoterForm({...voterForm, phone: e.target.value})} 
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 pl-10 font-bold text-xs text-zinc-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-zinc-300" 
                              placeholder="(00) 90000-0000" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">CPF *</label>
                          <input 
                            required
                            type="text" 
                            value={voterForm.cpf} 
                            onChange={e => setVoterForm({...voterForm, cpf: e.target.value})} 
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 font-bold text-xs text-zinc-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-zinc-300" 
                            placeholder="000.000.000-00" 
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Quem indicou? (Opcional)</label>
                          <input 
                            type="text" 
                            value={voterForm.referredBy} 
                            onChange={e => setVoterForm({...voterForm, referredBy: e.target.value})} 
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 font-bold text-xs text-zinc-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-zinc-300" 
                            placeholder="Nome de quem te indicou" 
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="button"
                          disabled={!voterForm.name || !voterForm.phone || !voterForm.cpf}
                          onClick={() => setCurrentStep(2)}
                          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                        >
                          Próximo: Endereço <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: ENDEREÇO E ELEITORAL */}
                  {currentStep === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 mb-4">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900">Endereço & Dados Eleitorais</h3>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Endereço Completo *</label>
                        <input 
                          required
                          type="text" 
                          value={voterForm.address} 
                          onChange={e => setVoterForm({...voterForm, address: e.target.value})} 
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 font-bold text-xs text-zinc-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-zinc-300" 
                          placeholder="Rua, Número, Bairro, Cidade..." 
                        />
                      </div>

                      <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-3">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Local de Votação / TRE (Opcional)</p>
                        <TreLocationFields
                          titulo={voterForm.titulo || ''}
                          onTituloChange={val => setVoterForm(prev => ({ ...prev, titulo: val }))}
                          zona={voterForm.zona || ''}
                          secao={voterForm.secao || ''}
                          localVotacao={voterForm.localVotacao || ''}
                          onChange={updates => setVoterForm(prev => ({ ...prev, ...updates }))}
                          inputClassName="w-full bg-white border border-zinc-200 rounded-xl p-3 font-bold text-xs text-zinc-900 outline-none focus:border-blue-600 transition-all placeholder:text-zinc-300"
                          labelClassName="text-[10px] font-black text-zinc-500 uppercase tracking-widest block"
                        />
                      </div>

                      <div className="pt-4 flex justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black text-xs uppercase tracking-wider py-3 px-5 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" /> Voltar
                        </button>
                        <button
                          type="button"
                          disabled={!voterForm.address}
                          onClick={() => setCurrentStep(3)}
                          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                        >
                          Próximo: Sugestões <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: SUGESTÕES & DEMANDAS */}
                  {currentStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 mb-4">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900">Sugestões & Demandas Comunitárias</h3>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">
                          Sua Mensagem ou Pedido para a Comunidade
                        </label>
                        <textarea 
                          value={voterForm.observations} 
                          onChange={e => setVoterForm({...voterForm, observations: e.target.value})} 
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-bold text-xs text-zinc-900 outline-none focus:border-blue-600 focus:bg-white transition-all h-32 resize-none placeholder:text-zinc-300" 
                          placeholder="Conte-nos o que você espera para a sua rua, bairro ou comunidade..." 
                        />
                      </div>

                      <div className="pt-4 flex justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black text-xs uppercase tracking-wider py-3 px-5 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" /> Voltar
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                        >
                          Próximo: Confirmação <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: CONFIRMAÇÃO & LGPD */}
                  {currentStep === 4 && (
                    <motion.div 
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 mb-2">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <h3 className="font-black text-xs uppercase tracking-wider text-zinc-900">Resumo & Termo de Consentimento</h3>
                      </div>

                      {/* Summary card */}
                      <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-2 text-xs">
                        <p><strong className="text-zinc-900">Nome:</strong> {voterForm.name || '-'}</p>
                        <p><strong className="text-zinc-900">WhatsApp:</strong> {voterForm.phone || '-'}</p>
                        <p><strong className="text-zinc-900">Endereço:</strong> {voterForm.address || '-'}</p>
                        <p><strong className="text-zinc-900">Convidado por:</strong> {leaderInfo?.name || '-'}</p>
                      </div>

                      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3">
                        <p className="text-[11px] text-zinc-700 font-medium leading-relaxed">
                          Em conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong>, autorizo o uso dos meus dados cadastrais exclusivamente para relacionamento cívico e ações de engajamento do projeto <strong>{candidateInfo.name}</strong>.
                        </p>

                        <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                          <input 
                            type="checkbox"
                            required
                            checked={acceptedLgpd}
                            onChange={e => setAcceptedLgpd(e.target.checked)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-600 cursor-pointer accent-blue-600 shrink-0"
                          />
                          <span className="text-xs text-zinc-900 font-bold leading-tight">
                            Autorizo o tratamento dos meus dados conforme os termos expostos acima. *
                          </span>
                        </label>
                      </div>

                      <div className="pt-2 flex justify-between items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black text-xs uppercase tracking-wider py-4 px-5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shrink-0"
                        >
                          <ChevronLeft className="w-4 h-4" /> Voltar
                        </button>

                        <button 
                          type="submit"
                          disabled={isSubmitting || !acceptedLgpd}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-300 text-white py-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" /> Confirmar Cadastro
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                </form>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-100 text-center">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em]">
              PLATAFORMA ELEITORAL NEXUS • COORDENAÇÃO GERAL
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
