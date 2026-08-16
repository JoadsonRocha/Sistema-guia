import React from 'react';
import { KpiValue } from '../atoms/KpiValue';
import { BadgeTrend } from '../atoms/BadgeTrend';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ElementType;
  prefix?: string;
  suffix?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  trend,
  trendValue,
  icon: Icon,
  prefix,
  suffix
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        {Icon && (
          <div className="p-2 bg-slate-50 rounded-lg">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <KpiValue value={value} prefix={prefix} suffix={suffix} />
        {trend && trendValue && (
          <div className="mb-1">
            <BadgeTrend trend={trend} value={trendValue} />
          </div>
        )}
      </div>
    </div>
  );
};
