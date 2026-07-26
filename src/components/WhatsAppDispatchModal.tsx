import React, { useState, useMemo } from 'react';
import { Send, CheckCircle2, Copy, X, MessageSquare, ShieldCheck, Sparkles, Users, ExternalLink, ArrowRight, Check, Search, Filter } from 'lucide-react';
import { whatsappService, WaMeRecipientLink } from '../services/whatsappService';

interface WhatsAppDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  voters?: any[];
  leaders?: any[];
}

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({
  isOpen,
  onClose,
  voters = [],
  leaders = []
}) => {
  const [targetAudience, setTargetAudience] = useState<'voters' | 'leaders'>('voters');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [templateType, setTemplateType] = useState<string>('convocacao');
  const [customMessage, setCustomMessage] = useState<string>(
    'Olá {nome}! Gostaria de lembrar você da nossa importante reunião de campanha no bairro {bairro}. Contamos com a sua presença e apoio! 🚀'
  );

  // Status de envio individual
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQueueIndex, setActiveQueueIndex] = useState<number>(0);

  if (!isOpen) return null;

  // Lista de bairros para filtro
  const neighborhoods = Array.from(new Set(voters.map(v => v.neighborhood).filter(Boolean)));

  // Filtragem dos destinatários
  const rawRecipients = targetAudience === 'voters'
    ? voters.filter(v => (selectedNeighborhood === 'ALL' || v.neighborhood === selectedNeighborhood) && v.phone)
    : leaders.filter(l => l.phone);

  const searchFilteredRecipients = rawRecipients.filter(r => {
    const name = (r.name || r.leader || '').toLowerCase();
    const phone = (r.phone || '').toLowerCase();
    const term = searchFilter.toLowerCase();
    return name.includes(term) || phone.includes(term);
  });

  // Geração dos links wa.me otimizados
  const preparedBatch: WaMeRecipientLink[] = whatsappService.prepareWaMeBatch(
    searchFilteredRecipients.map(r => ({
      id: r.id || r.phone,
      name: r.name || r.leader || 'Apoiador',
      phone: r.phone,
      vars: {
        bairro: r.neighborhood || 'Sua Região',
        lider: r.caboName || 'Coordenação'
      }
    })),
    customMessage
  );

  const handleTemplateChange = (type: string) => {
    setTemplateType(type);
    if (type === 'convocacao') {
      setCustomMessage('Olá {nome}! Você é parte essencial da nossa mobilização em {bairro}. Contamos com você para nossa grande ação de rua nesta semana! 🚀');
    } else if (type === 'dia_d') {
      setCustomMessage('Atenção {nome}! O Dia da Eleição chegou. Verifique seu local de votação e confirme seu apoio para transformarmos {bairro}. Votamos juntos! 🗳️');
    } else if (type === 'demanda') {
      setCustomMessage('Olá {nome}, informamos que sua solicitação cadastrada no sistema Nexus Política foi registrada e encaminhada para acompanhamento estratégico. Abraço!');
    } else if (type === 'cadastro') {
      setCustomMessage('Seja bem-vindo(a) {nome}! Seu cadastro foi confirmado com sucesso no Nexus Política. Juntos somos mais fortes por {bairro}! ✅');
    }
  };

  const handleOpenWaMe = (item: WaMeRecipientLink) => {
    window.open(item.waMeUrl, '_blank', 'noopener,noreferrer');
    setSentMap(prev => ({ ...prev, [item.id]: true }));
    whatsappService.logDispatch(item.name, item.phone, item.interpolatedText);
  };

  const handleCopyMessage = (item: WaMeRecipientLink) => {
    navigator.clipboard.writeText(item.interpolatedText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLaunchNextInQueue = () => {
    const pendingItem = preparedBatch.find((_, idx) => idx >= activeQueueIndex && !sentMap[_.id]);
    if (pendingItem) {
      handleOpenWaMe(pendingItem);
      const nextIdx = preparedBatch.findIndex(i => i.id === pendingItem.id) + 1;
      setActiveQueueIndex(nextIdx);
    } else {
      alert('Todas as mensagens da fila já foram disparadas!');
    }
  };

  const sentCount = Object.keys(sentMap).filter(k => preparedBatch.some(p => p.id === k)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-600/10 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-[var(--text-primary)] tracking-wide flex items-center gap-2">
                Disparo Assistido via WhatsApp (Gratuito / wa.me)
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">100% GRATUITO</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Envio direto sem custo de API, sem risco de bloqueio e com personalização por eleitor</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 md:p-6 space-y-5 overflow-y-auto flex-1">

          {/* Banner Estratégico */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3 text-xs text-emerald-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Estratégia de Disparo Assistido (Zero Custo):</strong> Como a mensagem é enviada diretamente do seu WhatsApp para cada eleitor com dados personalizados (<code className="text-emerald-400 font-mono">{'{nome}'}</code>, <code className="text-emerald-400 font-mono">{'{bairro}'}</code>), o custo é <strong>R$ 0,00</strong>, o recebimento é garantido e a campanha tem total controle de quem já foi contatado.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Painel Esquerdo: Configuração da Mensagem */}
            <div className="lg:col-span-5 space-y-4 border-r border-[var(--border-color)] lg:pr-5">
              
              {/* Público-Alvo */}
              <div>
                <label className="text-xs font-bold uppercase text-[var(--text-secondary)] flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-400" /> 1. Público-Alvo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTargetAudience('voters')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      targetAudience === 'voters'
                        ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-bold'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs">Base Eleitores</div>
                    <div className="text-[10px] text-zinc-500">{voters.filter(v => v.phone).length} cadastrados</div>
                  </button>

                  <button
                    onClick={() => setTargetAudience('leaders')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      targetAudience === 'leaders'
                        ? 'bg-emerald-600/15 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs">Líderes / Cabos</div>
                    <div className="text-[10px] text-zinc-500">{leaders.filter(l => l.phone).length} cadastrados</div>
                  </button>
                </div>
              </div>

              {/* Filtro por Bairro (se eleitores) */}
              {targetAudience === 'voters' && neighborhoods.length > 0 && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-1">Filtrar por Bairro / Região</label>
                  <select
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 p-2 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">Todos os Bairros ({voters.length})</option>
                    {neighborhoods.map((n: string) => (
                      <option key={n} value={n}>
                        {n} ({voters.filter(v => v.neighborhood === n).length})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Modelos de Mensagem */}
              <div>
                <label className="text-xs font-bold uppercase text-[var(--text-secondary)] flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> 2. Modelo de Mensagem
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'convocacao', label: '📢 Convocação' },
                    { id: 'dia_d', label: '🗳️ Dia D Eleição' },
                    { id: 'demanda', label: '📋 Status Demanda' },
                    { id: 'cadastro', label: '✅ Boas-vindas' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleTemplateChange(t.id)}
                      className={`p-2 text-[11px] rounded border text-center transition-all ${
                        templateType === t.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor de Texto com Tags */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-[var(--text-secondary)]">Texto do Template</label>
                  <span className="text-[9px] text-zinc-400">Tags: <code className="text-emerald-400">{`{nome}`}</code>, <code className="text-emerald-400">{`{bairro}`}</code></span>
                </div>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 p-2.5 rounded-lg focus:outline-none focus:border-emerald-500 font-sans"
                  placeholder="Escreva a mensagem personalizada..."
                />
              </div>

              {/* Ação Rapida: Disparar Próximo da Fila */}
              <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-300">Fila de Envios Sequencial</span>
                  <span className="text-emerald-400">{sentCount} / {preparedBatch.length} Enviados</span>
                </div>
                
                <button
                  onClick={handleLaunchNextInQueue}
                  disabled={preparedBatch.length === 0 || sentCount === preparedBatch.length}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                  🚀 Disparar Próximo Eleitor ({preparedBatch.length - sentCount} Restantes)
                </button>
              </div>

            </div>

            {/* Painel Direito: Lista Individualizada de Eleitores */}
            <div className="lg:col-span-7 space-y-3 flex flex-col">
              
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase text-[var(--text-secondary)] flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-400" />
                  3. Destinatários Personalizados ({preparedBatch.length})
                </label>

                {/* Search Bar */}
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar eleitor/fone..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 rounded focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Lista Scrollável */}
              <div className="border border-[var(--border-color)] rounded-lg bg-zinc-950/50 divide-y divide-zinc-800/60 max-h-[380px] overflow-y-auto flex-1">
                {preparedBatch.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    Nenhum eleitor ou líder com WhatsApp cadastrado para os filtros selecionados.
                  </div>
                ) : (
                  preparedBatch.map((item, idx) => {
                    const isSent = sentMap[item.id];
                    return (
                      <div 
                        key={item.id} 
                        className={`p-3 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          isSent ? 'bg-emerald-950/20' : 'hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-mono">#{idx + 1}</span>
                            <span className="text-xs font-bold text-zinc-200 truncate">{item.name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">({item.phone})</span>
                            {isSent && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Enviado
                              </span>
                            )}
                          </div>

                          <div className="p-2 bg-zinc-900/80 border border-zinc-800/80 rounded text-[11px] text-zinc-300 font-sans line-clamp-2">
                            "{item.interpolatedText}"
                          </div>
                        </div>

                        {/* Botões de Ação por Eleitor */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleCopyMessage(item)}
                            title="Copiar mensagem individual"
                            className="p-2 text-zinc-400 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors text-xs flex items-center gap-1"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleOpenWaMe(item)}
                            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow ${
                              isSent
                                ? 'bg-zinc-800 text-emerald-400 hover:bg-zinc-700'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                            }`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {isSent ? 'Reenviar WhatsApp' : 'Abrir no WhatsApp'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-400 flex items-center gap-3">
            <span>Destinatários: <strong className="text-zinc-200">{preparedBatch.length}</strong></span>
            <span>Contatados: <strong className="text-emerald-400">{sentCount}</strong></span>
            <span>Custo Total: <strong className="text-emerald-400">R$ 0,00</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
          >
            Fechar Janela
          </button>
        </div>

      </div>
    </div>
  );
};
