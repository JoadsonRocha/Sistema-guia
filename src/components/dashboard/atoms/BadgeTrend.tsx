import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface BadgeTrendProps {
  trend: 'up' | 'down' | 'neutral';
  value: string;
}

export const BadgeTrend: React.FC<BadgeTrendProps> = ({ trend, value }) => {
  const isUp = trend === 'up';
  const isDown = trend === 'down';
  
  return (
    <div
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium 
        ${isUp ? 'bg-green-100 text-green-800' : ''}
        ${isDown ? 'bg-red-100 text-red-800' : ''}
        ${!isUp && !isDown ? 'bg-slate-100 text-slate-800' : ''}
      `}
    >
      {isUp && <ArrowUpRight className="w-3 h-3 mr-1" />}
      {isDown && <ArrowDownRight className="w-3 h-3 mr-1" />}
      {!isUp && !isDown && <Minus className="w-3 h-3 mr-1" />}
      {value}
    </div>
  );
};
