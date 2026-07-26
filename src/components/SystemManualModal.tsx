import React, { useState } from 'react';
import { X, BookOpen, Crown, MapPin, Users, Send, CheckCircle2, Award, Calendar, Package, Fuel, FileText, ChevronRight, HelpCircle, Layers, Target, ShieldCheck, Download } from 'lucide-react';
import { downloadSystemManualDocx } from '../utils/generateDocxManual';

interface SystemManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemManualModal: React.FC<SystemManualModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'hierarquia' | 'funcoes' | 'passoapasso' | 'disparos' | 'dicas'>('hierarquia');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-5 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-blue-600/10 border-b border-blue-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-600/30 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-[var(--text-primary)] tracking-wide flex items-center gap-2">
                Manual Completo & Roteiro do Sistema Nexus Política
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">GUIA PRÁTICO</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Passo a passo simples para Coordenadores, Regionais e Líderes de Equipe</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => downloadSystemManualDocx()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              title="Baixar Manual Completo em formato Word (.docx)"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Baixar em Word (.docx)</span>
              <span className="sm:hidden">Word (.docx)</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 py-2.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'hierarquia', label: '1. A Hierarquia Tática', icon: Layers },
            { id: 'funcoes', label: '2. Funções por Papel', icon: Crown },
            { id: 'passoapasso', label: '3. Como Fazer na Prática', icon: CheckCircle2 },
            { id: 'disparos', label: '4. WhatsApp Gratuito (wa.me)', icon: Send },
            { id: 'dicas', label: '5. Segredos para Vencer', icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-zinc-300 text-xs leading-relaxed">

          {/* SEÇÃO 1: HIERARQUIA */}
          {activeSection === 'hierarquia' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-300 text-sm mb-1">O que é a Estrutura do Nexus Política?</h4>
                  <p className="text-zinc-300">
                    O sistema funciona como uma <strong>pirâmide de organização política vitoriosa</strong>. O objetivo final é transformar simpatias em <strong>votos confirmados nas urnas</strong> através do acompanhamento de cada eleitor e da prestação de contas transparente da equipe de rua.
                  </p>
                </div>
              </div>

              {/* Diagrama de Hierarquia */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Nível 1 */}
                <div className="p-4 bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase">
                    <Crown className="w-5 h-5" />
                    1. Coordenador Geral
                  </div>
                  <div className="text-[11px] text-amber-200/80 font-bold">Comando Central / Candidato</div>
                  <p className="text-zinc-300 text-[11px]">
                    Visualiza toda a cidade, aprova orçamento/combustível, define metas gerais, cria Coordenadores Regionais e monitora o mapa de calor dos votos.
                  </p>
                </div>

                {/* Nível 2 */}
                <div className="p-4 bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-black text-sm uppercase">
                    <MapPin className="w-5 h-5" />
                    2. Coordenador Regional
                  </div>
                  <div className="text-[11px] text-blue-200/80 font-bold">Comandante de Zona / Bairros</div>
                  <p className="text-zinc-300 text-[11px]">
                    Responsável por uma área específica (ex: Zona Sul). Cadastra os Líderes de Equipe da sua região e garante o cumprimento das metas locais.
                  </p>
                </div>

                {/* Nível 3 */}
                <div className="p-4 bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase">
                    <Users className="w-5 h-5" />
                    3. Líder de Equipe / Cabo
                  </div>
                  <div className="text-[11px] text-emerald-200/80 font-bold">Ponta de Lança no Bairro</div>
                  <p className="text-zinc-300 text-[11px]">
                    Cadastra os eleitores de casa em casa, envia mensagens no WhatsApp, coleta demandas da comunidade e distribui santinhos e materiais.
                  </p>
                </div>

              </div>

              {/* Fluxo de Conexão */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
                <h5 className="font-bold text-zinc-200 text-xs uppercase flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  Como as informações fluem entre eles?
                </h5>
                <ul className="space-y-2 text-[11px] list-disc list-inside text-zinc-400">
                  <li><strong>De Cima para Baixo:</strong> O Coordenador Geral publica a <span className="text-zinc-200 font-bold">"Ordem do Dia"</span> (orientações táticas) e aprova combustível/material. Isso desce para os Regionais e Líderes.</li>
                  <li><strong>De Baixo para Cima:</strong> O Líder de Equipe cadastra um eleitor ou registra uma demanda na rua. Esse dado sobe instantaneamente para o mapa do Coordenador Regional e do Geral.</li>
                </ul>
              </div>
            </div>
          )}

          {/* SEÇÃO 2: FUNÇÕES POR PAPEL */}
          {activeSection === 'funcoes' && (
            <div className="space-y-5">
              
              {/* Coordenador Geral */}
              <div className="p-4 bg-zinc-900/90 border border-amber-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-amber-400 text-sm uppercase flex items-center gap-2">
                    <Crown className="w-4 h-4" /> Funções do Coordenador Geral
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">ACESSO TOTAL</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800">
                    <strong className="text-zinc-200">1. Gestão de Regionais:</strong> Cadastrar e gerar links de acesso para cada Coordenador de Zona.
                  </div>
                  <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800">
                    <strong className="text-zinc-200">2. Definição de Metas:</strong> Fixar meta de votos para a cidade e por bairros estratégicos.
                  </div>
                  <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800">
                    <strong className="text-zinc-200">3. Logística e Financeiro:</strong> Autorizar cotas de combustível e remessas de materiais gráfico.
                  </div>
                  <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800">
                    <strong className="text-zinc-200">4. Análise Eleitoral TRE:</strong> Consultar históricos de votação das escolas e seções eleitorais.
                  </div>
                </div>
              </div>

              {/* Coordenador Regional */}
              <div className="p-4 bg-zinc-900/90 border border-blue-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-blue-400 text-sm uppercase flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Funções do Coordenador Regional
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">PAINEL REGIONAL</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800">
                    <strong className="text-zinc-200">1. Gestão das Equipes do Bairro:</strong> Cadastrar os líderes de equipe que atuam em sua região.
                  </div>
                  <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800">
                    <strong className="text-zinc-200">2. Acompanhamento de Metas Locais:</strong> Verificar quantos eleitores cada líder cadastrou na semana.
                  </div>
                  <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800">
                    <strong className="text-zinc-200">3. Pedidos de Material:</strong> Solicitar mais santinhos ou bandeiras para abastecer os cabos de rua.
                  </div>
                  <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800">
                    <strong className="text-zinc-200">4. Disparos Locais:</strong> Convocar moradores para reuniões de bairro via WhatsApp.
                  </div>
                </div>
              </div>

              {/* Líder de Equipe / Cabo Eleitoral */}
              <div className="p-4 bg-zinc-900/90 border border-emerald-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-emerald-400 text-sm uppercase flex items-center gap-2">
                    <Users className="w-4 h-4" /> Funções do Líder de Equipe / Cabo Eleitoral
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">LINK NO CELULAR</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800">
                    <strong className="text-zinc-200">1. Cadastro de Eleitores:</strong> Inserir dados do eleitor (Nome, WhatsApp, Seção Eleitoral, Bairro).
                  </div>
                  <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800">
                    <strong className="text-zinc-200">2. Link do WhatsApp / QR Code:</strong> Mandar link para o próprio eleitor se cadastrar direto no WhatsApp.
                  </div>
                  <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800">
                    <strong className="text-zinc-200">3. Registro de Demandas:</strong> Anotar problemas do bairro (ex: lâmpada queimada, buraco) para o candidato ajudar.
                  </div>
                  <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800">
                    <strong className="text-zinc-200">4. Prestação de Combustível:</strong> Enviar cupom fiscal de abastecimento para reembolso ou cota.
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SEÇÃO 3: PASSO A PASSO NA PRÁTICA */}
          {activeSection === 'passoapasso' && (
            <div className="space-y-4">
              <h4 className="font-black text-zinc-200 text-sm uppercase">Como Operar o Sistema no Dia a Dia da Campanha</h4>

              <div className="space-y-3">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">1</div>
                  <div>
                    <strong className="text-zinc-200 block text-xs">Passo 1: Criar os Coordenadores Regionais</strong>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      No Painel Geral, vá na aba <span className="text-blue-400">"Coordenadores Regionais"</span> &rarr; Clique em <strong>"Cadastrar Novo Regional"</strong> &rarr; Preencha o nome e o bairro/região dele. Copie o link exclusivo gerado e envie para o WhatsApp dele.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">2</div>
                  <div>
                    <strong className="text-zinc-200 block text-xs">Passo 2: Cadastrar as Equipes / Cabos de Rua</strong>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      Na aba <span className="text-blue-400">"Gestão de Equipes"</span> &rarr; Clique em <strong>"Cadastrar Nova Unidade"</strong> &rarr; Coloque o nome do Líder e o telefone. O sistema gera um link individual de autogestão para esse cabo de eleitoral.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">3</div>
                  <div>
                    <strong className="text-zinc-200 block text-xs">Passo 3: Coleta e Cadastro de Eleitores</strong>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      O cabo eleitoral, ao conversar com a pessoa na rua, pode cadastrá-la diretamente no celular ou enviar o <span className="text-emerald-400">"Link de Autocadastro de Eleitor"</span>. A pessoa abre no WhatsApp, preenche e o nome entra na base na hora!
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">4</div>
                  <div>
                    <strong className="text-zinc-200 block text-xs">Passo 4: Acompanhamento pelo Mapa de Calor e Relatórios</strong>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      O Coordenador Geral olha a aba <span className="text-blue-400">"Visão Geral"</span> ou <span className="text-blue-400">"Mapa"</span> para ver quais bairros têm mais apoiadores e quais estão abaixo da meta, remanejando a panfletagem.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 4: DISPAROS WHATSAPP WA.ME */}
          {activeSection === 'disparos' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Send className="w-5 h-5" />
                  Estratégia B: Disparo Assistido por Link Direto (wa.me) — 100% Gratuito
                </div>
                <p className="text-zinc-300 text-[11px]">
                  Para evitar custos com APIs de WhatsApp e risco de ter o número da campanha banido, o Nexus Política utiliza a tecnologia oficial <strong>wa.me</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2">
                  <strong className="text-zinc-200 text-xs block">Como funciona o envio grátis:</strong>
                  <ol className="list-decimal list-inside text-zinc-400 text-[11px] space-y-1">
                    <li>Você clica em <span className="text-emerald-400 font-bold">"Disparo WhatsApp"</span>.</li>
                    <li>Escolhe a mensagem (ex: Convocação para Reunião de Bairro).</li>
                    <li>O sistema personaliza com o nome do eleitor (<code className="text-emerald-300">{'{nome}'}</code>) e bairro (<code className="text-emerald-300">{'{bairro}'}</code>).</li>
                    <li>Você clica em <strong>"Disparar Próximo Eleitor"</strong> ou <strong>"Abrir no WhatsApp"</strong>.</li>
                    <li>O WhatsApp do seu celular/PC abre já com o texto pronto! Basta clicar em Enviar.</li>
                  </ol>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2">
                  <strong className="text-zinc-200 text-xs block">Vantagens Imbatíveis:</strong>
                  <ul className="list-disc list-inside text-emerald-400 text-[11px] space-y-1">
                    <li><strong>Custo Cero (R$ 0,00):</strong> Não paga R$ 0,05 ou R$ 0,10 por mensagem.</li>
                    <li><strong>Zero Risco de Bloqueio:</strong> É o seu WhatsApp oficial conversando com pessoas.</li>
                    <li><strong>Mensagens Personalizadas:</strong> Cada eleitor recebe a mensagem chamando pelo próprio nome.</li>
                    <li><strong>Rastreamento de Envio:</strong> O sistema marca automaticamente quem já foi contatado.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 5: DICAS PARA VENCER */}
          {activeSection === 'dicas' && (
            <div className="space-y-4">
              <h4 className="font-black text-zinc-200 text-sm uppercase">Segredos Táticos para Máximo Rendimento da Campanha</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                  <strong className="text-amber-400 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> 1. Atualize a Ordem do Dia
                  </strong>
                  <p className="text-zinc-400 text-[11px]">
                    Todos os dias de manhã, o Coordenador Geral deve escrever a "Ordem do Dia" no sistema. Isso alinha toda a militância sobre onde focar no dia.
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                  <strong className="text-blue-400 text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> 2. Estimule a Competição Saudável
                  </strong>
                  <p className="text-zinc-400 text-[11px]">
                    Mostre o Ranking de Líderes de Equipe nas reuniões semanais. Reconhecer os cabos eleitorais que mais cadastram motiva toda a rede.
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                  <strong className="text-emerald-400 text-xs flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> 3. Faça o Lembrete do Dia "D"
                  </strong>
                  <p className="text-zinc-400 text-[11px]">
                    No dia anterior e na manhã da eleição, use o disparo do WhatsApp para enviar o local de votação e o número do candidato para todos os eleitores da base.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 hidden sm:block">
            Nexus Política &bull; Sistema Tático de Gestão Eleitoral
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => downloadSystemManualDocx()}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Baixar (.docx)
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-md shadow-blue-600/20"
            >
              Fechar Manual
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
