export interface RoraimaMunicipality {
  id: string;
  name: string;
  zona: string;
  aliases: string[];
  bairros: string[];
  locaisVotacao: {
    nome: string;
    bairro: string;
    zona: string;
    secoes: string;
    eleitoresAproximado: number;
  }[];
}

// Data do TRE-RR para os 15 Municípios de Roraima
export const RORAIMA_MUNICIPALITIES: RoraimaMunicipality[] = [
  {
    id: 'boa_vista',
    name: 'Boa Vista',
    zona: '1ª e 5ª Zonas Eleitorais',
    aliases: ['bv', 'b.v.', 'boa vista', 'boa vista/rr', 'bv/rr', 'região 1 - bv', 'região 2 - bv', 'região 3 - bv', 'região 4 - bv', 'zona urbana bv'],
    bairros: [
      'Centro', 'Mecejana', '31 de Março', 'São Pedro', 'Pintolândia', 'Calungá', 
      'Caçari', 'Paraviana', 'Liberdade', 'Asa Branca', 'Buritis', 'Caranã', 
      'Cauamé', 'Caimbé', 'Cambará', 'Centenário', 'Cidade Satélite', 'Doutor Silvio Botelho', 
      'Doutor Silvio Leite', 'Estados', 'Jardim Caranã', 'Jardim Floresta', 'Jardim Primavera', 
      'Jardim Tropical', 'Jóquei Clube', 'Laura Moreira', 'Marechal Rondon', 'Nova Cidade', 
      'Olimpic', 'Operário', 'Pricumã', 'Raiar do Sol', 'Santa Tereza', 'Santa Luzia', 
      'São Bento', 'São Francisco', 'São Vicente', 'Senador Hélio Campos', 'Tancredo Neves', 
      'União', 'Vila Jardim', '13 de Setembro', 'Alvorada', 'Aparício Gonçalves', 'Bairro dos Estados', 
      'Aeroporto', '31 de Marco', 'São Pedro'
    ],
    locaisVotacao: [
      { nome: 'Escola Estadual Monteiro Lobato', bairro: 'Centro', zona: '1ª', secoes: '001 a 012', eleitoresAproximado: 4200 },
      { nome: 'Escola Estadual Princesa Isabel', bairro: 'Mecejana', zona: '1ª', secoes: '013 a 022', eleitoresAproximado: 3800 },
      { nome: 'Escola Estadual Lobo D\'Almada', bairro: 'São Pedro', zona: '1ª', secoes: '023 a 030', eleitoresAproximado: 2900 },
      { nome: 'Colégio de Aplicação UFRR', bairro: '31 de Março', zona: '1ª', secoes: '031 a 040', eleitoresAproximado: 3500 },
      { nome: 'Escola Municipal Professor Carlos Raimundo Rodrigues', bairro: 'Pintolândia', zona: '5ª', secoes: '101 a 118', eleitoresAproximado: 5400 },
      { nome: 'Escola Estadual Senador Hélio Campos', bairro: 'Senador Hélio Campos', zona: '5ª', secoes: '119 a 135', eleitoresAproximado: 6100 },
      { nome: 'Escola Estadual Mário David Andreazza', bairro: 'Caimbé', zona: '1ª', secoes: '041 a 052', eleitoresAproximado: 4100 },
      { nome: 'Instituto Federal de Roraima - IFRR', bairro: '13 de Setembro', zona: '1ª', secoes: '053 a 065', eleitoresAproximado: 4800 },
      { nome: 'Escola Estadual Professora Maria das Dores Brasil', bairro: 'Raiar do Sol', zona: '5ª', secoes: '136 a 148', eleitoresAproximado: 4900 },
      { nome: 'Escola Municipal Maria Teresa Maciel', bairro: 'Jardim Floresta', zona: '1ª', secoes: '066 a 075', eleitoresAproximado: 3600 }
    ]
  },
  {
    id: 'rorainopolis',
    name: 'Rorainópolis',
    zona: '8ª Zona Eleitoral',
    aliases: ['rorainopolis', 'rorainópolis', 'região sul - rorainópolis'],
    bairros: ['Centro', 'Campinarana', 'Nova Colina', 'Martins Pereira', 'Vila Equador', 'Vilhena', 'BR-174 Vicinais'],
    locaisVotacao: [
      { nome: 'Escola Estadual José de Alencar', bairro: 'Centro', zona: '8ª', secoes: '001 a 008', eleitoresAproximado: 2800 },
      { nome: 'Escola Estadual Antônia Matos', bairro: 'Campinarana', zona: '8ª', secoes: '009 a 015', eleitoresAproximado: 2100 }
    ]
  },
  {
    id: 'caracarai',
    name: 'Caracaraí',
    zona: '2ª Zona Eleitoral',
    aliases: ['caracarai', 'caracaraí'],
    bairros: ['Centro', 'Nossa Senhora do Livramento', 'Novo Paraíso', 'Vista Alegre', 'Petrolina', 'São Francisco'],
    locaisVotacao: [
      { nome: 'Escola Estadual José Antônio de Araújo', bairro: 'Centro', zona: '2ª', secoes: '001 a 010', eleitoresAproximado: 3100 }
    ]
  },
  {
    id: 'alto_alegre',
    name: 'Alto Alegre',
    zona: '3ª Zona Eleitoral',
    aliases: ['alto alegre'],
    bairros: ['Centro', 'Taiano', 'Paredão', 'Recreio', 'Saúba'],
    locaisVotacao: [
      { nome: 'Escola Estadual Sadoc Pereira', bairro: 'Centro', zona: '3ª', secoes: '001 a 007', eleitoresAproximado: 2200 }
    ]
  },
  {
    id: 'mucajai',
    name: 'Mucajaí',
    zona: '6ª Zona Eleitoral',
    aliases: ['mucajai', 'mucajaí'],
    bairros: ['Centro', 'Vila Apiaú', 'Tamandaré', 'Nova Olinda'],
    locaisVotacao: [
      { nome: 'Escola Estadual Padre José Monticone', bairro: 'Centro', zona: '6ª', secoes: '001 a 009', eleitoresAproximado: 2900 }
    ]
  },
  {
    id: 'canta',
    name: 'Cantá',
    zona: '5ª Zona Eleitoral',
    aliases: ['canta', 'cantá'],
    bairros: ['Centro', 'Vila de Serra da Moça', 'Felix Pinto', 'Agrovila das Antas', 'Vila Brasil', 'Santa Rita'],
    locaisVotacao: [
      { nome: 'Escola Estadual Professor do Carmo', bairro: 'Centro', zona: '5ª', secoes: '001 a 008', eleitoresAproximado: 2600 }
    ]
  },
  {
    id: 'bonfim',
    name: 'Bonfim',
    zona: '7ª Zona Eleitoral',
    aliases: ['bonfim'],
    bairros: ['Centro', 'Vila Vilhena', 'Manoel da Silva', 'São Francisco'],
    locaisVotacao: [
      { nome: 'Escola Estadual Senador Dinarte Mariz', bairro: 'Centro', zona: '7ª', secoes: '001 a 006', eleitoresAproximado: 2000 }
    ]
  },
  {
    id: 'pacaraima',
    name: 'Pacaraima',
    zona: '7ª Zona Eleitoral',
    aliases: ['pacaraima'],
    bairros: ['Centro', 'Suapi', 'Vila Nova', 'Comunidade Surumu'],
    locaisVotacao: [
      { nome: 'Escola Estadual Cícero Vieira Neto', bairro: 'Centro', zona: '7ª', secoes: '001 a 008', eleitoresAproximado: 2700 }
    ]
  },
  {
    id: 'amajari',
    name: 'Amajari',
    zona: '7ª Zona Eleitoral',
    aliases: ['amajari'],
    bairros: ['Centro', 'Vila Brasil', 'Tepequém', 'Guariba'],
    locaisVotacao: [
      { nome: 'Escola Estadual Ovídio Dias de Souza', bairro: 'Centro', zona: '7ª', secoes: '001 a 005', eleitoresAproximado: 1800 }
    ]
  },
  {
    id: 'normandia',
    name: 'Normandia',
    zona: '7ª Zona Eleitoral',
    aliases: ['normandia'],
    bairros: ['Centro', 'Raposa Serra do Sol', 'Guará'],
    locaisVotacao: [
      { nome: 'Escola Estadual Mariano Vieira', bairro: 'Centro', zona: '7ª', secoes: '001 a 005', eleitoresAproximado: 1700 }
    ]
  },
  {
    id: 'iracema',
    name: 'Iracema',
    zona: '6ª Zona Eleitoral',
    aliases: ['iracema'],
    bairros: ['Centro', 'Campos Novos', 'Vila Auaris'],
    locaisVotacao: [
      { nome: 'Escola Estadual Dom Ap レー nio', bairro: 'Centro', zona: '6ª', secoes: '001 a 005', eleitoresAproximado: 1600 }
    ]
  },
  {
    id: 'uiramuta',
    name: 'Uiramutã',
    zona: '7ª Zona Eleitoral',
    aliases: ['uiramuta', 'uiramutã'],
    bairros: ['Centro', 'Água Fria', 'Flexal', 'Pedra Branca'],
    locaisVotacao: [
      { nome: 'Escola Estadual Indígena Júlio Gusmão', bairro: 'Centro', zona: '7ª', secoes: '001 a 004', eleitoresAproximado: 1400 }
    ]
  },
  {
    id: 'caroebe',
    name: 'Caroebe',
    zona: '8ª Zona Eleitoral',
    aliases: ['caroebe'],
    bairros: ['Centro', 'Entre Rios', 'Vila Entre Rios'],
    locaisVotacao: [
      { nome: 'Escola Estadual Professora Maria de Lourdes', bairro: 'Centro', zona: '8ª', secoes: '001 a 006', eleitoresAproximado: 2100 }
    ]
  },
  {
    id: 'sao_joao_da_baliza',
    name: 'São João da Baliza',
    zona: '8ª Zona Eleitoral',
    aliases: ['sao joao da baliza', 'são joão da baliza', 'baliza'],
    bairros: ['Centro', 'Vicinal 22', 'Vicinal 23'],
    locaisVotacao: [
      { nome: 'Escola Estadual Francisco Ricardo', bairro: 'Centro', zona: '8ª', secoes: '001 a 005', eleitoresAproximado: 1900 }
    ]
  },
  {
    id: 'sao_luiz',
    name: 'São Luiz',
    zona: '8ª Zona Eleitoral',
    aliases: ['sao luiz', 'são luiz', 'sao luiz do anaua', 'são luiz do anauá'],
    bairros: ['Centro', 'Vicinal 01', 'Vicinal 02'],
    locaisVotacao: [
      { nome: 'Escola Estadual João Rodrigues', bairro: 'Centro', zona: '8ª', secoes: '001 a 004', eleitoresAproximado: 1500 }
    ]
  }
];

// Helper Function: Strip accents/diacritics and normalize string
export function normalizeLoc(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Helper Function: Check if a given regional coordinator / team location matches a goal location
export function isLocationMatchingGoal(
  goalLocationName: string,
  coordRegion: string = '',
  coordSubLocations: string = ''
): boolean {
  if (!goalLocationName) return false;

  const normGoal = normalizeLoc(goalLocationName);
  const normRegion = normalizeLoc(coordRegion);
  const normSubs = normalizeLoc(coordSubLocations);

  if (!normGoal) return false;

  // 1. Direct Substring Check
  if (normRegion.includes(normGoal) || normGoal.includes(normRegion) && normRegion.length > 2) return true;
  if (normSubs.includes(normGoal)) return true;

  // 2. Abbreviation Alias Matching (e.g. "bv" <-> "boa vista")
  if (
    (normGoal === 'boa vista' || normGoal === 'bv') &&
    (normRegion.includes('bv') || normRegion.includes('boa vista') || normSubs.includes('bv') || normSubs.includes('boa vista'))
  ) {
    return true;
  }

  // 3. Check TRE-RR Roraima Municipality & Neighborhood Hierarchy
  const matchedMuni = RORAIMA_MUNICIPALITIES.find(m => {
    const normMuniName = normalizeLoc(m.name);
    return normMuniName === normGoal || m.aliases.some(a => normalizeLoc(a) === normGoal);
  });

  if (matchedMuni) {
    // Check if coord region or subLocations contain any of the municipality's aliases
    const hasAliasMatch = matchedMuni.aliases.some(alias => {
      const normAlias = normalizeLoc(alias);
      return normRegion.includes(normAlias) || normSubs.includes(normAlias);
    });
    if (hasAliasMatch) return true;

    // Check if coord region or subLocations contain any of the municipality's neighborhoods
    const hasBairroMatch = matchedMuni.bairros.some(bairro => {
      const normBairro = normalizeLoc(bairro);
      if (normBairro.length < 3) return false; // skip tiny tokens
      return normRegion.includes(normBairro) || normSubs.includes(normBairro);
    });
    if (hasBairroMatch) return true;
  }

  // 4. Reverse Check: If goalLocation is a specific Bairro (e.g., "Centro", "Pintolândia")
  for (const muni of RORAIMA_MUNICIPALITIES) {
    const matchedBairro = muni.bairros.find(b => normalizeLoc(b) === normGoal);
    if (matchedBairro) {
      if (normRegion.includes(normGoal) || normSubs.includes(normGoal)) return true;
    }
  }

  // 5. Token overlap check (for strings with comma or hyphen separation like "Centro, Mecejana, 31 de Março")
  const goalTokens = normGoal.split(/[\s,.-]+/).filter(t => t.length > 2);
  const targetText = `${normRegion} ${normSubs}`;
  const tokenMatch = goalTokens.some(token => targetText.includes(token));
  
  return tokenMatch;
}
