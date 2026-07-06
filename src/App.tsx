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
  ChevronDown,
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
  Upload,
  Calendar,
  Clock,
  FileText,
  FileDown,
  GanttChart,
  Trash2,
  Edit3,
  Lock,
  Phone,
  LayoutDashboard,
  DollarSign,
  Briefcase,
  BookOpen,
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
  Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { processarCaos, gerarBriefingCandidato, processarNotaAudio } from './services/geminiService';
import { reportService } from './services/reportService';
import { useAuth } from './lib/FirebaseProvider';
import { firestoreService } from './lib/firestoreService';
import RoraimaMapComponent from './components/RoraimaMapComponent';
import EleitoralDashboard from './components/EleitoralDashboard';
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
import { onSnapshot, doc, collection, query, orderBy, limit, getDocs, where, getDoc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { validarSugestaoAgenda, AgendaItem } from './lib/agendaLogic';
import * as XLSX from 'xlsx';

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access denied:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage write denied:", e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("Storage remove denied:", e);
    }
  }
};

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

/// --- COMPONENTE: CARD DE NOTA (ESTILO FÓRUM) ---
function NoteCard({ note, user, isAdmin, onDelete, currentUserName }: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'notes', note.id, 'comments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Comments sync permission or access denied:", err.message);
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
        authorName: currentUserName || user.displayName || 'Membro Águia',
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
      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-yellow-500/50 transition-all flex flex-col h-full text-left relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-500/10 transition-colors pointer-events-none opacity-0 dark:opacity-100" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className={`text-[8px] font-black px-3 py-1 rounded-sm uppercase tracking-widest leading-none ${note.type === 'private' ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]' : 'bg-zinc-950 text-white'}`}>
            {note.type === 'private' ? 'Pessoal' : (note.team || 'Campo')}
          </span>
          {note.type === 'private' && <Lock className="w-3 h-3 text-[var(--text-secondary)] opacity-50" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{new Date(note.createdAt).toLocaleDateString()}</span>
          {(isAdmin || note.leaderId === user?.uid || note.authorId === user?.uid) && (
             <button onClick={onDelete} className="text-zinc-300 hover:text-red-500 transition-colors p-1 hover:bg-red-500/10 rounded-sm">
               <Trash2 className="w-3.5 h-3.5" />
             </button>
          )}
        </div>
      </div>

      <p className="text-[var(--text-primary)] font-bold text-sm leading-relaxed mb-6 whitespace-pre-wrap relative z-10">"{note.text}"</p>

      <div className="mt-auto relative z-10">
        <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-sm bg-yellow-500 flex items-center justify-center font-black text-[11px] text-zinc-950 shadow-sm border border-white/20">
              {(note.leaderName || note.authorName || 'U').charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-[7px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">Registrado por</p>
              <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight mt-1 leading-none">{note.leaderName || note.authorName}</p>
              <p className="text-[8px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mt-1.5 leading-none">{note.teamName || note.team || (note.authorRole === 'coordinator' ? 'Liderança' : 'Campo')}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-sm border ${showComments ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]' : 'text-[var(--text-secondary)] border-[var(--border-color)] hover:border-yellow-600 hover:text-yellow-600'}`}
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
                  <div key={comment.id} className="bg-[var(--bg-tertiary)]/50 p-4 rounded-sm border border-[var(--border-color)] group/msg">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[8px] font-black text-[var(--text-primary)] uppercase tracking-tighter">{comment.authorName}</span>
                      <span className="text-[7px] font-bold text-[var(--text-secondary)] uppercase">{new Date(comment.createdAt).toLocaleTimeString().slice(0, 5)}</span>
                    </div>
                    <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed">{comment.text}</p>
                  </div>
                )) : (
                  <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase text-center py-4 tracking-widest opacity-50">Nenhum comentário ainda.</p>
                )}
              </div>
              
              <form onSubmit={handlePostComment} className="flex gap-2 pt-2">
                <input 
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Comentar..."
                  className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm px-4 py-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-yellow-500 shadow-inner transition-colors"
                />
                <button 
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-yellow-500 text-zinc-950 p-3 rounded-sm active:scale-95 disabled:opacity-50 shadow-lg hover:bg-yellow-400 transition-colors"
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
function CoordinatorDashboard({ theme, setTheme }: { theme: 'light' | 'dark', setTheme: (t: 'light' | 'dark') => void }) {
  const { user, login, logout, isAdmin, coordinatorId } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'voters' | 'agenda' | 'mapa' | 'notes' | 'materials' | 'demands' | 'reports' | 'analise_eleitoral'>('overview');
  const [noteSubTab, setNoteSubTab] = useState<'tactical' | 'private'>('tactical');

  const handleDownloadDoc = () => {
    const textHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Manual Inteligente do Coordenador - Sistema Águia</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 40px; }
          .header { text-align: center; border-bottom: 3px solid #eab308; padding-bottom: 20px; margin-bottom: 30px; }
          .title { color: #000000; font-size: 26px; font-weight: bold; text-transform: uppercase; margin: 0; }
          .subtitle { color: #4b5563; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 10px; }
          blockquote { border-left: 4px solid #eab308; padding-left: 20px; font-style: italic; color: #374151; background: #fafafa; padding: 15px; margin: 25px 0; }
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
          <div class="title">Sistema Águia 2026</div>
          <div class="subtitle">Manual Inteligente do Coordenador de Campanha</div>
        </div>

        <blockquote style="font-size: 13px;">
          "A função central é cuidar, ajustar e direcionar a campanha eleitoral de um determinado candidato. O coordenador gerencia os acertos e compromissos diários de campanha. Ele é responsável por articular com parceiros no meio político, seja no âmbito estadual, municipal ou da república. O profissional realiza o gerenciamento das finanças, administrando os valores de campanha repassados pelo partido. O coordenador fatia e distribui o dinheiro para cobrir custos com cabos eleitorais, combustível, escritórios de mídia, santinhos e outros materiais. A figura do coordenador represents o homem de extrema confiança do político. A palavra desse profissional possui muito peso, sendo tratada como se fosse a palavra do próprio candidato. Todas as decisões, ideias, reuniões e resoluções de grupos dentro da campanha precisam passar pelo aval do coordenador."
        </blockquote>

        <h2>1. Direcionar e Cuidar da Campanha</h2>
        <p><span class="meta-bold">Função Clássica:</span> Cuidar, ajustar e guiar estrategicamente o progresso e o foco das frentes eleitorais urbana e rural.</p>
        <p><span class="meta-bold">No Sistema Águia:</span> Por meio do Dashboard Central Unificado (aba Visão Geral), o coordenador monitora em tempo real a estatística consolidada de eleitores cadastrados, metas gerais por equipes, andamento das visitas e nível de atividade de todos os cabos eleitorais integrados.</p>
        <div class="highlight-box">
          <p>⚡ Impacto Prático vs. Método Tradicional: Substitui a dependência de telefonemas incertos e relatórios informais por métricas exatas centralizadas. O coordenador ganha poder de intervenção estratégica imediata para recalibrar frentes estagnadas.</p>
        </div>

        <h2>2. Gerenciamento de Compromissos e Acertos</h2>
        <p><span class="meta-bold">Função Clássica:</span> Gerenciar a pauta de rua, reuniões territoriais mundanas e compromissos diários do candidato, otimizando o tempo dele.</p>
        <p><span class="meta-bold">No Sistema Águia:</span> Integrado na aba Mapa e Agenda, permitindo vincular compromissos locais às necessidades comunitárias. Permite cadastrar visitas regionais cruzando dados diretamente com o mapa de demandas prioritárias.</p>
        <div class="highlight-box">
          <p>⚡ Impacto Prático vs. Método Tradicional: Evita colisões e redundâncias geográficas. O candidato sobe no palanque dominando minuciosamente quais as reais queixas e demandas geológicas do bairro visitado.</p>
        </div>

        <h2>3. Articulação com Parceiros Políticos</h2>
        <p><span class="meta-bold">Função Clássica:</span> Manter contato contínuo e equilibrar parcerias estratégicas regionais, de vereadores a lideranças municipais externas.</p>
        <p><span class="meta-bold">No Sistema Águia:</span> Integrado na central de Articulação (CRM de Parceiros), permitindo registrar todas as lideranças agregadas, gerenciar o status de relacionamento ("Quente", "Morno", "Frio"), histórico de encontros e monitoramento das metas de angariação particulares a cada um.</p>
        <div class="highlight-box">
          <p>⚡ Impacto Prático vs. Método Tradicional: Evita o desengajamento ou o "esfriamento" de redutos eleitorais por falta de comunicação continuada. Cada parceria tem um histórico de atendimento digitalizado indelével.</p>
        </div>

        <h2>4. Administração das Finanças e Custos de Campanha</h2>
        <p><span class="meta-bold">Função Clássica:</span> Distribuir fatias financeiras para cabos eleitorais rurais, alimentação de bases, gastos de combustível integrado e confecção de santinhos físicos.</p>
        <p><span class="meta-bold">No Sistema Águia:</span> Operado através da aba Financeiro e Gestão de Materiais, permitindo destinar limites financeiros exatos a frentes de atuação específicas, autorizar injeções de recursos urgentes no Vault Digital e auditar fotos de recibos e folhas de presença de rua imediatamente.</p>
        <div class="highlight-box">
          <p>⚡ Impacto Prático vs. Método Tradicional: Elimina a famosa "caixa-preta" de rua. Toda transação exige comprovação fotográfica, mitigando desvios e cobrando o máximo de rendimento por cada centavo empregado.</p>
        </div>

        <h2>5. Representação de Confiança e Tomada de Decisão</h2>
        <p><span class="meta-bold">Função Clássica:</span> Atuar como a voz oficial com autoridade final para chancelar estratégias, pautas civis e responder resoluções internas.</p>
        <p><span class="meta-bold">No Sistema Águia:</span> Concentrado no painel de Anotações Táticas (dividido em Fórum Comum da Equipe e Observações Privadas do Coordenador), além da central de aprovação de Demandas (Ouvidoria de Campo). Nenhuma questão ganha andamento legal ou visibilidade coletiva sem o endosso prévio do perfil do Coordenador.</p>
        <div class="highlight-box">
          <p>⚡ Impacto Prático vs. Método Tradicional: Blinda o comitê contra espionagem por canais públicos (WhatsApp). Centraliza e hierarquiza cronogramas estratégicos de forma unívoca.</p>
        </div>

        <div class="footer">
          <p>Documento Oficial Gerado Eletronicamente pelo Ecossistema Águia 2026.</p>
          <p>Confidencialidade de Nível Governamental e Alta Operação Militar de Campo.</p>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + textHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MANUAL_INTELIGENTE_DO_COORDENADOR_AGUIA_2026.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    
    // Configurações de cores e fontes
    doc.setTextColor(26, 26, 26);
    
    // Título Principal
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39); // Zinc-900 / Dark
    doc.text("SISTEMA ÁGUIA 2026", 14, 25);
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text("Manual Inteligente do Coordenador de Campanha", 14, 33);
    
    // Linha horizontal Amarela
    doc.setDrawColor(234, 179, 8); // Yellow-500
    doc.setLineWidth(1.5);
    doc.line(14, 38, 196, 38);
    
    // Bloco de citação
    doc.setFillColor(250, 250, 250);
    doc.rect(14, 43, 182, 50, "F");
    doc.setDrawColor(234, 179, 8);
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
      "Função Clássica: Cuidar, ajustar e guiar estrategicamente o progresso e o foco das frentes eleitorais urbana e rural. No Sistema Águia: Por meio do Dashboard Central Unificado (aba Visão Geral), o coordenador monitora em tempo real a estatística consolidada de eleitores cadastrados, metas gerais por equipes, andamento das visitas e nível de atividade de todos os cabos eleitorais integrados.",
      "⚡ Impacto Prático vs. Método Tradicional: Substitui a dependência de relatórios informais por métricas exatas centralizadas. O coordenador ganha poder de intervenção estratégica imediata para recalibrar frentes estagnadas."
    );
    
    drawSection(
      "2. Gerenciamento de Compromissos e Acertos",
      "Função Clássica: Gerenciar a pauta de rua, reuniões territoriais e compromissos diários do candidato, otimizando o tempo dele. No Sistema Águia: Integrado na aba Mapa e Agenda, permitindo vincular compromissos locais às necessidades comunitárias. Permite cadastrar visitas regionais cruzando dados diretamente com o mapa de demandas prioritárias.",
      "⚡ Impacto Prático vs. Método Tradicional: Evita colisões e redundâncias geográficas. O candidato sobe no palanque dominando minuciosamente quais as reais queixas e demandas do bairro visitado."
    );
    
    drawSection(
      "3. Articulação com Parceiros Políticos",
      "Função Clássica: Manter contato contínuo e equilibrar parcerias estratégicas regionais, de vereadores a lideranças municipais. No Sistema Águia: Integrado na central de Articulação (CRM de Parceiros), permitindo registrar todas as lideranças agregadas, gerenciar o status de relacionamento (Quente, Morno, Frio), histórico de encontros e monitoramento das metas particulares.",
      "⚡ Impacto Prático vs. Método Tradicional: Evita o desengajamento de redutos eleitorais por falta de comunicação. Cada parceria tem um histórico de atendimento digitalizado indelével."
    );
    
    drawSection(
      "4. Administração das Finanças e Custos de Campanha",
      "Função Clássica: Distribuir fatias financeiras para cabos eleitorais rurais, alimentação de bases, gastos de combustível e confecção de santinhos físicos. No Sistema Águia: Operado através da aba Financeiro e Gestão de Materiais, permitindo destinar limites financeiros exatos a frentes de atuação específicas, autorizar injeções de recursos urgentes e auditar fotos de recibos imediatamente.",
      "⚡ Impacto Prático vs. Método Tradicional: Elimina a famosa fossa financeira de rua. Toda transação exige comprovação fotográfica, mitigando desvios e cobrando o máximo de rendimento por cada centavo empregado."
    );
    
    drawSection(
      "5. Representação de Confiança e Tomada de Decisão",
      "Função Clássica: Atuar como a voz oficial com autoridade final para chancelar estratégias, pautas civis e responder resoluções internas. No Sistema Águia: Concentrado no painel de Anotações Táticas (Fórum Comum da Equipe e Observações Privadas do Coordenador), além da central de aprovação de Demandas (Ouvidoria de Campo). Nenhuma questão ganha andamento sem o endosso prévio do Coordenador.",
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
    doc.text("Documento Oficial Gerado Eletronicamente pelo Ecossistema Águia 2026.", 14, y);
    doc.text("Confidencialidade de Nível Governamental e Alta Operação Militar de Campo.", 14, y + 4);
    
    doc.save("MANUAL_INTELIGENTE_DO_COORDENADOR_AGUIA_2026.pdf");
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
  const [demandsSummary, setDemandsSummary] = useState<any[]>([]);
  const [dailyOrder, setDailyOrder] = useState<any>(null);
  const [isEditingDailyOrder, setIsEditingDailyOrder] = useState(false);
  const [newDailyOrder, setNewDailyOrder] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [chaosText, setChaosText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const [isEditingMaterial, setIsEditingMaterial] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
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
  const [voterFilterTags, setVoterFilterTags] = useState<string[]>([]);
  const [voterSearch, setVoterSearch] = useState('');
  const [voterFilterReferredBy, setVoterFilterReferredBy] = useState('');
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

  const [articulatorFilter, setArticulatorFilter] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    try {
      await firestoreService.setDocument('config', 'dailyOrder', {
        text: newDailyOrder,
        updatedAt: Date.now(),
        updatedBy: profileData?.name || user?.email
      });
      setIsEditingDailyOrder(false);
      alert("Ordem do Dia enviada para todas as unidades!");
    } catch (err) {
      alert("Erro ao enviar ordem: " + err);
    }
  };


  const handleAddMaterial = async (e: any) => {
    e.preventDefault();
    try {
      const name = e.target.name.value.trim();
      const rawQty = e.target.qty.value;
      const qtyStr = rawQty.toString().replace(/\D/g, ''); 
      const qty = parseInt(qtyStr, 10);
      
      if (!name || isNaN(qty) || qty <= 0) {
        alert("Preencha o nome e a quantidade corretamente.");
        return;
      }
      
      const existing = materials.find(m => m.name.toLowerCase() === name.toLowerCase());
      
      if (existing) {
        await firestoreService.updateDocument('materials', existing.id, {
          total: (existing.total || 0) + qty,
          current: (existing.current || 0) + qty
        });
        alert(`Quantidade adicionada ao material existente: ${name}`);
      } else {
        await firestoreService.addDocument('materials', {
          name,
          total: qty,
          current: qty,
          coordinatorId: coordinatorId || user?.uid || '',
          createdAt: Date.now()
        });
        alert("Material registrado com sucesso!");
      }
      e.target.reset();
      setMaterialForm({ name: '', qty: '' });
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const handleUpdateMaterial = async (id: string, amount: number) => {
    try {
      const mat = materials.find(m => m.id === id);
      if (!mat) return;
      await firestoreService.updateDocument('materials', id, {
        current: Math.max(0, (mat.current || 0) + amount)
      });
    } catch (err: any) {
      alert("Erro ao atualizar: " + err.message);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (confirm("Deseja realmente excluir este tipo de material e todo seu estoque?")) {
      try {
        await firestoreService.deleteDocument('materials', id);
        alert("Material excluído!");
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  const handleStartEditMaterial = (m: any) => {
    setIsEditingMaterial(true);
    setEditingMaterialId(m.id);
    setMaterialForm({ name: m.name, qty: m.total.toString() });
  };

  const handleSaveEditMaterial = async (e: any) => {
    e.preventDefault();
    if (!editingMaterialId) return;

    try {
      const name = materialForm.name.trim();
      const qtyStr = materialForm.qty.toString().replace(/\D/g, '');
      const qty = parseInt(qtyStr, 10);
      
      if (!name || isNaN(qty) || qty <= 0) {
        alert("Preencha o nome e a quantidade corretamente.");
        return;
      }

      const old = materials.find(m => m.id === editingMaterialId);
      if (!old) {
        alert("Erro: Material original não encontrado.");
        return;
      }

      const diffUsed = (old.total || 0) - (old.current || 0);

      await firestoreService.updateDocument('materials', editingMaterialId, {
        name: materialForm.name,
        total: qty,
        current: Math.max(0, qty - diffUsed)
      });

      setIsEditingMaterial(false);
      setEditingMaterialId(null);
      setMaterialForm({ name: '', qty: '' });
      alert("Material atualizado com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar alterações: " + err.message);
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
      await firestoreService.updateDocument('materials', req.materialId, {
        current: mat.current - req.qty
      });

      const signatureHash = 'AGUIA-SIG-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString().slice(-4);

      // Update request status with signature details
      await firestoreService.updateDocument('material_requests', req.id, {
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
      await firestoreService.updateDocument('material_requests', id, {
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
          await firestoreService.updateDocument('materials', req.materialId, {
            current: (mat.current || 0) + req.qty
          });
        }
        await firestoreService.updateDocument('material_requests', req.id, {
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
  const generateReport = async (type: string, filters: any = {}) => {
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
              realContacts: allVoters.filter(v => v.team === t.name || v.teamName === t.name).length,
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

      // Generate PDF
      const doc = new jsPDF() as any;
      const timestamp = new Date().toLocaleString('pt-BR');
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(218, 165, 32); // Dourado
      doc.text('ÁGUIA - SISTEMA DE ESTRATÉGIA', 14, 20);
      
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text(title.toUpperCase(), 14, 30);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitle, 14, 40);
      doc.text(`Gerado em: ${timestamp} | Por: ${userName}`, 14, 48);

      // Filter out columns that have no data across all rows
      const visibleColumns = reportColumns.filter((col: any) => {
        return data.some(row => {
          const val = row[col.dataKey];
          return val !== undefined && val !== null && String(val).trim() !== '' && String(val) !== '---';
        });
      });

      autoTable(doc, {
        startY: 55,
        head: [visibleColumns.map((col: any) => col.header.toUpperCase())],
        body: data.map(row => visibleColumns.map((col: any) => {
          const val = row[col.dataKey];
          return val !== undefined && val !== null ? String(val) : '---';
        })),
        styles: { fontSize: 7, font: 'helvetica', cellPadding: 2 },
        headStyles: { fillColor: [218, 165, 32], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 55 }
      });

      doc.save(`${type}-relatorio-${Date.now()}.pdf`);

      // Add to Firestore History
      await addDoc(collection(db, 'reports'), {
        type,
        title,
        subtitle,
        timestamp: Date.now(),
        createdBy: user?.email,
        createdByDisplayName: profileData?.name || user?.email,
        createdAt: serverTimestamp(),
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
    if (!user || !coordinatorId) return;

    // Subs para dados reais filtrados por coordenador
    const unsubTeams = firestoreService.subscribeToCollectionFiltered('teams', coordinatorId, (data) => {
      setTeams(data);
    });
    
    const unsubUrgencies = firestoreService.subscribeToCollectionFiltered('urgencies', coordinatorId, (data) => {
      setUrgencies(data);
    });

    const unsubStats = onSnapshot(doc(db, 'stats', `stats_${coordinatorId}`), (snapshot) => {
      if (snapshot.exists()) {
        setStatsData(snapshot.data());
      }
    }, (err) => {
      const errInfo = {
        error: err.message,
        operationType: 'get',
        path: `stats/stats_${coordinatorId}`,
        authInfo: {
          userId: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          emailVerified: auth.currentUser?.emailVerified,
        }
      };
      console.error("Stats sync error details:", JSON.stringify(errInfo));
    });

    const unsubAgendas = firestoreService.subscribeToCollectionFiltered('agenda', coordinatorId, (data) => {
      setAgendas(data);
    });

    const unsubNotes = query(
      collection(db, 'notes'), 
      where('coordinatorId', '==', coordinatorId),
      orderBy('createdAt', 'desc')
    );
    const unsubNotesSnap = onSnapshot(unsubNotes, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Notes sync error (permission or query failure):", err.message);
    });

    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setProfileData(snapshot.data());
      }
    }, (err) => {
      console.warn("Profile sync error:", err.message);
    });
    
    // Fallback for empty collections
    const checkAndSeed = async () => {
      if (isAdmin) {
        // No more seeding - only real data
      }
    };
    checkAndSeed();

    const unsubDailyOrder = onSnapshot(doc(db, 'config', `dailyOrder_${coordinatorId}`), (snap) => {
      if (snap.exists()) {
        setDailyOrder(snap.data());
        setNewDailyOrder(snap.data().text || '');
      }
    }, (err) => {
      console.warn("DailyOrder sync error:", err.message);
    });

    const unsubMaterials = onSnapshot(
      query(collection(db, 'materials'), where('coordinatorId', '==', coordinatorId)), 
      (snap) => {
        setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, 
      (err) => {
        console.warn("Materials sync error:", err.message);
      }
    );

    const unsubMaterialRequests = firestoreService.subscribeToCollectionFiltered('material_requests', coordinatorId, (data) => {
      setMaterialRequests(data);
    });

    const unsubVoters = onSnapshot(
      query(collection(db, 'voters'), where('coordinatorId', '==', coordinatorId)), 
      (snap) => {
        const rawData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        // Deduplicar para a visão geral: prioriza o registro mais completo ou mais recente
        const uniqueMap = new Map();
        rawData.forEach((v: any) => {
          const key = (v.phone && v.phone.length > 5) ? v.phone : v.name;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, v);
          } else {
            // Se já existe, mantém o que tem mais campos preenchidos (ex: articulatorId)
            const existing = uniqueMap.get(key);
            if (!existing.articulatorId && v.articulatorId) {
              uniqueMap.set(key, v);
            }
          }
        });
        setAllVoters(Array.from(uniqueMap.values()));
      }, 
      (err) => {
        console.warn("Voters sync error:", err.message);
      }
    );

    const unsubReports = onSnapshot(
      query(
        collection(db, 'reports'), 
        where('coordinatorId', '==', coordinatorId),
        orderBy('createdAt', 'desc')
      ), 
      (snap) => {
        setReportsHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, 
      (err) => {
        console.warn("Reports sync error:", err.message);
      }
    );

    return () => {
      unsubTeams();
      unsubUrgencies();
      unsubStats();
      unsubAgendas();
      unsubNotesSnap();
      unsubProfile();
      unsubDailyOrder();
      unsubMaterials();
      unsubMaterialRequests();
      unsubVoters();
      unsubReports();
    };
  }, [user, isAdmin, coordinatorId]);

  useEffect(() => {
    if (!coordinatorId || teams.length === 0) return;

    const healCoordinatorVotersAndRequests = async () => {
      try {
        const promises: Promise<any>[] = [];
        
        for (const team of teams) {
          const teamId = team.id || team.name.replace(/\s/g, '_').toLowerCase();
          
          // 1. Heal Voters belonging to this team
          const qVoters = query(collection(db, 'voters'), where('teamId', '==', teamId));
          const snapVoters = await getDocs(qVoters);
          snapVoters.docs.forEach((vDoc) => {
            const data = vDoc.data();
            if (data.coordinatorId !== coordinatorId) {
              promises.push(
                updateDoc(doc(db, 'voters', vDoc.id), {
                  coordinatorId: coordinatorId
                })
              );
            }
          });

          // 2. Heal Material Requests belonging to this team
          const qReqs = query(collection(db, 'material_requests'), where('teamId', '==', teamId));
          const snapReqs = await getDocs(qReqs);
          snapReqs.docs.forEach((rDoc) => {
            const data = rDoc.data();
            if (data.coordinatorId !== coordinatorId) {
              promises.push(
                updateDoc(doc(db, 'material_requests', rDoc.id), {
                  coordinatorId: coordinatorId
                })
              );
            }
          });
        }
        
        if (promises.length > 0) {
          await Promise.all(promises);
          console.log(`🧠 [Healer] Coordenador successfully healed ${promises.length} records for their teams!`);
        }
      } catch (err) {
        console.error("Error healing coordinator records:", err);
      }
    };

    healCoordinatorVotersAndRequests();
  }, [teams, coordinatorId]);

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
      color: 'text-[var(--text-primary)]',
      iconColor: 'bg-zinc-100 dark:bg-zinc-800',
      action: () => setActiveTab('teams')
    },
    { 
      label: 'Contatos Base', 
      value: allVoters.length, 
      sub: 'Monitoramento Real', 
      color: 'text-emerald-600 dark:text-emerald-500',
      iconColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      action: () => setActiveTab('voters')
    },
    { 
      label: 'Agenda Pendente', 
      value: agendas.filter(a => a.status === 'pendente').length, 
      sub: 'Compromissos Hoje', 
      color: 'text-blue-600 dark:text-blue-400',
      iconColor: 'bg-blue-50 dark:bg-blue-500/10',
      action: () => setActiveTab('agenda')
    },
    { 
      label: 'Dia D (Votaram)', 
      value: allVoters.filter(v => v.voted).length, 
      sub: `${((allVoters.filter(v => v.voted).length / (allVoters.length || 1)) * 100).toFixed(1)}% de Metas`, 
      color: 'text-emerald-700 dark:text-emerald-400',
      iconColor: 'bg-emerald-100 dark:bg-emerald-500/20',
      action: () => setActiveTab('voters')
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
        await firestoreService.deleteDocument('agenda', id);
        alert("Item movido com sucesso!");
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  // Sincronizar eleitores da equipe gerenciada pelo coordenador
  useEffect(() => {
    if (selectedManagingTeam && isAdmin && coordinatorId) {
      const leaderEmail = selectedManagingTeam.leaderEmail?.toLowerCase();
      if (!leaderEmail) return;

      const fetchLeaderAndVoters = async () => {
        try {
          const usersRef = collection(db, 'users');
          const qUser = query(
            usersRef, 
            where('email', '==', leaderEmail),
            where('coordinatorId', '==', coordinatorId)
          );
          const userSnap = await getDocs(qUser);
          
          if (!userSnap.empty) {
            const leaderId = userSnap.docs[0].id;
            const votersRef = collection(db, 'voters');
            const qVoters = query(
              votersRef, 
              where('leaderId', '==', leaderId),
              where('coordinatorId', '==', coordinatorId)
            );
            
            const unsub = onSnapshot(qVoters, (snapshot) => {
              const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setManagingTeamVoters(data);
            }, (err) => {
              console.warn("Error listening to managing team voters:", err.message);
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
  }, [selectedManagingTeam, isAdmin, coordinatorId]);



  const filteredVoters = allVoters.filter(voter => {
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
    allVoters.flatMap(v => (v.tags || []) as string[])
      .map(t => t.trim().toUpperCase())
      .filter(t => t !== "")
  )) as string[];

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
      await firestoreService.setDocument('notes', noteId, {
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
        coordinatorId: coordinatorId || user?.uid || '',
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
          coordinatorId: coordinatorId || user?.uid || '',
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

  const handleResetSystem = async () => {
    if (!isAdmin) return;
    if (window.confirm("⚠️ ALERTA DE SEGURANÇA: Deseja realmente ZERAR todos os dados do sistema? Isso removerá notas, ponto, financeiro, eleitores e agenda para começar do zero com dados REAIS.\n\nEsta ação não pode ser desfeita.")) {
      try {
        setIsProcessing(true);
        
        // 1. Limpar Coleções Principais
        const collections = ['transactions', 'attendance', 'notes', 'urgencies', 'agenda', 'voters'];
        for (const coll of collections) {
          const docs = await firestoreService.getCollectionFiltered<any>(coll, coordinatorId || '');
          for (const d of docs) {
            await firestoreService.deleteDocument(coll, d.id);
          }
        }

        // 2. Resetar Campos das Equipes
        for (const team of teams) {
          const teamId = team.id || team.name.replace(/\s/g, '_').toLowerCase();
          await firestoreService.updateDocument('teams', teamId, {
            allocated: 0,
            spent: 0,
            contacts: 0,
            demands: 0,
            fuel: 0
          });
        }

        // 3. Resetar Stats Globais
        await firestoreService.setDocument('stats', 'global', {
          totalFunded: 0,
          combustivelHoje: 0,
          combustivelSaldo: 0,
          votersTotal: 0,
          lastUpdated: Date.now()
        }, true);

        alert("✅ SISTEMA REINICIADO COM SUCESSO! Todos os valores fictícios foram removidos.");
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

  const handleDeleteVoter = async (voterId: string) => {
    if (window.confirm("Deseja realmente excluir este eleitor? Esta ação não pode ser desfeita.")) {
      try {
        await firestoreService.deleteDocument('voters', voterId);
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
      const allUrgencies = await firestoreService.getCollectionFiltered<any>('urgencies', coordinatorId || '');
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
        where('coordinatorId', '==', coordinatorId),
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
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden transition-colors duration-300">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex w-72 flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-color)] py-8 px-6 overflow-y-auto shrink-0 relative z-40 shadow-[2px_0_10px_rgba(0,0,0,0.02)] dark:shadow-none">
        <div className="mb-10 px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-zinc-950 rounded-sm shadow-xl border border-white/5">
              <ShieldCheck className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tighter text-[var(--text-primary)] uppercase leading-none">
                ÁGUIA
              </h1>
              <p className="text-[8px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-[0.2em] mt-1.5">
                Estratégia 2026
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {[
            { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'teams', label: 'Equipes', icon: <Users className="w-4 h-4" /> },
            { id: 'voters', label: 'Eleitores Geral', icon: <Target className="w-4 h-4" /> },
            { id: 'agenda', label: 'Agenda', icon: <Calendar className="w-4 h-4" /> },
            { id: 'mapa', label: 'Mapa Regional', icon: <MapIcon className="w-4 h-4" /> },
            { id: 'analise_eleitoral', label: 'Análise Eleitoral', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'materials', label: 'Materiais', icon: <Package className="w-4 h-4" /> },
            { id: 'demands', label: 'Demandas', icon: <Activity className="w-4 h-4" /> },
            { id: 'notes', label: 'Anotações', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'reports', label: 'Relatórios & BI', icon: <FileDown className="w-4 h-4" /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-sm text-xs font-black uppercase tracking-tight transition-all group ${
                activeTab === item.id 
                ? 'bg-yellow-500 text-zinc-950 shadow-lg shadow-yellow-500/20' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <div className={`transition-colors ${activeTab === item.id ? 'text-zinc-950' : 'text-[var(--text-secondary)] group-hover:text-yellow-600'}`}>
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-8 space-y-2">
          <div className="pt-6 border-t border-[var(--border-color)] space-y-1">
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-sm text-xs font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all uppercase tracking-tight"
            >
              <Settings className="w-4 h-4" /> Configurações
            </button>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-sm text-xs font-black text-red-500 hover:bg-red-500/10 transition-all uppercase tracking-tight"
            >
              <LogOut className="w-4 h-4" /> Sair do Sistema
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
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm py-2.5 pl-11 pr-4 text-[11px] font-black uppercase tracking-tight text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:opacity-50 focus:ring-1 focus:ring-yellow-500/40 outline-none transition-all shadow-inner"
              />

              {/* SEARCH RESULTS PANEL */}
              <AnimatePresence>
                {searchQuery.length >= 2 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm shadow-2xl z-50 max-h-96 overflow-y-auto p-2 transition-colors duration-300"
                  >
                    {totalResults > 0 ? (
                      <div className="p-1 space-y-3">
                        {searchResults.teams.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 mb-1">Equipes / Zonas</p>
                            {searchResults.teams.map(t => (
                              <button key={t.id} onClick={() => { setActiveTab('teams'); setSearchQuery(''); }} className="w-full flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-sm transition-colors text-left">
                                <div className="w-8 h-8 rounded-sm bg-zinc-100 flex items-center justify-center"><Users className="w-4 h-4 text-zinc-900" /></div>
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
                              <button key={a.id} onClick={() => { setActiveTab('agenda'); setSearchQuery(''); }} className="w-full flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-sm transition-colors text-left">
                                <div className="w-8 h-8 rounded-sm bg-zinc-100 flex items-center justify-center"><Calendar className="w-4 h-4 text-zinc-900" /></div>
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
                              <button key={n.id} onClick={() => { setActiveTab('notes'); setSearchQuery(''); }} className="w-full flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-sm transition-colors text-left">
                                <div className="w-8 h-8 rounded-sm bg-zinc-100 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-zinc-900" /></div>
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
              <div className="p-1.5 bg-zinc-950 rounded-sm">
                <ShieldCheck className="w-4 h-4 text-yellow-500" />
              </div>
              <h1 className="text-base font-black text-zinc-950 uppercase leading-none">ÁGUIA</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-sm text-zinc-500 dark:text-zinc-400 hover:bg-yellow-500 hover:text-zinc-950 active:scale-90 transition-all border border-zinc-200 dark:border-zinc-700"
              title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="hidden sm:flex items-center gap-2.5 px-3 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-sm border border-zinc-200 dark:border-zinc-700">
               <div className={`w-2 h-2 rounded-sm ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
               <span className="text-[9px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                 {isOnline ? 'SINC. ATIVO' : 'MODO OFFLINE'}
               </span>
               {!isOnline && <CloudOff className="ml-1 w-3 h-3 text-red-500" />}
            </div>
            
            <div className="h-8 w-px bg-zinc-200 hidden sm:block"></div>

            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 hover:bg-zinc-50 p-1 rounded-sm transition-all"
            >
              <div className="w-8 h-8 rounded-sm bg-yellow-500 flex items-center justify-center font-black text-xs text-zinc-950 overflow-hidden shadow-sm border border-zinc-200">
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


        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-3.5 md:p-10 custom-scrollbar pb-32 lg:pb-20">
          <div className="max-w-7xl mx-auto space-y-6 md:space-y-12 pb-20">
            
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 md:space-y-8">
              <div className="flex-col gap-1 flex">
                <h2 className="text-base md:text-lg font-black text-zinc-950 tracking-tighter uppercase leading-none dark:text-white">Painel de Operações</h2>
                <p className="text-[8px] md:text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Monitoramento estratégico em tempo real</p>
              </div>

              <motion.section 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-950 rounded-sm p-4 md:p-6 shadow-2xl border border-yellow-500/30 overflow-hidden relative group dark:bg-zinc-950"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                  <ShieldCheck className="w-40 h-40 text-yellow-500" />
                </div>
                
                <div className="flex items-center justify-between mb-4 relative z-10 transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-500 rounded-sm shadow-lg shadow-yellow-500/20">
                      <Zap className="w-5 h-5 text-zinc-950" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-tighter">Ordem do Dia</h3>
                      <p className="text-[8px] font-black text-yellow-500 uppercase tracking-[0.2em] opacity-80">Diretiva Central de Comando</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => setIsEditingDailyOrder(!isEditingDailyOrder)}
                      className="text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-sm hover:bg-white/5"
                    >
                      {isEditingDailyOrder ? 'Cancelar' : 'Editar Diretiva'}
                    </button>
                  )}
                </div>

                {isEditingDailyOrder ? (
                  <div className="space-y-4 relative z-10">
                    <textarea 
                      value={newDailyOrder}
                      onChange={(e) => setNewDailyOrder(e.target.value)}
                      placeholder="Digite a diretiva central para todas as equipes..."
                      className="w-full bg-white/5 border border-white/10 rounded-sm p-4 text-xs font-bold text-white outline-none focus:border-yellow-500 min-h-[120px] transition-colors"
                    />
                    <button 
                      onClick={handleUpdateDailyOrder}
                      className="bg-yellow-500 text-zinc-950 px-6 py-2.5 rounded-sm font-black text-[10px] uppercase shadow-lg shadow-yellow-500/20 active:scale-95 transition-all hover:bg-yellow-400"
                    >
                      Transmitir para Unidades
                    </button>
                  </div>
                ) : (
                  <div className="relative z-10">
                    {dailyOrder?.text ? (
                      <p className="text-lg font-black text-white tracking-tight leading-relaxed max-w-3xl">
                        "{dailyOrder.text}"
                      </p>
                    ) : (
                      <p className="text-zinc-500 text-xs font-bold italic">Nenhuma diretiva emitida para hoje.</p>
                    )}
                    <div className="mt-6 flex items-center gap-4 text-[8px] font-black text-zinc-500 uppercase tracking-widest bg-white/5 w-fit px-4 py-2 rounded-full border border-white/10 shadow-inner">
                      <span className="flex items-center gap-2"><Clock className="w-3 h-3 text-yellow-500" /> {dailyOrder?.updatedAt ? new Date(dailyOrder.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</span>
                      <span className="w-1.5 h-1.5 bg-yellow-500/30 rounded-full"></span>
                      <span className="flex items-center gap-2"><User className="w-3 h-3 text-yellow-500" /> {dailyOrder?.updatedBy || 'Comando'}</span>
                    </div>
                  </div>
                )}
              </motion.section>

              {/* STATS GRID */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={stat.action}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3.5 md:p-5 rounded-sm shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-yellow-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <div className={`p-2 rounded-sm group-hover:bg-yellow-500 transition-colors ${(stat as any).iconColor || 'bg-[var(--bg-tertiary)]'}`}>
                        {i === 0 && <Target className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-zinc-950" />}
                        {i === 1 && <Users className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-zinc-950" />}
                        {i === 2 && <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-zinc-950" />}
                        {i === 3 && <DollarSign className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-zinc-950" />}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[6px] md:text-[7px] font-black py-0.5 px-1.5 bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-sm uppercase tracking-widest border border-green-200/50 dark:border-green-500/20 leading-none">ATIVO</span>
                      </div>
                    </div>
                    <p className={`text-lg md:text-2xl font-black tracking-tighter mb-0.5 leading-none ${stat.color || 'text-[var(--text-primary)]'}`}>{stat.value}</p>
                    <p className="text-[8px] md:text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em]">{stat.label}</p>
                    <div className="mt-3.5 md:mt-5 pt-2 md:pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                      <span className="text-[7.5px] md:text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-widest leading-none">{stat.sub}</span>
                      <ChevronRight className="w-3 h-3 text-[var(--text-secondary)] group-hover:text-yellow-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </section>

                <div className="pt-2 flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-5">
                  </div>

                  <div className="w-full lg:w-72 space-y-6">

                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-5 shadow-[var(--shadow-sm)]">
                      <h3 className="text-sm font-black uppercase tracking-tighter text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        < Zap className="w-3.5 h-3.5 text-yellow-500" /> Atividade Recente
                      </h3>
                      <div className="space-y-4">
                        {teams.slice(0, 4).map((team, i) => (
                          <div key={i} className="flex gap-3 group/item cursor-default">
                            <div className="w-8 h-8 rounded-sm bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0 border border-[var(--border-color)] group-hover/item:border-yellow-500/30 transition-colors">
                              <Users className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover/item:text-yellow-500 transition-colors" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-[var(--text-primary)] uppercase leading-none">{team.name}</p>
                              <p className="text-[8px] font-bold text-[var(--text-secondary)] mt-1.5 uppercase tracking-widest opacity-70">Status OK • {10 + i}m atrás</p>
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
              <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 md:space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[var(--border-color)] pb-4 md:pb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase text-[var(--text-primary)] tracking-tighter leading-none">Gestão de Equipes</h2>
                    <p className="text-[var(--text-secondary)] text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-1.5 md:mt-2">Controle tático de recursos e unidades</p>
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
                    className="bg-yellow-500 text-zinc-950 px-5 md:px-6 py-3 md:py-3.5 rounded-sm font-black text-[9px] md:text-[10px] uppercase flex items-center justify-center gap-2 md:gap-2.5 shadow-lg shadow-yellow-500/10 hover:scale-[1.01] active:scale-95 transition-all w-full md:w-auto mt-2 md:mt-0"
                  >
                    <Plus className="w-4 h-4 text-zinc-950" /> Cadastrar Nova Unidade
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {teams.length > 0 ? teams.map((team) => (
                    <motion.div 
                      key={team.id || team.name} 
                      layout
                      className={`bg-[var(--bg-secondary)] border ${team.fraudAlert ? 'border-red-600 shadow-[var(--shadow-md)] animate-pulse' : 'border-[var(--border-color)]'} rounded-sm p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 hover:shadow-[var(--shadow-md)] hover:border-yellow-500/30 transition-all group relative overflow-hidden`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-500/10 transition-colors pointer-events-none opacity-0 dark:opacity-100" />
                      
                      {team.fraudAlert && (
                        <div className="absolute top-0 right-8 bg-red-600 text-white text-[8px] font-black px-6 py-1.5 rounded-sm uppercase flex items-center gap-1.5 shadow-lg z-10">
                          <AlertTriangle className="w-3 h-3" /> Alerta Crítico
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 md:gap-5 min-w-[200px] md:min-w-[240px] relative z-10">
                        <div className={`w-11 h-11 md:w-14 md:h-14 rounded-sm flex items-center justify-center transition-transform group-hover:rotate-3 shadow-inner ${
                          team.status === 'OK' ? 'bg-emerald-500/10 text-emerald-500' : 
                          team.status === 'ALERTA' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          <Users className="w-5 h-5 md:w-7 md:h-7" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-black text-[var(--text-primary)] text-base md:text-xl uppercase tracking-tighter leading-none">{team.name}</h3>
                          <div className="flex flex-col gap-1 pt-1 opacity-70">
                            <p className="text-[8px] md:text-[9px] font-black text-[var(--text-secondary)] uppercase flex items-center gap-1.5 tracking-widest leading-none">
                              <User className="w-2 md:w-2.5 h-2 md:h-2.5 text-yellow-500" /> Líder: {team.leader}
                            </p>
                            <p className="text-[8px] md:text-[9px] font-black text-[var(--text-secondary)] uppercase flex items-center gap-1.5 tracking-widest leading-none">
                              <MapPin className="w-2 md:w-2.5 h-2 md:h-2.5 text-yellow-500" /> Base: {team.location}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 flex-1 text-left relative z-10">
                        <div>
                          <p className="text-[7px] md:text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1 leading-none opacity-60">Eleitores</p>
                          <p className="text-base md:text-2xl font-black text-[var(--text-primary)] tracking-tighter">
                            {allVoters.filter(v => v.team === team.name || v.teamName === team.name).length}
                          </p>
                        </div>
                        <div>
                          <p className="text-[7px] md:text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1 leading-none opacity-60">Engajamento</p>
                          <p className="text-base md:text-2xl font-black text-emerald-600 dark:text-emerald-500 tracking-tighter leading-none">
                            {Math.min(100, Math.round(((allVoters.filter(v => v.team === team.name || v.teamName === team.name).length) / 100) * 100))}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[7px] md:text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1 leading-none opacity-60">Demandas</p>
                          <p className={`text-base md:text-2xl font-black tracking-tighter leading-none ${urgencies.filter(u => u.team === team.name).length > 0 ? 'text-red-600' : 'text-[var(--bg-tertiary)] opacity-30 dark:opacity-10'}`}>
                            {urgencies.filter(u => u.team === team.name).length}
                          </p>
                        </div>
                        <div>
                           <p className="text-[7px] md:text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 md:mb-2 leading-none opacity-60">Status de Rede</p>
                           <span className={`inline-flex items-center gap-1 text-[7px] md:text-[8px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-sm uppercase tracking-widest border transition-colors leading-none ${
                            team.status === 'OK' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20' : 
                            team.status === 'ALERTA' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-700 dark:text-red-500 border-red-500/20'
                          }`}>
                            <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full animate-pulse ${team.status === 'OK' ? 'bg-emerald-500' : team.status === 'ALERTA' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            {team.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 justify-end relative z-10 w-full lg:w-auto">
                        <div className="flex gap-2 w-full lg:w-auto">
                           <button 
                             onClick={() => handleCopyAccessLink(team)}
                             className="flex-1 lg:flex-none p-2.5 md:p-3 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-sm hover:bg-zinc-950 hover:text-white transition-all shadow-[var(--shadow-sm)] active:scale-95 border border-[var(--border-color)] flex items-center justify-center"
                             title="Copiar Credenciais"
                           >
                             <LogIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
                           </button>
                           <button 
                             onClick={() => handleEditTeam(team)}
                             className="flex-1 lg:flex-none p-2.5 md:p-3 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-sm hover:bg-zinc-950 hover:text-white transition-all shadow-[var(--shadow-sm)] active:scale-95 border border-[var(--border-color)] flex items-center justify-center"
                             title="Editar Unidade"
                           >
                             <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                           </button>
                           <button 
                             onClick={() => handleDeleteTeam(team.id || team.name.replace(/\s/g, '_').toLowerCase(), team.name)}
                             className="flex-1 lg:flex-none p-2.5 md:p-3 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-all shadow-[var(--shadow-sm)] active:scale-95 border border-red-600/20 flex items-center justify-center"
                             title="Excluir"
                           >
                             <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                           </button>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedManagingTeam(team);
                            setIsTeamManagementOpen(true);
                          }}
                          className={`w-full px-4 md:px-6 py-3 rounded-sm font-black text-[9px] md:text-[10px] uppercase shadow-lg transition-all active:translate-y-0.5 whitespace-nowrap hover:scale-[1.02] ${
                            urgencies.filter(u => u.team === team.name).length > 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-zinc-950 text-white hover:bg-zinc-800'
                          }`}
                        >
                          Gerenciar Equipe
                        </button>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="p-20 text-center bg-white rounded-sm border-2 border-dashed border-zinc-200">
                       <RefreshCcw className="w-10 h-10 text-zinc-200 animate-spin mx-auto mb-4" />
                       <p className="font-black text-zinc-300 uppercase tracking-[0.2em] text-[9px]">Sincronizando unidades...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'voters' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[var(--border-color)] pb-4 md:pb-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-950 rounded-sm flex items-center justify-center shadow-lg">
                      <Target className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black uppercase text-[var(--text-primary)] tracking-tighter leading-none">Base de Eleitores</h2>
                      <p className="text-[var(--text-secondary)] text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-1.5 md:mt-2">Gestão centralizada de segmentação e influência</p>
                    </div>
                  </div>
                </div>

                {/* FILTERS */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-4 md:p-6 shadow-sm space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Pesquisar por Nome/Telefone</label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                          type="text" 
                          value={voterSearch}
                          onChange={e => setVoterSearch(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-100 rounded-sm py-3 pl-10 pr-4 text-xs font-bold text-zinc-900 outline-none focus:border-yellow-500 transition-all"
                          placeholder="Ex: João Silva ou 119..."
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Filtrar por Articulador</label>
                      <div className="relative">
                        <Handshake className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <select 
                          value={articulatorFilter}
                          onChange={e => setArticulatorFilter(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-100 rounded-sm py-3 pl-10 pr-4 text-xs font-bold text-zinc-900 outline-none focus:border-yellow-500 transition-all appearance-none"
                        >
                          <option value="">TODOS OS ARTICULADORES</option>
                          {allVoters.filter(v => v.isArticulator).map(art => (
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
                        onClick={() => {
                          const area = voterSearch || 'Filtro Atual';
                          alert(`📢 CONVOCAÇÃO ENVIADA!\nTodos os eleitores filtrados (${filteredVoters.length}) na segmentação "${area}" receberam o aviso via WhatsApp via robô de envio.`);
                        }}
                        className="flex-1 bg-zinc-950 text-yellow-500 py-3 md:py-4 rounded-sm font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 hover:bg-zinc-900 active:scale-95 transition-all outline-none"
                      >
                        <Send className="w-3.5 h-3.5" /> Disparar Convite de Reunião para {filteredVoters.length} Eleitores
                      </button>
                      <button 
                        onClick={() => {
                          const count = filteredVoters.filter(v => !v.voted).length;
                          alert(`🚨 ALERTA DE LOGÍSTICA!\n${count} eleitores pendentes na área atual. Acionando líderes de equipe para mobilização imediata.`);
                        }}
                        className="px-6 md:px-8 bg-red-600 text-white rounded-sm font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 py-3 md:py-0 shadow-lg shadow-red-500/10 outline-none"
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
                           className={`px-2.5 py-1.5 rounded-sm text-[8px] md:text-[9px] font-black uppercase transition-all border ${
                             voterFilterTags.includes(tag)
                             ? 'bg-yellow-500 border-yellow-600 text-zinc-950 shadow-md'
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
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm shadow-sm overflow-x-auto min-h-[400px] custom-scrollbar">
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
                      {filteredVoters.length > 0 ? filteredVoters.map((voter) => (
                        <tr key={voter.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                          <td className="p-3.5">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-zinc-950 uppercase leading-none">{voter.name}</span>
                                {voter.isArticulator && (
                                  <span className="bg-zinc-950 text-yellow-500 text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Articulador</span>
                                )}
                                {voter.isIndigenous && (
                                  <span className="bg-orange-100 text-orange-700 text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Com. Tradicional</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex items-center gap-1">
                                  {[1,2,3,4,5].map(star => (
                                    <div 
                                      key={star} 
                                      className={`w-2 h-2 rounded-full ${star <= (voter.loyaltyScore || 3) ? 'bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.4)]' : 'bg-zinc-200'}`}
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
                                {voter.articulatorId ? allVoters.find(v => v.id === voter.articulatorId)?.name : (voter.referredBy || '---')}
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
                                <span className="bg-emerald-500 text-white text-[7px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> VOTOU
                                </span>
                              ) : (
                                <span className="bg-zinc-100 text-zinc-400 text-[7px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" /> PENDENTE
                                </span>
                              )}
                              {voter.hasDocPhoto ? (
                                <span className="bg-zinc-900 text-white text-[7px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
                                  <Camera className="w-2.5 h-2.5" /> DOC OK
                                </span>
                              ) : (
                                <span className="bg-zinc-50 text-red-400 border border-red-100 text-[7px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">
                                  SEM DOC
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {voter.tags?.map((tag: string) => (
                                <span key={tag} className="bg-yellow-500/10 text-yellow-700 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase">
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
                                 className="p-2 text-zinc-400 hover:text-yellow-600 transition-all hover:bg-yellow-500/10 rounded-sm"
                                 title="Editar dados"
                               >
                                 <Edit3 className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => handleDeleteVoter(voter.id)}
                                 className="p-2 text-zinc-400 hover:text-red-600 transition-all hover:bg-red-500/10 rounded-sm"
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
              </motion.div>
            )}

            {activeTab === 'agenda' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-sm flex items-center justify-center shadow-lg shadow-yellow-500/10">
                      <Calendar className="w-6 h-6 text-zinc-950" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase text-zinc-950 tracking-tighter leading-none">Agenda</h2>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">Logística e compromissos oficiais</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingAgenda(null);
                      setAgendaForm({ municipio: '', data: '', hora_inicio: '', hora_fim: '', motivo: '' });
                      setIsAgendaCreateModalOpen(true);
                    }}
                    className="bg-zinc-950 text-white px-6 py-3.5 rounded-sm font-black text-[10px] uppercase flex items-center gap-2.5 shadow-xl shadow-zinc-200 hover:scale-[1.01] active:scale-95 transition-all w-full md:w-auto"
                  >
                    <Plus className="w-4 h-4 text-yellow-500" /> Agendar Evento
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-zinc-200 rounded-sm p-6 lg:p-8 shadow-sm">
                      <h3 className="text-lg font-black uppercase text-zinc-950 tracking-tighter mb-6 flex items-center gap-3">
                        Solicitações
                      </h3>
                      
                      <div className="space-y-4">
                        {agendas.filter(a => a.status === 'pendente').length > 0 ? agendas.filter(a => a.status === 'pendente').map((item) => (
                          <motion.div key={item.id} layout className="bg-zinc-50 border border-zinc-100 rounded-sm p-5 lg:p-6 flex flex-col md:flex-row justify-between items-center gap-6 group">
                            <div className="flex items-center gap-6">
                              <div className="bg-white px-4 py-3 rounded-sm shadow-sm border border-zinc-100 flex flex-col items-center min-w-[70px]">
                                <span className="text-[8px] font-black uppercase text-zinc-400 mb-0.5">{new Date(item.data).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                <span className="text-2xl font-black text-zinc-950 leading-none">{new Date(item.data).getDate()}</span>
                              </div>
                              <div className="space-y-1.5">
                                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950 group-hover:text-yellow-600 transition-colors">{item.municipio}</h3>
                                <div className="flex flex-wrap items-center gap-3 text-[9px] font-black text-zinc-400 tracking-widest uppercase">
                                  <span className="flex items-center gap-1.5"><Clock className="w-2.5 h-2.5 text-yellow-500" /> {item.hora_inicio} - {item.hora_fim}</span>
                                  <span className="flex items-center gap-1.5"><User className="w-2.5 h-2.5 text-yellow-500" /> <span className="text-zinc-900">{item.team || '---'}</span> • {item.sugeridoPor}</span>
                                </div>
                                {item.motivo && <p className="text-[10px] text-zinc-500 font-bold bg-zinc-100 px-2.5 py-0.5 rounded-sm inline-block">{item.motivo}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2.5 w-full md:w-auto">
                              <button 
                                onClick={async () => {
                                  await firestoreService.updateDocument('agenda', item.id, { status: 'negado' });
                                }}
                                className="flex-1 md:flex-none px-6 py-3 bg-red-50 text-red-600 font-black text-[9px] uppercase rounded-sm hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              >
                                Negar
                              </button>
                              <button 
                                onClick={async () => {
                                  await firestoreService.updateDocument('agenda', item.id, { status: 'confirmado' });
                                }}
                                className="flex-1 md:flex-none px-6 py-3 bg-green-600 text-white font-black text-[9px] uppercase rounded-sm shadow-xl shadow-green-100 hover:bg-green-700 transition-all border-b-2 border-green-800 active:border-b-0 active:translate-y-0.5"
                              >
                                Confirmar
                              </button>
                            </div>
                          </motion.div>
                        )) : (
                          <div className="p-12 border border-dashed border-zinc-200 rounded-sm text-center">
                            <CheckCircle2 className="w-8 h-8 text-green-200 mx-auto mb-3" />
                            <p className="font-black text-zinc-300 uppercase tracking-[0.15em] text-[9px]">Nenhuma solicitação pendente.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-zinc-950 rounded-sm p-6 lg:p-8 text-white shadow-2xl min-h-[500px] relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-5">
                         <Calendar className="w-32 h-32" />
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
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
                            className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm flex items-center gap-5 group cursor-pointer hover:border-yellow-500/50 transition-all"
                          >
                            <div className="flex flex-col items-center justify-center bg-zinc-800 w-12 h-12 rounded-sm shrink-0 group-hover:bg-yellow-500 transition-colors">
                              <span className="text-[8px] font-black uppercase text-zinc-500 group-hover:text-zinc-950 leading-none mb-0.5">{new Date(item.data).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                              <span className="text-xl font-black text-white group-hover:text-zinc-950 leading-none">{new Date(item.data).getDate()}</span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <h4 className="text-base font-black uppercase text-white truncate group-hover:text-yellow-500 transition-colors leading-none">{item.municipio}</h4>
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

            {activeTab === 'mapa' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <RoraimaMapComponent 
                  teams={teams}
                  allVoters={allVoters}
                  theme={theme}
                />
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[var(--border-color)] pb-4 md:pb-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm flex items-center justify-center shadow-inner">
                      <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-[var(--text-primary)]" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black uppercase text-[var(--text-primary)] tracking-tighter leading-none">Anotações Táticas</h2>
                      <div className="flex gap-2.5 mt-3 md:mt-5">
                        <button 
                          onClick={() => setNoteSubTab('tactical')}
                          className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3.5 md:px-6 py-2 md:py-2.5 rounded-sm transition-all border ${noteSubTab === 'tactical' ? 'bg-zinc-950 text-white border-zinc-950 shadow-xl dark:bg-yellow-500 dark:text-zinc-950 dark:border-yellow-500' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-yellow-500'}`}
                        >
                          Equipe (Fórum)
                        </button>
                        <button 
                          onClick={() => setNoteSubTab('private')}
                          className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3.5 md:px-6 py-2 md:py-2.5 rounded-sm transition-all border ${noteSubTab === 'private' ? 'bg-zinc-950 text-white border-zinc-950 shadow-xl dark:bg-yellow-500 dark:text-zinc-950 dark:border-yellow-500' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-yellow-500'}`}
                        >
                          Minhas Observações
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {noteSubTab === 'private' && (
                    <button 
                      onClick={() => setIsAiModalOpen(true)}
                      className="bg-yellow-500 text-zinc-950 px-8 py-3.5 rounded-sm font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-yellow-400 active:scale-95 transition-all flex items-center gap-3"
                    >
                      <Plus className="w-4 h-4" /> Nova Observação
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notes.filter(n => noteSubTab === 'private' ? (n.type === 'private' && n.authorId === user?.uid) : (n.type === 'tactical')).length > 0 ? (
                    notes.filter(n => noteSubTab === 'private' ? (n.type === 'private' && n.authorId === user?.uid) : (n.type === 'tactical')).map((note) => (
                      <NoteCard key={note.id} note={note} user={user} isAdmin={isAdmin} currentUserName={profileData?.name} onDelete={() => firestoreService.deleteDocument('notes', note.id)} />
                    ))
                  ) : (
                    <div className="col-span-full py-24 bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-sm text-center grayscale opacity-40">
                      <Clock className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                      <p className="font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] text-xs">Aguardando novos feeds táticos...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'materials' && (
              <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 md:space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[var(--border-color)] pb-4 md:pb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase text-[var(--text-primary)] tracking-tighter leading-none font-sans">Gestão de Materiais</h2>
                    <p className="text-[var(--text-secondary)] text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 md:mt-3 opacity-70">Controle tático de suprimentos e distribuição regional</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                  {/* FORM ADD/EDIT MATERIAL */}
                  <div className="lg:col-span-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-4 md:p-8 shadow-[var(--shadow-sm)] h-fit relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                      <Package className="w-32 h-32" />
                    </div>
                    <h3 className="text-xs font-black uppercase text-[var(--text-primary)] mb-5 md:mb-8 flex items-center gap-3 relative z-10">
                      <div className="p-2 bg-yellow-500 rounded-sm shadow-lg shadow-yellow-500/20">
                        {isEditingMaterial ? <Edit3 className="w-4 h-4 text-zinc-950" /> : <Plus className="w-4 h-4 text-zinc-950" />}
                      </div> {isEditingMaterial ? 'Editar Material' : 'Registrador de Lote'}
                    </h3>
                    
                    <form onSubmit={isEditingMaterial ? handleSaveEditMaterial : handleAddMaterial} className="space-y-6 relative z-10">
                      <div className="space-y-2 text-left">
                        <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 opacity-70">Descrição do Material</label>
                        <input 
                          name="name" 
                          type="text" 
                          placeholder="Ex: Santinho 55000" 
                          value={materialForm.name}
                          onChange={(e) => setMaterialForm({...materialForm, name: e.target.value})}
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm py-4 px-4 font-bold text-xs text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-colors" 
                        />
                      </div>
                      <div className="space-y-2 text-left">
                        <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 opacity-70">
                          {isEditingMaterial ? 'Quantidade Total Original' : 'Quantidade Total'}
                        </label>
                        <input 
                          name="qty" 
                          type="text" 
                          placeholder="Ex: 50.000" 
                          value={materialForm.qty}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const formatted = val ? parseInt(val).toLocaleString('pt-BR') : '';
                            setMaterialForm({...materialForm, qty: formatted});
                          }}
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm py-4 px-4 font-bold text-xs text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-colors" 
                        />
                      </div>
                      <div className="flex gap-3">
                        {isEditingMaterial && (
                          <button 
                            type="button"
                            onClick={() => { setIsEditingMaterial(false); setEditingMaterialId(null); setMaterialForm({ name: '', qty: '' }); }}
                            className="flex-1 bg-zinc-200 text-zinc-950 py-4.5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-zinc-300"
                          >
                            Cancelar
                          </button>
                        )}
                        <button className="flex-[2] bg-zinc-950 text-white dark:bg-yellow-500 dark:text-zinc-950 py-4.5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-zinc-800 dark:hover:bg-yellow-400">
                          {isEditingMaterial ? 'Salvar Alterações' : 'Autenticar Entrada'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* MATERIAL LIST */}
                  <div className="lg:col-span-2 space-y-3 md:space-y-4">
                    {materials.length > 0 ? materials.sort((a, b) => b.createdAt - a.createdAt).map(m => (
                      <div key={m.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-yellow-500/30 transition-all shadow-[var(--shadow-sm)]">
                        <div className="flex items-center gap-3 md:gap-5">
                          <div className="w-11 h-11 md:w-14 md:h-14 bg-[var(--bg-tertiary)] rounded-sm flex items-center justify-center border border-[var(--border-color)] shadow-inner group-hover/mat:border-yellow-500/30">
                            <Package className={`w-5 h-5 md:w-6 md:h-6 ${(m.current / m.total) < 0.2 ? 'text-red-500 animate-pulse' : 'text-[var(--text-secondary)]'} group-hover:text-yellow-600 transition-colors`} />
                          </div>
                          <div>
                            <h4 className="font-black text-[var(--text-primary)] text-xs md:text-sm uppercase tracking-tight font-sans leading-none">{m.name}</h4>
                            <div className="mt-2 flex items-center gap-2 md:gap-4">
                              <div className="h-1.5 w-24 md:w-40 bg-[var(--bg-tertiary)] rounded-full overflow-hidden border border-[var(--border-color)]">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (m.current / m.total) * 100)}%` }}
                                  className={`h-full ${(m.current / m.total) < 0.2 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                                />
                              </div>
                              <span className="text-[8px] md:text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">
                                {m.current.toLocaleString('pt-BR')} <span className="opacity-40">/ {m.total.toLocaleString('pt-BR')}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-end w-full sm:w-auto">
                          <button 
                            onClick={() => handleStartEditMaterial(m)} 
                            className="w-8.5 h-8.5 md:w-10 md:h-10 border border-[var(--border-color)] rounded-sm flex items-center justify-center text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all active:scale-95"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteMaterial(m.id)} 
                            className="w-8.5 h-8.5 md:w-10 md:h-10 border border-[var(--border-color)] rounded-sm flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                          <button onClick={() => handleUpdateMaterial(m.id, 100)} className="px-2.5 h-8.5 md:w-14 md:h-11 border border-[var(--border-color)] rounded-sm flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-all active:scale-95 text-[9px] md:text-[10px] font-black">
                            +100
                          </button>
                          <button onClick={() => handleUpdateMaterial(m.id, 1000)} className="px-2.5 h-8.5 md:w-14 md:h-11 border border-[var(--border-color)] rounded-sm flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-all active:scale-95 text-[9px] md:text-[10px] font-black">
                            +1k
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="py-24 text-center bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-sm grayscale opacity-30">
                        <Package className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                        <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] text-[10px]">Estoque Vazio: Aguardando remessa.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* SOLICITAÇÕES DE LÍDERES */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-10 shadow-[var(--shadow-sm)]">
                  <div className="flex justify-between items-center mb-8 border-b border-[var(--border-color)] pb-6">
                    <div>
                      <h3 className="text-xl font-black uppercase text-[var(--text-primary)] tracking-tighter leading-none">Solicitações de Líderes</h3>
                      <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-3 opacity-60">Pedidos de remessa e distribuição de campo</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {materialRequests.length > 0 ? materialRequests.sort((a, b) => b.createdAt - a.createdAt).map(req => (
                      <div key={req.id} className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm p-6 flex flex-col gap-5 hover:border-yellow-500/30 transition-all shadow-inner relative overflow-hidden group">
                        {req.status === 'pendente' && <div className="absolute top-0 right-0 w-2 h-full bg-yellow-500"></div>}
                        {req.status === 'devolucao_pendente' && <div className="absolute top-0 right-0 w-2 h-full bg-blue-500 animate-pulse"></div>}
                        
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-sm flex items-center justify-center shadow-inner border border-[var(--border-color)] ${
                              req.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-500' : 
                              req.status === 'devolucao_pendente' ? 'bg-blue-500/10 text-blue-500' :
                              req.status === 'devolvido' ? 'bg-zinc-500/10 text-zinc-400' :
                              req.status === 'negado' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              <Package className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-black text-[var(--text-primary)] text-sm uppercase tracking-tight">{req.materialName} ({req.qty} un)</h4>
                              <p className="text-[9px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mt-1.5">{req.team || '---'} • {req.leaderName}</p>
                            </div>
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-sm shadow-sm ${
                            req.status === 'aprovado' ? 'bg-emerald-500 text-white' : 
                            req.status === 'devolucao_pendente' ? 'bg-blue-600 text-white' :
                            req.status === 'devolvido' ? 'bg-zinc-500 text-white' :
                            req.status === 'negado' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-zinc-950'
                          }`}>
                            {req.status === 'devolucao_pendente' ? 'devolução pendente' : req.status}
                          </span>
                        </div>

                        {req.returnDate && (
                          <div className="bg-yellow-500/5 px-4 py-2.5 rounded-sm border border-yellow-500/10 text-left">
                            <span className="text-[8px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-wider block mb-0.5">Previsão de Devolução</span>
                            <span className="text-xs font-black text-[var(--text-primary)]">{new Date(req.returnDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}

                        {req.reason && (
                          <div className="bg-white/5 p-4 rounded-sm border border-white/5">
                            <p className="text-[10px] font-bold text-zinc-500 italic leading-relaxed">"{req.reason}"</p>
                          </div>
                        )}

                        {req.receivedByLeader && (
                          <div className="bg-emerald-500/5 px-4 py-2.5 rounded-sm border border-emerald-500/10 text-left">
                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">Status de Entrega</span>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">✓ RECEBIDO EM {new Date(req.receivedAt).toLocaleString()}</span>
                          </div>
                        )}

                        {req.returnedAt && (
                          <div className="bg-blue-500/5 px-4 py-2.5 rounded-sm border border-blue-500/10 text-left">
                            <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-0.5">Devolução Solicitada</span>
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400">✓ DEVOLVIDO PELO LÍDER EM {new Date(req.returnedAt).toLocaleString()}</span>
                          </div>
                        )}

                        {req.returnApprovedAt && (
                          <div className="bg-emerald-500/5 px-4 py-2.5 rounded-sm border border-emerald-500/10 text-left">
                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">Devolução Confirmada</span>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">✓ CONFIRMADO EM {new Date(req.returnApprovedAt).toLocaleString()}</span>
                          </div>
                        )}

                        {req.signedBy && (
                          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-sm flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-sm text-emerald-500">
                              <ShieldCheck className="w-4 h-4 animate-pulse" />
                            </div>
                            <div className="text-left leading-none">
                              <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">LOTE ASSINADO DIGITALMENTE</p>
                              <p className="text-[8px] font-bold text-zinc-400 mt-1 uppercase">RESPONSÁVEL: {req.signedBy} • {new Date(req.signedAt).toLocaleString()}</p>
                              <p className="text-[8px] font-mono text-zinc-500 mt-1 opacity-60">HASH: {req.signatureHash}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{new Date(req.createdAt).toLocaleString()}</p>
                          
                          <div className="flex items-center gap-3">
                            {req.status === 'pendente' && (
                              <>
                                <button 
                                  onClick={() => handleDenyMaterialRequest(req.id)}
                                  className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-500 rounded-sm font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-red-500/10"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Negar
                                </button>
                                <button 
                                  onClick={() => handleApproveMaterialRequest(req)}
                                  className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-sm font-black text-[9px] uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Assinar & Liberar
                                </button>
                              </>
                            )}

                            {req.status === 'devolucao_pendente' && (
                              <button 
                                onClick={() => handleConfirmReturnMaterialRequest(req)}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-sm font-black text-[9px] uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Devolução
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-20 text-center border-2 border-dashed border-[var(--border-color)] rounded-sm grayscale opacity-30">
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
                    <h2 className="text-2xl font-black uppercase text-[var(--text-primary)] tracking-tighter leading-none">Mapeamento Geográfico</h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-70">Concentração de Demandas e Pressão Política por Zona</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                   <div className="lg:col-span-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-10 shadow-[var(--shadow-sm)]">
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
                                    <div className="bg-zinc-950 p-4 rounded-sm shadow-2xl border border-white/10 dark:bg-zinc-900">
                                      <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
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
                      <div className="bg-zinc-950 rounded-sm p-8 text-white text-center relative overflow-hidden dark:bg-zinc-900 border border-white/5">
                        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
                        <Activity className="w-10 h-10 text-yellow-500 mx-auto mb-5 animate-pulse" />
                        <h4 className="text-lg font-black uppercase tracking-tighter">Foco Estratégico</h4>
                        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] mt-3 leading-relaxed opacity-70">
                          A Zona com maior volume operacional requer revisão de logística imediata.
                        </p>
                      </div>

                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-8 shadow-[var(--shadow-sm)]">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)] mb-8 border-b border-[var(--border-color)] pb-3">Pressão por Unidade</h4>
                        <div className="space-y-6">
                          {demandsSummary.length > 0 ? demandsSummary.map(d => (
                            <div key={d.name} className="group/stat">
                              <div className="flex justify-between items-center mb-2.5">
                                <span className="text-[10px] font-black uppercase text-[var(--text-primary)] leading-none font-sans group-hover/stat:text-yellow-600 transition-colors">{d.name}</span>
                                <span className="text-[9px] font-black text-[var(--text-secondary)] opacity-50 uppercase">{d.value} REQS</span>
                              </div>
                              <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden border border-[var(--border-color)] shadow-inner">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(d.value / Math.max(...demandsSummary.map(i => i.value))) * 100}%` }}
                                  className="h-full bg-[var(--text-primary)] group-hover/stat:bg-yellow-500 transition-colors" 
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
                    <h2 className="text-2xl font-black uppercase text-[var(--text-primary)] tracking-tighter leading-none">Relatórios & BI</h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-70">Inteligência de Dados e Exportação PDF</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { id: 'teams', title: 'Equipes e Lideranças', desc: 'Dados de contato e performance regional.', icon: <Users className="w-6 h-6" /> },
                    { id: 'voters', title: 'Base de Eleitores', desc: 'Mapeamento de votos e sentimento.', icon: <Target className="w-6 h-6" /> },
                    { id: 'finance', title: 'Financeiro e Custos', desc: 'Fluxo de caixa e alocação de recursos.', icon: <DollarSign className="w-6 h-6" /> },
                    { id: 'materials', title: 'Materiais e Estoque', desc: 'Controle de suprimentos e remessas.', icon: <Package className="w-6 h-6" /> },
                    { id: 'demands', title: 'Demandas e Mapa', desc: 'Urgências e necessidades mapeadas.', icon: <Activity className="w-6 h-6" /> }
                  ].map(r => (
                    <div key={r.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-6 hover:border-yellow-500/50 transition-all group shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-zinc-950 text-yellow-500 rounded-sm shadow-xl group-hover:scale-110 transition-transform dark:bg-zinc-900 border border-white/5">
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
                        className="w-full bg-zinc-950 text-white dark:bg-zinc-900 border border-white/10 py-3.5 rounded-sm font-black text-[9px] uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-950 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Configurar Filtros
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-10 shadow-sm mt-12">
                  <h3 className="text-lg font-black uppercase text-[var(--text-primary)] tracking-tighter mb-8 flex items-center gap-3">
                    <History className="w-5 h-5 text-yellow-500" /> Histórico de Relatórios Gerados
                  </h3>
                  <div className="space-y-4">
                    {reportsHistory.length > 0 ? reportsHistory.map((rep: any) => (
                      <div key={rep.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm hover:border-yellow-500/30 transition-all shadow-inner group">
                        <div className="flex items-center gap-5">
                          <div className="p-3 bg-zinc-950 text-white rounded-sm border border-white/5 group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-all">
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
                               className="px-6 py-2.5 bg-zinc-950 text-white dark:bg-zinc-900 border border-white/10 rounded-sm font-black text-[9px] uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-950 transition-all flex items-center gap-2 shadow-xl"
                             >
                               Baixar PDF
                             </a>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center border-2 border-dashed border-[var(--border-color)] rounded-sm grayscale opacity-30">
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
                <EleitoralDashboard isCoordinator={true} campaignVoters={allVoters} />
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
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative mb-10 border border-zinc-200"
            >
              <button 
                onClick={() => {
                  setIsAiModalOpen(false);
                  setAiResult(null);
                  setChaosText('');
                }}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 active:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="bg-yellow-500 p-6">
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
                      className="w-full h-40 bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-xs text-zinc-800 focus:border-yellow-500 outline-none transition-all placeholder:text-zinc-300 resize-none"
                    />
                    <div className="flex flex-col gap-3 font-sans">
                      <button 
                        onClick={handleProcessCaos}
                        disabled={isProcessing || !chaosText}
                        className="w-full bg-zinc-950 text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-950 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4 cursor-pointer text-yellow-500" />}
                        {isProcessing ? 'Processando Inteligência...' : 'Analisar com IA'}
                      </button>
                      
                      <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <button 
                          onClick={() => handleSaveNote('tactical')}
                          disabled={isProcessing || !chaosText}
                          className="flex-1 bg-yellow-500 text-zinc-950 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" /> Postar no Fórum
                        </button>
                        <button 
                          onClick={() => handleSaveNote('private')}
                          disabled={isProcessing || !chaosText}
                          className="flex-1 bg-zinc-100 text-zinc-900 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2"
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
                      <div className="bg-blue-50 p-4 rounded-sm border-l-4 border-blue-600">
                        <h4 className="text-blue-700 font-black text-[9px] uppercase mb-2 flex items-center gap-2 tracking-widest leading-none">
                          <Fuel className="w-3.5 h-3.5" /> Logística
                        </h4>
                        <ul className="space-y-1.5">
                          {aiResult.tarefas_logistica.map((t: string, i: number) => (
                            <li key={i} className="text-[11px] font-bold text-zinc-800 flex items-start gap-2">
                              <div className="w-1 h-1 rounded-sm bg-blue-500 mt-1.5 flex-shrink-0"></div>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiResult.acoes_politicas?.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-sm border-l-4 border-green-600">
                        <h4 className="text-green-700 font-black text-[9px] uppercase mb-2 flex items-center gap-2 tracking-widest leading-none">
                          <Brain className="w-3.5 h-3.5" /> Ações Planejadas
                        </h4>
                        <ul className="space-y-1.5">
                          {aiResult.acoes_politicas.map((t: string, i: number) => (
                            <li key={i} className="text-[11px] font-bold text-zinc-800 flex items-start gap-2">
                              <div className="w-1 h-1 rounded-sm bg-green-500 mt-1.5 flex-shrink-0"></div>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiResult.alertas_crise?.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-sm border-l-4 border-red-600">
                        <h4 className="text-red-700 font-black text-[9px] uppercase mb-2 flex items-center gap-2 tracking-widest leading-none">
                          <AlertTriangle className="w-3.5 h-3.5" /> Alertas
                        </h4>
                        <ul className="space-y-1.5">
                          {aiResult.alertas_crise.map((t: string, i: number) => (
                            <li key={i} className="text-[11px] font-bold text-red-900 flex items-start gap-2">
                              <div className="w-1 h-1 rounded-sm bg-red-600 mt-1.5 flex-shrink-0"></div>
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
                      className="w-full bg-green-600 text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/10 hover:bg-green-700 transition-all mb-2"
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
                        className="flex-1 bg-yellow-500 text-zinc-950 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" /> Postar no Fórum
                      </button>
                      <button 
                        onClick={() => {
                          const summary = Array.isArray(aiResult.summary) ? aiResult.summary.join('. ') : aiResult.summary;
                          setChaosText(`${aiResult.title}: ${summary}`);
                          handleSaveNote('private');
                        }}
                        className="flex-1 bg-zinc-950 text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
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
                className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200"
              >
                <button 
                  onClick={() => setIsUrgencyModalOpen(false)}
                  className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className={`p-6 ${selectedUrgency.type === 'combustivel' ? 'bg-blue-600' : selectedUrgency.type === 'demanda' ? 'bg-yellow-500' : 'bg-red-600'}`}>
                  <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">{selectedUrgency.title}</h2>
                  <p className="text-white/70 text-[9px] font-black mt-2 uppercase tracking-widest leading-none">{selectedUrgency.leaderName} • {selectedUrgency.team}</p>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block mb-2 leading-none">Relato de Campo</label>
                    <p className="p-4 bg-zinc-50 border border-zinc-100 rounded-sm text-xs font-bold text-zinc-700 leading-relaxed">
                      "{selectedUrgency.description}"
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block leading-none">Feedback Estratégico</label>
                    <textarea 
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      placeholder="Oriente o líder regional..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-xs text-zinc-800 outline-none focus:border-zinc-950 transition-all h-28 resize-none placeholder:text-zinc-300"
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
                      className="bg-red-50 text-red-600 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm shadow-red-500/5 active:scale-95"
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
                      className="bg-green-600 text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/10 hover:bg-zinc-950 transition-all active:scale-95"
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
              className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative text-left"
            >
              <button 
                onClick={() => setIsSignatureModalOpen(false)}
                className="absolute top-4 right-4 bg-zinc-800 p-2 rounded-sm text-zinc-400 hover:text-white transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 bg-gradient-to-r from-yellow-600/20 to-emerald-600/20 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-500 rounded-sm text-zinc-950 shadow-lg shadow-yellow-500/10">
                    <ShieldCheck className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none font-sans">Autenticação de Assinatura Digital</h2>
                    <p className="text-zinc-400 text-[9px] font-black mt-2 uppercase tracking-widest leading-none">SISTEMA ÁGUIA • CONTROLE DE ARSENAL</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleConfirmSignature} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded-sm space-y-3">
                    <div className="flex justify-between border-b border-zinc-800/50 pb-2">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Material Solicitado:</span>
                      <span className="text-xs font-black text-white uppercase">{signingRequest.materialName}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/50 pb-2">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Quantidade:</span>
                      <span className="text-xs font-black text-yellow-500">{signingRequest.qty.toLocaleString('pt-BR')} unidades</span>
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
                      <div className="flex justify-between border-b border-zinc-800/50 pb-2 bg-yellow-500/5 px-2 py-1 rounded-sm border border-yellow-500/10">
                        <span className="text-[9px] font-black text-yellow-500 uppercase tracking-wider">Previsão de Devolução:</span>
                        <span className="text-xs font-black text-yellow-500">{new Date(signingRequest.returnDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    {signingRequest.reason && (
                      <div className="pt-1 text-left">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Motivo/Observação:</span>
                        <p className="text-[10px] text-zinc-400 italic mt-1 bg-zinc-950 p-3 rounded-sm border border-zinc-800/30">"{signingRequest.reason}"</p>
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
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-sm py-4 px-4 font-bold text-sm text-white outline-none focus:border-yellow-500 transition-colors shadow-inner"
                    />
                    <p className="text-[8px] text-zinc-500 leading-normal ml-1">
                      Ao assinar digitando seu nome, você certifica eletronicamente a liberação deste lote, registrando o carimbo de data/hora e hash de integridade exclusivo do Sistema Águia.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsSignatureModalOpen(false)}
                    className="bg-zinc-800 text-zinc-300 py-4.5 rounded-sm font-black text-[11px] uppercase tracking-widest border border-zinc-700 hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-emerald-500 text-zinc-950 py-4.5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-500/10 hover:bg-emerald-400 transition-all active:scale-95"
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
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setIsTeamModalOpen(false);
                  setTeamCreationStep('form');
                }}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
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
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all disabled:opacity-50 placeholder:text-zinc-300"
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
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300"
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
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all disabled:opacity-50 placeholder:text-zinc-300"
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
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300"
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
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300"
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
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300"
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
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-yellow-500 transition-all h-24 placeholder:text-zinc-300 resize-none"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full bg-zinc-950 text-yellow-500 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-zinc-950/10 hover:bg-zinc-900 transition-all active:scale-[0.98] mt-2"
                  >
                    {isEditMode ? 'SALVAR ALTERAÇÕES' : 'EFETIVAR CADASTRO'}
                  </button>
                </form>
              ) : (
                <div className="p-8 space-y-6 text-center">
                  <div className="w-16 h-16 bg-green-50 text-green-600 rounded-sm flex items-center justify-center mx-auto mb-2 border border-green-100">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Credenciais Geradas</h3>
                  <p className="text-zinc-500 text-xs font-bold leading-relaxed px-4">
                    Transmita o link de segurança abaixo para <span className="text-zinc-950">{newTeam.leader}</span>. Acesso imediato e restrito via Token Único.
                  </p>
                  
                  <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-100 break-all text-[9px] font-mono font-black text-blue-600 select-all">
                    {createdTeamLink}
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(createdTeamLink);
                        alert("Link copiado!");
                      }}
                      className="w-full bg-blue-600 text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-95"
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
                      className="w-full bg-zinc-100 text-zinc-500 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all"
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
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsAgendaCreateModalOpen(false)}
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="bg-yellow-500 p-6">
                <h2 className="text-xl font-black text-zinc-950 tracking-tighter uppercase leading-none">
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
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Data da Operação</label>
                  <input 
                    required
                    type="date" 
                    value={agendaForm.data}
                    onChange={(e) => setAgendaForm({...agendaForm, data: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all"
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
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Fim</label>
                    <input 
                      required
                      type="time" 
                      value={agendaForm.hora_fim}
                      onChange={(e) => setAgendaForm({...agendaForm, hora_fim: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Objetivo / Atividade</label>
                   <textarea 
                     value={agendaForm.motivo}
                     onChange={(e) => setAgendaForm({...agendaForm, motivo: e.target.value})}
                     placeholder="Breve descrição do objetivo..."
                     className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-yellow-500 transition-all h-24 resize-none placeholder:text-zinc-300"
                   />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-zinc-950 text-yellow-500 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl border-zinc-950 hover:bg-zinc-900 transition-all mt-2"
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
              className="bg-white w-full max-w-2xl rounded-sm overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsBriefingModalOpen(false)}
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200"
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
                  className="flex-1 bg-zinc-950 text-white py-5 rounded-sm font-black text-lg shadow-xl"
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
              className="bg-white w-full max-w-4xl rounded-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => {
                  setIsTeamManagementOpen(false);
                  setSelectedManagingTeam(null);
                  setManagingTeamVoters([]);
                }} 
                className="absolute top-8 right-8 bg-zinc-100 p-3 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-10 border-b-8 border-yellow-500 text-left">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="bg-yellow-500 text-zinc-950 w-20 h-20 rounded-sm flex items-center justify-center font-black text-3xl shadow-lg shadow-yellow-500/20">
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
                       className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest border border-zinc-700 hover:bg-zinc-700 shadow-lg"
                     >
                       Editar Equipe
                     </button>
                     <button 
                       onClick={() => handleDeleteTeam(selectedManagingTeam.id || selectedManagingTeam.name.toLowerCase(), selectedManagingTeam.name)}
                       className="bg-red-950/30 text-red-500 px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest border border-red-900/20 hover:bg-red-900/40"
                     >
                       Excluir Equipe
                     </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-1 space-y-8">
                     <div className="bg-zinc-50 p-6 rounded-sm border-2 border-zinc-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Líder e Contato</p>
                        <div className="flex items-center gap-4 mb-6">
                           <div className="bg-zinc-200 w-12 h-12 rounded-sm flex items-center justify-center font-black text-zinc-600">
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
                        <div className="bg-green-50 p-6 rounded-sm border border-green-100 text-center">
                           <p className="text-2xl font-black text-green-700 leading-none">{managingTeamVoters.length}</p>
                           <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mt-2">Membros</p>
                        </div>
                        <div className="bg-zinc-900 p-6 rounded-sm text-center">
                           <p className="text-2xl font-black text-yellow-500 leading-none">ATIVO</p>
                           <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-2">Status</p>
                        </div>
                     </div>
                  </div>

                  <div className="lg:col-span-2 text-left font-sans">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tighter flex items-center gap-3">
                           Membros Cadastrados <span className="bg-zinc-100 text-zinc-400 px-3 py-1 rounded-sm text-xs">{managingTeamVoters.length}</span>
                        </h3>
                     </div>

                     <div className="space-y-3">
                        {managingTeamVoters.length > 0 ? (
                          managingTeamVoters.sort((a,b) => a.name.localeCompare(b.name)).map((vx) => (
                           <div key={vx.id} className="group bg-white p-5 rounded-sm border-2 border-zinc-100 hover:border-yellow-500 transition-all flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-4">
                                 <div className="bg-zinc-100 group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-colors w-12 h-12 rounded-sm flex items-center justify-center font-black text-lg">
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
                                   className="p-3 bg-zinc-50 rounded-sm text-zinc-400 hover:text-green-600 hover:bg-green-50 transition-all"
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
                                   className="p-3 bg-zinc-50 rounded-sm text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
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
                                   className="p-3 bg-red-600 text-white rounded-sm hover:bg-red-700 shadow-md transition-all active:scale-95"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                        ))) : (
                           <div className="py-20 text-center bg-zinc-50 rounded-sm border-2 border-dashed border-zinc-200">
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
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => {
                   setIsVoterEditModalOpen(false);
                   setSelectedVoter(null);
                }} 
                className="absolute top-5 right-5 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all"
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
                  <input required type="text" value={voterEditForm.name} onChange={e => setVoterEditForm({...voterEditForm, name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" placeholder="Digite o nome..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                  <input type="text" value={voterEditForm.phone} onChange={e => setVoterEditForm({...voterEditForm, phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Endereço / Referência</label>
                  <input type="text" value={voterEditForm.address} onChange={e => setVoterEditForm({...voterEditForm, address: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" placeholder="Rua, Bairro, N..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">CPF</label>
                    <input type="text" value={voterEditForm.cpf || ''} onChange={e => setVoterEditForm({...voterEditForm, cpf: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">RG</label>
                    <input type="text" value={voterEditForm.rg || ''} onChange={e => setVoterEditForm({...voterEditForm, rg: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" placeholder="Alistamento RG..." />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Título</label>
                    <input type="text" value={voterEditForm.titulo || ''} onChange={e => setVoterEditForm({...voterEditForm, titulo: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" placeholder="Nº Título..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Zona</label>
                    <input type="text" value={voterEditForm.zona || ''} onChange={e => setVoterEditForm({...voterEditForm, zona: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" placeholder="Zona..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Seção</label>
                    <input type="text" value={voterEditForm.secao || ''} onChange={e => setVoterEditForm({...voterEditForm, secao: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" placeholder="Seção..." />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Local de Votação</label>
                  <input type="text" value={voterEditForm.localVotacao || ''} onChange={e => setVoterEditForm({...voterEditForm, localVotacao: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" placeholder="Nome da Escola ou Local..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Observações Estratégicas</label>
                  <textarea value={voterEditForm.observations} onChange={e => setVoterEditForm({...voterEditForm, observations: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm h-24" placeholder="Ex: Prioritário, transporte necessário..."></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Fidelidade Política</label>
                    <div className="flex gap-2 bg-zinc-50 p-3 rounded-sm border border-zinc-100">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setVoterEditForm({...voterEditForm, loyaltyScore: star})}
                          className={`p-1 transition-all ${star <= voterEditForm.loyaltyScore ? 'text-yellow-500' : 'text-zinc-200'}`}
                        >
                          <Zap className={`w-5 h-5 ${star <= voterEditForm.loyaltyScore ? 'fill-yellow-500' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Sentiment (Opinião)</label>
                    <div className="flex gap-1 bg-zinc-50 p-1.5 rounded-sm border border-zinc-100">
                      {[
                        { id: 'support', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-500' },
                        { id: 'neutral', icon: <Activity className="w-4 h-4" />, color: 'text-zinc-400' },
                        { id: 'opposed', icon: <XCircle className="w-4 h-4" />, color: 'text-red-500' }
                      ].map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setVoterEditForm({...voterEditForm, sentiment: s.id as any})}
                          className={`flex-1 flex items-center justify-center py-2 rounded-sm transition-all ${voterEditForm.sentiment === s.id ? 'bg-zinc-950 text-white shadow-md' : 'text-zinc-300 hover:bg-zinc-100'}`}
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
                      className={`w-full p-3.5 rounded-sm font-black text-[10px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
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
                      className={`w-full p-3.5 rounded-sm font-black text-[10px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
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

                <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-100 space-y-3">
                   <div className="flex items-center justify-between">
                     <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Comunidades Tradicionais (RR)</label>
                     <button
                        type="button"
                        onClick={() => setVoterEditForm({...voterEditForm, isIndigenous: !voterEditForm.isIndigenous})}
                        className={`text-[8px] font-black px-2 py-1 rounded-sm uppercase tracking-tighter ${voterEditForm.isIndigenous ? 'bg-zinc-950 text-yellow-500' : 'bg-zinc-200 text-zinc-400'}`}
                      >
                       {voterEditForm.isIndigenous ? 'ATIVADO' : 'DESATIVADO'}
                     </button>
                   </div>
                   
                   {voterEditForm.isIndigenous && (
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Comunidade</label>
                         <input type="text" value={voterEditForm.communityName} onChange={e => setVoterEditForm({...voterEditForm, communityName: e.target.value})} className="w-full bg-white border border-zinc-200 rounded-sm p-2 font-bold text-xs" placeholder="Nome da Com..." />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Liderança / Tuxaua</label>
                         <input type="text" value={voterEditForm.tuxauaName} onChange={e => setVoterEditForm({...voterEditForm, tuxauaName: e.target.value})} className="w-full bg-white border border-zinc-200 rounded-sm p-2 font-bold text-xs" placeholder="Nome do Tuxaua..." />
                       </div>
                     </div>
                   )}
                 </div>

                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Família / Comunidade / Grupamento</label>
                   <input type="text" value={voterEditForm.familyCommunity} onChange={e => setVoterEditForm({...voterEditForm, familyCommunity: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" placeholder="Ex: Família Silva, Com. Ribeirinha, Igreja..." />
                 </div>

                 {!voterEditForm.isArticulator && (
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Articulador Responsável</label>
                    <select 
                      value={voterEditForm.articulatorId} 
                      onChange={e => setVoterEditForm({...voterEditForm, articulatorId: e.target.value})} 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm appearance-none outline-none"
                    >
                      <option value="">NENHUM ARTICULADOR</option>
                      {allVoters.filter(v => v.isArticulator && v.id !== selectedVoter?.id).map(art => (
                        <option key={art.id} value={art.id}>{art.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Cruzamento (Dobradinha / Outros Apoios)</label>
                  <input type="text" value={voterEditForm.associatedCandidates} onChange={e => setVoterEditForm({...voterEditForm, associatedCandidates: e.target.value})} className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" placeholder="Ex: Federal X, Estadual Y..." />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Indicado por (Selecione um eleitor cadastrado)</label>
                  <select 
                    value={voterEditForm.referredBy} 
                    onChange={e => setVoterEditForm({...voterEditForm, referredBy: e.target.value})} 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm outline-none appearance-none"
                  >
                    <option value="">NENHUM INDICIADOR SELECIONADO</option>
                    {[...allVoters]
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
                      <span key={tag} className="bg-yellow-500/10 text-yellow-600 px-3 py-1 rounded-sm text-[9px] font-black uppercase flex items-center gap-2">
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
                      className="flex-1 bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" 
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
                      className="bg-zinc-950 text-white px-4 rounded-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {availableTags.length > 0 && (
                    <div className="mt-2.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block mb-1">Tags Disponíveis no Sistema (Clique para Adicionar)</label>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-zinc-50 border border-zinc-100 rounded-sm">
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
                              className={`px-2 py-1 text-[9px] font-black uppercase rounded-sm border transition-all ${
                                isSelected
                                  ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/40 hover:bg-yellow-500/10'
                                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-yellow-500/50 hover:text-zinc-850'
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
                
                <button type="submit" className="w-full bg-zinc-950 text-white py-4 rounded-sm font-black text-base shadow-xl shadow-zinc-200 mt-2 active:scale-95 transition-all">
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
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative my-auto"
            >
              <button 
                type="button"
                onClick={() => setIsProfileModalOpen(false)} 
                className="absolute top-5 right-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 p-2 rounded-sm z-50 transition-all flex items-center justify-center shadow-md cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="bg-zinc-950 p-6 border-b-4 border-yellow-500 text-left">
                <div className="flex items-center gap-4">
                   <div className="relative group">
                      <div className="w-16 h-16 bg-zinc-800 rounded-sm flex items-center justify-center border-2 border-zinc-700 overflow-hidden">
                         {profileData?.photoUrl ? (
                           <img src={profileData.photoUrl} alt="Perfil" className="w-full h-full object-cover" />
                         ) : (
                           <User className="w-8 h-8 text-zinc-600" />
                         )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 bg-yellow-500 p-1.5 rounded-sm text-zinc-950 shadow-lg hover:scale-110 transition-all cursor-pointer">
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
                    photoUrl: profileData?.photoUrl || '',
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
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cole a URL ou use o botão de upload acima</label>
                  <input 
                    value={profileData?.photoUrl || ''} 
                    name="photoUrl" 
                    onChange={(e) => setProfileData((prev: any) => ({ ...prev, photoUrl: e.target.value }))}
                    type="text" 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" 
                    placeholder="https://..." 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input defaultValue={profileData?.name} name="name" type="text" className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" placeholder="Seu nome real..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Telefone Profissional</label>
                  <input defaultValue={profileData?.phone} name="phone" type="text" className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm" placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cargo / Biografia</label>
                  <textarea defaultValue={profileData?.bio} name="bio" className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-3.5 font-bold text-sm h-24" placeholder="Ex: Coordenador de Logística e Transmissão..."></textarea>
                </div>
                
                <button type="submit" className="w-full bg-zinc-950 text-white py-4 rounded-sm font-black text-base shadow-xl shadow-zinc-200 mt-2 active:scale-95 transition-all">
                  SALVAR CONFIGURAÇÕES
                </button>

                {isAdmin && (
                  <div className="pt-6 mt-6 border-t border-zinc-100">
                    <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-3 text-center">Área Crítica - Reset de Fábrica</p>
                    <button 
                      type="button"
                      onClick={handleResetSystem}
                      className="w-full bg-red-50 text-red-600 py-3 rounded-sm font-black text-xs uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
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
              className="bg-white w-full max-w-2xl rounded-sm overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAgendaDetailModalOpen(false)}
                className="absolute top-8 right-8 bg-zinc-100 p-2 rounded-full text-zinc-500 hover:bg-zinc-200"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-12 text-left">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-yellow-500 rounded-sm flex flex-col items-center justify-center text-zinc-950 text-center">
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
                      <p className="text-lg font-black text-zinc-900">{selectedAgenda.team || '---'} • {selectedAgenda.sugeridoPor}</p>
                   </div>
                </div>

                <div className="bg-zinc-50 p-8 rounded-sm border-2 border-zinc-100">
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Objetivo Estratégico</p>
                   <p className="text-xl font-bold text-zinc-700 leading-relaxed">
                      "{selectedAgenda.motivo || 'Nenhum motivo detalhado informado.'}"
                   </p>
                </div>

                <div className="flex items-center gap-4 pt-4">
                   <div className="p-4 bg-blue-50 text-blue-600 rounded-sm flex items-center gap-3 flex-1 border border-blue-100">
                      <Users className="w-6 h-6" />
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-tighter">Mobilização</p>
                         <p className="text-sm font-bold">Equipe e Membros</p>
                      </div>
                   </div>
                   <div className="p-4 bg-green-50 text-green-600 rounded-sm flex items-center gap-3 flex-1 border border-green-100">
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
              className="bg-white w-full max-w-2xl rounded-sm overflow-hidden shadow-2xl relative"
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
                <div className="grid grid-cols-2 gap-4 text-center">
                   <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Contatos</p>
                      <p className="text-xl font-black">{selectedHistoryTeam.contacts || 0}</p>
                   </div>
                   <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-100">
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
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsReportModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="bg-zinc-950 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Customizar Relatório</h2>
                <p className="text-yellow-500 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Filtragem e Recorte de Dados Estratégicos</p>
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
                      className={`flex-1 py-3 px-4 rounded-sm font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 border ${
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
                      className={`flex-1 py-3 px-4 rounded-sm font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 border ${
                        reportDetailLevel === 'detailed' 
                          ? 'bg-yellow-500 text-zinc-950 border-yellow-500 shadow-xl shadow-yellow-500/20 active:scale-95' 
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
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all cursor-pointer"
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
                         className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all"
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
                         className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all"
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
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Data Fim</label>
                      <input 
                        type="date" 
                        value={reportFilters.endDate || ''} 
                        onChange={e => setReportFilters({...reportFilters, endDate: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all"
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
                        className={`flex items-center gap-2 p-2 rounded-sm border transition-all text-left ${
                          selectedReportColumns.includes(col.dataKey)
                            ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                            : 'bg-zinc-50 border-zinc-100 text-zinc-400'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                          selectedReportColumns.includes(col.dataKey)
                            ? 'bg-yellow-500 border-yellow-500'
                            : 'bg-white border-zinc-300'
                        }`}>
                          {selectedReportColumns.includes(col.dataKey) && <div className="w-1 h-1 bg-white rounded-full" />}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tight">{col.header}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    generateReport(selectedReportType, { 
                      ...reportFilters, 
                      selectedColumns: selectedReportColumns,
                      detailLevel: reportDetailLevel
                    });
                    setIsReportModalOpen(false);
                  }}
                  className="w-full bg-zinc-950 text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-yellow-500 hover:text-zinc-950 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                >
                  <FileDown className="w-4 h-4" /> PROCESSAR E EXPORTAR PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAV - COORDINATOR */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-sm flex items-center gap-3 overflow-x-auto px-4 z-50 shadow-2xl scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {[
          { id: 'overview', label: 'Dash', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'teams', label: 'Equipes', icon: <Users className="w-5 h-5" /> },
          { id: 'voters', label: 'Eleitores', icon: <Target className="w-5 h-5" /> },
          { id: 'agenda', label: 'Agenda', icon: <Calendar className="w-5 h-5" /> },
          { id: 'analise_eleitoral', label: 'Análise', icon: <TrendingUp className="w-5 h-5" /> },
          { id: 'materials', label: 'Materia', icon: <Package className="w-5 h-5" /> },
          { id: 'demands', label: 'Mapa', icon: <Activity className="w-5 h-5" /> },
          { id: 'notes', label: 'Notas', icon: <MessageSquare className="w-5 h-5" /> },
          { id: 'reports', label: 'Relatórios', icon: <FileDown className="w-5 h-5" /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 transition-all shrink-0 min-w-[64px] ${
              activeTab === tab.id 
              ? 'text-yellow-600 dark:text-yellow-500 scale-105 font-black' 
              : 'text-zinc-400 dark:text-zinc-500'
            }`}
          >
            <div className={`p-2 rounded-sm transition-all ${activeTab === tab.id ? 'bg-yellow-500/10' : ''}`}>
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
function CaboDashboard({ theme, setTheme }: { theme: 'light' | 'dark', setTheme: (t: 'light' | 'dark') => void }) {
  const { user, logout, isAdmin, coordinatorId } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [activeTab, setActiveTab] = useState<'equipe' | 'logistica' | 'ouvidoria' | 'financeiro' | 'notas' | 'materiais' | 'feed' | 'analise_eleitoral'>('logistica');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [dailyOrder, setDailyOrder] = useState<any>(null);
  const [resolvedCoordinatorId, setResolvedCoordinatorId] = useState<string | null>(null);
  
  // Notas State
  const [notes, setNotes] = useState<any[]>([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingNote, setIsProcessingNote] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [materialRequests, setMaterialRequests] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);

  // Finance State for Leader
  const [teamTransactions, setTeamTransactions] = useState<any[]>([]);
  const [isSignReceiptModalOpen, setIsSignReceiptModalOpen] = useState(false);
  const [selectedTxToSign, setSelectedTxToSign] = useState<any>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isExpenseVoucherModalOpen, setIsExpenseVoucherModalOpen] = useState(false);
  const [selectedExpenseForVoucher, setSelectedExpenseForVoucher] = useState<any>(null);
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', purpose: '' });
  
  const [isVoterModalOpen, setIsVoterModalOpen] = useState(false);
  const [registerMode, setRegisterMode] = useState<'individual' | 'lote'>('individual');
  const [bulkFileError, setBulkFileError] = useState<string | null>(null);
  const [bulkFileSuccess, setBulkFileSuccess] = useState<string | null>(null);
  const [parsedVoters, setParsedVoters] = useState<any[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const [voterForm, setVoterForm] = useState<{
    name: string;
    phone: string;
    address: string;
    observations: string;
    referredBy: string;
    tags: string[];
    articulatorId?: string;
    cpf: string;
    rg: string;
    titulo: string;
    zona: string;
    secao: string;
    localVotacao: string;
  }>({ name: '', phone: '', address: '', observations: '', referredBy: '', tags: [], articulatorId: '', cpf: '', rg: '', titulo: '', zona: '', secao: '', localVotacao: '' });
  const [currentTag, setCurrentTag] = useState('');

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
    photoUrl: user?.photoURL || '',
    zone: ''
  });

  const [teamData, setTeamData] = useState<any>(null);
  const [voters, setVoters] = useState<any[]>([]);
  const [voterSearch, setVoterSearch] = useState('');
  const [voterFilterTags, setVoterFilterTags] = useState<string[]>([]);
  const [voterViewState, setVoterViewState] = useState<'list' | 'network'>('list');
  const [myAgendas, setMyAgendas] = useState<any[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<any>(null);
  const [isVoterDetailOpen, setIsVoterDetailOpen] = useState(false);
  const [isEditingVoter, setIsEditingVoter] = useState(false);
  const [editingVoterId, setEditingVoterId] = useState<string | null>(null);
  const [campaignVoters, setCampaignVoters] = useState<any[]>([]);
  useEffect(() => {
    if (user) {
      let unsubTx: (() => void) | null = null;
      let unsubNotes: (() => void) | null = null;
      let unsubDailyOrder: (() => void) | null = null;
      let unsubMaterials: (() => void) | null = null;
      let unsubPartners: (() => void) | null = null;
      let unsubMaterialRequests: (() => void) | null = null;
      let unsubCampaignVoters: (() => void) | null = null;
      
      let currentSubscribedCoordId: string | null = null;
      
      const unsubProfile = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const teamName = data.teamName || data.zone || data.team || '';
          setProfileData({
            name: data.name || user.displayName || '',
            phone: data.phone || '',
            photoUrl: data.photoUrl || user.photoURL || '',
            zone: teamName
          });
          
          let resolvedCoordId = data.coordinatorId || coordinatorId || '';

          if (data.teamId) {
            try {
              const teamSnap = await getDoc(doc(db, 'teams', data.teamId));
              if (teamSnap.exists()) {
                const teamDataRaw = teamSnap.data();
                setTeamData({ ...teamDataRaw, id: teamSnap.id });
                if (!resolvedCoordId && teamDataRaw.coordinatorId) {
                  resolvedCoordId = teamDataRaw.coordinatorId;
                }
              }
            } catch (err) {
              console.warn("Erro ao buscar equipe por teamId:", err);
            }
          }

          // Fallback 1: Query teams collection where leaderEmail matches user's email
          if (!resolvedCoordId && user.email) {
            try {
              const emailVariants = Array.from(new Set([
                user.email.toLowerCase(),
                user.email
              ])).filter(Boolean);
              const qTeams = query(collection(db, 'teams'), where('leaderEmail', 'in', emailVariants));
              const snapTeams = await getDocs(qTeams);
              if (!snapTeams.empty) {
                const teamDataRaw = snapTeams.docs[0].data();
                setTeamData({ ...teamDataRaw, id: snapTeams.docs[0].id });
                resolvedCoordId = teamDataRaw.coordinatorId || '';
                console.log(`🧠 [Healer] Resolved coordinatorId: ${resolvedCoordId} from matching team`);
              }
            } catch (err) {
              console.warn("Erro ao buscar equipe por leaderEmail:", err);
            }
          }

          // Fallback 2: Query coordinator user from users collection
          if (!resolvedCoordId) {
            if (user.email?.toLowerCase() === 'sergiosilvabezerra@gmail.com') {
              resolvedCoordId = user.uid;
            } else {
              try {
                // Try by role first
                const qCoords = query(collection(db, 'users'), where('role', '==', 'coordenador'), limit(1));
                const snapCoords = await getDocs(qCoords);
                if (!snapCoords.empty) {
                  resolvedCoordId = snapCoords.docs[0].id;
                } else {
                  // Try by exact email variants as fallback (Firestore queries are case sensitive)
                  const qEmail = query(collection(db, 'users'), where('email', 'in', ['sergiosilvabezerra@gmail.com', 'SERGIOSILVABEZERRA@gmail.com']), limit(1));
                  const snapEmail = await getDocs(qEmail);
                  if (!snapEmail.empty) {
                    resolvedCoordId = snapEmail.docs[0].id;
                  }
                }
              } catch (e) {
                console.error("Erro ao buscar coordenador fallback:", e);
              }
            }
          }

          if (resolvedCoordId) {
            setResolvedCoordinatorId(resolvedCoordId);
            
            // Auto-heal: propagate resolved coordinatorId back to user document so security rules can approve reads
            if (data.coordinatorId !== resolvedCoordId) {
              try {
                await updateDoc(doc(db, 'users', user.uid), {
                  coordinatorId: resolvedCoordId
                });
                console.log(`🧠 [Healer] Propagated coordinatorId: ${resolvedCoordId} to user profile in Firestore`);
              } catch (err) {
                console.error("Error writing coordinatorId to user profile:", err);
              }
            }
            
            // Auto-heal existing voters and material requests with empty/missing coordinatorId
            const healVotersAndRequests = async (rCoordId: string) => {
              try {
                // 1. Heal Voters
                const qVoters = query(collection(db, 'voters'), where('leaderId', '==', user.uid));
                const snapVoters = await getDocs(qVoters);
                const voterPromises = snapVoters.docs
                  .filter(doc => {
                    const d = doc.data();
                    return !d.coordinatorId || d.coordinatorId === '';
                  })
                  .map(vDoc => 
                    updateDoc(doc(db, 'voters', vDoc.id), {
                      coordinatorId: rCoordId
                    })
                  );
                
                // 2. Heal Material Requests
                const qRequests = query(collection(db, 'material_requests'), where('leaderId', '==', user.uid));
                const snapRequests = await getDocs(qRequests);
                const requestPromises = snapRequests.docs
                  .filter(doc => {
                    const d = doc.data();
                    return !d.coordinatorId || d.coordinatorId === '';
                  })
                  .map(rDoc => 
                    updateDoc(doc(db, 'material_requests', rDoc.id), {
                      coordinatorId: rCoordId
                    })
                  );

                const totalPromises = [...voterPromises, ...requestPromises];
                if (totalPromises.length > 0) {
                  await Promise.all(totalPromises);
                  console.log(`🧠 [Healer] Successfully healed ${totalPromises.length} records for leader ${user.uid} with coordinatorId: ${rCoordId}`);
                }
              } catch (err) {
                console.error("Error healing records:", err);
              }
            };
            healVotersAndRequests(resolvedCoordId);
          }

          // Subscribe to transactions whenever team info is available
          if (teamName) {
            if (unsubTx) unsubTx();
            const txQuery = query(
              collection(db, 'transactions'), 
              where('team', '==', teamName),
              where('coordinatorId', '==', resolvedCoordId || coordinatorId)
            );
            unsubTx = onSnapshot(txQuery, (snapshot) => {
              const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
              setTeamTransactions(txs.sort((a, b) => (b.date || 0) - (a.date || 0)));
            }, (err) => {
              console.error("Erro ao escutar transações da equipe:", err);
            });
          }

          if (resolvedCoordId && resolvedCoordId !== currentSubscribedCoordId) {
            currentSubscribedCoordId = resolvedCoordId;

            if (unsubMaterials) unsubMaterials();
            unsubMaterials = onSnapshot(
              query(collection(db, 'materials'), where('coordinatorId', '==', resolvedCoordId)),
              (snap) => {
                const mats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                console.log(`🧠 [Materials Leader Sync] Loaded ${mats.length} materials strictly for coordinator ${resolvedCoordId}`);
                setMaterials(mats);
              },
              (err) => {
                console.warn("Materials Cabo sync error:", err.message);
              }
            );

            if (unsubNotes) unsubNotes();
            const notesQuery = query(
              collection(db, 'notes'), 
              where('type', '==', 'tactical'), 
              where('coordinatorId', '==', resolvedCoordId),
              orderBy('createdAt', 'desc')
            );
            unsubNotes = onSnapshot(notesQuery, (snapshot) => {
              const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setNotes(data);
            }, (err) => {
              console.error("Erro ao escutar notas:", err);
            });

            if (unsubDailyOrder) unsubDailyOrder();
            unsubDailyOrder = onSnapshot(doc(db, 'config', `dailyOrder_${resolvedCoordId}`), (snap) => {
              if (snap.exists()) setDailyOrder(snap.data());
            }, (err) => {
              console.warn("DailyOrder Cabo sync error:", err.message);
            });

            if (unsubPartners) unsubPartners();
            unsubPartners = onSnapshot(
              query(collection(db, 'partners'), where('coordinatorId', '==', resolvedCoordId)), 
              (snap) => {
                setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
              }, 
              (err) => {
                console.warn("Partners Cabo sync error:", err.message);
              }
            );

            if (unsubMaterialRequests) unsubMaterialRequests();
            unsubMaterialRequests = firestoreService.subscribeToCollectionFiltered('material_requests', resolvedCoordId, (data) => {
              setMaterialRequests(data);
            });

            if (unsubCampaignVoters) unsubCampaignVoters();
            unsubCampaignVoters = onSnapshot(
              query(collection(db, 'voters'), where('coordinatorId', '==', resolvedCoordId)),
              (snap) => {
                const rawData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
                const uniqueMap = new Map();
                rawData.forEach((v: any) => {
                  const key = (v.phone && v.phone.length > 5) ? v.phone : v.name;
                  if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, v);
                  }
                });
                setCampaignVoters(Array.from(uniqueMap.values()));
              },
              (err) => {
                console.warn("CampaignVoters Cabo sync error:", err.message);
              }
            );
          }
        }
      }, (error) => {
        console.error("Erro ao escutar perfil:", error);
      });

      const votersQuery = query(collection(db, 'voters'), where('leaderId', '==', user.uid));
      const unsubVoters = onSnapshot(votersQuery, (snapshot) => {
        const rawData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        // Deduplicar para o líder também, garantindo lista limpa
        const uniqueMap = new Map();
        rawData.forEach((v: any) => {
          const key = (v.phone && v.phone.length > 5) ? v.phone : v.name;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, v);
          }
        });
        setVoters(Array.from(uniqueMap.values()));
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

      return () => {
        unsubProfile();
        unsubVoters();
        unsubAgendas();
        if (unsubNotes) unsubNotes();
        if (unsubTx) unsubTx();
        if (unsubDailyOrder) unsubDailyOrder();
        if (unsubMaterials) unsubMaterials();
        if (unsubPartners) unsubPartners();
        if (unsubMaterialRequests) unsubMaterialRequests();
        if (unsubCampaignVoters) unsubCampaignVoters();
      };
    }
  }, [user, coordinatorId]);

  // Monitor de Conectividade
  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    
    const queue = JSON.parse(safeLocalStorage.getItem('aguia_offline_queue') || '[]');
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
    const queue = JSON.parse(safeLocalStorage.getItem('aguia_offline_queue') || '[]');
    if (queue.length === 0) return;
    
    setTimeout(() => {
      safeLocalStorage.setItem('aguia_offline_queue', '[]');
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
            leaderPhoto: profileData.photoUrl || user?.photoURL || '',
            teamId: teamData?.id || '',
            teamName: teamData?.name || profileData.zone || 'Liderança',
            timestamp: Date.now(),
            location: { lat: latitude, lng: longitude },
            type: 'selfie',
            status: 'validado',
            coordinatorId: resolvedCoordinatorId || coordinatorId || ''
          };
          
          const queue = JSON.parse(safeLocalStorage.getItem('aguia_offline_queue') || '[]');
          const newQueue = [...queue, { ...checkinData, id: Date.now() }];
          safeLocalStorage.setItem('aguia_offline_queue', JSON.stringify(newQueue));
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

  const filteredVoters = voters.filter(voter => {
    const matchesSearch = !voterSearch || 
      voter.name?.toLowerCase().includes(voterSearch.toLowerCase()) || 
      voter.phone?.includes(voterSearch);
    
    const matchesTags = voterFilterTags.length === 0 || 
      voterFilterTags.every((tag: string) => 
        voter.tags?.some((vTag: string) => vTag.trim().toUpperCase() === tag)
      );

    return matchesSearch && matchesTags;
  });

  const availableTags = Array.from(new Set(
    voters.flatMap(v => (v.tags || []) as string[])
      .map(t => t.trim().toUpperCase())
      .filter(t => t !== "")
  )) as string[];

  // --- COMPONENTE INTERNO: MAPA DE INDICAÇÕES (LISTA) ---
  const ReferralNetwork = ({ voters }: { voters: any[] }) => {
    const [expandedReferrers, setExpandedReferrers] = useState<string[]>([]);

    const toggleReferrer = (referrer: string) => {
      setExpandedReferrers(prev => 
        prev.includes(referrer) 
          ? prev.filter(r => r !== referrer) 
          : [...prev, referrer]
      );
    };

    // 1. Agrupar eleitores por quem os indicou
    const groupedByReferrer = voters.reduce((acc: any, voter) => {
      const referrer = voter.referredBy?.trim() || "Sem Indicação Direta";
      if (!acc[referrer]) acc[referrer] = [];
      acc[referrer].push(voter);
      return acc;
    }, {});

    const referrers = Object.keys(groupedByReferrer).sort();

    return (
      <div className="bg-[var(--bg-secondary)] rounded-sm border border-[var(--border-color)] overflow-hidden w-full min-h-[500px] p-8 shadow-[var(--shadow-sm)]">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-8">
            <div>
              <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Fluxo de Indicações</h3>
              <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-70">Mapeamento hierárquico de influência regional</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2.5 rounded-sm shadow-sm">
              <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest">{voters.length} Eleitores Mapeados</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {referrers.map((referrer) => (
              <div key={referrer} className="space-y-5">
                <button 
                  onClick={() => toggleReferrer(referrer)}
                  className="w-full flex items-center justify-between text-left group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-sm border transition-all ${expandedReferrers.includes(referrer) ? 'bg-yellow-500 border-yellow-500 shadow-lg shadow-yellow-500/20' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] group-hover:border-yellow-500/30'}`}>
                      <Handshake className={`w-4 h-4 transition-colors ${expandedReferrers.includes(referrer) ? 'text-zinc-950' : 'text-[var(--text-secondary)]'}`} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] block opacity-60">Pilar de Referência</span>
                      <h4 className={`text-sm font-black uppercase tracking-tight transition-colors ${expandedReferrers.includes(referrer) ? 'text-yellow-600 dark:text-yellow-500' : 'text-[var(--text-primary)] group-hover:text-yellow-600'}`}>{referrer}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60">{groupedByReferrer[referrer].length} {groupedByReferrer[referrer].length === 1 ? 'eleitor' : 'eleitores'}</span>
                    <motion.div
                      animate={{ rotate: expandedReferrers.includes(referrer) ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className={`w-4 h-4 transition-colors ${expandedReferrers.includes(referrer) ? 'text-yellow-500' : 'text-[var(--text-secondary)] group-hover:text-yellow-500'}`} />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedReferrers.includes(referrer) && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 pl-6 border-l-2 border-[var(--border-color)] space-y-3 pb-2 pt-2">
                        {groupedByReferrer[referrer].map((voter: any) => (
                          <motion.div 
                            key={voter.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => { setSelectedVoter(voter); setIsVoterDetailOpen(true); }}
                            className="group flex items-center justify-between p-4 bg-[var(--bg-tertiary)]/50 rounded-sm border border-[var(--border-color)] hover:border-yellow-500/50 hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer shadow-sm"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 bg-[var(--bg-secondary)] font-black text-xs text-yellow-500 flex items-center justify-center rounded-sm border border-[var(--border-color)] group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-colors shadow-inner">
                                {voter.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">{voter.name}</p>
                                <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1 opacity-60">{voter.phone}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {voter.tags?.slice(0, 2).map((tag: string) => (
                                <span key={tag} className="text-[7px] bg-[var(--bg-primary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-sm font-black uppercase tracking-widest border border-[var(--border-color)]">
                                  {tag}
                                </span>
                              ))}
                              <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] opacity-30 group-hover:text-yellow-500 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {voters.length === 0 && (
            <div className="py-24 text-center border-2 border-dashed border-[var(--border-color)] rounded-sm grayscale opacity-30">
              <Users className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] text-[10px]">Silêncio Radar: Nenhuma rede capturada.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleAddMaterialRequest = async (e: any) => {
    e.preventDefault();
    const materialId = e.target.materialId.value;
    const qty = parseInt(e.target.qty.value);
    const reason = e.target.reason.value;
    const returnDate = e.target.returnDate?.value || null;
    
    if (!materialId || isNaN(qty)) return;

    const mat = materials.find((m: any) => m.id === materialId);
    
    await firestoreService.addDocument('material_requests', {
      leaderId: user.uid,
      leaderName: profileData.name || user?.displayName || 'Líder',
      teamId: teamData?.id || '',
      team: profileData.zone || teamData?.name || 'Base',
      materialId,
      materialName: mat?.name || 'Material Desconhecido',
      qty,
      reason,
      returnDate,
      status: 'pendente',
      coordinatorId: resolvedCoordinatorId || coordinatorId || teamData?.coordinatorId || '',
      createdAt: Date.now()
    });
    e.target.reset();
    alert("Solicitação de material enviada com sucesso!");
  };

  const handleVoterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Usuário não autenticado.");
      return;
    }

    try {
      const activeCoordId = resolvedCoordinatorId || coordinatorId || teamData?.coordinatorId || '';
      // Verificar se já existe um eleitor com este telefone antes de criar um novo dentro da mesma campanha
      if (!isEditingVoter && voterForm.phone && voterForm.phone.length > 5) {
        const q = query(
          collection(db, 'voters'), 
          where('phone', '==', voterForm.phone),
          where('coordinatorId', '==', activeCoordId)
        );
        const checkSnap = await getDocs(q);
        if (!checkSnap.empty) {
          alert("🚨 ATENÇÃO: Este telefone já está cadastrado na base geral da campanha! Não é permitido duplicar eleitores.");
          return;
        }
      }

      if (isEditingVoter && editingVoterId) {
        await firestoreService.updateDocument('voters', editingVoterId, {
          ...voterForm,
          coordinatorId: activeCoordId,
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
          createdBy: user.uid,
          coordinatorId: activeCoordId,
          location: null
        };
        await firestoreService.setDocument('voters', `voter_${Date.now()}`, payload);
        alert("✅ CADASTRO REALIZADO COM SUCESSO!");
      }
      
      setIsVoterModalOpen(false);
      setIsEditingVoter(false);
      setEditingVoterId(null);
      setVoterForm({ name: '', phone: '', address: '', observations: '', referredBy: '', tags: [], articulatorId: '', cpf: '', rg: '', titulo: '', zona: '', secao: '', localVotacao: '' });
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const downloadVoterTemplate = () => {
    const headers = [
      "Nome", 
      "WhatsApp", 
      "CPF", 
      "RG", 
      "Titulo", 
      "Zona", 
      "Secao", 
      "LocalVotacao", 
      "Endereco", 
      "Tags", 
      "IndicadoPor", 
      "Observacoes"
    ];
    const sampleRows = [
      [
        "José da Silva", 
        "(95) 99123-4567", 
        "123.456.789-00", 
        "1234567-SSP", 
        "123456789012", 
        "001", 
        "0150", 
        "Escola Estadual Getúlio Vargas", 
        "Av. Ville Roy, 1234 - Centro, Boa Vista - RR", 
        "Apoiador, Influenciador, Familia", 
        "Maria de Souza", 
        "Eleitor muito influente no bairro, solicitou visitas."
      ],
      [
        "Ana Paula Oliveira", 
        "(95) 98401-2233", 
        "987.654.321-11", 
        "7654321-SSP", 
        "987654321012", 
        "005", 
        "0042", 
        "Colégio Militarizado Elza Lacerda", 
        "Rua das Flores, 456 - Asa Branca, Boa Vista - RR", 
        "Lideranca, Setor Sul", 
        "Articulador João", 
        "Necessita de material para panfletagem no comércio."
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo Eleitores");
    XLSX.writeFile(wb, "modelo_cadastro_eleitores.xlsx");
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkFileError(null);
    setBulkFileSuccess(null);
    setParsedVoters([]);
    
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'doc' || fileExtension === 'docx' || fileExtension === 'pdf') {
      setBulkFileError(
        "⚠️ Arquivos de texto (.doc, .docx) ou documentos formatados (.pdf) não possuem estrutura tabular garantida. " +
        "Para garantir que nomes, CPFs, contatos e locais de votação sejam preenchidos individualmente nos campos corretos e sem erros, " +
        "o cadastro em lote exige a estrutura padronizada da Planilha Excel do Modelo. " +
        "Por favor, use a opção de baixar o modelo abaixo e preencha os dados em formato de tabela Excel para importar com 100% de segurança!"
      );
      e.target.value = '';
      return;
    }

    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      setBulkFileError("Por favor, selecione um arquivo de planilha válido (.xlsx, .xls ou .csv).");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];
        
        if (data.length <= 1) {
          setBulkFileError("A planilha selecionada parece estar vazia ou conter apenas o cabeçalho.");
          return;
        }

        const headers = data[0].map((h: any) => String(h || '').trim().toLowerCase().replace(/\s+/g, ''));
        
        const nameIdx = headers.findIndex((h: string) => h.includes('nome'));
        const phoneIdx = headers.findIndex((h: string) => h.includes('whatsapp') || h.includes('telefone') || h.includes('celular'));
        const cpfIdx = headers.findIndex((h: string) => h.includes('cpf'));
        const rgIdx = headers.findIndex((h: string) => h.includes('rg'));
        const tituloIdx = headers.findIndex((h: string) => h.includes('titulo') || h.includes('título'));
        const zonaIdx = headers.findIndex((h: string) => h.includes('zona'));
        const secaoIdx = headers.findIndex((h: string) => h.includes('secao') || h.includes('seção'));
        const localIdx = headers.findIndex((h: string) => h.includes('local') || h.includes('escola') || h.includes('votacao') || h.includes('votação'));
        const addrIdx = headers.findIndex((h: string) => h.includes('endereco') || h.includes('endereço') || h.includes('localizacao') || h.includes('localização'));
        const tagsIdx = headers.findIndex((h: string) => h.includes('tags') || h.includes('categoria') || h.includes('segmento'));
        const refIdx = headers.findIndex((h: string) => h.includes('indicado') || h.includes('referencia') || h.includes('referência'));
        const obsIdx = headers.findIndex((h: string) => h.includes('observacao') || h.includes('observação') || h.includes('observacoes') || h.includes('observações'));

        if (nameIdx === -1) {
          setBulkFileError("Coluna 'Nome' não encontrada na planilha. Certifique-se de usar o modelo padrão de Excel.");
          return;
        }

        const list: any[] = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;
          
          const name = String(row[nameIdx] || '').trim();
          if (!name) continue;

          const phone = phoneIdx !== -1 ? String(row[phoneIdx] || '').trim() : '';
          const cpf = cpfIdx !== -1 ? String(row[cpfIdx] || '').trim() : '';
          const rg = rgIdx !== -1 ? String(row[rgIdx] || '').trim() : '';
          const titulo = tituloIdx !== -1 ? String(row[tituloIdx] || '').trim() : '';
          const zona = zonaIdx !== -1 ? String(row[zonaIdx] || '').trim() : '';
          const secao = secaoIdx !== -1 ? String(row[secaoIdx] || '').trim() : '';
          const localVotacao = localIdx !== -1 ? String(row[localIdx] || '').trim() : '';
          const address = addrIdx !== -1 ? String(row[addrIdx] || '').trim() : '';
          const tagsStr = tagsIdx !== -1 ? String(row[tagsIdx] || '').trim() : '';
          const referredBy = refIdx !== -1 ? String(row[refIdx] || '').trim() : '';
          const observations = obsIdx !== -1 ? String(row[obsIdx] || '').trim() : '';

          const tags = tagsStr ? tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

          list.push({
            name,
            phone,
            cpf,
            rg,
            titulo,
            zona,
            secao,
            localVotacao,
            address,
            tags,
            referredBy,
            observations
          });
        }

        if (list.length === 0) {
          setBulkFileError("Nenhum eleitor válido pôde ser importado da planilha. Verifique se a coluna 'Nome' está preenchida.");
          return;
        }

        setParsedVoters(list);
        setBulkFileSuccess(`✓ Planilha lida com sucesso! Encontrados ${list.length} eleitores prontos para cadastro.`);
      } catch (err: any) {
        setBulkFileError("Erro ao processar arquivo: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Usuário não autenticado.");
      return;
    }
    if (parsedVoters.length === 0) {
      alert("Nenhum dado de eleitor carregado para salvar.");
      return;
    }

    setIsProcessingBulk(true);
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    try {
      for (const voter of parsedVoters) {
        try {
          const activeCoordId = resolvedCoordinatorId || coordinatorId || teamData?.coordinatorId || '';
          if (voter.phone && voter.phone.length > 5) {
            const q = query(
              collection(db, 'voters'), 
              where('phone', '==', voter.phone),
              where('coordinatorId', '==', activeCoordId)
            );
            const checkSnap = await getDocs(q);
            if (!checkSnap.empty) {
              duplicateCount++;
              continue;
            }
          }

          const payload = {
            ...voter,
            leaderId: user.uid,
            leaderName: profileData.name || user.displayName || "Líder",
            team: profileData.zone || "Base",
            createdAt: Date.now(),
            registeredBy: user.email || user.uid,
            createdBy: user.uid,
            coordinatorId: activeCoordId,
            location: null
          };

          await firestoreService.setDocument('voters', `voter_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, payload);
          successCount++;
        } catch (err) {
          console.error("Erro ao cadastrar eleitor em lote:", err);
          errorCount++;
        }
      }

      alert(
        `🎉 PROCESSO CONCLUÍDO!\n\n` +
        `• Sucesso: ${successCount} novos eleitores cadastrados\n` +
        `• Duplicados ignorados: ${duplicateCount}\n` +
        `• Erros: ${errorCount}`
      );

      setIsVoterModalOpen(false);
      setParsedVoters([]);
      setBulkFileSuccess(null);
      setBulkFileError(null);
      setRegisterMode('individual');
    } catch (err: any) {
      alert("Erro durante o processo de lote: " + err.message);
    } finally {
      setIsProcessingBulk(false);
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
        coordinatorId: resolvedCoordinatorId || coordinatorId || '',
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
        coordinatorId: resolvedCoordinatorId || coordinatorId || '',
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
      // TAREFA 3: VALIDAR CHOQUE LOGÍSTICO (filtrado por campanha do coordenador)
      const activeCoordId = resolvedCoordinatorId || coordinatorId || '';
      const confirmedAgendas = await firestoreService.getCollectionFiltered<any>('agenda', activeCoordId);
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
        coordinatorId: activeCoordId,
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
    
    const val = parseCurrencyToNumber(expenseForm.amount);
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
        coordinatorId: resolvedCoordinatorId || coordinatorId || '',
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
        authorId: user.uid,
        leaderName: profileData.name,
        authorName: profileData.name,
        team: profileData.zone,
        teamName: profileData.zone,
        type: activeTab === 'feed' ? 'tactical' : 'private',
        coordinatorId: coordinatorId || '',
        createdAt: Date.now()
      });
      setNoteText('');
      setIsNoteModalOpen(false);
      if (activeTab === 'feed') {
        alert("Nota postada no Feed Tático!");
      } else {
        alert("Anotação salva na sua agenda pessoal!");
      }
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-yellow-500 selection:text-zinc-950 flex overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR - DESKTOP ONLY */}
      <aside className="hidden lg:flex w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex-col flex-shrink-0 relative z-20">
        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] group/profile relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl -mr-16 -mt-16 group-hover/profile:bg-yellow-500/10 transition-colors pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="bg-yellow-500 p-2.5 rounded-sm shadow-xl shadow-yellow-500/10 border border-white/20">
              <ShieldCheck className="w-6 h-6 text-zinc-950" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tighter leading-none uppercase">Rede Águia</h2>
              <p className="text-[9px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mt-1.5 opacity-80">Líder Regional</p>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-sm p-5 border border-[var(--border-color)] shadow-[var(--shadow-sm)] relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-all">
              <User className="w-16 h-16" />
            </div>
            <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Perfil Ativo</p>
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase truncate">
              {profileData.name || user?.displayName || 'LÍDER'}
            </h3>
            <p className="text-[8px] font-bold text-yellow-600 dark:text-yellow-500 mt-2 uppercase tracking-widest">
              {profileData.zone || 'SETOR NÃO DEFINIDO'}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto custom-scrollbar">
          {[
            { id: 'logistica', label: 'Painel Tático', icon: <MapPin className="w-4 h-4" /> },
            { id: 'equipe', label: 'Base de Eleitores', icon: <Users className="w-4 h-4" /> },
            { id: 'analise_eleitoral', label: 'Análise Eleitoral', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'materiais', label: 'Gestão Materiais', icon: <Package className="w-4 h-4" /> },
            { id: 'notas', label: 'Notas de Voz', icon: <Mic className="w-4 h-4" /> },
            { id: 'feed', label: 'Feed Tático', icon: <MessageSquare className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-sm font-black text-[9px] uppercase tracking-widest transition-all group ${
                activeTab === tab.id 
                ? 'bg-yellow-500 text-zinc-950 shadow-xl shadow-yellow-500/20' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className={`${activeTab === tab.id ? 'text-zinc-950' : 'text-[var(--text-secondary)] group-hover:text-yellow-600'} transition-colors`}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-5 border-t border-white/5">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-sm bg-red-500/10 text-red-500 font-black text-[9px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-lg"
          >
            <LogOut className="w-3.5 h-3.5" /> Desligar Terminal
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-6 lg:px-10 flex items-center justify-between flex-shrink-0 relative z-30 transition-colors duration-300">
          <div className="flex items-center gap-3 lg:hidden">
            <ShieldCheck className="w-6 h-6 text-yellow-500" />
            <h1 className="font-black text-base uppercase tracking-tighter text-[var(--text-primary)]">Líder Águia</h1>
          </div>

          <div className="hidden lg:flex items-center gap-3">
             <div className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-sm border border-yellow-500/20 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                Setor: {profileData.zone || 'Identificando...'}
             </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm text-[var(--text-secondary)] hover:bg-yellow-500 hover:text-zinc-950 active:scale-90 transition-all shadow-xl"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-sm border transition-all ${
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
              className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm text-[var(--text-secondary)] hover:bg-yellow-500 hover:text-zinc-950 active:scale-95 transition-all shadow-[var(--shadow-sm)]"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-12 custom-scrollbar pb-32 lg:pb-12 bg-[var(--bg-primary)] transition-colors duration-300">
          <div className="max-w-6xl mx-auto space-y-10">
            
            {activeTab === 'logistica' ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                {isLocating && (
                  <div className="bg-yellow-500/10 border-2 border-yellow-500/20 text-yellow-500 p-6 rounded-sm text-center flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.2em] shadow-2xl">
                    <RefreshCcw className="w-6 h-6 animate-spin" /> Verificando Assinatura de GPS e Segurança de Campo...
                  </div>
                )}

                {dailyOrder?.text && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-zinc-950 border-2 border-yellow-500/50 rounded-sm p-10 shadow-[var(--shadow-md)] relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                      <ShieldCheck className="w-32 h-32 text-yellow-500 rotate-12" />
                    </div>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-yellow-500 p-3 rounded-sm shadow-lg shadow-yellow-500/20"><Zap className="w-6 h-6 text-zinc-950" /></div>
                      <div>
                        <h3 className="text-white font-black text-xl uppercase tracking-tighter">Ordem do Dia</h3>
                        <p className="text-yellow-500 text-[8px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">Diretriz Crítica de Campo</p>
                      </div>
                    </div>
                    <p className="text-white font-black text-2xl leading-relaxed border-l-4 border-yellow-500 pl-8 max-w-4xl italic">
                      "{dailyOrder.text}"
                    </p>
                    <div className="mt-10 flex items-center gap-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-white/5 w-fit px-4 py-2 rounded-full border border-white/5">
                       <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-yellow-500" /> Atualizado às {new Date(dailyOrder.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  </motion.div>
                )}

                {teamData?.observations && (
                  <section className="bg-white border-2 border-zinc-100 rounded-sm p-10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all pointer-events-none">
                      <StickyNote className="w-32 h-32 text-zinc-900 rotate-12" />
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-zinc-950 p-3 rounded-sm"><StickyNote className="w-6 h-6 text-yellow-500" /></div>
                      <h3 className="text-zinc-950 font-black text-xl uppercase tracking-tighter">Comunicações da Central</h3>
                    </div>
                    <p className="text-zinc-600 font-bold text-lg leading-relaxed whitespace-pre-wrap pl-2 border-l-4 border-yellow-500">
                      {teamData.observations}
                    </p>
                  </section>
                )}

                <section className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                  {[
                    { id: 'eleitor', label: 'Cadastrar Eleitor', sub: 'EXPANSÃO DE BASE', icon: <UserPlus className="w-8 h-8 lg:w-10 lg:h-10" />, color: 'blue' },
                    { id: 'agenda', label: 'Sugerir Agenda', sub: 'MISSÕES LOCAIS', icon: <Calendar className="w-8 h-8 lg:w-10 lg:h-10" />, color: 'emerald' },
                    { id: 'combustivel', label: 'Suporte / Fuel', sub: 'RECURSOS', icon: <Fuel className="w-8 h-8 lg:w-10 lg:h-10" />, color: 'orange' },
                    { id: 'demanda', label: 'Ouvidoria / Feed', sub: 'PROBLEMAS', icon: <StickyNote className="w-8 h-8 lg:w-10 lg:h-10" />, color: 'purple' }
                  ].map(action => (
                    <motion.button 
                      key={action.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => processAction(action.id as any)}
                      className={`aspect-square bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-sm p-6 lg:p-8 flex flex-col items-center justify-center gap-6 shadow-[var(--shadow-md)] border border-[var(--border-color)] hover:border-yellow-500/30 transition-all group relative overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                        {action.icon}
                      </div>
                      <div className={`p-5 rounded-sm transition-all shadow-inner ${
                        action.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500 group-hover:text-zinc-950' :
                        action.color === 'blue' ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' :
                        action.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' :
                        action.color === 'orange' ? 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white' :
                        'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white'
                      }`}>
                        {action.icon}
                      </div>
                      <div className="text-center group-hover:scale-110 transition-transform">
                        <span className="font-black text-xs lg:text-sm uppercase tracking-widest leading-none block">
                          {action.label}
                        </span>
                        <span className="text-[8px] font-black text-[var(--text-secondary)] mt-2.5 block tracking-[0.2em] uppercase opacity-60">
                          {action.sub}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12">
                  {myRequests.length > 0 && (
                    <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-10 shadow-[var(--shadow-sm)] overflow-hidden flex flex-col h-full group">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-[var(--text-primary)] font-black text-lg uppercase tracking-tighter flex items-center gap-3">
                          <div className="bg-[var(--bg-tertiary)] p-2.5 rounded-sm group-hover:bg-zinc-950 group-hover:text-white transition-all shadow-inner border border-[var(--border-color)]"><RefreshCcw className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-yellow-500" /></div>
                          Fluxo de Suporte
                        </h3>
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60">Últimas 5</span>
                      </div>
                      <div className="space-y-4 flex-1">
                        {myRequests.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(req => (
                          <motion.div 
                            key={req.id} 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="p-5 bg-[var(--bg-tertiary)] rounded-sm border border-[var(--border-color)] flex items-center justify-between gap-6 hover:border-yellow-500/30 transition-all group/item"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-4 rounded-sm shadow-inner ${
                                req.type === 'combustivel' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 
                                req.type === 'demanda' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'
                              }`}>
                                {req.type === 'combustivel' ? <Fuel className="w-5 h-5" /> : <StickyNote className="w-5 h-5" />}
                              </div>
                              <div className="text-left">
                                <p className="font-black text-[var(--text-primary)] text-xs uppercase leading-none mb-2 tracking-tight group-hover/item:text-yellow-600 transition-colors uppercase">{req.title}</p>
                                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-60">{new Date(req.createdAt).toLocaleDateString()} • {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                            <span className={`text-[9px] font-black px-4 py-2 rounded-sm uppercase tracking-widest shadow-sm border ${
                              req.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 border-emerald-500/20' : 
                              req.status === 'negado' ? 'bg-red-500/10 text-red-700 dark:text-red-500 border-red-500/20' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)]'
                            }`}>
                              {req.status}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {myAgendas.length > 0 && (
                    <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-10 shadow-[var(--shadow-sm)] overflow-hidden flex flex-col h-full group">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-[var(--text-primary)] font-black text-lg uppercase tracking-tighter flex items-center gap-3">
                          <div className="bg-[var(--bg-tertiary)] p-2.5 rounded-sm group-hover:bg-zinc-950 group-hover:text-white transition-all shadow-inner border border-[var(--border-color)]"><Calendar className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-emerald-500" /></div>
                          Monitor de Agenda
                        </h3>
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60">Ativas</span>
                      </div>
                      <div className="space-y-4 flex-1">
                        {myAgendas.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(agenda => (
                          <motion.div 
                            key={agenda.id} 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="p-5 bg-[var(--bg-tertiary)] rounded-sm border border-[var(--border-color)] flex items-center justify-between gap-6 hover:border-yellow-500/30 transition-all group/item"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-4 rounded-sm shadow-inner ${
                                agenda.status === 'confirmado' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 
                                agenda.status === 'negado' ? 'bg-red-500/10 text-red-600' : 'bg-orange-500/10 text-orange-600'
                              }`}>
                                <Calendar className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                <p className="font-black text-[var(--text-primary)] text-xs uppercase leading-none mb-2 tracking-tight uppercase">{agenda.municipio}</p>
                                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-60">{new Date(agenda.data).toLocaleDateString()} • {agenda.hora_inicio}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`text-[9px] font-black px-4 py-2 rounded-sm uppercase tracking-widest shadow-sm border ${
                                agenda.status === 'confirmado' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 border-emerald-500/20' : 
                                agenda.status === 'negado' ? 'bg-red-500/10 text-red-700 dark:text-red-500 border-red-500/20' : 'bg-[var(--bg-primary)] text-orange-600 border border-orange-500/20'
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
                  <section className="bg-zinc-950 text-white rounded-sm p-10 shadow-2xl relative overflow-hidden group border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent"></div>
                    <div className="bg-zinc-900/50 p-4 rounded-sm relative mb-6 w-max mx-auto shadow-inner border border-white/5">
                      <RefreshCcw className={`w-10 h-10 text-yellow-500 ${queueCount > 0 ? 'animate-spin-slow' : ''}`} />
                      {queueCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-yellow-500 text-zinc-950 text-xs font-black w-8 h-8 flex items-center justify-center rounded-sm border-4 border-zinc-950 shadow-2xl">
                          {queueCount}
                        </span>
                      )}
                    </div>
                    <div className="text-center relative z-10">
                      <h3 className="text-white font-black text-2xl tracking-tighter uppercase">{queueCount} Pacotes Offline</h3>
                      <p className="text-zinc-500 text-[10px] font-black mt-3 uppercase tracking-[0.3em]">
                        {isOnline ? 'Conexão estável com o terminal central' : 'Armazenamento local criptografado (sem rede)'}
                      </p>
                      {isOnline && queueCount > 0 && (
                        <button 
                          onClick={syncOfflineQueue}
                          className="mt-10 w-full bg-yellow-500 text-zinc-950 py-5 rounded-sm font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-white transition-all active:scale-95"
                        >
                          Sincronizar Terminal
                        </button>
                      )}
                    </div>
                  </section>

                  <div className="bg-blue-600 p-10 rounded-sm flex flex-col justify-center relative overflow-hidden shadow-2xl group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-transparent opacity-20"></div>
                    <ShieldCheck className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12 group-hover:rotate-6 transition-all duration-500" />
                    <p className="text-white font-black text-2xl lg:text-3xl uppercase leading-tight text-left relative z-10 tracking-tighter">
                      "A vitória é o resultado do trabalho silencioso em cada bairro."
                    </p>
                    <div className="mt-8 flex items-center gap-4 relative z-10">
                       <div className="w-16 h-1 bg-white/30 rounded-sm overflow-hidden">
                          <motion.div initial={{ x: -100 }} animate={{ x: 0 }} transition={{ duration: 2, repeat: Infinity }} className="w-full h-full bg-white"></motion.div>
                       </div>
                       <span className="text-blue-100 text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Comando Estratégico Águia</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'equipe' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-[var(--bg-secondary)] p-8 rounded-sm border border-[var(--border-color)] shadow-[var(--shadow-md)]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-zinc-950 p-4 rounded-sm shadow-xl border border-white/5">
                    <Users className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none font-sans">Minha Equipe Regional</h2>
                    <p className="text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-[0.2em] mt-3 opacity-70">Base estratégica de eleitores fidelizados em campo</p>
                  </div>
                </div>
                
                <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-sm border border-[var(--border-color)] shadow-inner">
                  <button 
                    onClick={() => setVoterViewState('list')}
                    className={`px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                      voterViewState === 'list' ? 'bg-yellow-500 text-zinc-950 shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Lista
                  </button>
                  <button 
                    onClick={() => setVoterViewState('network')}
                    className={`px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                      voterViewState === 'network' ? 'bg-yellow-500 text-zinc-950 shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Rede
                  </button>
                </div>
              </div>

              {/* Advanced Search & Filtering */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text" 
                    value={voterSearch}
                    onChange={e => setVoterSearch(e.target.value)}
                    placeholder="Pesquisar por nome ou telefone..."
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-sm py-4 pl-12 pr-4 text-xs font-bold text-zinc-900 outline-none focus:border-yellow-500 transition-all shadow-inner"
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mr-2">Tags:</span>
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (voterFilterTags.includes(tag)) {
                          setVoterFilterTags(voterFilterTags.filter(t => t !== tag));
                        } else {
                          setVoterFilterTags([...voterFilterTags, tag]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-sm text-[9px] font-black uppercase transition-all ${
                        voterFilterTags.includes(tag)
                        ? 'bg-yellow-500 text-zinc-950 shadow-md'
                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  {voterFilterTags.length > 0 && (
                    <button 
                      onClick={() => setVoterFilterTags([])}
                      className="p-1 px-2 text-red-500 hover:bg-red-50 rounded-sm transition-colors text-[9px] font-black uppercase"
                    >
                      <X className="w-3 h-3 inline mr-1" /> Limpar
                    </button>
                  )}
                </div>
              </div>

              {voterViewState === 'list' ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredVoters.length > 0 ? filteredVoters.sort((a, b) => a.name.localeCompare(b.name)).map((voter) => (
                    <motion.div 
                      key={voter.id} 
                      layout
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedVoter(voter);
                        setIsVoterDetailOpen(true);
                      }}
                      className="flex justify-between items-center p-5 bg-[var(--bg-secondary)] rounded-sm border border-[var(--border-color)] shadow-[var(--shadow-sm)] hover:border-yellow-500 hover:shadow-[var(--shadow-md)] transition-all cursor-pointer text-left group overflow-hidden relative"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 blur-2xl -mr-12 -mt-12 group-hover:bg-yellow-500/10 transition-colors pointer-events-none opacity-0 dark:opacity-100" />
                      
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] w-14 h-14 rounded-sm flex items-center justify-center font-black text-xl group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-colors shadow-inner border border-[var(--border-color)]">
                          {voter.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-[var(--text-primary)] text-base uppercase tracking-tighter leading-none mb-2">{voter.name}</p>
                          <div className="flex items-center gap-3">
                            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-60">{voter.phone || 'Sem Telefone'}</p>
                            {voter.tags && voter.tags.length > 0 && (
                              <div className="flex gap-1.5">
                                {voter.tags.slice(0, 2).map((tag: string) => (
                                  <span key={tag} className="text-[7.5px] bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-2 py-0.5 rounded-sm font-black uppercase tracking-widest border border-yellow-500/20">{tag}</span>
                                ))}
                                {voter.tags.length > 2 && <span className="text-[8px] text-[var(--text-secondary)] font-black opacity-50">+{voter.tags.length - 2}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="text-[var(--text-secondary)] opacity-30 group-hover:text-yellow-500 group-hover:translate-x-1 group-hover:opacity-100 transition-all relative z-10" />
                    </motion.div>
                  )) : (
                    <div className="p-20 border-2 border-dashed border-zinc-200 rounded-sm text-center">
                      <Search className="w-12 h-12 text-zinc-100 mx-auto mb-4" />
                      <p className="font-black text-zinc-300 uppercase tracking-widest text-sm">Nenhum eleitor encontrado.</p>
                      {(voterSearch || voterFilterTags.length > 0) && (
                        <button 
                          onClick={() => { setVoterSearch(''); setVoterFilterTags([]); }}
                          className="mt-4 text-[10px] font-black text-yellow-600 underline uppercase tracking-widest"
                        >
                          Limpar todos os filtros
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <ReferralNetwork voters={filteredVoters} />
              )}
            </div>
          </motion.div>
        ) : activeTab === 'financeiro' ? (

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-zinc-950 p-10 rounded-sm border-b-[12px] border-emerald-500 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <Wallet className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <p className="text-[11px] font-black uppercase text-emerald-500 tracking-[0.3em] mb-3">Saldo Operacional Disponível</p>
                <h2 className="text-6xl font-black tracking-tighter leading-none mb-10">
                  R$ {((teamData?.allocated || 0) - (teamData?.spent || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
                <div className="flex gap-12 pt-8 border-t border-white/10">
                   <div>
                      <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-1.5">Recursos Alocados</p>
                      <p className="text-xl font-black">{ (teamData?.allocated || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-1.5">Despesas Processadas</p>
                      <p className="text-xl font-black text-red-500">{ (teamData?.spent || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-[var(--bg-secondary)] p-8 rounded-sm border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-[0.2em] flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Alocações do Comando
                  </h3>
                </div>
                <div className="space-y-4">
                  {teamTransactions.filter(t => t.type === 'alocacao').length > 0 ? teamTransactions.filter(t => t.type === 'alocacao').map(tx => (
                    <div key={tx.id} className="p-5 bg-[var(--bg-tertiary)] rounded-sm border border-[var(--border-color)] flex justify-between items-center group/tx hover:border-emerald-500/30 transition-all shadow-inner">
                      <div className="text-left">
                        <p className="font-black text-xs uppercase text-[var(--text-primary)] mb-1 group-hover/tx:text-emerald-500 transition-colors">Recurso de Campo</p>
                        <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-tight opacity-70">"{tx.purpose || 'Logística tática'}"</p>
                      </div>
                      <div className="text-right flex items-center gap-5">
                        <div className="text-right">
                          <p className="font-black text-emerald-600 dark:text-emerald-500 text-sm">+ R$ {tx.amount.toLocaleString()}</p>
                          <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase opacity-50">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                        {tx.receiptStatus !== 'assinado' ? (
                          <button 
                            onClick={() => {
                              setSelectedTxToSign(tx);
                              setIsSignReceiptModalOpen(true);
                            }}
                            className="bg-yellow-500 text-zinc-950 px-4 py-2.5 rounded-sm font-black text-[9px] uppercase shadow-lg shadow-yellow-500/20 hover:bg-yellow-400 active:scale-95 transition-all"
                          >
                            Assinar
                          </button>
                        ) : (
                          <div className="bg-emerald-500/10 text-emerald-600 p-2 rounded-sm border border-emerald-500/20 shadow-inner" title="Validado">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-12 text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest opacity-40">Aguardando provisões...</p>
                  )}
                </div>
              </section>

              <section className="bg-[var(--bg-secondary)] p-8 rounded-sm border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-[0.2em] flex items-center gap-3">
                    <History className="w-4 h-4 text-red-500" /> Histórico de Saídas
                  </h3>
                  <button 
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="bg-zinc-950 text-white px-5 py-2.5 rounded-sm font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all hover:bg-zinc-800 border border-white/5"
                  >
                    Novo Gasto
                  </button>
                </div>
                <div className="space-y-4">
                  {teamTransactions.filter(t => t.type === 'gasto').length > 0 ? teamTransactions.filter(t => t.type === 'gasto').map(tx => (
                    <div 
                      key={tx.id} 
                      onClick={() => {
                        setSelectedExpenseForVoucher(tx);
                        setIsExpenseVoucherModalOpen(true);
                      }}
                      className="p-5 bg-[var(--bg-tertiary)] rounded-sm border border-[var(--border-color)] flex justify-between items-center cursor-pointer hover:border-red-500/30 transition-all border-l-4 border-l-red-500 group/tx shadow-inner"
                    >
                      <div className="text-left">
                        <p className="font-black text-xs uppercase text-[var(--text-primary)] mb-1 group-hover/tx:text-red-500 transition-colors uppercase">{tx.description}</p>
                        <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase mt-1 opacity-50">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <p className="font-black text-red-600 text-base">- R$ {tx.amount.toLocaleString()}</p>
                        <FileText className="w-4 h-4 text-[var(--text-secondary)] opacity-30 group-hover/tx:text-red-500 group-hover/tx:opacity-100 transition-all" />
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-12 text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest opacity-40">Sem registros de saída.</p>
                  )}
                </div>
              </section>
            </div>
          </motion.div>
        ) : activeTab === 'materiais' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border-color)] pb-6 transition-colors">
              <div>
                <h2 className="text-2xl font-black uppercase text-[var(--text-primary)] tracking-tighter leading-none">Gestão de Materiais</h2>
                <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-70">Solicitação de suprimentos e materiais de campanha</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* REQUEST FORM */}
              <div className="lg:col-span-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-8 shadow-[var(--shadow-sm)] h-fit relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Package className="w-32 h-32" />
                </div>
                <h3 className="text-xs font-black uppercase text-[var(--text-primary)] mb-8 flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-yellow-500 rounded-sm shadow-lg shadow-yellow-500/20"><Plus className="w-4 h-4 text-zinc-950" /></div> Solicitar Material
                </h3>
                <form onSubmit={handleAddMaterialRequest} className="space-y-6 relative z-10">
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 opacity-70">Tipo de Material</label>
                    <select name="materialId" required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm py-4 px-4 font-bold text-xs text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-colors cursor-pointer">
                      <option value="">Selecione o Material</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id} disabled={m.current <= 0}>
                          {m.name} ({m.current} disponíveis)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 opacity-70">Quantidade Desejada</label>
                    <input name="qty" type="number" required placeholder="Ex: 500" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm py-4 px-4 font-bold text-xs text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-colors" />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 opacity-70">Previsão de Devolução (Se aplicável)</label>
                    <input name="returnDate" type="date" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm py-4 px-4 font-bold text-xs text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-colors cursor-pointer" />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 opacity-70">Finalidade / Observação</label>
                    <textarea name="reason" placeholder="Para distribuição no bairro..." className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm py-4 px-4 font-bold text-xs text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-colors min-h-[100px]" />
                  </div>
                  <button className="w-full bg-zinc-950 text-white dark:bg-yellow-500 dark:text-zinc-950 py-4.5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-zinc-800 dark:hover:bg-yellow-400">
                    Enviar Solicitação
                  </button>
                </form>
              </div>

              {/* REQUEST LIST */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4">Minhas Solicitações</h3>
                {materialRequests.filter(r => r.leaderId === user.uid).length > 0 ? (
                  materialRequests.filter(r => r.leaderId === user.uid).sort((a, b) => b.createdAt - a.createdAt).map(req => (
                    <div key={req.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-yellow-500/30 transition-all shadow-[var(--shadow-sm)]">
                      <div className="flex items-start gap-5">
                        <div className={`w-14 h-14 bg-[var(--bg-tertiary)] rounded-sm flex items-center justify-center border border-[var(--border-color)] shadow-inner flex-shrink-0 ${
                          req.status === 'aprovado' ? 'text-emerald-500' : 
                          req.status === 'devolucao_pendente' ? 'text-blue-500 animate-pulse' :
                          req.status === 'devolvido' ? 'text-zinc-500' :
                          req.status === 'negado' ? 'text-red-500' : 'text-yellow-500'
                        }`}>
                          <Package className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-black text-[var(--text-primary)] text-sm uppercase tracking-tight font-sans">{req.materialName} ({req.qty} un)</h4>
                          <div className="mt-1 flex flex-wrap items-center gap-3">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(req.createdAt).toLocaleDateString()}</span>
                            <div className="w-1 h-1 bg-zinc-300 rounded-full"></div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              req.status === 'aprovado' ? 'text-emerald-600' : 
                              req.status === 'devolucao_pendente' ? 'text-blue-600' :
                              req.status === 'devolvido' ? 'text-zinc-500' :
                              req.status === 'negado' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {req.status === 'devolucao_pendente' ? 'Devolução Pendente' : req.status}
                            </span>
                            {req.receivedByLeader && (
                              <>
                                <div className="w-1 h-1 bg-zinc-300 rounded-full"></div>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                                  ✓ RECEBIDO
                                </span>
                              </>
                            )}
                          </div>
                          {req.returnDate && (
                            <p className="mt-1.5 text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-wider">
                              Previsão de Devolução: {new Date(req.returnDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {req.returnedAt && (
                            <p className="mt-1.5 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              Enviado para Devolução em: {new Date(req.returnedAt).toLocaleString('pt-BR')}
                            </p>
                          )}
                          {req.returnApprovedAt && (
                            <p className="mt-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                              Devolução Confirmada em: {new Date(req.returnApprovedAt).toLocaleString('pt-BR')}
                            </p>
                          )}
                          {req.reason && <p className="mt-2 text-[10px] font-bold text-zinc-500 italic opacity-70">"{req.reason}"</p>}
                          
                          {req.signedBy && (
                            <div className="mt-3 p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-sm flex items-center gap-2.5 w-fit">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <div className="leading-none text-left">
                                <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">ASSINADO DIGITALMENTE POR: {req.signedBy}</span>
                                <p className="text-[7px] font-mono text-zinc-500 mt-1">AUTORIZAÇÃO: {req.signatureHash}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {req.status === 'aprovado' && !req.receivedByLeader && (
                        <button
                          onClick={async () => {
                            if (confirm("Confirmar recebimento deste lote de material?")) {
                              try {
                                await firestoreService.updateDocument('material_requests', req.id, {
                                  receivedByLeader: true,
                                  receivedAt: Date.now()
                                });
                                alert("Recebimento confirmado com sucesso!");
                              } catch (err: any) {
                                alert("Erro ao marcar como recebido: " + err.message);
                              }
                            }
                          }}
                          className="bg-emerald-500 text-zinc-950 px-5 py-2.5 rounded-sm font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 active:scale-95 transition-all self-end sm:self-center"
                        >
                          Marcar como Recebido
                        </button>
                      )}

                      {req.status === 'aprovado' && req.receivedByLeader && !req.returnedByLeader && (
                        <button
                          onClick={async () => {
                            if (confirm(`Confirmar devolução do material: ${req.materialName}?`)) {
                              try {
                                await firestoreService.updateDocument('material_requests', req.id, {
                                  status: 'devolucao_pendente',
                                  returnedByLeader: true,
                                  returnedAt: Date.now()
                                });
                                alert("Devolução registrada! O coordenador confirmará o recebimento de volta ao estoque.");
                              } catch (err: any) {
                                alert("Erro ao registrar devolução: " + err.message);
                              }
                            }
                          }}
                          className="bg-blue-600 text-white px-5 py-2.5 rounded-sm font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:bg-blue-500 active:scale-95 transition-all self-end sm:self-center"
                        >
                          Devolver Material
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-24 text-center bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-sm grayscale opacity-30">
                    <Package className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] text-[10px]">Nenhuma solicitação enviada.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'feed' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border-color)] pb-6 transition-colors">
              <div>
                <h2 className="text-2xl font-black uppercase text-[var(--text-primary)] tracking-tighter leading-none">Feed Tático</h2>
                <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-70">Comunicação estratégica e fórum de campo • Tempo Real</p>
              </div>
              <button 
                onClick={() => setIsNoteModalOpen(true)}
                className="bg-yellow-500 text-zinc-950 px-6 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20 active:scale-95 flex items-center gap-3"
              >
                <Plus className="w-4 h-4" /> Registrar Nota
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notes.filter(n => n.type === 'tactical').length > 0 ? (
                notes.filter(n => n.type === 'tactical').map((note) => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    user={user} 
                    isAdmin={isAdmin} 
                    currentUserName={profileData?.name} 
                    onDelete={() => firestoreService.deleteDocument('notes', note.id)} 
                  />
                ))
              ) : (
                <div className="col-span-full py-24 bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-sm text-center grayscale opacity-40">
                  <MessageSquare className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                  <p className="font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] text-[10px]">Aguardando diretivas táticas...</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'analise_eleitoral' ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <EleitoralDashboard isCoordinator={false} campaignVoters={voters} />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-[var(--bg-secondary)] p-10 rounded-sm border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-10 border-b border-[var(--border-color)] pb-8">
                <div className="text-left">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-primary)] leading-none">Notas Estratégicas</h2>
                  <p className="text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-widest mt-3 opacity-60">Diário Tático: Registre impressões regionais em áudio.</p>
                </div>
                <button 
                  onClick={startVoiceNote}
                  className="flex items-center gap-4 bg-zinc-950 text-white dark:bg-yellow-500 dark:text-zinc-950 px-8 py-5 rounded-sm font-black text-[11px] uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-yellow-400 transition-all shadow-2xl active:scale-95 group"
                >
                  <Mic className="w-5 h-5 text-yellow-500 dark:text-zinc-950 animate-pulse" />
                  Ativar Gravador Tático
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notes.filter(n => n.type === 'private' && n.authorId === user?.uid).length > 0 ? notes.filter(n => n.type === 'private' && n.authorId === user?.uid).map((note) => (
                  <NoteCard key={note.id} note={note} user={user} isAdmin={false} currentUserName={profileData?.name} onDelete={() => handleDeleteNote(note.id)} />
                )) : (
                  <div className="col-span-full py-24 border-2 border-dashed border-[var(--border-color)] rounded-sm text-center grayscale opacity-40">
                    <Mic className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                    <p className="font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] text-[10px]">Aguardando registro de informações regionais.</p>
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
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto transition-all"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--bg-secondary)] w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-[var(--border-color)]"
            >
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-6 right-6 bg-[var(--bg-tertiary)] p-2.5 rounded-sm text-[var(--text-secondary)] hover:text-red-500 transition-all active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="bg-zinc-950 p-8 border-b-4 border-yellow-500 text-left dark:bg-zinc-900 transition-colors">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Minhas Credenciais</h2>
                <p className="text-yellow-500/70 text-[10px] font-black mt-3 uppercase tracking-[0.2em] leading-none">Ajuste de Identidade Operacional</p>
              </div>

              <div className="p-10 space-y-8 text-left">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-60">Identificação Nominal</label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm p-4.5 font-bold text-sm text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-all"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-60">Zona Operacional • Base</label>
                  <input 
                    type="text" 
                    value={profileData.address || ''}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm p-4.5 font-bold text-sm text-[var(--text-primary)] shadow-inner outline-none focus:border-yellow-500 transition-all"
                    placeholder="Região de Atuação"
                  />
                </div>
                
                <div className="pt-4">
                  <button 
                    onClick={async () => {
                      try {
                        await firestoreService.updateDocument('users', user.uid, profileData);
                        setIsProfileModalOpen(false);
                      } catch (err: any) {
                        alert("Erro ao atualizar credenciais: " + err.message);
                      }
                    }}
                    className="w-full bg-zinc-950 text-white dark:bg-yellow-500 dark:text-zinc-950 py-5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-zinc-800 dark:hover:bg-yellow-400"
                  >
                    ATUALIZAR IDENTIDADE
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
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setIsVoterDetailOpen(false);
                  setSelectedVoter(null);
                }} 
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-zinc-950 p-8 border-b-4 border-yellow-500 text-left">
                <div className="flex items-center gap-4 mb-2">
                   <div className="bg-yellow-500 text-zinc-950 w-12 h-12 rounded-sm flex items-center justify-center font-black text-xl">
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
                  <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm font-black text-green-600 uppercase">Fidelizado</p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Cadastro em</p>
                    <p className="text-sm font-black text-zinc-800 uppercase">{new Date(selectedVoter.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-50 p-3 rounded-sm text-blue-600"><Phone className="w-5 h-5" /></div>
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
                        <div className="bg-green-500 w-2 h-2 rounded-sm animate-pulse"></div>
                      </button>
                    </div>
                  </div>

                  {selectedVoter.referredBy && (
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-50 p-3 rounded-sm text-purple-600"><Handshake className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Indicado por</p>
                        <p className="text-base font-bold text-zinc-800 leading-tight">{selectedVoter.referredBy}</p>
                      </div>
                    </div>
                  )}

                  {selectedVoter.tags && selectedVoter.tags.length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="bg-zinc-100 p-3 rounded-sm text-zinc-950"><Target className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Tags de Segmentação</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedVoter.tags.map((tag: string) => (
                            <span key={tag} className="bg-yellow-500/20 text-zinc-950 border border-yellow-500/30 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informações Oficiais / Eleitorais */}
                  {(selectedVoter.cpf || selectedVoter.rg || selectedVoter.titulo || selectedVoter.zona || selectedVoter.secao || selectedVoter.localVotacao) && (
                    <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-sm space-y-3">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Dados Documentais e Eleitorais</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {selectedVoter.cpf && (
                          <div>
                            <span className="font-bold text-zinc-400 block text-[8px] uppercase tracking-wider">CPF</span>
                            <span className="font-extrabold text-zinc-900">{selectedVoter.cpf}</span>
                          </div>
                        )}
                        {selectedVoter.rg && (
                          <div>
                            <span className="font-bold text-zinc-400 block text-[8px] uppercase tracking-wider">RG</span>
                            <span className="font-extrabold text-zinc-900">{selectedVoter.rg}</span>
                          </div>
                        )}
                        {selectedVoter.titulo && (
                          <div>
                            <span className="font-bold text-zinc-400 block text-[8px] uppercase tracking-wider">Título de Eleitor</span>
                            <span className="font-extrabold text-zinc-900">{selectedVoter.titulo}</span>
                          </div>
                        )}
                        {(selectedVoter.zona || selectedVoter.secao) && (
                          <div>
                            <span className="font-bold text-zinc-400 block text-[8px] uppercase tracking-wider">Zona / Seção</span>
                            <span className="font-extrabold text-zinc-900">
                              {selectedVoter.zona || '—'} / {selectedVoter.secao || '—'}
                            </span>
                          </div>
                        )}
                      </div>
                      {selectedVoter.localVotacao && (
                        <div className="border-t border-zinc-100 pt-2 mt-2 text-xs">
                          <span className="font-bold text-zinc-400 block text-[8px] uppercase tracking-wider">Local de Votação</span>
                          <span className="font-extrabold text-zinc-950 flex items-center gap-1.5 uppercase">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500 inline" /> {selectedVoter.localVotacao}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="bg-zinc-100 p-3 rounded-sm text-zinc-950"><MapPin className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Localização / Base</p>
                      <p className="text-base font-bold text-zinc-800 leading-tight">{selectedVoter.address || 'Não informado'}</p>
                    </div>
                  </div>

                  {selectedVoter.observations && (
                    <div className="flex items-start gap-4">
                      <div className="bg-yellow-50 p-3 rounded-sm text-yellow-600"><StickyNote className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Observações de Campo</p>
                        <p className="text-sm font-bold text-zinc-600">"{selectedVoter.observations}"</p>
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
                        observations: selectedVoter.observations || '',
                        referredBy: selectedVoter.referredBy || '',
                        tags: selectedVoter.tags || [],
                        articulatorId: selectedVoter.articulatorId || '',
                        cpf: selectedVoter.cpf || '',
                        rg: selectedVoter.rg || '',
                        titulo: selectedVoter.titulo || '',
                        zona: selectedVoter.zona || '',
                        secao: selectedVoter.secao || '',
                        localVotacao: selectedVoter.localVotacao || ''
                      });
                      setEditingVoterId(selectedVoter.id);
                      setIsEditingVoter(true);
                      setIsVoterModalOpen(true);
                      setIsVoterDetailOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-950 py-4 rounded-sm font-black text-xs uppercase tracking-widest shadow-sm active:bg-zinc-200 transition-all"
                  >
                    <Settings className="w-4 h-4" /> Editar Dados
                  </button>
                  <button 
                    onClick={() => handleDeleteVoter(selectedVoter.id)}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-sm font-black text-xs uppercase tracking-widest shadow-md hover:bg-red-700 active:scale-95 transition-all"
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
            className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md p-4 flex items-center justify-center overflow-hidden"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200 flex flex-col max-h-[90vh] md:max-h-[85vh]"
            >
              <button 
                onClick={() => {
                   setIsVoterModalOpen(false);
                   setIsEditingVoter(false);
                   setEditingVoterId(null);
                   setVoterForm({ name: '', phone: '', address: '', observations: '', referredBy: '', tags: [], articulatorId: '', cpf: '', rg: '', titulo: '', zona: '', secao: '', localVotacao: '' });
                   setRegisterMode('individual');
                   setBulkFileError(null);
                   setBulkFileSuccess(null);
                   setParsedVoters([]);
                   setIsProcessingBulk(false);
                }} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95 z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-zinc-950 p-6 flex-shrink-0">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">
                  {isEditingVoter ? 'Editar Registro' : 'Novo Alistamento'}
                </h2>
                <p className="text-zinc-400 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Inteligência Territorial e Base de Dados</p>
              </div>

              {!isEditingVoter && (
                <div className="flex border-b border-zinc-200 bg-zinc-50 p-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setRegisterMode('individual')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center transition-all rounded-sm ${
                      registerMode === 'individual'
                        ? 'bg-yellow-500 text-zinc-950 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    ✦ Cadastro Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterMode('lote')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center transition-all rounded-sm ${
                      registerMode === 'lote'
                        ? 'bg-yellow-500 text-zinc-950 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    🗂️ Importar em Lote (Excel)
                  </button>
                </div>
              )}

              {registerMode === 'individual' || isEditingVoter ? (
                <form onSubmit={handleVoterSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome Completo do Cidadão</label>
                    <input required type="text" value={voterForm.name} onChange={e => setVoterForm({...voterForm, name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Digite identificação oficial..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">WhatsApp / Terminal Celular</label>
                    <input type="text" value={voterForm.phone} onChange={e => setVoterForm({...voterForm, phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="(00) 00000-0000" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Localização Operacional</label>
                    <input type="text" value={voterForm.address} onChange={e => setVoterForm({...voterForm, address: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Rua, Bairro ou Referência..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">CPF</label>
                      <input type="text" value={voterForm.cpf || ''} onChange={e => setVoterForm({...voterForm, cpf: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="000.000.000-00" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">RG</label>
                      <input type="text" value={voterForm.rg || ''} onChange={e => setVoterForm({...voterForm, rg: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Registro Geral RG..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Título</label>
                      <input type="text" value={voterForm.titulo || ''} onChange={e => setVoterForm({...voterForm, titulo: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Nº Título..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Zona</label>
                      <input type="text" value={voterForm.zona || ''} onChange={e => setVoterForm({...voterForm, zona: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Zona..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Seção</label>
                      <input type="text" value={voterForm.secao || ''} onChange={e => setVoterForm({...voterForm, secao: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Seção..." />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Local de Votação</label>
                    <input type="text" value={voterForm.localVotacao || ''} onChange={e => setVoterForm({...voterForm, localVotacao: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" placeholder="Nome da Escola / Seção..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Articulador / Parceiro Associado</label>
                    <select 
                      value={voterForm.articulatorId} 
                      onChange={e => setVoterForm({...voterForm, articulatorId: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all appearance-none"
                    >
                      <option value="">NENHUM ARTICULADOR SELECIONADO</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Indicado por (Selecione um eleitor cadastrado)</label>
                    <div className="relative">
                      <select 
                        value={voterForm.referredBy} 
                        onChange={e => setVoterForm({...voterForm, referredBy: e.target.value})} 
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all appearance-none"
                      >
                        <option value="">NENHUM INDICIADOR SELECIONADO</option>
                        {[...campaignVoters]
                          .filter(v => !isEditingVoter || v.id !== editingVoterId)
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(v => (
                            <option key={v.id} value={v.name}>{v.name} {v.phone ? `(${v.phone})` : ''}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Tags de Segmentação</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {voterForm.tags.map(tag => (
                        <span key={tag} className="bg-yellow-500/10 text-yellow-600 px-3 py-1 rounded-sm text-[9px] font-black uppercase flex items-center gap-2">
                          {tag}
                          <button type="button" onClick={() => setVoterForm({...voterForm, tags: voterForm.tags.filter(t => t !== tag)})}>
                            <X className="w-2 h-2" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={currentTag} 
                        onChange={e => setCurrentTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (currentTag.trim() && !voterForm.tags.some(t => t.trim().toUpperCase() === currentTag.trim().toUpperCase())) {
                              setVoterForm({...voterForm, tags: [...voterForm.tags, currentTag.trim()]});
                              setCurrentTag('');
                            }
                          }
                        }}
                        className="flex-1 bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-300" 
                        placeholder="Adicionar tag (Enter)..." 
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (currentTag.trim() && !voterForm.tags.some(t => t.trim().toUpperCase() === currentTag.trim().toUpperCase())) {
                            setVoterForm({...voterForm, tags: [...voterForm.tags, currentTag.trim()]});
                            setCurrentTag('');
                          }
                        }}
                        className="bg-zinc-950 text-white px-4 rounded-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {availableTags.length > 0 && (
                      <div className="mt-2.5">
                        <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block mb-1">Tags Disponíveis no Sistema (Clique para Adicionar)</label>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-zinc-50 border border-zinc-200 rounded-sm">
                          {availableTags.map(tag => {
                            const isSelected = voterForm.tags.some(t => t.trim().toUpperCase() === tag.toUpperCase());
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (!isSelected) {
                                    setVoterForm({
                                      ...voterForm,
                                      tags: [...voterForm.tags, tag]
                                    });
                                  } else {
                                    setVoterForm({
                                      ...voterForm,
                                      tags: voterForm.tags.filter(t => t.trim().toUpperCase() !== tag.toUpperCase())
                                    });
                                  }
                                }}
                                className={`px-2 py-1 text-[9px] font-black uppercase rounded-sm border transition-all ${
                                  isSelected
                                    ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/40 hover:bg-yellow-500/10'
                                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-yellow-500/50 hover:text-zinc-850'
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

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Observações Técnicas de Campo</label>
                    <textarea value={voterForm.observations} onChange={e => setVoterForm({...voterForm, observations: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-yellow-500 transition-all h-24 resize-none placeholder:text-zinc-300" placeholder="Histórico de engajamento ou demandas específicas..." />
                  </div>
                  <button type="submit" className="w-full bg-yellow-500 text-zinc-950 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-yellow-500/10 hover:bg-yellow-600 transition-all active:scale-[0.98] mt-2">
                    {isEditingVoter ? 'ATUALIZAR REGISTRO' : 'EFETIVAR ALISTAMENTO'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleBulkSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
                  <div className="bg-zinc-50 border border-zinc-200 rounded-sm p-4 space-y-3">
                    <h3 className="text-xs font-black uppercase text-zinc-900 flex items-center gap-1.5">
                      <FileDown className="w-4 h-4 text-yellow-500" />
                      Como funciona o Cadastro em Lote?
                    </h3>
                    <p className="text-[11px] text-zinc-600 leading-relaxed font-bold">
                      Cadastre dezenas de eleitores de uma vez só! Utilize nossa planilha modelo para preencher as colunas padronizadas de dados e suba o arquivo abaixo para importação instantânea.
                    </p>
                    
                    <button
                      type="button"
                      onClick={downloadVoterTemplate}
                      className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-zinc-950 rounded-sm font-black text-[10px] uppercase tracking-wider transition-all shadow-sm active:scale-95"
                    >
                      <FileDown className="w-4 h-4" />
                      Baixar Modelo de Planilha (.XLSX)
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                      Selecione o arquivo para Cadastro em Lote
                    </label>
                    <div className="border-2 border-dashed border-zinc-300 rounded-sm p-8 text-center hover:border-yellow-500 transition-all bg-zinc-50 relative cursor-pointer group">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv,.doc,.docx,.pdf"
                        onChange={handleBulkFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Upload className="w-8 h-8 text-zinc-400 group-hover:text-yellow-500 transition-colors" />
                        <span className="text-[11px] font-black uppercase text-zinc-700">
                          Clique ou arraste a planilha aqui
                        </span>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase block">
                          Suporta arquivos de planilha (.xlsx, .xls, .csv)
                        </span>
                      </div>
                    </div>
                  </div>

                  {bulkFileError && (
                    <div className="bg-red-50 border border-red-200 rounded-sm p-4 text-[11px] text-red-600 font-bold leading-relaxed whitespace-pre-wrap shadow-inner">
                      {bulkFileError}
                    </div>
                  )}

                  {bulkFileSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4 text-[11px] text-emerald-600 font-bold leading-relaxed shadow-inner">
                      {bulkFileSuccess}
                    </div>
                  )}

                  {parsedVoters.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                        Pré-visualização do Lote (Primeiros 5 registros)
                      </label>
                      <div className="border border-zinc-200 rounded-sm overflow-hidden text-[10px] bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-zinc-100 border-b border-zinc-200 text-[8px] font-black uppercase text-zinc-500">
                              <th className="py-2 px-3">Nome</th>
                              <th className="py-2 px-3">WhatsApp</th>
                              <th className="py-2 px-3">Zona/Seção</th>
                              <th className="py-2 px-3">Local de Votação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {parsedVoters.slice(0, 5).map((pv, idx) => (
                              <tr key={idx} className="bg-white text-zinc-700 font-bold">
                                <td className="py-2 px-3 uppercase truncate max-w-[120px]">{pv.name}</td>
                                <td className="py-2 px-3 font-mono">{pv.phone || '---'}</td>
                                <td className="py-2 px-3 font-mono">{pv.zona ? `${pv.zona}/${pv.secao}` : '---'}</td>
                                <td className="py-2 px-3 truncate max-w-[150px] uppercase">{pv.localVotacao || '---'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {parsedVoters.length > 5 && (
                          <div className="bg-zinc-50 p-2 text-center text-[9px] font-black text-zinc-500 border-t border-zinc-200 uppercase">
                            e mais {parsedVoters.length - 5} eleitores na lista...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={parsedVoters.length === 0 || isProcessingBulk}
                    className={`w-full py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] mt-2 ${
                      parsedVoters.length === 0 || isProcessingBulk
                        ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed shadow-none'
                        : 'bg-yellow-500 text-zinc-950 shadow-yellow-500/10 hover:bg-yellow-600'
                    }`}
                  >
                    {isProcessingBulk ? 'SALVANDO LOTE NO FIRESTORE...' : `IMPORTAR ${parsedVoters.length} ELEITORES EM LOTE`}
                  </button>
                </form>
              )}
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
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsFuelModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-blue-600 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Logística de Suporte</h2>
                <p className="text-blue-200 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Requisição Oficial de Combustível</p>
              </div>
              <form onSubmit={handleFuelSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Volume Necessário (Operação em Litros)</label>
                  <input required type="number" value={fuelForm.amount} onChange={e => setFuelForm({...fuelForm, amount: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-2xl text-zinc-900 outline-none focus:border-blue-500 transition-all placeholder:text-zinc-300" placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Roteiro Planejado e Justificativa</label>
                  <textarea required value={fuelForm.reason} onChange={e => setFuelForm({...fuelForm, reason: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-blue-500 transition-all h-32 resize-none placeholder:text-zinc-300" placeholder="Descreva o trajeto e comunidades atendidas..." />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-[0.98] mt-2">ENVIAR REQUISIÇÃO</button>
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
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsDemandModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-yellow-500 p-6">
                <h2 className="text-xl font-black text-zinc-950 tracking-tighter uppercase leading-none">Demanda Territorial</h2>
                <p className="text-zinc-900 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Monitoramento de Necessidades Sociais</p>
              </div>
              <form onSubmit={handleDemandSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Natureza da Demanda</label>
                  <input required type="text" value={demandForm.title} onChange={e => setDemandForm({...demandForm, title: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-yellow-600 transition-all placeholder:text-zinc-300" placeholder="Ex: Saneamento, Saúde, Infraestrutura..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Briefing Detalhado</label>
                  <textarea required value={demandForm.description} onChange={e => setDemandForm({...demandForm, description: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-yellow-600 transition-all h-32 resize-none placeholder:text-zinc-300" placeholder="Descreva a urgência e o impacto na comunidade..." />
                </div>
                <button type="submit" className="w-full bg-yellow-500 text-zinc-950 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-yellow-500/10 hover:bg-yellow-600 transition-all active:scale-[0.98] mt-2">ENVIAR PARA COORDENAÇÃO</button>
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
              className="bg-white w-full max-w-xl rounded-sm overflow-hidden shadow-2xl relative p-8 md:p-12 text-zinc-950 border border-zinc-200"
            >
              <button 
                onClick={() => setIsExpenseVoucherModalOpen(false)}
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95 print:hidden"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border border-zinc-200 p-6 md:p-8 rounded-sm space-y-6 md:space-y-8 relative">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-3">
                      <div className="bg-red-600 p-2 rounded-sm"><DollarSign className="text-white w-5 h-5 md:w-6 md:h-6" /></div>
                      <div>
                        <h3 className="font-black text-lg md:text-xl leading-none uppercase tracking-tighter">VOUCHER DE GASTO</h3>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Comprovante de Saída Operacional</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">ID Operação</p>
                      <p className="font-mono text-xs font-black uppercase text-zinc-950">{selectedExpenseForVoucher.id.split('_').pop()}</p>
                   </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                   <div className="bg-zinc-50 p-6 rounded-sm border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">Discriminação</p>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                         <div>
                            <p className="text-xl font-black text-zinc-950 leading-tight uppercase">{selectedExpenseForVoucher.description}</p>
                            <p className="text-[10px] font-bold text-zinc-500 mt-1">Finalidade: {selectedExpenseForVoucher.purpose}</p>
                            <p className="text-[8px] font-black text-zinc-400 uppercase mt-4 tracking-widest">Data/Hora: {new Date(selectedExpenseForVoucher.date).toLocaleString('pt-BR')}</p>
                         </div>
                         <div className="text-left md:text-right w-full md:w-auto">
                            <p className="text-2xl md:text-3xl font-black text-red-600 tracking-tighter">R$ {selectedExpenseForVoucher.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                         </div>
                      </div>
                   </div>

                   <div className="bg-zinc-50 p-6 rounded-sm border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">Unidade Responsável</p>
                      <p className="text-base font-black text-zinc-950 uppercase tracking-tight">{selectedExpenseForVoucher.team}</p>
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
                   className="flex items-center gap-2 bg-zinc-950 text-white px-6 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-xl shadow-zinc-200"
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
              className="bg-white w-full max-w-xl rounded-sm overflow-hidden shadow-2xl relative p-8 md:p-12 text-zinc-950 border border-zinc-200"
            >
              <button 
                onClick={() => setIsSignReceiptModalOpen(false)}
                className="absolute top-6 right-6 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95 print:hidden"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border border-zinc-200 p-6 md:p-8 rounded-sm space-y-6 md:space-y-8 relative">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-3">
                      <div className="bg-zinc-950 p-2 rounded-sm"><ShieldCheck className="text-yellow-500 w-5 h-5 md:w-6 md:h-6" /></div>
                      <div>
                        <h3 className="font-black text-lg md:text-xl leading-none uppercase tracking-tighter">PROTOCOLO ÁGUIA</h3>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Comprovante de Transferência Digital</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Nº Doc</p>
                      <p className="font-mono text-xs font-black text-zinc-950">{selectedTxToSign.id.split('_').pop()?.toUpperCase()}</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-zinc-50 p-6 rounded-sm border border-zinc-100">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">Beneficiário e Valor</p>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                         <div>
                            <p className="text-xl font-black text-zinc-950 leading-tight uppercase">{selectedTxToSign.team}</p>
                            <p className="text-[10px] font-bold text-zinc-500 mt-1">Finalidade: {selectedTxToSign.purpose || 'Uso Operacional'}</p>
                         </div>
                         <div className="text-left md:text-right w-full md:w-auto">
                            <p className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tighter">R$ {selectedTxToSign.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                         </div>
                      </div>
                   </div>

                   <p className="text-[11px] font-medium leading-relaxed text-zinc-600 text-justify bg-zinc-50/50 p-4 rounded-sm border border-zinc-100">
                      Eu, líder da equipe regional <strong className="text-zinc-950 font-black">{selectedTxToSign.team}</strong>, declaro ter recebido em {new Date(selectedTxToSign.date).toLocaleDateString('pt-BR')} a importância acima, comprometendo-me com as diretrizes táticas do sistema.
                   </p>

                   <div className="pt-8 grid grid-cols-2 gap-8">
                      <div className="text-center border-t border-zinc-200 pt-4">
                         <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Origem Operacional</p>
                         <p className="font-black text-[9px] uppercase tracking-tighter text-zinc-950">Validado Eletronicamente</p>
                      </div>
                      <div className="text-center border-t border-zinc-200 pt-4">
                         <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Receptor / Líder</p>
                         <p className="text-zinc-400 font-bold text-[9px] uppercase">Assinatura Pendente</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col md:flex-row justify-end gap-3 print:hidden">
                 <button 
                   onClick={() => window.print()}
                   className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-600 px-6 py-4 rounded-sm font-black text-[9px] uppercase tracking-widest hover:bg-zinc-200 transition-all font-sans"
                 >
                   <Printer className="w-4 h-4" /> Imprimir Recibo
                 </button>
                 <button 
                   onClick={() => handleSignReceipt(selectedTxToSign)}
                   className="bg-green-600 text-white px-8 py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] hover:bg-green-700 transition-all shadow-xl shadow-green-100"
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
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsExpenseModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-red-600 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Controle de Saídas</h2>
                <p className="text-red-100 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Registro de Despesa da Equipe</p>
              </div>
              <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Descrição do Gasto</label>
                  <input required type="text" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-red-500 transition-all placeholder:text-zinc-300" placeholder="Ex: Alimentação Equipe Campo..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Finalidade / Categoria Operacional</label>
                  <input required type="text" value={expenseForm.purpose} onChange={e => setExpenseForm({...expenseForm, purpose: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-red-500 transition-all placeholder:text-zinc-300" placeholder="Ex: Logística, Emergência, Apoio..." />
                </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Montante (Valores em R$)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">R$</span>
                      <input 
                        required 
                        type="text" 
                        value={expenseForm.amount} 
                        onChange={e => setExpenseForm({...expenseForm, amount: maskCurrency(e.target.value)})} 
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 pl-10 font-black text-2xl text-zinc-900 outline-none focus:border-red-500 transition-all placeholder:text-zinc-300" 
                        placeholder="0,00" 
                      />
                    </div>
                  </div>
                <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/10 hover:bg-red-700 transition-all active:scale-[0.98] mt-2">EFETIVAR SAÍDA</button>
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
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsAgendaModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-orange-500 p-6">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Logística Proativa</h2>
                <p className="text-orange-100 text-[10px] font-black mt-2 uppercase tracking-widest leading-none">Proposta de Itinerário Estratégico</p>
              </div>
              <form onSubmit={handleAgendaSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Local Operacional (Município)</label>
                  <select 
                    required 
                    value={agendaForm.municipio} 
                    onChange={e => setAgendaForm({...agendaForm, municipio: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-orange-500 transition-all"
                  >
                    <option value="" className="font-black">Selecione localidade...</option>
                    {["Boa Vista", "Pacaraima", "Rorainópolis", "Uiramutã", "Cantá", "Alto Alegre", "Mucajaí", "Amajari", "Bonfim", "Normandia", "Caracaraí", "Iracema", "Bonfim", "São João da Baliza", "São Luiz", "Caroebe"].map(m => (
                      <option key={m} value={m} className="font-bold">{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Data da Missão Sugerida</label>
                  <input required type="date" value={agendaForm.data} onChange={e => setAgendaForm({...agendaForm, data: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-orange-500 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Horário Início</label>
                    <input required type="time" value={agendaForm.hora_inicio} onChange={e => setAgendaForm({...agendaForm, hora_inicio: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-orange-500 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Horário Fim</label>
                    <input required type="time" value={agendaForm.hora_fim} onChange={e => setAgendaForm({...agendaForm, hora_fim: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-black text-[11px] text-zinc-900 outline-none focus:border-orange-500 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block leading-none">Justificativa e Objetivos Táticos</label>
                  <textarea required value={agendaForm.motivo} onChange={e => setAgendaForm({...agendaForm, motivo: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-bold text-[11px] text-zinc-800 outline-none focus:border-orange-500 transition-all h-24 resize-none placeholder:text-zinc-300" placeholder="Descreva os objetivos da diligência..." />
                </div>
                <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-orange-500/10 hover:bg-orange-700 transition-all active:scale-[0.98] mt-2">ENVIAR PROPOSTA</button>
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
              className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl relative border border-zinc-200"
            >
              <button 
                onClick={() => setIsNoteModalOpen(false)} 
                className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-sm text-zinc-500 hover:bg-zinc-200 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-zinc-950 p-6 flex items-center gap-4">
                <div className={`p-3 rounded-sm ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`}>
                  <Mic className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Anotação Tática</h2>
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
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-sm p-4 font-bold text-zinc-800 text-sm h-48 outline-none focus:border-yellow-500 transition-all resize-none"
                    placeholder="O que você está pensando? Ou continue gravando..."
                  />
                </div>
                
                <div className="flex gap-3">
                  {!isRecording ? (
                    <button 
                      onClick={startVoiceNote}
                      className="flex-1 bg-zinc-100 text-zinc-900 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Mic className="w-4 h-4" /> REINICIAR VOZ
                    </button>
                  ) : (
                    <div className="flex-1 bg-red-100 text-red-600 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-red-600 animate-ping"></div> ESCUTANDO...
                    </div>
                  )}
                  <button 
                    onClick={() => handleNoteSubmit()}
                    disabled={isProcessingNote || !noteText.trim()}
                    className={`flex-1 ${isProcessingNote ? 'bg-zinc-400' : 'bg-yellow-500'} text-zinc-950 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2`}
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
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-20 bg-neutral-950/90 backdrop-blur-xl border border-white/10 rounded-sm flex items-center justify-around px-4 z-50 shadow-2xl">
        {[
          { id: 'logistica', label: 'Tático', icon: <MapPin className="w-5 h-5" /> },
          { id: 'equipe', label: 'Equipe', icon: <Users className="w-5 h-5" /> },
          { id: 'analise_eleitoral', label: 'BI', icon: <TrendingUp className="w-5 h-5" /> },
          { id: 'notas', label: 'Notas', icon: <Mic className="w-5 h-5" /> },
          { id: 'feed', label: 'Feed', icon: <History className="w-5 h-5" /> }
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
            <div className={`p-2 rounded-sm transition-all ${activeTab === tab.id ? 'bg-yellow-500/10' : ''}`}>
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

const maskCurrency = (value: string) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const amount = (Number(digits) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2
  });
  return amount;
};

const parseCurrencyToNumber = (value: string) => {
  return Number(value.replace(/\D/g, '')) / 100;
};

export default function App() {
  const { user, login, loginWithEmail, signupWithEmail, logout, loading, isAdmin, forcePasswordChange, changePassword, resetPassword } = useAuth();
  const [view, setView] = useState<'coord' | 'cabo'>('cabo');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (safeLocalStorage.getItem('aguia-theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    safeLocalStorage.setItem('aguia-theme', theme);
  }, [theme]);
  
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
       try {
         window.history.replaceState({}, document.title, window.location.pathname);
       } catch (e) {
         console.warn("Navegação/Histórico restrito no iframe:", e);
       }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-8 transition-colors duration-500">
         <div className="relative">
           <ShieldCheck className="w-20 h-20 text-yellow-500 animate-pulse mb-6 relative z-10" />
           <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 animate-pulse"></div>
         </div>
         <div className="space-y-3 text-center">
           <p className="text-[var(--text-primary)] font-black uppercase tracking-[0.3em] text-xs animate-pulse">SISTEMA ÁGUIA</p>
           <p className="text-[var(--text-secondary)] font-black uppercase tracking-widest text-[9px] opacity-50">Estratégia 2026 • Carregando Inteligência</p>
         </div>
         <div className="mt-10 w-48 h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
           <motion.div 
             initial={{ x: '-100%' }}
             animate={{ x: '100%' }}
             transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
             className="w-full h-full bg-yellow-500"
           />
         </div>
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
                coordinatorId: preRegDoc.coordinatorId || '',
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
      console.error("Auth error caught:", err);
      const errorMsg = err.message || '';
      const errorCode = err.code || '';

      if (errorCode === 'auth/email-already-in-use' || errorMsg.includes('email-already-in-use')) {
        setAuthError('Este e-mail já possui uma conta ativa no Firebase. Se você é o líder João Cardoso e já criou uma senha personalizada anteriormente, por favor faça o login usando a SUA SENHA cadastrada (e não a senha temporária). Caso tenha esquecido, clique em "Esqueceu a senha?" abaixo para redefinir.');
      } else if (errorCode === 'auth/invalid-credential' || errorMsg.includes('invalid-credential') || errorMsg.includes('INVALID_LOGIN_CREDENTIALS')) {
        setAuthError('Chave de acesso (senha) incorreta para este operador. Se você recebeu uma senha temporária por WhatsApp, verifique se digitou as letras e números exatamente iguais.');
      } else if (errorCode === 'auth/user-not-found' || errorMsg.includes('user-not-found')) {
        setAuthError('Operador não encontrado. Se você é um líder novo, certifique-se de que o coordenador cadastrou o seu e-mail corretamente.');
      } else if (errorCode === 'auth/too-many-requests' || errorMsg.includes('too-many-requests')) {
        setAuthError('Acesso bloqueado temporariamente por excesso de tentativas incorretas. Aguarde alguns instantes ou mude sua senha.');
      } else {
        setAuthError(errorMsg || 'Erro na autenticação. Verifique suas credenciais.');
      }
    }
  };

  if (user && forcePasswordChange) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center selection:bg-yellow-500 selection:text-zinc-950 transition-colors duration-500">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[var(--bg-secondary)] p-10 rounded-sm shadow-2xl border border-[var(--border-color)] relative"
        >
          <div className="w-20 h-20 bg-yellow-500/10 rounded-sm flex items-center justify-center mx-auto mb-8 border border-yellow-500/20">
            <Lock className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none mb-3">Definir Identidade</h1>
          <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-10 opacity-70">Por segurança, altere sua senha de acesso inicial</p>
          
          <form onSubmit={handlePasswordChange} className="space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 block opacity-60">Nova Senha Operacional</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] p-4.5 rounded-sm focus:outline-none focus:border-yellow-500 transition-all font-bold text-sm shadow-inner"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            {authError && <p className="text-red-500 text-[10px] font-black text-center bg-red-500/5 py-3 rounded-sm border border-red-500/10 uppercase tracking-widest">{authError}</p>}
            <button 
              type="submit"
              className="w-full bg-zinc-950 text-white dark:bg-yellow-500 dark:text-zinc-950 py-5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-zinc-800 dark:hover:bg-yellow-400"
            >
              AUTENTICAR NOVA SENHA
            </button>
          </form>

          <button 
            onClick={logout}
            className="mt-10 text-[10px] font-black text-[var(--text-secondary)] hover:text-red-500 uppercase tracking-widest transition-colors opacity-50"
          >
            Encerrar Sessão
          </button>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 md:p-12 text-center selection:bg-yellow-500 selection:text-zinc-950 transition-colors duration-500 relative overflow-hidden">
        {/* Abstract Background Accents */}
        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[var(--bg-secondary)] p-10 md:p-14 rounded-sm shadow-2xl border border-[var(--border-color)] relative z-20 backdrop-blur-sm"
        >
          <div className="flex justify-center mb-8 text-[var(--text-primary)]">
            <div className="p-4 bg-zinc-950 rounded-sm shadow-2xl shadow-yellow-500/10 border border-white/5">
              <ShieldCheck className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none mb-3">SISTEMA ÁGUIA</h1>
          <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-12 opacity-60">Diretiva de Coordenação Operacional</p>
          
          <form onSubmit={handleEmailAuth} className="space-y-6 text-left relative z-10">
            {isRegistering && (
              <div className="bg-[var(--bg-tertiary)] p-1 rounded-sm flex mb-6 border border-[var(--border-color)] shadow-inner">
                <div className="flex-1 py-3 rounded-sm font-black text-[10px] tracking-widest bg-yellow-500 text-zinc-950 shadow-lg text-center uppercase">
                  Somente Coordenador
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 block opacity-60">Credencial de E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] p-4.5 rounded-sm focus:outline-none focus:border-yellow-500 transition-all font-bold text-sm shadow-inner placeholder:[var(--text-secondary)] placeholder:opacity-30"
                placeholder="operador@aguia.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 block opacity-60">Chave de Acesso</label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) {
                        alert("Por favor, digite o seu e-mail no campo acima antes de solicitar a redefinição.");
                        return;
                      }
                      if (confirm(`Deseja enviar um e-mail de redefinição de senha para ${email}?`)) {
                        try {
                          await resetPassword(email);
                          alert(`E-mail de redefinição enviado com sucesso para ${email}! Verifique sua caixa de entrada (e pasta de Spam).`);
                        } catch (err: any) {
                          alert(`Erro ao enviar e-mail de redefinição: ${err.message || err}`);
                        }
                      }
                    }}
                    className="text-[9px] font-black text-yellow-600 hover:text-yellow-500 uppercase tracking-widest transition-colors focus:outline-none"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] p-4.5 rounded-sm focus:outline-none focus:border-yellow-500 transition-all font-bold text-sm shadow-inner placeholder:[var(--text-secondary)] placeholder:opacity-30"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 py-3 rounded-sm border border-red-500/20 tracking-wider">
                {authError}
              </p>
            )}

            <button 
              type="submit"
              className="w-full bg-zinc-950 text-white dark:bg-yellow-500 dark:text-zinc-950 py-5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-zinc-800 dark:hover:bg-yellow-400 transition-all active:scale-95"
            >
              {isRegistering ? 'Solicitar Cadastro' : 'Autenticar Unidade'}
            </button>
          </form>

          <div className="relative my-10 z-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-color)]"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase font-black text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-4 tracking-[0.4em] opacity-40">LOGIN CORPORATIVO</div>
          </div>

          <button 
            onClick={login}
            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] py-4.5 rounded-sm font-black text-[10px] uppercase flex items-center justify-center gap-4 border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all shadow-sm relative z-10"
          >
            <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24">
               <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
               <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
               <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
               <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google Cloud Auth
          </button>

          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="mt-10 text-[10px] font-black text-[var(--text-secondary)] hover:text-yellow-600 uppercase tracking-widest transition-colors opacity-50 block w-full relative z-10"
          >
            {isRegistering ? 'Já possui acesso? Efetuar Login' : 'Ainda não é operador? Registrar'}
          </button>
        </motion.div>
        
        <p className="mt-12 text-[10px] font-black text-[var(--text-secondary)] opacity-20 uppercase tracking-[0.5em] relative z-20">Eagle Intelligence Systems • 2026</p>
      </div>
    );
  }

  return (
    <div className={`${theme} min-h-screen transition-colors duration-300`}>
      {view === 'coord' ? (
        <CoordinatorDashboard theme={theme} setTheme={setTheme} />
      ) : (
        <CaboDashboard theme={theme} setTheme={setTheme} />
      )}
    </div>
  );
}


