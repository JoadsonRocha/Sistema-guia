import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { firestoreService } from '../lib/firestoreService';

export interface ReportConfig {
  title: string;
  subtitle?: string;
  columns: { header: string; dataKey: string }[];
  data: any[];
  filters?: Record<string, any>;
  userName: string;
  type: string;
}

export const reportService = {
  async generatePDF(config: ReportConfig) {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('pt-BR');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(234, 179, 8); // Yellow 500
    doc.text('ÁGUIA - SISTEMA DE ESTRATÉGIA', 14, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(config.title.toUpperCase(), 14, 30);

    if (config.subtitle) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(config.subtitle, 14, 38);
    }

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado em: ${timestamp} | Por: ${config.userName}`, 14, 45);

    // Table
    autoTable(doc, {
      startY: 50,
      head: [config.columns.map(c => c.header)],
      body: config.data.map(row => config.columns.map(c => row[c.dataKey])),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [234, 179, 8], textColor: [0, 0, 0], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Save to History
    try {
      const reportId = `rep_${Date.now()}`;
      await firestoreService.setDocument('reports', reportId, {
        id: reportId,
        title: config.title,
        type: config.type,
        generatedBy: config.userName,
        createdAt: Date.now(),
        filters: config.filters || {},
        itemCount: config.data.length
      });
    } catch (err) {
      console.error("Erro ao salvar histórico de relatório:", err);
    }

    // Download
    doc.save(`${config.type}_${Date.now()}.pdf`);
  }
};
