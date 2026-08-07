// ============================================================
// Types compartilhados do CaboDashboard
// ============================================================

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface OfflineQueueItem {
  id: string;
  type: 'ponto' | 'eleitor' | 'combustivel' | 'demanda';
  data: any;
  location: GeoLocation;
  timestamp: number;
  fraudFlag?: boolean;
  fraudReason?: string;
}

export interface CaboVoterForm {
  name: string;
  phone: string;
  address: string;
  observations: string;
  referredBy: string;
  tags: string[];
  articulatorId?: string;
  cpf: string;
  rg: string;
  titulo: string;
  zona: string;
  secao: string;
  localVotacao: string;
}

export interface FuelForm {
  amount: string;
  reason: string;
}

export interface DemandForm {
  title: string;
  description: string;
}

export interface AgendaFormCabo {
  municipio: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  motivo: string;
}

export interface ExpenseForm {
  amount: string;
  description: string;
  purpose: string;
}

export interface ProfileData {
  name: string;
  phone: string;
  photoUrl: string;
  zone: string;
}

export type CaboActiveTab =
  | 'equipe'
  | 'logistica'
  | 'ouvidoria'
  | 'financeiro'
  | 'notas'
  | 'materiais'
  | 'feed';

export type RegisterMode = 'individual' | 'lote' | 'link';
