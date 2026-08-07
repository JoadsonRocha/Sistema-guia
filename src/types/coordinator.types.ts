// ============================================================
// Types compartilhados do CoordinatorDashboard
// Sistema Águia / Nexus Política 2026
// ============================================================

/**
 * Interface que representa uma Equipe / Zona Regional de campo.
 * Utilizada para acompanhamento tático, metas e alocação de orçamento pelo Coordenador.
 */
export interface Team {
  /** Identificador único da equipe (UUID ou hash local) */
  id: string;
  /** Nome descritivo da equipe ou zona (ex: "Equipe 01 - Pintolândia") */
  name: string;
  /** Nome completo do líder responsável */
  leader: string;
  /** E-mail corporativo ou de acesso do líder */
  leaderEmail: string;
  /** Telefone/WhatsApp de contato do líder */
  leaderPhone?: string;
  /** Endereço ou base física da equipe */
  leaderAddress?: string;
  /** Localização geográfica ou bairro de atuação principal */
  location: string;
  /** Anotações táticas e observações sobre a equipe */
  observations?: string;
  /** Status operacional da equipe: OK (normal), ALERTA (atenção), CRISE (crítico) */
  status: 'OK' | 'ALERTA' | 'CRISE';
  /** Total de contatos/eleitores mapeados na base da equipe */
  contacts: number;
  /** Consumo ou litros de combustível liberados */
  fuel: number;
  /** Quantidade de demandas pendentes registradas */
  demands: number;
  /** Orçamento total alocado para a equipe (R$) */
  allocated: number;
  /** Orçamento efetivamente gasto pela equipe (R$) */
  spent: number;
  /** Senha temporária para o primeiro acesso do líder */
  tempPassword?: string;
  /** ID do coordenador geral responsável */
  coordinatorId?: string;
  /** ID do coordenador regional vinculado */
  regionalCoordId?: string;
  /** Timestamp de criação do registro */
  createdAt?: number;
  /** Timestamp da última atualização */
  updatedAt?: number;
  [key: string]: any;
}

/**
 * Interface que representa um Eleitor cadastrado no CRM Eleitoral.
 * Suporta inteligência territorial, sentimento, dados do TRE e rede de indicação.
 */
export interface Voter {
  /** Identificador único do eleitor (UUID) */
  id: string;
  /** Nome completo do eleitor */
  name: string;
  /** Telefone ou WhatsApp de contato */
  phone?: string;
  /** Endereço residencial completo */
  address?: string;
  /** Observações privadas e perfil político do eleitor */
  observations?: string;
  /** Nome ou ID do apoiador que indicou o eleitor (Rede de Influência) */
  referredBy?: string;
  /** Tags de categorização e segmentação políticas */
  tags?: string[];
  /** Pontuação/Score de fidelidade política do eleitor (0 a 100) */
  loyaltyScore?: number;
  /** Comunidade ou núcleo familiar associado */
  familyCommunity?: string;
  /** Candidatos com os quais o eleitor possui vínculo prévio */
  associatedCandidates?: string;
  /** Indica se o eleitor atua como articulador/liderança local */
  isArticulator?: boolean;
  /** ID do articulador responsável */
  articulatorId?: string;
  /** Status de confirmação de voto no Dia D */
  voted?: boolean;
  /** Marcador para eleitores pertencentes a comunidades indígenas */
  isIndigenous?: boolean;
  /** Nome da comunidade ou terra indígena */
  communityName?: string;
  /** Nome do Tuxaua ou liderança tradicional da maloca */
  tuxauaName?: string;
  /** Indica se possui foto do documento ou comprovante registrada */
  hasDocPhoto?: boolean;
  /** Posicionamento político do eleitor: support (Apoiador), neutral (Neutro), opposed (Oposição) */
  sentiment?: 'support' | 'neutral' | 'opposed';
  /** Cadastro de Pessoa Física (CPF) */
  cpf?: string;
  /** Registro Geral (RG) */
  rg?: string;
  /** Número do Título de Eleitor */
  titulo?: string;
  /** Zona Eleitoral do TRE */
  zona?: string;
  /** Seção Eleitoral do TRE */
  secao?: string;
  /** Nome do Colégio ou Local de Votação do TRE */
  localVotacao?: string;
  /** ID do Líder que realizou o cadastramento */
  leaderId?: string;
  /** Nome do Líder responsável */
  leaderName?: string;
  /** E-mail do Líder responsável */
  leaderEmail?: string;
  /** Nome da equipe cadastradora */
  team?: string;
  /** Nome exibível da equipe */
  teamName?: string;
  /** ID único da equipe vinculada */
  teamId?: string;
  /** ID da coordenação responsável */
  coordinatorId?: string;
  /** Timestamp de criação do cadastro */
  createdAt?: number;
  [key: string]: any;
}

/**
 * Interface para definição de Metas Eleitorais de captação de votos.
 */
export interface Goal {
  /** ID único da meta */
  id: string;
  /** Nome do Município, Bairro ou Região-alvo */
  locationName: string;
  /** Meta estipulada de eleitores a cadastrar/mapear */
  targetVoters: number;
  /** Categoria da meta: por bairro, município ou região */
  category: 'bairro' | 'municipio' | 'regiao';
  /** ID da coordenação */
  coordinatorId?: string;
  /** Timestamp de criação */
  createdAt?: number;
  /** Timestamp de atualização */
  updatedAt?: number;
  [key: string]: any;
}

/**
 * Interface que representa um Coordenador Regional de campanha.
 */
export interface RegionalCoordinator {
  /** ID do coordenador regional */
  id: string;
  /** Nome completo */
  name: string;
  /** E-mail para acesso ao sistema */
  email: string;
  /** Telefone/WhatsApp de contato */
  phone?: string;
  /** Região ou polo principal sob sua responsabilidade */
  region: string;
  /** Municípios ou bairros integrantes da regional */
  subLocations?: string;
  /** Meta de eleitores acumulada para a regional */
  targetVoters?: number;
  /** Senha temporária enviada no onboarding */
  tempPassword?: string;
  /** ID do coordenador geral superior */
  coordinatorId?: string;
  /** Timestamp de criação */
  createdAt?: number;
  /** Timestamp de atualização */
  updatedAt?: number;
  [key: string]: any;
}

/**
 * Interface que representa um Material de Campanha cadastrado no estoque master.
 */
export interface Material {
  /** ID do material */
  id: string;
  /** Nome ou descrição do insumo (ex: "Santinhos 55000") */
  name: string;
  /** Quantidade total no estoque central */
  total: number;
  /** Quantidade atual disponível para distribuição */
  current: number;
  /** ID da coordenação */
  coordinatorId?: string;
  /** Timestamp de criação */
  createdAt?: number;
  [key: string]: any;
}

/**
 * Interface para Solicitações de Material enviadas pelos Líderes de Equipe.
 */
export interface MaterialRequest {
  /** ID da solicitação */
  id: string;
  /** ID do material solicitado */
  materialId: string;
  /** Nome do material solicitado */
  materialName: string;
  /** Quantidade solicitada */
  qty: number;
  /** ID do líder solicitante */
  leaderId?: string;
  /** Nome do líder solicitante */
  leaderName?: string;
  /** Nome da equipe */
  teamName?: string;
  /** ID da coordenação */
  coordinatorId?: string;
  /** Status do pedido: pendente, aprovado, negado ou devolvido */
  status: 'pendente' | 'aprovado' | 'negado' | 'devolvido';
  /** Responsável pela assinatura de recebimento */
  signedBy?: string;
  /** Hash de validação da assinatura eletrônica */
  signatureHash?: string;
  /** Timestamp de aprovação */
  approvedAt?: number;
  /** Timestamp de criação */
  createdAt?: number;
  [key: string]: any;
}

/**
 * Interface que representa uma Demanda de Campo ou Ouvidoria da Comunidade.
 */
export interface Demand {
  /** ID da demanda */
  id: string;
  /** Título conciso da demanda */
  title: string;
  /** Detalhes e descrição da solicitação comunitária */
  description?: string;
  /** Nome da equipe registradora */
  team?: string;
  /** ID do líder que cadastrou a demanda */
  leaderId?: string;
  /** Nome do líder que cadastrou a demanda */
  leaderName?: string;
  /** Nível de prioridade: baixa, media, alta */
  priority?: 'baixa' | 'media' | 'alta';
  /** Status de resolução: aberta, em_andamento, resolvida */
  status?: 'aberta' | 'em_andamento' | 'resolvida';
  /** ID da coordenação */
  coordinatorId?: string;
  /** Timestamp de criação */
  createdAt?: number;
  [key: string]: any;
}

/**
 * Interface que representa um Compromisso ou Evento na Agenda do Candidato.
 */
export interface AgendaItem {
  /** ID do evento na agenda */
  id: string;
  /** Município de realização da reunião ou compromisso */
  municipio: string;
  /** Data do compromisso (formato YYYY-MM-DD) */
  data: string;
  /** Horário de início (formato HH:MM) */
  hora_inicio: string;
  /** Horário de término (formato HH:MM) */
  hora_fim: string;
  /** Motivo, pauta ou público do evento */
  motivo: string;
  /** Status da agenda: confirmado, pendente, cancelado */
  status?: 'confirmado' | 'pendente' | 'cancelado';
  /** ID da coordenação */
  coordinatorId?: string;
  /** Timestamp de criação */
  createdAt?: number;
  [key: string]: any;
}

/**
 * Interface que representa uma Transação Financeira do Caixa Forte.
 */
export interface Transaction {
  /** ID da transação */
  id: string;
  /** Equipe ou centro de custo associado */
  team?: string;
  /** Valor financeiro da movimentação (R$) */
  amount?: number;
  /** Tipo da transação: RECEITA, DESPESA, COTA */
  type?: string;
  /** Descrição ou justificativa do gasto/receita */
  description?: string;
  /** ID da coordenação */
  coordinatorId?: string;
  /** Timestamp da movimentação */
  date?: number;
  [key: string]: any;
}

/**
 * Formulário de Edição de Dados do Eleitor no Painel do Coordenador.
 */
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

/**
 * Estrutura de resultados da Pesquisa Global do Painel do Coordenador.
 */
export interface SearchResults {
  teams: Team[];
  notes: any[];
  agendas: AgendaItem[];
}

/**
 * Abas ativas de navegação do Painel do Coordenador Geral.
 */
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
