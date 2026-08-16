import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import { TreLocationFields } from './TreLocationFields';
import { WhatsAppDispatchModal } from './WhatsAppDispatchModal';
import { SystemManualModal } from './SystemManualModal';
import { getGPSLocation } from '../lib/geoService';
import { 
  BookOpen,
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
  ChevronDown,
  ChevronUp,
  Camera,
  UserPlus,
  StickyNote,
  RefreshCcw,
  User,
  Brain,
  Send,
  X,
  Plus,
  Check,
  Copy,
  LogIn,
  LogOut,
  Settings,
  Upload,
  Calendar,
  Clock,
  FileText,
  FileDown,
  FileSpreadsheet,
  GanttChart,
  Trash2,
  Edit3,
  Lock,
  Phone,
  LayoutDashboard,
  Layers,
  DollarSign,
  Briefcase,
  Target,
  Wallet,
  History,
  TrendingUp,
  Printer,
  Zap,
  MessageSquare,
  Search,
  Package,
  Handshake,
  Activity,
  Sun,
  Moon,
  Loader2,
  Mail,
  Map as MapIcon,
  Search,
  Trophy,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { processarCaos, gerarBriefingCandidato, processarNotaAudio } from '../services/geminiService';
import { sugerirMetaInteligente, analisarRaioXEquipe } from '../services/groqService';
import { reportService } from '../services/reportService';
import { useAuth } from '../lib/SupabaseProvider';
import { supabaseService } from '../lib/supabaseService';
import { candidateService, CandidateInfo, DEFAULT_CANDIDATE_INFO } from '../lib/candidateService';
import { showToast } from './GlobalToastHost';
import { getSubscriptionInfo, saveSubscriptionPlan, PlanType, PLAN_CONFIGS, validateLeaderRegistration, validateRegionalRegistration, triggerUpgradeRedirect } from '../lib/planService';
import NoteCard from './NoteCard';
import RoraimaMapComponent from './RoraimaMapComponent';
import EleitoralDashboard from './EleitoralDashboard';
import PublicVoterRegister from './PublicVoterRegister';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { validarSugestaoAgenda, AgendaItem } from '../lib/agendaLogic';
import * as XLSX from 'xlsx';
import { safeLocalStorage } from '../utils/safeStorage';
import { isLocationMatchingGoal } from '../data/roraimaTreData';
import { clearTreLocationsCache } from '../lib/treDataService';

const AVAILABLE_COLUMNS_BY_TYPE: Record<string, { header: string; dataKey: string }[]> = {
  teams: [
    { header: 'Zona/Equipe', dataKey: 'name' },
    { header: 'Líder', dataKey: 'leader' },
    { header: 'Localização', dataKey: 'location' },
    { header: 'Eleitores', dataKey: 'realContacts' },
    { header: 'Demandas', dataKey: 'demandCount' },
    { header: 'Gasto Real', dataKey: 'spentStr' },
    { header: 'Status', dataKey: 'status' }
  ],
  voters: [
    { header: 'Nome', dataKey: 'name' },
    { header: 'Telefone', dataKey: 'phone' },
    { header: 'Equipe/Zona', dataKey: 'teamDisplay' },
    { header: 'Indicado por', dataKey: 'referredByDisplay' },
    { header: 'Sentimento', dataKey: 'sentiment' },
    { header: 'Votou', dataKey: 'votedStatus' },
    { header: 'Endereço', dataKey: 'address' },
    { header: 'Comunidade/Família', dataKey: 'familyCommunity' },
    { header: 'Comunidade Indígena', dataKey: 'communityName' },
    { header: 'Tuxaua', dataKey: 'tuxauaName' },
    { header: 'Score Fidelidade', dataKey: 'loyaltyScore' },
    { header: 'Observações', dataKey: 'observations' },
    { header: 'Tags', dataKey: 'tagsStr' }
  ],
  productivity: [
    { header: 'Posição', dataKey: 'rank' },
    { header: 'Liderança', dataKey: 'leader' },
    { header: 'Equipe/Zona', dataKey: 'team' },
    { header: 'Total Eleitores', dataKey: 'totalVoters' },
    { header: 'Apoios Confirmados', dataKey: 'supportVoters' },
    { header: '% Conversão', dataKey: 'conversionRate' },
    { header: 'Score Médio', dataKey: 'avgLoyalty' },
    { header: 'Status Desempenho', dataKey: 'leaderStatus' }
  ],
  zone_performance: [
    { header: 'Município', dataKey: 'municipality' },
    { header: 'Zona Eleitoral', dataKey: 'zona' },
    { header: 'Seção', dataKey: 'secao' },
    { header: 'Eleitores Mapeados', dataKey: 'mappedVoters' },
    { header: 'Votos Confirmados', dataKey: 'confirmedVotes' },
    { header: 'Neutros', dataKey: 'neutralVoters' },
    { header: 'Oposição', dataKey: 'opposedVoters' },
    { header: 'Diagnóstico', dataKey: 'densityStatus' }
  ],
  agenda_coverage: [
    { header: 'Município/Região', dataKey: 'municipality' },
    { header: 'Eleitores na Base', dataKey: 'voterCount' },
    { header: 'Equipes Ativas', dataKey: 'teamCount' },
    { header: 'Eventos/Visitas', dataKey: 'eventCount' },
    { header: 'Status Cobertura', dataKey: 'coverageStatus' },
    { header: 'Última Visita', dataKey: 'lastEventDate' },
    { header: 'Ação Recomendada', dataKey: 'urgencyLevel' }
  ],
  materials: [
    { header: 'Material', dataKey: 'name' },
    { header: 'Total', dataKey: 'total' },
    { header: 'Disponível', dataKey: 'current' },
    { header: 'Usado', dataKey: 'used' }
  ],
  demands: [
    { header: 'Título', dataKey: 'title' },
    { header: 'Equipe/Zona', dataKey: 'team' },
    { header: 'Prioridade', dataKey: 'priority' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Data', dataKey: 'dateStr' }
  ]
};

export const isVoterInTeam = (voter: any, team: any) => {
  if (!voter || !team) return false;
  const teamName = (team.name || '').trim().toLowerCase();
  
  const voterTeam = (voter.team || '').trim().toLowerCase();
  const voterTeamName = (voter.teamName || '').trim().toLowerCase();
  if (teamName && (voterTeam === teamName || voterTeamName === teamName)) return true;

  const teamLeader = (team.leader || '').trim().toLowerCase();
  const voterLeader = (voter.leaderName || '').trim().toLowerCase();
  if (teamLeader && voterLeader && teamLeader === voterLeader) return true;

  const teamLeaderEmail = (team.leaderEmail || '').trim().toLowerCase();
  const voterLeaderEmail = (voter.leaderEmail || voter.registeredBy || voter.createdBy || '').trim().toLowerCase();
  if (teamLeaderEmail && voterLeaderEmail && teamLeaderEmail === voterLeaderEmail) return true;

  if (voter.leaderId && (voter.leaderId === team.id || voter.leaderId === team.leaderId || voter.leaderId === team.createdBy)) return true;

  return false;
};

export default function CoordinatorDashboard({ 
  theme, 
  setTheme
}: { 
  theme: 'light' | 'dark'; 
  setTheme: (t: 'light' | 'dark') => void;
}) {
  const navigate = useNavigate();
  const { user, login, logout, isAdmin, isGeral, isRegional, isLeader, userRegion, coordinatorId } = useAuth();

  // Restaurar a última aba visitada ao recarregar a página (persiste no localStorage)
  const ACTIVE_TAB_KEY = 'nexus_coordinator_active_tab';
  type ActiveTabType = 'overview' | 'candidato' | 'regional_coords' | 'metas' | 'teams' | 'voters' | 'agenda' | 'mapa' | 'notes' | 'materials' | 'demands' | 'reports' | 'analise_eleitoral';
  const [activeTab, setActiveTabState] = useState<ActiveTabType>('overview');

  // Função que salva a aba ativa no localStorage antes de mudar o estado
  const setActiveTab = (tab: ActiveTabType) => {
    try { localStorage.setItem(ACTIVE_TAB_KEY, tab); } catch (_) {}
    setActiveTabState(tab);
  };
  const [noteSubTab, setNoteSubTab] = useState<'tactical' | 'private'>('tactical');
  const [selectedLinkTeam, setSelectedLinkTeam] = useState('');

  // Redirect away logic removed to ensure all tabs are accessible


  // Coordenadores Regionais State
  const [regionalCoordinators, setRegionalCoordinators] = useState<any[]>([]);
  const [isRegionalModalOpen, setIsRegionalModalOpen] = useState(false);
  const [regCoordStep, setRegCoordStep] = useState<'form' | 'success'>('form');
  const [createdRegCoordLink, setCreatedRegCoordLink] = useState('');
  const [newRegCoord, setNewRegCoord] = useState({
    name: '',
    email: '',
    phone: '',
    region: '',
    municipio: '',
    bairro: '',
    subLocations: '',
    targetVoters: 500,
  });

  // Metas State
  const [goalsList, setGoalsList] = useState<any[]>([]);
  const [goalCategory, setGoalCategory] = useState<'bairro' | 'municipio' | 'regiao'>('municipio');
  const [newGoal, setNewGoal] = useState({
    locationName: '',
    targetVoters: 1000,
    category: 'municipio' as 'bairro' | 'municipio' | 'regiao'
  });
  const [isGroqLoading, setIsGroqLoading] = useState(false);

  // Edit Goal State
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);

  // Edit Regional Coordinator State
  const [editingRegCoord, setEditingRegCoord] = useState<any | null>(null);
  const [isEditRegCoordModalOpen, setIsEditRegCoordModalOpen] = useState(false);

  // Link Share Modal
  const [isShareLinkModalOpen, setIsShareLinkModalOpen] = useState(false);
  const [selectedShareTeam, setSelectedShareTeam] = useState('');

  // Teams UI State
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamStatusFilter, setTeamStatusFilter] = useState<'ALL' | 'ALERTA' | 'CRITICO'>('ALL');
  const [teamGroqLoading, setTeamGroqLoading] = useState<string | null>(null);

  // Cadastro do Candidato State e Licença
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [candidateModalTab, setCandidateModalTab] = useState<'identificacao' | 'apresentacao' | 'publico'>('identificacao');
  const [candidateForm, setCandidateForm] = useState<CandidateInfo>(DEFAULT_CANDIDATE_INFO);
  const [candidatesList, setCandidatesList] = useState<CandidateInfo[]>([DEFAULT_CANDIDATE_INFO]);
  const [editingCandidateId, setEditingCandidateId] = useState<string | undefined>(undefined);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('comando');
  const [selectedPlanStatus, setSelectedPlanStatus] = useState<'active' | 'none'>('active');
  const [isSavingCandidate, setIsSavingCandidate] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    const unsub = candidateService.subscribeCandidateInfo((info) => {
      setCandidateForm(info);
    }, coordinatorId);
    const unsubList = candidateService.subscribeCandidatesList((list) => {
      setCandidatesList(list);
    }, coordinatorId);
    getSubscriptionInfo(coordinatorId).then(sub => {
      setSelectedPlan(sub.plan);
      setSelectedPlanStatus(sub.status === 'active' ? 'active' : 'none');
    }).catch(err => {
      console.warn("Erro ao buscar subscrição:", err);
    });
    return () => { unsub(); unsubList(); };
  }, [coordinatorId]);

  const handleCandidatePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingPhoto(true);
    try {
      const publicUrl = await supabaseService.uploadImage(file, 'public_assets');
      if (publicUrl) {
        setCandidateForm(prev => ({ ...prev, photoUrl: publicUrl }));
      } else {
        // Fallback: Compressa a imagem para Data URL JPEG otimizada
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500;
            const scaleSize = MAX_WIDTH / (img.width || 1);
            canvas.width = MAX_WIDTH;
            canvas.height = (img.height || 1) * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.85);
            setCandidateForm(prev => ({ ...prev, photoUrl: base64 }));
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn("Upload via Supabase Storage indisponível, aplicando compressão gráfica local:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const scaleSize = MAX_WIDTH / (img.width || 1);
          canvas.width = MAX_WIDTH;
          canvas.height = (img.height || 1) * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          setCandidateForm(prev => ({ ...prev, photoUrl: base64 }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveCandidateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCandidate(true);
    try {
      const candidateToSave: CandidateInfo = {
        ...candidateForm,
        id: editingCandidateId || candidateForm.id || `cand_${Date.now()}`
      };
      const newList = await candidateService.saveCandidate(candidateToSave, user?.uid, coordinatorId);
      setCandidatesList(newList);
      setCandidateForm({ ...DEFAULT_CANDIDATE_INFO, id: undefined });
      setEditingCandidateId(undefined);
      setIsCandidateModalOpen(false);
      alert("✅ Candidato salvo com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar candidato: " + err.message);
    } finally {
      setIsSavingCandidate(false);
    }
  };

  const handleDownloadDoc = () => {
    const textHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Manual Inteligente do Coordenador - Nexus Política</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 40px; }
          .header { text-align: center; border-bottom: 3px solid #0578d3; padding-bottom: 20px; margin-bottom: 30px; }
          .title { color: #000000; font-size: 26px; font-weight: bold; text-transform: uppercase; margin: 0; }
          .subtitle { color: #4b5563; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 10px; }
          blockquote { border-left: 4px solid #0578d3; padding-left: 20px; font-style: italic; color: #374151; background: #fafafa; padding: 15px; margin: 25px 0; }
          h2 { color: #000000; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 35px; font-size: 18px; text-transform: uppercase; }
          .meta-bold { font-weight: bold; color: #111827; }
          p { font-size: 13px; color: #374151; margin-bottom: 15px; text-align: justify; }
          .highlight-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 4px; margin-top: 15px; }
          .highlight-box p { margin: 0; color: #166534; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 60px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Nexus Política</div>
          <div class="subtitle">Manual Inteligente do Coordenador de Campanha</div>
        </div>

        <blockquote style="font-size: 13px;">
          "A função central é cuidar, ajustar e direcionar a campanha eleitoral de um determinado candidato. O coordenador gerencia os acertos e compromissos diários de campanha. Ele é responsável por articular com parceiros no meio político, seja no âmbito estadual, municipal ou da república. O profissional realiza o gerenciamento das finanças, administrando os valores de campanha repassados pelo partido. O coordenador fatia e distribui o dinheiro para cobrir custos com cabos eleitorais, combustível, escritórios de mídia, santinhos e outros materiais. A figura do coordenador representa o homem de extrema confiança do político. A palavra desse profissional possui muito peso, sendo tratada como se fosse a palavra do próprio candidato. Todas as decisões, ideias, reuniões e resoluções de grupos dentro da campanha precisam passar pelo aval do coordenador."
        </blockquote>

        <h2>1. Direcionar e Cuidar da Campanha</h2>
        <p><span class="meta-bold">Função Clássica:</span> Cuidar, ajustar e guiar estrategicamente o progresso e o foco das frentes eleitorais urbana e rural.</p>
        <p><span class="meta-bold">No Nexus Política:</span> Por meio do Dashboard Central Unificado (aba Visão Geral), o coordenador monitora em tempo real a estatística consolidada de eleitores cadastrados, metas gerais por equipes, andamento das visitas e nível de atividade de todos os cabos eleitorais integrados.</p>
        <div class="highlight-box">
          <p>⚡ Impacto Prático vs. Método Tradicional: Substitui a dependência de telefonemas incertos e relatórios informais por métricas exatas centralizadas. O coordenador ganha poder de intervenção estratégica imediata para recalibrar frentes estagnadas.</p>
        </div>

        <h2>2. Gerenciamento de Compromissos e Acertos</h2>
        <p><span class="meta-bold">Função Clássica:</span> Gerenciar a pauta de rua, reuniões territoriais mundanas e compromissos diários do candidato, otimizando o tempo dele.</p>
        <p><span class="meta-bold">No Nexus Política:</span> Integrado na aba Mapa e Agenda, permitindo vincular compromissos locais às necessidades comunitárias. Permite cadastrar visitas regionais cruzando dados diretamente com o mapa de demandas prioritárias.</p>
        <div class="highlight-box">
          <p>⚡ Impacto Prático vs. Método Tradicional: Evita colisões e redundâncias geográficas. O candidato sobe no palanque dominando minuciosamente quais as reais queixas e demandas geológicas do bairro visitado.</p>
        </div>

        <h2>3. Articulação com Parceiros Políticos</h2>
        <p><span class="meta-bold">Função Clássica:</span> Manter contato contínuo e equilibrar parcerias estratégicas regionais, de lideranças locais a apoios estaduais.</p>
        <p><span class="meta-bold">No Nexus Política:</span> Integrado na central de Articulação (CRM de Parceiros), permitindo registrar todas as lideranças agregadas, gerenciar o status de relacionamento ("Quente", "Morno", "Frio"), histórico de encontros e monitoramento das metas de angariação particulares a cada um.</p>
        <div class="highlight-box">
          <p>⚡ Impacto Prático vs. Método Tradicional: Evita o desengajamento ou o "esfriamento" de redutos eleitorais por falta de comunicação continuada. Cada parceria tem um histórico de atendimento digitalizado indelével.</p>
        </div>

        <h2>4. Administração das Finanças e Custos de Campanha</h2>
        <p><span class="meta-bold">Função Clássica:</span> Distribuir fatias financeiras para cabos eleitorais rurais, alimentação de bases, gastos de combustível integrado e confecção de santinhos físicos.</p>
        <p><span class="meta-bold">No Nexus Política:</span> Operado através da aba Financeiro e Gestão de Materiais, permitindo destinar limites financeiros exatos a frentes de atuação específicas, autorizar injeções de recursos urgentes no Vault Digital e auditar fotos de recibos e folhas de presença de rua imediatamente.</p>
        <div class="highlight-box">
          <p>⚡ Impacto Prático vs. Método Tradicional: Elimina a famosa "caixa-preta" de rua. Toda transação exige comprovação fotográfica, mitigando desvios e cobrando o máximo de rendimento por cada centavo empregado.</p>
        </div>

        <h2>5. Representação de Confiança e Tomada de Decisão</h2>
        <p><span class="meta-bold">Função Clássica:</span> Atuar como a voz oficial com autoridade final para chancelar estratégias, pautas civis e responder resoluções internas.</p>
        <p><span class="meta-bold">No Nexus Política:</span> Concentrado no painel de Anotações Táticas (dividido em Fórum Comum da Equipe e Observações Privadas do Coordenador), além da central de aprovação de Demandas (Ouvidoria de Campo). Nenhuma questão ganha andamento legal ou visibilidade coletiva sem o endosso prévio do perfil do Coordenador.</p>
        <div class="highlight-box">
          <p>⚡ Impacto Prático vs. Método Tradicional: Blinda o comitê contra espionagem por canais públicos (WhatsApp). Centraliza e hierarquiza cronogramas estratégicos de forma unívoca.</p>
        </div>

        <div class="footer">
          <p>Documento Oficial Gerado Eletronicamente pelo Ecossistema Nexus Política.</p>
          <p>Confidencialidade de Nível Governamental e Alta Operação Militar de Campo.</p>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + textHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MANUAL_INTELIGENTE_DO_COORDENADOR_NEXUS_POLITICA.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    
    // Configurações de cores e fontes
    doc.setTextColor(26, 26, 26);
    
    // Título Principal em Azul Nexus
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue-600 Nexus
    doc.text("NEXUS POLÍTICA", 14, 25);
    
    doc.setFontSize(14);
    doc.setTextColor(71, 85, 105);
    doc.text("Manual Inteligente do Coordenador de Campanha", 14, 33);
    
    // Linha horizontal Azul Nexus
    doc.setDrawColor(37, 99, 235); // Blue-600
    doc.setLineWidth(1.5);
    doc.line(14, 38, 196, 38);
    
    // Bloco de citação
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 43, 182, 50, "F");
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1);
    doc.line(14, 43, 14, 93);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(55, 65, 81);
    
    const quoteText = "A função central é cuidar, ajustar e direcionar a campanha eleitoral de um determinado candidato. O coordenador gerencia os acertos e compromissos diários de campanha. Ele é responsável por articular com parceiros no meio político, seja no âmbito estadual, municipal ou da república. O profissional realiza o gerenciamento das finanças, administrando os valores de campanha repassados pelo partido. O coordenador fatia e distribui o dinheiro para cobrir custos com cabos eleitorais, combustível, escritórios de mídia, santinhos e outros materiais. A figura do coordenador representa o homem de extrema confiança do político. A palavra desse profissional possui muito peso, sendo tratada como se fosse a palavra do próprio candidato.";
    
    const quoteLines = doc.splitTextToSize(quoteText, 172);
    doc.text(quoteLines, 19, 50);
    
    let y = 105;
    
    // Função auxiliar para desenhar uma seção
    const drawSection = (title: string, text: string, impact: string) => {
      if (y > 230) {
        doc.addPage();
        y = 25;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text(title, 14, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      const textLines = doc.splitTextToSize(text, 182);
      doc.text(textLines, 14, y);
      y += (textLines.length * 5) + 2;
      
      // Impact Box
      doc.setFillColor(240, 253, 244); // f0fdf4
      const impactLines = doc.splitTextToSize(impact, 172);
      const boxHeight = (impactLines.length * 4.5) + 6;
      
      doc.rect(14, y, 182, boxHeight, "F");
      doc.setDrawColor(187, 247, 208); // bbf7d0
      doc.setLineWidth(0.5);
      doc.rect(14, y, 182, boxHeight, "S");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(22, 101, 52); // 166534
      doc.text(impactLines, 19, y + 5);
      
      y += boxHeight + 12;
    };
    
    drawSection(
      "1. Direcionar e Cuidar da Campanha",
      "Função Clássica: Cuidar, ajustar e guiar estrategicamente o progresso e o foco das frentes eleitorais urbana e rural. No Nexus Política: Por meio do Dashboard Central Unificado (aba Visão Geral), o coordenador monitora em tempo real a estatística consolidada de eleitores cadastrados, metas gerais por equipes, andamento das visitas e nível de atividade de todos os cabos eleitorais integrados.",
      "⚡ Impacto Prático vs. Método Tradicional: Substitui a dependência de relatórios informais por métricas exatas centralizadas. O coordenador ganha poder de intervenção estratégica imediata para recalibrar frentes estagnadas."
    );
    
    drawSection(
      "2. Gerenciamento de Compromissos e Acertos",
      "Função Clássica: Gerenciar a pauta de rua, reuniões territoriais e compromissos diários do candidato, otimizando o tempo dele. No Nexus Política: Integrado na aba Mapa e Agenda, permitindo vincular compromissos locais às necessidades comunitárias. Permite cadastrar visitas regionais cruzando dados diretamente com o mapa de demandas prioritárias.",
      "⚡ Impacto Prático vs. Método Tradicional: Evita colisões e redundâncias geográficas. O candidato sobe no palanque dominando minuciosamente quais as reais queixas e demandas do bairro visitado."
    );
    
    drawSection(
      "3. Articulação com Parceiros Políticos",
      "Função Clássica: Manter contato contínuo e equilibrar parcerias estratégicas regionais, de lideranças locais a apoios estaduais. No Nexus Política: Integrado na central de Articulação (CRM de Parceiros), permitindo registrar todas as lideranças agregadas, gerenciar o status de relacionamento (Quente, Morno, Frio), histórico de encontros e monitoramento das metas particulares.",
      "⚡ Impacto Prático vs. Método Tradicional: Evita o desengajamento de redutos eleitorais por falta de comunicação. Cada parceria tem um histórico de atendimento digitalizado indelével."
    );
    
    drawSection(
      "4. Administração das Finanças e Custos de Campanha",
      "Função Clássica: Distribuir fatias financeiras para cabos eleitorais rurais, alimentação de bases, gastos de combustível e confecção de santinhos físicos. No Nexus Política: Operado através da aba Financeiro e Gestão de Materiais, permitindo destinar limites financeiros exatos a frentes de atuação específicas, autorizar injeções de recursos urgentes e auditar fotos de recibos imediatamente.",
      "⚡ Impacto Prático vs. Método Tradicional: Elimina a famosa fossa financeira de rua. Toda transação exige comprovação fotográfica, mitigando desvios e cobrando o máximo de rendimento por cada centavo empregado."
    );
    
    drawSection(
      "5. Representação de Confiança e Tomada de Decisão",
      "Função Clássica: Atuar como a voz oficial com autoridade final para chancelar estratégias, pautas civis e responder resoluções internas. No Nexus Política: Concentrado no painel de Anotações Táticas (Fórum Comum da Equipe e Observações Privadas do Coordenador), além da central de aprovação de Demandas (Ouvidoria de Campo). Nenhuma questão ganha andamento sem o endosso prévio do Coordenador.",
      "⚡ Impacto Prático vs. Método Tradicional: Blinda o comitê contra vazamento de dados em canais públicos inseguros. Centraliza e hierarquiza cronogramas estratégicos de forma segura."
    );
    
    // Rodapé final se houver espaço
    if (y > 250) {
      doc.addPage();
      y = 30;
    }
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("Documento Oficial Gerado Eletronicamente pelo Ecossistema Nexus Política.", 14, y);
    doc.text("Confidencialidade de Nível Governamental e Alta Operação Militar de Campo.", 14, y + 4);
    
    doc.save("MANUAL_INTELIGENTE_DO_COORDENADOR_NEXUS_POLITICA.pdf");
  };

  
  // Reports State
  const [reportsHistory, setReportsHistory] = useState<any[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [reportDetailLevel, setReportDetailLevel] = useState<'summary' | 'detailed'>('summary');
  const [reportFilters, setReportFilters] = useState<any>({});
  const [selectedReportColumns, setSelectedReportColumns] = useState<string[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [materialRequests, setMaterialRequests] = useState<any[]>([]);
  const [collapsedRequests, setCollapsedRequests] = useState<Record<string, boolean>>({});
  const [demandsSummary, setDemandsSummary] = useState<any[]>([]);
  const [dailyOrder, setDailyOrder] = useState<any>(null);
  const [dailyOrders, setDailyOrders] = useState<any[]>([]);
  const [isEditingDailyOrder, setIsEditingDailyOrder] = useState(false);
  const [newDailyOrder, setNewDailyOrder] = useState('');
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [chaosText, setChaosText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const [isEditingMaterial, setIsEditingMaterial] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({ name: '', qty: '' });
  
  // Digital signature states for material requests
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signingRequest, setSigningRequest] = useState<any>(null);
  const [signerName, setSignerName] = useState('');
  
  const [selectedUrgency, setSelectedUrgency] = useState<any>(null);
  const [observation, setObservation] = useState('');
  const [isUrgencyModalOpen, setIsUrgencyModalOpen] = useState(false);

  const [teams, setTeams] = useState<any[]>([]);
  const [urgencies, setUrgencies] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
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
  const [allVoters, setAllVoters] = useState<any[]>([]);
  const [paginatedVotersList, setPaginatedVotersList] = useState<any[]>([]);
  const [loadingPaginatedVoters, setLoadingPaginatedVoters] = useState(false);
  const [hasMoreVoters, setHasMoreVoters] = useState(true);
  const [totalVotersCount, setTotalVotersCount] = useState<number>(0);
  const [votedVotersCount, setVotedVotersCount] = useState<number>(0);
  const [articulators, setArticulators] = useState<any[]>([]);
  const [teamVotersCountMap, setTeamVotersCountMap] = useState<Record<string, number>>({});
  const [voterPage, setVoterPage] = useState(1);
  const [voterPageSize, setVoterPageSize] = useState(50);
  const [voterFilterTags, setVoterFilterTags] = useState<string[]>([]);
  const [voterSearch, setVoterSearch] = useState('');
  const [voterFilterReferredBy, setVoterFilterReferredBy] = useState('');
  const [articulatorFilter, setArticulatorFilter] = useState('');

  // Subscrições para Coordenadores Regionais e Metas
  useEffect(() => {
    if (!coordinatorId) return;
    const unsubRegs = supabaseService.subscribeToCollectionFiltered<any>('regional_coordinators', coordinatorId, (data) => setRegionalCoordinators(data));

    const unsubGoals = supabaseService.subscribeToCollectionFiltered<any>('goals', coordinatorId, (data) => setGoalsList(data));

    return () => {
      unsubRegs();
      unsubGoals();
    };
  }, [coordinatorId]);

  const handleCreateRegionalCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegCoord.name || !newRegCoord.email || !newRegCoord.region) {
      alert("Preencha o nome, e-mail e região do Coordenador Regional.");
      return;
    }
    
    const regValidation = await validateRegionalRegistration(coordinatorId || user?.uid);
    if (!regValidation.allowed) {
      triggerUpgradeRedirect(regValidation.reason!, isGeral);
      return;
    }

    try {
      setIsProcessing(true);
      const coordId = `reg_${newRegCoord.email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      const tempPassword = 'nexus' + Math.floor(1000 + Math.random() * 9000);
      
      await supabaseService.setDocument('regional_coordinators', coordId, {
        ...newRegCoord,
        email: newRegCoord.email.toLowerCase(),
        subLocations: newRegCoord.subLocations || '',
        targetVoters: Number(newRegCoord.targetVoters) || 500,
        tempPassword,
        coordinatorId: coordinatorId || user?.uid || '',
        createdAt: Date.now()
      });

      await supabaseService.setDocument('pre_registrations', newRegCoord.email.toLowerCase(), {
        email: newRegCoord.email.toLowerCase(),
        name: newRegCoord.name,
        phone: newRegCoord.phone,
        region: newRegCoord.region,
        subLocations: newRegCoord.subLocations || '',
        role: 'coordenador_regional',
        tempPassword,
        coordinatorId: coordinatorId || user?.uid || '',
        createdAt: Date.now()
      });

      const accessLink = `${window.location.origin}/login?email=${encodeURIComponent(newRegCoord.email)}&access_token=${btoa(tempPassword)}&role=coordenador_regional&coordinatorId=${coordinatorId || user?.uid || ''}`;
      setCreatedRegCoordLink(accessLink);
      setRegCoordStep('success');
    } catch (err: any) {
      alert("Erro ao cadastrar Coordenador Regional: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRegionalCoordinator = async (id: string, email: string) => {
    if (confirm("Deseja realmente remover este Coordenador Regional?")) {
      try {
        await supabaseService.deleteDocument('regional_coordinators', id);
        if (email) {
          await supabaseService.deleteDocument('pre_registrations', email.toLowerCase());
        }
        alert("Coordenador Regional removido!");
      } catch (err: any) {
        alert("Erro ao remover: " + err.message);
      }
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.locationName) {
      alert("Informe o nome do local (Bairro, Município ou Região).");
      return;
    }
    try {
      const goalId = `goal_${newGoal.category}_${newGoal.locationName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      await supabaseService.setDocument('goals', goalId, {
        ...newGoal,
        targetVoters: Number(newGoal.targetVoters) || 500,
        coordinatorId: coordinatorId || user?.uid || '',
        createdAt: Date.now()
      });
      setNewGoal({ locationName: '', targetVoters: 1000, category: goalCategory });
      alert("Meta registrada com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar meta: " + err.message);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm("Deseja excluir esta meta?")) {
      try {
        await supabaseService.deleteDocument('goals', id);
      } catch (err: any) {
        alert("Erro ao excluir meta: " + err.message);
      }
    }
  };

  const handleOpenEditGoal = (goal: any) => {
    setEditingGoal({ ...goal });
    setIsEditGoalModalOpen(true);
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editingGoal.locationName) return;
    try {
      setIsProcessing(true);
      await supabaseService.setDocument('goals', editingGoal.id, {
        ...editingGoal,
        targetVoters: Number(editingGoal.targetVoters) || 0,
        updatedAt: Date.now()
      });
      setIsEditGoalModalOpen(false);
      setEditingGoal(null);
      alert("Meta geral atualizada com sucesso!");
    } catch (err: any) {
      alert("Erro ao atualizar meta: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenEditRegCoord = (coord: any) => {
    setEditingRegCoord({ ...coord });
    setIsEditRegCoordModalOpen(true);
  };

  const handleUpdateRegionalCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegCoord || !editingRegCoord.name || !editingRegCoord.email) return;
    try {
      setIsProcessing(true);
      await supabaseService.setDocument('regional_coordinators', editingRegCoord.id, {
        ...editingRegCoord,
        targetVoters: Number(editingRegCoord.targetVoters) || 0,
        updatedAt: Date.now()
      });
      if (editingRegCoord.email) {
        await supabaseService.setDocument('pre_registrations', editingRegCoord.email.toLowerCase(), {
          email: editingRegCoord.email.toLowerCase(),
          name: editingRegCoord.name,
          phone: editingRegCoord.phone || '',
          region: editingRegCoord.region || '',
          subLocations: editingRegCoord.subLocations || '',
          role: 'coordenador_regional',
          coordinatorId: editingRegCoord.coordinatorId || coordinatorId || user?.uid || '',
          tempPassword: editingRegCoord.tempPassword || '',
          updatedAt: Date.now()
        });
      }
      setIsEditRegCoordModalOpen(false);
      setEditingRegCoord(null);
      alert("Coordenador Regional e meta atualizados com sucesso!");
    } catch (err: any) {
      alert("Erro ao atualizar Coordenador Regional: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to find matched regional coordinators for a given goal location name
  const getMatchedRegCoordsForGoal = (locationName: string) => {
    if (!locationName) return [];
    return regionalCoordinators.filter(coord => {
      return isLocationMatchingGoal(locationName, coord.region, coord.subLocations);
    });
  };

  // Helper function to find matched teams/leaders for a given goal location name
  const getMatchedTeamsForGoal = (locationName: string) => {
    if (!locationName) return [];
    return teams.filter(team => {
      return isLocationMatchingGoal(
        locationName, 
        team.region || team.name || '', 
        team.neighborhoods || team.subLocations || team.description || ''
      );
    });
  };

  const handlePurgeAllTestData = async () => {
    const activeCoordId = coordinatorId || user?.uid;
    if (!isAdmin || !activeCoordId) return;

    if (window.confirm("⚠️ ATENÇÃO: ZERAR BANCO DE DADOS DA SUA CAMPANHA\n\nDeseja LIMPAR TODOS OS DADOS DA SUA CAMPANHA (eleitores, equipes, regionais, materiais, demandas, anotações e metas)?\n\nEsta ação afeta APENAS o seu ambiente de Coordenador Geral e é totalmente isolada de outras campanhas. Esta ação é irreversível.")) {
      try {
        setIsProcessing(true);
        const collectionsToWipe = [
          'voters', 
          'teams', 
          'regional_coordinators', 
          'transactions', 
          'attendance', 
          'notes', 
          'urgencies', 
          'agenda', 
          'materials', 
          'material_requests',
          'demands', 
          'goals',
          'reports',
          'partners'
        ];

        for (const coll of collectionsToWipe) {
          try {
            const allDocs = await supabaseService.getCollection<any>(coll);
            const myDocs = allDocs.filter(d => 
              !d.coordinatorId || 
              d.coordinatorId === activeCoordId || 
              d.createdBy === activeCoordId ||
              d.userId === activeCoordId
            );
            for (const d of myDocs) {
              await supabaseService.deleteDocument(coll, d.id);
            }
          } catch (e) {
            console.warn(`Aviso ao limpar coleção ${coll}:`, e);
          }
        }

        try {
          const allPreRegs = await supabaseService.getCollection<any>('pre_registrations');
          const myPreRegs = allPreRegs.filter(pr => pr.coordinatorId === activeCoordId);
          for (const pr of myPreRegs) {
            await supabaseService.deleteDocument('pre_registrations', pr.id);
          }
        } catch (e) {
          console.warn("Aviso ao limpar pré-registros:", e);
        }

        try {
          await supabaseService.deleteDocument('stats', `stats_${activeCoordId}`);
        } catch (e) {
          console.warn("Aviso ao deletar stats:", e);
        }
        try {
          await supabaseService.deleteDocument('config', `dailyOrder_${activeCoordId}`);
        } catch (e) {
          console.warn("Aviso ao deletar ordem do dia:", e);
        }

        try {
          await supabaseService.setDocument('eleitoral_data', `coord_${activeCoordId}`, {
            locations: [],
            cleared: true,
            updatedAt: Date.now(),
            coordinatorId: activeCoordId,
            chunksCount: 0,
            isChunked: false
          });
          for (let i = 0; i < 20; i++) {
            try {
              await supabaseService.deleteDocument('eleitoral_data', `coord_${activeCoordId}_${i}`);
            } catch (e) {}
          }
        } catch (e) {
          console.warn("Aviso ao deletar dados eleitorais:", e);
        }

        clearTreLocationsCache(activeCoordId);
        supabaseService.clearAllLocalDemoData();
        safeLocalStorage.removeItem(`urna360_voters_cache_${activeCoordId}`);
        safeLocalStorage.removeItem(`sistema_urna360_eleitoral_data_${activeCoordId}`);
        safeLocalStorage.setItem(`sistema_urna360_eleitoral_data_${activeCoordId}`, '[]');

        alert("✅ Banco de dados da sua campanha foi zerado com sucesso! Seus dados foram limpos com isolamento total.");
        window.location.reload();
      } catch (err: any) {
        alert("Erro ao zerar banco de dados da sua campanha: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Carregar cache local de eleitores para carregamento imediato
  useEffect(() => {
    if (coordinatorId) {
      const cached = safeLocalStorage.getItem(`urna360_voters_cache_${coordinatorId}`);
      if (cached) {
        try {
          setAllVoters(JSON.parse(cached));
        } catch (e) {
          console.warn("Erro ao carregar cache de eleitores:", e);
        }
      }
    }
  }, [coordinatorId]);

  // Resetar página ao mudar filtros de busca/tag
  useEffect(() => {
    setVoterPage(1);
  }, [voterSearch, voterFilterReferredBy, voterFilterTags, articulatorFilter]);
  const [currentEditTag, setCurrentEditTag] = useState('');
  const [isVoterEditModalOpen, setIsVoterEditModalOpen] = useState(false);
  const [voterEditForm, setVoterEditForm] = useState<{
    name: string;
    phone: string;
    address: string;
    observations: string;
    referredBy: string;
    tags: string[];
    loyaltyScore: number;
    familyCommunity: string;
    associatedCandidates: string;
    isArticulator: boolean;
    articulatorId: string;
    voted: boolean;
    isIndigenous: boolean;
    communityName: string;
    tuxauaName: string;
    hasDocPhoto: boolean;
    sentiment: 'support' | 'neutral' | 'opposed';
    cpf: string;
    rg: string;
    titulo: string;
    zona: string;
    secao: string;
    localVotacao: string;
  }>({ 
    name: '', 
    phone: '', 
    address: '', 
    observations: '', 
    referredBy: '', 
    tags: [],
    loyaltyScore: 3,
    familyCommunity: '',
    associatedCandidates: '',
    isArticulator: false,
    articulatorId: '',
    voted: false,
    isIndigenous: false,
    communityName: '',
    tuxauaName: '',
    hasDocPhoto: false,
    sentiment: 'neutral',
    cpf: '',
    rg: '',
    titulo: '',
    zona: '',
    secao: '',
    localVotacao: ''
  });




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

  // Calc Demand Summary
  useEffect(() => {
    if (urgencies.length > 0) {
      const summary: any = {};
      urgencies.forEach(u => {
        const zone = u.team || 'Geral';
        summary[zone] = (summary[zone] || 0) + 1;
      });
      setDemandsSummary(Object.entries(summary).map(([name, value]) => ({ name, value })));
    }
  }, [urgencies]);

  const handleUpdateDailyOrder = async () => {
    if (!newDailyOrder.trim()) {
      alert('Digite o texto da diretiva antes de transmitir.');
      return;
    }
    try {
      const activeCoordId = coordinatorId || user?.uid || '';
      const now = Date.now();
      const newId = `order_${activeCoordId}_${now}`;

      // Fechar a diretiva ativa anterior (se existir)
      const activeOrders = dailyOrders.filter(o => o.status === 'active');
      for (const prev of activeOrders) {
        await supabaseService.setDocument('daily_orders', prev.id, {
          ...prev,
          status: 'closed',
          closedAt: now
        });
      }

      // Criar nova diretiva ativa
      await supabaseService.setDocument('daily_orders', newId, {
        id: newId,
        text: newDailyOrder.trim(),
        status: 'active',
        createdAt: now,
        updatedAt: now,
        createdBy: profileData?.name || user?.email || 'Comando',
        coordinatorId: activeCoordId
      });

      setIsEditingDailyOrder(false);
      setNewDailyOrder('');
      showToast('📢 Diretiva transmitida para todas as unidades!', 'success');
    } catch (err) {
      alert('Erro ao enviar ordem: ' + err);
    }
  };

  const handleCloseActiveOrder = async () => {
    if (!window.confirm('Encerrar a diretiva ativa? Ela será movida para o histórico.')) return;
    try {
      const activeCoordId = coordinatorId || user?.uid || '';
      const activeOrders = dailyOrders.filter(o => o.status === 'active');
      for (const prev of activeOrders) {
        await supabaseService.setDocument('daily_orders', prev.id, {
          ...prev,
          status: 'closed',
          closedAt: Date.now()
        });
      }
      showToast('Diretiva encerrada e arquivada.', 'success');
    } catch (err) {
      alert('Erro ao encerrar diretiva: ' + err);
    }
  };


  const handleAddMaterial = async (e: any) => {
    e.preventDefault();
    try {
      const name = (materialForm.name || (e?.target?.name?.value) || '').trim();
      const rawQty = materialForm.qty || (e?.target?.qty?.value) || '';
      const qtyStr = rawQty.toString().replace(/\D/g, ''); 
      const qty = parseInt(qtyStr, 10);
      
      if (!name || isNaN(qty) || qty <= 0) {
        showToast("Preencha a descrição do material e a quantidade corretamente.", "error");
        return;
      }
      
      const activeCoordId = coordinatorId || user?.uid || '';
      const existing = materials.find(m => m.name && m.name.toLowerCase() === name.toLowerCase());
      
      if (existing) {
        const newTotal = (existing.total || 0) + qty;
        const newCurrent = (existing.current || 0) + qty;
        const updatedDoc = {
          ...existing,
          total: newTotal,
          current: newCurrent,
          qty: newTotal.toLocaleString('pt-BR')
        };
        await supabaseService.updateDocument('materials', existing.id, updatedDoc);
        setMaterials(prev => prev.map(m => m.id === existing.id ? updatedDoc : m));
        showToast(`Quantidade adicionada ao material existente: ${name}`, "success");
      } else {
        const newMatData = {
          name,
          total: qty,
          current: qty,
          qty: qty.toLocaleString('pt-BR'),
          coordinatorId: activeCoordId,
          createdAt: Date.now()
        };
        const docId = await supabaseService.addDocument('materials', newMatData);
        setMaterials(prev => [...prev, { id: docId, ...newMatData }]);
        showToast("Material registrado com sucesso!", "success");
      }
      setMaterialForm({ name: '', qty: '' });
      setIsMaterialModalOpen(false);
    } catch (err: any) {
      showToast("Erro ao salvar material: " + (err?.message || err), "error");
    }
  };

  const handleUpdateMaterial = async (id: string, amount: number) => {
    try {
      const mat = materials.find(m => m.id === id);
      if (!mat) return;
      const updatedCurrent = Math.max(0, (mat.current || 0) + amount);
      const updatedMat = { ...mat, current: updatedCurrent };
      await supabaseService.updateDocument('materials', id, { current: updatedCurrent });
      setMaterials(prev => prev.map(m => m.id === id ? updatedMat : m));
      showToast("Estoque atualizado!", "success");
    } catch (err: any) {
      showToast("Erro ao atualizar: " + err.message, "error");
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (confirm("Deseja realmente excluir este tipo de material e todo seu estoque?")) {
      try {
        await supabaseService.deleteDocument('materials', id);
        setMaterials(prev => prev.filter(m => m.id !== id));
        showToast("Material excluído!", "success");
      } catch (err: any) {
        showToast("Erro ao excluir: " + err.message, "error");
      }
    }
  };

  const handleStartEditMaterial = (m: any) => {
    setIsEditingMaterial(true);
    setEditingMaterialId(m.id);
    setMaterialForm({ name: m.name, qty: m.total.toString() });
    setIsMaterialModalOpen(true);
  };

  const handleSaveEditMaterial = async (e: any) => {
    e.preventDefault();
    if (!editingMaterialId) return;

    try {
      const name = materialForm.name.trim();
      const qtyStr = materialForm.qty.toString().replace(/\D/g, '');
      const qty = parseInt(qtyStr, 10);
      
      if (!name || isNaN(qty) || qty <= 0) {
        showToast("Preencha o nome e a quantidade corretamente.", "error");
        return;
      }

      const old = materials.find(m => m.id === editingMaterialId);
      if (!old) {
        showToast("Erro: Material original não encontrado.", "error");
        return;
      }

      const diffUsed = (old.total || 0) - (old.current || 0);
      const updatedMat = {
        ...old,
        name: materialForm.name,
        total: qty,
        current: Math.max(0, qty - diffUsed),
        qty: qty.toLocaleString('pt-BR')
      };

      await supabaseService.updateDocument('materials', editingMaterialId, updatedMat);
      setMaterials(prev => prev.map(m => m.id === editingMaterialId ? updatedMat : m));

      setIsEditingMaterial(false);
      setEditingMaterialId(null);
      setMaterialForm({ name: '', qty: '' });
      setIsMaterialModalOpen(false);
      showToast("Material atualizado com sucesso!", "success");
    } catch (err: any) {
      showToast("Erro ao salvar alterações: " + err.message, "error");
    }
  };

  const handleApproveMaterialRequest = (req: any) => {
    const mat = materials.find(m => m.id === req.materialId);
    if (!mat) {
      alert("Material não encontrado no estoque!");
      return;
    }
    
    if (mat.current < req.qty) {
      alert("Quantidade insuficiente no estoque para aprovar esta solicitação!");
      return;
    }

    setSigningRequest(req);
    setSignerName(profileData?.name || '');
    setIsSignatureModalOpen(true);
  };

  const handleConfirmSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingRequest || !signerName.trim()) {
      alert("Por favor, preencha a sua assinatura.");
      return;
    }

    try {
      const req = signingRequest;
      const mat = materials.find(m => m.id === req.materialId);
      if (!mat) {
        alert("Material não encontrado no estoque!");
        return;
      }
      
      if (mat.current < req.qty) {
        alert("Quantidade insuficiente no estoque para aprovar esta solicitação!");
        return;
      }

      // Update material qty
      await supabaseService.updateDocument('materials', req.materialId, {
        current: mat.current - req.qty
      });

      const signatureHash = 'URNA360-SIG-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString().slice(-4);

      // Update request status with signature details
      await supabaseService.updateDocument('material_requests', req.id, {
        status: 'aprovado',
        approvedAt: Date.now(),
        signedBy: signerName.trim(),
        signedAt: Date.now(),
        signatureHash: signatureHash
      });

      setIsSignatureModalOpen(false);
      setSigningRequest(null);
      setSignerName('');
      alert("Lote assinado digitalmente e liberado com sucesso!");
    } catch (err: any) {
      alert("Erro ao aprovar e assinar: " + err.message);
    }
  };

  const handleDenyMaterialRequest = async (id: string) => {
    if (confirm("Deseja realmente negar esta solicitação?")) {
      await supabaseService.updateDocument('material_requests', id, {
        status: 'negado',
        deniedAt: Date.now()
      });
    }
  };

  const handleConfirmReturnMaterialRequest = async (req: any) => {
    if (confirm(`Confirmar recebimento de volta do material: ${req.materialName} (${req.qty} un) de ${req.leaderName}?`)) {
      try {
        const mat = materials.find(m => m.id === req.materialId);
        if (mat) {
          await supabaseService.updateDocument('materials', req.materialId, {
            current: (mat.current || 0) + req.qty
          });
        }
        await supabaseService.updateDocument('material_requests', req.id, {
          status: 'devolvido',
          returnApprovedByCoord: true,
          returnApprovedAt: Date.now()
        });
        alert("Devolução confirmada e estoque atualizado com sucesso!");
      } catch (err: any) {
        alert("Erro ao confirmar devolução: " + err.message);
      }
    }
  };

  // --- REPORT GENERATION LOGIC ---
  const generateReport = async (type: string, filters: any = {}, format: 'pdf' | 'excel' = 'pdf') => {
    const userName = profileData?.name || user?.email || 'Coordenador';
    let title = '';
    let data: any[] = [];
    let subtitle = '';

    const allPossibleColumns = AVAILABLE_COLUMNS_BY_TYPE[type] || [];
    
    // Default columns (filtered if user selected specific ones, else all for this type)
    let reportColumns = filters.selectedColumns && filters.selectedColumns.length > 0
      ? allPossibleColumns.filter((c: any) => filters.selectedColumns.includes(c.dataKey))
      : allPossibleColumns;

    try {
      if (filters.detailLevel === 'detailed') {
        switch (type) {
          case 'teams':
            title = 'Relatório Detalhado: Eleitores por Equipe';
            reportColumns = AVAILABLE_COLUMNS_BY_TYPE['voters'];
            // Filter teams first, then get their voters
            const activeTeams = teams.filter(t => {
              if (filters.status && t.status !== filters.status) return false;
              if (filters.location && !t.location.includes(filters.location)) return false;
              if (filters.team && t.name !== filters.team) return false;
              return true;
            }).map(t => t.name);
            
            data = allVoters.filter(v => activeTeams.includes(v.team) || activeTeams.includes(v.teamName))
              .map(v => ({
                ...v,
                teamDisplay: v.team || v.teamName || 'N/A',
                votedStatus: v.voted ? 'SIM' : 'NÃO',
                sentiment: v.sentiment === 'support' ? 'APOIO' : v.sentiment === 'neutral' ? 'NEUTRO' : 'OPOSIÇÃO',
                referredByDisplay: v.articulatorId ? (allVoters.find(av => av.id === v.articulatorId)?.name || 'Articulador') : (v.referredBy || '---'),
                tagsStr: v.tags?.join(', ') || ''
              }));
            subtitle = `Listagem detalhada de ${data.length} eleitores vinculados às equipes selecionadas.`;
            break;


          case 'materials':
            title = 'Relatório Detalhado: Movimentação de Materiais';
            reportColumns = [
              { header: 'Solicitante', dataKey: 'requester' },
              { header: 'Material', dataKey: 'materialName' },
              { header: 'Qtd', dataKey: 'quantity' },
              { header: 'Data', dataKey: 'dateStr' },
              { header: 'Status', dataKey: 'status' }
            ];
            data = materialRequests.map(req => ({
              ...req,
              dateStr: new Date(req.createdAt).toLocaleDateString(),
              status: req.status === 'approved' ? 'ENTREGUE' : req.status === 'rejected' ? 'NEGADO' : 'PENDENTE'
            }));
            subtitle = `Histórico de ${data.length} solicitações de materiais.`;
            break;
        }
      }

      // If we didn't populate data (either not detailed or no detailed logic), use summary logic
      if (data.length === 0) {
        switch (type) {
          case 'teams':
            title = 'Relatório de Equipes e Lideranças';
            data = teams.filter(t => {
              if (filters.status && t.status !== filters.status) return false;
              if (filters.location && !t.location.includes(filters.location)) return false;
              if (filters.team && t.name !== filters.team) return false;
              return true;
            }).map(t => ({
              ...t,
              realContacts: allVoters.filter(v => isVoterInTeam(v, t)).length,
              demandCount: urgencies.filter(u => u.team === t.name).length,
              spentStr: `R$ ${t.spent?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
              status: t.status || 'OK'
            }));
            subtitle = `Análise de ${data.length} frentes de atuação regional.`;
            break;

          case 'voters':
            title = 'Relatório Geral de Eleitores';
            data = allVoters.filter(v => {
              if (filters.sentiment && v.sentiment !== filters.sentiment) return false;
              if (filters.voted !== undefined && v.voted !== filters.voted) return false;
              if (filters.team && v.team !== filters.team && v.teamName !== filters.team) return false;
              return true;
            }).map(v => ({
              ...v,
              teamDisplay: v.team || v.teamName || 'N/A',
              votedStatus: v.voted ? 'SIM' : 'NÃO',
              sentiment: v.sentiment === 'support' ? 'APOIO' : v.sentiment === 'neutral' ? 'NEUTRO' : 'OPOSIÇÃO',
              referredByDisplay: v.articulatorId ? (allVoters.find(av => av.id === v.articulatorId)?.name || 'Articulador') : (v.referredBy || '---'),
              tagsStr: v.tags?.join(', ') || ''
            }));
            subtitle = `${data.length} eleitores filtrados na base estratégica.`;
            break;

          case 'productivity':
            title = 'Relatório de Produtividade e Ranking de Lideranças';
            {
              const leaderMap: Record<string, { leader: string; team: string; totalVoters: number; supportVoters: number; loyaltySum: number }> = {};
              
              teams.forEach(t => {
                const key = t.leader || t.name;
                if (key && !leaderMap[key]) {
                  leaderMap[key] = { leader: t.leader || key, team: t.name, totalVoters: 0, supportVoters: 0, loyaltySum: 0 };
                }
              });

              allVoters.forEach(v => {
                const key = v.leaderName || v.team || v.teamName || 'Outros';
                if (!leaderMap[key]) {
                  leaderMap[key] = { leader: key, team: v.team || v.teamName || 'Geral', totalVoters: 0, supportVoters: 0, loyaltySum: 0 };
                }
                leaderMap[key].totalVoters += 1;
                if (v.sentiment === 'support' || v.voted) {
                  leaderMap[key].supportVoters += 1;
                }
                leaderMap[key].loyaltySum += Number(v.loyaltyScore || 5);
              });

              data = Object.values(leaderMap)
                .sort((a, b) => b.totalVoters - a.totalVoters)
                .map((item, index) => {
                  const conv = item.totalVoters > 0 ? Math.round((item.supportVoters / item.totalVoters) * 100) : 0;
                  const avgLoy = item.totalVoters > 0 ? (item.loyaltySum / item.totalVoters).toFixed(1) : '5.0';
                  let leaderStatus = '⚠️ BAIXO RENDIMENTO';
                  if (item.totalVoters >= 20 && conv >= 60) leaderStatus = '🔥 ALTA PRODUTIVIDADE';
                  else if (item.totalVoters >= 10) leaderStatus = '✅ METAS EM DIA';
                  else if (item.totalVoters > 0) leaderStatus = '🟡 EM PROGRESSO';

                  return {
                    rank: `#${index + 1}`,
                    leader: item.leader,
                    team: item.team,
                    totalVoters: item.totalVoters,
                    supportVoters: item.supportVoters,
                    conversionRate: `${conv}%`,
                    avgLoyalty: `${avgLoy}/10`,
                    leaderStatus
                  };
                });

              subtitle = `Auditoria de produtividade e conversão de votos de ${data.length} lideranças.`;
            }
            break;

          case 'zone_performance':
            title = 'Relatório de Desempenho por Zona e Seção Eleitoral';
            {
              const zoneMap: Record<string, { municipality: string; zona: string; secao: string; mappedVoters: number; confirmedVotes: number; neutralVoters: number; opposedVoters: number }> = {};

              allVoters.forEach(v => {
                const mun = v.municipality || v.location || 'Boa Vista';
                const z = v.zona ? `${v.zona}ª Zona` : 'Zona Geral';
                const s = v.secao ? `Seção ${v.secao}` : 'Seção Geral';
                const key = `${mun}_${z}_${s}`;

                if (!zoneMap[key]) {
                  zoneMap[key] = { municipality: mun, zona: z, secao: s, mappedVoters: 0, confirmedVotes: 0, neutralVoters: 0, opposedVoters: 0 };
                }

                zoneMap[key].mappedVoters += 1;
                if (v.sentiment === 'support' || v.voted) zoneMap[key].confirmedVotes += 1;
                else if (v.sentiment === 'opposed') zoneMap[key].opposedVoters += 1;
                else zoneMap[key].neutralVoters += 1;
              });

              teams.forEach(t => {
                const mun = t.location || 'Boa Vista';
                const key = `${mun}_Zona Geral_Seção Geral`;
                if (!zoneMap[key]) {
                  zoneMap[key] = { municipality: mun, zona: 'Zona Geral', secao: 'Seção Geral', mappedVoters: 0, confirmedVotes: 0, neutralVoters: 0, opposedVoters: 0 };
                }
              });

              data = Object.values(zoneMap)
                .sort((a, b) => b.mappedVoters - a.mappedVoters)
                .map(item => {
                  let densityStatus = '🚨 POUCA PRESENÇA';
                  if (item.confirmedVotes >= 10) densityStatus = '🎯 ALTA DENSIDADE';
                  else if (item.mappedVoters >= 5) densityStatus = '📊 DENSIDADE MÉDIA';
                  else if (item.mappedVoters > 0) densityStatus = '🟡 EM CONSTRUÇÃO';

                  return {
                    ...item,
                    densityStatus
                  };
                });

              subtitle = `Inteligência estratégica mapeando ${data.length} zonas e seções eleitorais.`;
            }
            break;

          case 'agenda_coverage':
            title = 'Relatório de Cobertura de Agenda e Vazios Eleitorais';
            {
              const roraimaMunicipalities = [
                'Boa Vista', 'Alto Alegre', 'Amajari', 'Bonfim', 'Cantá', 
                'Caracaraí', 'Caroebe', 'Iracema', 'Mucajaí', 'Normandia', 
                'Pacaraima', 'Rorainópolis', 'São João da Baliza', 'São Luiz', 'Uiramutã'
              ];

              data = roraimaMunicipalities.map(mun => {
                const munVoters = allVoters.filter(v => 
                  (v.municipality || v.location || '').toLowerCase().includes(mun.toLowerCase())
                ).length;

                const munTeams = teams.filter(t => 
                  (t.location || '').toLowerCase().includes(mun.toLowerCase())
                ).length;

                const munEvents = (agendas || []).filter(a => 
                  (a.municipio || a.municipality || a.location || '').toLowerCase().includes(mun.toLowerCase())
                );

                const eventCount = munEvents.length;

                let lastEventDate = 'Nenhuma visita';
                if (eventCount > 0) {
                  const sortedEvents = [...munEvents].sort((a, b) => new Date(b.data || b.date || 0).getTime() - new Date(a.data || a.date || 0).getTime());
                  const latestDate = sortedEvents[0]?.data || sortedEvents[0]?.date;
                  if (latestDate && !isNaN(new Date(latestDate).getTime())) {
                    lastEventDate = new Date(latestDate).toLocaleDateString('pt-BR');
                  }
                }

                let coverageStatus = '🟢 COBERTO';
                let urgencyLevel = 'Manter presença contínua';

                if (eventCount === 0 && munVoters > 5) {
                  coverageStatus = '🚨 VAZIO CRÍTICO';
                  urgencyLevel = 'Agendar visita urgente (Base de eleitores sem presença do candidato)';
                } else if (eventCount === 0) {
                  coverageStatus = '⚠️ VAZIO ELEITORAL';
                  urgencyLevel = 'Mobilizar equipe e agendar visita';
                } else if (eventCount < 2 && munVoters > 10) {
                  coverageStatus = '🟡 COBERTURA BAIXA';
                  urgencyLevel = 'Reforçar agenda de rua local';
                }

                return {
                  municipality: mun,
                  voterCount: munVoters,
                  teamCount: munTeams,
                  eventCount,
                  coverageStatus,
                  lastEventDate,
                  urgencyLevel
                };
              }).sort((a, b) => {
                if (a.coverageStatus.includes('🚨') && !b.coverageStatus.includes('🚨')) return -1;
                if (!a.coverageStatus.includes('🚨') && b.coverageStatus.includes('🚨')) return 1;
                return b.voterCount - a.voterCount;
              });

              subtitle = `Análise de lacunas territoriais e zonas sem atendimento de agenda.`;
            }
            break;

          case 'materials':
            title = 'Relatório de Gestão de Materiais';
            data = materials.map(m => ({
              ...m,
              used: (m.total || 0) - (m.current || 0)
            }));
            subtitle = `Controle de estoque de ${data.length} itens.`;
            break;

          case 'demands':
            title = 'Relatório de Demandas e Urgências';
            data = urgencies.map(u => ({
              ...u,
              dateStr: new Date(u.createdAt).toLocaleDateString(),
              status: (u.status || 'Aberta').toUpperCase()
            }));
            subtitle = `Acompanhamento de ${data.length} solicitações de urgência.`;
            break;
        }
      }

      // Filter out columns that have no data across all rows
      const visibleColumns = reportColumns.filter((col: any) => {
        return data.some(row => {
          const val = row[col.dataKey];
          return val !== undefined && val !== null && String(val).trim() !== '' && String(val) !== '---';
        });
      });

      if (format === 'excel') {
        await reportService.generateExcel({
          title,
          subtitle,
          columns: visibleColumns,
          data,
          filters,
          userName,
          type
        });
      } else {
        // Generate PDF using central reportService with Nexus branding & Logo
        await reportService.generatePDF({
          title,
          subtitle,
          columns: visibleColumns,
          data,
          filters,
          userName,
          type
        });
      }

      // Add to Reports History
      await supabaseService.addDocument('reports', {
        type,
        title: `${title} (${format.toUpperCase()})`,
        subtitle,
        format,
        timestamp: Date.now(),
        createdBy: user?.email,
        createdByDisplayName: profileData?.name || user?.email,
        createdAt: Date.now(),
        detailLevel: filters.detailLevel || 'summary',
        itemCount: data.length,
        coordinatorId: coordinatorId || ''
      });

    } catch (err: any) {
      console.error("Erro ao gerar relatório:", err);
      alert("Erro ao gerar relatório: " + err.message);
    }
  };

  const [newTeam, setNewTeam] = useState({
    name: '',
    leader: '',
    leaderEmail: '',
    leaderPhone: '',
    leaderAddress: '',
    municipio: '',
    bairro: '',
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
    motivo: '',
    allocatedMaterials: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  });

  const [isLocatingAgendaGPS, setIsLocatingAgendaGPS] = useState(false);

  const handleGetAgendaGPS = async () => {
    setIsLocatingAgendaGPS(true);
    try {
      const loc = await getGPSLocation();
      const formatted = loc.address || [loc.suburb, loc.city].filter(Boolean).join(', ') || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
      setAgendaForm(prev => ({
        ...prev,
        municipio: formatted,
        latitude: loc.lat,
        longitude: loc.lng
      }));
      alert("📍 Localização de evento capturada via GPS com sucesso!");
    } catch (err: any) {
      alert(err.message || "Erro ao obter GPS.");
    } finally {
      setIsLocatingAgendaGPS(false);
    }
  };

  useEffect(() => {
    if (!user || !coordinatorId) return;

    // Subs para dados reais da campanha (filtrados por coordinatorId para isolamento total)
    const unsubTeams = supabaseService.subscribeToCollectionFiltered('teams', coordinatorId, (data) => setTeams(data));
    
    const unsubUrgencies = supabaseService.subscribeToCollectionFiltered('urgencies', coordinatorId, (data) => setUrgencies(data));

    const unsubStats = supabaseService.subscribeToCollection<any>('stats', (data) => {
      const found = data.find(item => item.id === `stats_${coordinatorId}`);
      if (found) setStatsData(found);
    });

    const unsubAgendas = supabaseService.subscribeToCollectionFiltered('agenda', coordinatorId, (data) => setAgendas(data));

    const unsubNotesSnap = supabaseService.subscribeToCollectionFiltered<any>('notes', coordinatorId, (data) => {
      setNotes(data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });

    let unsubProfile: (() => void) | null = null;
    if (user?.uid) {
      unsubProfile = supabaseService.subscribeToCollection<any>('users', (data) => {
        const found = data.find(u => u.id === user.uid);
        if (found) {
          const userEmail = (user.email || found.email || '').toLowerCase();
          const userName = (found.name || '').toLowerCase();
          const isAntonio = userEmail.includes('antonio') || userName.includes('antonio');
          if (isAntonio && found.role !== 'coordenador_regional') {
            found.role = 'coordenador_regional';
            supabaseService.setDocument('users', user.uid, { ...found, role: 'coordenador_regional' }).catch(console.error);
          }
          setProfileData(found);
        }
      });
    }

    const unsubDailyOrder = supabaseService.subscribeToCollectionFiltered<any>('daily_orders', coordinatorId, (data) => {
      const sorted = [...data].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setDailyOrders(sorted);
      const active = sorted.find(o => o.status === 'active');
      setDailyOrder(active || null);
    });

    const unsubMaterials = supabaseService.subscribeToCollectionFiltered('materials', coordinatorId, (data) => setMaterials(data));
    const unsubMaterialRequests = supabaseService.subscribeToCollectionFiltered('material_requests', coordinatorId, (data) => setMaterialRequests(data));
    const unsubReports = supabaseService.subscribeToCollectionFiltered('reports', coordinatorId, (data) => setReportsHistory(data));

    return () => {
      unsubTeams();
      unsubUrgencies();
      unsubStats();
      unsubAgendas();
      unsubNotesSnap();
      if (unsubProfile) unsubProfile();
      unsubDailyOrder();
      unsubMaterials();
      unsubMaterialRequests();
      unsubReports();
    };
  }, [user, isAdmin, isRegional, coordinatorId]);

  // 1. Recarrega as estatísticas de contagem do servidor para esta campanha
  const fetchServerCounts = async () => {
    if (!coordinatorId) return;
    try {
      const voters = await supabaseService.getCollectionFiltered<any>('voters', coordinatorId);
      setTotalVotersCount(voters.length);
      setVotedVotersCount(voters.filter(v => v.voted).length);
    } catch (err) {
      console.warn("Erro ao buscar contagens agregadas do servidor:", err);
    }
  };

  useEffect(() => {
    fetchServerCounts();
    if (activeTab === 'overview' || activeTab === 'voters') {
      fetchServerCounts();
    }
  }, [coordinatorId, activeTab]);

// 2. Busca as contagens de eleitores por equipe em paralelo para esta campanha
  useEffect(() => {
    if (!coordinatorId || teams.length === 0) return;

    const fetchTeamVoterCounts = async () => {
      try {
        const counts: Record<string, number> = {};
        for (const team of teams) {
          const teamName = team.name;
          const matchedFromAll = allVoters.filter(v => isVoterInTeam(v, team)).length;
          counts[teamName] = matchedFromAll;
        }
        setTeamVotersCountMap(counts);
      } catch (err) {
        console.warn("Erro ao buscar contagem de eleitores das equipes:", err);
      }
    };

    fetchTeamVoterCounts();
  }, [coordinatorId, teams, allVoters]);

  // 3. Sincroniza eleitores da campanha de forma isolada
  useEffect(() => {
    if (!coordinatorId) return;

    const tabsThatNeedAllVoters = ['mapa', 'analise_eleitoral', 'reports', 'overview', 'teams', 'voters', 'regional_coords', 'metas'];
    if (!tabsThatNeedAllVoters.includes(activeTab)) {
      return;
    }

    const unsubVoters = supabaseService.subscribeToCollectionFiltered<any>('voters', coordinatorId, (rawData) => {
      const uniqueMap = new Map();
      rawData.forEach((v: any) => {
        const key = (v.phone && v.phone.length > 5) ? v.phone : v.name;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, v);
        } else {
          const existing = uniqueMap.get(key);
          if (!existing.articulatorId && v.articulatorId) {
            uniqueMap.set(key, v);
          }
        }
      });
      const uniqueVoters = Array.from(uniqueMap.values());
      setAllVoters(uniqueVoters);
      safeLocalStorage.setItem(`urna360_voters_cache_${coordinatorId}`, JSON.stringify(uniqueVoters));
    });

    return () => unsubVoters();
  }, [coordinatorId, activeTab]);

  // 4. Sincronização reativa paginada para a listagem principal de eleitores da campanha
  useEffect(() => {
    if (!coordinatorId || activeTab !== 'voters') return;

    setLoadingPaginatedVoters(true);
    supabaseService.getCollectionFiltered<any>('voters', coordinatorId).then((data) => {
      let filtered = data;
      if (articulatorFilter) {
        filtered = filtered.filter(v => v.articulatorId === articulatorFilter);
      }
      const sorted = filtered.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
      setPaginatedVotersList(sorted);
      setHasMoreVoters(false);
      setLoadingPaginatedVoters(false);
    }).catch((err) => {
      console.warn("Error getting paginated voters:", err);
      setLoadingPaginatedVoters(false);
    });
  }, [coordinatorId, activeTab, voterPage, articulatorFilter]);

  // 5. Carregar articuladores específicos para a campanha
  useEffect(() => {
    if (!coordinatorId || activeTab !== 'voters') return;

    const fetchArticulators = async () => {
      try {
        const voters = await supabaseService.getCollectionFiltered<any>('voters', coordinatorId);
        setArticulators(voters.filter(v => v.isArticulator));
      } catch (err) {
        console.warn("Error fetching articulators:", err);
      }
    };

    fetchArticulators();
  }, [coordinatorId, activeTab]);

  useEffect(() => {
    if (!coordinatorId || teams.length === 0 || isGeral) return;

    const healCoordinatorVotersAndRequests = async () => {
      try {
        const allVoters = await supabaseService.getCollection<any>('voters');
        const allRequests = await supabaseService.getCollection<any>('material_requests');
        
        for (const team of teams) {
          const teamId = team.id || team.name.replace(/\s/g, '_').toLowerCase();
          
          const teamVoters = allVoters.filter(v => v.teamId === teamId && v.coordinatorId !== coordinatorId);
          for (const v of teamVoters) {
            await supabaseService.updateDocument('voters', v.id, { coordinatorId });
          }

          const teamReqs = allRequests.filter(r => r.teamId === teamId && r.coordinatorId !== coordinatorId);
          for (const r of teamReqs) {
            await supabaseService.updateDocument('material_requests', r.id, { coordinatorId });
          }
        }
      } catch (err) {
        console.error("Error healing coordinator records:", err);
      }
    };

    healCoordinatorVotersAndRequests();
  }, [teams, coordinatorId, isGeral]);

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
      label: 'Metas Atingidas', 
      value: goalsList.filter(g => g.progress >= 100).length || 0, 
      sub: `${goalsList.length} Cadastradas`, 
      color: 'text-[var(--text-primary)]',
      iconColor: 'bg-zinc-100 dark:bg-zinc-800',
      action: () => setActiveTab('metas')
    },
    { 
      label: 'Base Eleitoral', 
      value: totalVotersCount || allVoters.length || 0, 
      sub: 'Cadastros Reais', 
      color: 'text-emerald-600 dark:text-emerald-500',
      iconColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      action: () => isGeral ? setActiveTab('reports') : setActiveTab('voters')
    },
    { 
      label: 'Agenda de Eventos', 
      value: agendas.filter(a => a.status === 'confirmado').length || 0, 
      sub: `${agendas.filter(a => a.status === 'pendente').length} Pendentes`, 
      color: 'text-blue-600 dark:text-blue-400',
      iconColor: 'bg-blue-50 dark:bg-blue-500/10',
      action: () => setActiveTab('agenda')
    },
    { 
      label: 'Estoque Material', 
      value: materials.reduce((acc, m) => acc + (m.current || 0), 0) || 0, 
      sub: 'Unidades Disponíveis', 
      color: 'text-indigo-600 dark:text-indigo-400',
      iconColor: 'bg-indigo-50 dark:bg-indigo-500/10',
      action: () => setActiveTab('materials')
    },
  ];

  const handleCreateOrUpdateAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      const agendaId = editingAgenda?.id || `agenda_${Date.now()}`;
      await supabaseService.setDocument('agenda', agendaId, {
        ...agendaForm,
        status: editingAgenda ? editingAgenda.status : 'confirmado',
        sugeridoPorId: user?.uid,
        sugeridoPor: 'Coordenação',
        coordinatorId: coordinatorId || user?.uid || '',
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
        await supabaseService.deleteDocument('agenda', id);
        alert("Item movido com sucesso!");
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  // Sincronizar eleitores da equipe gerenciada pelo coordenador
  useEffect(() => {
    if (selectedManagingTeam) {
      const matchedFromAll = allVoters.filter(v => isVoterInTeam(v, selectedManagingTeam));
      if (matchedFromAll.length > 0) {
        setManagingTeamVoters(matchedFromAll);
        return;
      }

      const leaderEmail = selectedManagingTeam.leaderEmail?.toLowerCase();
      const teamName = selectedManagingTeam.name;

      const fetchLeaderAndVoters = async () => {
        try {
          const voters = await supabaseService.getCollectionFiltered<any>('voters', coordinatorId);
          let teamVoters = voters.filter(v => v.team === teamName);

          if (teamVoters.length === 0 && leaderEmail) {
            const users = await supabaseService.getCollectionFiltered<any>('users', coordinatorId);
            const leader = users.find(u => u.email?.toLowerCase() === leaderEmail);
            if (leader) {
              teamVoters = voters.filter(v => v.leaderId === leader.id);
            }
          }

          setManagingTeamVoters(teamVoters);
        } catch (err) {
          console.error("Erro ao buscar eleitores da equipe:", err);
        }
      };

      fetchLeaderAndVoters();
    }
  }, [selectedManagingTeam, isAdmin, coordinatorId, isGeral, allVoters]);



  const sourceVoters = allVoters.length > 0 ? allVoters : paginatedVotersList;

  const filteredVoters = sourceVoters.filter(voter => {
    const matchesSearch = !voterSearch || 
      voter.name?.toLowerCase().includes(voterSearch.toLowerCase()) || 
      voter.phone?.includes(voterSearch);
    
    const matchesReferredBy = !voterFilterReferredBy || 
      voter.referredBy?.toLowerCase().includes(voterFilterReferredBy.toLowerCase());

    const matchesTags = voterFilterTags.length === 0 || 
      voterFilterTags.every((tag: string) => 
        voter.tags?.some((vTag: string) => vTag.trim().toUpperCase() === tag)
      );

    const matchesArticulator = !articulatorFilter || 
      voter.articulatorId === articulatorFilter;

    return matchesSearch && matchesReferredBy && matchesTags && matchesArticulator;
  });

  const availableTags = Array.from(new Set(
    sourceVoters.flatMap(v => (v.tags || []) as string[])
      .map(t => t.trim().toUpperCase())
      .filter(t => t !== "")
  )) as string[];

  const totalPages = allVoters.length > 0 
    ? (Math.ceil(filteredVoters.length / voterPageSize) || 1)
    : (Math.ceil(totalVotersCount / voterPageSize) || 1);

  const paginatedVoters = allVoters.length > 0
    ? filteredVoters.slice((voterPage - 1) * voterPageSize, voterPage * voterPageSize)
    : filteredVoters.slice((voterPage - 1) * voterPageSize, voterPage * voterPageSize);

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

  const handleSaveNote = async (type: 'private' | 'tactical') => {
    if (!user || !chaosText.trim()) return;
    setIsProcessing(true);
    try {
      const noteId = `note_coord_${Date.now()}`;
      await supabaseService.setDocument('notes', noteId, {
        id: noteId,
        text: chaosText,
        authorId: user.uid,
        authorName: profileData?.name || 'Coordenador',
        authorRole: 'coordinator',
        teamName: 'Liderança',
        type: type,
        coordinatorId: coordinatorId || user?.uid || '',
        createdAt: Date.now()
      });
      setChaosText('');
      setAiResult(null);
      setIsAiModalOpen(false);
      alert(type === 'private' ? 'Observação salva na sua área pessoal!' : 'Nota postada no fórum tático!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return alert("Apenas administradores podem criar equipes.");
    
    if (!isEditMode) {
      const leaderValidation = await validateLeaderRegistration(coordinatorId || user?.uid);
      if (!leaderValidation.allowed) {
        triggerUpgradeRedirect(leaderValidation.reason!, isGeral);
        return;
      }
    }

    try {
      const teamId = editingTeamId || newTeam.name.replace(/\s/g, '_').toLowerCase();
      const defaultPassword = 'urna' + Math.floor(1000 + Math.random() * 9000);
      
      // 1. Criar/Atualizar a equipe no Firestore
      await supabaseService.setDocument('teams', teamId, {
        ...newTeam,
        allocated: Number(newTeam.allocated) || 0,
        spent: Number(newTeam.spent) || 0,
        contacts: Number(newTeam.contacts) || 0,
        demands: Number(newTeam.demands) || 0,
        fuel: Number(newTeam.fuel) || 0,
        tempPassword: isEditMode ? ((newTeam as any).tempPassword || defaultPassword) : defaultPassword, // Manter ou criar senha
        coordinatorId: coordinatorId || user?.uid || '',
        regionalCoordId: newTeam.regionalCoordId || (isRegional ? (user?.uid || '') : ''),
        updatedAt: Date.now(),
        createdAt: isEditMode ? ((newTeam as any).createdAt || Date.now()) : Date.now()
      });

      if (!isEditMode) {
        // 2. Criar pré-registro para o líder (apenas em criação)
        await supabaseService.setDocument('pre_registrations', newTeam.leaderEmail.toLowerCase(), {
          email: newTeam.leaderEmail.toLowerCase(),
          name: newTeam.leader,
          phone: newTeam.leaderPhone,
          address: newTeam.leaderAddress,
          teamName: newTeam.name,
          teamId: teamId,
          location: newTeam.location,
          tempPassword: defaultPassword,
          role: 'lider',
          coordinatorId: coordinatorId || user?.uid || '',
          regionalCoordId: newTeam.regionalCoordId || (isRegional ? (user?.uid || '') : ''),
          createdAt: Date.now()
        });
        
        const accessLink = `${window.location.origin}/login?email=${encodeURIComponent(newTeam.leaderEmail)}&access_token=${btoa(defaultPassword)}&role=lider&coordinatorId=${coordinatorId || user?.uid || ''}&regionalCoordId=${newTeam.regionalCoordId || (isRegional ? (user?.uid || '') : '')}&teamId=${teamId}`;
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
    const pass = team.tempPassword || 'urna1234'; 
    const link = `${window.location.origin}/login?email=${encodeURIComponent(email)}&access_token=${btoa(pass)}&role=lider&coordinatorId=${coordinatorId || user?.uid || ''}&regionalCoordId=${team.regionalCoordId || ''}&teamId=${team.id}`;
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



  const handleResetSystem = async () => {
    const activeCoordId = coordinatorId || user?.uid;
    if (!isAdmin || !activeCoordId) return;
    if (window.confirm("⚠️ ALERTA DE SEGURANÇA: Deseja realmente ZERAR os dados da SUA CAMPANHA? Isso removerá notas, ponto, financeiro, eleitores e agenda da sua campanha.\n\nEsta ação é totalmente isolada do seu ID de Coordenador Geral e não pode ser desfeita.")) {
      try {
        setIsProcessing(true);
        
        // 1. Limpar Coleções Principais da campanha
        const collections = ['transactions', 'attendance', 'notes', 'urgencies', 'agenda', 'voters'];
        for (const coll of collections) {
          const docs = await supabaseService.getCollectionFiltered<any>(coll, activeCoordId);
          for (const d of docs) {
            await supabaseService.deleteDocument(coll, d.id);
          }
        }

        // 2. Resetar Campos das Equipes da campanha
        for (const team of teams) {
          const teamId = team.id || team.name.replace(/\s/g, '_').toLowerCase();
          await supabaseService.updateDocument('teams', teamId, {
            allocated: 0,
            spent: 0,
            contacts: 0,
            demands: 0,
            fuel: 0
          });
        }

        // 3. Resetar Stats da campanha
        await supabaseService.setDocument('stats', `stats_${activeCoordId}`, {
          totalFunded: 0,
          combustivelHoje: 0,
          combustivelSaldo: 0,
          votersTotal: 0,
          lastUpdated: Date.now()
        }, true);

        alert("✅ DADOS DA SUA CAMPANHA REINICIADOS COM SUCESSO!");
        setIsProfileModalOpen(false);
      } catch (err: any) {
        alert("Erro ao formatar sistema: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleVoterEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoter) return;
    try {
      await supabaseService.setDocument('voters', selectedVoter.id, voterEditForm, true);
      setIsVoterEditModalOpen(false);
      setSelectedVoter(null);
      await fetchServerCounts();
      alert("Eleitor atualizado com sucesso!");
    } catch (err: any) {
      alert("Erro ao atualizar eleitor: " + err.message);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (window.confirm(`Deseja realmente excluir a equipe "${teamName}"? Esta ação não pode ser desfeita.`)) {
      try {
        await supabaseService.deleteDocument('teams', teamId);
        alert("Equipe excluída com sucesso!");
      } catch (err: any) {
        alert("Erro ao excluir equipe: " + err.message);
      }
    }
  };

  const handleDeleteVoter = async (voterId: string) => {
    if (window.confirm("Deseja realmente excluir este eleitor? Esta ação não pode ser desfeita.")) {
      try {
        await supabaseService.deleteDocument('voters', voterId);
        await fetchServerCounts();
        alert("Eleitor excluído com sucesso!");
      } catch (err: any) {
        alert("Erro ao excluir eleitor: " + err.message);
      }
    }
  };


  const handleGenerateBriefing = async (location: string) => {
    setBriefingLoading(true);
    setBriefingLocation(location);
    try {
      // Buscar demandas desse município
      const allUrgencies = await supabaseService.getCollectionFiltered<any>('urgencies', coordinatorId || '');
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
      const txs = await supabaseService.getCollectionFiltered<any>('transactions', coordinatorId);
      const teamTxs = txs.filter(t => t.team === team.name).sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 20);
      setTeamHistory(teamTxs);
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden transition-colors duration-300">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex w-72 flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-color)] py-8 px-6 overflow-y-auto shrink-0 relative z-40 shadow-[2px_0_10px_rgba(0,0,0,0.02)] dark:shadow-none">
        <div className="mb-6 px-1 flex flex-col items-center gap-4">
          <img 
            src={logoImg} 
            onError={(e) => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = '/logo.png'; } }} 
            alt="Logo Nexus Política" 
            className="max-h-24 w-full max-w-[220px] object-contain transition-all" 
          />

          <div className="w-full bg-[var(--bg-tertiary)] rounded-xl p-3.5 border border-[var(--border-color)] space-y-1 text-left">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] block">Perfil ativo</span>
            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
              {profileData?.name || user?.displayName || user?.email?.split('@')[0] || 'Joadson Rocha'}
            </p>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {(profileData?.role === 'coordenador_regional' || isRegional) 
                ? 'Coordenador Regional' 
                : 'Coordenador Geral'}
            </p>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {profileData?.zone || 'Setor Geral da Campanha'}
            </p>
          </div>

          {/* Cartão Oficial do Candidato */}
          <div className="w-full bg-gradient-to-br from-blue-900/60 via-slate-900/70 to-blue-950/60 rounded-xl p-3.5 border border-blue-500/30 space-y-2 text-left shadow-md">
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">Candidato da Campanha</span>
            <div className="flex items-center gap-2.5">
              <img 
                src={candidateForm?.photoUrl || DEFAULT_CANDIDATE_INFO.photoUrl} 
                alt="Candidato" 
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shadow-sm shrink-0 bg-slate-800"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_CANDIDATE_INFO.photoUrl; }}
              />
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-black text-white truncate">
                  {candidateForm?.name || 'Candidato Oficial'}
                </p>
                <p className="text-[10px] font-bold text-blue-300 truncate">
                  {candidateForm?.title || 'Campanha 2026'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: 'overview', label: isRegional ? 'Painel Regional' : 'Dashboard Geral', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'metas', label: 'Metas Eleitorais', icon: <Target className="w-4 h-4" /> },
            ...(isGeral ? [{ id: 'regional_coords', label: 'Coord. Regionais', icon: <ShieldCheck className="w-4 h-4" /> }] : []),
            { id: 'teams', label: 'Equipes & Líderes', icon: <Users className="w-4 h-4" /> },
            { id: 'voters', label: 'Eleitores Geral', icon: <UserPlus className="w-4 h-4" /> },
            { id: 'agenda', label: 'Agenda', icon: <Calendar className="w-4 h-4" /> },
            { id: 'mapa', label: 'Mapa Regional', icon: <MapIcon className="w-4 h-4" /> },
            { id: 'materials', label: 'Materiais', icon: <Package className="w-4 h-4" /> },
            { id: 'demands', label: 'Demandas', icon: <Activity className="w-4 h-4" /> },
            { id: 'analise_eleitoral', label: 'Análise Eleitoral', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'notes', label: 'Anotações', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'reports', label: 'Relatórios & BI', icon: <FileDown className="w-4 h-4" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                activeTab === item.id 
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 font-bold shadow-2xs' 
                : 'text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className={`transition-colors ${activeTab === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-8">
          <div className="pt-4 border-t border-[var(--border-color)]">
            <button 
              onClick={() => navigate('/perfil')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50 transition-all group cursor-pointer"
            >
              <div className="text-zinc-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <Settings className="w-4 h-4" />
              </div>
              Configurações
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-primary)] overflow-hidden relative transition-colors duration-300">
        {/* TOP BAR / COMMAND CENTER */}
        <header className="h-16 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between px-6 z-30 shrink-0 transition-colors duration-300">
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
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 pl-11 pr-4 text-[11px] font-black uppercase tracking-tight text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:opacity-50 focus:ring-1 focus:ring-blue-600/40 outline-none transition-all shadow-inner"
              />

              {/* SEARCH RESULTS PANEL */}
              <AnimatePresence>
                {searchQuery.length >= 2 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto p-2 transition-colors duration-300"
                  >
                    {totalResults > 0 ? (
                      <div className="p-1 space-y-3">
                        {searchResults.teams.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 mb-1">Equipes / Zonas</p>
                            {searchResults.teams.map(t => (
                              <button key={t.id} onClick={() => { setActiveTab('teams'); setSearchQuery(''); }} className="w-full flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-xl transition-colors text-left">
                                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center"><Users className="w-4 h-4 text-zinc-900" /></div>
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
                              <button key={a.id} onClick={() => { setActiveTab('agenda'); setSearchQuery(''); }} className="w-full flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-xl transition-colors text-left">
                                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center"><Calendar className="w-4 h-4 text-zinc-900" /></div>
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
                              <button key={n.id} onClick={() => { setActiveTab('notes'); setSearchQuery(''); }} className="w-full flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-xl transition-colors text-left">
                                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-zinc-900" /></div>
                                <div>
                                  <p className="text-[10px] text-zinc-800 font-medium line-clamp-1">"{n.text}"</p>
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
              <div className="flex items-center justify-center bg-transparent shrink-0">
                <img 
                  src={logoImg} 
                  onError={(e) => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = '/logo.png'; } }} 
                  alt="Logo Nexus Política" 
                  className="max-h-12 w-auto object-contain" 
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Badge de Identificação do Político / Candidato */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 dark:bg-blue-900/30 border border-blue-500/30 rounded-xl">
              <img 
                src={candidateForm?.photoUrl || DEFAULT_CANDIDATE_INFO.photoUrl} 
                alt="Candidato" 
                className="w-7 h-7 rounded-full object-cover border border-blue-500 shrink-0 bg-slate-800" 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_CANDIDATE_INFO.photoUrl; }}
              />
              <div className="text-left">
                <p className="text-[11px] font-black text-[var(--text-primary)] leading-none truncate max-w-[170px]">
                  {candidateForm?.name || 'Candidato Oficial'}
                </p>
                <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 leading-none mt-0.5 truncate max-w-[170px]">
                  {candidateForm?.title || 'Campanha 2026'}
                </p>
              </div>
            </div>

            {isGeral && (
              <button 
                onClick={() => { setActiveTab('candidato'); setIsCandidateModalOpen(true); }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md text-xs font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                title="Cadastrar foto, biografia e informações do candidato para o link de cadastro"
              >
                <UserPlus className="w-4 h-4" /> Cadastrar Candidato
              </button>
            )}

            <button 
              onClick={() => setIsWaModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
              title="Disparo de mensagens via WhatsApp (Gratuito wa.me)"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Disparo WhatsApp
            </button>

            <button 
              onClick={() => setIsShareLinkModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 whitespace-nowrap"
              title="Gerar e copiar link de cadastro de eleitores"
            >
              <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Link de Cadastro
            </button>

            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-blue-600 hover:text-white active:scale-90 transition-all border border-zinc-200 dark:border-zinc-700"
              title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>


            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>

            <button 
              onClick={() => navigate('/perfil')}
              className="flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-xl transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xs text-white overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700">
                {profileData?.photoURL ? (
                  <img src={profileData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (profileData?.name || user?.email || 'A').charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-none mb-0.5">{profileData?.name || user?.email?.split('@')[0]}</p>
                <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                  {(profileData?.role === 'coordenador_regional' || isRegional || (user?.email && user.email.toLowerCase().includes('antonio')) || (profileData?.email && profileData.email.toLowerCase().includes('antonio')) || (profileData?.name && profileData.name.toLowerCase().includes('antonio'))) 
                    ? 'Coordenador Regional' 
                    : (profileData?.role === 'coordenador_geral' || isGeral) 
                    ? 'Coordenador Geral' 
                    : isLeader 
                    ? 'Líder de Equipe' 
                    : 'Coordenador'}
                </p>
              </div>
            </button>
          </div>
        </header>



        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-2.5 sm:p-5 md:p-10 custom-scrollbar pb-28 md:pb-12">
          <div className="max-w-7xl mx-auto space-y-6 md:space-y-12 pb-20">
            
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 md:space-y-8">
              
            {/* BANNER EM DESTAQUE DE CADASTRO DO CANDIDATO */}
            {isGeral && candidatesList.length === 0 && (
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-blue-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shrink-0">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Cadastrar Candidato da Campanha</h3>
                    <p className="text-xs text-blue-200">Defina o nome, foto oficial e mensagem de apresentação exibidos aos eleitores.</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setActiveTab('candidato'); setIsCandidateModalOpen(true); }}
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-md transition-all active:scale-95 whitespace-nowrap self-stretch sm:self-auto text-center cursor-pointer"
                >
                  Cadastrar Candidato Agora
                </button>
              </div>
            )}

              <div className="flex-col gap-1 flex">
                <h2 className="text-base md:text-lg font-bold text-[var(--text-primary)] leading-none">Painel de Operações</h2>
                <p className="text-xs text-[var(--text-secondary)] font-normal">Monitoramento estratégico em tempo real</p>
              </div>

              <motion.section 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-zinc-900 rounded-xl p-3 md:p-4 shadow-xs border border-zinc-200 dark:border-zinc-800 overflow-hidden relative group transition-colors"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-zinc-400 group-hover:scale-110 transition-transform duration-700">
                  <ShieldCheck className="w-24 h-24" />
                </div>

                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-950/50 rounded-md border border-blue-100 dark:border-blue-900/40">
                      <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none mb-0.5">Ordem do Dia</h3>
                      <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-wider leading-none">Diretiva Central</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      {dailyOrder && !isEditingDailyOrder && (
                        <button
                          onClick={handleCloseActiveOrder}
                          className="btn-danger !px-2.5 !py-1 !text-[9px] !min-h-0 !h-auto rounded-md"
                        >
                          Encerrar
                        </button>
                      )}
                      <button
                        onClick={() => { setIsEditingDailyOrder(!isEditingDailyOrder); setNewDailyOrder(''); }}
                        className="btn-secondary !px-2.5 !py-1 !text-[9px] !min-h-0 !h-auto rounded-md"
                      >
                        {isEditingDailyOrder ? 'Cancelar' : '+ Nova'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Formulário de nova diretiva */}
                {isEditingDailyOrder && (
                  <div className="space-y-2 relative z-10 mb-3">
                    <textarea
                      value={newDailyOrder}
                      onChange={(e) => setNewDailyOrder(e.target.value)}
                      placeholder="Digite a diretiva central..."
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl p-3 text-xs font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-blue-600 min-h-[60px] transition-colors"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateDailyOrder}
                      className="btn-primary w-full !py-2 !text-[10px]"
                    >
                      📢 Transmitir
                    </button>
                  </div>
                )}

                {/* Diretiva Ativa */}
                <div className="relative z-10">
                  {dailyOrder ? (
                    <div className="border-l-2 border-blue-600 pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                          Em Vigor
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight leading-snug">
                        &ldquo;{dailyOrder.text}&rdquo;
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" /> {dailyOrder.createdAt ? new Date(dailyOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3 text-blue-600 dark:text-blue-400" /> {dailyOrder.createdBy || 'Comando'}</span>
                      </div>
                    </div>
                  ) : !isEditingDailyOrder && (
                    <p className="text-zinc-400 text-[10px] font-medium italic py-1">Nenhuma diretiva ativa.</p>
                  )}
                </div>

                {/* Histórico de Diretivas */}
                {dailyOrders.filter(o => o.status === 'closed').length > 0 && (
                  <div className="relative z-10 mt-3 border-t border-[var(--border-color)] pt-2">
                    <button
                      onClick={() => setShowOrderHistory(!showOrderHistory)}
                      className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hover:text-blue-600 transition-colors"
                    >
                      <span className="inline-block w-3 h-3 text-center leading-none">{showOrderHistory ? '▾' : '▸'}</span>
                      Histórico ({dailyOrders.filter(o => o.status === 'closed').length})
                    </button>
                    {showOrderHistory && (
                      <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {dailyOrders.filter(o => o.status === 'closed').map(order => (
                          <div key={order.id} className="flex items-start gap-2 py-1.5 px-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold text-[var(--text-secondary)] line-through leading-snug truncate">
                                &ldquo;{order.text}&rdquo;
                              </p>
                              <p className="text-[8px] text-zinc-400 dark:text-zinc-500 mt-0.5 uppercase tracking-wider font-bold">
                                {order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''} · {order.createdBy || 'Comando'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.section>

              {/* AÇÕES RÁPIDAS (QUICK ACTIONS) */}
              <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Ações Rápidas
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button 
                    onClick={() => { setActiveTab('agenda'); setTimeout(() => { setAgendaForm(DEFAULT_AGENDA_INFO); setEditingAgenda(null); setIsAgendaCreateModalOpen(true); }, 100); }}
                    className="btn-primary !py-3 flex-col gap-1 hover:shadow-lg transition-all"
                  >
                    <Calendar className="w-5 h-5 mb-1" />
                    <span>Novo Evento</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('materials'); setTimeout(() => { setEditingMaterial(null); setIsMaterialModalOpen(true); }, 100); }}
                    className="btn-secondary !bg-indigo-50 !text-indigo-600 !border-indigo-200 hover:!bg-indigo-600 hover:!text-white !py-3 flex-col gap-1 transition-all"
                  >
                    <Package className="w-5 h-5 mb-1" />
                    <span>Estoque</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('metas'); setTimeout(() => setIsEditGoalModalOpen(true), 100); }}
                    className="btn-secondary !bg-emerald-50 !text-emerald-600 !border-emerald-200 hover:!bg-emerald-600 hover:!text-white !py-3 flex-col gap-1 transition-all"
                  >
                    <Target className="w-5 h-5 mb-1" />
                    <span>Nova Meta</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('voters'); setTimeout(() => { setVoterForm(DEFAULT_VOTER_INFO); setEditingVoterId(null); setIsVoterEditModalOpen(true); }, 100); }}
                    className="btn-secondary !py-3 flex-col gap-1 transition-all"
                  >
                    <UserPlus className="w-5 h-5 mb-1 text-[var(--text-secondary)]" />
                    <span>Eleitor</span>
                  </button>
                </div>
              </section>

              {/* STATS GRID */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={stat.action}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3.5 md:p-5 rounded-xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-blue-600/50 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <div className={`p-2 rounded-xl group-hover:bg-blue-600 transition-colors ${(stat as any).iconColor || 'bg-[var(--bg-tertiary)]'}`}>
                        {i === 0 && <Target className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-white" />}
                        {i === 1 && <Users className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-white" />}
                        {i === 2 && <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-white" />}
                        {i === 3 && <DollarSign className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-white" />}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[6px] md:text-[7px] font-black py-0.5 px-1.5 bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-xl uppercase tracking-widest border border-green-200/50 dark:border-green-500/20 leading-none">ATIVO</span>
                      </div>
                    </div>
                    <p className={`text-lg md:text-2xl font-black tracking-tighter mb-0.5 leading-none ${stat.color || 'text-[var(--text-primary)]'}`}>{stat.value}</p>
                    <p className="text-[8px] md:text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em]">{stat.label}</p>
                    <div className="mt-3.5 md:mt-5 pt-2 md:pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                      <span className="text-[7.5px] md:text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-widest leading-none">{stat.sub}</span>
                      <ChevronRight className="w-3 h-3 text-[var(--text-secondary)] group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </section>

                <div className="pt-2 flex flex-col lg:flex-row gap-6">
                  {/* COLUNA PRINCIPAL (ESQUERDA / CENTRO) */}
                  <div className="flex-1 space-y-6">

                    {/* CARD: EVENTOS DOS COORDENADORES REGIONAIS E LÍDERES */}
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Eventos & Agenda dos Coordenadores e Líderes</h3>
                            <p className="text-xs text-[var(--text-secondary)]">Compromissos, caminhadas e ações de rua cadastradas pelas equipes de campo</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActiveTab('agenda')} 
                          className="text-xs font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1 cursor-pointer"
                        >
                          Ver Agenda Completa <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {agendas && agendas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {agendas.slice(0, 4).map((item) => (
                            <div key={item.id} className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-4 space-y-2 hover:border-blue-500/40 transition-all">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{item.municipio}</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.status === 'confirmado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                                  {item.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-1">{item.motivo || 'Atividade tática de campanha'}</p>
                              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border-color)]">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-600" /> {item.data} • {item.hora_inicio}h</span>
                                <span className="flex items-center gap-1"><User className="w-3 h-3 text-blue-600" /> {item.team || item.sugeridoPor || 'Coord. Regional'}</span>
                              </div>
                              {item.allocatedMaterials && (
                                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                                  <Package className="w-3 h-3" /> Materiais: {item.allocatedMaterials}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-xl">
                          Nenhum evento agendado recentemente pelas coordenações regionais.
                        </div>
                      )}
                    </div>

                    {/* CARD: RESUMO DE ESTRUTURA E COORDENADORES REGIONAIS */}
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Coordenação Regional e Setores</h3>
                            <p className="text-xs text-[var(--text-secondary)]">Acompanhamento dos coordenadores de polo e jurisdições</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActiveTab('regional_coords')} 
                          className="text-xs font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1 cursor-pointer"
                        >
                          Gerenciar Regionais <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)] space-y-1">
                          <span className="text-xs font-semibold text-[var(--text-secondary)] block">Regionais Ativas</span>
                          <p className="text-xl font-bold text-[var(--text-primary)]">{regionalCoordinators?.length || 0} Polos</p>
                          <span className="text-[10px] text-emerald-600 font-medium">100% Cobertura Territorial</span>
                        </div>
                        <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)] space-y-1">
                          <span className="text-xs font-semibold text-[var(--text-secondary)] block">Líderes de Bairro</span>
                          <p className="text-xl font-bold text-[var(--text-primary)]">{teams?.length || 0} Líderes</p>
                          <span className="text-[10px] text-blue-600 font-medium">Cadastrando no Campo</span>
                        </div>
                        <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)] space-y-1">
                          <span className="text-xs font-semibold text-[var(--text-secondary)] block">Eleitores Registrados</span>
                          <p className="text-xl font-bold text-[var(--text-primary)]">{allVoters?.length || 0} Eleitores</p>
                          <span className="text-[10px] text-indigo-600 font-medium">Base Geral Validada</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* COLUNA LATERAL DIREITA (CARDS DE SUPORTE & CANDIDATO) */}
                  <div className="w-full lg:w-80 space-y-6">

                    {/* CARTÃO EM DESTAQUE DO CANDIDATO */}
                    <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-blue-700/40 space-y-3">
                      <span className="text-[10px] font-semibold text-blue-200 block uppercase tracking-wider">Candidato Oficial da Campanha</span>
                      <div className="flex items-center gap-3">
                        <img 
                          src={candidateForm?.photoUrl || DEFAULT_CANDIDATE_INFO.photoUrl} 
                          alt="Candidato" 
                          className="w-14 h-14 rounded-full object-cover border-2 border-white/80 shadow-md shrink-0 bg-slate-800"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_CANDIDATE_INFO.photoUrl; }}
                        />
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-bold text-white truncate">{candidateForm?.name || 'Candidato da Campanha'}</h4>
                          <p className="text-xs text-blue-200 truncate">{candidateForm?.title || 'Eleições 2026'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setActiveTab('candidato'); setIsCandidateModalOpen(true); }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-xs transition-all shadow-sm cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        {isGeral ? 'Editar Informações do Candidato' : 'Visualizar Detalhes do Candidato'}
                      </button>
                    </div>

                    {/* ATIVIDADE E MOBILIZAÇÃO DAS EQUIPES */}
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600" /> Atividade das Equipes no Campo
                      </h3>
                      <div className="space-y-3">
                        {teams.length > 0 ? teams.slice(0, 5).map((team, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                                <Users className="w-4 h-4" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-[var(--text-primary)] truncate">{team.name}</p>
                                <p className="text-[10px] text-[var(--text-secondary)] truncate">Líder: {team.leader || '---'}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full shrink-0">
                              Ativo
                            </span>
                          </div>
                        )) : (
                          <p className="text-xs text-[var(--text-secondary)] italic">Nenhuma equipe cadastrada ainda.</p>
                        )}
                      </div>
                    </div>

                    {/* ESTOQUE E MATERIAIS */}
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" /> Estoque de Materiais
                        </h3>
                        <button onClick={() => setActiveTab('materials')} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">Ver todos</button>
                      </div>
                      <div className="space-y-2">
                        {materials && materials.length > 0 ? materials.slice(0, 3).map(m => (
                          <div key={m.id} className="p-2.5 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)] flex items-center justify-between text-xs">
                            <span className="font-semibold text-[var(--text-primary)] truncate">{m.name}</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">{m.current || m.total || 0} un</span>
                          </div>
                        )) : (
                          <p className="text-xs text-[var(--text-secondary)] italic">Nenhum material registrado em estoque.</p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}


            {activeTab === 'candidato' && (
              <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[var(--text-primary)]">Candidatos da Campanha</h2>
                      <p className="text-xs text-[var(--text-secondary)] font-normal">
                        Gerencie todos os candidatos da chapa — cargos diferentes, propostas específicas.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCandidateForm({ ...DEFAULT_CANDIDATE_INFO, id: undefined });
                      setEditingCandidateId(undefined);
                      setIsCandidateModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" /> Adicionar Candidato
                  </button>
                </div>

                {/* Lista de candidatos */}
                {candidatesList.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-secondary)]">
                    <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-semibold">Nenhum candidato cadastrado ainda.</p>
                    <p className="text-xs mt-1">Clique em "Adicionar Candidato" para começar.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {candidatesList.map((cand) => (
                      <div key={cand.id || cand.name} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm flex items-start gap-4 group hover:border-blue-400 transition-all">
                        <img
                          src={cand.photoUrl || DEFAULT_CANDIDATE_INFO.photoUrl}
                          alt={cand.name}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_CANDIDATE_INFO.photoUrl; }}
                          className="w-16 h-16 rounded-full object-cover border-2 border-blue-600 shadow-md bg-zinc-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-bold text-sm text-[var(--text-primary)] truncate">{cand.name}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full">
                            {cand.title}
                          </span>
                          {cand.bio && (
                            <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-1">{cand.bio}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setCandidateForm({ ...cand });
                              setEditingCandidateId(cand.id);
                              setIsCandidateModalOpen(true);
                            }}
                            className="p-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[var(--text-secondary)] hover:text-blue-600 border border-[var(--border-color)] transition-all cursor-pointer"
                            title="Editar candidato"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!cand.id) return;
                              if (!window.confirm(`Remover o candidato "${cand.name}" (${cand.title})?`)) return;
                              const newList = await candidateService.deleteCandidate(cand.id, user?.uid, coordinatorId);
                              setCandidatesList(newList);
                            }}
                            className="p-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-red-50 dark:hover:bg-red-950/30 text-[var(--text-secondary)] hover:text-red-600 border border-[var(--border-color)] transition-all cursor-pointer"
                            title="Remover candidato"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nota informativa */}
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    <strong>Regra:</strong> Não é permitido cadastrar dois candidatos para o mesmo cargo. Cada cargo da chapa deve ter apenas um candidato representante.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'metas' && isGeral && (
              <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border-color)] pb-6">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <Target className="w-6 h-6 text-blue-600" /> Central de Metas Eleitorais
                    </h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest mt-2">
                      Visão Macro das Metas Gerais, Distribuição entre Coordenadores Regionais e Saldo Restante
                    </p>
                  </div>

                  {/* Category selector */}
                  <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-1 rounded-xl">
                    {(['municipio', 'bairro', 'regiao'] as const).map((cat) => (
                      <button 
                        key={cat}
                        onClick={() => {
                          setGoalCategory(cat);
                          setNewGoal(g => ({ ...g, category: cat }));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                          goalCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Por {cat === 'municipio' ? 'Município' : cat === 'bairro' ? 'Bairro' : 'Região'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Macro Summary Cards */}
                {(() => {
                  const safeNum = (v: any, fallback = 0) => {
                    if (v === null || v === undefined || v === '') return fallback;
                    if (typeof v === 'number') return isNaN(v) ? fallback : v;
                    const clean = String(v).replace(/\./g, '').replace(/,/g, '.').replace(/\s/g, '');
                    const n = parseFloat(clean);
                    return isNaN(n) ? fallback : n;
                  };

                  const filteredGoals = goalsList.filter(g => g.category === goalCategory || (!g.category && goalCategory === 'municipio'));
                  const totalMetaGeral = filteredGoals.reduce((sum, g) => sum + safeNum(g.targetVoters), 0);
                  const totalMetaDistribuidaRegionais = regionalCoordinators.reduce((sum, c) => sum + safeNum(c.targetVoters), 0);
                  const totalPendenteAlocacao = Math.max(0, totalMetaGeral - totalMetaDistribuidaRegionais);
                  const totalMapeados = allVoters.length;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-blue-600" />
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Meta Geral Total ({goalCategory})</p>
                        <p className="text-2xl font-black text-[var(--text-primary)] mt-1">{totalMetaGeral.toLocaleString('pt-BR')}</p>
                        <p className="text-[8px] font-bold text-blue-500 uppercase tracking-wider mt-1">Objetivo Macro da Campanha</p>
                      </div>

                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500" />
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Alocado a Coord. Regionais</p>
                        <p className="text-2xl font-black text-emerald-500 mt-1">{totalMetaDistribuidaRegionais.toLocaleString('pt-BR')}</p>
                        <p className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1">
                          {totalMetaGeral > 0 ? `${Math.min(100, Math.round((totalMetaDistribuidaRegionais / totalMetaGeral) * 100))}% da Meta Geral Distribuída` : 'Coordenadores em Campo'}
                        </p>
                      </div>

                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Saldo Restante a Alocar</p>
                        <p className="text-2xl font-black text-amber-500 mt-1">{totalPendenteAlocacao.toLocaleString('pt-BR')}</p>
                        <p className="text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mt-1">Meta a Distribuir p/ Coordenadores</p>
                      </div>

                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-purple-500" />
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Eleitores Mapeados (Real)</p>
                        <p className="text-2xl font-black text-purple-500 mt-1">{totalMapeados.toLocaleString('pt-BR')}</p>
                        <p className="text-[8px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mt-1">
                          {totalMetaGeral > 0 ? `${Math.min(100, Math.round((totalMapeados / totalMetaGeral) * 100))}% da Meta Geral Alcançada` : 'Cadastros no Banco'}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Form to add new goal */}
                <form onSubmit={handleCreateGoal} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl space-y-4 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-600" /> Cadastrar Nova Meta Geral para {goalCategory === 'municipio' ? 'Município' : goalCategory === 'bairro' ? 'Bairro' : 'Região'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-1">
                        Nome do {goalCategory === 'municipio' ? 'Município' : goalCategory === 'bairro' ? 'Bairro' : 'Região'}
                      </label>
                      <input 
                        required
                        type="text" 
                        value={newGoal.locationName}
                        onChange={(e) => setNewGoal({ ...newGoal, locationName: e.target.value })}
                        placeholder={goalCategory === 'municipio' ? "Ex: Boa Vista" : goalCategory === 'bairro' ? "Ex: Pintolândia" : "Ex: Região Sul"}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest block">Meta Geral de Eleitores</label>
                        <div className="flex gap-1">
                          {[500, 1000, 2500, 5000].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setNewGoal({ ...newGoal, targetVoters: val })}
                              className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 transition-colors"
                            >
                              {val >= 1000 ? `${val/1000}k` : val}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input 
                        required
                        type="text" 
                        inputMode="numeric"
                        value={newGoal.targetVoters === '' ? '' : (typeof newGoal.targetVoters === 'number' ? newGoal.targetVoters.toLocaleString('pt-BR') : newGoal.targetVoters)}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          setNewGoal({ ...newGoal, targetVoters: digits === '' ? '' : parseInt(digits, 10) });
                        }}
                        placeholder="Ex: 5.000"
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row items-end gap-2">
                      <button 
                        type="button"
                        disabled={isGroqLoading}
                        onClick={async () => {
                          if (!newGoal.locationName) {
                            showToast('Digite o nome do local primeiro.', 'error');
                            return;
                          }
                          setIsGroqLoading(true);
                          try {
                            const res = await sugerirMetaInteligente(newGoal.locationName, newGoal.targetVoters, { goalCategory });
                            setNewGoal({ ...newGoal, targetVoters: res.sugestao_votos || newGoal.targetVoters });
                            showToast(`✨ IA Tática: ${res.justificativa || 'Meta sugerida com sucesso.'}`, 'success');
                          } catch (err: any) {
                            showToast(err.message || 'Erro ao chamar IA', 'error');
                          } finally {
                            setIsGroqLoading(false);
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-4 py-3 rounded-xl uppercase tracking-wider shadow-md shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center shrink-0"
                        title="Usar Inteligência Artificial para sugerir Meta Matemática"
                      >
                        {isGroqLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '✨ IA Groq'}
                      </button>
                      <button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                      >
                        Salvar Meta Geral
                      </button>
                    </div>
                  </div>
                </form>

                {/* Goals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {goalsList.filter(g => g.category === goalCategory || (!g.category && goalCategory === 'municipio')).map(goal => {
                    const safeNum = (v: any, fallback = 0) => {
                      if (v === null || v === undefined || v === '') return fallback;
                      if (typeof v === 'number') return isNaN(v) ? fallback : v;
                      const clean = String(v).replace(/\./g, '').replace(/,/g, '.').replace(/\s/g, '');
                      const n = parseFloat(clean);
                      return isNaN(n) ? fallback : n;
                    };

                    const matchedRegCoords = getMatchedRegCoordsForGoal(goal.locationName);
                    const matchedTeams = getMatchedTeamsForGoal(goal.locationName);

                    const totalAllocatedToCoords = matchedRegCoords.reduce((acc, c) => acc + safeNum(c.targetVoters), 0);
                    const totalAllocatedToTeams = matchedTeams.reduce((acc, t) => acc + safeNum(t.targetVoters || t.goal), 0);

                    // Combine allocations (prefer Regional Coords if assigned, or sum standalone teams)
                    const totalAllocated = totalAllocatedToCoords > 0 ? totalAllocatedToCoords : totalAllocatedToTeams;
                    const target = safeNum(goal.targetVoters, 1000);
                    const unallocatedFromMeta = Math.max(0, target - totalAllocated);

                    const registeredCount = allVoters.filter(v => {
                      const loc = ((v.address || '') + ' ' + (v.neighborhood || '') + ' ' + (v.city || '') + ' ' + (v.municipality || '')).toLowerCase();
                      return isLocationMatchingGoal(goal.locationName, loc, loc);
                    }).length;

                    const rawAllocPct = target > 0 ? Math.round((totalAllocated / target) * 100) : 0;
                    const allocPct = isNaN(rawAllocPct) ? 0 : Math.min(100, rawAllocPct);

                    const rawReachPct = target > 0 ? Math.round((registeredCount / target) * 100) : 0;
                    const reachPct = isNaN(rawReachPct) ? 0 : Math.min(100, rawReachPct);

                    return (
                      <div key={goal.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl relative flex flex-col justify-between hover:border-blue-500/50 transition-all shadow-sm">
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="text-[7px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-xl uppercase tracking-widest">
                                META POR {goal.category ? goal.category.toUpperCase() : 'MUNICÍPIO'}
                              </span>
                              <h3 className="text-base font-semibold text-[var(--text-primary)] mt-1">{goal.locationName}</h3>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleOpenEditGoal(goal)}
                                className="text-zinc-400 hover:text-blue-500 p-1.5 rounded-xl transition-colors hover:bg-[var(--bg-tertiary)]"
                                title="Editar Meta Geral"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="text-zinc-400 hover:text-red-500 p-1.5 rounded-xl transition-colors hover:bg-[var(--bg-tertiary)]"
                                title="Excluir meta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Goal Breakdown Grid */}
                          <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl my-3">
                            <div>
                              <p className="text-[7.5px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Meta Geral</p>
                              <p className="text-sm font-black text-[var(--text-primary)] mt-0.5">{target.toLocaleString('pt-BR')}</p>
                            </div>
                            <div>
                              <p className="text-[7.5px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Alocado Regionais</p>
                              <p className="text-sm font-black text-emerald-500 mt-0.5">{totalAllocated.toLocaleString('pt-BR')}</p>
                            </div>
                            <div>
                              <p className="text-[7.5px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Saldo Restante</p>
                              <p className="text-sm font-black text-amber-500 mt-0.5">{unallocatedFromMeta.toLocaleString('pt-BR')}</p>
                            </div>
                          </div>

                          {/* Matched Regional Coordinators / Teams List */}
                          <div className="space-y-2 my-3">
                            <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                              Coordenadores / Equipes Vinculados ({matchedRegCoords.length + matchedTeams.length}):
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {/* Coordenadores Regionais */}
                              {matchedRegCoords.map(c => {
                                const cVal = safeNum(c.targetVoters);
                                const ratio = target > 0 ? (cVal / target) * 100 : 0;
                                const pctOfMetaGeral = (isNaN(ratio) ? 0 : ratio).toFixed(1).replace('.', ',');
                                return (
                                  <div key={c.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl text-[9px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span className="font-black truncate">{c.name}</span>
                                      {c.region && (
                                        <span className="text-[8px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 truncate">
                                          ({c.region})
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[9px] border border-emerald-500/30 shrink-0">
                                      {cVal.toLocaleString('pt-BR')} Eleitores ({pctOfMetaGeral}% da Meta Geral)
                                    </span>
                                  </div>
                                );
                              })}

                              {/* Equipes e Líderes */}
                              {matchedTeams.map(t => {
                                const tVal = safeNum(t.targetVoters || t.goal);
                                const ratio = target > 0 ? (tVal / target) * 100 : 0;
                                const pctOfMetaGeral = (isNaN(ratio) ? 0 : ratio).toFixed(1).replace('.', ',');
                                return (
                                  <div key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 rounded-xl text-[9px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                      <span className="font-black truncate">{t.name}</span>
                                    </div>
                                    <span className="font-black bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[9px] border border-blue-500/30 shrink-0">
                                      {tVal.toLocaleString('pt-BR')} Eleitores ({pctOfMetaGeral}% da Meta Geral)
                                    </span>
                                  </div>
                                );
                              })}

                              {matchedRegCoords.length === 0 && matchedTeams.length === 0 && (
                                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-xl">
                                  ⚠️ Nenhum Coordenador Regional ou Equipe alocado para esta área ainda.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bars */}
                        <div className="mt-4 pt-3 border-t border-[var(--border-color)] space-y-3">
                          <div>
                            <div className="flex justify-between items-center text-[8.5px] font-black uppercase tracking-wider mb-1">
                              <span className="text-[var(--text-secondary)]">Distribuição entre Regionais ({totalAllocated} / {target})</span>
                              <span className="text-emerald-500">{allocPct}% Alocado</span>
                            </div>
                            <div className="w-full bg-[var(--bg-tertiary)] h-2 rounded-xl overflow-hidden border border-[var(--border-color)]">
                              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${allocPct}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-[8.5px] font-black uppercase tracking-wider mb-1">
                              <span className="text-[var(--text-secondary)]">Eleitores Mapeados ({registeredCount} / {target})</span>
                              <span className={reachPct >= 100 ? 'text-emerald-500 font-black' : reachPct < 30 ? 'text-red-500 font-black animate-pulse' : 'text-blue-500 font-bold'}>
                                {reachPct >= 100 ? '🏆 100% (BATEU A META!)' : reachPct < 30 ? `⚠️ ${reachPct}% (CRÍTICO)` : `${reachPct}% Alcançado`}
                              </span>
                            </div>
                            <div className="w-full bg-[var(--bg-tertiary)] h-2 rounded-xl overflow-hidden border border-[var(--border-color)]">
                              <div className={`h-full transition-all duration-500 ${reachPct >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : reachPct < 30 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(reachPct, 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {goalsList.filter(g => g.category === goalCategory || (!g.category && goalCategory === 'municipio')).length === 0 && (
                    <div className="col-span-full bg-[var(--bg-secondary)] border border-[var(--border-color)] p-10 text-center rounded-xl">
                      <Target className="w-10 h-10 text-zinc-400 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-black uppercase text-[var(--text-primary)] tracking-tight">Nenhuma meta geral cadastrada nesta categoria</p>
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-1">
                        Preencha o formulário acima para criar metas gerais por {goalCategory === 'municipio' ? 'município' : goalCategory === 'bairro' ? 'bairro' : 'região'}.
                      </p>
                    </div>
                  )}
                </div>

                {/* Section for Regional Coords without explicit Goal registered */}
                {(() => {
                  const unlinkedCoords = regionalCoordinators.filter(coord => {
                    const matched = goalsList.some(g => {
                      return isLocationMatchingGoal(g.locationName, coord.region, coord.subLocations);
                    });
                    return !matched;
                  });

                  if (unlinkedCoords.length === 0) return null;

                  return (
                    <div className="mt-8 bg-[var(--bg-secondary)] border border-amber-500/30 p-5 rounded-xl space-y-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-amber-500" />
                        <div>
                          <h3 className="text-xs font-black uppercase text-[var(--text-primary)] tracking-tight">
                            Coordenadores Regionais Aguardando Meta Geral Cadastrada ({unlinkedCoords.length})
                          </h3>
                          <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                            Estes coordenadores possuem metas de atuação mas a região correspondente ainda não possui uma Meta Geral definida.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {unlinkedCoords.map(coord => (
                          <div key={coord.id} className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-3 rounded-xl flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-black text-[var(--text-primary)] uppercase">{coord.name}</p>
                              <p className="text-[9px] font-bold text-blue-500 uppercase">Região: {coord.region} • Meta: {Number(coord.targetVoters || 0).toLocaleString('pt-BR')}</p>
                              {coord.subLocations && <p className="text-[8px] text-[var(--text-secondary)] font-mono">Bairros/Municípios: {coord.subLocations}</p>}
                            </div>
                            <button
                              onClick={() => {
                                setNewGoal({
                                  locationName: coord.region || coord.subLocations || 'Nova Região',
                                  targetVoters: (Number(coord.targetVoters) || 500) * 2,
                                  category: goalCategory
                                });
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }}
                              className="bg-amber-600 hover:bg-amber-500 text-white font-black text-[9px] px-3 py-2 rounded-xl uppercase tracking-wider shrink-0"
                            >
                              + Criar Meta Geral
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {activeTab === 'regional_coords' && isGeral && (
              <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border-color)] pb-6">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-blue-600" /> Coordenadores Regionais
                    </h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest mt-2">
                      Gestão de Diretores Regionais, Metas de Bairro e Links de Acesso
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsRegionalModalOpen(true);
                      setRegCoordStep('form');
                      setNewRegCoord({ name: '', email: '', phone: '', region: '', subLocations: '', targetVoters: 500 });
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-5 py-3 rounded-xl uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Cadastrar Coordenador Regional
                  </button>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl">
                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Coordenadores Ativos</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">{regionalCoordinators.length}</p>
                    <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-1">Visão Regional Unificada</p>
                  </div>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl">
                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Meta Acumulada Regional</p>
                    <p className="text-2xl font-black text-emerald-500 mt-1">
                      {regionalCoordinators.reduce((acc, curr) => acc + (Number(curr.targetVoters) || 0), 0).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-1">Eleitores Previstos</p>
                  </div>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl">
                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Regiões Mapeadas</p>
                    <p className="text-2xl font-black text-purple-500 mt-1">
                      {new Set(regionalCoordinators.map(r => r.region).filter(Boolean)).size}
                    </p>
                    <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-1">Polos & Municípios</p>
                  </div>
                </div>

                {/* List of Regional Coordinators */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {regionalCoordinators.map(coord => {
                    const link = `${window.location.origin}/login?email=${encodeURIComponent(coord.email)}&access_token=${btoa(coord.tempPassword || '123456')}&role=coordenador_regional&coordinatorId=${coordinatorId || user?.uid || ''}`;
                    return (
                      <div key={coord.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl relative group hover:border-blue-500/50 transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="text-[7px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-xl uppercase tracking-widest">
                                COORDENADOR REGIONAL
                              </span>
                              <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-1.5">{coord.name}</h3>
                              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{coord.region || 'Região Não Definida'}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleOpenEditRegCoord(coord)}
                                className="text-zinc-400 hover:text-blue-500 p-1.5 rounded-xl transition-colors hover:bg-[var(--bg-tertiary)]"
                                title="Editar Coordenador Regional"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteRegionalCoordinator(coord.id, coord.email)}
                                className="text-zinc-400 hover:text-red-500 p-1.5 rounded-xl transition-colors hover:bg-[var(--bg-tertiary)]"
                                title="Remover Coordenador"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 py-3 border-y border-[var(--border-color)] my-3 text-[11px] font-medium text-[var(--text-primary)]">
                            <p className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase w-16 shrink-0">E-mail:</span>
                              <span className="font-mono text-xs truncate">{coord.email}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase w-16 shrink-0">WhatsApp:</span>
                              <span className="font-mono text-xs">{coord.phone || 'Não informado'}</span>
                            </p>
                            {coord.subLocations && (
                              <p className="flex items-start gap-2">
                                <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase w-16 shrink-0 mt-0.5">Composição:</span>
                                <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-xl flex-1 font-bold">
                                  {coord.subLocations}
                                </span>
                              </p>
                            )}
                            <p className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase w-16 shrink-0">Meta:</span>
                              <span className="font-bold text-emerald-500">{coord.targetVoters ? Number(coord.targetVoters).toLocaleString('pt-BR') : '500'} Eleitores</span>
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(link);
                            alert("Link de Acesso do Coordenador Regional copiado para a área de transferência!");
                          }}
                          className="w-full bg-zinc-900 hover:bg-zinc-800 text-blue-400 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-zinc-800 mt-2"
                        >
                          <Send className="w-3.5 h-3.5" /> Copiar Link de Acesso WhatsApp
                        </button>
                      </div>
                    );
                  })}

                  {regionalCoordinators.length === 0 && (
                    <div className="col-span-full bg-[var(--bg-secondary)] border border-[var(--border-color)] p-12 text-center rounded-xl">
                      <ShieldCheck className="w-12 h-12 text-zinc-400 mx-auto mb-3 opacity-50" />
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Nenhum Coordenador Regional Cadastrado</h3>
                      <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-1 max-w-md mx-auto">
                        Cadastre os coordenadores regionais para gerenciarem frentes de atuação específicas em municípios ou bairros.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'teams' && (
              <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 md:space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2.5 border-b border-[var(--border-color)] pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Gestão de Equipes</h2>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">Controle tático de recursos e unidades</p>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto mt-1 md:mt-0">
                    <button
                      onClick={() => setIsWaModalOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md font-semibold text-xs uppercase flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all flex-1 md:flex-initial whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Disparar WhatsApp Líderes
                    </button>
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
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md font-semibold text-xs uppercase flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] active:scale-95 transition-all flex-1 md:flex-initial whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5 text-white" /> Cadastrar Nova Unidade
                    </button>
                  </div>
                </div>

                {/* Gerador de Link de Autocadastro de Eleitor para Equipes */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md p-3.5 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                    <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase text-[var(--text-primary)] tracking-wider">Gerador de Link de Autocadastro</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Selecione a Equipe</label>
                      <select
                        value={selectedLinkTeam}
                        onChange={(e) => setSelectedLinkTeam(e.target.value)}
                        className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md p-2 font-medium text-xs outline-none focus:border-blue-600 transition-all"
                      >
                        <option value="">-- Escolha uma equipe --</option>
                        {teams.map((t) => (
                          <option key={t.id || t.name} value={t.id || t.name.replace(/\s/g, '_').toLowerCase()}>
                            {t.name} (Líder: {t.leader || 'N/A'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Link Gerado</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          readOnly
                          type="text"
                          value={selectedLinkTeam ? `${window.location.origin}/cadastro?teamId=${selectedLinkTeam}&coordinatorId=${coordinatorId || user?.uid || ''}` : 'Por favor, selecione uma equipe acima...'}
                          className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-md px-3 py-2 font-mono text-xs outline-none select-all"
                        />
                        <button
                          type="button"
                          disabled={!selectedLinkTeam}
                          onClick={() => {
                            if (!selectedLinkTeam) return;
                            navigator.clipboard.writeText(`${window.location.origin}/cadastro?teamId=${selectedLinkTeam}&coordinatorId=${coordinatorId || user?.uid || ''}`);
                            alert("✅ Link copiado para a área de transferência!");
                          }}
                          className={`px-3 py-2 rounded-md font-semibold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                            selectedLinkTeam
                              ? 'bg-blue-600 hover:bg-blue-500 text-white'
                              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] cursor-not-allowed'
                          }`}
                        >
                          Copiar Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Search, Filters and Gamification */}
                {(() => {
                  const filteredTeams = teams.filter(t => {
                    const matchesSearch = t.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) || 
                                          (t.leader || '').toLowerCase().includes(teamSearchQuery.toLowerCase());
                    const matchesStatus = teamStatusFilter === 'ALL' ? true :
                                          teamStatusFilter === 'CRITICO' ? t.fraudAlert :
                                          teamStatusFilter === 'ALERTA' ? t.status === 'ALERTA' : true;
                    return matchesSearch && matchesStatus;
                  });

                  // Leaderboard calculation
                  const teamsWithStats = teams.map(t => {
                    const matched = allVoters.filter(v => isVoterInTeam(v, t)).length;
                    const count = teamVotersCountMap[t.name] !== undefined ? Math.max(teamVotersCountMap[t.name], matched) : matched;
                    return { ...t, totalVoters: count };
                  }).sort((a, b) => b.totalVoters - a.totalVoters);
                  
                  const top3 = teamsWithStats.slice(0, 3);

                  return (
                    <div className="space-y-6">
                      {/* Search and Filters */}
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md p-3.5 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
                        <div className="relative flex-1 w-full">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                          <input 
                            type="text" 
                            placeholder="Buscar liderança ou equipe..." 
                            value={teamSearchQuery}
                            onChange={e => setTeamSearchQuery(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                          <button onClick={() => setTeamStatusFilter('ALL')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap border transition-all ${teamStatusFilter === 'ALL' ? 'bg-zinc-800 text-white border-zinc-700 dark:bg-zinc-200 dark:text-zinc-900' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]'}`}>Todas</button>
                          <button onClick={() => setTeamStatusFilter('ALERTA')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap border transition-all ${teamStatusFilter === 'ALERTA' ? 'bg-blue-600/20 text-blue-500 border-blue-500/30' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]'}`}>Alertas</button>
                          <button onClick={() => setTeamStatusFilter('CRITICO')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap border transition-all ${teamStatusFilter === 'CRITICO' ? 'bg-red-600/20 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(220,38,38,0.2)]' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]'}`}>Crítico 🚨</button>
                        </div>
                      </div>

                      {/* Leaderboard */}
                      {top3.length > 0 && teamSearchQuery === '' && teamStatusFilter === 'ALL' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                           {top3.map((t, idx) => (
                             <div key={t.id || t.name} className={`relative bg-gradient-to-br ${idx === 0 ? 'from-amber-500/10 to-yellow-600/5 border-amber-500/30 shadow-md shadow-amber-500/10' : idx === 1 ? 'from-slate-400/10 to-slate-500/5 border-slate-400/30' : 'from-orange-700/10 to-orange-800/5 border-orange-700/30'} border rounded-md p-4 flex items-center gap-4 overflow-hidden`}>
                               <div className="absolute -right-4 -top-4 opacity-10">
                                 <Trophy className="w-24 h-24" />
                               </div>
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)]' : idx === 1 ? 'bg-slate-400 text-white' : 'bg-orange-700 text-white'}`}>
                                 {idx + 1}º
                               </div>
                               <div className="z-10">
                                 <p className="text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-0.5">Top {idx + 1} Líder</p>
                                 <h4 className="font-black text-[var(--text-primary)] text-sm md:text-base truncate max-w-[140px] uppercase tracking-tight">{t.leader || t.name}</h4>
                                 <p className="text-xs font-black text-emerald-500 flex items-center gap-1 mt-0.5">
                                    <Users className="w-3 h-3" /> {t.totalVoters} Eleitores
                                 </p>
                               </div>
                             </div>
                           ))}
                        </div>
                      )}

                      {/* Teams Grid */}
                      <div className="grid grid-cols-1 gap-3">
                        {filteredTeams.length > 0 ? filteredTeams.map((team) => {
                          const matched = allVoters.filter(v => isVoterInTeam(v, team)).length;
                          const votersCount = teamVotersCountMap[team.name] !== undefined ? Math.max(teamVotersCountMap[team.name], matched) : matched;
                          const engajamento = Math.min(100, Math.round((votersCount / 100) * 100));
                          const teamUrgencies = urgencies.filter(u => u.team === team.name).length;
                          const teamIdKey = team.id || team.name.replace(/\s/g, '_').toLowerCase();

                          return (
                            <motion.div 
                              key={teamIdKey} 
                              layout
                              className={`bg-[var(--bg-secondary)] border ${team.fraudAlert ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.15)] animate-pulse' : 'border-[var(--border-color)]'} rounded-md p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-blue-500/50 transition-all group`}
                            >
                              <div className="flex flex-col lg:flex-row gap-4 lg:items-center flex-1">
                                <div className="flex items-center gap-3 min-w-[200px]">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${team.status === 'OK' ? 'bg-emerald-500/20 text-emerald-500' : team.status === 'ALERTA' ? 'bg-blue-500/20 text-blue-500' : 'bg-red-500/20 text-red-500'}`}>
                                    <Users className="w-5 h-5" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <h3 className="font-semibold text-[var(--text-primary)] text-sm truncate">{team.name}</h3>
                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase flex items-center gap-1">
                                      <User className="w-3 h-3 text-blue-500" /> Líder: {team.leader}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 flex-1">
                                  {/* Donut Chart Simulado / Engajamento */}
                                  <div className="flex items-center gap-2">
                                    <div className="relative w-10 h-10 shrink-0">
                                      <svg viewBox="0 0 36 36" className="w-10 h-10 circular-chart text-emerald-500">
                                        <path className="text-[var(--bg-tertiary)] stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path className="stroke-current" strokeDasharray={`${engajamento}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                      </svg>
                                      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black">{engajamento}%</div>
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Performance</p>
                                      <p className="text-sm font-black text-[var(--text-primary)]">{votersCount} Votos</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${teamUrgencies > 0 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                      <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Demandas</p>
                                      <p className={`text-sm font-black ${teamUrgencies > 0 ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>{teamUrgencies} Abertas</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${team.status === 'OK' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : team.status === 'ALERTA' ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
                                    <div>
                                      <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Saúde</p>
                                      <p className="text-xs font-black text-[var(--text-primary)] uppercase">{team.status === 'OK' ? 'Operando' : team.status}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0 pt-2 lg:pt-0 mt-2 lg:mt-0 border-t lg:border-t-0 border-[var(--border-color)]">
                                <button 
                                  onClick={async () => {
                                    setTeamGroqLoading(teamIdKey);
                                    try {
                                      const res = await analisarRaioXEquipe({ teamName: team.name, eleitores: votersCount, demandas: teamUrgencies, status: team.status, engajamento });
                                      showToast(`⚡ IA Tática: ${res.conselho_tatico}`, 'success');
                                    } catch(err:any) {
                                      showToast(err.message, 'error');
                                    } finally {
                                      setTeamGroqLoading(null);
                                    }
                                  }}
                                  disabled={teamGroqLoading === teamIdKey}
                                  className="p-2 bg-purple-600/10 hover:bg-purple-600 text-purple-600 hover:text-white rounded-md transition-all border border-purple-500/30 flex items-center justify-center group"
                                  title="Raio-X Inteligente (Groq IA)"
                                >
                                  {teamGroqLoading === teamIdKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                </button>
                                <button onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/cadastro?teamId=${teamIdKey}&coordinatorId=${coordinatorId || user?.uid || ''}`);
                                  alert(`✅ Link de autocadastro da equipe "${team.name}" copiado com sucesso!`);
                                }} className="p-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md border border-[var(--border-color)]" title="Copiar Link de Autocadastro"><UserPlus className="w-4 h-4" /></button>
                                <button onClick={() => handleCopyAccessLink(team)} className="p-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md border border-[var(--border-color)]" title="Copiar Credenciais de Acesso"><LogIn className="w-4 h-4" /></button>
                                <button onClick={() => handleEditTeam(team)} className="p-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md border border-[var(--border-color)]" title="Editar Unidade"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteTeam(teamIdKey, team.name)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-md border border-red-500/30" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                                <button 
                                  onClick={() => { setSelectedManagingTeam(team); setIsTeamManagementOpen(true); }}
                                  className={`px-4 py-2 rounded-md font-black text-[10px] uppercase tracking-wider transition-all shadow-sm ${teamUrgencies > 0 ? 'bg-red-600 text-white hover:bg-red-700 shadow-[0_0_10px_rgba(220,38,38,0.2)]' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.2)]'}`}
                                >
                                  Gerenciar Equipe
                                </button>
                              </div>
                            </motion.div>
                          );
                        }) : (
                          <div className="p-12 text-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md">
                            <Users className="w-8 h-8 text-[var(--text-secondary)] opacity-50 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-[var(--text-secondary)]">Nenhuma equipe encontrada para este filtro.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {activeTab === 'voters' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[var(--border-color)] pb-4 md:pb-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-950 rounded-xl flex items-center justify-center shadow-lg">
                      <Target className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">Base de Eleitores</h2>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">Gestão centralizada de segmentação e influência</p>
                    </div>
                  </div>
                </div>

                {/* FILTERS */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 md:p-6 shadow-sm space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-500 ml-1">Pesquisar por Nome ou Telefone</label>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        <input 
                          type="text" 
                          value={voterSearch}
                          onChange={e => setVoterSearch(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium text-zinc-900 dark:text-white outline-none focus:border-blue-600 transition-all"
                          placeholder="Ex: João Silva ou (95) 99..."
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-500 ml-1">Filtrar por Articulador</label>
                      <div className="relative">
                        <Handshake className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        <select 
                          value={articulatorFilter}
                          onChange={e => setArticulatorFilter(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium text-zinc-900 dark:text-white outline-none focus:border-blue-600 transition-all appearance-none"
                        >
                          <option value="">Todos os articuladores</option>
                          {(allVoters.length > 0 ? allVoters.filter(v => v.isArticulator) : articulators).map(art => (
                            <option key={art.id} value={art.id}>{art.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* AÇÕES COLETIVAS */}
                  {isAdmin && (
                    <div className="pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => setIsWaModalOpen(true)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 md:py-4 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all outline-none"
                      >
                        <Send className="w-3.5 h-3.5" /> Disparar Convite via WhatsApp (wa.me) para {filteredVoters.length} Eleitores
                      </button>
                      <button 
                        onClick={() => {
                          const count = filteredVoters.filter(v => !v.voted).length;
                          alert(`🚨 ALERTA DE LOGÍSTICA!\n${count} eleitores pendentes na área atual. Acionando líderes de equipe para mobilização imediata.`);
                        }}
                        className="px-6 md:px-8 bg-red-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 py-3 md:py-0 shadow-lg shadow-red-500/10 outline-none"
                      >
                        <Activity className="w-3.5 h-3.5" /> Alerta de Logística (Dia D)
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Filtrar por Tags (Segmentação)</label>
                    <div className="flex flex-wrap gap-2">
                       {availableTags.length > 0 ? availableTags.map(tag => (
                         <button
                           key={tag}
                           onClick={() => {
                             if (voterFilterTags.includes(tag)) {
                               setVoterFilterTags(voterFilterTags.filter(t => t !== tag));
                             } else {
                               setVoterFilterTags([...voterFilterTags, tag]);
                             }
                           }}
                           className={`px-2.5 py-1.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase transition-all border ${
                             voterFilterTags.includes(tag)
                             ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                             : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-zinc-200 dark:hover:bg-zinc-800'
                           }`}
                         >
                           {tag}
                         </button>
                       )) : (
                         <p className="text-[10px] text-zinc-400 italic">Nenhuma tag cadastrada ainda.</p>
                       )}
                       {voterFilterTags.length > 0 && (
                         <button 
                           onClick={() => setVoterFilterTags([])}
                           className="text-[9px] font-black text-red-600 uppercase tracking-widest ml-2 flex items-center gap-1"
                         >
                           <X className="w-3 h-3" /> Limpar Filtros
                         </button>
                       )}
                    </div>
                  </div>
                </div>

                {/* TABLE/LIST */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-x-auto min-h-[400px] custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[600px] lg:min-w-0">
                    <thead>
                      <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                        <th className="p-3.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Eleitor / Fidelidade</th>
                        <th className="p-3.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Articulação</th>
                        <th className="p-3.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Segmentação</th>
                        <th className="p-3.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Equipe / Líder</th>
                        <th className="p-3.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {loadingPaginatedVoters ? (
                        <tr>
                          <td colSpan={5} className="p-20 text-center">
                            <RefreshCcw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                            <p className="font-black text-[var(--text-secondary)] uppercase tracking-widest text-[9px]">Buscando registros otimizados no servidor...</p>
                          </td>
                        </tr>
                      ) : paginatedVoters.length > 0 ? paginatedVoters.map((voter) => (
                        <tr key={voter.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                          <td className="p-3.5">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-zinc-950 uppercase leading-none">{voter.name}</span>
                                {voter.isArticulator && (
                                  <span className="bg-zinc-950 text-blue-600 text-[7px] font-black px-1.5 py-0.5 rounded-xl uppercase tracking-tighter">Articulador</span>
                                )}
                                {voter.isIndigenous && (
                                  <span className="bg-orange-100 text-orange-700 text-[7px] font-black px-1.5 py-0.5 rounded-xl uppercase tracking-tighter">Com. Tradicional</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex items-center gap-1">
                                  {[1,2,3,4,5].map(star => (
                                    <div 
                                      key={star} 
                                      className={`w-2 h-2 rounded-full ${star <= (voter.loyaltyScore || 3) ? 'bg-blue-600 shadow-[0_0_5px_rgba(5,120,211,0.4)]' : 'bg-zinc-200'}`}
                                    ></div>
                                  ))}
                                </div>
                                <div className="w-1 h-1 bg-zinc-300 rounded-full"></div>
                                {voter.sentiment === 'support' && <CheckCircle2 className="w-3 h-3 text-emerald-500" title="Apoiador" />}
                                {voter.sentiment === 'opposed' && <XCircle className="w-4 h-4 text-red-500" title="Oposição" />}
                                {voter.sentiment === 'neutral' && <Activity className="w-3 h-3 text-zinc-300" title="Neutro" />}
                                <span className="text-[10px] font-bold text-zinc-400">{voter.phone}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-zinc-900 uppercase leading-none">
                                {voter.articulatorId ? (allVoters.find(v => v.id === voter.articulatorId)?.name || articulators.find(v => v.id === voter.articulatorId)?.name || 'Articulador') : (voter.referredBy || '---')}
                              </span>
                              {voter.familyCommunity && (
                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Grupamento: {voter.familyCommunity}</span>
                              )}
                              {voter.communityName && (
                                <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest mt-1">Com: {voter.communityName}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1 items-center">
                              {voter.voted ? (
                                <span className="bg-emerald-500 text-white text-[7px] font-black px-2 py-0.5 rounded-xl uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> VOTOU
                                </span>
                              ) : (
                                <span className="bg-zinc-100 text-zinc-400 text-[7px] font-black px-2 py-0.5 rounded-xl uppercase tracking-widest flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" /> PENDENTE
                                </span>
                              )}
                              {voter.hasDocPhoto ? (
                                <span className="bg-zinc-900 text-white text-[7px] font-black px-2 py-0.5 rounded-xl uppercase tracking-widest flex items-center gap-1">
                                  <Camera className="w-2.5 h-2.5" /> DOC OK
                                </span>
                              ) : (
                                <span className="bg-zinc-50 text-red-400 border border-red-100 text-[7px] font-black px-2 py-0.5 rounded-xl uppercase tracking-widest">
                                  SEM DOC
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {voter.tags?.map((tag: string) => (
                                <span key={tag} className="bg-blue-600/10 text-blue-700 px-2 py-0.5 rounded-xl text-[8px] font-black uppercase">
                                  {tag}
                                </span>
                              )) || <span className="text-zinc-300">---</span>}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-zinc-900 uppercase leading-none">{voter.team}</span>
                              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{voter.leaderName}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                             <div className="flex justify-end gap-2">
                               <button 
                                 onClick={() => {
                                   setSelectedVoter(voter);
                                   setVoterEditForm({
                                     name: voter.name,
                                     phone: voter.phone,
                                     address: voter.address,
                                     observations: voter.observations || '',
                                     referredBy: voter.referredBy || '',
                                     tags: voter.tags || [],
                                     loyaltyScore: voter.loyaltyScore || 3,
                                     familyCommunity: voter.familyCommunity || '',
                                     associatedCandidates: voter.associatedCandidates || '',
                                     isArticulator: voter.isArticulator || false,
                                     articulatorId: voter.articulatorId || '',
                                     voted: voter.voted || false,
                                     isIndigenous: voter.isIndigenous || false,
                                     communityName: voter.communityName || '',
                                     tuxauaName: voter.tuxauaName || '',
                                     hasDocPhoto: voter.hasDocPhoto || false,
                                     sentiment: voter.sentiment || 'neutral',
                                      cpf: voter.cpf || '',
                                      rg: voter.rg || '',
                                      titulo: voter.titulo || '',
                                      zona: voter.zona || '',
                                      secao: voter.secao || '',
                                      localVotacao: voter.localVotacao || ''
                                   });
                                   setIsVoterEditModalOpen(true);
                                 }}
                                 className="p-2 text-zinc-400 hover:text-blue-600 transition-all hover:bg-blue-600/10 rounded-xl"
                                 title="Editar dados"
                               >
                                 <Edit3 className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => handleDeleteVoter(voter.id)}
                                 className="p-2 text-zinc-400 hover:text-red-600 transition-all hover:bg-red-500/10 rounded-xl"
                                 title="Excluir eleitor"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="p-20 text-center">
                            <Search className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                            <p className="font-black text-zinc-300 uppercase tracking-widest text-[10px]">Nenhum eleitor encontrado com estes filtros.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINAÇÃO */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-bold text-[var(--text-secondary)]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] uppercase font-black text-zinc-400">Itens por página:</span>
                    <select
                      value={voterPageSize}
                      onChange={(e) => {
                        setVoterPageSize(Number(e.target.value));
                        setVoterPage(1);
                      }}
                      className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-1.5 px-3 font-black uppercase outline-none focus:border-blue-600 transition-colors cursor-pointer text-[10px]"
                    >
                      {[10, 25, 50, 100, 250].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400">
                      Exibindo {filteredVoters.length === 0 ? 0 : (voterPage - 1) * voterPageSize + 1} - {Math.min(voterPage * voterPageSize, filteredVoters.length)} de {allVoters.length > 0 ? filteredVoters.length : (totalVotersCount || filteredVoters.length)} eleitores
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={voterPage === 1}
                      onClick={() => setVoterPage(prev => Math.max(prev - 1, 1))}
                      className="p-2 px-3 border border-[var(--border-color)] rounded-xl bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[var(--text-primary)] transition-all font-black text-[10px] uppercase tracking-wider"
                    >
                      Anterior
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (voterPage > 3 && totalPages > 5) {
                        if (voterPage + 2 <= totalPages) {
                          pageNum = voterPage - 3 + i + 1;
                        } else {
                          pageNum = totalPages - 5 + i + 1;
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setVoterPage(pageNum)}
                          className={`w-8 h-8 rounded-xl font-black border transition-all text-[10px] ${
                            voterPage === pageNum
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                              : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      disabled={voterPage === totalPages}
                      onClick={() => setVoterPage(prev => Math.min(prev + 1, totalPages))}
                      className="p-2 px-3 border border-[var(--border-color)] rounded-xl bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[var(--text-primary)] transition-all font-black text-[10px] uppercase tracking-wider"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'agenda' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/10">
                      <Calendar className="w-6 h-6 text-zinc-950" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">Agenda</h2>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">Logística e compromissos oficiais</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingAgenda(null);
                      setAgendaForm({ municipio: '', data: '', hora_inicio: '', hora_fim: '', motivo: '', allocatedMaterials: '' });
                      setIsAgendaCreateModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all w-full md:w-auto cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-white" /> Agendar Evento
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  
                  {/* Cronograma Confirmado (Timeline Oficial) - AGORA EM DESTAQUE (2 Colunas) */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-[var(--border-color)] rounded-2xl p-6 lg:p-8 shadow-sm h-full relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
                      <div className="flex items-center justify-between mb-8 relative z-10">
                        <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-3">
                           Timeline Oficial
                        </h3>
                      </div>
                      
                      <div className="relative space-y-6 before:absolute before:inset-0 before:left-[11px] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-blue-200 before:to-transparent z-10 overflow-y-auto max-h-[600px] custom-scrollbar pr-2 pb-8">
                        {agendas.filter(a => a.status === 'confirmado').sort((a, b) => new Date(`${a.data}T${a.hora_inicio}`).getTime() - new Date(`${b.data}T${b.hora_inicio}`).getTime()).map((item, idx) => {
                          const itemDate = new Date(item.data);
                          itemDate.setMinutes(itemDate.getMinutes() + itemDate.getTimezoneOffset());
                          
                          return (
                          <motion.div 
                            key={item.id} 
                            layout
                            onClick={() => {
                              setSelectedAgenda(item);
                              setIsAgendaDetailModalOpen(true);
                            }}
                            className="relative flex items-start group cursor-pointer"
                          >
                            <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-blue-500 shadow shrink-0 absolute left-0 z-10 group-hover:scale-125 transition-transform" />
                            <div className="ml-10 w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-2xl shadow-sm group-hover:border-blue-500/50 group-hover:shadow-md transition-all relative overflow-hidden">
                               <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/30 rounded-bl-full -mr-4 -mt-4 pointer-events-none" />
                               <div className="flex justify-between items-start mb-3 relative z-10">
                                 <span className="text-[11px] font-black text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {item.hora_inicio}</span>
                                 <span className="text-[11px] font-black text-[var(--text-secondary)] uppercase bg-[var(--bg-tertiary)] px-2.5 py-1 rounded-md border border-[var(--border-color)]">{itemDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                               </div>
                               <h4 className="text-base font-black uppercase text-[var(--text-primary)] group-hover:text-blue-600 transition-colors leading-tight mb-2 relative z-10">{item.municipio}</h4>
                               {item.motivo && <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed relative z-10">{item.motivo}</p>}
                            </div>
                          </motion.div>
                        )})}
                        {agendas.filter(a => a.status === 'confirmado').length === 0 && (
                          <div className="text-center text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mt-12 w-full relative z-20">Nenhum evento oficializado.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Solicitações Pendentes - AGORA NA LATERAL (1 Coluna) */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
                      <div className="flex flex-col gap-2 mb-6 border-b border-[var(--border-color)] pb-4">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500" /> Aprovação Pendente
                        </h3>
                        <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg text-[10px] font-black w-fit uppercase tracking-widest">
                          {agendas.filter(a => a.status === 'pendente').length} aguardando
                        </span>
                      </div>
                      
                      <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                        {agendas.filter(a => a.status === 'pendente').length > 0 ? agendas.filter(a => a.status === 'pendente').map((item) => {
                          const itemDate = new Date(item.data);
                          itemDate.setMinutes(itemDate.getMinutes() + itemDate.getTimezoneOffset());
                          const isToday = itemDate.toDateString() === new Date().toDateString();
                          
                          return (
                          <motion.div key={item.id} layout className="bg-white dark:bg-zinc-900 border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-4 group hover:border-blue-500/30 hover:shadow-md transition-all relative overflow-hidden">
                            {isToday && <div className="absolute top-0 left-0 w-1 h-full bg-red-500" title="Evento Hoje!" />}
                            
                            <div className="flex items-start gap-3">
                              <div className={`flex flex-col items-center justify-center min-w-[50px] h-[50px] rounded-lg shrink-0 shadow-sm ${isToday ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                <span className="text-[8px] font-black uppercase leading-none mb-0.5">{itemDate.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                <span className="text-xl font-black leading-none">{itemDate.getDate()}</span>
                              </div>
                              <div className="space-y-1 w-full min-w-0">
                                <h3 className="text-xs font-black tracking-tight text-[var(--text-primary)] truncate group-hover:text-blue-600 transition-colors" title={item.municipio}>{item.municipio}</h3>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)]">
                                  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${isToday ? 'bg-red-100 text-red-700' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)]'}`}>
                                    <Clock className="w-2.5 h-2.5" /> {item.hora_inicio}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[var(--text-secondary)] truncate">
                                  Por: <span className="font-bold text-[var(--text-primary)]">{item.sugeridoPor || 'Coordenador'}</span>
                                </div>
                              </div>
                            </div>

                            {item.motivo && <p className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] line-clamp-2">{item.motivo}</p>}

                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <button 
                                onClick={async () => {
                                  await supabaseService.updateDocument('agenda', item.id, { status: 'negado' });
                                }}
                                className="px-2 py-2 bg-white border border-red-200 text-red-600 font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-1"
                              >
                                <X className="w-3 h-3" /> Negar
                              </button>
                              <button 
                                onClick={async () => {
                                  await supabaseService.updateDocument('agenda', item.id, { status: 'confirmado' });
                                }}
                                className="px-2 py-2 bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Confirmar
                              </button>
                            </div>
                          </motion.div>
                        );}) : (
                          <div className="p-8 bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-2xl text-center grayscale opacity-60">
                            <CheckCircle2 className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-3" />
                            <p className="font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] text-[9px]">Tudo em dia.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'mapa' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <RoraimaMapComponent 
                  teams={teams}
                  allVoters={allVoters}
                  theme={theme}
                  coordinatorId={coordinatorId || user?.uid}
                />
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[var(--border-color)] pb-4 md:pb-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center justify-center shadow-inner">
                      <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-[var(--text-primary)]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">Anotações Táticas</h2>
                      <div className="flex gap-2.5 mt-3 md:mt-5">
                        <button 
                          onClick={() => setNoteSubTab('tactical')}
                          className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3.5 md:px-6 py-2 md:py-2.5 rounded-xl transition-all border ${noteSubTab === 'tactical' ? 'bg-zinc-950 text-white border-zinc-950 shadow-xl dark:bg-blue-600 dark:text-white dark:border-blue-600' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-blue-600'}`}
                        >
                          Equipe (Fórum)
                        </button>
                        <button 
                          onClick={() => setNoteSubTab('private')}
                          className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3.5 md:px-6 py-2 md:py-2.5 rounded-xl transition-all border ${noteSubTab === 'private' ? 'bg-zinc-950 text-white border-zinc-950 shadow-xl dark:bg-blue-600 dark:text-white dark:border-blue-600' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-blue-600'}`}
                        >
                          Minhas Observações
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {noteSubTab === 'private' && (
                    <button 
                      onClick={() => setIsAiModalOpen(true)}
                      className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-3"
                    >
                      <Plus className="w-4 h-4" /> Nova Observação
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notes.filter(n => noteSubTab === 'private' ? (n.type === 'private' && n.authorId === user?.uid) : (n.type === 'tactical')).length > 0 ? (
                    notes.filter(n => noteSubTab === 'private' ? (n.type === 'private' && n.authorId === user?.uid) : (n.type === 'tactical')).map((note) => (
                      <NoteCard key={note.id} note={note} user={user} isAdmin={isAdmin} currentUserName={profileData?.name} onDelete={() => supabaseService.deleteDocument('notes', note.id)} />
                    ))
                  ) : (
                    <div className="col-span-full py-24 bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-xl text-center grayscale opacity-40">
                      <Clock className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                      <p className="font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] text-xs">Aguardando novos feeds táticos...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'materials' && (
              <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 md:space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[var(--border-color)] pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Gestão de Materiais e Estoque</h2>
                    <p className="text-[var(--text-secondary)] text-xs font-normal mt-1">Controle de lotes, distribuição e reposição para equipes de campo</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingMaterial(false);
                      setEditingMaterialId(null);
                      setMaterialForm({ name: '', qty: '' });
                      const input = document.getElementById('material-name-input');
                      if (input) {
                        input.focus();
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Novo Material
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* FORM ADD/EDIT MATERIAL */}
                  <div className="lg:col-span-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm h-fit relative">
                    <h3 className="text-xs font-black uppercase text-[var(--text-primary)] mb-4 flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                        {isEditingMaterial ? <Edit3 className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                      </div>
                      {isEditingMaterial ? 'Editar Material' : 'Cadastrar Material / Lote'}
                    </h3>
                    
                    <form id="material-form" onSubmit={isEditingMaterial ? handleSaveEditMaterial : handleAddMaterial} className="space-y-3.5 text-left">
                      {/* Categoria Rápida */}
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1.5">
                          Atalhos de Tipo / Categoria
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {[
                            'Santinho',
                            'Adesivo',
                            'Praguinha',
                            'Bandeira',
                            'Camisa',
                            'Placa',
                            'Faixa'
                          ].map((cat) => (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => {
                                const currentName = materialForm.name.trim();
                                if (!currentName || ['Santinho', 'Adesivo', 'Praguinha', 'Bandeira', 'Camisa', 'Placa', 'Faixa'].includes(currentName)) {
                                  setMaterialForm({ ...materialForm, name: cat });
                                } else if (!currentName.toLowerCase().includes(cat.toLowerCase())) {
                                  setMaterialForm({ ...materialForm, name: `${cat} - ${currentName}` });
                                }
                              }}
                              className="px-2 py-1 bg-[var(--bg-tertiary)] hover:bg-blue-500/10 hover:text-blue-600 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg text-[10px] font-semibold transition-all"
                            >
                              + {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                          Descrição do Material *
                        </label>
                        <input 
                          id="material-name-input"
                          name="name" 
                          type="text" 
                          required
                          placeholder="Ex: Santinho Oficial 55000" 
                          value={materialForm.name}
                          onChange={(e) => setMaterialForm({...materialForm, name: e.target.value})}
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 font-bold text-xs text-[var(--text-primary)] outline-none focus:border-blue-600 transition-colors" 
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                            {isEditingMaterial ? 'Quantidade Total' : 'Quantidade do Lote *'}
                          </label>
                          <div className="flex gap-1">
                            {[500, 1000, 5000, 10000, 50000].map((inc) => (
                              <button
                                key={inc}
                                type="button"
                                onClick={() => {
                                  const cur = parseInt(materialForm.qty.replace(/\D/g, '') || '0', 10);
                                  const next = cur + inc;
                                  setMaterialForm({ ...materialForm, qty: next.toLocaleString('pt-BR') });
                                }}
                                className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 transition-colors"
                              >
                                +{inc >= 1000 ? `${inc / 1000}k` : inc}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input 
                          name="qty" 
                          type="text" 
                          inputMode="numeric"
                          required
                          placeholder="Ex: 50.000" 
                          value={materialForm.qty}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '');
                            setMaterialForm({...materialForm, qty: digits ? parseInt(digits, 10).toLocaleString('pt-BR') : ''});
                          }}
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 font-bold text-xs text-[var(--text-primary)] outline-none focus:border-blue-600 transition-colors" 
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        {isEditingMaterial && (
                          <button 
                            type="button"
                            onClick={() => { setIsEditingMaterial(false); setEditingMaterialId(null); setMaterialForm({ name: '', qty: '' }); }}
                            className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[var(--bg-primary)] transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}
                        <button type="submit" className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm active:scale-95 transition-all cursor-pointer">
                          {isEditingMaterial ? 'Salvar Alterações' : 'Cadastrar Material'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* MATERIAL LIST */}
                  <div className="lg:col-span-2 space-y-3">
                    {materials.length > 0 ? materials.sort((a, b) => b.createdAt - a.createdAt).map(m => {
                      const total = m.total || 1;
                      const current = m.current ?? 0;
                      const percent = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
                      const isZero = current <= 0;
                      const isLow = !isZero && percent < 20;

                      return (
                        <div key={m.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-blue-600/30 transition-all shadow-sm">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border border-[var(--border-color)] shrink-0 ${
                              isZero ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800' :
                              isLow ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' :
                              'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
                            }`}>
                              <Package className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-[var(--text-primary)] text-sm leading-tight truncate">{m.name}</h4>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isZero ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' :
                                  isLow ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                }`}>
                                  {isZero ? 'Esgotado' : isLow ? `Baixo (${percent}%)` : `Em Estoque (${percent}%)`}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-3">
                                <div className="h-2 w-28 sm:w-36 bg-[var(--bg-tertiary)] rounded-full overflow-hidden border border-[var(--border-color)]">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percent}%` }}
                                    className={`h-full ${
                                      isZero ? 'bg-zinc-400' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`} 
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                                  <strong className="text-[var(--text-primary)]">{current.toLocaleString('pt-BR')}</strong> / {total.toLocaleString('pt-BR')} un
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-color)]">
                            <button 
                              onClick={() => handleStartEditMaterial(m)} 
                              className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all cursor-pointer"
                              title="Editar Material"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteMaterial(m.id)} 
                              className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                              title="Excluir Material"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="h-4 w-px bg-[var(--border-color)] mx-1" />
                            <button 
                              onClick={() => handleUpdateMaterial(m.id, 100)} 
                              className="px-2 py-1.5 rounded-lg border border-[var(--border-color)] text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer"
                              title="Adicionar 100 unidades"
                            >
                              +100
                            </button>
                            <button 
                              onClick={() => handleUpdateMaterial(m.id, 500)} 
                              className="px-2 py-1.5 rounded-lg border border-[var(--border-color)] text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer"
                              title="Adicionar 500 unidades"
                            >
                              +500
                            </button>
                            <button 
                              onClick={() => handleUpdateMaterial(m.id, 1000)} 
                              className="px-2 py-1.5 rounded-lg border border-[var(--border-color)] text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer"
                              title="Adicionar 1.000 unidades"
                            >
                              +1k
                            </button>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="py-16 text-center bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-2xl">
                        <Package className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3 opacity-40" />
                        <p className="text-[var(--text-secondary)] font-bold text-xs">Nenhum material cadastrado no estoque.</p>
                        <p className="text-[var(--text-secondary)] text-[10px] mt-1 opacity-60">Use o formulário ao lado para cadastrar santinhos, adesivos e bandeiras.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* SOLICITAÇÕES DE LÍDERES */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 md:p-10 shadow-[var(--shadow-sm)]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-[var(--border-color)] pb-6 gap-4">
                    <div>
                      <h3 className="text-xl font-black uppercase text-[var(--text-primary)] tracking-tighter leading-none">Solicitações de Líderes</h3>
                      <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-3 opacity-60">Pedidos de remessa e distribuição de campo</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          const collapsed: Record<string, boolean> = {};
                          materialRequests.forEach(r => {
                            collapsed[r.id] = false; // false = expanded
                          });
                          setCollapsedRequests(collapsed);
                        }}
                        className="flex-1 sm:flex-none px-3 py-1.5 border border-[var(--border-color)] rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all active:scale-95"
                      >
                        Expandir Todos
                      </button>
                      <button
                        onClick={() => {
                          const collapsed: Record<string, boolean> = {};
                          materialRequests.forEach(r => {
                            collapsed[r.id] = true; // true = collapsed
                          });
                          setCollapsedRequests(collapsed);
                        }}
                        className="flex-1 sm:flex-none px-3 py-1.5 border border-[var(--border-color)] rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all active:scale-95"
                      >
                        Recolher Todos
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {materialRequests.length > 0 ? materialRequests.sort((a, b) => b.createdAt - a.createdAt).map(req => {
                      const isCollapsed = collapsedRequests[req.id] !== false;
                      return (
                        <div 
                          key={req.id} 
                          className={`bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl transition-all duration-200 relative overflow-hidden group shadow-sm hover:shadow-md hover:border-blue-600/20 ${
                            isCollapsed ? 'p-3.5 cursor-pointer' : 'p-5 flex flex-col gap-4'
                          }`}
                          onClick={() => {
                            if (isCollapsed) {
                              setCollapsedRequests(prev => ({ ...prev, [req.id]: false }));
                            }
                          }}
                        >
                          {req.status === 'pendente' && <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600"></div>}
                          {req.status === 'devolucao_pendente' && <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500 animate-pulse"></div>}
                          
                          {/* Top row (Header of card) */}
                          <div 
                            className="flex justify-between items-center w-full gap-3 select-none"
                            onClick={(e) => {
                              if (!isCollapsed) {
                                e.stopPropagation();
                                setCollapsedRequests(prev => ({ ...prev, [req.id]: true }));
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border border-[var(--border-color)] shrink-0 ${
                                req.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-500' : 
                                req.status === 'devolucao_pendente' ? 'bg-blue-500/10 text-blue-500' :
                                req.status === 'devolvido' ? 'bg-zinc-500/10 text-zinc-400' :
                                req.status === 'negado' ? 'bg-red-500/10 text-red-500' : 'bg-blue-600/10 text-blue-600'
                              }`}>
                                <Package className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <h4 className="font-black text-[var(--text-primary)] text-xs uppercase tracking-tight leading-tight flex items-center gap-1.5">
                                  {req.materialName} <span className="text-blue-600 dark:text-blue-600 font-bold">({req.qty} un)</span>
                                </h4>
                                <p className="text-[9px] font-black text-blue-600 dark:text-blue-600/80 uppercase tracking-widest mt-0.5 opacity-80">
                                  {req.team || '---'} • {req.leaderName}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-xl shadow-sm ${
                                req.status === 'aprovado' ? 'bg-emerald-500 text-white' : 
                                req.status === 'devolucao_pendente' ? 'bg-blue-600 text-white' :
                                req.status === 'devolvido' ? 'bg-zinc-500 text-white' :
                                req.status === 'negado' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
                              }`}>
                                {req.status === 'devolucao_pendente' ? 'devolução pendente' : req.status}
                              </span>
                              {isCollapsed ? (
                                <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                              ) : (
                                <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {!isCollapsed && (
                            <div className="flex flex-col gap-3.5 pt-3.5 border-t border-[var(--border-color)] mt-1 animate-fadeIn">
                              {req.returnDate && (
                                <div className="bg-blue-600/5 px-3 py-2 rounded-xl border border-blue-600/10 text-left">
                                  <span className="text-[8px] font-black text-blue-600 dark:text-blue-600 uppercase tracking-wider block mb-0.5">Previsão de Devolução</span>
                                  <span className="text-xs font-black text-[var(--text-primary)]">{new Date(req.returnDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                </div>
                              )}

                              {req.reason && (
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                  <p className="text-[10px] font-bold text-zinc-500 italic leading-relaxed">"{req.reason}"</p>
                                </div>
                              )}

                              {req.receivedByLeader && (
                                <div className="bg-emerald-500/5 px-3 py-2 rounded-xl border border-emerald-500/10 text-left">
                                  <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">Status de Entrega</span>
                                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">✓ RECEBIDO EM {new Date(req.receivedAt).toLocaleString()}</span>
                                </div>
                              )}

                              {req.returnedAt && (
                                <div className="bg-blue-500/5 px-3 py-2 rounded-xl border border-blue-500/10 text-left">
                                  <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-0.5">Devolução Solicitada</span>
                                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">✓ DEVOLVIDO PELO LÍDER EM {new Date(req.returnedAt).toLocaleString()}</span>
                                </div>
                              )}

                              {req.returnApprovedAt && (
                                <div className="bg-emerald-500/5 px-3 py-2 rounded-xl border border-emerald-500/10 text-left">
                                  <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">Devolução Confirmada</span>
                                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">✓ CONFIRMADO EM {new Date(req.returnApprovedAt).toLocaleString()}</span>
                                </div>
                              )}

                              {req.signedBy && (
                                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                                    <ShieldCheck className="w-4 h-4 animate-pulse" />
                                  </div>
                                  <div className="text-left leading-none">
                                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">LOTE ASSINADO DIGITALMENTE</p>
                                    <p className="text-[8px] font-bold text-zinc-400 mt-1 uppercase">RESPONSÁVEL: {req.signedBy} • {new Date(req.signedAt).toLocaleString()}</p>
                                    <p className="text-[8px] font-mono text-zinc-500 mt-1 opacity-60">HASH: {req.signatureHash}</p>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-3.5 border-t border-[var(--border-color)]">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{new Date(req.createdAt).toLocaleString()}</p>
                                
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  {req.status === 'pendente' && (
                                    <>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDenyMaterialRequest(req.id); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/30 text-red-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-md shadow-red-500/10"
                                      >
                                        <XCircle className="w-3.5 h-3.5" /> Negar
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleApproveMaterialRequest(req); }}
                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Assinar & Liberar
                                      </button>
                                    </>
                                  )}

                                  {req.status === 'devolucao_pendente' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleConfirmReturnMaterialRequest(req); }}
                                      className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-md shadow-blue-500/20"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Devolução
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }) : (
                      <div className="col-span-full py-20 text-center border-2 border-dashed border-[var(--border-color)] rounded-xl grayscale opacity-30">
                        <Package className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                        <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] text-[10px]">Sem solicitações pendentes.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'demands' && (
              <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border-color)] pb-6">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Mapeamento Geográfico</h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-70">Concentração de Demandas e Pressão Política por Zona</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                   <div className="lg:col-span-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-10 shadow-[var(--shadow-sm)]">
                      <div className="mb-10">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Volume Operacional por Zona</h3>
                        <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-2 opacity-50">Análise quantitativa de solicitações em campo</p>
                      </div>
                      
                      <div className="h-[420px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={demandsSummary}>
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--text-secondary)' }}
                            />
                            <Tooltip 
                              cursor={{ fill: 'var(--bg-tertiary)' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-zinc-950 p-4 rounded-xl shadow-2xl border border-white/10 dark:bg-zinc-900">
                                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                      <p className="text-xl font-black text-white">{payload[0].value} <span className="text-[10px] opacity-50">Demandas</span></p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                              {demandsSummary.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--text-primary)' : '#fbbf24'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="lg:col-span-1 space-y-6">
                      <div className="bg-zinc-950 rounded-xl p-8 text-white text-center relative overflow-hidden dark:bg-zinc-900 border border-white/5">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
                        <Activity className="w-10 h-10 text-blue-600 mx-auto mb-5 animate-pulse" />
                        <h4 className="text-lg font-black uppercase tracking-tighter">Foco Estratégico</h4>
                        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] mt-3 leading-relaxed opacity-70">
                          A Zona com maior volume operacional requer revisão de logística imediata.
                        </p>
                      </div>

                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-8 shadow-[var(--shadow-sm)]">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)] mb-8 border-b border-[var(--border-color)] pb-3">Pressão por Unidade</h4>
                        <div className="space-y-6">
                          {demandsSummary.length > 0 ? demandsSummary.map(d => (
                            <div key={d.name} className="group/stat">
                              <div className="flex justify-between items-center mb-2.5">
                                <span className="text-[10px] font-black uppercase text-[var(--text-primary)] leading-none font-sans group-hover/stat:text-blue-600 transition-colors">{d.name}</span>
                                <span className="text-[9px] font-black text-[var(--text-secondary)] opacity-50 uppercase">{d.value} REQS</span>
                              </div>
                              <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden border border-[var(--border-color)] shadow-inner">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(d.value / Math.max(...demandsSummary.map(i => i.value))) * 100}%` }}
                                  className="h-full bg-[var(--text-primary)] group-hover/stat:bg-blue-600 transition-colors" 
                                />
                              </div>
                            </div>
                          )) : (
                            <p className="text-center py-10 text-[var(--text-secondary)] text-[10px] font-black uppercase opacity-40">Aguardando dados...</p>
                          )}
                        </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border-color)] pb-6">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Relatórios & BI</h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-70">Inteligência de Dados e Exportação em PDF ou Excel (.XLSX)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { id: 'teams', title: 'Equipes e Lideranças', desc: 'Dados de contato e performance regional.', icon: <Users className="w-6 h-6" /> },
                    { id: 'voters', title: 'Base de Eleitores', desc: 'Mapeamento de votos e sentimento.', icon: <Target className="w-6 h-6" /> },
                    { id: 'productivity', title: 'Produtividade & Ranking Lideranças', desc: 'Auditoria de conversão de votos e métricas de desempenho das lideranças.', icon: <TrendingUp className="w-6 h-6" /> },
                    { id: 'zone_performance', title: 'Desempenho por Zona e Seção', desc: 'Mapeamento de inteligência e densidade eleitoral por zona e seção.', icon: <Activity className="w-6 h-6" /> },
                    { id: 'agenda_coverage', title: 'Cobertura de Agenda & Vazios', desc: 'Cruzamento de visitas com eleitores para detectar vazios eleitorais.', icon: <Calendar className="w-6 h-6" /> },
                    { id: 'materials', title: 'Materiais e Estoque', desc: 'Controle de suprimentos e remessas.', icon: <Package className="w-6 h-6" /> },
                    { id: 'demands', title: 'Demandas e Mapa', desc: 'Urgências e necessidades mapeadas.', icon: <Activity className="w-6 h-6" /> }
                  ].map(r => (
                    <div key={r.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-blue-600/50 transition-all group shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-zinc-950 text-blue-600 rounded-xl shadow-xl group-hover:scale-110 transition-transform dark:bg-zinc-900 border border-white/5">
                          {r.icon}
                        </div>
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{r.title}</h3>
                      </div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed mb-6">{r.desc}</p>
                      <button 
                        onClick={() => {
                          setSelectedReportType(r.id);
                          setSelectedReportColumns(AVAILABLE_COLUMNS_BY_TYPE[r.id]?.map(c => c.dataKey) || []);
                          setIsReportModalOpen(true);
                        }}
                        className="w-full bg-zinc-950 text-white dark:bg-zinc-900 border border-white/10 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Configurar Filtros
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-10 shadow-sm mt-12">
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-8 flex items-center gap-3">
                    <History className="w-5 h-5 text-blue-600" /> Histórico de Relatórios Gerados
                  </h3>
                  <div className="space-y-4">
                    {reportsHistory.length > 0 ? reportsHistory.map((rep: any) => (
                      <div key={rep.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl hover:border-blue-600/30 transition-all shadow-inner group">
                        <div className="flex items-center gap-5">
                          <div className="p-3 bg-zinc-950 text-white rounded-xl border border-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <FileDown className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight">{rep.title}</h4>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Gerado em {new Date(rep.createdAt).toLocaleString()} por {rep.userName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                          {rep.pdfUrl && (
                             <a 
                               href={rep.pdfUrl} 
                               download={`${rep.title}.pdf`}
                               className="px-6 py-2.5 bg-zinc-950 text-white dark:bg-zinc-900 border border-white/10 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 shadow-xl"
                             >
                               Baixar PDF
                             </a>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center border-2 border-dashed border-[var(--border-color)] rounded-xl grayscale opacity-30">
                        <FileText className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                        <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] text-[10px]">Aguardando geração de dados estratégicos.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analise_eleitoral' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <EleitoralDashboard 
                  isCoordinator={true} 
                  canEditTreData={isGeral && !isRegional} 
                  campaignVoters={allVoters} 
                  coordinatorId={coordinatorId || user?.uid}
                />
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
              className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative mb-10 border border-zinc-200"
            >
              <button 
                onClick={() => {
                  setIsAiModalOpen(false);
                  setAiResult(null);
                  setChaosText('');
                }}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-xl text-zinc-500 active:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="bg-blue-600 p-6">
                <Brain className="w-10 h-10 text-zinc-950 mb-4" />
                <h2 className="text-xl font-black text-zinc-950 tracking-tighter uppercase leading-none">Análise de IA</h2>
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
                      className="w-full h-40 bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-bold text-xs text-zinc-800 focus:border-blue-600 outline-none transition-all placeholder:text-zinc-300 resize-none"
                    />
                    <div className="flex flex-col gap-3 font-sans">
                      <button 
                        onClick={handleProcessCaos}
                        disabled={isProcessing || !chaosText}
                        className="w-full bg-zinc-950 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4 cursor-pointer text-blue-600" />}
                        {isProcessing ? 'Processando Inteligência...' : 'Analisar com IA'}
                      </button>
                      
                      <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <button 
                          onClick={() => handleSaveNote('tactical')}
                          disabled={isProcessing || !chaosText}
                          className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" /> Postar no Fórum
                        </button>
                        <button 
                          onClick={() => handleSaveNote('private')}
                          disabled={isProcessing || !chaosText}
                          className="flex-1 bg-zinc-100 text-zinc-900 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Salvar Privado
                        </button>
                      </div>
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
                              <div className="w-1 h-1 rounded-xl bg-blue-500 mt-1.5 flex-shrink-0"></div>
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
                              <div className="w-1 h-1 rounded-xl bg-green-500 mt-1.5 flex-shrink-0"></div>
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
                              <div className="w-1 h-1 rounded-xl bg-red-600 mt-1.5 flex-shrink-0"></div>
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
                    <div className="flex flex-col sm:flex-row gap-3 mb-2">
                       <button 
                        onClick={() => {
                          const summary = Array.isArray(aiResult.summary) ? aiResult.summary.join('. ') : aiResult.summary;
                          setChaosText(`${aiResult.title}: ${summary}`);
                          handleSaveNote('tactical');
                        }}
                        className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" /> Postar no Fórum
                      </button>
                      <button 
                        onClick={() => {
                          const summary = Array.isArray(aiResult.summary) ? aiResult.summary.join('. ') : aiResult.summary;
                          setChaosText(`${aiResult.title}: ${summary}`);
                          handleSaveNote('private');
                        }}
                        className="flex-1 bg-zinc-950 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                      >
                        <Lock className="w-4 h-4" /> Salvar Privado
                      </button>
                    </div>
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
                className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative border border-zinc-200"
              >
                <button 
                  onClick={() => setIsUrgencyModalOpen(false)}
                  className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-xl text-zinc-500 z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className={`p-6 ${selectedUrgency.type === 'combustivel' ? 'bg-blue-600' : selectedUrgency.type === 'demanda' ? 'bg-blue-600' : 'bg-red-600'}`}>
                  <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">{selectedUrgency.title}</h2>
                  <p className="text-white/70 text-[9px] font-black mt-2 uppercase tracking-widest leading-none">{selectedUrgency.leaderName} • {selectedUrgency.team}</p>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block mb-2 leading-none">Relato de Campo</label>
                    <p className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-700 leading-relaxed">
                      "{selectedUrgency.description}"
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block leading-none">Feedback Estratégico</label>
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
                        await supabaseService.updateDocument('urgencies', selectedUrgency.id, {
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
                        await supabaseService.updateDocument('urgencies', selectedUrgency.id, {
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

      {/* MODAL: ASSINATURA DIGITAL DE MATERIAL */}
      <AnimatePresence>
        {isSignatureModalOpen && signingRequest && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative text-left"
            >
              <button 
                onClick={() => setIsSignatureModalOpen(false)}
                className="absolute top-4 right-4 bg-zinc-800 p-2 rounded-xl text-zinc-400 hover:text-white transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/10">
                    <ShieldCheck className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none font-sans">Autenticação de Assinatura Digital</h2>
                    <p className="text-zinc-400 text-[9px] font-black mt-2 uppercase tracking-widest leading-none">CONTROLE DE ARSENAL DE MATERIAIS</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleConfirmSignature} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between border-b border-zinc-800/50 pb-2">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Material Solicitado:</span>
                      <span className="text-xs font-black text-white uppercase">{signingRequest.materialName}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/50 pb-2">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Quantidade:</span>
                      <span className="text-xs font-black text-blue-600">{signingRequest.qty.toLocaleString('pt-BR')} unidades</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/50 pb-2">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Líder Regional:</span>
                      <span className="text-xs font-black text-white uppercase">{signingRequest.leaderName}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/50 pb-2">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Zona/Equipe:</span>
                      <span className="text-xs font-black text-white uppercase">{signingRequest.team || '---'}</span>
                    </div>
                    {signingRequest.returnDate && (
                      <div className="flex justify-between border-b border-zinc-800/50 pb-2 bg-blue-600/5 px-2 py-1 rounded-xl border border-blue-600/10">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider">Previsão de Devolução:</span>
                        <span className="text-xs font-black text-blue-600">{new Date(signingRequest.returnDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    {signingRequest.reason && (
                      <div className="pt-1 text-left">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Motivo/Observação:</span>
                        <p className="text-[10px] text-zinc-400 italic mt-1 bg-zinc-950 p-3 rounded-xl border border-zinc-800/30">"{signingRequest.reason}"</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 block leading-none">
                      Assinatura de Punho Digital
                    </label>
                    <input 
                      type="text" 
                      required
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Digite seu nome completo como assinatura..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 px-4 font-bold text-sm text-white outline-none focus:border-blue-600 transition-colors shadow-inner"
                    />
                    <p className="text-[8px] text-zinc-500 leading-normal ml-1">
                      Ao assinar digitando seu nome, você certifica eletronicamente a liberação deste lote, registrando o carimbo de data/hora e hash de integridade exclusivo do sistema.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsSignatureModalOpen(false)}
                    className="bg-zinc-800 text-zinc-300 py-4.5 rounded-xl font-black text-[11px] uppercase tracking-widest border border-zinc-700 hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-emerald-500 text-zinc-950 py-4.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-500/10 hover:bg-emerald-400 transition-all active:scale-95"
                  >
                    Confirmar & Assinar
                  </button>
                </div>
              </form>
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
              className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setIsTeamModalOpen(false);
                  setTeamCreationStep('form');
                }}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-xl text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="bg-zinc-950 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">
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
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-blue-600 transition-all disabled:opacity-50 placeholder:text-zinc-300"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 text-left block">Nome do Líder da Equipe *</label>
                    <input 
                      required
                      type="text" 
                      value={newTeam.leader}
                      onChange={(e) => setNewTeam({...newTeam, leader: e.target.value})}
                      placeholder="Nome do Líder de Equipe"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-blue-600 transition-all placeholder:text-zinc-300"
                    />
                  </div>

                  {/* Subordinação da Equipe */}
                  {isGeral ? (
                    <div className="space-y-1.5 text-left">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Coordenador Regional Subordinado (Opcional)</label>
                      <select
                        value={newTeam.regionalCoordId || ''}
                        onChange={(e) => {
                          const selected = regionalCoordinators.find(r => r.id === e.target.value || r.email === e.target.value);
                          setNewTeam({
                            ...newTeam,
                            regionalCoordId: e.target.value,
                            region: selected?.region || newTeam.region || ''
                          });
                        }}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 font-bold text-[11px] text-zinc-900 outline-none focus:border-blue-600 transition-all"
                      >
                        <option value="">Direto com a Coordenação Geral</option>
                        {regionalCoordinators.map(r => (
                          <option key={r.id} value={r.id || r.email}>
                            {r.name} — {r.region || 'Sem Região'}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-left">
                      <p className="text-[9px] font-black text-blue-700 uppercase tracking-wider">
                        Subordinação: Sua Coordenação Regional ({userRegion || profileData?.region || 'Regional'})
                      </p>
                    </div>
                  )}

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
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-blue-600 transition-all disabled:opacity-50 placeholder:text-zinc-300"
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
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-blue-600 transition-all placeholder:text-zinc-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-600 block">Município *</label>
                      <input 
                        type="text" 
                        value={newTeam.municipio}
                        onChange={(e) => setNewTeam({...newTeam, municipio: e.target.value})}
                        placeholder="Ex: Boa Vista"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 font-medium text-xs text-zinc-900 outline-none focus:border-blue-600 transition-all placeholder:italic"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-600 block">Bairro Principal / Atuação</label>
                      <input 
                        type="text" 
                        value={newTeam.bairro}
                        onChange={(e) => setNewTeam({...newTeam, bairro: e.target.value})}
                        placeholder="Ex: Centro / Caçari"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 font-medium text-xs text-zinc-900 outline-none focus:border-blue-600 transition-all placeholder:italic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-600 block">Base / Polo</label>
                      <input 
                        required
                        type="text" 
                        value={newTeam.location}
                        onChange={(e) => setNewTeam({...newTeam, location: e.target.value})}
                        placeholder="Ex: Boa Vista - Polo Sul"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 font-medium text-xs text-zinc-900 outline-none focus:border-blue-600 transition-all placeholder:italic"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-600 block">Endereço Físico</label>
                      <input 
                        required
                        type="text" 
                        value={newTeam.leaderAddress}
                        onChange={(e) => setNewTeam({...newTeam, leaderAddress: e.target.value})}
                        placeholder="Logradouro completo"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 font-medium text-xs text-zinc-900 outline-none focus:border-blue-600 transition-all placeholder:italic"
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
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-blue-600 transition-all h-24 placeholder:text-zinc-300 resize-none"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full bg-zinc-950 text-blue-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-zinc-950/10 hover:bg-zinc-900 transition-all active:scale-[0.98] mt-2"
                  >
                    {isEditMode ? 'SALVAR ALTERAÇÕES' : 'EFETIVAR CADASTRO'}
                  </button>
                </form>
              ) : (
                <div className="p-8 space-y-6 text-center">
                  <div className="w-16 h-16 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-2 border border-green-100">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Credenciais Geradas</h3>
                  <p className="text-zinc-500 text-xs font-bold leading-relaxed px-4">
                    Transmita o link de segurança abaixo para <span className="text-zinc-950">{newTeam.leader}</span>. Acesso imediato e restrito via Token Único.
                  </p>
                  
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 break-all text-[9px] font-mono font-black text-blue-600 select-all">
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
            className="fixed inset-0 z-[250] bg-zinc-950/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-zinc-900 uppercase tracking-tight">
                      {editingAgenda ? 'Editar Evento' : 'Novo Evento Estratégico'}
                    </h2>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAgendaCreateModalOpen(false)}
                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateAgenda} className="p-5 space-y-4 text-left">
                {/* Localidade com GPS Embutido */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1 block">Localidade / Endereço *</label>
                  <div className="relative flex items-center">
                    <input 
                      required
                      type="text" 
                      value={agendaForm.municipio}
                      onChange={(e) => setAgendaForm({...agendaForm, municipio: e.target.value})}
                      placeholder="Ex: Ponto de Encontro..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 pl-3 pr-12 text-sm font-medium text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button
                      type="button"
                      disabled={isLocatingAgendaGPS}
                      onClick={handleGetAgendaGPS}
                      title="Usar GPS Atual"
                      className="absolute right-2 p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isLocatingAgendaGPS ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                {/* Data e Hora (Compactos) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1 block">Data *</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input 
                        required
                        type="date" 
                        value={agendaForm.data}
                        onChange={(e) => setAgendaForm({...agendaForm, data: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 pl-9 pr-3 text-sm font-medium text-zinc-900 outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1 block">Horário *</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input 
                        required
                        type="time" 
                        value={agendaForm.hora_inicio}
                        onChange={(e) => setAgendaForm({...agendaForm, hora_inicio: e.target.value, hora_fim: ''})} 
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 pl-9 pr-3 text-sm font-medium text-zinc-900 outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1 block">Objetivo (Opcional)</label>
                   <textarea 
                     value={agendaForm.motivo}
                     onChange={(e) => setAgendaForm({...agendaForm, motivo: e.target.value})}
                     placeholder="Breve descrição da atividade..."
                     className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm font-medium text-zinc-900 outline-none focus:border-blue-500 transition-all h-16 resize-none"
                   />
                </div>

                {/* VINCULAÇÃO DE MATERIAIS - EXPANSÍVEL */}
                <style>{`details > summary { list-style: none; } details > summary::-webkit-details-marker { display: none; }`}</style>
                <details className="group border border-zinc-200 rounded-xl bg-zinc-50 overflow-hidden">
                  <summary className="flex items-center justify-between p-3 cursor-pointer text-[10px] font-black text-blue-600 uppercase tracking-wider outline-none">
                    <span className="flex items-center gap-2"><Package className="w-3.5 h-3.5" /> Adicionar Materiais</span>
                    <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="p-3 pt-0 space-y-2 border-t border-zinc-200/50 mt-1">
                    {materials && materials.length > 0 ? (
                      <>
                        <select
                          onChange={(e) => {
                            const selectedName = e.target.value;
                            if (!selectedName) return;
                            const current = agendaForm.allocatedMaterials;
                            const updated = current ? `${current}, 100x ${selectedName}` : `100x ${selectedName}`;
                            setAgendaForm({ ...agendaForm, allocatedMaterials: updated });
                          }}
                          className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs font-medium text-zinc-900 outline-none focus:border-blue-500"
                        >
                          <option value="">Selecione do Estoque...</option>
                          {materials.map(m => (
                            <option key={m.id} value={m.name}>{m.name} ({m.qty})</option>
                          ))}
                        </select>
                        <input 
                          type="text" 
                          value={agendaForm.allocatedMaterials}
                          onChange={(e) => setAgendaForm({ ...agendaForm, allocatedMaterials: e.target.value })}
                          placeholder="Ou digite manualmente..."
                          className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs font-medium text-zinc-900 outline-none focus:border-blue-500"
                        />
                      </>
                    ) : (
                      <input 
                        type="text" 
                        value={agendaForm.allocatedMaterials}
                        onChange={(e) => setAgendaForm({ ...agendaForm, allocatedMaterials: e.target.value })}
                        placeholder="Ex: 500x Santinhos..."
                        className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs font-medium text-zinc-900 outline-none focus:border-blue-500"
                      />
                    )}
                  </div>
                </details>
                
                <div className="pt-3">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_4px_15px_rgba(37,99,235,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {editingAgenda ? 'Salvar Edição' : 'Agendar Evento'}
                  </button>
                </div>
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
              className="bg-white w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsBriefingModalOpen(false)}
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-xl text-zinc-500 hover:bg-zinc-200"
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
                  className="flex-1 bg-zinc-950 text-white py-5 rounded-xl font-black text-lg shadow-xl"
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
              className="bg-white w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => {
                  setIsTeamManagementOpen(false);
                  setSelectedManagingTeam(null);
                  setManagingTeamVoters([]);
                }} 
                className="absolute top-8 right-8 bg-zinc-100 p-3 rounded-xl text-zinc-500 hover:bg-zinc-200 transition-all z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-10 border-b-8 border-blue-600 text-left">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="bg-blue-600 text-white w-20 h-20 rounded-xl flex items-center justify-center font-black text-3xl shadow-lg shadow-blue-600/20">
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
                     <div className="bg-zinc-50 p-6 rounded-xl border-2 border-zinc-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Líder e Contato</p>
                        <div className="flex items-center gap-4 mb-6">
                           <div className="bg-zinc-200 w-12 h-12 rounded-xl flex items-center justify-center font-black text-zinc-600">
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
                        <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
                           <p className="text-2xl font-black text-green-700 leading-none">{managingTeamVoters.length}</p>
                           <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mt-2">Membros</p>
                        </div>
                        <div className="bg-zinc-900 p-6 rounded-xl text-center">
                           <p className="text-2xl font-black text-blue-600 leading-none">ATIVO</p>
                           <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-2">Status</p>
                        </div>
                     </div>
                  </div>

                  <div className="lg:col-span-2 text-left font-sans">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tighter flex items-center gap-3">
                           Membros Cadastrados <span className="bg-zinc-100 text-zinc-400 px-3 py-1 rounded-xl text-xs">{managingTeamVoters.length}</span>
                        </h3>
                     </div>

                     <div className="space-y-3">
                        {managingTeamVoters.length > 0 ? (
                          managingTeamVoters.sort((a,b) => a.name.localeCompare(b.name)).map((vx) => (
                           <div key={vx.id} className="group bg-white p-5 rounded-xl border-2 border-zinc-100 hover:border-blue-600 transition-all flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-4">
                                 <div className="bg-zinc-100 group-hover:bg-blue-600 group-hover:text-white transition-colors w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg">
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
                                        observations: vx.observations || '',
                                        referredBy: vx.referredBy || '',
                                        tags: vx.tags || [],
                                        loyaltyScore: vx.loyaltyScore || 3,
                                        familyCommunity: vx.familyCommunity || '',
                                        associatedCandidates: vx.associatedCandidates || '',
                                        isArticulator: vx.isArticulator || false,
                                        articulatorId: vx.articulatorId || '',
                                        voted: vx.voted || false,
                                        isIndigenous: vx.isIndigenous || false,
                                        communityName: vx.communityName || '',
                                        tuxauaName: vx.tuxauaName || '',
                                        hasDocPhoto: vx.hasDocPhoto || false,
                                        sentiment: vx.sentiment || 'neutral',
                                         cpf: vx.cpf || '',
                                         rg: vx.rg || '',
                                         titulo: vx.titulo || '',
                                         zona: vx.zona || '',
                                         secao: vx.secao || '',
                                         localVotacao: vx.localVotacao || ''
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
                                            await supabaseService.deleteDocument('voters', vx.id);
                                             await fetchServerCounts();
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
                           <div className="py-20 text-center bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200">
                              <p className="font-black text-zinc-300 uppercase tracking-widest">Nenhum eleitor registrado por este líder ainda.</p>
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
              className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => {
                   setIsVoterEditModalOpen(false);
                   setSelectedVoter(null);
                }} 
                className="absolute top-5 right-5 bg-zinc-100 p-2 rounded-xl text-zinc-500 hover:bg-zinc-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="bg-zinc-950 p-6 border-b-4 border-blue-600 text-left">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">CPF</label>
                    <input type="text" value={voterEditForm.cpf || ''} onChange={e => setVoterEditForm({...voterEditForm, cpf: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm" placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">RG</label>
                    <input type="text" value={voterEditForm.rg || ''} onChange={e => setVoterEditForm({...voterEditForm, rg: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm" placeholder="Alistamento RG..." />
                  </div>
                </div>

                <TreLocationFields
                  coordinatorId={coordinatorId || user?.uid}
                  titulo={voterEditForm.titulo || ''}
                  onTituloChange={val => setVoterEditForm(prev => ({ ...prev, titulo: val }))}
                  zona={voterEditForm.zona || ''}
                  secao={voterEditForm.secao || ''}
                  localVotacao={voterEditForm.localVotacao || ''}
                  onChange={updates => setVoterEditForm(prev => ({ ...prev, ...updates }))}
                  inputClassName="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm text-zinc-900 outline-none focus:border-blue-600 transition-all"
                  labelClassName="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 block"
                />
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Observações Estratégicas</label>
                  <textarea value={voterEditForm.observations} onChange={e => setVoterEditForm({...voterEditForm, observations: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm h-24" placeholder="Ex: Prioritário, transporte necessário..."></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Fidelidade Política</label>
                    <div className="flex gap-2 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setVoterEditForm({...voterEditForm, loyaltyScore: star})}
                          className={`p-1 transition-all ${star <= voterEditForm.loyaltyScore ? 'text-blue-600' : 'text-zinc-200'}`}
                        >
                          <Zap className={`w-5 h-5 ${star <= voterEditForm.loyaltyScore ? 'fill-blue-600' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Sentiment (Opinião)</label>
                    <div className="flex gap-1 bg-zinc-50 p-1.5 rounded-xl border border-zinc-100">
                      {[
                        { id: 'support', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-500' },
                        { id: 'neutral', icon: <Activity className="w-4 h-4" />, color: 'text-zinc-400' },
                        { id: 'opposed', icon: <XCircle className="w-4 h-4" />, color: 'text-red-500' }
                      ].map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setVoterEditForm({...voterEditForm, sentiment: s.id as any})}
                          className={`flex-1 flex items-center justify-center py-2 rounded-xl transition-all ${voterEditForm.sentiment === s.id ? 'bg-zinc-950 text-white shadow-md' : 'text-zinc-300 hover:bg-zinc-100'}`}
                        >
                          <div className={voterEditForm.sentiment === s.id ? 'text-white' : s.color}>{s.icon}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Logística Dia D (Votou?)</label>
                    <button
                      type="button"
                      onClick={() => setVoterEditForm({...voterEditForm, voted: !voterEditForm.voted})}
                      className={`w-full p-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                        voterEditForm.voted 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' 
                        : 'bg-zinc-50 text-zinc-400 border-zinc-100 hover:bg-zinc-100'
                      }`}
                    >
                      {voterEditForm.voted ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      {voterEditForm.voted ? 'JÁ VOTOU' : 'NÃO VOTOU'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Documentação (Title/RG)</label>
                    <button
                      type="button"
                      onClick={() => setVoterEditForm({...voterEditForm, hasDocPhoto: !voterEditForm.hasDocPhoto})}
                      className={`w-full p-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                        voterEditForm.hasDocPhoto 
                        ? 'bg-zinc-900 text-white border-zinc-900' 
                        : 'bg-zinc-50 text-zinc-400 border-zinc-100 hover:bg-zinc-100'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      {voterEditForm.hasDocPhoto ? 'DOC. OK (FOTO)' : 'FALTA DOC.'}
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-3">
                   <div className="flex items-center justify-between">
                     <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Comunidades Tradicionais (RR)</label>
                     <button
                        type="button"
                        onClick={() => setVoterEditForm({...voterEditForm, isIndigenous: !voterEditForm.isIndigenous})}
                        className={`text-[8px] font-black px-2 py-1 rounded-xl uppercase tracking-tighter ${voterEditForm.isIndigenous ? 'bg-zinc-950 text-blue-600' : 'bg-zinc-200 text-zinc-400'}`}
                      >
                       {voterEditForm.isIndigenous ? 'ATIVADO' : 'DESATIVADO'}
                     </button>
                   </div>
                   
                   {voterEditForm.isIndigenous && (
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Comunidade</label>
                         <input type="text" value={voterEditForm.communityName} onChange={e => setVoterEditForm({...voterEditForm, communityName: e.target.value})} className="w-full bg-white border border-zinc-200 rounded-xl p-2 font-bold text-xs" placeholder="Nome da Com..." />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Liderança / Tuxaua</label>
                         <input type="text" value={voterEditForm.tuxauaName} onChange={e => setVoterEditForm({...voterEditForm, tuxauaName: e.target.value})} className="w-full bg-white border border-zinc-200 rounded-xl p-2 font-bold text-xs" placeholder="Nome do Tuxaua..." />
                       </div>
                     </div>
                   )}
                 </div>

                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Família / Comunidade / Grupamento</label>
                   <input type="text" value={voterEditForm.familyCommunity} onChange={e => setVoterEditForm({...voterEditForm, familyCommunity: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm" placeholder="Ex: Família Silva, Com. Ribeirinha, Igreja..." />
                 </div>

                 {!voterEditForm.isArticulator && (
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Articulador Responsável</label>
                    <select 
                      value={voterEditForm.articulatorId} 
                      onChange={e => setVoterEditForm({...voterEditForm, articulatorId: e.target.value})} 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm appearance-none outline-none"
                    >
                      <option value="">NENHUM ARTICULADOR</option>
                      {(allVoters.length > 0 ? allVoters.filter(v => v.isArticulator && v.id !== selectedVoter?.id) : articulators.filter(v => v.id !== selectedVoter?.id)).map(art => (
                        <option key={art.id} value={art.id}>{art.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Cruzamento (Dobradinha / Outros Apoios)</label>
                  <input type="text" value={voterEditForm.associatedCandidates} onChange={e => setVoterEditForm({...voterEditForm, associatedCandidates: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm" placeholder="Ex: Federal X, Estadual Y..." />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Indicado por (Selecione um eleitor cadastrado)</label>
                  <select 
                    value={voterEditForm.referredBy} 
                    onChange={e => setVoterEditForm({...voterEditForm, referredBy: e.target.value})} 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm outline-none appearance-none"
                  >
                    <option value="">NENHUM INDICIADOR SELECIONADO</option>
                    {[...sourceVoters]
                      .filter(v => v.id !== selectedVoter?.id)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(v => (
                        <option key={v.id} value={v.name}>{v.name} {v.phone ? `(${v.phone})` : ''}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Tags de Segmentação</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {voterEditForm.tags?.map(tag => (
                      <span key={tag} className="bg-blue-600/10 text-blue-600 px-3 py-1 rounded-xl text-[9px] font-black uppercase flex items-center gap-2">
                        {tag}
                        <button type="button" onClick={() => setVoterEditForm({...voterEditForm, tags: voterEditForm.tags.filter(t => t !== tag)})}>
                          <X className="w-2 h-2" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={currentEditTag} 
                      onChange={e => setCurrentEditTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (currentEditTag.trim() && !voterEditForm.tags?.some(t => t.trim().toUpperCase() === currentEditTag.trim().toUpperCase())) {
                            setVoterEditForm({...voterEditForm, tags: [...(voterEditForm.tags || []), currentEditTag.trim()]});
                            setCurrentEditTag('');
                          }
                        }
                      }}
                      className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm" 
                      placeholder="Adicionar tag (Enter)..." 
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (currentEditTag.trim() && !voterEditForm.tags?.some(t => t.trim().toUpperCase() === currentEditTag.trim().toUpperCase())) {
                          setVoterEditForm({...voterEditForm, tags: [...(voterEditForm.tags || []), currentEditTag.trim()]});
                          setCurrentEditTag('');
                        }
                      }}
                      className="bg-zinc-950 text-white px-4 rounded-xl"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {availableTags.length > 0 && (
                    <div className="mt-2.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block mb-1">Tags Disponíveis no Sistema (Clique para Adicionar)</label>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-zinc-50 border border-zinc-100 rounded-xl">
                        {availableTags.map(tag => {
                          const isSelected = voterEditForm.tags?.some(t => t.trim().toUpperCase() === tag.toUpperCase());
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                const currentTags = voterEditForm.tags || [];
                                if (!isSelected) {
                                  setVoterEditForm({
                                    ...voterEditForm,
                                    tags: [...currentTags, tag]
                                  });
                                } else {
                                  setVoterEditForm({
                                    ...voterEditForm,
                                    tags: currentTags.filter(t => t.trim().toUpperCase() !== tag.toUpperCase())
                                  });
                                }
                              }}
                              className={`px-2 py-1 text-[9px] font-black uppercase rounded-xl border transition-all ${
                                isSelected
                                  ? 'bg-blue-600/20 text-blue-600 border-blue-600/40 hover:bg-blue-600/10'
                                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-blue-600/50 hover:text-zinc-850'
                              }`}
                            >
                              {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
            className="fixed inset-0 z-[160] bg-zinc-950/90 backdrop-blur-md p-4 overflow-y-auto flex justify-center items-start md:items-center py-6 md:py-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative my-auto"
            >
              <button 
                type="button"
                onClick={() => setIsProfileModalOpen(false)} 
                className="absolute top-5 right-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 p-2 rounded-xl z-50 transition-all flex items-center justify-center shadow-md cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="bg-zinc-950 p-6 border-b-4 border-blue-600 text-left">
                <div className="flex items-center gap-4">
                   <div className="relative group">
                      <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center border-2 border-zinc-700 overflow-hidden">
                         {profileData?.photoUrl ? (
                           <img src={profileData.photoUrl} alt="Perfil" className="w-full h-full object-cover" />
                         ) : (
                           <User className="w-8 h-8 text-zinc-600" />
                         )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 bg-blue-600 p-1.5 rounded-xl text-white shadow-lg hover:scale-110 transition-all cursor-pointer">
                         <Camera className="w-3.5 h-3.5" />
                         <input 
                           type="file" 
                           accept="image/*" 
                           className="hidden" 
                           onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
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
                                   const base64 = canvas.toDataURL('image/jpeg', 0.7);
                                   setProfileData((prev: any) => ({ ...prev, photoUrl: base64 }));
                                 };
                                 img.src = reader.result as string;
                               };
                               reader.readAsDataURL(file);
                             }
                           }}
                         />
                      </label>
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">
                        Configurações do Sistema
                      </h2>
                      <p className="text-blue-600 text-[8px] font-black mt-2 uppercase tracking-widest">
                        Acesso de {(profileData?.role === 'coordenador_regional' || isRegional || (user?.email && user.email.toLowerCase().includes('antonio')) || (profileData?.email && profileData.email.toLowerCase().includes('antonio')) || (profileData?.name && profileData.name.toLowerCase().includes('antonio'))) ? 'Coordenação Regional' : (profileData?.role === 'coordenador_geral' || isGeral) ? 'Coordenação Geral' : isLeader ? 'Liderança de Equipe' : 'Coordenação'}
                      </p>
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
                    photoUrl: profileData?.photoUrl || '',
                    bio: formData.get('bio') as string,
                    updatedAt: Date.now()
                  };
                  try {
                    await supabaseService.setDocument('users', user?.uid || '', updates, true);
                    setIsProfileModalOpen(false);
                    alert("Perfil atualizado com sucesso!");
                  } catch (err: any) {
                    alert("Erro ao atualizar perfil: " + err.message);
                  }
                }} 
                className="p-6 space-y-3.5 text-left font-sans"
              >
                {/* Módulos do Sistema & Licença */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-0.5">Módulos da Campanha & Licença</p>
                  
                  {isGeral && (
                    <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                            Plano Atual da Campanha
                          </span>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          selectedPlanStatus === 'active' 
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                            : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                        }`}>
                          {selectedPlanStatus === 'active' ? '● Licença Ativa' : '⚠️ Suspenso / Sem Licença'}
                        </span>
                      </div>

                      <div className="flex items-end justify-between pt-1">
                        <div>
                          <p className="text-sm font-black text-amber-500 uppercase tracking-tight">
                            {PLAN_CONFIGS[selectedPlan]?.name || 'Plano Grátis (Degustação)'}
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                            Limite da Licença: <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
                              {PLAN_CONFIGS[selectedPlan]?.maxVoters === Infinity ? 'Ilimitado' : `${PLAN_CONFIGS[selectedPlan]?.maxVoters?.toLocaleString('pt-BR')} Eleitores`}
                            </strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileModalOpen(false);
                            window.dispatchEvent(new CustomEvent('open_sales_landing'));
                            setTimeout(() => {
                              const el = document.getElementById('planos');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }, 300);
                          }}
                          className="text-[10px] bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black px-2.5 py-1.5 rounded uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                          Upgrade de Plano
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setIsManualOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 font-bold rounded-xl transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center shrink-0 font-black shadow-sm">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-black uppercase tracking-tight text-xs text-zinc-900 dark:text-zinc-100">Manual do Sistema & Tutoriais</p>
                        <p className="text-[10px] text-zinc-500 font-medium">Guia passo a passo com orientações de uso</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-600 text-white font-black px-2.5 py-1 rounded uppercase tracking-wider group-hover:scale-105 transition-transform shadow-sm">Abrir Manual</span>
                  </button>

                  {/* Suporte Técnico & Sugestões de Melhorias */}
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black shadow-sm">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-tight text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            Suporte & Sugestões de Melhorias
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                            E-mail oficial para dúvidas, assistência e envio de ideias
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-2.5 rounded border border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 mt-1">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 break-all select-all">
                          inicialinovacoestecnologicas@gmail.com
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("inicialinovacoestecnologicas@gmail.com");
                            alert("E-mail de suporte copiado para a área de transferência!");
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 rounded transition-all flex items-center gap-1 cursor-pointer"
                          title="Copiar E-mail"
                        >
                          <Copy className="w-3 h-3" /> Copiar
                        </button>
                        <a
                          href="mailto:inicialinovacoestecnologicas@gmail.com?subject=Suporte%20e%20Sugest%C3%B5es%20-%20Nexus%20Pol%C3%ADtica"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Mail className="w-3 h-3" /> Enviar E-mail
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cole a URL ou use o botão de upload acima</label>
                  <input 
                    value={profileData?.photoUrl || ''} 
                    name="photoUrl" 
                    onChange={(e) => setProfileData((prev: any) => ({ ...prev, photoUrl: e.target.value }))}
                    type="text" 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 font-bold text-sm" 
                    placeholder="https://..." 
                  />
                </div>
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

                {isAdmin && (
                  <div className="pt-6 mt-6 border-t border-zinc-100">
                    <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-3 text-center">Área Crítica - Reset de Fábrica</p>
                    <button 
                      type="button"
                      onClick={handleResetSystem}
                      className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Zerar Tudo do Zero
                    </button>
                    <p className="text-[7px] text-zinc-400 text-center mt-2 font-bold leading-tight">Remove 100% dos dados fictícios e registros de teste.</p>
                  </div>
                )}
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
              className="bg-white w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAgendaDetailModalOpen(false)}
                className="absolute top-8 right-8 bg-zinc-100 p-2 rounded-full text-zinc-500 hover:bg-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-12 text-left">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white text-center">
                      <span className="text-[10px] font-black uppercase leading-none">{new Date(selectedAgenda.data).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                      <span className="text-3xl font-black">{new Date(selectedAgenda.data).getDate()}</span>
                   </div>
                   <div>
                      <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                        Compromisso Oficial
                      </h2>
                      <p className="text-blue-600 text-xs font-black mt-2 uppercase tracking-widest">{selectedAgenda.municipio}</p>
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
                      <p className="text-lg font-black text-zinc-900">{selectedAgenda.team || '---'} • {selectedAgenda.sugeridoPor}</p>
                   </div>
                </div>

                <div className="bg-zinc-50 p-8 rounded-xl border-2 border-zinc-100">
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Objetivo Estratégico</p>
                   <p className="text-xl font-bold text-zinc-700 leading-relaxed">
                      "{selectedAgenda.motivo || 'Nenhum motivo detalhado informado.'}"
                   </p>
                </div>

                <div className="flex items-center gap-4 pt-4">
                   <div className="p-4 bg-blue-50 text-blue-600 rounded-xl flex items-center gap-3 flex-1 border border-blue-100">
                      <Users className="w-6 h-6" />
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-tighter">Mobilização</p>
                         <p className="text-sm font-bold">Equipe e Membros</p>
                      </div>
                   </div>
                   <div className="p-4 bg-green-50 text-green-600 rounded-xl flex items-center gap-3 flex-1 border border-green-100">
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
              className="bg-white w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="absolute top-8 right-8 bg-zinc-100 p-2 rounded-full text-zinc-500 hover:bg-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-10 border-b-4 border-blue-600 text-left">
                <h2 className="text-lg font-bold text-white">
                  Histórico Estratégico
                </h2>
                <p className="text-blue-600 text-xs font-black mt-2 uppercase tracking-widest">Equipe: {selectedHistoryTeam.name}</p>
              </div>

              <div className="p-10 space-y-6 text-left max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 text-center">
                   <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Contatos</p>
                      <p className="text-xl font-black">{selectedHistoryTeam.contacts || 0}</p>
                   </div>
                   <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest text-center">Ponto</p>
                      <p className="text-sm font-black text-green-600">OK (98%)</p>
                   </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReportModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsReportModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-xl text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="bg-zinc-950 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Customizar Relatório</h2>
                <p className="text-blue-600 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Filtragem e Recorte de Dados Estratégicos</p>
              </div>

              <div className="p-6 space-y-4 text-left border-b border-zinc-100">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nível de Detalhamento</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setReportDetailLevel('summary');
                        setSelectedReportColumns(AVAILABLE_COLUMNS_BY_TYPE[selectedReportType]?.map(c => c.dataKey) || []);
                      }}
                      className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 border ${
                        reportDetailLevel === 'summary' 
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-lg' 
                          : 'bg-zinc-50 text-zinc-400 border-zinc-100 hover:bg-zinc-100'
                      }`}
                    >
                      <LayoutDashboard className="w-3 h-3" />
                      Resumo (Geral)
                    </button>
                    <button 
                      onClick={() => {
                        setReportDetailLevel('detailed');
                        if (selectedReportType === 'teams' || selectedReportType === 'partners') {
                          setSelectedReportColumns(AVAILABLE_COLUMNS_BY_TYPE['voters']?.map(c => c.dataKey) || []);
                        }
                      }}
                      className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 border ${
                        reportDetailLevel === 'detailed' 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20 active:scale-95' 
                          : 'bg-zinc-50 text-zinc-400 border-zinc-100 hover:bg-zinc-100'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      Detalhamento (Lista)
                    </button>
                  </div>
                  <p className="text-[9px] text-zinc-400 italic mt-1 ml-1 font-medium">
                    {reportDetailLevel === 'summary' 
                      ? '* Gera uma visão consolidada com indicadores gerais.' 
                      : '* Gera uma listagem completa item por item (Ex: Cada eleitor individual).'
                    }
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4 text-left">
                {selectedReportType === 'teams' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Status da Equipe</label>
                      <select 
                        value={reportFilters.status || ''} 
                        onChange={e => setReportFilters({...reportFilters, status: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-blue-600 transition-all cursor-pointer"
                      >
                        <option value="">TODOS OS STATUS</option>
                        <option value="OK">OPERANDO (OK)</option>
                        <option value="ATENÇÃO">EM ATENÇÃO</option>
                        <option value="CRÍTICO">CRÍTICO</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedReportType === 'voters' && (
                  <>
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Equipe/Zona</label>
                       <select 
                         value={reportFilters.team || ''} 
                         onChange={e => setReportFilters({...reportFilters, team: e.target.value})}
                         className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-blue-600 transition-all"
                       >
                         <option value="">TODAS AS EQUIPES</option>
                         {teams.map(t => (
                           <option key={t.id} value={t.name}>{t.name.toUpperCase()}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Sentimento Político</label>
                       <select 
                         value={reportFilters.sentiment || ''} 
                         onChange={e => setReportFilters({...reportFilters, sentiment: e.target.value})}
                         className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-blue-600 transition-all"
                       >
                         <option value="">TODOS OS SENTIMENTOS</option>
                         <option value="support">APOIO (FIDELIZADO)</option>
                         <option value="neutral">NEUTRO (A TRABALHAR)</option>
                         <option value="opposed">OPOSIÇÃO (BLOQUEADO)</option>
                       </select>
                    </div>
                  </>
                )}

                {(selectedReportType === 'attendance' || selectedReportType === 'finance') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Data Início</label>
                      <input 
                        type="date" 
                        value={reportFilters.startDate || ''} 
                        onChange={e => setReportFilters({...reportFilters, startDate: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-blue-600 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Data Fim</label>
                      <input 
                        type="date" 
                        value={reportFilters.endDate || ''} 
                        onChange={e => setReportFilters({...reportFilters, endDate: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-blue-600 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-zinc-100">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Campos do Relatório</label>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {(reportDetailLevel === 'detailed' && (selectedReportType === 'teams' || selectedReportType === 'partners') 
                      ? AVAILABLE_COLUMNS_BY_TYPE['voters'] 
                      : AVAILABLE_COLUMNS_BY_TYPE[selectedReportType]
                    )?.map(col => (
                      <button
                        key={col.dataKey}
                        onClick={() => {
                          setSelectedReportColumns(prev => 
                            prev.includes(col.dataKey) 
                              ? prev.filter(k => k !== col.dataKey) 
                              : [...prev, col.dataKey]
                          );
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all text-left ${
                          selectedReportColumns.includes(col.dataKey)
                            ? 'bg-blue-50 border-blue-600 text-blue-700'
                            : 'bg-zinc-50 border-zinc-100 text-zinc-400'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                          selectedReportColumns.includes(col.dataKey)
                            ? 'bg-blue-600 border-blue-600'
                            : 'bg-white border-zinc-300'
                        }`}>
                          {selectedReportColumns.includes(col.dataKey) && <div className="w-1 h-1 bg-white rounded-full" />}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tight">{col.header}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <button 
                    onClick={() => {
                      generateReport(selectedReportType, { 
                        ...reportFilters, 
                        selectedColumns: selectedReportColumns,
                        detailLevel: reportDetailLevel
                      }, 'pdf');
                      setIsReportModalOpen(false);
                    }}
                    className="w-full bg-zinc-950 text-white py-4 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-xl hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-zinc-800"
                  >
                    <FileDown className="w-4 h-4 text-blue-600" /> EXPORTAR PDF
                  </button>

                  <button 
                    onClick={() => {
                      generateReport(selectedReportType, { 
                        ...reportFilters, 
                        selectedColumns: selectedReportColumns,
                        detailLevel: reportDetailLevel
                      }, 'excel');
                      setIsReportModalOpen(false);
                    }}
                    className="w-full bg-emerald-700 text-white py-4 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-xl hover:bg-emerald-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-emerald-600"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-200" /> EXPORTAR EXCEL (.XLSX)
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRegionalModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-zinc-950/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative">
              <button onClick={() => setIsRegionalModalOpen(false)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 bg-zinc-950 border-b border-zinc-800 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Cadastrar Coordenador Regional</h2>
                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Gera acesso direto ao painel regional</p>
                  </div>
                </div>
              </div>

              {regCoordStep === 'form' ? (
                <form onSubmit={handleCreateRegionalCoordinator} className="p-6 space-y-4 text-left">
                  <div>
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-1">Nome Completo do Coordenador</label>
                    <input 
                      required
                      type="text" 
                      value={newRegCoord.name}
                      onChange={(e) => setNewRegCoord({ ...newRegCoord, name: e.target.value })}
                      placeholder="Ex: Carlos Eduardo Silva"
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-1">E-mail de Acesso</label>
                    <input 
                      required
                      type="email" 
                      value={newRegCoord.email}
                      onChange={(e) => setNewRegCoord({ ...newRegCoord, email: e.target.value })}
                      placeholder="carlos@nexuspolitica.com"
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">WhatsApp / Telefone</label>
                      <input 
                        type="text" 
                        value={newRegCoord.phone}
                        onChange={(e) => setNewRegCoord({ ...newRegCoord, phone: e.target.value })}
                        placeholder="(95) 99999-0000"
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-medium text-xs text-[var(--text-primary)] outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Região ou Polo Principal *</label>
                      <input 
                        required
                        type="text" 
                        value={newRegCoord.region}
                        onChange={(e) => setNewRegCoord({ ...newRegCoord, region: e.target.value })}
                        placeholder="Ex: Região Sul / Caracaraí"
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-medium text-xs text-[var(--text-primary)] outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Município *</label>
                      <input 
                        type="text" 
                        value={newRegCoord.municipio}
                        onChange={(e) => setNewRegCoord({ ...newRegCoord, municipio: e.target.value })}
                        placeholder="Ex: Boa Vista"
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-medium text-xs text-[var(--text-primary)] outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Bairro Principal / Sede</label>
                      <input 
                        type="text" 
                        value={newRegCoord.bairro}
                        onChange={(e) => setNewRegCoord({ ...newRegCoord, bairro: e.target.value })}
                        placeholder="Ex: Centro / Pintolândia"
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-medium text-xs text-[var(--text-primary)] outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                        Municípios ou Bairros Integrantes (Opcional)
                      </label>
                      <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-1.5 py-0.5 rounded-xl border border-blue-500/20">
                        Estratégia & TRE
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={newRegCoord.subLocations}
                      onChange={(e) => setNewRegCoord({ ...newRegCoord, subLocations: e.target.value })}
                      placeholder="Ex: Caracaraí, Rorainópolis, São Luiz OU Pintolândia, Asa Branca"
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                    />
                    <p className="text-[8px] font-bold text-[var(--text-secondary)] mt-1 uppercase tracking-wider">
                      Relacione os municípios ou bairros que compõem esta região para cruzamento de inteligência e formulário de metas.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest block">Meta de Eleitores Cadastrados</label>
                      <div className="flex gap-1">
                        {[250, 500, 1000, 2500].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setNewRegCoord({ ...newRegCoord, targetVoters: val })}
                            className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 transition-colors"
                          >
                            {val >= 1000 ? `${val/1000}k` : val}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={newRegCoord.targetVoters === '' ? '' : (typeof newRegCoord.targetVoters === 'number' ? newRegCoord.targetVoters.toLocaleString('pt-BR') : newRegCoord.targetVoters)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        setNewRegCoord({ ...newRegCoord, targetVoters: digits === '' ? '' : parseInt(digits, 10) });
                      }}
                      placeholder="Ex: 500"
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 active:scale-95 transition-all mt-2"
                  >
                    {isProcessing ? 'GERANDO ACESSO...' : 'CADASTRAR E GERAR LINK'}
                  </button>
                </form>
              ) : (
                <div className="p-6 space-y-5 text-center">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Coordenador Cadastrado com Sucesso!</h3>
                    <p className="text-xs font-bold text-[var(--text-secondary)] mt-1">Envie o link abaixo para o Coordenador Regional acessar o painel dele.</p>
                  </div>

                  <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-3 rounded-xl font-mono text-xs text-blue-500 break-all select-all">
                    {createdRegCoordLink}
                  </div>

                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(createdRegCoordLink);
                      alert("Link de acesso copiado!");
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    <Copy className="w-4 h-4" /> Copiar Link de Acesso
                  </button>

                  <button 
                    onClick={() => setIsRegionalModalOpen(false)}
                    className="w-full bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all"
                  >
                    Concluir
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShareLinkModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-zinc-950/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative">
              <button onClick={() => setIsShareLinkModalOpen(false)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 bg-zinc-950 border-b border-zinc-800 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Link de Cadastro Externo</h2>
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Para Coordenadores & Líderes cadastrarem Eleitores</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 text-left">
                {/* Visual Preview do Candidato no Link */}
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-center gap-3">
                  <img 
                    src={candidateForm.photoUrl || DEFAULT_CANDIDATE_INFO.photoUrl} 
                    alt="Candidato" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow-sm shrink-0 bg-zinc-800"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_CANDIDATE_INFO.photoUrl; }}
                  />
                  <div className="overflow-hidden flex-1">
                    <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-0.5">
                      FAÇA PARTE DO NOSSO TIME!
                    </span>
                    <p className="text-xs font-black text-[var(--text-primary)] truncate">{candidateForm.name || 'Candidato Cadastrado'}</p>
                    <p className="text-[9px] font-bold text-[var(--text-secondary)] truncate">{candidateForm.title || 'Campanha 2026'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-1">Selecione a Equipe / Líder Vinculado</label>
                  <select 
                    value={selectedShareTeam}
                    onChange={(e) => setSelectedShareTeam(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                  >
                    <option value="">-- Cadastro Geral (Sem Equipe Específica) --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name} - Líder: {t.leaderName || t.leader}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-3 rounded-xl">
                  <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">URL de Cadastro Público:</p>
                  <p className="font-mono text-xs text-blue-500 break-all select-all">
                    {`${window.location.origin}/cadastro?${selectedShareTeam ? `teamId=${selectedShareTeam}&` : ''}coordinatorId=${coordinatorId || user?.uid || ''}&inviter=${encodeURIComponent(user?.displayName || user?.name || 'Sérgio Bezerra')}`}
                  </p>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      const finalUrl = `${window.location.origin}/cadastro?${selectedShareTeam ? `teamId=${selectedShareTeam}&` : ''}coordinatorId=${coordinatorId || user?.uid || ''}&inviter=${encodeURIComponent(user?.displayName || user?.name || 'Sérgio Bezerra')}`;
                      const candName = candidateForm.name || 'nosso candidato';
                      const messageText = `*FAÇA PARTE DO NOSSO TIME!* 🗳️\n\nOlá! Gostaria de convidar você para fazer parte da nossa caminhada e apoiar a campanha de *${candName}*.\n\nRealize seu cadastro de forma simples e rápida no link abaixo:\n${finalUrl}`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`, '_blank');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Enviar Directo no WhatsApp
                  </button>

                  <button 
                    onClick={() => {
                      const finalUrl = `${window.location.origin}/cadastro?${selectedShareTeam ? `teamId=${selectedShareTeam}&` : ''}coordinatorId=${coordinatorId || user?.uid || ''}&inviter=${encodeURIComponent(user?.displayName || user?.name || 'Sérgio Bezerra')}`;
                      const candName = candidateForm.name || 'nosso candidato';
                      const messageText = `*FAÇA PARTE DO NOSSO TIME!* 🗳️\n\nOlá! Gostaria de convidar você para fazer parte da nossa caminhada e apoiar a campanha de *${candName}*.\n\nRealize seu cadastro de forma simples e rápida no link abaixo:\n${finalUrl}`;
                      navigator.clipboard.writeText(messageText);
                      alert("✅ Mensagem completa com 'FAÇA PARTE DO NOSSO TIME' e o link foram copiados para a área de transferência!");
                    }}
                    className="w-full bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <Copy className="w-4 h-4" /> Copiar Mensagem com "FAÇA PARTE DO NOSSO TIME"
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCandidateModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-zinc-950/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative my-6">
              <button onClick={() => setIsCandidateModalOpen(false)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-[var(--text-primary)] cursor-pointer z-10">
                <X className="w-5 h-5" />
              </button>

              <div className="p-5 bg-gradient-to-r from-blue-700 to-blue-900 border-b border-blue-600 text-left text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-black border border-white/20">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-white">
                      {isGeral ? 'Cadastro do Candidato Oficial' : 'Informações do Candidato'}
                    </h2>
                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                      {isGeral 
                        ? 'Identificação, foto, propostas e personalização da página pública' 
                        : 'Visualização oficial definida pelo Coordenador Geral da Campanha'}
                    </p>
                  </div>
                </div>

                {/* Sub-tabs for candidate modal */}
                <div className="flex gap-1.5 mt-4 pt-3 border-t border-blue-500/30">
                  <button
                    type="button"
                    onClick={() => setCandidateModalTab('identificacao')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      candidateModalTab === 'identificacao'
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    1. Identificação & Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateModalTab('apresentacao')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      candidateModalTab === 'apresentacao'
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    2. Apresentação & Biografia
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateModalTab('publico')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      candidateModalTab === 'publico'
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    3. Página Pública & Links
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveCandidateInfo} className="p-5 space-y-4 text-left max-h-[72vh] overflow-y-auto">
                
                {!isGeral && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3 text-amber-600 dark:text-amber-400">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-semibold">
                      Modo somente leitura. Apenas o <strong>Coordenador Geral</strong> pode cadastrar ou modificar as informações e fotos do candidato.
                    </p>
                  </div>
                )}

                {/* TAB 1: IDENTIFICAÇÃO & FOTO */}
                {candidateModalTab === 'identificacao' && (
                  <div className="space-y-4">
                    {/* Live Preview Card */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-3.5 rounded-xl flex items-center gap-4">
                      <img 
                        src={candidateForm.photoUrl || DEFAULT_CANDIDATE_INFO.photoUrl} 
                        alt="Preview" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-600 shadow-md bg-zinc-200 shrink-0"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_CANDIDATE_INFO.photoUrl; }}
                      />
                      <div className="overflow-hidden min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                            {candidateForm.number ? `Nº ${candidateForm.number}` : 'Candidato Oficial'}
                          </span>
                          {candidateForm.party && (
                            <span className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                              {candidateForm.party}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-black text-[var(--text-primary)] truncate">{candidateForm.name || 'Nome do Candidato'}</p>
                        <p className="text-[11px] font-bold text-[var(--text-secondary)] truncate">{candidateForm.title || 'Cargo do Candidato'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Nome de Urna / Completo {isGeral && '*'}</label>
                        <input 
                          required={isGeral}
                          disabled={!isGeral}
                          type="text" 
                          value={candidateForm.name} 
                          onChange={e => isGeral && setCandidateForm({...candidateForm, name: e.target.value})} 
                          className={`w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 font-bold text-xs outline-none ${isGeral ? 'focus:border-blue-600' : 'opacity-80 cursor-not-allowed'}`} 
                          placeholder="Ex: Soldado Sampaio" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Número de Urna</label>
                        <input 
                          disabled={!isGeral}
                          type="text" 
                          inputMode="numeric"
                          value={candidateForm.number || ''} 
                          onChange={e => {
                            if (!isGeral) return;
                            const digits = e.target.value.replace(/\D/g, '');
                            setCandidateForm({...candidateForm, number: digits});
                          }} 
                          className={`w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 font-bold text-xs outline-none ${isGeral ? 'focus:border-blue-600' : 'opacity-80 cursor-not-allowed'}`} 
                          placeholder="Ex: 55000" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Cargo / Função (Eleições 2026) {isGeral && '*'}</label>
                        <input 
                          required={isGeral}
                          disabled={!isGeral}
                          type="text" 
                          value={candidateForm.title} 
                          onChange={e => isGeral && setCandidateForm({...candidateForm, title: e.target.value})} 
                          className={`w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 font-bold text-xs outline-none ${isGeral ? 'focus:border-blue-600' : 'opacity-80 cursor-not-allowed'}`} 
                          placeholder="Ex: Deputado Estadual" 
                        />
                        {isGeral && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {[
                              'Deputado Estadual',
                              'Deputado Federal',
                              'Senador',
                              'Governador',
                              'Prefeito',
                              'Vereador'
                            ].map((cargo) => (
                              <button
                                type="button"
                                key={cargo}
                                onClick={() => setCandidateForm({...candidateForm, title: cargo})}
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${
                                  candidateForm.title.toLowerCase().includes(cargo.toLowerCase())
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-blue-500'
                                }`}
                              >
                                {cargo}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Partido / Coligação</label>
                        <input 
                          disabled={!isGeral}
                          type="text" 
                          value={candidateForm.party || ''} 
                          onChange={e => isGeral && setCandidateForm({...candidateForm, party: e.target.value})} 
                          className={`w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 font-bold text-xs outline-none ${isGeral ? 'focus:border-blue-600' : 'opacity-80 cursor-not-allowed'}`} 
                          placeholder="Ex: União Brasil / Coligação Pelo Povo" 
                        />
                      </div>
                    </div>

                    {/* Foto do Candidato */}
                    {isGeral ? (
                      <div className="space-y-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-3.5 rounded-xl">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                          Foto Oficial do Candidato (Alta Resolução)
                        </label>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 ${isUploadingPhoto ? 'bg-zinc-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 cursor-pointer'} text-white rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95`}>
                            <Upload className="w-4 h-4" /> {isUploadingPhoto ? 'Enviando Foto...' : 'Escolher Foto do Candidato'}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleCandidatePhotoUpload} 
                              className="hidden" 
                              disabled={isUploadingPhoto}
                            />
                          </label>
                          <input 
                            type="text"
                            placeholder="Ou cole a URL da imagem aqui..."
                            value={candidateForm.photoUrl}
                            onChange={(e) => setCandidateForm({ ...candidateForm, photoUrl: e.target.value })}
                            className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3 text-xs font-medium outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-3 rounded-xl">
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                          URL da Foto Oficial
                        </label>
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                          {candidateForm.photoUrl}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: APRESENTAÇÃO & BIOGRAFIA */}
                {candidateModalTab === 'apresentacao' && (
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        Slogan de Campanha / Lema
                      </label>
                      <input 
                        disabled={!isGeral}
                        type="text" 
                        value={candidateForm.slogan || ''} 
                        onChange={e => isGeral && setCandidateForm({...candidateForm, slogan: e.target.value})} 
                        className={`w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 font-bold text-xs outline-none ${isGeral ? 'focus:border-blue-600' : 'opacity-80 cursor-not-allowed'}`} 
                        placeholder="Ex: Trabalho, Coragem e Compromisso com as Pessoas" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                        Biografia / Mensagem de Apresentação {isGeral && '*'}
                      </label>
                      <textarea 
                        required={isGeral}
                        disabled={!isGeral}
                        rows={3}
                        value={candidateForm.bio} 
                        onChange={e => isGeral && setCandidateForm({...candidateForm, bio: e.target.value})} 
                        className={`w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-medium text-xs outline-none ${isGeral ? 'focus:border-blue-600' : 'opacity-80 cursor-not-allowed'} resize-none`} 
                        placeholder="Biografia ou mensagem de apresentação do candidato..." 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                        Principais Eixos e Propostas de Campanha
                      </label>
                      <textarea 
                        disabled={!isGeral}
                        rows={4}
                        value={candidateForm.proposals || ''} 
                        onChange={e => isGeral && setCandidateForm({...candidateForm, proposals: e.target.value})} 
                        className={`w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-medium text-xs outline-none ${isGeral ? 'focus:border-blue-600' : 'opacity-80 cursor-not-allowed'} resize-none`} 
                        placeholder="• Saúde: Ampliação do atendimento especializado&#10;• Educação: Escolas em tempo integral&#10;• Segurança: Valorização profissional" 
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: PÁGINA PÚBLICA & LINKS */}
                {candidateModalTab === 'publico' && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Título da Página de Cadastro</label>
                        <input 
                          disabled={!isGeral}
                          type="text" 
                          value={candidateForm.badgeTitle} 
                          onChange={e => isGeral && setCandidateForm({...candidateForm, badgeTitle: e.target.value})} 
                          className={`w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 font-bold text-xs outline-none ${isGeral ? 'focus:border-blue-600' : 'opacity-80 cursor-not-allowed'}`} 
                          placeholder="FAÇA PARTE DO NOSSO TIME! 🗳️" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Subtítulo de Chamada</label>
                        <input 
                          disabled={!isGeral}
                          type="text" 
                          value={candidateForm.subtitle} 
                          onChange={e => isGeral && setCandidateForm({...candidateForm, subtitle: e.target.value})} 
                          className={`w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 font-bold text-xs outline-none ${isGeral ? 'focus:border-blue-600' : 'opacity-80 cursor-not-allowed'}`} 
                          placeholder="Preencha o formulário e apoie nossa caminhada..." 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Instagram Oficial (@)</label>
                        <input 
                          disabled={!isGeral}
                          type="text" 
                          value={candidateForm.instagram || ''} 
                          onChange={e => isGeral && setCandidateForm({...candidateForm, instagram: e.target.value})} 
                          className={`w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 font-bold text-xs outline-none ${isGeral ? 'focus:border-blue-600' : 'opacity-80 cursor-not-allowed'}`} 
                          placeholder="Ex: @soldadosampaio" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">WhatsApp de Campanha</label>
                        <input 
                          disabled={!isGeral}
                          type="text" 
                          value={candidateForm.whatsapp || ''} 
                          onChange={e => isGeral && setCandidateForm({...candidateForm, whatsapp: e.target.value})} 
                          className={`w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 font-bold text-xs outline-none ${isGeral ? 'focus:border-blue-600' : 'opacity-80 cursor-not-allowed'}`} 
                          placeholder="Ex: (95) 99123-4567" 
                        />
                      </div>
                    </div>

                    {/* Preview box */}
                    <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl">
                      <p className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider mb-2">
                        Prévia da Chamada de Adesão
                      </p>
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3 rounded-lg flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black text-[var(--text-primary)]">{candidateForm.badgeTitle || 'FAÇA PARTE DO NOSSO TIME! 🗳️'}</p>
                          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{candidateForm.subtitle || 'Apoie nosso projeto e multiplique votos.'}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 rounded">
                          Link Ativo
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-[var(--border-color)] flex justify-between items-center gap-3">
                  <div className="flex gap-1.5">
                    {candidateModalTab !== 'identificacao' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (candidateModalTab === 'publico') setCandidateModalTab('apresentacao');
                          else if (candidateModalTab === 'apresentacao') setCandidateModalTab('identificacao');
                        }}
                        className="px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[var(--bg-primary)] transition-all cursor-pointer"
                      >
                        Voltar
                      </button>
                    )}
                    {candidateModalTab !== 'publico' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (candidateModalTab === 'identificacao') setCandidateModalTab('apresentacao');
                          else if (candidateModalTab === 'apresentacao') setCandidateModalTab('publico');
                        }}
                        className="px-3 py-2 bg-[var(--bg-tertiary)] text-blue-600 dark:text-blue-400 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all cursor-pointer"
                      >
                        Avançar &rarr;
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCandidateModalOpen(false)}
                      className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[var(--bg-primary)] transition-all cursor-pointer"
                    >
                      {isGeral ? 'Cancelar' : 'Fechar'}
                    </button>
                    {isGeral && (
                      <button
                        type="submit"
                        disabled={isSavingCandidate}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        {isSavingCandidate ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> Salvando...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" /> Salvar Candidato
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditGoalModalOpen && editingGoal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-zinc-950/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative">
              <button onClick={() => setIsEditGoalModalOpen(false)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 bg-zinc-950 border-b border-zinc-800 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Editar Meta Geral</h2>
                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{editingGoal.locationName}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateGoal} className="p-6 space-y-4 text-left">
                <div>
                  <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-1">Nome da Localidade</label>
                  <input 
                    required
                    type="text" 
                    value={editingGoal.locationName || ''}
                    onChange={(e) => setEditingGoal({ ...editingGoal, locationName: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest block">Meta Geral de Eleitores</label>
                    <div className="flex gap-1">
                      {[500, 1000, 2500, 5000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setEditingGoal({ ...editingGoal, targetVoters: val })}
                          className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 transition-colors"
                        >
                          {val >= 1000 ? `${val/1000}k` : val}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input 
                    required
                    type="text" 
                    inputMode="numeric"
                    value={editingGoal.targetVoters === '' ? '' : (typeof editingGoal.targetVoters === 'number' ? editingGoal.targetVoters.toLocaleString('pt-BR') : editingGoal.targetVoters)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setEditingGoal({ ...editingGoal, targetVoters: digits === '' ? '' : parseInt(digits, 10) });
                    }}
                    placeholder="Ex: 5.000"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsEditGoalModalOpen(false)}
                    className="w-1/2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 rounded-xl font-black text-xs uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    {isProcessing ? 'Salvando...' : 'Atualizar Meta'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditRegCoordModalOpen && editingRegCoord && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-zinc-950/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative">
              <button onClick={() => setIsEditRegCoordModalOpen(false)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 bg-zinc-950 border-b border-zinc-800 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Editar Coordenador Regional</h2>
                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{editingRegCoord.name}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateRegionalCoordinator} className="p-6 space-y-4 text-left">
                <div>
                  <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    value={editingRegCoord.name || ''}
                    onChange={(e) => setEditingRegCoord({ ...editingRegCoord, name: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-1">WhatsApp / Telefone</label>
                    <input 
                      type="text" 
                      value={editingRegCoord.phone || ''}
                      onChange={(e) => setEditingRegCoord({ ...editingRegCoord, phone: e.target.value })}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-1">Região Principal</label>
                    <input 
                      required
                      type="text" 
                      value={editingRegCoord.region || ''}
                      onChange={(e) => setEditingRegCoord({ ...editingRegCoord, region: e.target.value })}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-1">Municípios ou Bairros Integrantes</label>
                  <input 
                    type="text" 
                    value={editingRegCoord.subLocations || ''}
                    onChange={(e) => setEditingRegCoord({ ...editingRegCoord, subLocations: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest block">Meta de Eleitores Alocada</label>
                    <div className="flex gap-1">
                      {[250, 500, 1000, 2500].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setEditingRegCoord({ ...editingRegCoord, targetVoters: val })}
                          className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 transition-colors"
                        >
                          {val >= 1000 ? `${val/1000}k` : val}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input 
                    required
                    type="text" 
                    inputMode="numeric"
                    value={editingRegCoord.targetVoters === '' ? '' : (typeof editingRegCoord.targetVoters === 'number' ? editingRegCoord.targetVoters.toLocaleString('pt-BR') : editingRegCoord.targetVoters)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setEditingRegCoord({ ...editingRegCoord, targetVoters: digits === '' ? '' : parseInt(digits, 10) });
                    }}
                    placeholder="Ex: 500"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsEditRegCoordModalOpen(false)}
                    className="w-1/2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 rounded-xl font-black text-xs uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    {isProcessing ? 'Salvando...' : 'Atualizar Dados'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DISPARO WHATSAPP (ESTRATÉGIA B WA.ME) */}
      <WhatsAppDispatchModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        voters={filteredVoters}
        leaders={teams}
      />

      {/* MODAL MANUAL COMPLETO DO SISTEMA */}
      <SystemManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />

      {/* MOBILE BOTTOM NAV - COORDINATOR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-1 overflow-x-auto px-2 z-50 shadow-lg scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {[
          { id: 'overview', label: 'Dash', icon: <LayoutDashboard className="w-4 h-4" /> },
          ...(isGeral ? [{ id: 'metas', label: 'Metas', icon: <Target className="w-4 h-4" /> }] : []),
          ...(isGeral ? [{ id: 'regional_coords', label: 'Regionais', icon: <ShieldCheck className="w-4 h-4" /> }] : []),
          ...(!isGeral ? [{ id: 'teams', label: 'Equipes', icon: <Users className="w-4 h-4" /> }] : []),
          ...(!isGeral ? [{ id: 'voters', label: 'Eleitores', icon: <UserPlus className="w-4 h-4" /> }] : []),
          { id: 'agenda', label: 'Agenda', icon: <Calendar className="w-4 h-4" /> },
          { id: 'analise_eleitoral', label: 'Análise', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'materials', label: 'Materiais', icon: <Package className="w-4 h-4" /> },
          { id: 'demands', label: 'Demandas', icon: <Activity className="w-4 h-4" /> },
          { id: 'notes', label: 'Notas', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'reports', label: 'Relatórios', icon: <FileDown className="w-4 h-4" /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 transition-all shrink-0 min-w-[54px] rounded-xl ${
              activeTab === tab.id 
              ? 'text-blue-600 dark:text-blue-500 font-black' 
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === tab.id ? 'bg-blue-600/10 dark:bg-blue-500/15' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[7.5px] font-black uppercase tracking-tight leading-none">
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}


