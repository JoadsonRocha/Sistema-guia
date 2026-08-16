import React from 'react';

interface KpiGridProps {
  children: React.ReactNode;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {children}
    </div>
  );
};
