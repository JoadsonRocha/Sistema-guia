import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
      body: config.data.map(row => config.columns.map(c => {
        const val = row[c.dataKey];
        return val !== undefined && val !== null ? String(val) : '---';
      })),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [234, 179, 8], textColor: [0, 0, 0], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Save to History
    try {
      const reportId = `rep_${Date.now()}`;
      await firestoreService.setDocument('reports', reportId, {
        id: reportId,
        title: `${config.title} (PDF)`,
        type: config.type,
        generatedBy: config.userName,
        createdAt: Date.now(),
        filters: config.filters || {},
        itemCount: config.data.length,
        format: 'pdf'
      });
    } catch (err) {
      console.error("Erro ao salvar histórico de relatório:", err);
    }

    // Download
    doc.save(`${config.type}_${Date.now()}.pdf`);
  },

  async generateExcel(config: ReportConfig) {
    // Format data rows with mapped column headers
    const exportData = config.data.map(row => {
      const formattedRow: Record<string, any> = {};
      config.columns.forEach(col => {
        const val = row[col.dataKey];
        formattedRow[col.header] = val !== undefined && val !== null ? val : '---';
      });
      return formattedRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    const cleanSheetName = (config.title || 'Relatorio').replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, cleanSheetName);

    // Auto-fit column widths
    const colWidths = config.columns.map(col => {
      let maxLen = col.header.length;
      exportData.forEach(row => {
        const valStr = String(row[col.header] || '');
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      return { wch: Math.min(Math.max(maxLen + 3, 12), 60) };
    });
    worksheet['!cols'] = colWidths;

    // Save to History
    try {
      const reportId = `rep_${Date.now()}`;
      await firestoreService.setDocument('reports', reportId, {
        id: reportId,
        title: `${config.title} (Excel)`,
        type: config.type,
        generatedBy: config.userName,
        createdAt: Date.now(),
        filters: config.filters || {},
        itemCount: config.data.length,
        format: 'excel'
      });
    } catch (err) {
      console.error("Erro ao salvar histórico de relatório:", err);
    }

    // Download .xlsx file
    XLSX.writeFile(workbook, `${config.type}_relatorio_${Date.now()}.xlsx`);
  }
};

