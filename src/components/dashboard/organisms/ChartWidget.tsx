import React, { useRef } from 'react';
import { ExportMenu } from '../molecules/ExportMenu';
import html2canvas from 'html2canvas';

interface ChartWidgetProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  title,
  subtitle,
  children,
  onExportCsv,
  onExportPdf
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExport = async (format: 'pdf' | 'csv' | 'png') => {
    if (format === 'csv' && onExportCsv) {
      onExportCsv();
      return;
    }
    
    if (format === 'pdf' && onExportPdf) {
      onExportPdf();
      return;
    }

    if (format === 'png' || format === 'pdf') {
      if (!chartRef.current) return;
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2 // High quality
        });
        
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
        link.href = imgData;
        link.click();
      } catch (err) {
        console.error("Erro ao gerar imagem:", err);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="p-5 border-b border-slate-50 flex justify-between items-start">
        <div>
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <ExportMenu onExport={handleExport} compact />
      </div>
      
      <div className="p-5 flex-1 relative" ref={chartRef}>
        {/* Adiciona um fundo branco explícito para quando tirar print */}
        <div className="absolute inset-0 bg-white -z-10 rounded-b-xl" />
        {children}
      </div>
    </div>
  );
};
