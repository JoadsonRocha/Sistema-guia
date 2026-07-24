import React, { useState, useMemo, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  LayoutDashboard, 
  Building2, 
  Map, 
  Hash, 
  TrendingUp, 
  Filter, 
  RefreshCw, 
  ArrowUpDown, 
  Award, 
  MapPin,
  FileSpreadsheet,
  UploadCloud,
  Download,
  Trash2,
  Database,
  CheckCircle2,
  AlertCircle,
  Target,
  Users,
  Percent,
  Compass,
  Briefcase,
  Search,
  AlertTriangle
} from 'lucide-react';
import { ELEITORAL_DATA, VotingLocation } from '../data/eleitoralData';
import * as XLSX from 'xlsx';

// Constants for theme colors (Navy & Royal Blue)
const COLORS = [
  '#0578d3', // Brand Royal Blue (Primary)
  '#0b122f', // Dark Navy Blue
  '#0284c7', // Sky Royal Blue
  '#0f172a', // Slate Dark Navy
  '#3b82f6', // Bright Blue
  '#2563eb', // Indigo Blue
  '#0284c7', // Dark Sky
  '#1d4ed8'  // Royal Blue
];

// Sample demonstrative Roraima TRE data if they want to load mock data for testing
const SAMPLE_TRE_DATA: VotingLocation[] = [
  {
    municipio: "Boa Vista",
    zona: "01ª ZE",
    bairro: "Centro",
    local: "Escola Estadual Monteiro Lobato",
    endereco: "Rua Nossa Senhora da Consolata, 512 - Centro",
    secoes: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10",
    secoesCount: 10,
    eleitores: 4250
  },
  {
    municipio: "Boa Vista",
    zona: "01ª ZE",
    bairro: "Centro",
    local: "Escola Estadual Lobo D'Almada",
    endereco: "Avenida Getúlio Vargas, 1421 - Centro",
    secoes: "11, 12, 13, 14, 15, 16, 17, 18",
    secoesCount: 8,
    eleitores: 3420
  },
  {
    municipio: "Boa Vista",
    zona: "05ª ZE",
    bairro: "Alvorada",
    local: "IFRR - Campus Boa Vista",
    endereco: "Avenida Glaycon de Paiva, 2496 - Alvorada",
    secoes: "101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112",
    secoesCount: 12,
    eleitores: 5120
  },
  {
    municipio: "Boa Vista",
    zona: "05ª ZE",
    bairro: "Asa Branca",
    local: "Escola Estadual Major Alcides",
    endereco: "Rua Cararico, 452 - Asa Branca",
    secoes: "113, 114, 115, 116, 117, 118, 119",
    secoesCount: 7,
    eleitores: 2980
  },
  {
    municipio: "Rorainópolis",
    zona: "08ª ZE",
    bairro: "Centro",
    local: "Escola Estadual José de Alencar",
    endereco: "Avenida Bernardo Sayão, s/n - Centro",
    secoes: "301, 302, 303, 304, 305, 306, 307, 308",
    secoesCount: 8,
    eleitores: 3200
  },
  {
    municipio: "Cantá",
    zona: "05ª ZE",
    bairro: "Centro",
    local: "Escola Estadual Cícero Vieira Neto",
    endereco: "Avenida Central, s/n - Centro",
    secoes: "151, 152, 153, 154, 155",
    secoesCount: 5,
    eleitores: 1980
  },
  {
    municipio: "Caracaraí",
    zona: "02ª ZE",
    bairro: "Centro",
    local: "Escola Estadual Presidente Castelo Branco",
    endereco: "Avenida Doutor Zany, 85 - Centro",
    secoes: "201, 202, 203, 204, 205, 206",
    secoesCount: 6,
    eleitores: 2540
  },
  {
    municipio: "Mucajaí",
    zona: "06ª ZE",
    bairro: "Centro",
    local: "Escola Estadual Padre José Monticone",
    endereco: "Avenida Padre José Monticone, s/n - Centro",
    secoes: "251, 252, 253, 254, 255, 256, 257",
    secoesCount: 7,
    eleitores: 2880
  }
];

export default function EleitoralDashboard({ 
  isCoordinator = false, 
  campaignVoters = [] 
}: { 
  isCoordinator?: boolean; 
  campaignVoters?: any[]; 
}) {
  const [subTab, setSubTab] = useState<'tre_oficial' | 'cruzamento'>('tre_oficial');

  const MUNICIPALITIES = useMemo(() => [
    "Amajari",
    "Alto Alegre",
    "Boa Vista",
    "Bonfim",
    "Cantá",
    "Caracaraí",
    "Caroebe",
    "Iracema",
    "Mucajaí",
    "Normandia",
    "Pacaraima",
    "Rorainópolis",
    "São João da Baliza",
    "São Luiz",
    "Uiramutã"
  ], []);

  // Load data from localStorage (for instant initial render)
  const [votingLocations, setVotingLocations] = useState<VotingLocation[]>(() => {
    const saved = localStorage.getItem('sistema_urna360_eleitoral_data') || localStorage.getItem('sistema_aguia_eleitoral_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao carregar dados do localStorage", e);
      }
    }
    return ELEITORAL_DATA; // Empty []
  });

  // Save parsed data locally and to Firestore database for cross-browser synchronization
  const saveVotingLocations = async (newData: VotingLocation[]) => {
    setVotingLocations(newData);
    try {
      localStorage.setItem('sistema_urna360_eleitoral_data', JSON.stringify(newData));
    } catch (e) {
      console.warn("Erro ao salvar cache no localStorage:", e);
    }

    try {
      const jsonStr = JSON.stringify(newData);
      if (jsonStr.length < 800000) {
        await setDoc(doc(db, 'eleitoral_data', 'global'), {
          locations: newData,
          updatedAt: Date.now(),
          chunksCount: 1,
          isChunked: false
        });
      } else {
        const chunkSize = 2000;
        const chunksCount = Math.ceil(newData.length / chunkSize);
        for (let i = 0; i < chunksCount; i++) {
          const chunk = newData.slice(i * chunkSize, (i + 1) * chunkSize);
          await setDoc(doc(db, 'eleitoral_data', `global_${i}`), {
            locations: chunk,
            updatedAt: Date.now(),
            chunksCount,
            chunkIndex: i
          });
        }
        await setDoc(doc(db, 'eleitoral_data', 'global'), {
          chunksCount,
          updatedAt: Date.now(),
          isChunked: true
        });
      }
    } catch (err) {
      console.error("Erro ao gravar dados eleitorais no Firestore:", err);
    }
  };

  // Real-time synchronization with Firestore across all browsers/devices
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'eleitoral_data', 'global'), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.isChunked && data.chunksCount > 1) {
          let allLocs: VotingLocation[] = [];
          for (let i = 0; i < data.chunksCount; i++) {
            const chunkSnap = await getDoc(doc(db, 'eleitoral_data', `global_${i}`));
            if (chunkSnap.exists()) {
              allLocs = allLocs.concat(chunkSnap.data().locations || []);
            }
          }
          setVotingLocations(allLocs);
          localStorage.setItem('sistema_urna360_eleitoral_data', JSON.stringify(allLocs));
        } else if (data.locations) {
          setVotingLocations(data.locations);
          localStorage.setItem('sistema_urna360_eleitoral_data', JSON.stringify(data.locations));
        }
      } else {
        // Auto-migrate if local data exists from a previous upload before Firestore sync was enabled
        const saved = localStorage.getItem('sistema_urna360_eleitoral_data') || localStorage.getItem('sistema_aguia_eleitoral_data');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log("Migrando dados eleitorais do localStorage para o Firestore...");
              saveVotingLocations(parsed);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    }, (err) => {
      console.warn("Erro ao sincronizar banco de dados eleitoral do TRE:", err);
    });

    return () => unsub();
  }, []);

  // Drag-and-drop state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters State
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('Todos');
  const [selectedZona, setSelectedZona] = useState<string>('Todos');
  const [selectedBairro, setSelectedBairro] = useState<string>('Todos');
  const [selectedLocal, setSelectedLocal] = useState<string>('Todos');

  // Strategic Tab States
  const [selectedStrategyMun, setSelectedStrategyMun] = useState<string | null>(null);
  const [strategicSort, setStrategicSort] = useState<'coverage' | 'missing'>('coverage');
  const [strategicStatusFilter, setStrategicStatusFilter] = useState<'Todos' | 'critical' | 'low' | 'medium' | 'good'>('Todos');

  // Sorting State for Table
  const [sortField, setSortField] = useState<'local' | 'eleitores'>('eleitores');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Total State Metrics
  const totalStateEleitores = useMemo(() => {
    return votingLocations.reduce((sum, item) => sum + item.eleitores, 0);
  }, [votingLocations]);

  const totalStateMunicipios = useMemo(() => {
    return new Set(votingLocations.map(item => item.municipio)).size;
  }, [votingLocations]);

  const totalStateLocais = votingLocations.length;
  
  const totalStateSecoes = useMemo(() => {
    return votingLocations.reduce((sum, item) => sum + item.secoesCount, 0);
  }, [votingLocations]);

  // Mapping of campaign voters to a municipality
  const mappedCampaignVoters = useMemo(() => {
    return campaignVoters.map((voter: any) => {
      let location: string | null = null;
      
      // 1. Direct match if voter has a municipio field (e.g. from team or direct selection)
      if (voter.municipio) {
        const directMun = voter.municipio.trim();
        const found = MUNICIPALITIES.find(m => m.toLowerCase() === directMun.toLowerCase());
        if (found) location = found;
      }

      // 2. Address string search
      if (!location && voter.address) {
        const addrLower = voter.address.toLowerCase();
        for (const mun of MUNICIPALITIES) {
          if (addrLower.includes(mun.toLowerCase())) {
            location = mun;
            break;
          }
        }
        if (!location) {
          if (addrLower.includes("baliza") || addrLower.includes("são joão") || addrLower.includes("sao joao")) {
            location = "São João da Baliza";
          } else if (addrLower.includes("sao luiz") || addrLower.includes("luiz do anau") || addrLower.includes("são luiz")) {
            location = "São Luiz";
          }
        }
      }

      // 3. Polling place (localVotacao) search
      if (!location && voter.localVotacao) {
        const lvLower = voter.localVotacao.toLowerCase();
        for (const mun of MUNICIPALITIES) {
          if (lvLower.includes(mun.toLowerCase())) {
            location = mun;
            break;
          }
        }
        if (!location) {
          if (lvLower.includes("baliza") || lvLower.includes("são joão") || lvLower.includes("sao joao")) {
            location = "São João da Baliza";
          } else if (lvLower.includes("sao luiz") || lvLower.includes("luiz do anau") || lvLower.includes("são luiz")) {
            location = "São Luiz";
          }
        }
      }

      // 4. Electoral zone match (same as Map)
      if (!location && voter.zona) {
        const z = voter.zona.toString().replace(/\D/g, '');
        const lvText = `${voter.address || ""} ${voter.localVotacao || ""}`.toLowerCase();
        
        if (z === '1') location = "Boa Vista";
        else if (z === '2') location = "Caracaraí";
        else if (z === '3') location = "Alto Alegre";
        else if (z === '4') {
          if (lvText.includes("caroebe")) location = "Caroebe";
          else if (lvText.includes("baliza") || lvText.includes("joão") || lvText.includes("joao")) location = "São João da Baliza";
          else location = "São Luiz";
        }
        else if (z === '5') {
          if (lvText.includes("cantá") || lvText.includes("canta")) location = "Cantá";
          else location = "Boa Vista";
        }
        else if (z === '6') {
          if (lvText.includes("iracema")) location = "Iracema";
          else location = "Mucajaí";
        }
        else if (z === '7') {
          if (lvText.includes("pacaraima")) location = "Pacaraima";
          else if (lvText.includes("uiramutã") || lvText.includes("uiramuta")) location = "Uiramutã";
          else location = "Amajari";
        }
        else if (z === '8') location = "Rorainópolis";
        else if (z === '9') {
          if (lvText.includes("normandia")) location = "Normandia";
          else location = "Bonfim";
        }
      }

      // 5. Team name matching (optional fallback)
      const teamValue = voter.teamName || voter.team;
      if (!location && teamValue) {
        const tLower = teamValue.toLowerCase();
        for (const mun of MUNICIPALITIES) {
          if (tLower.includes(mun.toLowerCase())) {
            location = mun;
            break;
          }
        }
      }

      // Default fallback
      if (!location) {
        location = "Boa Vista";
      }

      return {
        ...voter,
        mappedMunicipio: location
      };
    });
  }, [campaignVoters, MUNICIPALITIES]);

  // Aggregate stats by municipality for BOTH TRE and Campaign data
  const crossReferencedData = useMemo(() => {
    // 1. Group TRE Electors by Municipality
    const treCounts: Record<string, number> = {};
    MUNICIPALITIES.forEach(m => {
      treCounts[m] = 0;
    });
    
    votingLocations.forEach(vl => {
      const mun = vl.municipio;
      if (treCounts[mun] !== undefined) {
        treCounts[mun] += vl.eleitores;
      } else {
        // Try matching with MUNICIPALITIES case-insensitively
        const matchedMun = MUNICIPALITIES.find(m => m.toLowerCase() === mun.toLowerCase().trim());
        if (matchedMun) {
          treCounts[matchedMun] += vl.eleitores;
        }
      }
    });

    // 2. Group Campaign Voters by Municipality
    const campaignCounts: Record<string, number> = {};
    MUNICIPALITIES.forEach(m => {
      campaignCounts[m] = 0;
    });

    mappedCampaignVoters.forEach(mv => {
      const mun = mv.mappedMunicipio;
      if (campaignCounts[mun] !== undefined) {
        campaignCounts[mun]++;
      }
    });

    // 3. Build array of stats
    return MUNICIPALITIES.map(m => {
      const treElectors = treCounts[m];
      const registeredVoters = campaignCounts[m];
      const coverageRate = treElectors > 0 ? (registeredVoters / treElectors) * 100 : 0;
      const missingElectors = Math.max(0, treElectors - registeredVoters);
      
      const treSharePercent = totalStateEleitores > 0 ? (treElectors / totalStateEleitores) * 100 : 0;

      // Status classification
      let status: 'critical' | 'low' | 'medium' | 'good' = 'critical';
      let recommendation = "";

      if (coverageRate < 0.5) {
        status = 'critical';
        recommendation = "Alerta crítico! Cobertura abaixo de 0.5%. Enviar equipes volantes e focar em mutirões de cadastro urgente nesta região.";
      } else if (coverageRate < 1.5) {
        status = 'low';
        recommendation = "Baixa penetração. Necessário intensificar visitas presenciais de lideranças e designar um líder de equipe exclusivo.";
      } else if (coverageRate < 4.0) {
        status = 'medium';
        recommendation = "Presença moderada. Organizar caminhadas e panfletagens focadas nos principais locais de votação de maior eleitorado.";
      } else {
        status = 'good';
        recommendation = "Excelente engajamento. Consolidar rede de apoiadores e focar no monitoramento no dia da eleição para garantir presença.";
      }

      return {
        municipio: m,
        treElectors,
        campaignVoters: registeredVoters,
        coverageRate,
        missingElectors,
        treSharePercent,
        status,
        recommendation
      };
    });
  }, [votingLocations, mappedCampaignVoters, MUNICIPALITIES, totalStateEleitores]);

  // Ranked municipalities to easily see where we have the lowest registered count relative to TRE (least reached)
  const rankedByCoverage = useMemo(() => {
    return [...crossReferencedData].sort((a, b) => {
      if (a.treElectors === 0 && b.treElectors > 0) return 1;
      if (b.treElectors === 0 && a.treElectors > 0) return -1;
      return a.coverageRate - b.coverageRate;
    });
  }, [crossReferencedData]);

  // Ranked by absolute missing voters to target high-yield areas with low coverage
  const rankedByStrategicPriority = useMemo(() => {
    return [...crossReferencedData].sort((a, b) => {
      return b.missingElectors - a.missingElectors;
    });
  }, [crossReferencedData]);

  // Cascading lists for filters based on selected Municipio
  const municipiosList = useMemo(() => {
    return ['Todos', ...Array.from(new Set(votingLocations.map(item => item.municipio))).sort()];
  }, [votingLocations]);

  const zonasList = useMemo(() => {
    let filtered = votingLocations;
    if (selectedMunicipio !== 'Todos') {
      filtered = filtered.filter(item => item.municipio === selectedMunicipio);
    }
    return ['Todos', ...Array.from(new Set(filtered.map(item => item.zona))).sort()];
  }, [selectedMunicipio, votingLocations]);

  const bairrosList = useMemo(() => {
    let filtered = votingLocations;
    if (selectedMunicipio !== 'Todos') {
      filtered = filtered.filter(item => item.municipio === selectedMunicipio);
    }
    if (selectedZona !== 'Todos') {
      filtered = filtered.filter(item => item.zona === selectedZona);
    }
    return ['Todos', ...Array.from(new Set(filtered.map(item => item.bairro))).sort()];
  }, [selectedMunicipio, selectedZona, votingLocations]);

  const locaisList = useMemo(() => {
    let filtered = votingLocations;
    if (selectedMunicipio !== 'Todos') {
      filtered = filtered.filter(item => item.municipio === selectedMunicipio);
    }
    if (selectedZona !== 'Todos') {
      filtered = filtered.filter(item => item.zona === selectedZona);
    }
    if (selectedBairro !== 'Todos') {
      filtered = filtered.filter(item => item.bairro === selectedBairro);
    }
    return ['Todos', ...Array.from(new Set(filtered.map(item => item.local))).sort()];
  }, [selectedMunicipio, selectedZona, selectedBairro, votingLocations]);

  // Handle cascading reset on parent filter change
  const handleMunicipioChange = (val: string) => {
    setSelectedMunicipio(val);
    setSelectedZona('Todos');
    setSelectedBairro('Todos');
    setSelectedLocal('Todos');
  };

  const handleZonaChange = (val: string) => {
    setSelectedZona(val);
    setSelectedBairro('Todos');
    setSelectedLocal('Todos');
  };

  const handleBairroChange = (val: string) => {
    setSelectedBairro(val);
    setSelectedLocal('Todos');
  };

  const resetFilters = () => {
    setSelectedMunicipio('Todos');
    setSelectedZona('Todos');
    setSelectedBairro('Todos');
    setSelectedLocal('Todos');
  };

  // Filtered dataset for computations and UI display
  const filteredData = useMemo(() => {
    return votingLocations.filter(item => {
      const matchMun = selectedMunicipio === 'Todos' || item.municipio === selectedMunicipio;
      const matchZona = selectedZona === 'Todos' || item.zona === selectedZona;
      const matchBairro = selectedBairro === 'Todos' || item.bairro === selectedBairro;
      const matchLocal = selectedLocal === 'Todos' || item.local === selectedLocal;
      return matchMun && matchZona && matchBairro && matchLocal;
    });
  }, [selectedMunicipio, selectedZona, selectedBairro, selectedLocal, votingLocations]);

  // Current scope totals
  const totalScopeEleitores = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.eleitores, 0);
  }, [filteredData]);

  const totalScopeMunicipios = useMemo(() => {
    return new Set(filteredData.map(item => item.municipio)).size;
  }, [filteredData]);

  const totalScopeLocais = filteredData.length;
  const totalScopeSecoes = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.secoesCount, 0);
  }, [filteredData]);

  // Calculation of KPIs
  const kpiMetrics = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        maiorLocal: { local: 'Nenhum', eleitores: 0, percentMun: 0 },
        menorLocal: { local: 'Nenhum', eleitores: 0, percentMun: 0 },
        mediaEleitores: 0,
        top5AccumulatedPercent: 0
      };
    }

    // Sort locations in current scope by electors descending
    const sorted = [...filteredData].sort((a, b) => b.eleitores - a.eleitores);
    
    const maior = sorted[0];
    const menor = sorted[sorted.length - 1];
    
    const media = Math.round(totalScopeEleitores / sorted.length);

    // Sum of top 5 locations
    const top5Sum = sorted.slice(0, 5).reduce((sum, item) => sum + item.eleitores, 0);
    const top5Percent = totalScopeEleitores > 0 ? (top5Sum / totalScopeEleitores) * 100 : 0;

    // Percent representativeness of the biggest/smallest in the municipality (or scope total)
    const maiorPercent = totalScopeEleitores > 0 ? (maior.eleitores / totalScopeEleitores) * 100 : 0;
    const menorPercent = totalScopeEleitores > 0 ? (menor.eleitores / totalScopeEleitores) * 100 : 0;

    return {
      maiorLocal: { local: maior.local, eleitores: maior.eleitores, percentMun: maiorPercent },
      menorLocal: { local: menor.local, eleitores: menor.eleitores, percentMun: menorPercent },
      mediaEleitores: media,
      top5AccumulatedPercent: top5Percent
    };
  }, [filteredData, totalScopeEleitores]);

  // Chart 1 data: Horizonal Bar Chart of Voting Locations in the selected municipality/scope (Top 10)
  const barChartData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => b.eleitores - a.eleitores);
    // Return top 10 to keep the layout neat and high quality
    return sorted.slice(0, 10).map(item => ({
      name: item.local.length > 28 ? item.local.substring(0, 25) + '...' : item.local,
      fullName: item.local,
      eleitores: item.eleitores
    })).reverse(); // Reverse so Recharts vertical renders highest at the top
  }, [filteredData]);

  // Chart 2 data: Pie/Donut Chart for local distribution in selected municipality/scope (Top 5 + Others)
  const pieChartData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => b.eleitores - a.eleitores);
    if (sorted.length <= 5) {
      return sorted.map(item => ({
        name: item.local.length > 20 ? item.local.substring(0, 18) + '...' : item.local,
        value: item.eleitores
      }));
    } else {
      const top5 = sorted.slice(0, 5).map(item => ({
        name: item.local.length > 20 ? item.local.substring(0, 18) + '...' : item.local,
        value: item.eleitores
      }));
      const othersSum = sorted.slice(5).reduce((sum, item) => sum + item.eleitores, 0);
      return [
        ...top5,
        { name: 'Outros Locais', value: othersSum }
      ];
    }
  }, [filteredData]);

  // Chart 3 data: Ranking of Municipalities by Voter Count (Statewide context)
  const muniRankingChartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    votingLocations.forEach(item => {
      grouped[item.municipio] = (grouped[item.municipio] || 0) + item.eleitores;
    });
    return Object.entries(grouped)
      .map(([name, val]) => ({ name, eleitores: val }))
      .sort((a, b) => b.eleitores - a.eleitores);
  }, [votingLocations]);

  // Compute Município-level details (for selected Municipio panel)
  const municipioPanelData = useMemo(() => {
    if (selectedMunicipio === 'Todos') return null;

    const muniRows = votingLocations.filter(item => item.municipio === selectedMunicipio);
    const muniTotalEleitores = muniRows.reduce((sum, item) => sum + item.eleitores, 0);
    const muniLocaisCount = muniRows.length;
    const muniSecoesCount = muniRows.reduce((sum, item) => sum + item.secoesCount, 0);
    const representativeness = totalStateEleitores > 0 ? (muniTotalEleitores / totalStateEleitores) * 100 : 0;

    return {
      nome: selectedMunicipio,
      eleitores: muniTotalEleitores,
      locais: muniLocaisCount,
      secoes: muniSecoesCount,
      representatividade: representativeness
    };
  }, [selectedMunicipio, totalStateEleitores, votingLocations]);

  // Compute detailed voting locations sorted for the dyn table
  const processedTableData = useMemo(() => {
    return filteredData.map(item => {
      // Find total electors of this location's municipality to calculate % of municipality
      const muniRows = votingLocations.filter(r => r.municipio === item.municipio);
      const muniTotal = muniRows.reduce((sum, r) => sum + r.eleitores, 0);
      const percentMuni = muniTotal > 0 ? (item.eleitores / muniTotal) * 100 : 0;
      const percentTotal = totalStateEleitores > 0 ? (item.eleitores / totalStateEleitores) * 100 : 0;

      return {
        ...item,
        percentMuni,
        percentTotal
      };
    }).sort((a, b) => {
      if (sortField === 'eleitores') {
        return sortOrder === 'desc' ? b.eleitores - a.eleitores : a.eleitores - b.eleitores;
      } else {
        return sortOrder === 'desc' 
          ? b.local.localeCompare(a.local) 
          : a.local.localeCompare(b.local);
      }
    });
  }, [filteredData, sortField, sortOrder, totalStateEleitores, votingLocations]);

  const toggleSort = (field: 'local' | 'eleitores') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // EXCEL IMPORTER & TEMPLATE GENERATOR
  const downloadTemplate = () => {
    const headers = [
      ["Município", "Zona Eleitoral", "Bairro", "Local de Votação", "Endereço", "Seção", "Quantidade de Eleitores Aptos"]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(headers);
    ws['!cols'] = [
      { wch: 20 }, // Município
      { wch: 15 }, // Zona Eleitoral
      { wch: 20 }, // Bairro
      { wch: 40 }, // Local de Votação
      { wch: 50 }, // Endereço
      { wch: 15 }, // Seção
      { wch: 30 }  // Quantidade de Eleitores Aptos
    ];

    // Example rows
    XLSX.utils.sheet_add_aoa(ws, [
      ["Boa Vista", "01ª ZE", "Centro", "Escola Estadual Monteiro Lobato", "Rua Nossa Senhora da Consolata, 512 - Centro", "1, 2, 3", 1250],
      ["Rorainópolis", "08ª ZE", "Centro", "Escola Estadual José de Alencar", "Avenida Bernardo Sayão, s/n - Centro", "301, 302, 303", 850],
      ["Cantá", "05ª ZE", "Centro", "Escola Estadual Cícero Vieira Neto", "Avenida Central, s/n - Centro", "151, 152", 650]
    ], { origin: -1 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo TRE Nexus Política");
    XLSX.writeFile(wb, "modelo_planilha_tre_nexus_politica.xlsx");
    
    setSuccessMsg("Modelo de planilha (.xlsx) baixado com sucesso!");
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const processFile = (file: File) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
        
        const parsedRows: VotingLocation[] = jsonData.map((row: any) => {
          const findValue = (keys: string[]) => {
            for (const key of keys) {
              const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
              if (foundKey) return row[foundKey];
            }
            return undefined;
          };

          const municipio = findValue(["Município", "Municipio", "Cidade"]) || "";
          const zona = findValue(["Zona Eleitoral", "Zona", "ZE"]) || "";
          const bairro = findValue(["Bairro", "Região", "Regiao"]) || "";
          const local = findValue(["Local de Votação", "Local", "Escola", "Estabelecimento"]) || "";
          const endereco = findValue(["Endereço", "Endereco", "Logradouro"]) || "";
          const secoes = String(findValue(["Seção", "Secao", "Seções", "Secoes"]) || "");
          const eleitoresVal = findValue(["Quantidade de Eleitores Aptos", "Eleitores Aptos", "Eleitores", "Quantidade de Eleitores", "Aptos"]);
          const eleitores = Number(eleitoresVal) || 0;

          let secoesCount = 1;
          if (secoes) {
            secoesCount = secoes.split(',').filter(s => s.trim().length > 0).length || 1;
          }

          return {
            municipio: String(municipio).trim(),
            zona: String(zona).trim(),
            bairro: String(bairro).trim(),
            local: String(local).trim(),
            endereco: String(endereco).trim(),
            secoes: secoes.trim(),
            secoesCount,
            eleitores
          };
        }).filter(row => row.municipio && row.local && row.eleitores > 0);

        if (parsedRows.length === 0) {
          setErrorMsg("Nenhum dado válido encontrado. Verifique se as colunas estão exatamente no modelo.");
          return;
        }

        saveVotingLocations(parsedRows);
        setSuccessMsg(`Sucesso! ${parsedRows.length} locais de votação oficiais do TRE carregados.`);
        setTimeout(() => setSuccessMsg(null), 6000);
      } catch (err) {
        console.error(err);
        setErrorMsg("Erro ao processar o arquivo de planilha. Certifique-se de carregar um arquivo Excel (.xlsx) válido.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearData = () => {
    if (window.confirm("Aviso: Deseja realmente zerar todos os dados eleitorais oficiais salvos no sistema?")) {
      saveVotingLocations([]);
      setSuccessMsg("O banco de dados de locais do TRE foi limpo!");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const loadDemoData = () => {
    saveVotingLocations(SAMPLE_TRE_DATA);
    setSuccessMsg("Dados demonstrativos carregados com sucesso!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div id="eleitoral_bi_dashboard" className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 p-4 md:p-6 space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-600 font-bold uppercase tracking-wider text-xs">
            <LayoutDashboard className="w-4 h-4 text-blue-600" />
            <span>Sistema Nexus Política BI & Analytics TRE</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight uppercase mt-1">
            Análise Eleitoral
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Monitoramento analítico de eleitores aptos, locais de votação e representatividade estatística.
          </p>
        </div>
        
        {/* RESET FILTERS BUTTON */}
        <div className="flex items-center gap-2 flex-wrap">
          {votingLocations.length > 0 && (
            <button 
              onClick={resetFilters}
              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm text-xs font-black uppercase tracking-tight text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-600 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setSubTab('tre_oficial')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            subTab === 'tre_oficial'
              ? 'border-blue-600 text-blue-600 dark:text-blue-600 bg-blue-600/5'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50'
          }`}
        >
          <Database className="w-4 h-4" />
          Dados Oficiais do TRE
        </button>
        <button
          onClick={() => setSubTab('cruzamento')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            subTab === 'cruzamento'
              ? 'border-blue-600 text-blue-600 dark:text-blue-600 bg-blue-600/5'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50'
          }`}
        >
          <Target className="w-4 h-4 text-blue-600" />
          Cruzamento de Dados & Estratégia
          <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm">NOVO</span>
        </button>
      </div>

      {/* FEEDBACK BANNERS */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 p-4 rounded-sm shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 p-4 rounded-sm shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide">{errorMsg}</span>
        </div>
      )}

      {/* SECTION: COORDINATOR ONLY EXCEL IMPORT CARD */}
      {isCoordinator && (
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-sm p-5 shadow-xl border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
              <Database className="w-4 h-4 animate-pulse" />
              <span>Importador Oficial TRE - Painel de Controle do Coordenador</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-sm text-[10px] font-black uppercase tracking-wider transition-all"
                title="Baixar planilha modelo do Excel pre-configurada"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Modelo de Planilha</span>
              </button>

              <button
                onClick={clearData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-sm text-[10px] font-black uppercase tracking-wider transition-all"
                title="Zerar todos os registros importados do banco"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Zerar Banco TRE</span>
              </button>

              {votingLocations.length === 0 && (
                <button
                  onClick={loadDemoData}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-blue-300 border border-blue-300/30 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all"
                  title="Alimenta dados demonstrativos para simulação de testes"
                >
                  <span>Massa de Teste</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
            {/* Left instructions */}
            <div className="lg:col-span-1 text-left space-y-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Alimentar Base de Dados Oficiais
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Adicione a planilha do Excel com os dados reais do TRE. Nosso leitor reconhece automaticamente colunas de Município, Zona Eleitoral, Bairro, Local de Votação e Eleitores Aptos.
              </p>
              <div className="pt-2">
                <span className="inline-block text-[8px] uppercase tracking-widest text-zinc-400 bg-white/10 px-2 py-0.5 rounded-sm">
                  Extensões Suportadas: .xlsx, .xls, .csv
                </span>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div className="lg:col-span-2">
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-sm p-5 text-center transition-all ${
                  dragActive 
                    ? "border-blue-500 bg-blue-950/30" 
                    : "border-zinc-850 hover:border-blue-600 bg-white/5 hover:bg-white/10"
                }`}
              >
                <input 
                  type="file" 
                  id="excel-file-upload-input"
                  className="hidden" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileUpload} 
                />
                
                <label 
                  htmlFor="excel-file-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2 h-full py-4"
                >
                  <UploadCloud className="w-10 h-10 text-blue-600 animate-bounce" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Arraste a planilha do TRE aqui ou clique para selecionar
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    O sistema irá ler e recalcular todos os gráficos de BI instantaneamente
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN SCREEN HANDLING - EMPTY STATE VS GRAPH COMPONENT */}
      {votingLocations.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-12 text-center max-w-2xl mx-auto shadow-sm">
          <FileSpreadsheet className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wide">
            Nenhum Dado Eleitoral Carregado
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
            Iremos trabalhar exclusivamente com dados oficiais do TRE. Os dados simulados de teste foram zerados de acordo com as diretrizes de segurança da campanha.
          </p>

          {isCoordinator ? (
            <div className="mt-8 space-y-4">
              <p className="text-[11px] font-black text-blue-600 dark:text-blue-600 uppercase tracking-widest">
                Você possui privilégios de Coordenador Geral.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white hover:bg-zinc-850 font-black text-xs uppercase tracking-wider rounded-sm transition-all shadow-sm border border-zinc-800"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Baixar Modelo Excel</span>
                </button>
                
                <label
                  htmlFor="excel-file-upload-input"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-500 font-black text-xs uppercase tracking-wider rounded-sm cursor-pointer transition-all shadow-sm"
                >
                  <UploadCloud className="w-4 h-4 text-zinc-950" />
                  <span>Carregar Planilha Oficial</span>
                </label>
              </div>
              
              <div className="pt-4">
                <button 
                  onClick={loadDemoData}
                  className="text-[10px] text-zinc-400 hover:text-blue-600 underline font-bold transition-colors uppercase tracking-wider"
                >
                  Ou clique aqui para carregar a massa de teste demonstrativa de Roraima para visualização rápida.
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest">
                Aguardando carregamento da planilha oficial de locais de votação do TRE pelo coordenador geral no painel administrativo.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {subTab === 'tre_oficial' ? (
            <>
              {/* FILTER CONTROLS */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-black text-sm uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Segmentação e Filtros Interativos</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Municipio Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Município
                </label>
                <select
                  value={selectedMunicipio}
                  onChange={(e) => handleMunicipioChange(e.target.value)}
                  className="w-full text-xs font-black bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm p-2 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all uppercase"
                >
                  {municipiosList.map(mun => (
                    <option key={mun} value={mun}>{mun === 'Todos' ? '✦ Todos os Municípios' : mun}</option>
                  ))}
                </select>
              </div>

              {/* Zona Eleitoral Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Zona Eleitoral
                </label>
                <select
                  value={selectedZona}
                  onChange={(e) => handleZonaChange(e.target.value)}
                  className="w-full text-xs font-black bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm p-2 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all uppercase"
                >
                  {zonasList.map(z => (
                    <option key={z} value={z}>{z === 'Todos' ? '✦ Todas as Zonas' : z}</option>
                  ))}
                </select>
              </div>

              {/* Bairro Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Bairro
                </label>
                <select
                  value={selectedBairro}
                  onChange={(e) => handleBairroChange(e.target.value)}
                  className="w-full text-xs font-black bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm p-2 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all uppercase"
                >
                  {bairrosList.map(b => (
                    <option key={b} value={b}>{b === 'Todos' ? '✦ Todos os Bairros' : b}</option>
                  ))}
                </select>
              </div>

              {/* Local Votacao Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Local de Votação
                </label>
                <select
                  value={selectedLocal}
                  onChange={(e) => setSelectedLocal(e.target.value)}
                  className="w-full text-xs font-black bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm p-2 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all uppercase"
                >
                  {locaisList.map(l => (
                    <option key={l} value={l}>
                      {l === 'Todos' ? '✦ Todos os Locais' : l.length > 35 ? l.substring(0, 32) + '...' : l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* PAINEL GERAL (RESUMO EXECUTIVO) */}
          <div className="space-y-3">
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest pl-1">
              Painel Geral (Resumo Executivo)
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Eleitores */}
              <div className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-sm p-4 shadow-sm border border-zinc-800 flex flex-col justify-between relative overflow-hidden group border-t-4 border-t-blue-600">
                <div className="absolute right-2 top-2 text-white/5 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-16 h-16 text-blue-600" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Eleitores Aptos Geral
                </p>
                <div className="mt-3">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-none text-blue-600">
                    {totalStateEleitores.toLocaleString()}
                  </h3>
                  <p className="text-[9px] text-zinc-500 mt-1 uppercase font-semibold">
                    Consolidado Carregado
                  </p>
                </div>
              </div>

              {/* Total Municipios */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group border-t-4 border-t-zinc-300 dark:border-t-zinc-700">
                <div className="absolute right-2 top-2 text-zinc-100 dark:text-zinc-800 group-hover:scale-110 transition-transform">
                  <Building2 className="w-14 h-14" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Municípios Analisados
                </p>
                <div className="mt-3">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">
                    {totalStateMunicipios}
                  </h3>
                  <p className="text-[9px] text-zinc-400 mt-1 uppercase font-semibold">
                    Cidades Mapeadas
                  </p>
                </div>
              </div>

              {/* Total Locais */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group border-t-4 border-t-zinc-300 dark:border-t-zinc-700">
                <div className="absolute right-2 top-2 text-zinc-100 dark:text-zinc-800 group-hover:scale-110 transition-transform">
                  <Map className="w-14 h-14" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Locais de Votação
                </p>
                <div className="mt-3">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">
                    {totalStateLocais}
                  </h3>
                  <p className="text-[9px] text-zinc-400 mt-1 uppercase font-semibold">
                    Pontos Estatísticos
                  </p>
                </div>
              </div>

              {/* Total Secoes */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group border-t-4 border-t-zinc-300 dark:border-t-zinc-700">
                <div className="absolute right-2 top-2 text-zinc-100 dark:text-zinc-800 group-hover:scale-110 transition-transform">
                  <Hash className="w-14 h-14" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Seções Eleitorais
                </p>
                <div className="mt-3">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">
                    {totalStateSecoes}
                  </h3>
                  <p className="text-[9px] text-zinc-400 mt-1 uppercase font-semibold">
                    Urnas Registradas
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* FILTER METRICS PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CURRENT FILTERS SUMMARY */}
            <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-3">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Escopo Atual Filtrado</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 uppercase font-black tracking-wider text-[9px]">Município:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      {selectedMunicipio}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 uppercase font-black tracking-wider text-[9px]">Zona Eleitoral:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      {selectedZona}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 uppercase font-black tracking-wider text-[9px]">Bairro:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-right max-w-[200px] truncate" title={selectedBairro}>
                      {selectedBairro}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 uppercase font-black tracking-wider text-[9px]">Local:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-right max-w-[200px] truncate" title={selectedLocal}>
                      {selectedLocal}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded border border-zinc-100 dark:border-zinc-850">
                  <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Eleitores Escopo</p>
                  <h4 className="text-lg font-black text-blue-600 dark:text-blue-600 mt-1">
                    {totalScopeEleitores.toLocaleString()}
                  </h4>
                  <p className="text-[8px] text-zinc-400">
                    {totalStateEleitores > 0 ? ((totalScopeEleitores / totalStateEleitores) * 100).toFixed(2) : 0}% do Total
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded border border-zinc-100 dark:border-zinc-850">
                  <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Seções Escopo</p>
                  <h4 className="text-lg font-black text-amber-500 dark:text-amber-400 mt-1">
                    {totalScopeSecoes}
                  </h4>
                  <p className="text-[8px] text-zinc-400">
                    {totalStateSecoes > 0 ? ((totalScopeSecoes / totalStateSecoes) * 100).toFixed(2) : 0}% das Urnas
                  </p>
                </div>
              </div>
            </div>

            {/* INDICADORES (KPIS) */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-4 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Indicadores de Desempenho e Extremos (KPIs)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Maior Local de Votação */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 p-3 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      Maior Local de Votação {selectedMunicipio !== 'Todos' ? `de ${selectedMunicipio}` : ''}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white mt-1.5 truncate" title={kpiMetrics.maiorLocal.local}>
                      {kpiMetrics.maiorLocal.local}
                    </h4>
                  </div>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-lg font-black text-blue-600 dark:text-blue-600">
                      {kpiMetrics.maiorLocal.eleitores.toLocaleString()} eleitores
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-600/10 px-1.5 py-0.5 rounded-sm">
                      {kpiMetrics.maiorLocal.percentMun.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Menor Local de Votação */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 p-3 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      Menor Local de Votação {selectedMunicipio !== 'Todos' ? `de ${selectedMunicipio}` : ''}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white mt-1.5 truncate" title={kpiMetrics.menorLocal.local}>
                      {kpiMetrics.menorLocal.local}
                    </h4>
                  </div>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-lg font-black text-zinc-700 dark:text-zinc-300">
                      {kpiMetrics.menorLocal.eleitores.toLocaleString()} eleitores
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      {kpiMetrics.menorLocal.percentMun.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Média de Eleitores por Local */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 p-3 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      Média de Eleitores por Local
                    </span>
                    <h4 className="text-xs font-bold text-zinc-500 mt-1">
                      Mapeado no escopo selecionado
                    </h4>
                  </div>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-lg font-black text-amber-500 dark:text-amber-400">
                      {kpiMetrics.mediaEleitores.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-zinc-400 uppercase font-semibold">
                      Média / Local
                    </span>
                  </div>
                </div>

                {/* Percentual Acumulado dos 5 Maiores */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 p-3 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      Concentração nos 5 Maiores Locais
                    </span>
                    <h4 className="text-xs font-bold text-zinc-500 mt-1">
                      Representatividade somada top 5
                    </h4>
                  </div>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-lg font-black text-blue-600 dark:text-blue-600">
                      {kpiMetrics.top5AccumulatedPercent.toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-zinc-400 uppercase font-semibold">
                      do Escopo
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* MUNICIPIO LEVEL DRILL DOWN (PAINEL POR MUNICIPIO) */}
          {municipioPanelData && (
            <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-sm p-5 shadow-sm border border-zinc-800">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Painel Detalhado por Município</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div className="md:col-span-2">
                  <h3 className="text-2xl font-black uppercase text-white tracking-tight text-blue-600">
                    {municipioPanelData.nome}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Análise específica de representatividade e capilaridade urbana.
                  </p>
                </div>

                <div className="grid grid-cols-3 md:col-span-3 gap-2">
                  <div className="bg-white/10 p-3 rounded text-center border border-white/5">
                    <p className="text-[8px] font-bold text-blue-200 uppercase tracking-widest">Eleitores Aptos</p>
                    <h4 className="text-lg font-black text-white mt-1">
                      {municipioPanelData.eleitores.toLocaleString()}
                    </h4>
                  </div>
                  <div className="bg-white/10 p-3 rounded text-center border border-white/5">
                    <p className="text-[8px] font-bold text-blue-200 uppercase tracking-widest">Locais</p>
                    <h4 className="text-lg font-black text-white mt-1">
                      {municipioPanelData.locais}
                    </h4>
                  </div>
                  <div className="bg-white/10 p-3 rounded-sm text-center border border-white/5">
                    <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">% do Estado</p>
                    <h4 className="text-lg font-black text-blue-600 mt-1">
                      {municipioPanelData.representatividade.toFixed(2)}%
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHARTS CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CHART 1: LOCAL VOTING RANKING (HORIZONTAL BARS) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4">
                  <div className="text-zinc-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                    Gráfico 1: Concentração por Local de Votação (Top 10)
                  </div>
                  <span className="text-[8px] font-black text-blue-600 bg-blue-600/10 px-1.5 py-0.5 rounded-sm uppercase">
                    Eleitores Aptos
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-4">
                  Eixo X = Quantidade de Eleitores Aptos | Eixo Y = Local de Votação
                </p>
              </div>

              <div className="h-80 w-full text-xs font-medium">
                {barChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-400">Nenhum dado filtrado</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" opacity={0.3} />
                      <XAxis type="number" stroke="#888888" fontSize={9} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#888888" 
                        fontSize={8} 
                        width={110}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', color: '#fff', fontSize: 10, borderRadius: 4 }}
                        formatter={(value: any) => [`${value.toLocaleString()} Eleitores`, 'Total']}
                      />
                      <Bar dataKey="eleitores" radius={[0, 4, 4, 0]}>
                        {barChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* CHART 2: PIE/DONUT CHART (PARTICIPATION OF LOCALS) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4">
                  <div className="text-zinc-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                    Gráfico 2: Participação de cada Local de Votação
                  </div>
                  <span className="text-[8px] font-black text-blue-600 bg-blue-600/10 px-1.5 py-0.5 rounded-sm uppercase">
                    Participação %
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-4">
                  Divisão percentual dos maiores locais e aglutinação de remanescentes em &quot;Outros&quot;
                </p>
              </div>

              <div className="h-80 w-full text-xs">
                {pieChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-400">Nenhum dado filtrado</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', color: '#fff', fontSize: 10, borderRadius: 4 }}
                        formatter={(value: any) => [`${value.toLocaleString()} Eleitores`, 'Aptos']}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 9 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* CHART 3: STATEWIDE MUNICIPAL RANKING */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4">
                <div className="text-zinc-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                  Gráfico 3: Ranking Estadual Geral dos Municípios
                </div>
                <span className="text-[8px] font-black text-blue-600 bg-blue-600/10 px-1.5 py-0.5 rounded-sm uppercase">
                  Eleitorado do maior para o menor
                </span>
              </div>

              <div className="h-64 w-full text-xs font-medium">
                {muniRankingChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-400">Nenhum dado carregado</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={muniRankingChartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#888888" 
                        fontSize={8} 
                        angle={-45} 
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis stroke="#888888" fontSize={9} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', color: '#fff', fontSize: 10, borderRadius: 4 }}
                        formatter={(value: any) => [`${value.toLocaleString()} Eleitores Aptos`, 'Eleitores']}
                      />
                      <Bar dataKey="eleitores" fill="#0578d3" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* DETAILED DYNAMIC TABLE (TABELA DETALHADA NA PARTE INFERIOR) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded shadow-sm overflow-hidden">
            
            {/* Table Header Controls */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-900">
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Painel de Locais de Votação (Tabela Dinâmica)
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Exibindo {processedTableData.length} locais filtrados. Ordenação automática por volume de eleitores.
                </p>
              </div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase bg-zinc-200 dark:bg-zinc-800 px-2.5 py-1 rounded">
                Fórmulas de BI Aplicadas
              </div>
            </div>

            {/* Dynamic Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-850 text-zinc-500 uppercase font-black text-[9px] border-b border-zinc-200 dark:border-zinc-800 tracking-wider">
                    <th className="py-3 px-4">Município</th>
                    <th className="py-3 px-4">ZE / Bairro</th>
                    <th 
                      className="py-3 px-4 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                      onClick={() => toggleSort('local')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Local de Votação</span>
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Endereço / Seções</th>
                    <th 
                      className="py-3 px-4 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-right"
                      onClick={() => toggleSort('eleitores')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Eleitores Aptos</span>
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">% do Município</th>
                    <th className="py-3 px-4 text-right">% do Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                  {processedTableData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-400">
                        Nenhum local correspondente aos filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    processedTableData.map((row, index) => (
                      <tr 
                        key={`${row.municipio}-${row.local}-${index}`}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        {/* Município */}
                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white uppercase text-[10px]">
                          {row.municipio}
                        </td>
                        
                        {/* ZE / Bairro */}
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">
                          <div className="font-semibold text-[10px]">{row.zona}</div>
                          <div className="text-[9px] mt-0.5 uppercase tracking-wide opacity-80">{row.bairro}</div>
                        </td>

                        {/* Local de Votação */}
                        <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-bold max-w-[200px] truncate" title={row.local}>
                          {row.local}
                        </td>

                        {/* Endereço / Seções */}
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 max-w-[180px]">
                          <div className="truncate text-[10px]" title={row.endereco}>{row.endereco}</div>
                          <div className="text-[9px] font-mono mt-0.5 text-zinc-400">
                            {row.secoesCount} seções {row.secoes ? `(${row.secoes.length > 20 ? row.secoes.substring(0, 18) + '...' : row.secoes})` : ''}
                          </div>
                        </td>

                        {/* Eleitores Aptos */}
                        <td className="py-3 px-4 text-right text-zinc-900 dark:text-white font-black">
                          {row.eleitores.toLocaleString()}
                        </td>

                        {/* % do Município */}
                        <td className="py-3 px-4 text-right">
                          <div className="text-amber-600 dark:text-amber-400 font-black">
                            {row.percentMuni.toFixed(2)}%
                          </div>
                          <div className="text-[7px] text-zinc-400 uppercase tracking-widest leading-none">Concentração</div>
                        </td>

                        {/* % do Estado */}
                        <td className="py-3 px-4 text-right">
                          <div className="text-blue-600 dark:text-blue-600 font-black">
                            {row.percentTotal.toFixed(2)}%
                          </div>
                          <div className="text-[7px] text-zinc-400 uppercase tracking-widest leading-none">Representatividade</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </>
        ) : (
            /* THE BRAND NEW CRUZAMENTO DE DADOS VIEW */
            <div className="space-y-6 animate-fadeIn">
              {/* INTRO AND FILTERS */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-sm shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Compass className="w-5 h-5 text-blue-600 animate-pulse" />
                      Diretrizes Estratégicas de Cobertura Eleitoral
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Cruzamento em tempo real dos eleitores oficiais do TRE com os cadastros captados pelas equipes da campanha. Use este painel para direcionar visitas, organizar panfletagens e priorizar municípios com baixo engajamento.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-sm border border-zinc-200 dark:border-zinc-700">
                      <button
                        onClick={() => setStrategicSort('coverage')}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all ${
                          strategicSort === 'coverage'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        Menor Cobertura
                      </button>
                      <button
                        onClick={() => setStrategicSort('missing')}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all ${
                          strategicSort === 'missing'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        Mais Faltantes (Volume)
                      </button>
                    </div>

                    <select
                      value={strategicStatusFilter}
                      onChange={(e: any) => setStrategicStatusFilter(e.target.value)}
                      className="text-[10px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-sm p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="Todos">✦ Filtro: Todos os Status</option>
                      <option value="critical">🔴 Crítico (&lt; 0.5%)</option>
                      <option value="low">🟠 Baixo (0.5% - 1.5%)</option>
                      <option value="medium">🟡 Médio (1.5% - 4.0%)</option>
                      <option value="good">🟢 Bom (&gt;= 4.0%)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BENTO STATS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total TRE */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Eleitores TRE (Estado)</p>
                    <p className="text-2xl font-black text-zinc-950 dark:text-white mt-1">
                      {totalStateEleitores.toLocaleString()}
                    </p>
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Base Oficial TRE Carregada</p>
                  </div>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400">
                    <Database className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 2: Total Campaign */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Cadastros na Campanha</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-600 mt-1">
                      {campaignVoters.length.toLocaleString()}
                    </p>
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Eleitores Mapeados Ativos</p>
                  </div>
                  <div className="p-3 bg-blue-600/10 rounded-full text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 3: Average Coverage */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Índice Médio de Penetração</p>
                    <p className="text-2xl font-black text-zinc-950 dark:text-white mt-1">
                      {totalStateEleitores > 0 ? ((campaignVoters.length / totalStateEleitores) * 100).toFixed(2) : '0.00'}%
                    </p>
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Média Geral de Cobertura</p>
                  </div>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400">
                    <Percent className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 4: Critical Municipalities */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Municípios Críticos</p>
                    <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                      {crossReferencedData.filter(d => d.status === 'critical' || d.status === 'low').length}
                    </p>
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Cobertura Abaixo de 1.5%</p>
                  </div>
                  <div className="p-3 bg-rose-500/10 rounded-full text-rose-500">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* VISUAL CHART AND DETAILED LIST SIDE BY SIDE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* CHART: VISUALIZATION OF COVERAGE INDEX */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm shadow-sm lg:col-span-7">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4">
                    <div className="text-zinc-950 dark:text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Gráfico Estratégico: Índice de Cobertura por Município (%)
                    </div>
                    <span className="text-[8px] font-black text-blue-600 bg-blue-600/10 px-1.5 py-0.5 rounded-sm uppercase">
                      Menor Cobertura = Maior Prioridade
                    </span>
                  </div>
                  
                  <div className="h-[420px] w-full text-xs">
                    {crossReferencedData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-zinc-400 uppercase tracking-wider">Carregue dados do TRE para gerar o gráfico</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[...crossReferencedData].sort((a, b) => a.coverageRate - b.coverageRate)}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" opacity={0.3} />
                          <XAxis type="number" stroke="#888888" fontSize={9} tickFormatter={(tick) => `${tick}%`} />
                          <YAxis 
                            type="category" 
                            dataKey="municipio" 
                            stroke="#888888" 
                            fontSize={9} 
                            width={95}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', color: '#fff', fontSize: 10, borderRadius: 4 }}
                            formatter={(value: any) => [`${parseFloat(value).toFixed(3)}% de Penetração`, 'Índice de Cobertura']}
                          />
                          <Bar dataKey="coverageRate" radius={[0, 4, 4, 0]}>
                            {[...crossReferencedData].sort((a, b) => a.coverageRate - b.coverageRate).map((entry, index) => {
                              // Style bars color based on status
                              let color = '#ef4444'; // Red for critical
                              if (entry.coverageRate >= 4.0) color = '#10b981'; // Green
                              else if (entry.coverageRate >= 1.5) color = '#0578d3'; // Yellow
                              else if (entry.coverageRate >= 0.5) color = '#f97316'; // Orange
                              
                              return <Cell key={`cell-${index}`} fill={color} opacity={0.85} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-4 flex-wrap text-[9px] font-black uppercase tracking-wider border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500 rounded-sm inline-block"></span> Crítico (&lt; 0.5%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-orange-500 rounded-sm inline-block"></span> Baixo (0.5% - 1.5%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-600 rounded-sm inline-block"></span> Médio (1.5% - 4.0%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block"></span> Bom (&gt;= 4.0%)</div>
                  </div>
                </div>

                {/* DETAILED SIDE DRILLDOWN INTERACTIVE CARD */}
                <div className="lg:col-span-5 flex flex-col justify-between bg-zinc-950 text-white border border-zinc-800 p-5 rounded-sm shadow-lg">
                  {selectedStrategyMun ? (
                    (() => {
                      const data = crossReferencedData.find(d => d.municipio === selectedStrategyMun);
                      if (!data) return <p className="text-xs text-zinc-400">Município não encontrado</p>;
                      return (
                        <div className="space-y-5 h-full flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black tracking-widest text-blue-600 uppercase">Diagnóstico Regional</span>
                              <button 
                                onClick={() => setSelectedStrategyMun(null)}
                                className="text-[10px] text-zinc-400 hover:text-white transition-colors uppercase"
                              >
                                [Fechar]
                              </button>
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1 border-b border-zinc-800 pb-2">
                              {data.municipio}
                            </h3>

                            {/* Stat items */}
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div className="bg-zinc-900 border border-zinc-850 p-2.5 rounded-sm">
                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Aptos (TRE)</p>
                                <p className="text-lg font-black text-white mt-1">{data.treElectors.toLocaleString()}</p>
                                <p className="text-[7px] text-zinc-500 uppercase mt-0.5">({data.treSharePercent.toFixed(1)}% do Estado)</p>
                              </div>
                              <div className="bg-zinc-900 border border-zinc-850 p-2.5 rounded-sm">
                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Cadastrados</p>
                                <p className="text-lg font-black text-blue-600 mt-1">{data.campaignVoters.toLocaleString()}</p>
                                <p className="text-[7px] text-zinc-500 uppercase mt-0.5">Eleitores Cooptados</p>
                              </div>
                            </div>

                            {/* Progress Meter */}
                            <div className="mt-4 bg-zinc-900 border border-zinc-850 p-3 rounded-sm space-y-2">
                              <div className="flex items-center justify-between text-[9px] font-black uppercase">
                                <span className="text-zinc-400">Taxa de Cobertura</span>
                                <span className={
                                  data.status === 'critical' ? 'text-red-500' :
                                  data.status === 'low' ? 'text-orange-500' :
                                  data.status === 'medium' ? 'text-blue-600' : 'text-emerald-500'
                                }>
                                  {data.coverageRate.toFixed(3)}%
                                </span>
                              </div>
                              <div className="w-full bg-zinc-800 h-2 rounded-sm overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    data.status === 'critical' ? 'bg-red-500' :
                                    data.status === 'low' ? 'bg-orange-500' :
                                    data.status === 'medium' ? 'bg-blue-600' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(100, data.coverageRate * 15)}%` }} // Scaling multiplier for visibility
                                ></div>
                              </div>
                              <p className="text-[8px] text-zinc-500 leading-normal uppercase">
                                Potencial restante de captação: <strong className="text-zinc-300">{(data.treElectors - data.campaignVoters).toLocaleString()}</strong> eleitores sem contato registrado.
                              </p>
                            </div>

                            {/* Actions list */}
                            <div className="mt-5 space-y-3">
                              <div className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5" />
                                Plano de Ação Tático Sugerido
                              </div>
                              <div className="p-3 bg-blue-600/5 border border-blue-600/20 text-blue-200 text-[11px] leading-relaxed rounded-sm">
                                {data.recommendation}
                              </div>

                              <ul className="text-[10px] space-y-1.5 text-zinc-300 uppercase font-black tracking-wide pl-1 mt-2">
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600">•</span>
                                  <span>Alocar articulador local na Zona {data.treElectors > 10000 ? "de alto quociente" : "eleitoral da região"}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600">•</span>
                                  <span>Mapear bairros com menor número de fichas entregues</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600">•</span>
                                  <span>Visita oficial do candidato / Coordenadores na região</span>
                                </li>
                              </ul>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-zinc-800 mt-4">
                            <button
                              onClick={() => {
                                setSelectedMunicipio(data.municipio);
                                setSubTab('tre_oficial');
                              }}
                              className="w-full py-2 bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider rounded-sm hover:bg-blue-500 transition-all text-center flex items-center justify-center gap-1"
                            >
                              <Search className="w-3.5 h-3.5" />
                              Ver Locais de Votação no TRE
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <Target className="w-12 h-12 text-blue-600/40 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-black uppercase text-white tracking-widest">Selecione um Município</h4>
                        <p className="text-[10px] text-zinc-400 max-w-xs mt-1.5 leading-relaxed uppercase">
                          Clique em qualquer município na tabela ou gráfico ao lado para abrir o diagnóstico completo e receber as diretrizes de mobilização das equipes.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* STRATEGIC RANKED TABLE */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-zinc-950 dark:text-white font-black text-xs uppercase tracking-wider">
                    <Award className="w-4 h-4 text-blue-600" />
                    Lista de Priorização por Cobertura Eleitoral ({strategicStatusFilter === 'Todos' ? 'Todos os Municípios' : `Status: ${strategicStatusFilter.toUpperCase()}`})
                  </div>
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">
                    Exibindo {
                      (strategicSort === 'coverage' ? rankedByCoverage : rankedByStrategicPriority)
                        .filter(d => strategicStatusFilter === 'Todos' || d.status === strategicStatusFilter)
                        .length
                    } municípios ordenados por {strategicSort === 'coverage' ? 'Menor Cobertura' : 'Volume de Eleitores Faltantes'}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        <th className="py-2.5 px-4">Município</th>
                        <th className="py-2.5 px-4 text-right">Eleitores (TRE)</th>
                        <th className="py-2.5 px-4 text-right">Cadastrados (Nossos)</th>
                        <th className="py-2.5 px-4 text-center">Índice de Cobertura</th>
                        <th className="py-2.5 px-4 text-right">Faltam Cadastrar</th>
                        <th className="py-2.5 px-4">Prioridade / Status</th>
                        <th className="py-2.5 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs">
                      {(strategicSort === 'coverage' ? rankedByCoverage : rankedByStrategicPriority)
                        .filter(d => strategicStatusFilter === 'Todos' || d.status === strategicStatusFilter)
                        .map((row) => {
                          return (
                            <tr 
                              key={row.municipio}
                              className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer ${selectedStrategyMun === row.municipio ? 'bg-blue-600/5 dark:bg-blue-600/5 border-l-2 border-l-blue-600' : ''}`}
                              onClick={() => setSelectedStrategyMun(row.municipio)}
                            >
                              {/* Municipio */}
                              <td className="py-3 px-4 font-black text-zinc-950 dark:text-white uppercase text-[11px]">
                                {row.municipio}
                              </td>

                              {/* TRE Electors */}
                              <td className="py-3 px-4 text-right font-semibold text-zinc-600 dark:text-zinc-300">
                                {row.treElectors > 0 ? row.treElectors.toLocaleString() : '---'}
                              </td>

                              {/* Campaign Voters */}
                              <td className="py-3 px-4 text-right font-black text-blue-600 dark:text-blue-600 text-[12px]">
                                {row.campaignVoters.toLocaleString()}
                              </td>

                              {/* Coverage Indicator */}
                              <td className="py-3 px-4">
                                <div className="flex flex-col items-center justify-center max-w-[140px] mx-auto space-y-1">
                                  <span className="font-bold text-[10px] text-zinc-700 dark:text-zinc-300">
                                    {row.coverageRate.toFixed(3)}%
                                  </span>
                                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-sm overflow-hidden">
                                    <div 
                                      className={`h-full ${
                                        row.status === 'critical' ? 'bg-red-500' :
                                        row.status === 'low' ? 'bg-orange-500' :
                                        row.status === 'medium' ? 'bg-blue-600' : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${Math.min(100, row.coverageRate * 15)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>

                              {/* Missing Voters */}
                              <td className="py-3 px-4 text-right font-bold text-zinc-500 dark:text-zinc-400">
                                {row.missingElectors > 0 ? row.missingElectors.toLocaleString() : '---'}
                              </td>

                              {/* Priority Status Badge */}
                              <td className="py-3 px-4">
                                {row.status === 'critical' && (
                                  <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded-sm bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">🔴 Crítico</span>
                                )}
                                {row.status === 'low' && (
                                  <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded-sm bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400">🟠 Baixo</span>
                                )}
                                {row.status === 'medium' && (
                                  <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded-sm bg-blue-600/10 border border-blue-600/30 text-blue-600 dark:text-blue-600">🟡 Médio</span>
                                )}
                                {row.status === 'good' && (
                                  <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">🟢 Consolidado</span>
                                )}
                              </td>

                              {/* Action Buttons */}
                              <td className="py-3 px-4 text-center">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStrategyMun(row.municipio);
                                  }}
                                  className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-600 hover:text-white font-black text-[9px] uppercase tracking-wider rounded-sm transition-all"
                                >
                                  Diagnóstico
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
