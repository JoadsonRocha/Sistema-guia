import { RORAIMA_MUNICIPALITIES, normalizeLoc } from '../data/roraimaTreData';

export interface TreLocationItem {
  id: string;
  zona: string;            // e.g. "1ª ZE", "5ª ZE"
  zonaClean: string;       // "1", "5", "8"
  secoes: string[];        // ["001", "002", ...]
  secoesStr: string;       // "001 a 012"
  local: string;           // "Escola Estadual Monteiro Lobato"
  bairro?: string;         // "Centro"
  municipio?: string;      // "Boa Vista"
  eleitores?: number;
}

export interface TreZoneOption {
  value: string;
  label: string;
  zonaClean: string;
  municipioStr: string;
  locaisCount: number;
}

// Expand section range string e.g. "001 a 012", "101, 102", "1-5"
export function parseSecoes(secoesStr: string): string[] {
  if (!secoesStr) return [];
  const result: string[] = [];
  
  // Clean string
  const clean = secoesStr.trim();
  const parts = clean.split(/[,;]+/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Check range match "001 a 012", "1 to 10", "101-118"
    const rangeMatch = trimmed.match(/^(\d+)\s*(?:a|à|-|ate|até|to)\s*(\d+)$/i);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      const padLen = rangeMatch[1].length > 1 ? rangeMatch[1].length : 3;
      if (!isNaN(start) && !isNaN(end) && start <= end && end - start < 300) {
        for (let i = start; i <= end; i++) {
          result.push(String(i).padStart(padLen, '0'));
        }
        continue;
      }
    }

    // Single section number or string
    const numMatch = trimmed.match(/^\d+$/);
    if (numMatch) {
      result.push(trimmed.padStart(3, '0'));
    } else {
      result.push(trimmed);
    }
  }

  return Array.from(new Set(result));
}

// Normalize zona format e.g. "1" -> "1ª ZE", "5ª" -> "5ª ZE"
export function normalizeZonaLabel(zonaRaw: string): string {
  if (!zonaRaw) return '';
  const trimmed = zonaRaw.trim();
  const numMatch = trimmed.match(/\d+/);
  if (numMatch) {
    const num = numMatch[0];
    return `${num}ª ZE`;
  }
  return trimmed;
}

export function extractZonaNum(zonaRaw: string): string {
  if (!zonaRaw) return '';
  const numMatch = zonaRaw.match(/\d+/);
  return numMatch ? numMatch[0] : zonaRaw.toLowerCase().trim();
}

// Load and cache all TRE locations
let cachedLocations: TreLocationItem[] | null = null;

export function getAllTreLocations(): TreLocationItem[] {
  if (cachedLocations) return cachedLocations;

  const locations: TreLocationItem[] = [];
  let counter = 1;

  // 1. Load from built-in RORAIMA_MUNICIPALITIES
  for (const muni of RORAIMA_MUNICIPALITIES) {
    for (const loc of muni.locaisVotacao) {
      const zonaClean = extractZonaNum(loc.zona || muni.zona);
      const zonaLabel = normalizeZonaLabel(loc.zona || muni.zona);
      const parsedSec = parseSecoes(loc.secoes);

      locations.push({
        id: `built_in_${counter++}`,
        zona: zonaLabel,
        zonaClean,
        secoes: parsedSec,
        secoesStr: loc.secoes,
        local: loc.nome,
        bairro: loc.bairro,
        municipio: muni.name,
        eleitores: loc.eleitoresAproximado
      });
    }
  }

  // 2. Load from localStorage if custom Excel TRE data was imported
  try {
    const savedStr = localStorage.getItem('sistema_urna360_eleitoral_data') || localStorage.getItem('sistema_aguia_eleitoral_data');
    if (savedStr) {
      const parsed = JSON.parse(savedStr);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (!item || !item.local) continue;
          const zRaw = item.zona || '';
          const zClean = extractZonaNum(zRaw);
          const zLabel = normalizeZonaLabel(zRaw) || 'TRE General';
          const parsedSec = parseSecoes(item.secoes || '');

          // Check if already exists to avoid exact duplicate
          const existing = locations.find(
            l => normalizeLoc(l.local) === normalizeLoc(item.local) &&
                 (l.zonaClean === zClean || !zClean)
          );

          if (!existing) {
            locations.push({
              id: `custom_ls_${counter++}`,
              zona: zLabel,
              zonaClean: zClean || '1',
              secoes: parsedSec,
              secoesStr: item.secoes || '',
              local: item.local,
              bairro: item.bairro || '',
              municipio: item.municipio || 'Boa Vista',
              eleitores: item.eleitores || 0
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("Error parsing local electoral data cache:", err);
  }

  cachedLocations = locations;
  return locations;
}

// Invalidate cache if new spreadsheet is imported
export function clearTreLocationsCache() {
  cachedLocations = null;
}

// Get distinct list of Zonas
export function getTreZonas(): TreZoneOption[] {
  const locs = getAllTreLocations();
  const zoneMap = new Map<string, { zonaClean: string; municipios: Set<string>; count: number }>();

  // Standard Roraima Zonas defaults
  const standardZonas = [
    { num: '1', label: '1ª ZE', muni: 'Boa Vista (Centro/Leste)' },
    { num: '2', label: '2ª ZE', muni: 'Caracaraí' },
    { num: '3', label: '3ª ZE', muni: 'Alto Alegre' },
    { num: '4', label: '4ª ZE', muni: 'Rorainópolis / Sul' },
    { num: '5', label: '5ª ZE', muni: 'Boa Vista (Zona Oeste) & Cantá' },
    { num: '6', label: '6ª ZE', muni: 'Mucajaí & Iracema' },
    { num: '7ª', label: '7ª ZE', muni: 'Pacaraima, Bonfim, Amajari, Normandia, Uiramutã' },
    { num: '8', label: '8ª ZE', muni: 'Rorainópolis, Caroebe, Baliza, São Luiz' }
  ];

  for (const std of standardZonas) {
    const clean = extractZonaNum(std.num);
    zoneMap.set(std.label, {
      zonaClean: clean,
      municipios: new Set([std.muni]),
      count: 0
    });
  }

  for (const loc of locs) {
    const label = loc.zona;
    if (!label) continue;

    if (!zoneMap.has(label)) {
      zoneMap.set(label, {
        zonaClean: loc.zonaClean,
        municipios: new Set(loc.municipio ? [loc.municipio] : []),
        count: 1
      });
    } else {
      const entry = zoneMap.get(label)!;
      entry.count += 1;
      if (loc.municipio) entry.municipios.add(loc.municipio);
    }
  }

  const result: TreZoneOption[] = [];
  zoneMap.forEach((data, label) => {
    result.push({
      value: label,
      label,
      zonaClean: data.zonaClean,
      municipioStr: Array.from(data.municipios).join(', '),
      locaisCount: data.count
    });
  });

  return result.sort((a, b) => {
    const numA = parseInt(a.zonaClean, 10) || 99;
    const numB = parseInt(b.zonaClean, 10) || 99;
    return numA - numB;
  });
}

// Get distinct list of Seções for a given Zona or Local
export function getTreSecoes(zonaRaw?: string, localName?: string): { secao: string; local: string; zona: string; bairro?: string }[] {
  const locs = getAllTreLocations();
  const zClean = zonaRaw ? extractZonaNum(zonaRaw) : '';
  const normLocal = localName ? normalizeLoc(localName) : '';

  const filtered = locs.filter(loc => {
    if (zClean && loc.zonaClean !== zClean) return false;
    if (normLocal && !normalizeLoc(loc.local).includes(normLocal)) return false;
    return true;
  });

  const secMap = new Map<string, { secao: string; local: string; zona: string; bairro?: string }>();

  for (const loc of filtered) {
    for (const sec of loc.secoes) {
      if (!sec) continue;
      if (!secMap.has(sec)) {
        secMap.set(sec, {
          secao: sec,
          local: loc.local,
          zona: loc.zona,
          bairro: loc.bairro
        });
      }
    }
  }

  return Array.from(secMap.values()).sort((a, b) => {
    const numA = parseInt(a.secao, 10) || 0;
    const numB = parseInt(b.secao, 10) || 0;
    return numA - numB;
  });
}

// Get distinct Locais de Votação
export function getTreLocaisVotacao(zonaRaw?: string, secaoRaw?: string): TreLocationItem[] {
  const locs = getAllTreLocations();
  const zClean = zonaRaw ? extractZonaNum(zonaRaw) : '';
  const secClean = secaoRaw ? secaoRaw.trim().padStart(3, '0') : '';

  return locs.filter(loc => {
    if (zClean && loc.zonaClean !== zClean) return false;
    if (secClean && loc.secoes.length > 0) {
      const hasSec = loc.secoes.some(s => s === secClean || s.padStart(3, '0') === secClean);
      if (!hasSec) return false;
    }
    return true;
  });
}

// Auto-fill lookup helper
export function findTreMatch(zonaRaw?: string, secaoRaw?: string, localName?: string) {
  const locs = getAllTreLocations();
  const zClean = zonaRaw ? extractZonaNum(zonaRaw) : '';
  const secClean = secaoRaw ? secaoRaw.trim().padStart(3, '0') : '';
  const normLocal = localName ? normalizeLoc(localName) : '';

  // 1. Try exact match on localName
  if (normLocal) {
    const exactLocal = locs.find(l => normalizeLoc(l.local) === normLocal || normalizeLoc(l.local).includes(normLocal));
    if (exactLocal) {
      return exactLocal;
    }
  }

  // 2. Try match on secao
  if (secClean) {
    const exactSec = locs.find(l => {
      if (zClean && l.zonaClean !== zClean) return false;
      return l.secoes.some(s => s === secClean || s.padStart(3, '0') === secClean);
    });
    if (exactSec) {
      return exactSec;
    }
  }

  return null;
}
