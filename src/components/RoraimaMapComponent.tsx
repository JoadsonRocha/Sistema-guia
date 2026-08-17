import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getAllTreLocations } from '../lib/treDataService';
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
  Info,
  AlertTriangle
} from 'lucide-react';

interface RoraimaMapComponentProps {
  teams: any[];
  allVoters: any[];
  theme: 'light' | 'dark';
  coordinatorId?: string;
  demands?: any[];
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

const ZONES_GROUPS = [
  {
    name: "1ª e 5ª Zonas Eleitorais",
    region: "Capital & Cantá (Centro-Leste)",
    municipalities: ["Boa Vista", "Cantá"],
    bgColor: "bg-amber-500/5",
    borderColor: "border-amber-500/20",
    badgeColor: "bg-amber-500 text-zinc-950"
  },
  {
    name: "2ª Zona Eleitoral",
    region: "Caracaraí (Centro-Sul)",
    municipalities: ["Caracaraí"],
    bgColor: "bg-orange-500/5",
    borderColor: "border-orange-500/20",
    badgeColor: "bg-orange-600 text-white"
  },
  {
    name: "3ª Zona Eleitoral",
    region: "Alto Alegre",
    municipalities: ["Alto Alegre"],
    bgColor: "bg-emerald-500/5",
    borderColor: "border-emerald-500/20",
    badgeColor: "bg-emerald-600 text-white"
  },
  {
    name: "4ª Zona Eleitoral",
    region: "Eixo BR-210 Sul (São Luiz, Baliza & Caroebe)",
    municipalities: ["São Luiz", "São João da Baliza", "Caroebe"],
    bgColor: "bg-blue-500/5",
    borderColor: "border-blue-500/20",
    badgeColor: "bg-blue-600 text-white"
  },
  {
    name: "6ª Zona Eleitoral",
    region: "Mucajaí & Iracema (Centro)",
    municipalities: ["Mucajaí", "Iracema"],
    bgColor: "bg-purple-500/5",
    borderColor: "border-purple-500/20",
    badgeColor: "bg-purple-600 text-white"
  },
  {
    name: "7ª Zona Eleitoral",
    region: "Norte / Fronteira (Amajari, Pacaraima & Uiramutã)",
    municipalities: ["Amajari", "Pacaraima", "Uiramutã"],
    bgColor: "bg-lime-500/5",
    borderColor: "border-lime-500/20",
    badgeColor: "bg-lime-600 text-zinc-950"
  },
  {
    name: "8ª Zona Eleitoral",
    region: "Rorainópolis (Sul)",
    municipalities: ["Rorainópolis"],
    bgColor: "bg-rose-500/5",
    borderColor: "border-rose-500/20",
    badgeColor: "bg-rose-600 text-white"
  },
  {
    name: "9ª Zona Eleitoral",
    region: "Leste / Fronteira (Bonfim & Normandia)",
    municipalities: ["Bonfim", "Normandia"],
    bgColor: "bg-cyan-500/5",
    borderColor: "border-cyan-500/20",
    badgeColor: "bg-cyan-600 text-white"
  }
];

// Map of municipality to their respective Electoral Zone info
const ZONE_INFO: Record<string, { zone: string; color: string; hoverColor: string; description: string }> = {
  "Amajari": { 
    zone: "7ª Zona", 
    color: "#add587", 
    hoverColor: "#93bf6c",
    description: "Sede de Operações da 7ª ZE (Pacaraima, Amajari e Uiramutã)." 
  },
  "Pacaraima": { 
    zone: "7ª Zona", 
    color: "#add587", 
    hoverColor: "#92be6c",
    description: "Operações de Fronteira. Vinculado à 7ª ZE." 
  },
  "Uiramutã": { 
    zone: "7ª Zona", 
    color: "#add587", 
    hoverColor: "#91bd6b",
    description: "Extremo Norte. Comunidades Indígenas vinculadas à 7ª ZE." 
  },
  "Alto Alegre": { 
    zone: "3ª Zona", 
    color: "#fdf7ab", 
    hoverColor: "#e6de8c",
    description: "Sede de Operações da 3ª ZE. Região de forte atuação agrícola." 
  },
  "Boa Vista": { 
    zone: "1ª/5ª Zona", 
    color: "#fff5da", 
    hoverColor: "#ffd699",
    description: "Capital do Estado. Maior colégio eleitoral, dividido entre 1ª e 5ª ZE." 
  },
  "Bonfim": { 
    zone: "9ª Zona", 
    color: "#54b9bc", 
    hoverColor: "#3e9da0",
    description: "Sede de Operações da 9ª ZE (Bonfim e Normandia). Fronteira Guiana." 
  },
  "Normandia": { 
    zone: "9ª Zona", 
    color: "#54b9bc", 
    hoverColor: "#3c9ba0",
    description: "Vinculado à 9ª ZE. Forte engajamento de bases rurais." 
  },
  "Cantá": { 
    zone: "5ª Zona", 
    color: "#febd62", 
    hoverColor: "#e6aa52",
    description: "Vinculado à 5ª ZE (Boa Vista e Cantá). Cinturão verde e vicinais." 
  },
  "Mucajaí": { 
    zone: "6ª Zona", 
    color: "#9b8cb8", 
    hoverColor: "#82729e",
    description: "Sede de Operações da 6ª ZE (Mucajaí e Iracema). Hub logístico." 
  },
  "Iracema": { 
    zone: "6ª Zona", 
    color: "#9b8cb8", 
    hoverColor: "#81719c",
    description: "Vinculada à 6ª ZE. Grande potencial de expansão regional." 
  },
  "Caracaraí": { 
    zone: "2ª Zona", 
    color: "#cdb699", 
    hoverColor: "#b29c80",
    description: "Sede da 2ª ZE. Hub fluvial e maior em extensão territorial." 
  },
  "Rorainópolis": { 
    zone: "8ª Zona", 
    color: "#ee637d", 
    hoverColor: "#d24d66",
    description: "Sede de Operações da 8ª ZE. Segundo maior colégio eleitoral de RR." 
  },
  "São Luiz": { 
    zone: "4ª Zona", 
    color: "#9cbdde", 
    hoverColor: "#81a2c2",
    description: "Sede de Operações da 4ª ZE (São Luiz, Baliza e Caroebe)." 
  },
  "São João da Baliza": { 
    zone: "4ª Zona", 
    color: "#9cbdde", 
    hoverColor: "#80a1c1",
    description: "Eixo do Sul. Integrado à 4ª ZE de Roraima." 
  },
  "Caroebe": { 
    zone: "4ª Zona", 
    color: "#9cbdde", 
    hoverColor: "#7fa0bf",
    description: "Extremo Southeast de Roraima, forte bacia produtora da 4ª ZE." 
  }
};

export function resolveTeamMunicipality(location?: string | null, availableMunicipalities: string[] = []): string {
  if (!location) return availableMunicipalities[0] || "Sede";
  const locLower = location.trim().toLowerCase();

  for (const mun of availableMunicipalities) {
    if (locLower === mun.toLowerCase() || locLower.includes(mun.toLowerCase()) || mun.toLowerCase().includes(locLower)) {
      return mun;
    }
  }

  return location.trim() || availableMunicipalities[0] || "Sede";
}

export default function RoraimaMapComponent({ teams = [], allVoters = [], demands = [], theme, coordinatorId }: RoraimaMapComponentProps) {
  // Fetch official TRE locations for this specific coordinator
  const treLocations = useMemo(() => getAllTreLocations(coordinatorId), [coordinatorId]);

  // Extract unique municipalities dynamically from TRE locations, teams, and voters for THIS campaign
  const dynamicMunicipalities = useMemo(() => {
    const munSet = new Set<string>();

    treLocations.forEach(loc => {
      if (loc.municipio && loc.municipio.trim()) {
        munSet.add(loc.municipio.trim());
      }
    });

    (teams || []).forEach(t => {
      if (t.location && t.location.trim()) {
        munSet.add(t.location.trim());
      }
    });

    (allVoters || []).forEach(v => {
      const m = v.municipality || v.location;
      if (m && m.trim()) {
        munSet.add(m.trim());
      }
    });

    return Array.from(munSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [treLocations, teams, allVoters]);

  // Map each municipality to its corresponding zone from uploaded TRE data
  const municipalityToZoneMap = useMemo(() => {
    const map = new Map<string, string>();
    treLocations.forEach(loc => {
      if (loc.municipio && loc.zona) {
        const mKey = loc.municipio.trim().toLowerCase();
        if (!map.has(mKey)) {
          map.set(mKey, loc.zona);
        }
      }
    });
    return map;
  }, [treLocations]);

  const getZoneLabel = useCallback((mun: string) => {
    const found = municipalityToZoneMap.get(mun.toLowerCase());
    if (found) return found;
    return ZONE_INFO[mun]?.zone || "Zona Eleitoral";
  }, [municipalityToZoneMap]);

  const getZoneColor = useCallback((key: string) => {
    if (ZONE_INFO[key]?.color) return ZONE_INFO[key].color;
    const colors = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#e11d48", "#0284c7", "#0d9488", "#ca8a04"];
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }, []);

  const dynamicZonesGroups = useMemo(() => {
    const groupsMap = new Map<string, string[]>();

    dynamicMunicipalities.forEach(mun => {
      const zLabel = getZoneLabel(mun);
      if (!groupsMap.has(zLabel)) {
        groupsMap.set(zLabel, []);
      }
      groupsMap.get(zLabel)!.push(mun);
    });

    const result: { name: string; region: string; municipalities: string[] }[] = [];
    groupsMap.forEach((muns, zName) => {
      result.push({
        name: zName,
        region: `${muns.length} ${muns.length === 1 ? 'Município' : 'Municípios'}`,
        municipalities: muns.sort((a, b) => a.localeCompare(b, 'pt-BR'))
      });
    });

    return result.sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, ''), 10) || 999;
      const numB = parseInt(b.name.replace(/\D/g, ''), 10) || 999;
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [dynamicMunicipalities, getZoneLabel]);

  // If no TRE file has been uploaded and no teams/voters have location data for this coordinator
  if (dynamicMunicipalities.length === 0) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-8 md:p-12 text-center space-y-4 shadow-sm my-4">
        <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <MapIcon className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-3">
          <h2 className="text-base md:text-lg font-black uppercase text-[var(--text-primary)] tracking-tight">
            Nenhum Dado Regional ou Planilha TRE Carregada
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Sua campanha ainda não possui dados territoriais ou planilha oficial do TRE cadastrada.
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
            Para visualizar a divisão territorial, zonas eleitorais, seções e municípios do seu estado no <strong>Mapa Regional</strong>, acesse a guia <strong>'Análise Eleitoral'</strong> e envie a planilha oficial do TRE da sua região, ou cadastre equipes e eleitores com seus respectivos municípios.
          </p>
        </div>
      </div>
    );
  }

  const [selectedMun, setSelectedMun] = useState<string>(() => dynamicMunicipalities[0] || "");

  useEffect(() => {
    if (dynamicMunicipalities.length > 0 && !dynamicMunicipalities.includes(selectedMun)) {
      setSelectedMun(dynamicMunicipalities[0]);
    }
  }, [dynamicMunicipalities, selectedMun]);
  const [hoveredMun, setHoveredMun] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [expandAllInfluence, setExpandAllInfluence] = useState<boolean>(false);
  const [sidebarMode, setSidebarMode] = useState<'lista' | 'mapa'>('lista');
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>("all");
  const [munSubTab, setMunSubTab] = useState<'frentes' | 'eleitores'>('frentes');
  const [voterViewMode, setVoterViewMode] = useState<'lista' | 'rede'>('lista');

  // Dynamic voter mapping function with memoized lookup cache
  const mappedVoters = useMemo(() => {
    // Cache map of team name/leader to municipality location for fast lookup
    const teamNameToLocation = new Map<string, string>();
    teams.forEach(t => {
      const resolved = resolveTeamMunicipality(t.location, dynamicMunicipalities);
      if (t.name) {
        teamNameToLocation.set(t.name.trim().toLowerCase(), resolved);
      }
      if (t.leader) {
        teamNameToLocation.set(t.leader.trim().toLowerCase(), resolved);
      }
    });

    return allVoters.map(voter => {
      let location: string | null = null;

      // 1. Check if the voter's address has an explicit mention of any municipality
      if (voter.address) {
        const addrLower = voter.address.toLowerCase();
        for (const mun of dynamicMunicipalities) {
          if (addrLower.includes(mun.toLowerCase())) {
            location = mun;
            break;
          }
        }
      }

      // 2. Check if voter's localVotacao (polling place) mentions any municipality
      if (!location && voter.localVotacao) {
        const lvLower = voter.localVotacao.toLowerCase();
        for (const mun of dynamicMunicipalities) {
          if (lvLower.includes(mun.toLowerCase())) {
            location = mun;
            break;
          }
        }
      }

      // 3. Match using voter's team or teamName which aligns with a registered team
      if (!location) {
        if (voter.team) {
          const tName = voter.team.trim().toLowerCase();
          if (teamNameToLocation.has(tName)) {
            location = teamNameToLocation.get(tName)!;
          }
        }
        if (!location && voter.teamName) {
          const tName = voter.teamName.trim().toLowerCase();
          if (teamNameToLocation.has(tName)) {
            location = teamNameToLocation.get(tName)!;
          }
        }
      }

      // 4. Match using leaderName or referredBy
      if (!location) {
        if (voter.leaderName) {
          const lName = voter.leaderName.trim().toLowerCase();
          if (teamNameToLocation.has(lName)) {
            location = teamNameToLocation.get(lName)!;
          }
        }
        if (!location && voter.referredBy) {
          const rName = voter.referredBy.trim().toLowerCase();
          if (teamNameToLocation.has(rName)) {
            location = teamNameToLocation.get(rName)!;
          }
        }
      }

      // 5. Match using the articulator's details
      if (!location && voter.articulatorId) {
        const articulator = allVoters.find(av => av.id === voter.articulatorId);
        if (articulator) {
          if (articulator.team && teamNameToLocation.has(articulator.team.trim().toLowerCase())) {
            location = teamNameToLocation.get(articulator.team.trim().toLowerCase())!;
          } else if (articulator.teamName && teamNameToLocation.has(articulator.teamName.trim().toLowerCase())) {
            location = teamNameToLocation.get(articulator.teamName.trim().toLowerCase())!;
          } else if (articulator.address) {
            const artAddr = articulator.address.toLowerCase();
            for (const mun of dynamicMunicipalities) {
              if (artAddr.includes(mun.toLowerCase())) {
                location = mun;
                break;
              }
            }
          }
        }
      }

      // 6. Electoral Zone matching
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

      // 7. Last resort: check if any team corresponds to the voter's coordinator/leader/email
      if (!location) {
        const associatedTeam = teams.find(t => 
          t.name?.toLowerCase() === voter.team?.toLowerCase() || 
          t.leader?.toLowerCase() === voter.referredBy?.toLowerCase() || 
          t.leaderEmail?.toLowerCase() === voter.registeredBy?.toLowerCase()
        );
        if (associatedTeam && associatedTeam.location) {
          location = associatedTeam.location;
        }
      }

      // 8. Fallback
      if (!location) {
        location = dynamicMunicipalities[0] || "Sede";
      }

      return {
        ...voter,
        resolvedMunicipality: location
      };
    });
  }, [allVoters, teams, dynamicMunicipalities]);

  // Aggregate stats per municipality for overall dashboard
  const munStats = useMemo(() => {
    const stats: Record<string, { voters: number; teams: number; leaders: string[]; supporters: number; demands: number }> = {};
    dynamicMunicipalities.forEach(m => {
      stats[m] = { voters: 0, teams: 0, leaders: [], supporters: 0, demands: 0 };
    });

    mappedVoters.forEach(v => {
      const m = v.resolvedMunicipality;
      if (stats[m]) {
        stats[m].voters++;
        if (v.sentiment === 'support') stats[m].supporters++;
      }
    });

    teams.forEach(t => {
      const m = resolveTeamMunicipality(t.location, dynamicMunicipalities);
      if (stats[m]) {
        stats[m].teams++;
        if (t.leader && !stats[m].leaders.includes(t.leader)) {
          stats[m].leaders.push(t.leader);
        }
      }
    });

    (demands || []).forEach(d => {
      const m = resolveTeamMunicipality(d.team || d.location, dynamicMunicipalities);
      if (stats[m]) {
        stats[m].demands++;
      }
    });

    return stats;
  }, [dynamicMunicipalities, mappedVoters, teams, demands]);

  // Filter current active municipality data
  const municipalTeams = useMemo(() => {
    return teams.filter(t => resolveTeamMunicipality(t.location, dynamicMunicipalities).toLowerCase() === selectedMun.toLowerCase());
  }, [teams, selectedMun, dynamicMunicipalities]);

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
    const isExpanded = expandedNodes[node.name] !== undefined 
      ? expandedNodes[node.name] 
      : (expandAllInfluence || depth === 0);

    const sentimentColors = {
      support: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-900 dark:text-green-400',
      neutral: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-500',
      opposed: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
    };

    return (
      <div key={node.id || node.name} className="relative pl-4 md:pl-5 border-l border-[var(--border-color)] ml-2 md:ml-3 py-1">
        {/* Connection point dot */}
        <div className="absolute top-4 left-0 w-2.5 md:w-3.5 h-px bg-zinc-200 dark:bg-zinc-800" />
        
        <div className={`p-2.5 md:p-3 rounded-sm border ${sentimentColors[node.sentiment as 'support'|'neutral'|'opposed'] || 'bg-zinc-50 border-zinc-200'} transition-all max-w-xl shadow-sm hover:shadow-md`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-tight text-xs">
                {node.name}
              </span>
              
              {node.isArticulator && (
                <span className="bg-blue-600 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm">
                  Articulador
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[8px] font-mono opacity-80 shrink-0">
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

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9px] font-bold text-[var(--text-secondary)]">
            {node.localVotacao && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5 text-blue-600" /> Colégio: {node.localVotacao}
              </span>
            )}
            {node.referredBy && (
              <span className="text-zinc-400 dark:text-zinc-500">
                Influência: <span className="text-blue-600 dark:text-blue-600 font-extrabold">{node.referredBy}</span>
              </span>
            )}
          </div>

          {hasChildren && (
            <button 
              onClick={() => toggleNode(node.name)}
              className="mt-2 flex items-center gap-1.5 text-[8px] font-black uppercase text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
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

  const filteredZonesGroups = useMemo(() => {
    return dynamicZonesGroups.map(group => {
      if (selectedZoneFilter !== "all" && group.name !== selectedZoneFilter) {
        return null;
      }
      const filteredMuns = group.municipalities.filter(mun => 
        !sidebarSearch ||
        mun.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
        getZoneLabel(mun).toLowerCase().includes(sidebarSearch.toLowerCase())
      );
      if (filteredMuns.length === 0) return null;
      return {
        ...group,
        municipalities: filteredMuns
      };
    }).filter(Boolean) as typeof dynamicZonesGroups;
  }, [dynamicZonesGroups, sidebarSearch, selectedZoneFilter]);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border-color)] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-sm flex items-center justify-center shadow-lg shadow-blue-600/10">
            <MapIcon className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase text-zinc-950 dark:text-white tracking-tighter leading-none">Mapa Regional Eleitoral</h2>
            <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest mt-1.5">Visão Territorial, Divisão por Zonas do TRE e Gestão de Lideranças Locais</p>
          </div>
        </div>

        {/* Rapid Dropdown Selector for ease of access */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Ir para:</span>
          <select 
            value={selectedMun} 
            onChange={(e) => setSelectedMun(e.target.value)}
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-zinc-950 dark:text-white px-3 py-2 rounded-sm font-black text-[10px] uppercase outline-none focus:border-blue-600 shadow-sm"
          >
            {dynamicMunicipalities.map(mun => (
              <option key={mun} value={mun}>{mun} ({getZoneLabel(mun)})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid View: Sidebar on Left (4 cols), Command Center on Right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Municipalities & Zones Sidebar (Cols 1-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm p-4 shadow-sm">
            
            {/* Sidebar Title */}
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-3 mb-3">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-[var(--text-primary)]">Divisão Territorial da Campanha</h3>
                <p className="text-[8px] text-[var(--text-secondary)] font-bold uppercase tracking-wide leading-none mt-1">Selecione o Município</p>
              </div>
            </div>

            {/* Content area - Lista View */}
            <div className="space-y-3">
                {/* Search & Filter controls inside sidebar */}
                <div className="space-y-2">
                  <select
                    value={selectedZoneFilter}
                    onChange={(e) => setSelectedZoneFilter(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm py-1.5 px-2 font-bold text-[9px] text-[var(--text-primary)] outline-none focus:border-blue-600"
                  >
                    <option value="all">Todas as Zonas Eleitorais</option>
                    {dynamicZonesGroups.map(g => (
                      <option key={g.name} value={g.name}>{g.name}</option>
                    ))}
                  </select>

                  <div className="relative">
                    <input
                      type="text"
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                      placeholder="Filtrar município por nome..."
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm py-1.5 pl-7 pr-2 font-bold text-[9px] text-[var(--text-primary)] outline-none focus:border-blue-600 placeholder:text-zinc-400"
                    />
                    <Search className="absolute left-2 top-2 w-3 h-3 text-zinc-400" />
                  </div>
                </div>

                {/* Grouped Zones List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredZonesGroups.map((group) => (
                    <div 
                      key={group.name} 
                      className="space-y-1.5"
                    >
                      <div className="flex justify-between items-center px-1 pt-1 border-b border-[var(--border-color)]/80 pb-1">
                        <span className="text-[9px] font-bold uppercase text-[var(--text-secondary)] tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          {group.name}
                        </span>
                        <span className="text-[8px] font-medium text-zinc-400 dark:text-zinc-500 truncate max-w-[120px]">
                          {group.region}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {group.municipalities.map((mun) => {
                          const isSelected = selectedMun === mun;
                          const stats = munStats[mun] || { voters: 0, teams: 0, demands: 0 };
                          return (
                            <button
                              type="button"
                              key={mun}
                              onClick={() => setSelectedMun(mun)}
                              className={`w-full text-left p-2 rounded border transition-all flex items-center justify-between outline-none ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                                  : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-zinc-300 dark:hover:border-zinc-700 text-[var(--text-primary)]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full shrink-0" 
                                  style={{ backgroundColor: getZoneColor(mun) }}
                                />
                                <div>
                                  <h5 className="text-xs font-bold uppercase leading-none">
                                    {mun}
                                  </h5>
                                  <p className="text-[9px] text-[var(--text-secondary)] font-medium uppercase mt-0.5 leading-none">
                                    {getZoneLabel(mun)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-3 mt-1.5 text-xs text-zinc-500 font-bold tracking-tight">
                                <span>👥 {stats.voters}</span>
                                <span>🚩 {stats.teams}</span>
                                {stats.demands > 0 && (
                                  <span className="text-red-500 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> {stats.demands}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {filteredZonesGroups.length === 0 && (
                    <div className="text-center p-6 text-zinc-400 text-[10px] uppercase font-bold">
                      Nenhum município localizado com os filtros selecionados.
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>

        {/* Right Side: Command Center & Detailed Operational Analytics for Selected Municipality (Cols 5-12) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Selected City Overview Command Card */}
          <div className="bg-[var(--bg-secondary)] text-zinc-900 dark:text-zinc-100 rounded-lg p-5 md:p-6 relative overflow-hidden shadow-xs border border-[var(--border-color)] transition-all">
            {/* Ambient subtle light overlay */}
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-zinc-400">
              <MapIcon className="w-24 h-24" />
            </div>

            <div className="relative z-10">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">QG Municipal • Comando Eleitoral</span>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[var(--text-primary)] mt-1">{selectedMun}</h3>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase font-bold text-[var(--text-secondary)] mt-2">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                  {ZONE_INFO[selectedMun]?.zone}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span>TRE-RR</span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-zinc-600 dark:text-zinc-300 font-normal italic">{ZONE_INFO[selectedMun]?.description}</span>
              </div>
            </div>

            {/* General Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[var(--border-color)] pt-5 mt-5">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Eleitores Mapeados</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-2xl font-black text-[var(--text-primary)]">{munStats[selectedMun]?.voters || 0}</span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Fichas</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Apoiadores Certos</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">{munStats[selectedMun]?.supporters || 0}</span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">
                    ({munStats[selectedMun]?.voters ? Math.round((munStats[selectedMun]?.supporters / munStats[selectedMun]?.voters) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Frentes / Equipes</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400">{munStats[selectedMun]?.teams || 0}</span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Ativas</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Indicações Orgânicas</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-2xl font-black text-teal-600 dark:text-teal-400">
                    {municipalVoters.filter(v => v.referredBy && v.referredBy.trim() !== "").length}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Rede</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Navigation Sub-Tabs of Selected City */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-sm shadow-sm overflow-hidden">
            <div className="flex border-b border-[var(--border-color)] bg-zinc-50 dark:bg-zinc-950/40">
              <button
                type="button"
                onClick={() => setMunSubTab('frentes')}
                className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider transition-all border-b-2 outline-none flex items-center justify-center gap-2 ${
                  munSubTab === 'frentes'
                    ? 'border-blue-600 text-zinc-950 dark:text-white bg-[var(--bg-secondary)]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Frentes e Equipes ({municipalTeams.length})
              </button>
              
              <button
                type="button"
                onClick={() => setMunSubTab('eleitores')}
                className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider transition-all border-b-2 outline-none flex items-center justify-center gap-2 ${
                  munSubTab === 'eleitores'
                    ? 'border-blue-600 text-zinc-950 dark:text-white bg-[var(--bg-secondary)]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                Cadastro & Rede ({municipalVoters.length})
              </button>
            </div>

            <div className="p-4 md:p-5">
              {/* Tab Content: ACTIVE TEAMS / FRENTES */}
              {munSubTab === 'frentes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-850 pb-2 mb-2">
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Diretório de Equipes no Terreno</span>
                    <span className="bg-blue-600 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm">
                      {municipalTeams.length} {municipalTeams.length === 1 ? 'Liderança' : 'Lideranças'}
                    </span>
                  </div>

                  {municipalTeams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {municipalTeams.map((team) => (
                        <div 
                          key={team.id} 
                          className="border border-zinc-150 dark:border-zinc-800 rounded-sm p-4 bg-zinc-50 dark:bg-zinc-950/30 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-xs font-black uppercase text-[var(--text-primary)] leading-tight">
                                {team.name}
                              </h4>
                              <span className="bg-zinc-200 dark:bg-zinc-800 text-[var(--text-secondary)] text-[7px] font-black uppercase px-1.5 py-0.5 rounded-xs leading-none shrink-0">
                                {team.status || 'Operando'}
                              </span>
                            </div>

                            {/* Leader Contact Details */}
                            <div className="mt-3 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                                  {team.leader?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[11px] font-bold text-[var(--text-primary)]">
                                  {team.leader || 'Líder Não Definido'}
                                </span>
                              </div>
                            </div>

                            {team.observations && (
                              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-2.5 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-xs border border-zinc-200/50 dark:border-zinc-800/50">
                                <strong>Obs:</strong> {team.observations}
                              </p>
                            )}
                          </div>

                          {/* Action CTA */}
                          {team.leaderPhone && (
                            <div className="mt-4 pt-3 border-t border-zinc-150 dark:border-zinc-800 flex justify-end">
                              <a 
                                href={`https://wa.me/55${team.leaderPhone.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-green-600 hover:text-green-700 transition-colors leading-none"
                              >
                                <Phone className="w-3 h-3" /> Falar com Líder ({team.leaderPhone})
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-[var(--border-color)] rounded-sm text-center">
                      <Users className="w-6 h-6 text-zinc-300 dark:text-zinc-850 mx-auto mb-2" />
                      <p className="font-bold text-zinc-400 dark:text-zinc-600 uppercase text-[9px]">Nenhuma equipe baseada neste município ainda.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: CADASTRO & REDE */}
              {munSubTab === 'eleitores' && (
                <div className="space-y-4">
                  {/* View Mode Toggle inside Eleitores */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--border-color)] pb-3">
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Diretório de Contatos e Indicações</span>
                    
                    <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-xs w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setVoterViewMode('lista')}
                        className={`flex-1 sm:flex-none px-3 py-1.5 text-[8px] font-black uppercase rounded-xs transition-all ${
                          voterViewMode === 'lista'
                            ? 'bg-zinc-900 text-white dark:bg-zinc-800'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        Lista Geral
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoterViewMode('rede')}
                        className={`flex-1 sm:flex-none px-3 py-1.5 text-[8px] font-black uppercase rounded-xs transition-all ${
                          voterViewMode === 'rede'
                            ? 'bg-zinc-900 text-white dark:bg-zinc-800'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        Rede de Influência (Piramidal)
                      </button>
                    </div>
                  </div>

                  {/* List View */}
                  {voterViewMode === 'lista' && (
                    <div className="space-y-3">
                      {/* Search & Sentiment Filters Container */}
                      <div className="flex flex-col md:flex-row gap-2">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar nome, telefone ou colégio eleitoral..."
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-[var(--border-color)] rounded-sm py-2 pl-8 pr-3 font-bold text-[9px] text-[var(--text-primary)] outline-none focus:border-blue-600 placeholder:text-zinc-400"
                          />
                          <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-zinc-400" />
                        </div>

                        {/* Sentiment filter */}
                        <div className="flex gap-1 overflow-x-auto shrink-0 pb-1 md:pb-0">
                          {['all', 'support', 'neutral', 'opposed'].map((filter) => (
                            <button
                              key={filter}
                              onClick={() => setSentimentFilter(filter)}
                              className={`px-2.5 py-1.5 text-[8px] font-black uppercase rounded-xs transition-all whitespace-nowrap ${
                                sentimentFilter === filter 
                                  ? 'bg-zinc-950 text-white dark:bg-zinc-800' 
                                  : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-[var(--text-secondary)]'
                              }`}
                            >
                              {filter === 'all' ? 'Tudo' : filter === 'support' ? 'Apoiador' : filter === 'neutral' ? 'Neutro' : 'Oposição'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Voter List Cards */}
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {filteredMunicipalVoters.length > 0 ? (
                          filteredMunicipalVoters.map((voter) => (
                            <div 
                              key={voter.id}
                              className="bg-zinc-50 dark:bg-zinc-950/20 p-3 border border-zinc-150 dark:border-zinc-850 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-black uppercase text-[var(--text-primary)]">{voter.name}</span>
                                  {voter.sentiment === 'support' && <span className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm">Apoio</span>}
                                  {voter.sentiment === 'neutral' && <span className="bg-blue-600/10 text-blue-700 dark:text-blue-500 border border-blue-600/20 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm">Neutro</span>}
                                  {voter.sentiment === 'opposed' && <span className="bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm">Oposição</span>}
                                </div>
                                
                                <div className="text-[9px] font-bold text-[var(--text-secondary)] flex flex-wrap gap-x-3 gap-y-0.5">
                                  {voter.localVotacao && (
                                    <span className="flex items-center gap-0.5">
                                      <MapPin className="w-2.5 h-2.5 text-blue-600" /> Local: {voter.localVotacao}
                                    </span>
                                  )}
                                  {voter.referredBy && (
                                    <span className="text-zinc-450">
                                      Indicação: <span className="text-blue-600 font-extrabold">{voter.referredBy}</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* WhatsApp Contact Button */}
                              {voter.phone && (
                                <div className="shrink-0 flex items-center">
                                  <a 
                                    href={`https://wa.me/55${voter.phone.replace(/\D/g, '')}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-1 bg-green-500 text-zinc-950 px-3 py-1.5 rounded-sm font-black text-[8px] uppercase hover:bg-green-600 hover:text-white transition-all shadow-xs"
                                  >
                                    <Phone className="w-2.5 h-2.5" /> WhatsApp ({voter.phone})
                                  </a>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-8 border border-dashed border-[var(--border-color)] rounded-sm text-center">
                            <Search className="w-6 h-6 text-zinc-300 dark:text-zinc-800 mx-auto mb-2" />
                            <p className="font-bold text-zinc-400 dark:text-zinc-600 uppercase text-[9px]">Nenhum eleitor mapeado atende ao filtro.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pyramidal Network View */}
                  {voterViewMode === 'rede' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-sm border border-zinc-100 dark:border-zinc-900">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Mapeamento de Indicações Orgânicas</span>
                        {influenceTree.length > 0 && (
                          <button
                            onClick={() => setExpandAllInfluence(!expandAllInfluence)}
                            className="px-2 py-1 text-[8px] font-black uppercase rounded-xs transition-all bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                          >
                            {expandAllInfluence ? "Recolher Tudo" : "Expandir Tudo"}
                          </button>
                        )}
                      </div>

                      {influenceTree.length > 0 ? (
                        <div className="max-h-[400px] overflow-y-auto pr-1 space-y-3">
                          {influenceTree.map(rootNode => (
                            <div key={rootNode.id || rootNode.name} className="border border-zinc-150 dark:border-zinc-800 rounded-sm p-3 bg-zinc-50 dark:bg-zinc-950/20">
                              <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-zinc-200/50 dark:border-zinc-800">
                                <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="text-[8px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Influenciador Raiz (Semente de Votos)</span>
                              </div>
                              {renderInfluenceNode(rootNode)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 border border-dashed border-[var(--border-color)] rounded-sm text-center">
                          <Network className="w-6 h-6 text-zinc-300 dark:text-zinc-800 mx-auto mb-2" />
                          <p className="font-bold text-zinc-400 dark:text-zinc-600 uppercase text-[9px]">Nenhuma árvore de conexões ativa neste município ainda.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
