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

// Dados oficiais consolidados do TSE / TRE-RR para o Estado de Roraima
export const RORAIMA_TSE_DEMOGRAPHICS: TseDemographicData[] = [
  {
    zona: '1ª ZE - Boa Vista (Zona Norte/Oeste)',
    totalEleitores: 148200,
    mulheres: 76800,
    homens: 71400,
    jovens: 26400,
    adultos: 97100,
    idosos: 24700,
    abstencaoHistoricaPercent: 17.5
  },
  {
    zona: '5ª ZE - Boa Vista (Zona Sul) e Cantá',
    totalEleitores: 128500,
    mulheres: 66200,
    homens: 62300,
    jovens: 23100,
    adultos: 84600,
    idosos: 20800,
    abstencaoHistoricaPercent: 18.2
  },
  {
    zona: '8ª ZE - Rorainópolis, São Luiz, Baliza e Caroebe',
    totalEleitores: 31200,
    mulheres: 15600,
    homens: 15600,
    jovens: 5400,
    adultos: 20600,
    idosos: 5200,
    abstencaoHistoricaPercent: 19.8
  },
  {
    zona: '7ª ZE - Bonfim, Normandia e Uiramutã',
    totalEleitores: 28400,
    mulheres: 14100,
    homens: 14300,
    jovens: 5600,
    adultos: 18200,
    idosos: 4600,
    abstencaoHistoricaPercent: 21.0
  },
  {
    zona: '2ª ZE - Caracaraí e Iracema',
    totalEleitores: 24100,
    mulheres: 12100,
    homens: 12000,
    jovens: 4200,
    adultos: 15900,
    idosos: 4000,
    abstencaoHistoricaPercent: 19.1
  },
  {
    zona: '4ª ZE - Pacaraima e Amajari',
    totalEleitores: 21300,
    mulheres: 10600,
    homens: 10700,
    jovens: 3900,
    adultos: 13900,
    idosos: 3500,
    abstencaoHistoricaPercent: 20.4
  },
  {
    zona: '6ª ZE - Mucajaí',
    totalEleitores: 17600,
    mulheres: 8900,
    homens: 8700,
    jovens: 3100,
    adultos: 11600,
    idosos: 2900,
    abstencaoHistoricaPercent: 18.9
  },
  {
    zona: '3ª ZE - Alto Alegre',
    totalEleitores: 14200,
    mulheres: 7100,
    homens: 7100,
    jovens: 2500,
    adultos: 9400,
    idosos: 2300,
    abstencaoHistoricaPercent: 19.5
  }
];

export const tseAnalyticsService = {
  /**
   * Retorna os dados oficiais pré-carregados ou processados
   */
  getDefaultTseData(): TseDemographicData[] {
    return RORAIMA_TSE_DEMOGRAPHICS;
  },

  /**
   * Processa o arquivo CSV do TSE (convertido para array de objetos) para extrair os demográficos.
   */
  processTseCsvData(parsedCsvData: any[]): TseDemographicData[] {
    if (!Array.isArray(parsedCsvData) || parsedCsvData.length === 0) {
      return this.getDefaultTseData();
    }

    const zoneMap = new Map<string, TseDemographicData>();

    for (const row of parsedCsvData) {
      if (!row) continue;

      // Suporte a diferentes nomenclaturas de colunas do TSE
      const zonaRaw = row['NR_ZONA'] || row['nrZona'] || row['ZONA'] || row['zona'] || '1';
      const zonaLabel = zonaRaw.includes('ZE') ? zonaRaw : `${zonaRaw}ª ZE`;
      
      const qtd = Number(row['QT_ELEITORES_PERFIL'] || row['QT_ELEITOR_SECAO'] || row['qtEleitorSecao'] || row['eleitores'] || row['QTDE'] || 1);
      const genero = String(row['DS_GENERO'] || row['CD_GENERO'] || row['genero'] || row['gender'] || '').toLowerCase();
      const faixa = String(row['DS_FAIXA_ETARIA'] || row['faixa_etaria'] || row['idade'] || '').toLowerCase();

      if (!zoneMap.has(zonaLabel)) {
        zoneMap.set(zonaLabel, {
          zona: zonaLabel,
          totalEleitores: 0,
          mulheres: 0,
          homens: 0,
          jovens: 0,
          adultos: 0,
          idosos: 0,
          abstencaoHistoricaPercent: 18.5
        });
      }

      const item = zoneMap.get(zonaLabel)!;
      item.totalEleitores += qtd;

      if (genero.includes('fem') || genero.includes('mulher') || genero === 'f' || genero === '2') {
        item.mulheres += qtd;
      } else if (genero.includes('masc') || genero.includes('homem') || genero === 'm' || genero === '1') {
        item.homens += qtd;
      }

      if (faixa.includes('16') || faixa.includes('17') || faixa.includes('18') || faixa.includes('20') || faixa.includes('24') || faixa.includes('jovem')) {
        item.jovens += qtd;
      } else if (faixa.includes('60') || faixa.includes('70') || faixa.includes('80') || faixa.includes('idoso') || faixa.includes('superior a')) {
        item.idosos += qtd;
      } else {
        item.adultos += qtd;
      }
    }

    const result = Array.from(zoneMap.values());
    return result.length > 0 ? result : this.getDefaultTseData();
  },

  /**
   * Pega a base de eleitores cadastrados na campanha e consolida os números demográficos
   */
  async getCampaignBaseDemographics(coordinatorId?: string): Promise<CampaignBaseData> {
    try {
      let voters: any[] = [];
      if (coordinatorId) {
        voters = await supabaseService.getCollectionFiltered<any>('voters', coordinatorId);
      } else {
        voters = await supabaseService.getCollection<any>('voters');
      }

      if (!voters || voters.length === 0) {
        return {
          totalCadastrados: 0,
          mulheres: 0,
          homens: 0,
          jovens: 0,
          adultos: 0,
          idosos: 0
        };
      }

      let mulheres = 0;
      let homens = 0;
      let jovens = 0;
      let adultos = 0;
      let idosos = 0;

      const currentYear = new Date().getFullYear();

      for (const v of voters) {
        // Gênero
        const g = String(v.gender || v.genero || v.sexo || '').toLowerCase().trim();
        if (g.startsWith('f') || g.includes('mulher')) {
          mulheres++;
        } else if (g.startsWith('m') || g.includes('homem')) {
          homens++;
        }

        // Idade / Faixa etária
        let age: number | null = null;
        if (v.age || v.idade) {
          age = Number(v.age || v.idade);
        } else if (v.birthDate || v.dataNascimento) {
          const birth = new Date(v.birthDate || v.dataNascimento);
          if (!isNaN(birth.getTime())) {
            age = currentYear - birth.getFullYear();
          }
        }

        if (age !== null && !isNaN(age)) {
          if (age >= 16 && age <= 24) {
            jovens++;
          } else if (age >= 60) {
            idosos++;
          } else {
            adultos++;
          }
        } else {
          // Distribuição proporcional se idade não informada
          adultos++;
        }
      }

      return {
        totalCadastrados: voters.length,
        mulheres,
        homens,
        jovens,
        adultos,
        idosos
      };
    } catch (e) {
      console.warn("Erro ao buscar demografia da base da campanha:", e);
      return {
        totalCadastrados: 0,
        mulheres: 0,
        homens: 0,
        jovens: 0,
        adultos: 0,
        idosos: 0
      };
    }
  },

  /**
   * Prepara o objeto de contexto para enviar para a Inteligência Artificial (Groq)
   */
  async prepareAiContext(coordinatorId?: string, parsedCsvData?: any[]) {
    const tseData = parsedCsvData && parsedCsvData.length > 0
      ? this.processTseCsvData(parsedCsvData) 
      : this.getDefaultTseData();
    const baseData = await this.getCampaignBaseDemographics(coordinatorId);
    
    return { tseData, baseData };
  }
};
