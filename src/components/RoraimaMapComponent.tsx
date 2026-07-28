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
  Info
} from 'lucide-react';

interface RoraimaMapComponentProps {
  teams: any[];
  allVoters: any[];
  theme: 'light' | 'dark';
  coordinatorId?: string;
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

export default function RoraimaMapComponent({ teams = [], allVoters = [], theme, coordinatorId }: RoraimaMapComponentProps) {
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
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm p-8 md:p-12 text-center space-y-4 shadow-sm my-4">
        <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <MapIcon className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-3">
          <h2 className="text-base md:text-lg font-black uppercase text-zinc-900 dark:text-white tracking-tight">
            Nenhum Dado Regional ou Planilha TRE Carregada
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
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
    const stats: Record<string, { voters: number; teams: number; leaders: string[]; supporters: number }> = {};
    dynamicMunicipalities.forEach(m => {
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
      const m = resolveTeamMunicipality(t.location, dynamicMunicipalities);
      if (stats[m]) {
        stats[m].teams++;
        if (t.leader && !stats[m].leaders.includes(t.leader)) {
          stats[m].leaders.push(t.leader);
        }
      }
    });

    return stats;
  }, [dynamicMunicipalities, mappedVoters, teams]);

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
      <div key={node.id || node.name} className="relative pl-4 md:pl-5 border-l border-zinc-200 dark:border-zinc-800 ml-2 md:ml-3 py-1">
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

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9px] font-bold text-zinc-500 dark:text-zinc-400">
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-sm flex items-center justify-center shadow-lg shadow-blue-600/10">
            <MapIcon className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase text-zinc-950 dark:text-white tracking-tighter leading-none">Mapa Regional Eleitoral</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1.5">Visão Territorial, Divisão por Zonas do TRE e Gestão de Lideranças Locais</p>
          </div>
        </div>

        {/* Rapid Dropdown Selector for ease of access */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Ir para:</span>
          <select 
            value={selectedMun} 
            onChange={(e) => setSelectedMun(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white px-3 py-2 rounded-sm font-black text-[10px] uppercase outline-none focus:border-blue-600 shadow-sm"
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
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm">
            
            {/* Sidebar Title & Toggles */}
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-3 mb-3">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">Divisão Territorial da Campanha</h3>
                <p className="text-[8px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wide leading-none mt-1">Selecione o Município</p>
              </div>
              
              {/* List vs Map Toggle */}
              <div className="flex gap-0.5 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-xs">
                <button
                  type="button"
                  onClick={() => setSidebarMode('lista')}
                  className={`px-2 py-1 text-[8px] font-black uppercase rounded-xs transition-all ${
                    sidebarMode === 'lista'
                      ? 'bg-white dark:bg-zinc-850 text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarMode('mapa')}
                  className={`px-2 py-1 text-[8px] font-black uppercase rounded-xs transition-all ${
                    sidebarMode === 'mapa'
                      ? 'bg-white dark:bg-zinc-850 text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Mapa
                </button>
              </div>
            </div>

            {/* Content area based on mode */}
            {sidebarMode === 'lista' ? (
              <div className="space-y-3">
                {/* Search & Filter controls inside sidebar */}
                <div className="space-y-2">
                  <select
                    value={selectedZoneFilter}
                    onChange={(e) => setSelectedZoneFilter(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm py-1.5 px-2 font-bold text-[9px] text-zinc-900 dark:text-white outline-none focus:border-blue-600"
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
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm py-1.5 pl-7 pr-2 font-bold text-[9px] text-zinc-900 dark:text-white outline-none focus:border-blue-600 placeholder:text-zinc-400"
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
                      <div className="flex justify-between items-center px-1 pt-1 border-b border-zinc-100 dark:border-zinc-800/80 pb-1">
                        <span className="text-[9px] font-bold uppercase text-zinc-600 dark:text-zinc-400 tracking-wider flex items-center gap-1.5">
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
                          const stats = munStats[mun] || { voters: 0, teams: 0 };
                          return (
                            <button
                              type="button"
                              key={mun}
                              onClick={() => setSelectedMun(mun)}
                              className={`w-full text-left p-2 rounded border transition-all flex items-center justify-between outline-none ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                                  : 'border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200'
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
                                  <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium uppercase mt-0.5 leading-none">
                                    {getZoneLabel(mun)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
                                <span>👥 {stats.voters}</span>
                                <span className="opacity-40">|</span>
                                <span>🚩 {stats.teams}</span>
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
            ) : (
              /* Interactive SVG Map container inside Sidebar */
              <div className="space-y-3">
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-sm p-1.5 flex items-center justify-center overflow-hidden">
                  <svg 
                    viewBox="0 0 650 740" 
                    className="w-full h-auto drop-shadow-md select-none transition-all duration-300"
                  >
                    {/* Defs for gradients, patterns */}
                    <defs>
                      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                        <feDropShadow dx="3" dy="3" stdDeviation="4" floodOpacity="0.15"/>
                      </filter>
                    </defs>

                    {/* Draw all Municipal Borders based on calculated points in image */}
                    <g filter="url(#shadow)">
                      {/* Amajari */}
                      <path 
                        d="M 120,200 C 140,165 200,160 210,160 C 240,185 270,180 320,150 C 370,160 380,180 415,160 C 400,200 405,240 425,270 C 385,270 330,225 245,240 C 210,248 180,245 120,200 Z"
                        fill={selectedMun === "Amajari" ? ZONE_INFO["Amajari"].hoverColor : ZONE_INFO["Amajari"].color}
                        stroke={selectedMun === "Amajari" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "Amajari" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("Amajari")}
                        onMouseEnter={() => setHoveredMun("Amajari")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* Pacaraima */}
                      <path 
                        d="M 320,150 C 340,110 380,110 405,95 C 415,120 425,115 440,115 C 440,150 435,170 415,160 C 380,180 370,160 320,150 Z"
                        fill={selectedMun === "Pacaraima" ? ZONE_INFO["Pacaraima"].hoverColor : ZONE_INFO["Pacaraima"].color}
                        stroke={selectedMun === "Pacaraima" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "Pacaraima" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("Pacaraima")}
                        onMouseEnter={() => setHoveredMun("Pacaraima")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* Uiramutã */}
                      <path 
                        d="M 440,115 C 455,110 465,115 470,115 C 475,80 495,40 525,20 C 515,70 535,110 565,120 C 560,135 535,140 520,145 C 515,165 500,175 485,205 C 470,225 455,250 455,250 C 450,165 455,135 470,115 Z"
                        fill={selectedMun === "Uiramutã" ? ZONE_INFO["Uiramutã"].hoverColor : ZONE_INFO["Uiramutã"].color}
                        stroke={selectedMun === "Uiramutã" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "Uiramutã" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("Uiramutã")}
                        onMouseEnter={() => setHoveredMun("Uiramutã")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* Normandia */}
                      <path 
                        d="M 455,250 C 470,225 485,205 485,205 C 500,175 515,165 520,145 C 535,140 560,135 565,120 C 575,125 570,150 585,190 C 575,210 580,245 555,270 C 530,280 513,280 505,275 C 490,265 475,255 455,250 Z"
                        fill={selectedMun === "Normandia" ? ZONE_INFO["Normandia"].hoverColor : ZONE_INFO["Normandia"].color}
                        stroke={selectedMun === "Normandia" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "Normandia" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("Normandia")}
                        onMouseEnter={() => setHoveredMun("Normandia")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* Alto Alegre */}
                      <path 
                        d="M 15,110 C 50,130 90,150 160,155 C 160,185 160,200 170,160 C 180,240 210,255 260,295 C 300,290 350,270 350,270 C 335,275 315,290 290,290 C 250,295 240,300 200,295 C 190,315 160,320 115,335 C 105,310 100,275 85,270 C 85,220 75,210 15,110 Z"
                        fill={selectedMun === "Alto Alegre" ? ZONE_INFO["Alto Alegre"].hoverColor : ZONE_INFO["Alto Alegre"].color}
                        stroke={selectedMun === "Alto Alegre" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "Alto Alegre" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("Alto Alegre")}
                        onMouseEnter={() => setHoveredMun("Alto Alegre")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* Boa Vista */}
                      <path 
                        d="M 350,270 C 365,255 385,250 405,245 C 410,220 435,200 455,190 C 455,250 475,255 505,275 C 500,310 510,350 505,370 C 490,372 475,365 465,350 C 465,330 445,310 420,290 C 413,285 405,280 403,280 C 400,275 350,270 350,270 Z"
                        fill={selectedMun === "Boa Vista" ? ZONE_INFO["Boa Vista"].hoverColor : ZONE_INFO["Boa Vista"].color}
                        stroke={selectedMun === "Boa Vista" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "Boa Vista" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("Boa Vista")}
                        onMouseEnter={() => setHoveredMun("Boa Vista")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* Bonfim */}
                      <path 
                        d="M 505,275 C 513,280 530,280 555,270 C 557,285 540,300 537,325 C 535,335 555,360 545,385 C 525,380 515,375 505,370 C 510,350 500,310 505,275 Z"
                        fill={selectedMun === "Bonfim" ? ZONE_INFO["Bonfim"].hoverColor : ZONE_INFO["Bonfim"].color}
                        stroke={selectedMun === "Bonfim" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "Bonfim" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("Bonfim")}
                        onMouseEnter={() => setHoveredMun("Bonfim")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* Cantá */}
                      <path 
                        d="M 420,290 C 445,310 465,330 465,350 C 475,365 490,372 505,370 C 500,395 515,420 485,430 C 460,410 433,390 425,365 C 405,350 410,310 420,290 Z"
                        fill={selectedMun === "Cantá" ? ZONE_INFO["Cantá"].hoverColor : ZONE_INFO["Cantá"].color}
                        stroke={selectedMun === "Cantá" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "Cantá" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("Cantá")}
                        onMouseEnter={() => setHoveredMun("Cantá")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* Mucajaí */}
                      <path 
                        d="M 200,295 C 240,300 250,295 290,290 C 315,290 335,275 350,270 C 350,270 400,275 403,280 C 405,280 413,285 420,290 C 410,310 405,350 425,365 C 405,360 365,350 285,355 C 215,360 195,360 155,390 C 145,345 165,335 200,295 Z"
                        fill={selectedMun === "Mucajaí" ? ZONE_INFO["Mucajaí"].hoverColor : ZONE_INFO["Mucajaí"].color}
                        stroke={selectedMun === "Mucajaí" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "Mucajaí" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("Mucajaí")}
                        onMouseEnter={() => setHoveredMun("Mucajaí")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* Iracema */}
                      <path 
                        d="M 155,390 C 195,360 215,360 285,355 C 365,350 405,360 425,365 C 433,390 460,410 485,430 C 470,440 435,442 395,435 C 335,450 265,485 225,435 C 205,445 175,430 155,390 Z"
                        fill={selectedMun === "Iracema" ? ZONE_INFO["Iracema"].hoverColor : ZONE_INFO["Iracema"].color}
                        stroke={selectedMun === "Iracema" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "Iracema" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("Iracema")}
                        onMouseEnter={() => setHoveredMun("Iracema")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* Caracaraí */}
                      <path 
                        d="M 225,435 C 265,485 335,450 395,435 C 435,442 470,440 485,430 C 495,450 525,440 525,420 C 535,430 543,425 550,420 C 555,440 565,460 545,490 C 535,500 530,510 535,520 C 515,540 495,560 465,590 C 445,610 395,640 360,690 C 335,720 326,750 323,785 C 320,760 310,740 295,720 C 275,690 265,650 270,595 C 275,540 255,510 225,435 Z"
                        fill={selectedMun === "Caracaraí" ? ZONE_INFO["Caracaraí"].hoverColor : ZONE_INFO["Caracaraí"].color}
                        stroke={selectedMun === "Caracaraí" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "Caracaraí" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("Caracaraí")}
                        onMouseEnter={() => setHoveredMun("Caracaraí")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* Rorainópolis */}
                      <path 
                        d="M 465,590 C 495,560 515,540 535,520 C 543,540 565,560 575,580 C 565,610 525,650 525,690 C 515,730 475,780 460,815 C 435,780 395,720 360,690 C 395,640 445,610 465,590 Z"
                        fill={selectedMun === "Rorainópolis" ? ZONE_INFO["Rorainópolis"].hoverColor : ZONE_INFO["Rorainópolis"].color}
                        stroke={selectedMun === "Rorainópolis" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "Rorainópolis" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("Rorainópolis")}
                        onMouseEnter={() => setHoveredMun("Rorainópolis")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* São Luiz */}
                      <path 
                        d="M 525,420 C 535,430 543,425 550,420 C 558,425 565,430 570,435 C 570,450 565,465 555,475 C 545,470 535,470 530,465 C 525,460 525,440 525,420 Z"
                        fill={selectedMun === "São Luiz" ? ZONE_INFO["São Luiz"].hoverColor : ZONE_INFO["São Luiz"].color}
                        stroke={selectedMun === "São Luiz" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "São Luiz" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("São Luiz")}
                        onMouseEnter={() => setHoveredMun("São Luiz")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* São João da Baliza */}
                      <path 
                        d="M 535,520 C 545,510 550,500 545,490 C 555,490 565,495 570,500 C 565,515 555,525 545,530 C 540,530 535,525 535,520 Z"
                        fill={selectedMun === "São João da Baliza" ? ZONE_INFO["São João da Baliza"].hoverColor : ZONE_INFO["São João da Baliza"].color}
                        stroke={selectedMun === "São João da Baliza" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "São João da Baliza" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("São João da Baliza")}
                        onMouseEnter={() => setHoveredMun("São João da Baliza")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />

                      {/* Caroebe */}
                      <path 
                        d="M 570,435 C 585,425 590,440 595,460 C 595,490 585,515 570,525 C 565,495 555,490 545,490 C 545,490 555,475 555,475 C 565,465 570,450 570,435 Z"
                        fill={selectedMun === "Caroebe" ? ZONE_INFO["Caroebe"].hoverColor : ZONE_INFO["Caroebe"].color}
                        stroke={selectedMun === "Caroebe" ? "#0578d3" : "#ffffff"}
                        strokeWidth={selectedMun === "Caroebe" ? "3.5" : "1.5"}
                        className="cursor-pointer transition-all duration-200 outline-none hover:opacity-95"
                        onClick={() => setSelectedMun("Caroebe")}
                        onMouseEnter={() => setHoveredMun("Caroebe")}
                        onMouseLeave={() => setHoveredMun(null)}
                      />
                    </g>

                    {/* Labels */}
                    <text x="280" y="210" textAnchor="middle" className="text-[10px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2">
                      <tspan x="280" dy="-6">7ª</tspan>
                      <tspan x="280" dy="12">Amajari</tspan>
                    </text>
                    <text x="390" y="135" textAnchor="middle" className="text-[10px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2">
                      <tspan x="390" dy="-6">7ª</tspan>
                      <tspan x="390" dy="12">Pacaraima</tspan>
                    </text>
                    <text x="495" y="125" textAnchor="middle" className="text-[10px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2">
                      <tspan x="495" dy="-6">7ª</tspan>
                      <tspan x="495" dy="12">Uiramutã</tspan>
                    </text>
                    
                    <text x="210" y="245" textAnchor="middle" className="text-[10px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2">
                      <tspan x="210" dy="-6">3ª</tspan>
                      <tspan x="210" dy="12">Alto Alegre</tspan>
                    </text>
                    
                    <text x="430" y="260" textAnchor="middle" className="text-[9px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2">
                      <tspan x="430" dy="-12">1ª</tspan>
                      <tspan x="430" dy="10">5ª</tspan>
                      <tspan x="430" dy="12">Boa Vista</tspan>
                    </text>
                    <text x="455" y="335" textAnchor="middle" className="text-[10px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2">
                      <tspan x="455" dy="-6">5ª</tspan>
                      <tspan x="455" dy="12">Cantá</tspan>
                    </text>
                    
                    <text x="535" y="205" textAnchor="middle" className="text-[10px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2">
                      <tspan x="535" dy="-6">9ª</tspan>
                      <tspan x="535" dy="12">Normandia</tspan>
                    </text>
                    <text x="525" y="315" textAnchor="middle" className="text-[10px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2">
                      <tspan x="525" dy="-6">9ª</tspan>
                      <tspan x="525" dy="12">Bonfim</tspan>
                    </text>
                    
                    <text x="290" y="325" textAnchor="middle" className="text-[10px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2">
                      <tspan x="290" dy="-6">6ª</tspan>
                      <tspan x="290" dy="12">Mucajaí</tspan>
                    </text>
                    <text x="280" y="410" textAnchor="middle" className="text-[10px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2">
                      <tspan x="280" dy="-6">6ª</tspan>
                      <tspan x="280" dy="12">Iracema</tspan>
                    </text>
                    
                    <text x="360" y="525" textAnchor="middle" className="text-[11px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2.5">
                      <tspan x="360" dy="-6">2ª</tspan>
                      <tspan x="360" dy="14">Caracaraí</tspan>
                    </text>
                    
                    <text x="450" y="665" textAnchor="middle" className="text-[11px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2.5">
                      <tspan x="450" dy="-6">8ª</tspan>
                      <tspan x="450" dy="14">Rorainópolis</tspan>
                    </text>
                    
                    <text x="515" y="480" textAnchor="middle" className="text-[9px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2">
                      <tspan x="515" dy="-12">4ª</tspan>
                      <tspan x="515" dy="10">São Luiz</tspan>
                      <tspan x="515" dy="10">do Anauá</tspan>
                    </text>
                    <text x="530" y="535" textAnchor="middle" className="text-[8px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="1.8">
                      <tspan x="530" dy="-12">4ª</tspan>
                      <tspan x="530" dy="10">São João</tspan>
                      <tspan x="530" dy="10">da Baliza</tspan>
                    </text>
                    <text x="585" y="500" textAnchor="middle" className="text-[9px] font-black pointer-events-none fill-zinc-900" paintOrder="stroke" stroke="#ffffff" strokeWidth="2">
                      <tspan x="585" dy="-6">4ª</tspan>
                      <tspan x="585" dy="11">Caroebe</tspan>
                    </text>
                  </svg>
                </div>

                {/* Compact Legend */}
                <div className="pt-2">
                  <h4 className="text-[8px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Zonas Eleitorais</h4>
                  <div className="grid grid-cols-2 gap-1.5 text-[8px] font-bold text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs border border-zinc-200 dark:border-zinc-800 shrink-0" style={{backgroundColor: '#ffffff'}} />
                      <span>1ª ZE - Boa Vista</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{backgroundColor: '#cdbfa5'}} />
                      <span>2ª ZE - Caracaraí</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{backgroundColor: '#fffaae'}} />
                      <span>3ª ZE - Alto Alegre</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{backgroundColor: '#a0c4df'}} />
                      <span>4ª ZE - Eixo do Sul</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{backgroundColor: '#ffd07b'}} />
                      <span>5ª ZE - BV/Cantá</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{backgroundColor: '#a998c7'}} />
                      <span>6ª ZE - Mucajaí/Ira</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{backgroundColor: '#cbe296'}} />
                      <span>7ª ZE - Norte</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{backgroundColor: '#f26b80'}} />
                      <span>8ª ZE - Rorainópolis</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{backgroundColor: '#45b4c1'}} />
                      <span>9ª ZE - Leste/Bonfim</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Command Center & Detailed Operational Analytics for Selected Municipality (Cols 5-12) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Selected City Overview Command Card */}
          <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-lg p-5 md:p-6 relative overflow-hidden shadow-xs border border-zinc-200 dark:border-zinc-800 transition-all">
            {/* Ambient subtle light overlay */}
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-zinc-400">
              <MapIcon className="w-24 h-24" />
            </div>

            <div className="relative z-10">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">QG Municipal • Comando Eleitoral</span>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-1">{selectedMun}</h3>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 mt-2">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-5 mt-5">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Eleitores Mapeados</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white">{munStats[selectedMun]?.voters || 0}</span>
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-sm overflow-hidden">
            <div className="flex border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
              <button
                type="button"
                onClick={() => setMunSubTab('frentes')}
                className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider transition-all border-b-2 outline-none flex items-center justify-center gap-2 ${
                  munSubTab === 'frentes'
                    ? 'border-blue-600 text-zinc-950 dark:text-white bg-white dark:bg-zinc-900'
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
                    ? 'border-blue-600 text-zinc-950 dark:text-white bg-white dark:bg-zinc-900'
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
                              <h4 className="text-xs font-black uppercase text-zinc-900 dark:text-white leading-tight">
                                {team.name}
                              </h4>
                              <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-xs leading-none shrink-0">
                                {team.status || 'Operando'}
                              </span>
                            </div>

                            {/* Leader Contact Details */}
                            <div className="mt-3 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                                  {team.leader?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
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
                    <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-sm text-center">
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
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
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm py-2 pl-8 pr-3 font-bold text-[9px] text-zinc-900 dark:text-white outline-none focus:border-blue-600 placeholder:text-zinc-400"
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
                                  : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-400'
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
                                  <span className="text-xs font-black uppercase text-zinc-900 dark:text-white">{voter.name}</span>
                                  {voter.sentiment === 'support' && <span className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm">Apoio</span>}
                                  {voter.sentiment === 'neutral' && <span className="bg-blue-600/10 text-blue-700 dark:text-blue-500 border border-blue-600/20 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm">Neutro</span>}
                                  {voter.sentiment === 'opposed' && <span className="bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm">Oposição</span>}
                                </div>
                                
                                <div className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 flex flex-wrap gap-x-3 gap-y-0.5">
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
                          <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-sm text-center">
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
                        <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-sm text-center">
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
