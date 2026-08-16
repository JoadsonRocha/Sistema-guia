import React, { useState, useRef, useEffect } from 'react';
import { Download, FileImage, FileText, FileSpreadsheet, MoreVertical } from 'lucide-react';

interface ExportMenuProps {
  onExport: (format: 'pdf' | 'csv' | 'png') => void;
  compact?: boolean;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ onExport, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (format: 'pdf' | 'csv' | 'png') => {
    onExport(format);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors rounded-md hover:bg-slate-100 ${
          compact ? 'p-1' : 'px-3 py-2 border border-slate-200 bg-white'
        }`}
        title="Exportar"
      >
        {compact ? <MoreVertical className="w-5 h-5" /> : (
          <>
            <Download className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Exportar</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
          <button
            onClick={() => handleSelect('png')}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
          >
            <FileImage className="w-4 h-4 mr-2 text-blue-500" />
            Imagem (PNG)
          </button>
          <button
            onClick={() => handleSelect('pdf')}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
          >
            <FileText className="w-4 h-4 mr-2 text-red-500" />
            PDF
          </button>
          <button
            onClick={() => handleSelect('csv')}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" />
            Excel (CSV)
          </button>
        </div>
      )}
    </div>
  );
};
