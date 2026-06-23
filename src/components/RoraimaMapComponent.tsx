import React, { useState, useMemo } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  MapPin, 
  Search, 
  Phone, 
  Mail, 
  Users, 
  User, 
  Network, 
  TrendingUp, 
  Award,
  DollarSign, 
  CheckCircle2, 
  Map as MapIcon, 
  Building2, 
  UserCheck, 
  HelpCircle,
  Hash,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';

interface RoraimaMapComponentProps {
  teams: any[];
  allVoters: any[];
  theme: 'light' | 'dark';
}

const MUNICIPALITIES = [
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
];

// Map of municipality to their respective Electoral Zone info
const ZONE_INFO: Record<string, { zone: string; color: string; hoverColor: string; description: string }> = {
  "Amajari": { 
    zone: "7ª Zona", 
    color: "#cbe296", 
    hoverColor: "#b2cf72",
    description: "Sede de Operações da 7ª ZE (Pacaraima, Amajari e Uiramutã)." 
  },
  "Pacaraima": { 
    zone: "7ª Zona", 
    color: "#a7d18c", 
    hoverColor: "#89bf6a",
    description: "Operações de Fronteira. Vinculado à 7ª ZE." 
  },
  "Uiramutã": { 
    zone: "7ª Zona", 
    color: "#cbef90", 
    hoverColor: "#abc270",
    description: "Extremo Norte. Comunidades Indígenas vinculadas à 7ª ZE." 
  },
  "Alto Alegre": { 
    zone: "3ª Zona", 
    color: "#fffaae", 
    hoverColor: "#e6e08c",
    description: "Sede de Operações da 3ª ZE. Região de forte atuação agrícola." 
  },
  "Boa Vista": { 
    zone: "1ª/5ª Zona", 
    color: "#ffffff", 
    hoverColor: "#e6e4df",
    description: "Capital do Estado. Maior colégio eleitoral, dividido entre 1ª e 5ª ZE." 
  },
  "Bonfim": { 
    zone: "9ª Zona", 
    color: "#45b4c1", 
    hoverColor: "#3297a3",
    description: "Sede de Operações da 9ª ZE (Bonfim e Normandia). Fronteira Guiana." 
  },
  "Normandia": { 
    zone: "9ª Zona", 
    color: "#20a3b2", 
    hoverColor: "#17838f",
    description: "Vinculado à 9ª ZE. Forte engajamento de bases rurais." 
  },
  "Cantá": { 
    zone: "5ª Zona", 
    color: "#ffd07b", 
    hoverColor: "#e6b35d",
    description: "Vinculado à 5ª ZE (Boa Vista e Cantá). Cinturão verde e vicinais." 
  },
  "Mucajaí": { 
    zone: "6ª Zona", 
    color: "#a998c7", 
    hoverColor: "#8f7cae",
    description: "Sede de Operações da 6ª ZE (Mucajaí e Iracema). Hub logístico." 
  },
  "Iracema": { 
    zone: "6ª Zona", 
    color: "#9988b7", 
    hoverColor: "#7e6da0",
    description: "Vinculada à 6ª ZE. Grande potencial de expansão regional." 
  },
  "Caracaraí": { 
    zone: "2ª Zona", 
    color: "#cdbfa5", 
    hoverColor: "#b2a288",
    description: "Sede da 2ª ZE. Hub fluvial e maior em extensão territorial." 
  },
  "Rorainópolis": { 
    zone: "8ª Zona", 
    color: "#f26b80", 
    hoverColor: "#db5166",
    description: "Sede de Operações da 8ª ZE. Segundo maior colégio eleitoral de RR." 
  },
  "São Luiz": { 
    zone: "4ª Zona", 
    color: "#a0c4df", 
    hoverColor: "#82a9c7",
    description: "Sede de Operações da 4ª ZE (São Luiz, Baliza e Caroebe)." 
  },
  "São João da Baliza": { 
    zone: "4ª Zona", 
    color: "#8ab4df", 
    hoverColor: "#6c97c7",
    description: "Eixo do Sul. Integrado à 4ª ZE de Roraima." 
  },
  "Caroebe": { 
    zone: "4ª Zona", 
    color: "#6fa4df", 
    hoverColor: "#5286bf",
    description: "Extremo Sudeste de Roraima, forte bacia produtora da 4ª ZE." 
  }
};

export default function RoraimaMapComponent({ teams, allVoters, theme }: RoraimaMapComponentProps) {
  const [selectedMun, setSelectedMun] = useState<string>("Boa Vista");
  const [hoveredMun, setHoveredMun] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Dynamic voter mapping function with memoized lookup cache
  const mappedVoters = useMemo(() => {
    return allVoters.map(voter => {
      let location = "Boa Vista"; // Default fallback

      // 1. Match by voter's explicit address or localVotacao if it mentions a municipality
      const localText = `${voter.address || ""} ${voter.localVotacao || ""}`.toLowerCase();
      let matched = false;
      for (const mun of MUNICIPALITIES) {
        if (localText.includes(mun.toLowerCase())) {
          location = mun;
          matched = true;
          break;
        }
      }

      // Special handling for short/special names
      if (!matched && voter.address) {
        const addrLower = voter.address.toLowerCase();
        if (addrLower.includes("baliza") || addrLower.includes("são joão")) {
          location = "São João da Baliza";
          matched = true;
        } else if (addrLower.includes("sao luiz") || addrLower.includes("luiz do anau")) {
          location = "São Luiz";
          matched = true;
        }
      }

      // 2. Fallback to matching with their articulator's team location
      if (!matched && voter.articulatorId) {
        const team = teams.find(t => t.id === voter.articulatorId || t.leader === voter.referredBy);
        if (team && team.location) {
          location = team.location;
          matched = true;
        }
      }

      // 3. Fallback to Electoral Zone matching
      if (!matched && voter.zona) {
        const z = voter.zona.toString().replace(/\D/g, '');
        if (z === '1') location = "Boa Vista";
        else if (z === '2') location = "Caracaraí";
        else if (z === '3') location = "Alto Alegre";
        else if (z === '4') {
          if (localText.includes("caroebe")) location = "Caroebe";
          else if (localText.includes("baliza") || localText.includes("joão")) location = "São João da Baliza";
          else location = "São Luiz";
        }
        else if (z === '5') {
          if (localText.includes("cantá") || localText.includes("canta")) location = "Cantá";
          else location = "Boa Vista";
        }
        else if (z === '6') {
          if (localText.includes("iracema")) location = "Iracema";
          else location = "Mucajaí";
        }
        else if (z === '7') {
          if (localText.includes("pacaraima")) location = "Pacaraima";
          else if (localText.includes("uiramutã") || localText.includes("uiramuta")) location = "Uiramutã";
          else location = "Amajari";
        }
        else if (z === '8') location = "Rorainópolis";
        else if (z === '9') {
          if (localText.includes("normandia")) location = "Normandia";
          else location = "Bonfim";
        }
      }

      return {
        ...voter,
        resolvedMunicipality: location
      };
    });
  }, [allVoters, teams]);

  // Aggregate stats per municipality for overall dashboard
  const munStats = useMemo(() => {
    const stats: Record<string, { voters: number; teams: number; leaders: string[]; supporters: number }> = {};
    MUNICIPALITIES.forEach(m => {
      stats[m] = { voters: 0, teams: 0, leaders: [], supporters: 0 };
    });

    mappedVoters.forEach(v => {
      const m = v.resolvedMunicipality;
      if (stats[m]) {
        stats[m].voters++;
        if (v.sentiment === 'support') stats[m].supporters++;
      }
    });

    teams.forEach(t => {
      const m = t.location;
      if (stats[m]) {
        stats[m].teams++;
        if (t.leader && !stats[m].leaders.includes(t.leader)) {
          stats[m].leaders.push(t.leader);
        }
      }
    });

    return stats;
  }, [mappedVoters, teams]);

  // Filter current active municipality data
  const municipalTeams = useMemo(() => {
    return teams.filter(t => t.location?.trim().toLowerCase() === selectedMun.toLowerCase());
  }, [teams, selectedMun]);

  const municipalVoters = useMemo(() => {
    return mappedVoters.filter(v => v.resolvedMunicipality?.toLowerCase() === selectedMun.toLowerCase());
  }, [mappedVoters, selectedMun]);

  // Search/sentiment filtered list of contacts for active city
  const filteredMunicipalVoters = useMemo(() => {
    return municipalVoters.filter(v => {
      const matchSearch = searchQuery === "" || 
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.localVotacao?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchSentiment = sentimentFilter === "all" || v.sentiment === sentimentFilter;
      
      return matchSearch && matchSentiment;
    });
  }, [municipalVoters, searchQuery, sentimentFilter]);

  // Build the Influence / Referral relationship tree inside the active city
  // "quem indicou quem, ou quem veio pela influencia de alguem"
  const influenceTree = useMemo(() => {
    const votersMap = new Map<string, any>();
    municipalVoters.forEach(v => votersMap.set(v.name.trim().toLowerCase(), { ...v, children: [] }));

    const roots: any[] = [];

    municipalVoters.forEach(v => {
      const node = votersMap.get(v.name.trim().toLowerCase());
      const refName = v.referredBy?.trim().toLowerCase();

      if (refName && votersMap.has(refName)) {
        // Person who referred them is also a voter in this municipality. Link them!
        votersMap.get(refName).children.push(node);
      } else {
        // No parent found in municipal voters: they are a seed/root influencer
        roots.push(node);
      }
    });

    // Sort roots so those with the most descendants/children appear first (major influencers)
    return roots.sort((a, b) => b.children.length - a.children.length);
  }, [municipalVoters]);

  const toggleNode = (nodeName: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeName]: !prev[nodeName]
    }));
  };

  // Helper to render tree nodes recursively
  const renderInfluenceNode = (node: any, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.name] !== false; // Default expanded

    const sentimentColors = {
      support: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-900 dark:text-green-400',
      neutral: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-900 dark:text-yellow-400',
      opposed: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
    };

    return (
      <div key={node.id || node.name} className="relative pl-6 md:pl-8 border-l border-zinc-200 dark:border-zinc-800 ml-4 py-1">
        {/* Connection point dot */}
        <div className="absolute top-4 left-0 w-3.5 h-px bg-zinc-200 dark:bg-zinc-800" />
        
        <div className={`p-3.5 rounded-sm border ${sentimentColors[node.sentiment as 'support'|'neutral'|'opposed'] || 'bg-zinc-50 border-zinc-200'} transition-all max-w-xl shadow-sm hover:shadow-md`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-tight text-xs sm:text-sm">
                {node.name}
              </span>
              
              {node.isArticulator && (
                <span className="bg-yellow-500 text-zinc-950 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm">
                  Articulador
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[9px] font-mono opacity-80 shrink-0">
              {node.phone && (
                <a 
                  href={`https://wa.me/55${node.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-green-500 transition-colors"
                >
                  <Phone className="w-2.5 h-2.5" /> {node.phone}
                </a>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
            {node.localVotacao && (
              <span className="flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-yellow-500" /> Colégio: {node.localVotacao}
              </span>
            )}
            {node.referredBy && (
              <span className="text-zinc-400 dark:text-zinc-500">
                Influência: <span className="text-yellow-600 dark:text-yellow-500 font-extrabold">{node.referredBy}</span>
              </span>
            )}
          </div>

          {hasChildren && (
            <button 
              onClick={() => toggleNode(node.name)}
              className="mt-2.5 flex items-center gap-1.5 text-[9px] font-black uppercase text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {node.children.length} {node.children.length === 1 ? 'Indicação Direta' : 'Indicações Diretas'}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {node.children.map((child: any) => renderInfluenceNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500 rounded-sm flex items-center justify-center shadow-lg shadow-yellow-500/10">
            <MapIcon className="w-6 h-6 text-zinc-950" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase text-zinc-950 dark:text-white tracking-tighter leading-none">Mapa Regional Eleitoral</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-2">Visão Estratégica, Divisão Político-Territorial de Roraima e Mapeamento de Influência</p>
          </div>
        </div>

        {/* Rapid Dropdown Selector for ease of access */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">Ir para:</span>
          <select 
            value={selectedMun} 
            onChange={(e) => setSelectedMun(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white px-4 py-2.5 rounded-sm font-black text-[10px] uppercase outline-none focus:border-yellow-500 shadow-sm"
          >
            {MUNICIPALITIES.map(mun => (
              <option key={mun} value={mun}>{mun} ({ZONE_INFO[mun]?.zone || "ZE"})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid View: Map Visualizer & Data Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Interactive SVG Map (Cols 1-6) */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-950 dark:text-white mb-2">Divisão por Zona e Município</h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Selecione ou clique nos municípios para mapear as frentes operacionais locais.</p>
              </div>
              <div className="p-2 bg-yellow-500/10 rounded-sm">
                <Info className="w-4 h-4 text-yellow-500" />
              </div>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="relative w-full aspect-[4/5] max-h-[600px] flex items-center justify-center p-3 outline-none">
              <svg 
                viewBox="100 0 900 950" 
                className="w-full h-full drop-shadow-md select-none transition-all duration-300"
              >
                {/* Defs for gradients, patterns */}
                <defs>
                  <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                    <feDropShadow dx="3" dy="3" stdDeviation="4" floodOpacity="0.15"/>
                  </filter>
                </defs>

                {/* Draw all Municipal Borders based on calculated points in image */}
                <g filter="url(#shadow)">
                  {/* 1. Amajari */}
                  <polygon 
                    points="300,160 400,110 500,100 450,140 500,200 590,180 580,210 480,225 380,210 320,180"
                    fill={selectedMun === "Amajari" ? ZONE_INFO["Amajari"].hoverColor : ZONE_INFO["Amajari"].color}
                    stroke={selectedMun === "Amajari" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "Amajari" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("Amajari")}
                    onMouseEnter={() => setHoveredMun("Amajari")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 2. Pacaraima */}
                  <polygon 
                    points="450,140 500,100 580,100 600,120 680,140 650,170 590,180 500,200"
                    fill={selectedMun === "Pacaraima" ? ZONE_INFO["Pacaraima"].hoverColor : ZONE_INFO["Pacaraima"].color}
                    stroke={selectedMun === "Pacaraima" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "Pacaraima" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("Pacaraima")}
                    onMouseEnter={() => setHoveredMun("Pacaraima")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 3. Uiramutã */}
                  <polygon 
                    points="600,80 680,20 740,50 780,110 750,150 680,140 600,120"
                    fill={selectedMun === "Uiramutã" ? ZONE_INFO["Uiramutã"].hoverColor : ZONE_INFO["Uiramutã"].color}
                    stroke={selectedMun === "Uiramutã" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "Uiramutã" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("Uiramutã")}
                    onMouseEnter={() => setHoveredMun("Uiramutã")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 4. Normandia */}
                  <polygon 
                    points="680,140 750,150 820,120 810,180 780,210 740,240 700,220 680,170"
                    fill={selectedMun === "Normandia" ? ZONE_INFO["Normandia"].hoverColor : ZONE_INFO["Normandia"].color}
                    stroke={selectedMun === "Normandia" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "Normandia" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("Normandia")}
                    onMouseEnter={() => setHoveredMun("Normandia")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 5. Alto Alegre */}
                  <polygon 
                    points="160,200 240,160 300,160 320,180 380,210 480,225 500,220 580,250 560,300 450,310 350,320 280,310 210,340 180,300 150,250"
                    fill={selectedMun === "Alto Alegre" ? ZONE_INFO["Alto Alegre"].hoverColor : ZONE_INFO["Alto Alegre"].color}
                    stroke={selectedMun === "Alto Alegre" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "Alto Alegre" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("Alto Alegre")}
                    onMouseEnter={() => setHoveredMun("Alto Alegre")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 6. Boa Vista */}
                  <polygon 
                    points="500,200 580,210 590,180 680,170 700,220 690,260 630,270 580,250 500,220"
                    fill={selectedMun === "Boa Vista" ? ZONE_INFO["Boa Vista"].hoverColor : ZONE_INFO["Boa Vista"].color}
                    stroke={selectedMun === "Boa Vista" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "Boa Vista" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("Boa Vista")}
                    onMouseEnter={() => setHoveredMun("Boa Vista")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 7. Bonfim */}
                  <polygon 
                    points="700,220 740,240 780,210 820,120 830,150 810,180 800,260 810,340 750,350 710,290 690,260"
                    fill={selectedMun === "Bonfim" ? ZONE_INFO["Bonfim"].hoverColor : ZONE_INFO["Bonfim"].color}
                    stroke={selectedMun === "Bonfim" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "Bonfim" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("Bonfim")}
                    onMouseEnter={() => setHoveredMun("Bonfim")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 8. Cantá */}
                  <polygon 
                    points="630,270 690,260 710,290 750,350 780,350 780,410 720,440 650,420 620,380 620,320"
                    fill={selectedMun === "Cantá" ? ZONE_INFO["Cantá"].hoverColor : ZONE_INFO["Cantá"].color}
                    stroke={selectedMun === "Cantá" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "Cantá" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("Cantá")}
                    onMouseEnter={() => setHoveredMun("Cantá")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 9. Mucajaí */}
                  <polygon 
                    points="210,340 280,310 350,320 450,310 560,300 580,250 630,270 620,320 620,380 520,380 420,360 320,400 260,390 210,350"
                    fill={selectedMun === "Mucajaí" ? ZONE_INFO["Mucajaí"].hoverColor : ZONE_INFO["Mucajaí"].color}
                    stroke={selectedMun === "Mucajaí" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "Mucajaí" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("Mucajaí")}
                    onMouseEnter={() => setHoveredMun("Mucajaí")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 10. Iracema */}
                  <polygon 
                    points="260,390 320,400 420,360 520,380 550,380 530,420 560,450 500,480 430,490 340,510 295,490 280,420"
                    fill={selectedMun === "Iracema" ? ZONE_INFO["Iracema"].hoverColor : ZONE_INFO["Iracema"].color}
                    stroke={selectedMun === "Iracema" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "Iracema" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("Iracema")}
                    onMouseEnter={() => setHoveredMun("Iracema")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 11. Caracaraí */}
                  <polygon 
                    points="340,510 430,490 500,480 560,450 530,420 520,380 620,380 650,420 720,440 780,410 820,450 820,500 750,510 720,530 650,550 640,630 650,710 600,750 585,830 550,830 550,770 560,700 520,630 500,560"
                    fill={selectedMun === "Caracaraí" ? ZONE_INFO["Caracaraí"].hoverColor : ZONE_INFO["Caracaraí"].color}
                    stroke={selectedMun === "Caracaraí" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "Caracaraí" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("Caracaraí")}
                    onMouseEnter={() => setHoveredMun("Caracaraí")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 12. Rorainópolis */}
                  <polygon 
                    points="520,630 560,700 550,770 550,830 585,830 600,750 650,710 650,630 660,610 710,610 750,670 780,720 760,780 720,830 670,880 610,920 600,900"
                    fill={selectedMun === "Rorainópolis" ? ZONE_INFO["Rorainópolis"].hoverColor : ZONE_INFO["Rorainópolis"].color}
                    stroke={selectedMun === "Rorainópolis" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "Rorainópolis" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("Rorainópolis")}
                    onMouseEnter={() => setHoveredMun("Rorainópolis")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 13. São Luiz */}
                  <polygon 
                    points="750,510 820,500 840,530 840,580 810,610 770,570"
                    fill={selectedMun === "São Luiz" ? ZONE_INFO["São Luiz"].hoverColor : ZONE_INFO["São Luiz"].color}
                    stroke={selectedMun === "São Luiz" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "São Luiz" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("São Luiz")}
                    onMouseEnter={() => setHoveredMun("São Luiz")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 14. São João da Baliza */}
                  <polygon 
                    points="810,610 840,580 870,570 870,610 840,650 820,640"
                    fill={selectedMun === "São João da Baliza" ? ZONE_INFO["São João da Baliza"].hoverColor : ZONE_INFO["São João da Baliza"].color}
                    stroke={selectedMun === "São João da Baliza" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "São João da Baliza" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("São João da Baliza")}
                    onMouseEnter={() => setHoveredMun("São João da Baliza")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />

                  {/* 15. Caroebe */}
                  <polygon 
                    points="870,570 940,520 950,580 950,660 900,660 870,610"
                    fill={selectedMun === "Caroebe" ? ZONE_INFO["Caroebe"].hoverColor : ZONE_INFO["Caroebe"].color}
                    stroke={selectedMun === "Caroebe" ? "#eab308" : "#ffffff"}
                    strokeWidth={selectedMun === "Caroebe" ? "3.5" : "1.5"}
                    className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                    onClick={() => setSelectedMun("Caroebe")}
                    onMouseEnter={() => setHoveredMun("Caroebe")}
                    onMouseLeave={() => setHoveredMun(null)}
                  />
                </g>

                {/* TEXT LABELS OVER MUNICIPALITIES & ZONES */}
                {/* 7ª ZE (Amajari, Pacaraima, Uiramutã) */}
                <text x="400" y="180" textAnchor="middle" fill="#090d16" fontSize="16" fontWeight="900" className="pointer-events-none">7ª Amajari</text>
                <text x="560" y="145" textAnchor="middle" fill="#090d16" fontSize="16" fontWeight="900" className="pointer-events-none">7ª Pacaraima</text>
                <text x="680" y="90" textAnchor="middle" fill="#090d16" fontSize="16" fontWeight="900" className="pointer-events-none">7ª Uiramutã</text>
                
                {/* 3ª ZE */}
                <text x="320" y="270" textAnchor="middle" fill="#090d16" fontSize="16" fontWeight="900" className="pointer-events-none">3ª Alto Alegre</text>
                
                {/* 1ª / 5ª ZE */}
                <text x="610" y="225" textAnchor="middle" fill="#090d16" fontSize="16" fontWeight="900" className="pointer-events-none">1ª/5ª Boa Vista</text>
                <text x="690" y="375" textAnchor="middle" fill="#090d16" fontSize="16" fontWeight="900" className="pointer-events-none">5ª Cantá</text>
                
                {/* 9ª ZE */}
                <text x="760" y="180" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="900" className="pointer-events-none">9ª Normandia</text>
                <text x="760" y="280" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="900" className="pointer-events-none">9ª Bonfim</text>
                
                {/* 6ª ZE */}
                <text x="440" y="335" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="900" className="pointer-events-none">6ª Mucajaí</text>
                <text x="390" y="445" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="900" className="pointer-events-none">6ª Iracema</text>
                
                {/* 2ª ZE */}
                <text x="530" y="525" textAnchor="middle" fill="#090d16" fontSize="16" fontWeight="900" className="pointer-events-none">2ª Caracaraí</text>
                
                {/* 8ª ZE */}
                <text x="620" y="780" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="900" className="pointer-events-none">8ª Rorainópolis</text>
                
                {/* 4ª ZE */}
                <text x="790" y="540" textAnchor="middle" fill="#090d16" fontSize="13" fontWeight="900" className="pointer-events-none">4ª S. Luiz</text>
                <text x="840" y="625" textAnchor="middle" fill="#090d16" fontSize="12" fontWeight="900" className="pointer-events-none">4ª S.J. Baliza</text>
                <text x="910" y="605" textAnchor="middle" fill="#090d16" fontSize="13" fontWeight="900" className="pointer-events-none">4ª Caroebe</text>
              </svg>
            </div>
          </div>

          {/* Map Footer & Zone Legend matching the image */}
          <div className="border-t border-zinc-100 dark:border-zinc-900 pt-6 mt-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3">Legenda das Zonas Eleitorais (TRE-RR)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 border border-zinc-200 dark:border-zinc-800 rounded-xs shrink-0" style={{backgroundColor: '#ffffff'}} />
                <span>1ª ZE - Boa Vista</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs shrink-0" style={{backgroundColor: '#cdbfa5'}} />
                <span>2ª ZE - Caracaraí</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs shrink-0" style={{backgroundColor: '#fffaae'}} />
                <span>3ª ZE - Alto Alegre</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs shrink-0" style={{backgroundColor: '#a0c4df'}} />
                <span>4ª ZE - Eixo do Sul</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs shrink-0" style={{backgroundColor: '#ffd07b'}} />
                <span>5ª ZE - Boa Vista/Cantá</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs shrink-0" style={{backgroundColor: '#a998c7'}} />
                <span>6ª ZE - Mucajaí/Iracema</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs shrink-0" style={{backgroundColor: '#cbe296'}} />
                <span>7ª ZE - Norte/Fronteira</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs shrink-0" style={{backgroundColor: '#f26b80'}} />
                <span>8ª ZE - Rorainópolis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs shrink-0" style={{backgroundColor: '#45b4c1'}} />
                <span>9ª ZE - Leste/Bonfim</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tabulated Operational Analytics for Active Municipality (Cols 7-12) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Selected City Overview Card */}
          <div className="bg-zinc-950 text-white rounded-sm p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <MapIcon className="w-32 h-32" />
            </div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-yellow-500">Município Selecionado</span>
                <h3 className="text-3xl font-black uppercase tracking-tighter mt-1">{selectedMun}</h3>
                <p className="text-[10px] uppercase font-bold text-zinc-400 mt-2 tracking-wider flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" /> {ZONE_INFO[selectedMun]?.zone} • TRE-RR
                </p>
                <p className="text-[11px] text-zinc-300 font-medium italic mt-2.5 max-w-md">{ZONE_INFO[selectedMun]?.description}</p>
              </div>
            </div>

            {/* General Stats row */}
            <div className="grid grid-cols-3 gap-4 border-t border-zinc-800 pt-6 mt-6">
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Eleitores Mapeados</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{munStats[selectedMun]?.voters || 0}</span>
                  <span className="text-[9px] font-bold text-zinc-500">votos</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Apoiadores Certos</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-green-400">{munStats[selectedMun]?.supporters || 0}</span>
                  <span className="text-[9px] font-bold text-zinc-500">({munStats[selectedMun]?.voters ? Math.round((munStats[selectedMun]?.supporters / munStats[selectedMun]?.voters) * 100) : 0}%)</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest font-black">Frentes / Equipes</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-yellow-500">{munStats[selectedMun]?.teams || 0}</span>
                  <span className="text-[9px] font-bold text-zinc-500">equipe</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLLAPSIBLE TABS FOR DETAILED DRILLDOWN */}
          <div className="space-y-4">
            
            {/* TAB 1: ACTIVE TEAMS / EQUIPES LOCAL */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-5 lg:p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-500" /> Frentes e Equipes Ativas ({municipalTeams.length})
              </h3>

              {municipalTeams.length > 0 ? (
                <div className="space-y-4">
                  {municipalTeams.map((team) => (
                    <div key={team.id} className="border border-zinc-100 dark:border-zinc-800 rounded-sm p-4 bg-zinc-50 dark:bg-zinc-950 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-black uppercase text-zinc-950 dark:text-white mb-2 leading-none">{team.name}</h4>
                          <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-xs">
                            Status: {team.status || 'Operando'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-black uppercase text-zinc-400 dark:text-zinc-500">Fatia Direcionada</span>
                          <p className="text-sm font-black text-zinc-950 dark:text-white">R$ {(team.allocated || 0).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>

                      {/* Leader Contact inside the team card */}
                      <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[8px] font-black uppercase text-zinc-400 dark:text-zinc-500">Líder Responsável</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-6 h-6 bg-yellow-500 text-zinc-950 rounded-full flex items-center justify-center text-[10px] font-bold">
                              {team.leader?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{team.leader || 'Líder Não Definido'}</span>
                          </div>
                        </div>

                        {team.leaderPhone && (
                          <div>
                            <span className="text-[8px] font-black uppercase text-zinc-400 dark:text-zinc-500">Contato Direto</span>
                            <div className="flex items-center gap-2 mt-1.5">
                              <a 
                                href={`https://wa.me/55${team.leaderPhone.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-green-600 hover:text-green-700 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5" /> WhatsApp ({team.leaderPhone})
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {team.observations && (
                        <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-3 bg-zinc-100 dark:bg-zinc-900 p-2 rounded-xs border border-zinc-200/50 dark:border-zinc-800">
                          <strong>Obs:</strong> {team.observations}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-sm text-center">
                  <Users className="w-8 h-8 text-zinc-200 dark:text-zinc-800 mx-auto mb-2" />
                  <p className="font-bold text-zinc-400 dark:text-zinc-600 uppercase text-[9px]">Nenhuma equipe baseada neste município.</p>
                </div>
              )}
            </div>

            {/* TAB 2: INFLUENCE NETWORK / QUEM INDICOU QUEM (ORGANIC VIRAL RECRUITMENT) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-5 lg:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white flex items-center gap-2">
                    <Network className="w-4 h-4 text-yellow-500" /> Rede de Influência local (Quem Indicou Quem)
                  </h3>
                  <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mt-1 opacity-60">Visualização de indicações e conexões piramidais</p>
                </div>
              </div>

              {influenceTree.length > 0 ? (
                <div className="overflow-x-auto max-h-[500px] pr-2 custom-scrollbar space-y-4">
                  {influenceTree.map(rootNode => (
                    <div key={rootNode.id || rootNode.name} className="border border-zinc-150 dark:border-zinc-800 rounded-sm p-4 bg-zinc-50 dark:bg-zinc-950/20">
                      <div className="flex items-center gap-2 mb-2 p-1 border-b border-zinc-200/50 dark:border-zinc-800">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500">Influenciador Raiz (Semente de Votos)</span>
                      </div>
                      {renderInfluenceNode(rootNode)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-sm text-center">
                  <Network className="w-8 h-8 text-zinc-300 dark:text-zinc-800 mx-auto mb-2" />
                  <p className="font-bold text-zinc-400 dark:text-zinc-600 uppercase text-[9px]">Nenhum eleitor mapeador na rede local ainda.</p>
                </div>
              )}
            </div>

            {/* TAB 3: CONTACT DIRECTORY FOR SELECTED CITY */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-5 lg:p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-yellow-500" /> Lista Geral de Contatos ({filteredMunicipalVoters.length})
                    </h3>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1 opacity-65">Diretório telefônico e colégio de votação</p>
                  </div>

                  {/* Sentiment Filter */}
                  <div className="flex gap-1">
                    {['all', 'support', 'neutral', 'opposed'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSentimentFilter(filter)}
                        className={`px-2.5 py-1 text-[8px] font-black uppercase rounded-xs transition-all ${
                          sentimentFilter === filter 
                            ? 'bg-zinc-950 text-white dark:bg-zinc-800' 
                            : 'bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {filter === 'all' ? 'Tudo' : filter === 'support' ? 'Apoio' : filter === 'neutral' ? 'Neutro' : 'Oposição'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Search within municipality */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar nome, fone, colégio em municipal..."
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm p-3 pl-10 font-bold text-[10px] text-zinc-900 dark:text-white outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-400"
                  />
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                </div>

                {/* Voter Cards Container */}
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {filteredMunicipalVoters.length > 0 ? (
                    filteredMunicipalVoters.map((voter) => (
                      <div 
                        key={voter.id}
                        className="bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-100 dark:border-zinc-900 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black uppercase text-zinc-900 dark:text-white leading-none">{voter.name}</span>
                            {voter.sentiment === 'support' && <span className="bg-green-500 text-zinc-950 text-[7px] font-black uppercase px-1.5 rounded-sm">Apoiador</span>}
                            {voter.sentiment === 'neutral' && <span className="bg-yellow-500 text-zinc-950 text-[7px] font-black uppercase px-1.5 rounded-sm">Neutro</span>}
                            {voter.sentiment === 'opposed' && <span className="bg-red-500 text-zinc-950 text-[7px] font-black uppercase px-1.5 rounded-sm">Oposição</span>}
                          </div>
                          
                          <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                            {voter.localVotacao && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-yellow-500" /> Local: {voter.localVotacao}
                              </span>
                            )}
                            {voter.referredBy && (
                              <span className="text-zinc-400">
                                Indicado por: <span className="text-yellow-600 font-extrabold">{voter.referredBy}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* WhatsApp CTA */}
                        {voter.phone && (
                          <div className="shrink-0">
                            <a 
                              href={`https://wa.me/55${voter.phone.replace(/\D/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 bg-green-500 text-zinc-950 px-3.5 py-2 rounded-sm font-black text-[9px] uppercase hover:bg-green-600 hover:text-white transition-all shadow-md shadow-green-500/10 active:scale-95"
                            >
                              <Phone className="w-3.5 h-3.5" /> Enviar Mensagem
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-sm text-center">
                      <Search className="w-8 h-8 text-zinc-300 dark:text-zinc-800 mx-auto mb-2" />
                      <p className="font-bold text-zinc-450 dark:text-zinc-650 uppercase text-[9px]">Nenhum contato encontrado na busca.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
