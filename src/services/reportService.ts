import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabaseService } from '../lib/supabaseService';
import logoImg from '../assets/logo.png';

export interface ReportConfig {
  title: string;
  subtitle?: string;
  columns: { header: string; dataKey: string }[];
  data: any[];
  filters?: Record<string, any>;
  userName: string;
  type: string;
}

// Converte a imagem do logo para Base64 para inclusão no jsPDF
async function getLogoDataUrl(): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 200;
        canvas.height = img.naturalHeight || img.height || 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      // Tentar fallback da raiz public
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = 'Anonymous';
      fallbackImg.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = fallbackImg.naturalWidth || fallbackImg.width || 200;
          canvas.height = fallbackImg.naturalHeight || fallbackImg.height || 200;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(fallbackImg, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      fallbackImg.onerror = () => resolve(null);
      fallbackImg.src = '/logo.png';
    };
    img.src = logoImg;
  });
}

export const reportService = {
  async generatePDF(config: ReportConfig) {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('pt-BR');

    // Carregar logo para o topo superior esquerdo
    const logoDataUrl = await getLogoDataUrl();

    let textStartX = 14;

    if (logoDataUrl) {
      try {
        // Logo no canto superior esquerdo (x: 14, y: 10, w: 18, h: 18)
        doc.addImage(logoDataUrl, 'PNG', 14, 10, 18, 18);
        textStartX = 36;
      } catch (err) {
        console.warn("Não foi possível adicionar a logo ao PDF:", err);
      }
    }

    // Header Principal em Azul Nexus (#2563EB)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235); // Blue 600
    doc.text('NEXUS POLÍTICA', textStartX, logoDataUrl ? 17 : 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.text('SISTEMA DE ESTRATÉGIA ELEITORAL', textStartX, logoDataUrl ? 23 : 26);

    // Linha divisória
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.5);
    doc.line(14, 31, 196, 31);

    // Título do Relatório
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(config.title.toUpperCase(), 14, 39);

    let nextY = 45;

    if (config.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(config.subtitle, 14, nextY);
      nextY += 6;
    }

    // Informações de geração
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${timestamp} | Por: ${config.userName}`, 14, nextY);
    nextY += 6;

    // Tabela com cores padronizadas do sistema Nexus
    autoTable(doc, {
      startY: nextY,
      head: [config.columns.map(c => c.header.toUpperCase())],
      body: config.data.map(row => config.columns.map(c => {
        const val = row[c.dataKey];
        return val !== undefined && val !== null ? String(val) : '---';
      })),
      styles: { 
        fontSize: 8, 
        font: 'helvetica', 
        cellPadding: 3, 
        textColor: [30, 41, 59] 
      },
      headStyles: { 
        fillColor: [37, 99, 235], // Azul Nexus
        textColor: [255, 255, 255], 
        fontStyle: 'bold' 
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252] // Slate 50
      },
      margin: { top: nextY }
    });

    // Save to History
    try {
      const reportId = `rep_${Date.now()}`;
      await supabaseService.setDocument('reports', reportId, {
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
    doc.save(`${config.type}_relatorio_${Date.now()}.pdf`);
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
      await supabaseService.setDocument('reports', reportId, {
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

