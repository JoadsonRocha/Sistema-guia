import { supabaseService } from './supabaseService';

export interface TseDemographicData {
  zona: string;
  totalEleitores: number;
  mulheres: number;
  homens: number;
  jovens: number; // 16 a 24 anos
  adultos: number; // 25 a 59 anos
  idosos: number; // 60+ anos
  abstencaoHistoricaPercent: number;
}

export interface CampaignBaseData {
  totalCadastrados: number;
  mulheres: number;
  homens: number;
  jovens: number;
  adultos: number;
  idosos: number;
}

export const tseAnalyticsService = {
  /**
   * Processa o arquivo CSV do TSE (convertido para JSON) para extrair os demográficos.
   */
  processTseCsvData(parsedCsvData: any[]): TseDemographicData[] {
    // Na prática, aqui nós agrupariamos as linhas do CSV por Zona Eleitoral
    // Como exemplo de implementação, vamos retornar um mock processado:
    return [
      {
        zona: "1ª ZE",
        totalEleitores: 15000,
        mulheres: 8000,
        homens: 7000,
        jovens: 3000,
        adultos: 9000,
        idosos: 3000,
        abstencaoHistoricaPercent: 18.5
      },
      {
        zona: "5ª ZE",
        totalEleitores: 22000,
        mulheres: 11500,
        homens: 10500,
        jovens: 5000,
        adultos: 13000,
        idosos: 4000,
        abstencaoHistoricaPercent: 21.0
      }
    ];
  },

  /**
   * Pega a base de eleitores cadastrados na campanha e consolida os números
   */
  async getCampaignBaseDemographics(coordinatorId?: string): Promise<CampaignBaseData> {
    // Aqui nós buscariamos os eleitores do Supabase e fariamos o agrupamento
    // Mock para demonstração:
    return {
      totalCadastrados: 450,
      mulheres: 150,
      homens: 300,
      jovens: 50,
      adultos: 350,
      idosos: 50
    };
  },

  /**
   * Prepara o objeto de contexto para enviar para a Inteligência Artificial (Groq)
   */
  async prepareAiContext(coordinatorId?: string, parsedCsvData?: any[]) {
    const tseData = parsedCsvData ? this.processTseCsvData(parsedCsvData) : this.processTseCsvData([]);
    const baseData = await this.getCampaignBaseDemographics(coordinatorId);
    
    return { tseData, baseData };
  }
};
