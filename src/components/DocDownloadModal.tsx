import React, { useState } from 'react';
import { FileText, Download, CheckCircle, ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { downloadRequirementsDoc } from '../utils/docGenerator';

interface DocDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocDownloadModal: React.FC<DocDownloadModalProps> = ({ isOpen, onClose }) => {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    downloadRequirementsDoc();
    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)] uppercase tracking-tight">
                  Documento de Especificação (.DOC)
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                  Requisitos Funcionais, Não-Funcionais e Arquitetura Nexus Política 2026
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg font-bold p-1 rounded-md transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Highlights summary */}
          <div className="space-y-3 mb-6 text-xs text-[var(--text-secondary)]">
            <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>Documento Homologado:</strong> Pronto para impressão e leitura no Microsoft Word, LibreOffice e Google Docs.</span>
            </div>

            <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-blue-500 shrink-0" />
              <span><strong>Arquitetura Contida:</strong> Single Page Application React 18, TypeScript, Firebase Cloud Firestore e PWA Offline IndexedDB.</span>
            </div>

            <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-amber-500 shrink-0" />
              <span><strong>Requisitos Detalhados:</strong> RF01 a RF12 (RBAC, TRE, Vouchers, PWA, IA) e RNF01 a RNF05.</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-xs uppercase tracking-wider"
            >
              {downloaded ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span>Download Concluído (.DOC)!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar Documento (.DOC)</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] font-bold py-3 px-4 rounded-lg border border-[var(--border-color)] transition-colors text-xs uppercase tracking-wider"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
