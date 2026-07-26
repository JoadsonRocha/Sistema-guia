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
  Award
} from 'lucide-react';
import logoImg from '../assets/logo.png';

interface SalesLandingPageProps {
  onAccessSystem: () => void;
}

export const SalesLandingPage: React.FC<SalesLandingPageProps> = ({ onAccessSystem }) => {
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [leadersCount, setLeadersCount] = useState(15);
  const [votersPerLeader, setVotersPerLeader] = useState(80);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const estimatedVotes = leadersCount * votersPerLeader;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* HEADER DA PÁGINA DE VENDAS */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={logoImg} 
            onError={(e) => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = '/logo.png'; } }} 
            alt="Nexus Política" 
            className="h-9 md:h-11 w-auto object-contain" 
          />
          <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20 hidden sm:inline-block">
            Edição Eleições 2026
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowDomainModal(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Guia de Subdomínio</span>
          </button>

          <a
            href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20Nexus%20Pol%C3%ADtica%20para%20minha%20campanha."
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Falar com Consultor</span>
            <span className="sm:hidden">Comprar</span>
          </a>

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
      <section className="relative px-4 md:px-8 py-16 md:py-24 max-w-6xl mx-auto text-center space-y-8 overflow-hidden">
        {/* Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 md:w-[600px] h-96 md:h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none"></div>

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
            onClick={onAccessSystem}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-blue-600/25 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            Testar Demonstração ao Vivo
          </button>

          <a
            href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Quero%20contratar%20o%20Nexus%20Pol%C3%ADtica%20para%20minha%20elei%C3%A7%C3%A3o."
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            Contratar via WhatsApp Comercial
          </a>
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

      {/* RECURSO PRINCIPAL: A HIERARQUIA VITORIOSA */}
      <section className="px-4 md:px-8 py-16 bg-zinc-900/40 border-y border-zinc-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase text-blue-400 tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              ESTRUTURA TÁTICA DE COMANDO
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              A Pirâmide Tática que Controla cada Voto da Cidade
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto">
              Chega de desorganização e cabos eleitorais sem metas. O Nexus Política conecta o comando central ao morador da ponta da rua.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Nível 1 */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-amber-500/30 hover:border-amber-500/60 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-amber-300 uppercase tracking-wide">1. Coordenador Geral</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Comando supremo da campanha. Define metas por bairro, autoriza verba de combustível, analisa o mapa de calor e publica a <strong className="text-zinc-200">Ordem do Dia</strong> diária para toda a militância.
              </p>
            </div>

            {/* Nível 2 */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-blue-500/30 hover:border-blue-500/60 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-blue-300 uppercase tracking-wide">2. Coordenadores Regionais</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Comandantes das zonas e bairros da cidade. Cadastram e acompanham o rendimento diário dos Líderes de Equipe locais, garantindo o alcance das metas.
              </p>
            </div>

            {/* Nível 3 */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-emerald-500/30 hover:border-emerald-500/60 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-emerald-300 uppercase tracking-wide">3. Líderes de Equipe / Cabos</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Linha de frente nas ruas. Cadastram moradores de casa em casa pelo celular, enviam links de autocadastro no WhatsApp e anotam demandas do bairro.
              </p>
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
      <section className="px-4 md:px-8 py-16 bg-zinc-900/40 border-t border-zinc-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              INVESTIMENTO E PLANOS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Escolha o Plano Ideal para Sua Vitória
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-lg mx-auto">
              Sem surpresas ou cobranças por mensagem enviada. Licenciamento transparente para toda a sua pré-campanha e eleição.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Plano 1: Vereador */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Campanha Local</span>
                <h3 className="text-xl font-black text-white">Plano Vereador</h3>
                <div className="text-3xl font-black text-white">
                  R$ 490 <span className="text-xs text-zinc-400 font-normal">/mês</span>
                </div>
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Até 25 Líderes de Equipe</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Até 2.500 Eleitores Cadastrados</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Disparo WhatsApp Grátis (wa.me)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Controle de Combustível</li>
                </ul>
              </div>

              <a
                href="https://wa.me/5511999999999?text=Quero%20contratar%20o%20Plano%20Vereador%20do%20Nexus%20Pol%C3%ADtica."
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs text-center block transition-all"
              >
                Contratar Plano Vereador
              </a>
            </div>

            {/* Plano 2: Prefeito / Deputado (Destaque) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-900/40 to-zinc-900 border-2 border-blue-500 relative flex flex-col justify-between space-y-6 shadow-2xl shadow-blue-600/20">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                Mais Vendido
              </div>

              <div className="space-y-4 pt-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Campanha Média/Grande</span>
                <h3 className="text-xl font-black text-white">Plano Prefeito / Deputado</h3>
                <div className="text-3xl font-black text-white">
                  R$ 1.290 <span className="text-xs text-zinc-400 font-normal">/mês</span>
                </div>
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Líderes e Regionais Ilimitados</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Eleitores Cadastrados Ilimitados</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Análise Histórica Completa TRE</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Mapa de Calor da Cidade</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Suporte VIP com Especialista</li>
                </ul>
              </div>

              <a
                href="https://wa.me/5511999999999?text=Quero%20contratar%20o%20Plano%20Prefeito%20do%20Nexus%20Pol%C3%ADtica."
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs text-center block shadow-lg shadow-blue-600/30 transition-all"
              >
                Garantir Licença VIP
              </a>
            </div>

            {/* Plano 3: Majoritário / Estadual */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Grandes Coligações</span>
                <h3 className="text-xl font-black text-white">Plano Majoritário / Estadual</h3>
                <div className="text-2xl font-black text-amber-400">
                  Sob Consulta
                </div>
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Múltiplos Municípios Simultâneos</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Servidor Dedicado e Isolado</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Customização com Marca da Coligação</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Treinamento Presencial da Equipe</li>
                </ul>
              </div>

              <a
                href="https://wa.me/5511999999999?text=Gostaria%20de%20uma%20proposta%20personalizada%20para%20o%20Plano%20Majorit%C3%A1rio."
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs text-center block transition-all"
              >
                Falar com Diretor Comercial
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="px-4 md:px-8 py-16 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white">Perguntas Frequentes (FAQ)</h2>
          <p className="text-xs text-zinc-400">Tire suas dúvidas antes de começar a operar sua campanha</p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Como funciona o disparo de mensagens no WhatsApp sem pagar taxa?",
              a: "O Nexus Política utiliza o protocolo oficial wa.me do WhatsApp. O sistema gera a mensagem personalizada com o nome e bairro do eleitor. Ao clicar em enviar, o WhatsApp oficial do seu próprio celular ou computador abre já com o texto pronto. É 100% gratuito e não há risco de banimento da conta."
            },
            {
              q: "Os cabos eleitorais precisam baixar algum aplicativo no celular?",
              a: "Não! O sistema é 100% web e responsivo. Funciona perfeitamente em qualquer navegador (Chrome, Safari, Firefox) no Android ou iPhone."
            },
            {
              q: "Como configurar o subdomínio vendas.nexuspolicy.com.br ou app.nexuspolicy.com.br?",
              a: "É muito simples! Basta acessar o painel do seu domínio (Registro.br, Cloudflare, etc.) e criar um registro do tipo CNAME ou A apontando para a sua hospedagem. Clique no botão 'Guia de Subdomínio' no topo da página para ver o passo a passo completo."
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
      <footer className="border-t border-zinc-800 py-8 px-4 text-center text-xs text-zinc-500 space-y-3">
        <p>Nexus Política &bull; Plataforma Inteligente de Gestão e Inteligência Eleitoral</p>
        <p className="text-[10px] text-zinc-600">
          Desenvolvido com tecnologia de alta performance para campanhas municipais e estaduais.
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

    </div>
  );
};
