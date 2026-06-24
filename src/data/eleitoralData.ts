export interface VotingLocation {
  municipio: string;
  zona: string;
  bairro: string;
  local: string;
  endereco: string;
  secoes: string;
  secoesCount: number;
  eleitores: number;
}

// Zerados para permitir a importação de dados oficiais do TRE através de planilha Excel
export const ELEITORAL_DATA: VotingLocation[] = [];
