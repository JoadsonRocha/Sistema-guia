import React, { useState, useEffect } from 'react';
import { BarChart3, Brain, FileDown, AlertTriangle, CheckCircle, Search, ExternalLink } from 'lucide-react';
import { tseAnalyticsService, TseDemographicData, CampaignBaseData } from '../lib/tseAnalyticsService';
import { generateCampaignInsights } from '../services/groqService';

export function TseAnalyticsPanel({ coordinatorId }: { coordinatorId?: string }) {
  const [tseData, setTseData] = useState<TseDemographicData[]>([]);
  const [baseData, setBaseData] = useState<CampaignBaseData | null>(null);
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [coordinatorId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // In a real scenario, you'd parse a real CSV here. We use the mock from the service.
      const context = await tseAnalyticsService.prepareAiContext(coordinatorId);
      setTseData(context.tseData);
      setBaseData(context.baseData);
    } catch (error) {
      console.error("Error loading TSE data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    setIsAiLoading(true);
    try {
      const result = await generateCampaignInsights(tseData, baseData);
      setInsights(result);
    } catch (error) {
      console.error("Error generating insights:", error);
      setInsights("Erro ao gerar insights da IA. Verifique sua chave da Groq.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center animate-pulse">Carregando dados eleitorais...</div>;
  }

  const tseTotal = tseData.reduce((acc, curr) => acc + curr.totalEleitores, 0);

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden mb-6 transition-colors">
      <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 shadow-sm">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Inteligência Eleitoral (TSE x Base)</h2>
            <p className="text-xs text-[var(--text-secondary)]">Cruzamento demográfico e geográfico com dados oficiais</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a 
            href="https://dadosabertos.tse.jus.br/dataset/eleitorado-atual" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-zinc-800 px-3 py-2 rounded-lg border border-[var(--border-color)] shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Baixar Dados (TSE)</span>
          </a>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 rounded-lg text-sm font-bold tracking-tight transition-colors shadow-sm shadow-indigo-500/20"
            title="Importar novo CSV do TSE"
          >
            <FileDown className="w-4 h-4" />
            <span>Atualizar CSV</span>
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Painel de Comparação */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              <strong>Base Nativa (Roraima):</strong> Os dados demográficos oficiais do TSE de Roraima já estão <strong>pré-carregados no código do sistema</strong> para uso imediato. Eles mostram o universo total de eleitores do estado (cenário da guerra), e não os eleitores cadastrados pelas suas equipes.
              <br/><br/>
              <strong>Outros Estados:</strong> Caso você gerencie campanhas fora de Roraima, basta baixar o CSV público no portal do TSE (botão acima) e clicar em <strong>"Atualizar CSV"</strong> para importar os dados do seu estado.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex flex-col justify-center relative overflow-hidden shadow-sm">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-full blur-xl"></div>
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Universo TSE (Público-Alvo)</span>
                <span className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{tseTotal.toLocaleString('pt-BR')}</span>
             </div>
             <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-900/20 flex flex-col justify-center relative overflow-hidden shadow-sm">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-300/30 dark:bg-indigo-700/30 rounded-full blur-xl"></div>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Nossa Base (Captados)</span>
                <span className="text-3xl font-black text-indigo-700 dark:text-indigo-300 tracking-tight">{baseData?.totalCadastrados.toLocaleString('pt-BR')}</span>
             </div>
          </div>

          <div className="bg-[var(--bg-tertiary)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              Diagnóstico Demográfico Rápido
            </h3>
            
            <div className="space-y-3">
               <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-[var(--text-secondary)]">Mulheres (TSE: {(tseData.reduce((a,b)=>a+b.mulheres,0) / (tseTotal || 1) * 100).toFixed(1)}%)</span>
                  <span className="text-amber-600 dark:text-amber-500">Base: {((baseData?.mulheres || 0) / (baseData?.totalCadastrados || 1) * 100).toFixed(1)}%</span>
               </div>
               <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                  <div className="bg-amber-500 dark:bg-amber-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${((baseData?.mulheres || 0) / (baseData?.totalCadastrados || 1) * 100)}%` }}></div>
               </div>

               <div className="flex justify-between text-xs font-bold uppercase tracking-wider pt-2">
                  <span className="text-[var(--text-secondary)]">Homens (TSE: {(tseData.reduce((a,b)=>a+b.homens,0) / (tseTotal || 1) * 100).toFixed(1)}%)</span>
                  <span className="text-emerald-600 dark:text-emerald-500">Base: {((baseData?.homens || 0) / (baseData?.totalCadastrados || 1) * 100).toFixed(1)}%</span>
               </div>
               <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                  <div className="bg-emerald-500 dark:bg-emerald-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${((baseData?.homens || 0) / (baseData?.totalCadastrados || 1) * 100)}%` }}></div>
               </div>
            </div>
            
            {(tseTotal === 0 || !baseData?.totalCadastrados) ? (
              <p className="text-xs font-medium text-[var(--text-secondary)] mt-5 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg">
                <CheckCircle className="w-4 h-4 text-zinc-400" />
                Aguardando importação do TSE e/ou cadastro de eleitores para gerar diagnóstico.
              </p>
            ) : (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-5 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Os dados podem indicar uma discrepância na captação por gênero. Considere redirecionar o foco das equipes.
              </p>
            )}
          </div>
        </div>

        {/* Painel da Inteligência Artificial */}
        <div className="bg-zinc-950 dark:bg-[#09090b] rounded-2xl p-6 text-white flex flex-col relative overflow-hidden border border-zinc-800 shadow-xl shadow-zinc-900/20">
          {/* Subtle gradient background for AI feel */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-blue-600/10 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="bg-indigo-500/20 p-2.5 rounded-2xl border border-indigo-500/30">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black tracking-tight text-lg leading-none">IA Estratégica</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Análise Cruzada Automática</p>
            </div>
          </div>
          
          <p className="text-zinc-300 text-xs leading-relaxed mb-6 flex-1 relative z-10 font-medium">
            Solicite que a Inteligência Artificial cruze os dados demográficos do TSE com a sua base para descobrir oportunidades ocultas e gerar planos de ação sob medida para a equipe.
          </p>

          {!insights && !isAiLoading && (
            <button 
              onClick={handleGenerateInsights}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold tracking-tight transition-all shadow-lg shadow-indigo-600/20 flex justify-center items-center gap-2 border border-indigo-500 relative z-10"
            >
              <Brain className="w-4 h-4" />
              Gerar Diagnóstico
            </button>
          )}

          {isAiLoading && (
            <div className="w-full py-3 bg-indigo-950/50 rounded-2xl text-indigo-400 text-xs font-bold tracking-tight text-center animate-pulse border border-indigo-800/50 relative z-10">
              Processando matriz cruzada...
            </div>
          )}

          {insights && !isAiLoading && (
             <div className="mt-2 text-xs text-zinc-300 bg-black/40 p-4 rounded-2xl overflow-y-auto max-h-64 custom-scrollbar border border-zinc-800 relative z-10">
                <div className="prose prose-invert prose-sm max-w-none">
                  {insights.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-2 whitespace-pre-wrap leading-relaxed">{paragraph}</p>
                  ))}
                </div>
                <button 
                  onClick={handleGenerateInsights}
                  className="mt-4 text-xs text-indigo-300 hover:text-white underline w-full text-center"
                >
                  Regerar Análise
                </button>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
