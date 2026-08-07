// ============================================================
// Types compartilhados do CoordinatorDashboard
// ============================================================

export interface Team {
  id: string;
  name: string;
  leader: string;
  leaderEmail: string;
  leaderPhone?: string;
  leaderAddress?: string;
  location: string;
  observations?: string;
  status: 'OK' | 'ALERTA' | 'CRISE';
  contacts: number;
  fuel: number;
  demands: number;
  allocated: number;
  spent: number;
  tempPassword?: string;
  coordinatorId?: string;
  regionalCoordId?: string;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: any;
}

export interface Voter {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  observations?: string;
  referredBy?: string;
  tags?: string[];
  loyaltyScore?: number;
  familyCommunity?: string;
  associatedCandidates?: string;
  isArticulator?: boolean;
  articulatorId?: string;
  voted?: boolean;
  isIndigenous?: boolean;
  communityName?: string;
  tuxauaName?: string;
  hasDocPhoto?: boolean;
  sentiment?: 'support' | 'neutral' | 'opposed';
  cpf?: string;
  rg?: string;
  titulo?: string;
  zona?: string;
  secao?: string;
  localVotacao?: string;
  leaderId?: string;
  leaderName?: string;
  leaderEmail?: string;
  team?: string;
  teamName?: string;
  teamId?: string;
  coordinatorId?: string;
  createdAt?: number;
  [key: string]: any;
}

export interface Goal {
  id: string;
  locationName: string;
  targetVoters: number;
  category: 'bairro' | 'municipio' | 'regiao';
  coordinatorId?: string;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: any;
}

export interface RegionalCoordinator {
  id: string;
  name: string;
  email: string;
  phone?: string;
  region: string;
  subLocations?: string;
  targetVoters?: number;
  tempPassword?: string;
  coordinatorId?: string;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: any;
}

export interface Material {
  id: string;
  name: string;
  total: number;
  current: number;
  coordinatorId?: string;
  createdAt?: number;
  [key: string]: any;
}

export interface MaterialRequest {
  id: string;
  materialId: string;
  materialName: string;
  qty: number;
  leaderId?: string;
  leaderName?: string;
  teamName?: string;
  coordinatorId?: string;
  status: 'pendente' | 'aprovado' | 'negado' | 'devolvido';
  signedBy?: string;
  signatureHash?: string;
  approvedAt?: number;
  createdAt?: number;
  [key: string]: any;
}

export interface Demand {
  id: string;
  title: string;
  description?: string;
  team?: string;
  leaderId?: string;
  leaderName?: string;
  priority?: 'baixa' | 'media' | 'alta';
  status?: 'aberta' | 'em_andamento' | 'resolvida';
  coordinatorId?: string;
  createdAt?: number;
  [key: string]: any;
}

export interface AgendaItem {
  id: string;
  municipio: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  motivo: string;
  status?: 'confirmado' | 'pendente' | 'cancelado';
  coordinatorId?: string;
  createdAt?: number;
  [key: string]: any;
}

export interface Transaction {
  id: string;
  team?: string;
  amount?: number;
  type?: string;
  description?: string;
  coordinatorId?: string;
  date?: number;
  [key: string]: any;
}

export interface VoterEditForm {
  name: string;
  phone: string;
  address: string;
  observations: string;
  referredBy: string;
  tags: string[];
  loyaltyScore: number;
  familyCommunity: string;
  associatedCandidates: string;
  isArticulator: boolean;
  articulatorId: string;
  voted: boolean;
  isIndigenous: boolean;
  communityName: string;
  tuxauaName: string;
  hasDocPhoto: boolean;
  sentiment: 'support' | 'neutral' | 'opposed';
  cpf: string;
  rg: string;
  titulo: string;
  zona: string;
  secao: string;
  localVotacao: string;
}

export interface SearchResults {
  teams: Team[];
  notes: any[];
  agendas: AgendaItem[];
}

export type CoordinatorActiveTab =
  | 'overview'
  | 'regional_coords'
  | 'metas'
  | 'teams'
  | 'voters'
  | 'agenda'
  | 'mapa'
  | 'notes'
  | 'materials'
  | 'demands'
  | 'reports'
  | 'analise_eleitoral';
