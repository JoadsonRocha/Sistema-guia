export interface TseColumnDef {
  variable: string;
  description: string;
  key: string;
  example: string | number;
}

export const TSE_COLUMNS: TseColumnDef[] = [
  {
    variable: "NM MUNICIPIO",
    description: "Nome do município onde vota a eleitora ou o eleitor.",
    key: "nmMunicipio",
    example: "SÃO PAULO"
  },
  {
    variable: "NR ZONA",
    description: "Número da zona eleitoral onde vota a eleitora ou o eleitor.",
    key: "nrZona",
    example: "001"
  },
  {
    variable: "NR SECAO",
    description: "Número da seção eleitoral onde vota a eleitora ou o eleitor.",
    key: "nrSecao",
    example: "0001"
  },
  {
    variable: "CD TIPO SECAO AGREGADA",
    description: "Código do tipo de seção. Pode assumir os valores:\n- 1: Principal;\n- 2: Agregada; e\n- 3: Distribuída de oficio.\nObservação: em períodos não eleitorais, assumirá o valor -1.",
    key: "cdTipoSecaoAgregada",
    example: 1
  },
  {
    variable: "DS_TIPO_SECAO_AGREGADA",
    description: "Código do tipo de seção. Pode assumir os valores:\n- Principal;\n- Agregada; e\n- Distribuída de ofício.\nObservação: em períodos não eleitorais, assumirá o valor #NULO.",
    key: "dsTipoSecaoAgregada",
    example: "Principal"
  },
  {
    variable: "NR SECAO PRINCIPAL",
    description: "Número da seção eleitoral principal a qual a seção eleitoral foi agregada. Essa coluna receberá valores apenas quando a coluna DS_TIPO_SECAO_AGREGADA receber o valor 'Agregada'. Nos demais casos, receberá o valor -1.",
    key: "nrSecaoPrincipal",
    example: -1
  },
  {
    variable: "NR LOCAL VOTACAO",
    description: "Número do local de votação utilizado no pleito.",
    key: "nrLocalVotacao",
    example: 1015
  },
  {
    variable: "NM LOCAL VOTACAO",
    description: "Nome do local de votação utilizado no pleito.",
    key: "nmLocalVotacao",
    example: "ESCOLA ESTADUAL PADRE ANCHIETA"
  },
  {
    variable: "DS ENDERECO",
    description: "Descrição do endereço do local de votação utilizado no pleito.",
    key: "dsEndereco",
    example: "RUA DOS TRÊS IRMÃOS, 100"
  },
  {
    variable: "NM BAIRRO",
    description: "Nome do bairro do local de votação utilizado no pleito.",
    key: "nmBairro",
    example: "MORUMBI"
  },
  {
    variable: "QT_ELEITOR_SECAO",
    description: "Quantitativo de eleitoras e eleitores aptos a votar originalmente vinculados à seção.",
    key: "qtEleitorSecao",
    example: 380
  },
  {
    variable: "NM LOCAL VOTACAO ORIGINAL",
    description: "Nome do local de votação original.",
    key: "nmLocalVotacaoOriginal",
    example: "ESCOLA ESTADUAL PADRE ANCHIETA"
  },
  {
    variable: "DS ENDERECO_LOCVT_ORIGINAL",
    description: "Descrição do endereço do local de votação original.",
    key: "dsEnderecoLocvtOriginal",
    example: "RUA DOS TRÊS IRMÃOS, 100"
  }
];

export interface VotingLocation {
  // Standard TSE variables
  nmMunicipio: string;
  nrZona: string;
  nrSecao: string;
  cdTipoSecaoAgregada?: string | number;
  dsTipoSecaoAgregada?: string;
  nrSecaoPrincipal?: string | number;
  nrLocalVotacao?: string | number;
  nmLocalVotacao: string;
  dsEndereco?: string;
  nmBairro?: string;
  qtEleitorSecao: number;
  nmLocalVotacaoOriginal?: string;
  dsEnderecoLocvtOriginal?: string;

  // Compatibility fields (auto-derived)
  municipio?: string;
  zona?: string;
  secoes?: string;
  secoesCount?: number;
  local?: string;
  endereco?: string;
  bairro?: string;
  eleitores?: number;
}

// Zerados para permitir a importação de dados oficiais do TRE/TSE através de planilha Excel
export const ELEITORAL_DATA: VotingLocation[] = [];

