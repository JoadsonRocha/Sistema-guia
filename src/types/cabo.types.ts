// ============================================================
// Types compartilhados do CaboDashboard
// Sistema Águia / Nexus Política 2026
// ============================================================

/**
 * Interface que representa as coordenadas de geolocalização do dispositivo em campo.
 */
export interface GeoLocation {
  /** Latitude */
  lat: number;
  /** Longitude */
  lng: number;
  /** Precisão da captura via GPS (em metros) */
  accuracy: number;
  /** Timestamp do registro da coordenada */
  timestamp: number;
}

/**
 * Item mantido na fila offline local quando o Líder de Campo trabalha sem conexão de internet.
 */
export interface OfflineQueueItem {
  /** ID único do item na fila offline */
  id: string;
  /** Categoria da operação offline: ponto (check-in), eleitor, combustível, demanda */
  type: 'ponto' | 'eleitor' | 'combustivel' | 'demanda';
  /** Payload de dados da operação */
  data: any;
  /** Coordenadas de GPS capturadas no momento da operação */
  location: GeoLocation;
  /** Timestamp de criação do registro offline */
  timestamp: number;
  /** Indicador de flag de suspeita de fraude na captura */
  fraudFlag?: boolean;
  /** Motivo da sinalização de inconsistência */
  fraudReason?: string;
}

/**
 * Formulário de cadastro de novo eleitor preenchido pelo Líder de Equipe (Cabo).
 */
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

/**
 * Formulário de requisição oficial de combustível para autonomia em rotas de campo.
 */
export interface FuelForm {
  /** Quantidade/volume necessário (em litros ou valor R$) */
  amount: string;
  /** Roteiro planejado e justificativa logística da requisição */
  reason: string;
}

/**
 * Formulário de registro de demanda comunitária no painel do cabo.
 */
export interface DemandForm {
  /** Título da demanda da comunidade */
  title: string;
  /** Descrição detalhada do problema ou necessidade mapeada */
  description: string;
}

/**
 * Formulário de proposta/sugestão de agenda enviado pelo Líder ao Coordenador.
 */
export interface AgendaFormCabo {
  /** Município do evento proposto */
  municipio: string;
  /** Data da missão (YYYY-MM-DD) */
  data: string;
  /** Horário sugerido de início (HH:MM) */
  hora_inicio: string;
  /** Horário sugerido de término (HH:MM) */
  hora_fim: string;
  /** Objetivos táticos da reunião ou diligência */
  motivo: string;
}

/**
 * Formulário de lançamento de despesa de campo.
 */
export interface ExpenseForm {
  /** Valor financeiro (R$) */
  amount: string;
  /** Descrição da despesa realizada */
  description: string;
  /** Finalidade do gasto */
  purpose: string;
}

/**
 * Dados de perfil do Líder exibidos no cabeçalho do painel de campo.
 */
export interface ProfileData {
  /** Nome do líder de campo */
  name: string;
  /** Telefone de contato */
  phone: string;
  /** URL da foto de perfil */
  photoUrl: string;
  /** Zona ou equipe de atuação */
  zone: string;
}

/**
 * Abas ativas de navegação no Painel do Líder de Campo (Cabo).
 */
export type CaboActiveTab =
  | 'equipe'
  | 'logistica'
  | 'ouvidoria'
  | 'financeiro'
  | 'notas'
  | 'materiais'
  | 'feed';

/**
 * Modalidades de cadastramento de eleitores disponíveis.
 */
export type RegisterMode = 'individual' | 'lote' | 'link';
