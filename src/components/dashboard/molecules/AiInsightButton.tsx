import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface AiInsightButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export const AiInsightButton: React.FC<AiInsightButtonProps> = ({ onClick, isLoading }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="relative group inline-flex items-center justify-center px-4 py-2 font-medium text-white transition-all duration-200 bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
    >
      <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
      
      {isLoading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : (
        <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
      )}
      
      <span className="relative">
        {isLoading ? 'Analisando dados...' : 'Gerar Insights com IA'}
      </span>
    </button>
  );
};
