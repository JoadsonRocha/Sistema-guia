import React from 'react';

interface KpiValueProps {
  value: string | number;
  label?: string;
  prefix?: string;
  suffix?: string;
}

export const KpiValue: React.FC<KpiValueProps> = ({ value, label, prefix, suffix }) => {
  return (
    <div className="flex flex-col">
      {label && <span className="text-sm font-medium text-slate-500 mb-1">{label}</span>}
      <div className="flex items-baseline">
        {prefix && <span className="text-xl font-semibold text-slate-400 mr-1">{prefix}</span>}
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate max-w-full">{value}</span>
        {suffix && <span className="text-lg font-medium text-slate-500 ml-1">{suffix}</span>}
      </div>
    </div>
  );
};
