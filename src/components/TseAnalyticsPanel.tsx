import React, { useState, useEffect } from 'react';
import { BarChart3, Brain, FileDown, AlertTriangle, CheckCircle, Search } from 'lucide-react';
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Inteligência Eleitoral (TSE x Base)</h2>
            <p className="text-sm text-slate-500">Cruzamento demográfico e geográfico com dados oficiais</p>
          </div>
        </div>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
          title="Importar novo CSV do TSE"
        >
          <FileDown className="w-4 h-4" />
          <span>Atualizar CSV</span>
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Painel de Comparação */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col justify-center">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Universo TSE (Mock)</span>
                <span className="text-3xl font-bold text-slate-800">{tseTotal.toLocaleString('pt-BR')}</span>
             </div>
             <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50 flex flex-col justify-center">
                <span className="text-xs text-indigo-500 uppercase tracking-wider font-semibold mb-1">Nossa Base Real</span>
                <span className="text-3xl font-bold text-indigo-700">{baseData?.totalCadastrados.toLocaleString('pt-BR')}</span>
             </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              Desvio Demográfico Detectado
            </h3>
            
            <div className="space-y-3">
               <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Mulheres (TSE: {(tseData.reduce((a,b)=>a+b.mulheres,0) / tseTotal * 100).toFixed(1)}%)</span>
                  <span className="font-medium text-amber-600">Base: {((baseData?.mulheres || 0) / (baseData?.totalCadastrados || 1) * 100).toFixed(1)}%</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${((baseData?.mulheres || 0) / (baseData?.totalCadastrados || 1) * 100)}%` }}></div>
               </div>

               <div className="flex justify-between text-sm pt-2">
                  <span className="text-slate-600">Homens (TSE: {(tseData.reduce((a,b)=>a+b.homens,0) / tseTotal * 100).toFixed(1)}%)</span>
                  <span className="font-medium text-emerald-600">Base: {((baseData?.homens || 0) / (baseData?.totalCadastrados || 1) * 100).toFixed(1)}%</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${((baseData?.homens || 0) / (baseData?.totalCadastrados || 1) * 100)}%` }}></div>
               </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Sua base tem proporção desequilibrada de mulheres em relação à realidade.
            </p>
          </div>
        </div>

        {/* Painel da Inteligência Artificial */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-5 text-white flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-500/30 p-2 rounded-lg">
              <Brain className="w-5 h-5 text-indigo-300" />
            </div>
            <h3 className="font-semibold text-lg">IA Estratégica</h3>
          </div>
          
          <p className="text-indigo-200 text-sm mb-6 flex-1">
            Cruze os dados demográficos do TSE com a sua base atual para encontrar oportunidades ocultas e gerar planos de ação automáticos para sua equipe.
          </p>

          {!insights && !isAiLoading && (
            <button 
              onClick={handleGenerateInsights}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              Gerar Diagnóstico
            </button>
          )}

          {isAiLoading && (
            <div className="w-full py-3 bg-indigo-800/50 rounded-lg text-indigo-300 text-sm text-center animate-pulse border border-indigo-700/50">
              Analisando cruzamentos de dados...
            </div>
          )}

          {insights && !isAiLoading && (
             <div className="mt-2 text-sm text-indigo-100 bg-black/20 p-4 rounded-lg overflow-y-auto max-h-64 custom-scrollbar">
                <div className="prose prose-invert prose-sm max-w-none">
                  {insights.split('\\n').map((paragraph, i) => (
                    <p key={i} className="mb-2 whitespace-pre-wrap">{paragraph}</p>
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
