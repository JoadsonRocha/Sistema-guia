import * as XLSX from 'xlsx';

/**
 * Safely parses CSV text into a 2D array matrix handling multiple delimiters (; , \t)
 */
export function parseCSVText(text: string): string[][] {
  if (!text) return [];
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Detect delimiter from first non-empty line
  const sample = lines[0];
  const countSemicolons = (sample.match(/;/g) || []).length;
  const countCommas = (sample.match(/,/g) || []).length;
  const countTabs = (sample.match(/\t/g) || []).length;

  let delimiter = ';';
  if (countTabs > countSemicolons && countTabs > countCommas) {
    delimiter = '\t';
  } else if (countCommas > countSemicolons && countCommas > countTabs) {
    delimiter = ',';
  }

  return lines.map(line => {
    // Handle quoted fields
    const row: string[] = [];
    let inQuotes = false;
    let currentCell = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        row.push(currentCell.replace(/^["']|["']$/g, '').trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.replace(/^["']|["']$/g, '').trim());
    return row;
  });
}

/**
 * Parses an ArrayBuffer (from FileReader) representing an .xlsx, .xls, .csv, or .txt file
 * Returns a 2D matrix of strings/values.
 */
export function parseExcelOrCSVBuffer(buffer: ArrayBuffer, fileName: string = ''): any[][] {
  if (!buffer || buffer.byteLength === 0) return [];

  const data = new Uint8Array(buffer);
  const nameLower = fileName.toLowerCase();

  const isZipMagic = data.length >= 4 && data[0] === 0x50 && data[1] === 0x4B; // PK..
  const isOleMagic = data.length >= 8 && data[0] === 0xD0 && data[1] === 0xCF && data[2] === 0x11 && data[3] === 0xE0; // OLE2
  const isExcelExt = nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls') || nameLower.endsWith('.ods') || nameLower.endsWith('.xlsb');
  const isBinaryExcel = isZipMagic || isOleMagic || isExcelExt;

  if (isBinaryExcel) {
    try {
      const workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false });
      if (workbook && workbook.SheetNames && workbook.SheetNames.length > 0) {
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        if (firstSheet) {
          const matrix = XLSX.utils.sheet_to_json<any[]>(firstSheet, { header: 1, defval: '' });
          if (Array.isArray(matrix) && matrix.length > 0) {
            return matrix;
          }
        }
      }
    } catch (xlsxErr) {
      console.warn("Aviso ao ler como Excel binário, tentando modo texto/CSV:", xlsxErr);
    }
  }

  // Fallback or text/CSV mode
  let text = '';
  try {
    text = new TextDecoder('utf-8', { fatal: false }).decode(data);
    if (text.includes('\uFFFD')) {
      text = new TextDecoder('iso-8859-1').decode(data);
    }
  } catch {
    text = new TextDecoder('iso-8859-1').decode(data);
  }

  return parseCSVText(text);
}
