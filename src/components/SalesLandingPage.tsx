import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Send, 
  Users, 
  Crown, 
  MapPin, 
  Fuel, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Smartphone, 
  BarChart3, 
  Zap, 
  HelpCircle, 
  Calculator, 
  Globe, 
  MessageSquare, 
  ChevronRight,
  X,
  ExternalLink,
  Award,
  Scale,
  FileText,
  Lock
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import { ASAAS_PLAN_LINKS, COMMERCIAL_WHATSAPP_NUMBER } from '../config/asaasConfig';
import { trackAdsConversion } from '../utils/gtag';

interface SalesLandingPageProps {
  onAccessSystem: () => void;
  onStartDemoMode?: () => void;
  onLogout?: () => void | Promise<void>;
  isLoggedIn?: boolean;
}

export const SalesLandingPage: React.FC<SalesLandingPageProps> = ({ onAccessSystem, onStartDemoMode, onLogout, isLoggedIn = false }) => {
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState<'terms' | 'refund' | 'tse' | null>(null);
  const [leadersCount, setLeadersCount] = useState(15);
  const [votersPerLeader, setVotersPerLeader] = useState(80);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const estimatedVotes = leadersCount * votersPerLeader;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* HEADER DA PÁGINA DE VENDAS */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 py-3.5 flex items-center justify-end">
        <div className="flex items-center gap-2 md:gap-3">
          <a
            href={`https://wa.me/${COMMERCIAL_WHATSAPP_NUMBER}?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20Nexus%20Pol%C3%ADtica%20para%20minha%20campanha.`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Falar com Consultor</span>
          </a>

          {isLoggedIn && onLogout ? (
            <button
              onClick={() => onLogout()}
              className="px-3.5 py-1.5 rounded border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <span>Sair da Conta</span>
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          <button
            onClick={onAccessSystem}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <span>Entrar no Sistema</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative px-4 md:px-8 py-12 md:py-20 max-w-6xl mx-auto text-center space-y-6 overflow-hidden">
        {/* Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 md:w-[600px] h-96 md:h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none"></div>

        {/* LOGO CENTRALIZADO NO RETÂNGULO BRANCO COM CANTOS ARREDONDADOS */}
        <div className="flex justify-center pt-2 pb-2">
          <div className="bg-white p-2 sm:p-3 rounded-2xl sm:rounded-3xl shadow-2xl shadow-white/10 border border-zinc-200/80 inline-flex items-center justify-center transition-all hover:scale-105 overflow-hidden">
            <img 
              src={logoImg} 
              onError={(e) => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = '/logo.png'; } }} 
              alt="Nexus Política" 
              className="h-28 sm:h-40 md:h-48 w-auto object-contain scale-125 transform p-1" 
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          O Sistema Tático Nº 1 para Campanhas Vitoriosas
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Transforme Apagão na Rua em <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">Votos Confirmados</span> na Urna
        </h1>

        <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium">
          Organize sua equipe em 3 níveis hierárquicos (<strong className="text-zinc-200">Coordenador Geral &rarr; Regionais &rarr; Líderes de Bairro</strong>), dispare mensagens personalizadas pelo WhatsApp <strong className="text-emerald-400">100% grátis</strong> e acompanhe o mapa de calor da sua eleição em tempo real.
        </p>

        {/* CTA BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onStartDemoMode || onAccessSystem}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-blue-600/25 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            Testar Demonstração ao Vivo
          </button>
        </div>

        {/* PROOF STATS */}
        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-2xl font-black text-blue-400">100% Grátis</div>
            <div className="text-xs text-zinc-400 font-medium mt-0.5">Disparos de WhatsApp via wa.me</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-2xl font-black text-emerald-400">3 Níveis</div>
            <div className="text-xs text-zinc-400 font-medium mt-0.5">Geral &rarr; Regional &rarr; Líderes</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-2xl font-black text-amber-400">Zero App</div>
            <div className="text-xs text-zinc-400 font-medium mt-0.5">Funciona direto no navegador</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-2xl font-black text-indigo-400">Dados TRE</div>
            <div className="text-xs text-zinc-400 font-medium mt-0.5">Análise histórica por seção</div>
          </div>
        </div>
      </section>

      {/* RECURSO PRINCIPAL: A HIERARQUIA VITORIOSA E FLUXO DE CADASTRO */}
      <section className="px-4 md:px-8 py-16 bg-zinc-900/40 border-y border-zinc-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase text-blue-400 tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              ESTRUTURA HIERÁRQUICA E FLUXO DE ACESSO
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Hierarquia Clara de Cadastro e Comando
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
              Do topo do comando até a sola do sapato na rua: entenda como cada nível se cadastra, delega acessos e opera no Nexus Política.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Nível 1: Coordenador Geral */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-amber-500/40 hover:border-amber-500/70 transition-all flex flex-col justify-between space-y-5 shadow-lg shadow-amber-500/5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Crown className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                    1º Cadastro no Sistema
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-amber-300 uppercase tracking-wide">1. Coordenador Geral</h3>
                  <p className="text-xs text-amber-400/80 font-medium mt-0.5">Comando Central da Campanha</p>
                </div>

                <div className="space-y-3 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
                  <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/30 text-[11px] text-amber-200 leading-relaxed">
                    <strong className="text-amber-300 block mb-0.5">🔑 Acesso & Cadastro:</strong>
                    Realiza o <strong>1º cadastro no sistema</strong>. Define metas globais, gera acessos para os Coordenadores Regionais e configura o link de convite externo.
                  </div>

                  <ul className="space-y-2 text-zinc-300 text-[11px] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>Gestão Tática:</strong> Define metas por bairro/zona, autoriza entregas de materiais de logística e publica a <strong>Ordem do Dia</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>Visão 360° do Sistema:</strong> Acompanha o <strong>Mapa de Calor</strong> da cidade em tempo real, dados históricos do TRE por seção e controle financeiro/operacional completo.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Nível 2: Coordenador Regional */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-blue-500/40 hover:border-blue-500/70 transition-all flex flex-col justify-between space-y-5 shadow-lg shadow-blue-500/5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold text-[10px] uppercase tracking-wider">
                    2º Nível de Acesso
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-blue-300 uppercase tracking-wide">2. Coordenadores Regionais</h3>
                  <p className="text-xs text-blue-400/80 font-medium mt-0.5">Gestores de Zonas e Bairros</p>
                </div>

                <div className="space-y-3 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
                  <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/30 text-[11px] text-blue-200 leading-relaxed">
                    <strong className="text-blue-300 block mb-0.5">🔑 Acesso & Cadastro:</strong>
                    Recebem o acesso do Coordenador Geral. Criam as equipes regionais e liberam o acesso dos Líderes de Equipe de cada setor.
                  </div>

                  <ul className="space-y-2 text-zinc-300 text-[11px] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span><strong>Supervisão de Campo:</strong> Monitoram, incentivam e apoiam o trabalho dos líderes em suas equipes diariamente nas ruas.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span><strong>Controle de Metas:</strong> Garantem o alcance das metas locais, organizam pontos de apoio e coordenam a distribuição de materiais da campanha.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Nível 3: Líderes de Equipe / Cabos */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-emerald-500/40 hover:border-emerald-500/70 transition-all flex flex-col justify-between space-y-5 shadow-lg shadow-emerald-500/5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase tracking-wider">
                    Linha de Frente
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-emerald-300 uppercase tracking-wide">3. Líderes de Equipe / Cabos</h3>
                  <p className="text-xs text-emerald-400/80 font-medium mt-0.5">Mobilizadores de Rua e WhatsApp</p>
                </div>

                <div className="space-y-3 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/30 text-[11px] text-emerald-200 leading-relaxed">
                    <strong className="text-emerald-300 block mb-0.5">🔑 Acesso & Cadastro:</strong>
                    Recebem o acesso do Coordenador Regional. Cadastram os eleitores diretamente ou compartilham o link de autocadastro.
                  </div>

                  <ul className="space-y-2 text-zinc-300 text-[11px] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Captação Direta:</strong> Cadastram moradores de casa em casa pelo celular e registram demandas da comunidade.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Engajamento Contínuo:</strong> Mantêm ativa a conversa com sua equipe/base pelo WhatsApp wa.me gratuito e garantem a presença no dia da votação.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* CALCULADORA DE ALCANCE ELEITORAL */}
      <section className="px-4 md:px-8 py-16 max-w-5xl mx-auto space-y-8">
        <div className="p-6 md:p-10 rounded-2xl bg-gradient-to-b from-blue-950/40 to-zinc-900 border border-blue-500/30 space-y-8">
          
          <div className="flex items-center gap-3 text-blue-400 font-black text-xs uppercase tracking-wider">
            <Calculator className="w-5 h-5" />
            Simulador Tático de Votos
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Calcule o Potencial de Votos da Sua Campanha
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Arraste os sliders abaixo e veja a capacidade de mobilização da sua equipe usando o Nexus Política.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            
            {/* Controles */}
            <div className="space-y-6">
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-300">Número de Líderes de Equipe:</span>
                  <span className="text-blue-400 font-black text-sm">{leadersCount} líderes</span>
                </div>
                <input 
                  type="range" 
                  min="3" 
                  max="100" 
                  value={leadersCount} 
                  onChange={(e) => setLeadersCount(Number(e.target.value))}
                  className="w-full accent-blue-500 bg-zinc-800 rounded-lg h-2 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-300">Eleitores Cadastrados por Líder:</span>
                  <span className="text-emerald-400 font-black text-sm">{votersPerLeader} eleitores</span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="300" 
                  step="10" 
                  value={votersPerLeader} 
                  onChange={(e) => setVotersPerLeader(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-800 rounded-lg h-2 cursor-pointer"
                />
              </div>

            </div>

            {/* Resultado Estimado */}
            <div className="p-6 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-center text-center space-y-3">
              <span className="text-xs uppercase font-black tracking-widest text-zinc-400">
                Alcance Mapeado Directamente
              </span>
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                {estimatedVotes.toLocaleString('pt-BR')} Votos
              </div>
              <p className="text-[11px] text-zinc-400">
                Com o acompanhamento semanal e lembrete do Dia "D" via WhatsApp wa.me grátis.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* PLANOS E VALORES */}
      <section id="planos" className="px-4 md:px-8 py-16 bg-zinc-900/40 border-t border-zinc-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              INVESTIMENTO E PLANOS POR CAPACIDADE
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Escolha o Plano Ideal para o Tamanho da Sua Equipe
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto">
              Todas as funcionalidades do sistema estão <strong className="text-emerald-400">100% liberadas em todos os planos</strong>. O único diferencial é a capacidade de cadastros e líderes da sua campanha.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            
            {/* Plano 0: Grátis / Degustação */}
            <div className="p-6 rounded-2xl bg-zinc-900/90 border border-emerald-500/40 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Degustação Inicial</span>
                <h3 className="text-xl font-black text-white">Plano Grátis</h3>
                <div className="text-3xl font-black text-emerald-400">
                  R$ 0 <span className="text-xs text-zinc-400 font-normal">/grátis</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-200 font-medium">
                  Perfeito para testar e validar o sistema com sua equipe sem nenhum custo inicial.
                </div>
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Até 7 Eleitores Cadastrados
                  </li>
                  <li className="flex items-center gap-2 font-bold text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Até 2 Líderes / Equipes
                  </li>
                  <li className="flex items-center gap-2 font-bold text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Até 2 Coordenadores Regionais
                  </li>
                  <li className="flex items-center gap-2 font-bold text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 1 Coordenador Geral (1º Cadastro)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Sistema 100% Liberado
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onStartDemoMode || onAccessSystem}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center block transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                Experimentar Plano Grátis
              </button>
            </div>
            
            {/* Plano 1: Start Tático */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Até 2.500 Eleitores</span>
                <h3 className="text-xl font-black text-white">Plano Start Tático</h3>
                <div className="text-3xl font-black text-white">
                  R$ 379 <span className="text-xs text-zinc-400 font-normal">/mês</span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-300 font-medium">
                  Ideal para pré-campanhas e mobilizações locais em início de estruturação.
                </div>
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Até 2.500 Eleitores Cadastrados
                  </li>
                  <li className="flex items-center gap-2 font-bold text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Até 25 Líderes de Equipe
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Gestão de pessoas, materiais e Metas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Disparo WhatsApp Grátis (wa.me)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Sistema 100% Liberado (Todas as Funções)
                  </li>
                </ul>
              </div>

              <a
                href={ASAAS_PLAN_LINKS.startTatico.includes("SEU_LINK") ? `https://wa.me/${COMMERCIAL_WHATSAPP_NUMBER}?text=Quero%20contratar%20o%20Plano%20Start%20T%C3%A1tico%20do%20Nexus%20Pol%C3%ADtica.` : ASAAS_PLAN_LINKS.startTatico}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackAdsConversion(379)}
                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs text-center block transition-all active:scale-95"
              >
                Contratar Start Tático
              </a>
            </div>

            {/* Plano 2: Comando Tático (Destaque) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-900/40 to-zinc-900 border-2 border-blue-500 relative flex flex-col justify-between space-y-6 shadow-2xl shadow-blue-600/20">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                Mais Vendido
              </div>

              <div className="space-y-4 pt-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Até 10.000 Eleitores</span>
                <h3 className="text-xl font-black text-white">Plano Comando Tático</h3>
                <div className="text-3xl font-black text-white">
                  R$ 679 <span className="text-xs text-zinc-400 font-normal">/mês</span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/50 text-[11px] text-blue-200 font-medium">
                  Para campanhas consolidadas com alta frequência de abordagens e cabos eleitorais nas ruas.
                </div>
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Até 10.000 Eleitores Cadastrados
                  </li>
                  <li className="flex items-center gap-2 font-bold text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Até 100 Líderes de Equipe
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Gestão de pessoas, materiais e Metas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Disparo WhatsApp Grátis (wa.me)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Sistema 100% Liberado (Todas as Funções)
                  </li>
                </ul>
              </div>

              <a
                href={ASAAS_PLAN_LINKS.comandoTatico.includes("SEU_LINK") ? `https://wa.me/${COMMERCIAL_WHATSAPP_NUMBER}?text=Quero%20contratar%20o%20Plano%20Comando%20T%C3%A1tico%20do%20Nexus%20Pol%C3%ADtica.` : ASAAS_PLAN_LINKS.comandoTatico}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackAdsConversion(679)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs text-center block shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              >
                Garantir Licença Comando
              </a>
            </div>

            {/* Plano 3: Domínio Total */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Capacidade Ilimitada</span>
                <h3 className="text-xl font-black text-white">Plano Domínio Total</h3>
                <div className="text-3xl font-black text-white">
                  R$ 850 <span className="text-xs text-zinc-400 font-normal">/mês</span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200 font-medium">
                  Para grandes operações estaduais, coligações de grande porte e exércitos de mobilização.
                </div>
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Eleitores Cadastrados Ilimitados
                  </li>
                  <li className="flex items-center gap-2 font-bold text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Líderes e Regionais Ilimitados
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Gestão de pessoas, materiais e Metas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Disparo WhatsApp Grátis (wa.me)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Sistema 100% Liberado (Todas as Funções)
                  </li>
                </ul>
              </div>

              <a
                href={ASAAS_PLAN_LINKS.dominioTotal.includes("SEU_LINK") ? `https://wa.me/${COMMERCIAL_WHATSAPP_NUMBER}?text=Quero%20contratar%20o%20Plano%20Dom%C3%ADnio%20Total%20do%20Nexus%20Pol%C3%ADtica.` : ASAAS_PLAN_LINKS.dominioTotal}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackAdsConversion(850)}
                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs text-center block transition-all active:scale-95"
              >
                Contratar Domínio Total
              </a>
            </div>

          </div>

          {/* BADGE DE GARANTIA DE 7 DIAS (CDC ART. 49) */}
          <div className="mt-10 bg-zinc-900/90 border border-emerald-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-5 max-w-4xl mx-auto shadow-lg shadow-emerald-950/20">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-white flex items-center gap-2 flex-wrap">
                  Garantia Incondicional de 7 Dias 
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Art. 49 CDC — Direito de Arrependimento
                  </span>
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Assine sem nenhum risco! Teste a plataforma na sua campanha por 7 dias. Se por qualquer motivo entender que o sistema não é ideal para sua operação, basta solicitar o reembolso. Devolvemos 100% do seu dinheiro via Asaas sem burocracia.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLegalModal('refund')}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95"
            >
              <FileText className="w-4 h-4" /> Ver Termos de Reembolso
            </button>
          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="px-4 md:px-8 py-16 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white">Perguntas Frequentes (FAQ)</h2>
          <p className="text-xs text-zinc-400">Tire suas dúvidas técnicas, operacionais e jurídicas antes de começar</p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Como funciona a Garantia de 7 Dias e o Pedido de Reembolso?",
              a: "Conforme estipulado no Artigo 49 do Código de Defesa do Consumidor (CDC), você tem até 7 dias corridos após a contratação para testar todas as funcionalidades do Nexus Política. Se desejar cancelar, basta solicitar diretamente no WhatsApp Comercial ou e-mail de suporte. O estorno de 100% do valor pago é processado via intermediadora Asaas (PIX instantâneo ou estorno na fatura do cartão de crédito)."
            },
            {
              q: "O sistema atende às exigências da LGPD e do TSE?",
              a: "Sim. O Nexus Política é uma plataforma SaaS onde a campanha/candidato atua como Controladora dos Dados e o sistema como Operador (art. 5º da LGPD). Os dados dos eleitores são criptografados, armazenados em nuvem segura Google Cloud e restritos aos operadores autorizados da sua equipe. Para prestação de contas ao TSE, a contratação gera Nota Fiscal em nome do CNPJ do Candidato / Comitê Eleitoral."
            },
            {
              q: "Como funciona o disparo de mensagens no WhatsApp sem pagar taxa?",
              a: "O Nexus Política utiliza o protocolo oficial wa.me do WhatsApp. O sistema gera a mensagem personalizada com o nome e bairro do eleitor. Ao clicar em enviar, o WhatsApp oficial do seu próprio celular ou computador abre já com o texto pronto. É 100% gratuito e não há risco de banimento da conta."
            },
            {
              q: "Os cabos eleitorais precisam baixar algum aplicativo no celular?",
              a: "Não! O sistema é 100% web e responsivo. Funciona perfeitamente em qualquer navegador (Chrome, Safari, Firefox) no Android ou iPhone."
            },
            {
              q: "Como acompanho a produtividade da equipe e o mapa de calor de votos em tempo real?",
              a: "O Coordenador Geral possui um painel gerencial completo com mapa de calor interativo da cidade, gráfico de metas por bairro e acompanhamento de entregas de logística e cadastros de cada Líder de Bairro em tempo real."
            },
            {
              q: "Os dados dos meus eleitores ficam seguros?",
              a: "Sim. Seus dados são protegidos por banco de dados Firestore do Google Cloud com regras de segurança rígidas. Apenas os operadores autorizados da sua campanha têm acesso."
            }
          ].map((faq, idx) => (
            <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                className="w-full px-5 py-4 text-left font-bold text-xs sm:text-sm text-zinc-200 flex items-center justify-between gap-3 hover:bg-zinc-800/50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronRight className={`w-4 h-4 text-blue-400 transition-transform ${faqOpen === idx ? 'rotate-90' : ''}`} />
              </button>
              {faqOpen === idx && (
                <div className="px-5 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 py-10 px-4 text-center text-xs text-zinc-500 space-y-4">
        <p className="font-semibold text-zinc-300">Nexus Política &bull; Plataforma Inteligente de Gestão e Inteligência Eleitoral</p>
        
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-[11px] font-medium text-zinc-400">
          <button 
            onClick={() => setShowLegalModal('refund')} 
            className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Política de Reembolso (7 Dias CDC)
          </button>
          <button 
            onClick={() => setShowLegalModal('terms')} 
            className="hover:text-blue-400 transition-colors flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" /> Termos de Uso e LGPD
          </button>
          <button 
            onClick={() => setShowLegalModal('tse')} 
            className="hover:text-amber-400 transition-colors flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" /> Prestação de Contas Eleitoral (TSE)
          </button>
        </div>

        <p className="text-[10px] text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          O Nexus Política é uma solução tecnológica de licenciamento de software (SaaS). A contratação é protegida pelo Art. 49 do Código de Defesa do Consumidor (Direito de Arrependimento de 7 dias) e em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
        </p>
      </footer>

      {/* MODAL DE GUIA DE SUBDOMÍNIO */}
      {showDomainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 max-w-2xl w-full rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="font-black text-white text-base">Como Configurar Subdomínio no Registro.br / DNS</h3>
              </div>
              <button onClick={() => setShowDomainModal(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-zinc-300 space-y-4 leading-relaxed">
              <p>
                Como você já possui o domínio principal <strong className="text-blue-400">nexuspolicy.com.br</strong> rodando o sistema, você pode escolher uma das duas estruturas abaixo:
              </p>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                <strong className="text-blue-300 text-xs block">Estratégia A (Recomendada):</strong>
                <ul className="list-disc list-inside space-y-1 text-zinc-300">
                  <li><strong>Página de Vendas:</strong> <code className="text-emerald-300">nexuspolicy.com.br</code></li>
                  <li><strong>Sistema Tático (Acesso dos usuários):</strong> <code className="text-blue-300">app.nexuspolicy.com.br</code></li>
                </ul>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <strong className="text-amber-300 text-xs block">Estratégia B:</strong>
                <ul className="list-disc list-inside space-y-1 text-zinc-300">
                  <li><strong>Sistema Tático:</strong> <code className="text-blue-300">nexuspolicy.com.br</code></li>
                  <li><strong>Página de Vendas:</strong> <code className="text-emerald-300">vendas.nexuspolicy.com.br</code> ou <code className="text-emerald-300">comercial.nexuspolicy.com.br</code></li>
                </ul>
              </div>

              <h4 className="font-bold text-white text-xs pt-2">Passo a Passo de Configuração no Registro.br / Cloudflare:</h4>

              <ol className="list-decimal list-inside space-y-2 text-zinc-400">
                <li>Acesse a sua conta onde o domínio <strong className="text-zinc-200">nexuspolicy.com.br</strong> está registrado (ex: Registro.br, Cloudflare, Hostinger).</li>
                <li>Vá até a opção <strong className="text-zinc-200">Editar Zona DNS</strong>.</li>
                <li>Clique em <strong className="text-zinc-200">Adicionar Novo Registro</strong>:
                  <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-zinc-300">
                    <li><strong>Tipo:</strong> CNAME</li>
                    <li><strong>Nome / Host:</strong> <code className="text-emerald-300">vendas</code> ou <code className="text-blue-300">app</code></li>
                    <li><strong>Alvo / Target:</strong> O endereço fornecido pela sua hospedagem (ex: Vercel, Cloud Run, Firebase Hosting).</li>
                  </ul>
                </li>
                <li>Salve as alterações. Em poucos minutos, seu subdomínio estará ativo e com certificado SSL grátis!</li>
              </ol>

            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setShowDomainModal(false)}
                className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-500 transition-colors"
              >
                Entendi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE TERMOS LEGAIS E POLÍTICA DE REEMBOLSO */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 max-w-3xl w-full rounded-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* CABEÇALHO */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="font-black text-white text-base">Termos Legais, LGPD & Política de Reembolso</h3>
                  <p className="text-[11px] text-zinc-400">Transparência jurídica e conformidade eleitoral do Nexus Política</p>
                </div>
              </div>
              <button onClick={() => setShowLegalModal(null)} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ABAS */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setShowLegalModal('refund')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  showLegalModal === 'refund' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> 1. Reembolso (7 Dias CDC)
              </button>

              <button
                onClick={() => setShowLegalModal('terms')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  showLegalModal === 'terms' 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <FileText className="w-4 h-4" /> 2. Termos de Uso & LGPD
              </button>

              <button
                onClick={() => setShowLegalModal('tse')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  showLegalModal === 'tse' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Scale className="w-4 h-4" /> 3. Prestação de Contas (TSE)
              </button>
            </div>

            {/* CONTEÚDO DA ABA SELECIONADA */}
            <div className="text-xs text-zinc-300 space-y-4 leading-relaxed">
              
              {showLegalModal === 'refund' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2">
                    <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Garantia Incondicional de 7 Dias — Art. 49 do Código de Defesa do Consumidor
                    </h4>
                    <p className="text-zinc-300">
                      O contratante tem o direito legal de desistir da contratação em até <strong>7 (sete) dias corridos</strong> contados a partir da data de confirmação do pagamento, com direito à devolução integral de 100% do valor pago.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-400">Como Solicitar o Reembolso:</h5>
                    <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                      <li>
                        Entre em contato com o suporte no WhatsApp: <strong className="text-emerald-400">+{COMMERCIAL_WHATSAPP_NUMBER}</strong> ou pelo e-mail oficial de suporte e sugestões: <strong className="text-emerald-400">inicialinovacoestecnologicas@gmail.com</strong>.
                      </li>
                      <li>
                        Informe o nome completo do contratante, CPF/CNPJ e e-mail cadastrado na plataforma.
                      </li>
                      <li>
                        O estorno será processado diretamente pelo gateway de pagamentos intermediador <strong>Asaas Gestão Financeira</strong>:
                        <ul className="list-disc list-inside pl-5 mt-1 space-y-1 text-zinc-400">
                          <li><strong>Pagamentos via PIX:</strong> O valor retorna instantaneamente para a chave PIX de origem.</li>
                          <li><strong>Pagamentos via Cartão de Crédito:</strong> O estorno é solicitado à administradora do cartão, constando como crédito na fatura atual ou seguinte.</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 text-[11px] space-y-1">
                    <p className="font-bold text-zinc-300">Aviso importante:</p>
                    <p>
                      Após o cancelamento e reembolso, o acesso aos servidores e ao banco de dados da campanha será desativado e os dados armazenados poderão ser exportados ou removidos conforme a solicitação do contratante.
                    </p>
                  </div>
                </div>
              )}

              {showLegalModal === 'terms' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-xl space-y-2">
                    <h4 className="font-bold text-blue-300 text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-400" />
                      Privacidade dos Dados e Conformidade com a LGPD (Lei 13.709/2018)
                    </h4>
                    <p className="text-zinc-300">
                      O Nexus Política é uma plataforma SaaS onde a campanha contratante é a <strong>Controladora dos Dados</strong> e o Nexus Política atua exclusivamente como <strong>Operador Tecnológico</strong>.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-400">Diretrizes de Segurança e Proteção:</h5>
                    <ul className="list-disc list-inside space-y-2 text-zinc-300">
                      <li><strong>Exclusividade dos Dados:</strong> As bases de dados de eleitores, líderes e logística pertencem 100% à campanha contratante. Jamais vendemos, compartilhamos, alugamos ou reutilizamos dados em outras campanhas.</li>
                      <li><strong>Criptografia e Armazenamento:</strong> Todos os dados são armazenados na infraestrutura corporativa do Google Cloud Platform (Firestore), com regras de acesso restritas por permissão de usuário (Coordenador, Líder, Cabo).</li>
                      <li><strong>Disparo de WhatsApp Assistido (wa.me):</strong> O Nexus Política não armazena nem envia mensagens sem ação humana direta. O envio de WhatsApp utiliza o protocolo wa.me do próprio usuário, respeitando as políticas do ecossistema Meta/WhatsApp.</li>
                    </ul>
                  </div>
                </div>
              )}

              {showLegalModal === 'tse' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-2">
                    <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                      <Scale className="w-4 h-4 text-amber-400" />
                      Prestação de Contas de Campanha Eleitoral (TSE / Receita Federal)
                    </h4>
                    <p className="text-zinc-300">
                      A contratação do Nexus Política é um investimento em licença de software de gestão e inteligência tática, plenamente elegível para prestação de contas eleitorais.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-400">Emissão de Nota Fiscal & Faturamento:</h5>
                    <ul className="list-disc list-inside space-y-2 text-zinc-300">
                      <li><strong>CNPJ de Campanha / CPF do Candidato:</strong> As Notas Fiscais de Prestação de Serviços de Software são emitidas com os dados informados no ato do faturamento via Asaas.</li>
                      <li><strong>Comprovação de Despesa Eleitoral:</strong> O comprovante de pagamento do Asaas juntamente com a Nota Fiscal servem como documento contábil oficial para envio ao TSE no sistema SPCE.</li>
                      <li><strong>Responsabilidade do Conteúdo:</strong> O Nexus Política fornece a ferramenta tecnológica. A campanha contratante é inteiramente responsável pelo conteúdo das mensagens e pelas diretrizes de propaganda eleitoral vigentes no país.</li>
                    </ul>
                  </div>
                </div>
              )}

            </div>

            {/* RODAPÉ DO MODAL */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-end">
              <button
                onClick={() => setShowLegalModal(null)}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
