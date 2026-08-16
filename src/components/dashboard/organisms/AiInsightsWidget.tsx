import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { AiInsightButton } from '../molecules/AiInsightButton';
import { analisarDashboard } from '../../../services/groqService';

interface AiInsightsWidgetProps {
  dashboardData: any;
}

export const AiInsightsWidget: React.FC<AiInsightsWidgetProps> = ({ dashboardData }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsight = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await analisarDashboard(dashboardData);
      setInsight(response);
    } catch (err: any) {
      setError(err.message || "Não foi possível gerar os insights. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format basic markdown to HTML for display
  const formatMarkdown = (text: string) => {
    // Bold
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Bullet points (basic handling)
    formatted = formatted.replace(/^- (.*)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/<li>(.*?)<\/li>/gs, '<ul class="list-disc pl-5 my-2">$&</ul>');
    // Remove consecutive <ul> tags by a rough hack, or just let CSS handle it.
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br/>');
    return formatted;
  };

  if (!insight && !isLoading && !error) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between mb-6 shadow-sm">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Insights Inteligentes</h3>
            <p className="text-slate-600 text-sm">Deixe nossa inteligência artificial analisar seus números e gerar recomendações táticas.</p>
          </div>
        </div>
        <AiInsightButton onClick={generateInsight} isLoading={isLoading} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border-l-4 border-l-indigo-500 border border-slate-100 p-6 mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <button onClick={() => { setInsight(null); setError(null); }} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-start mb-4">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mr-3 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Análise Estratégica</h3>
          <p className="text-xs text-slate-500">Gerado pela I.A. Groq</p>
        </div>
      </div>

      {isLoading && (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                <div className="h-2 bg-slate-200 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
          {error}
          <div className="mt-3">
             <AiInsightButton onClick={generateInsight} isLoading={false} />
          </div>
        </div>
      )}

      {insight && (
        <div 
          className="text-slate-700 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(insight) }}
        />
      )}
    </div>
  );
};
