import React from 'react';
import { Filter, Calendar } from 'lucide-react';

interface FilterBarProps {
  dateRange: 'all' | 'today' | 'week' | 'month';
  onDateRangeChange: (range: 'all' | 'today' | 'week' | 'month') => void;
  title?: string;
  actions?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  dateRange, 
  onDateRangeChange,
  title = "Visão Geral",
  actions
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center">
        <div className="p-2 bg-indigo-50 rounded-lg mr-3">
          <Filter className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
          <Calendar className="w-4 h-4 text-slate-400 ml-2 mr-1" />
          <select 
            className="bg-transparent border-none text-sm font-medium text-slate-700 py-1.5 pr-8 pl-2 focus:ring-0 cursor-pointer outline-none"
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value as any)}
          >
            <option value="all">Todo o Período</option>
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
          </select>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
