import React, { useState, useMemo } from 'react';
import { Send, CheckCircle2, Copy, X, MessageSquare, ShieldCheck, Sparkles, Users, ExternalLink, ArrowRight, Check, Search, Filter, RefreshCw, Settings2 } from 'lucide-react';
import { whatsappService, WaMeRecipientLink } from '../services/whatsappService';
import { gerarMensagemWhatsApp } from '../services/groqService';

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

  // Modo de disparo: wame (manual) ou api (automático via Evolution)
  const [dispatchMode, setDispatchMode] = useState<'wame' | 'api'>('wame');
  const [showApiConfig, setShowApiConfig] = useState<boolean>(false);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiInstance, setApiInstance] = useState<string>('');
  const [isBulkSending, setIsBulkSending] = useState<boolean>(false);
  const [failedMap, setFailedMap] = useState<Record<string, string>>({});

  // Status de envio individual
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQueueIndex, setActiveQueueIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Carregar configurações da Evolution API ao abrir
  React.useEffect(() => {
    if (isOpen) {
      const creds = whatsappService.getEvolutionCredentials();
      setApiUrl(creds.url);
      setApiKey(creds.apiKey);
      setApiInstance(creds.instance);
    }
  }, [isOpen]);

  const handleSaveApiConfig = () => {
    whatsappService.setEvolutionCredentials(apiUrl, apiKey, apiInstance);
    alert('Configurações da Evolution API salvas com sucesso!');
    setShowApiConfig(false);
  };

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
    const pendingItem = (preparedBatch || []).find((_, idx) => _ && idx >= activeQueueIndex && !sentMap[_.id]);
    if (pendingItem) {
      handleOpenWaMe(pendingItem);
      const nextIdx = (preparedBatch || []).findIndex(i => i && i.id === pendingItem.id) + 1;
      setActiveQueueIndex(nextIdx);
    } else {
      alert('Todas as mensagens da fila já foram disparadas!');
    }
  };

  const handleSendViaApi = async (item: WaMeRecipientLink) => {
    if (!apiUrl || !apiKey || !apiInstance) {
      alert('Configurações da Evolution API incompletas. Por favor, clique no ícone de engrenagem para configurar.');
      setShowApiConfig(true);
      return;
    }
    const res = await whatsappService.sendEvolutionMessage(item.phone, item.interpolatedText);
    if (res.success) {
      setSentMap(prev => ({ ...prev, [item.id]: true }));
      setFailedMap(prev => {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      });
      whatsappService.logDispatch(item.name, item.phone, item.interpolatedText);
    } else {
      setFailedMap(prev => ({ ...prev, [item.id]: res.message || 'Erro desconhecido' }));
    }
  };

  const handleBulkSendViaApi = async () => {
    if (!apiUrl || !apiKey || !apiInstance) {
      alert('Configurações da Evolution API incompletas. Por favor, clique no ícone de engrenagem para configurar.');
      setShowApiConfig(true);
      return;
    }

    const pendingList = preparedBatch.filter(item => !sentMap[item.id]);
    if (pendingList.length === 0) {
      alert('Nenhuma mensagem pendente na fila para disparar!');
      return;
    }

    if (!confirm(`Deseja disparar automaticamente ${pendingList.length} mensagens com intervalo de segurança de 1.5s?`)) {
      return;
    }

    setIsBulkSending(true);

    for (const item of pendingList) {
      const res = await whatsappService.sendEvolutionMessage(item.phone, item.interpolatedText);
      if (res.success) {
        setSentMap(prev => ({ ...prev, [item.id]: true }));
        setFailedMap(prev => {
          const copy = { ...prev };
          delete copy[item.id];
          return copy;
        });
        whatsappService.logDispatch(item.name, item.phone, item.interpolatedText);
      } else {
        setFailedMap(prev => ({ ...prev, [item.id]: res.message || 'Erro desconhecido' }));
      }
      // Intervalo de segurança anti-bloqueio
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsBulkSending(false);
    alert('Disparo automático em lote finalizado!');
  };

  const handleGenerateMessage = async () => {
    setIsGenerating(true);
    try {
      const contextoMap: Record<string, string> = {
        convocacao: 'Convocar eleitores para uma reunião ou ação de rua da campanha, motivando a participação e reforçando o engajamento comunitário',
        dia_d: 'Lembrar os eleitores de que é dia de eleição, motivar o voto e dar instruções de como encontrar o local de votação',
        demanda: 'Informar que a solicitação/demanda cadastrada pelo eleitor foi registrada e está sendo acompanhada pela equipe de campanha',
        cadastro: 'Dar boas-vindas a um novo eleitor cadastrado no sistema, agradecendo o apoio e reforçando o senso de comunidade',
      };
      const publicoMap: Record<string, string> = {
        voters: 'Eleitor comum da base da campanha',
        leaders: 'Líder comunitário / Cabo Eleitoral',
      };
      const contexto = contextoMap[templateType] || 'Mobilização geral da campanha';
      const publico = publicoMap[targetAudience] || 'Apoiador da campanha';
      const mensagem = await gerarMensagemWhatsApp(contexto, publico, 'nosso candidato');
      // Preservar as variáveis de interpolação ajustando o texto gerado
      const mensagemFinal = mensagem.trim();
      setCustomMessage(mensagemFinal);
    } catch (err: any) {
      alert(`❌ Erro ao gerar mensagem com I.A.: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const sentCount = Object.keys(sentMap).filter(k => (preparedBatch || []).some(p => p && p.id === k)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 md:p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="px-5 md:px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-tertiary)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900/50 shadow-sm shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-[var(--text-primary)] tracking-wide flex items-center gap-2">
                Centro de Disparo Estratégico
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Envio manual e automático para bases da campanha</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-color)] rounded-xl transition-all shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">

          {/* Banner Estratégico */}
          <div className="px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 rounded-xl flex items-start md:items-center gap-3 text-xs shadow-sm">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 md:mt-0" />
            <div className="flex-1 font-medium leading-relaxed">
              <strong>Controle Total:</strong> Personalização instantânea de variáveis como <code className="font-mono bg-emerald-100 dark:bg-emerald-500/20 px-1 py-0.5 rounded text-emerald-800 dark:text-emerald-300">{'{nome}'}</code> e <code className="font-mono bg-emerald-100 dark:bg-emerald-500/20 px-1 py-0.5 rounded text-emerald-800 dark:text-emerald-300">{'{bairro}'}</code>. Alterne livremente entre o modo de envio manual 100% gratuito (wa.me) e a automação de alta velocidade (Evolution API).
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Painel Esquerdo: Configuração da Mensagem */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              
              {/* Seleção do Modo de Disparo */}
              <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest flex items-center gap-2">
                    Mecânica de Disparo
                  </label>
                  {dispatchMode === 'api' && (
                    <button
                      type="button"
                      onClick={() => setShowApiConfig(!showApiConfig)}
                      className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1 transition-colors"
                      title="Configurar Evolution API"
                    >
                      <Settings2 className="w-3.5 h-3.5" /> API
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDispatchMode('wame')}
                    className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                      dispatchMode === 'wame'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-500/50 dark:text-emerald-400 shadow-sm'
                        : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-300 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>📱 wa.me Seguro</span>
                    <span className="text-[9px] font-medium opacity-80">Manual / Grátis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchMode('api')}
                    className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                      dispatchMode === 'api'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/30 dark:border-blue-500/50 dark:text-blue-400 shadow-sm'
                        : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-blue-300 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>🤖 Evolution API</span>
                    <span className="text-[9px] font-medium opacity-80">Automático em Lote</span>
                  </button>
                </div>

                {/* Configuração da Evolution API */}
                {dispatchMode === 'api' && showApiConfig && (
                  <div className="mt-4 p-3.5 bg-[var(--bg-secondary)] border border-blue-200 dark:border-blue-900/50 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-inner">
                    <div className="grid grid-cols-1 gap-2.5">
                      <div>
                        <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase block mb-1">URL da API</label>
                        <input
                          type="text"
                          placeholder="https://api.servidor.com"
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs p-2.5 rounded-xl font-medium focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase block mb-1">Global API Key</label>
                        <input
                          type="password"
                          placeholder="Sua Global Apikey"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs p-2.5 rounded-xl font-medium focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase block mb-1">Instância (Session)</label>
                        <input
                          type="text"
                          placeholder="instancia_campanha"
                          value={apiInstance}
                          onChange={(e) => setApiInstance(e.target.value)}
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs p-2.5 rounded-xl font-medium focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleSaveApiConfig}
                        className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-sm active:scale-95"
                      >
                        Salvar Credenciais
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Público-Alvo e Filtros */}
              <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl shadow-sm space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest flex items-center gap-2 mb-2.5">
                    <Users className="w-3.5 h-3.5 text-blue-500" /> Público-Alvo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTargetAudience('voters')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        targetAudience === 'voters'
                          ? 'bg-[var(--bg-secondary)] border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                      }`}
                    >
                      <div className="text-xs font-bold">Eleitores</div>
                      <div className="text-[10px] opacity-70 font-medium">{voters.filter(v => v.phone).length} Contatos</div>
                    </button>
                    <button
                      onClick={() => setTargetAudience('leaders')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        targetAudience === 'leaders'
                          ? 'bg-[var(--bg-secondary)] border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                      }`}
                    >
                      <div className="text-xs font-bold">Lideranças</div>
                      <div className="text-[10px] opacity-70 font-medium">{leaders.filter(l => l.phone).length} Contatos</div>
                    </button>
                  </div>
                </div>

                {targetAudience === 'voters' && neighborhoods.length > 0 && (
                  <div>
                    <label className="text-[9px] font-bold uppercase text-[var(--text-secondary)] tracking-wider block mb-1.5">Recorte Geográfico</label>
                    <select
                      value={selectedNeighborhood}
                      onChange={(e) => setSelectedNeighborhood(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[11px] font-bold text-[var(--text-primary)] p-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition-all shadow-sm"
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
              </div>

              {/* Construtor de Mensagem */}
              <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl shadow-sm space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest flex items-center gap-2 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Estrutura da Mensagem
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
                        className={`p-2 text-[10px] font-bold rounded-lg border text-center transition-all ${
                          templateType === t.id
                            ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-500/50 dark:text-amber-400'
                            : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <label className="text-[9px] font-bold uppercase text-[var(--text-secondary)] tracking-wider">Conteúdo</label>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleGenerateMessage}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-white rounded-md transition-colors active:scale-95 disabled:opacity-50"
                        title="Usar Inteligência Estratégica (Groq API) para escrever uma mensagem de alta conversão"
                      >
                        {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {isGenerating ? 'Gerando texto...' : 'Gerar com I.A.'}
                      </button>
                      <span className="text-[9px] text-[var(--text-secondary)]">Variáveis: <code className="text-emerald-600 dark:text-emerald-400 font-bold">{`{nome}`}</code>, <code className="text-emerald-600 dark:text-emerald-400 font-bold">{`{bairro}`}</code></span>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-medium p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-all shadow-inner resize-none"
                    placeholder="Escreva a mensagem personalizada..."
                  />
                </div>
              </div>

            </div>

            {/* Painel Direito: Fila de Disparo e Destinatários */}
            <div className="lg:col-span-7 flex flex-col h-full gap-4">
              
              {/* Header da Fila */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold uppercase tracking-wide text-[var(--text-primary)] flex items-center gap-2">
                      Fila de Destinatários
                      <span className="bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full text-[10px] border border-[var(--border-color)] text-[var(--text-secondary)]">
                        {preparedBatch.length}
                      </span>
                    </h4>
                    <p className="text-[10px] font-medium text-[var(--text-secondary)]">
                      Progresso: {sentCount} enviados ({Math.round((sentCount / Math.max(1, preparedBatch.length)) * 100)}%)
                    </p>
                  </div>
                </div>

                <div className="relative max-w-[200px] w-full">
                  <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar contato..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[11px] font-medium text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Botão de Disparo Geral / Automação */}
              <div className="p-1">
                {dispatchMode === 'api' ? (
                  <button
                    type="button"
                    onClick={handleBulkSendViaApi}
                    disabled={preparedBatch.length === 0 || sentCount === preparedBatch.length || isBulkSending}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-400 text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
                  >
                    {isBulkSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Disparando Lote...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Iniciar Automação API ({preparedBatch.length - sentCount} Pendentes)
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLaunchNextInQueue}
                    disabled={preparedBatch.length === 0 || sentCount === preparedBatch.length}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-400 text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Disparar Próximo da Fila Manualmente ({preparedBatch.length - sentCount} Restantes)
                  </button>
                )}
              </div>

              {/* Lista Scrollável com Cards Reais */}
              <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl p-3 flex-1 overflow-y-auto custom-scrollbar shadow-inner min-h-[300px]">
                {preparedBatch.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-60">
                    <Users className="w-10 h-10 text-[var(--text-secondary)]" />
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">
                      Nenhum contato encontrado para o público ou filtros selecionados.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {preparedBatch.map((item, idx) => {
                      const isSent = sentMap[item.id];
                      const errorMsg = failedMap[item.id];
                      
                      let cardStyle = "bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-blue-400";
                      if (isSent) cardStyle = "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50";
                      if (errorMsg) cardStyle = "bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50";

                      return (
                        <div key={item.id} className={`p-3.5 rounded-xl transition-all shadow-sm flex flex-col gap-3 group ${cardStyle}`}>
                          
                          {/* Topo do Card: Info e Status */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-md bg-[var(--bg-tertiary)] flex items-center justify-center text-[9px] font-black text-[var(--text-secondary)] shrink-0 border border-[var(--border-color)]">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <h5 className="text-[11px] font-bold text-[var(--text-primary)] truncate">{item.name}</h5>
                                <p className="text-[10px] font-mono text-[var(--text-secondary)]">{item.phone}</p>
                              </div>
                            </div>
                            
                            {/* Badges de Status */}
                            <div className="flex items-center gap-2 shrink-0">
                              {isSent && (
                                <span className="text-[9px] px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                                  <CheckCircle2 className="w-3 h-3" /> OK
                                </span>
                              )}
                              {errorMsg && (
                                <span className="text-[9px] px-2 py-1 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 font-bold flex items-center gap-1 max-w-[120px] truncate uppercase tracking-wider" title={errorMsg}>
                                  ⚠️ ERRO
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Meio: Preview da Mensagem Renderizada */}
                          <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed italic line-clamp-2">
                            {item.interpolatedText}
                          </div>

                          {/* Base: Ações do Card */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border-color)] mt-1">
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(item)}
                              title="Copiar texto gerado"
                              className="px-2.5 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-blue-600 border border-[var(--border-color)] rounded-lg transition-colors text-[10px] font-bold flex items-center gap-1.5"
                            >
                              {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              <span>Copiar</span>
                            </button>

                            {dispatchMode === 'api' ? (
                              <button
                                type="button"
                                onClick={() => handleSendViaApi(item)}
                                disabled={isBulkSending}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all active:scale-95 border ${
                                  isSent
                                    ? 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-600'
                                    : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400 hover:bg-blue-100 shadow-sm'
                                }`}
                              >
                                <ExternalLink className="w-3 h-3" />
                                {isSent ? 'Reenviar' : 'Enviar via API'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenWaMe(item)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all active:scale-95 border ${
                                  isSent
                                    ? 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-emerald-600'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400 hover:bg-emerald-100 shadow-sm'
                                }`}
                              >
                                <ExternalLink className="w-3 h-3" />
                                {isSent ? 'Reenviar wa.me' : 'Abrir App'}
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 md:px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center flex-wrap gap-2 md:gap-4 text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-2.5 py-1 rounded-lg">
              Fila: <strong className="text-[var(--text-primary)]">{preparedBatch.length}</strong>
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50 px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-400">
              Concluídos: <strong>{sentCount}</strong>
            </span>
            <span className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-2.5 py-1 rounded-lg">
              Custo Estimado: <strong className="text-[var(--text-primary)]">R$ 0,00</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold bg-[var(--bg-tertiary)] hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl transition-all shadow-sm active:scale-95"
          >
            Fechar Ferramenta
          </button>
        </div>

      </div>
    </div>
  );
};
