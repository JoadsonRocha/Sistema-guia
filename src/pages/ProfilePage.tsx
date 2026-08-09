import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/SupabaseProvider';
import { supabaseService } from '../lib/supabaseService';
import { candidateService, CandidateInfo, DEFAULT_CANDIDATE_INFO } from '../lib/candidateService';
import { safeLocalStorage } from '../utils/safeStorage';
import { getSubscriptionInfo, PLAN_CONFIGS } from '../lib/planService';
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Sun, 
  Moon, 
  LogOut, 
  Check, 
  Loader2, 
  KeyRound, 
  Sparkles,
  UserPlus,
  Award,
  FileText
} from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isGeral, isRegional, isLeader, logout, resetPassword } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingCandidatePhoto, setIsUploadingCandidatePhoto] = useState(false);

  // Profile Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [zone, setZone] = useState('');

  // Candidate Registration State (Displayed on public voter register page /cadastro)
  const [candidateForm, setCandidateForm] = useState<CandidateInfo>(DEFAULT_CANDIDATE_INFO);

  // System Settings State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (safeLocalStorage.getItem('urna360-theme') as 'light' | 'dark') || 'light';
  });
  const [subscriptionInfo, setSubscriptionInfo] = useState<{ plan: any; status: string }>({
    plan: 'comando',
    status: 'active'
  });

  // Load User Data & Candidate Data
  useEffect(() => {
    if (!user?.uid) return;

    let isMounted = true;
    
    // Initial fetch from users collection
    supabaseService.getDocument<any>('users', user.uid).then((doc) => {
      if (isMounted && doc) {
        setName(doc.name || user.displayName || user.email?.split('@')[0] || '');
        setPhone(doc.phone || '');
        setPhotoUrl(doc.photoUrl || user.photoURL || '');
        setBio(doc.bio || '');
        setZone(doc.zone || doc.region || doc.teamName || '');
      } else if (isMounted) {
        setName(user.displayName || user.email?.split('@')[0] || '');
        setPhotoUrl(user.photoURL || '');
      }
      setLoading(false);
    }).catch(err => {
      console.warn("Erro ao carregar dados do usuário:", err);
      if (isMounted) setLoading(false);
    });

    // Load candidate info
    const activeCoordId = user.coordinatorId || user.uid;
    candidateService.getCandidateInfo(activeCoordId).then((info) => {
      if (isMounted && info) {
        setCandidateForm(info);
      }
    });

    // Fetch subscription info
    getSubscriptionInfo(activeCoordId).then(sub => {
      if (isMounted) {
        setSubscriptionInfo({ plan: sub.plan, status: sub.status });
      }
    }).catch(err => console.warn("Erro ao buscar subscrição:", err));

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle Theme Toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    safeLocalStorage.setItem('urna360-theme', theme);
  }, [theme]);

  // Handle User Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const uploadedUrl = await supabaseService.uploadImage(file, 'public_assets');
      if (uploadedUrl) {
        setPhotoUrl(uploadedUrl);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            setPhotoUrl(base64);
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Falha ao carregar imagem de perfil:", err);
      alert("Não foi possível carregar a imagem. Tente novamente ou use um link de imagem online.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Candidate Photo Upload
  const handleCandidatePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCandidatePhoto(true);
    try {
      const uploadedUrl = await supabaseService.uploadImage(file, 'public_assets');
      if (uploadedUrl) {
        setCandidateForm(prev => ({ ...prev, photoUrl: uploadedUrl }));
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            setCandidateForm(prev => ({ ...prev, photoUrl: base64 }));
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Falha ao carregar foto do candidato:", err);
      alert("Erro ao enviar foto do candidato. Tente novamente ou cole o link direto.");
    } finally {
      setIsUploadingCandidatePhoto(false);
    }
  };

  // Handle Form Submit (Profile & Candidate)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      // 1. Save user profile
      const updates = {
        name,
        phone,
        photoUrl,
        bio,
        zone,
        updatedAt: Date.now()
      };
      await supabaseService.setDocument('users', user.uid, updates, true);

      // 2. Save candidate info if Coordenador Geral or user has candidate info
      const activeCoordId = user.coordinatorId || user.uid;
      await candidateService.saveCandidateInfo(candidateForm, user.uid, activeCoordId);

      alert("✅ Perfil e dados do candidato atualizados com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar alterações: " + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeLabel = () => {
    if (isRegional || (user?.email && user.email.toLowerCase().includes('antonio'))) return 'Coordenador Regional';
    if (isGeral) return 'Coordenador Geral';
    if (isLeader) return 'Líder de Equipe / Bairro';
    return 'Operador do Sistema';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-8">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-[var(--text-secondary)]">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 pb-20">
      
      {/* HEADER SUPERIOR DE NAVEGAÇÃO */}
      <header className="sticky top-0 z-40 bg-[var(--bg-secondary)]/90 backdrop-blur-md border-b border-[var(--border-color)] px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-blue-600 hover:text-white transition-all shadow-xs active:scale-95 flex items-center gap-2 text-xs font-semibold"
              title="Voltar ao Painel"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar ao Dashboard</span>
            </button>
            <div className="h-5 w-px bg-[var(--border-color)] hidden sm:block"></div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-tight">
                Meu Perfil e Configurações
              </h1>
              <p className="text-xs text-[var(--text-secondary)] font-normal">
                Gerencie seus dados e as informações do candidato da campanha
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] hover:bg-blue-600 hover:text-white active:scale-90 transition-all shadow-xs"
              title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => logout()}
              className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL DA PÁGINA DE PERFIL */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* CARTÃO SUPERIOR DE APRESENTAÇÃO E FOTO DE PERFIL DO OPERADOR */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500"></div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-1">
              
              {/* ÁREA DA FOTO DE PERFIL COM HOVER E BOTÃO DE UPLOAD */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-[var(--bg-tertiary)] border-2 border-blue-600/40 shadow-md overflow-hidden flex items-center justify-center relative">
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt="Foto de Perfil" 
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = ''; setPhotoUrl(''); }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[var(--text-secondary)] p-2 text-center">
                      <User className="w-10 h-10 mb-1 text-blue-500 opacity-60" />
                      <span className="text-[11px] font-medium">Sem foto</span>
                    </div>
                  )}

                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400 mb-1" />
                      <span className="text-[10px] font-semibold">Enviando...</span>
                    </div>
                  )}
                </div>

                {/* BOTÃO FLUTUANTE DE ALTERAÇÃO DA FOTO */}
                <label 
                  className={`absolute -bottom-1.5 -right-1.5 p-2.5 rounded-xl ${isUploadingPhoto ? 'bg-zinc-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 cursor-pointer'} text-white shadow-md hover:scale-105 active:scale-95 transition-all border-2 border-[var(--bg-secondary)] flex items-center justify-center`}
                  title="Alterar foto de perfil"
                >
                  <Camera className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    disabled={isUploadingPhoto} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* DADOS RESUMIDOS E NÍVEL DE ACESSO */}
              <div className="space-y-3 text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {getRoleBadgeLabel()}
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                    {name || 'Nome do Operador'}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] font-normal mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    {user?.email || 'email@sistema.com'}
                  </p>
                </div>

                {/* GERENCIAMENTO ADICIONAL DE FOTO: UPLOAD OU URL */}
                <div className="pt-3 border-t border-[var(--border-color)] space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl ${isUploadingPhoto ? 'bg-zinc-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 cursor-pointer'} text-white text-xs font-semibold transition-all shadow-sm active:scale-95`}>
                      <Upload className="w-3.5 h-3.5" />
                      {isUploadingPhoto ? 'Processando foto...' : 'Escolher foto do computador ou celular'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        disabled={isUploadingPhoto} 
                        className="hidden" 
                      />
                    </label>

                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover foto</span>
                      </button>
                    )}
                  </div>

                </div>

              </div>

            </div>

          </div>



          {/* FORMULÁRIO DE DADOS PESSOAIS E REGIONAIS DO OPERADOR */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
              <User className="w-4 h-4" /> Informações pessoais e operacionais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                  Nome completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    required
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 pl-11 text-xs font-medium outline-none focus:border-blue-600 text-[var(--text-primary)]" 
                    placeholder="Seu nome oficial" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                  Telefone / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    required
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 pl-11 text-xs font-medium outline-none focus:border-blue-600 text-[var(--text-primary)]" 
                    placeholder="(95) 99111-2026" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                  E-mail corporativo
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    disabled
                    readOnly
                    type="email" 
                    value={user?.email || ''} 
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 pl-11 text-xs opacity-60 cursor-not-allowed text-[var(--text-primary)]" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                  Zona / Região de atuação
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    type="text" 
                    value={zone} 
                    onChange={(e) => setZone(e.target.value)} 
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 pl-11 text-xs font-medium outline-none focus:border-blue-600 text-[var(--text-primary)]" 
                    placeholder="Ex: Zona Norte / Bairro Centro" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                Biografia / Observações operacionais
              </label>
              <textarea 
                rows={3}
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs font-medium outline-none focus:border-blue-600 text-[var(--text-primary)] resize-none" 
                placeholder="Breve descrição das suas atribuições ou observações da campanha..." 
              />
            </div>
          </div>

          {/* MÓDULO DA LICENÇA DA CAMPANHA & SEGURANÇA DA CONTA */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
              <ShieldCheck className="w-4 h-4" /> Licença da campanha e segurança
            </h3>

            {/* PAINEL DA LICENÇA DA CAMPANHA */}
            {isGeral && (
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      Plano atual da campanha
                    </span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    subscriptionInfo.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                  }`}>
                    {subscriptionInfo.status === 'active' ? '● Licença Ativa' : '⚠️ Suspenso / Sem Licença'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
                  <div>
                    <p className="text-sm font-bold text-amber-500">
                      {PLAN_CONFIGS[subscriptionInfo.plan]?.name || 'Plano Grátis (Degustação)'}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] font-normal mt-0.5">
                      Capacidade máxima: <strong className="text-[var(--text-primary)] font-semibold">
                        {PLAN_CONFIGS[subscriptionInfo.plan]?.maxVoters === Infinity ? 'Eleitores Ilimitados' : `${PLAN_CONFIGS[subscriptionInfo.plan]?.maxVoters?.toLocaleString('pt-BR')} Eleitores`}
                      </strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open_sales_landing'));
                      setTimeout(() => {
                        const el = document.getElementById('planos');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 300);
                    }}
                    className="text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
                  >
                    Upgrade de Plano
                  </button>
                </div>
              </div>
            )}

            {/* AÇÕES DE SEGURANÇA */}
            <div className="space-y-4 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-[var(--text-primary)] block">Redefinição de senha</span>
                  <p className="text-xs text-[var(--text-secondary)]">Envia um link de alteração de senha para o seu e-mail cadastrado.</p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!user?.email) return;
                    if (confirm(`Deseja enviar um e-mail de redefinição de senha para ${user.email}?`)) {
                      try {
                        await resetPassword(user.email);
                        alert(`✅ E-mail de redefinição enviado com sucesso para ${user.email}!`);
                      } catch (err: any) {
                        alert(`Erro ao enviar e-mail: ${err.message || err}`);
                      }
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <KeyRound className="w-4 h-4" />
                  Redefinir senha
                </button>
              </div>

              {isGeral && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-[var(--border-color)]">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-red-500 block">Zerar banco de dados</span>
                    <p className="text-xs text-[var(--text-secondary)]">Limpa todos os dados locais e registros de teste da campanha para recomeçar.</p>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm("⚠️ ATENÇÃO EXTREMA: Deseja apagar TODOS os dados da campanha (eleitores, equipes, materiais, agenda) para zerar o banco? Esta ação é irreversível!")) {
                        try {
                          await supabaseService.clearAllLocalDemoData();
                          alert("✅ Banco de dados zerado com sucesso!");
                          window.location.reload();
                        } catch (err) {
                          alert("Erro ao zerar banco: " + err);
                        }
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    Zerar banco
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* BOTÃO DE SALVAMENTO FIXO/RODAPÉ */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-pointer text-center"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving || isUploadingPhoto || isUploadingCandidatePhoto}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 text-white animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-white" /> Salvar perfil e candidato
                </>
              )}
            </button>
          </div>

        </form>

      </main>

    </div>
  );
}
