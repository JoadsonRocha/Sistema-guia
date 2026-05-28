/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Este módulo foi convertido em processamento local determinístico sem inteligência artificial (IA).
// Todas as chamadas à API do Gemini foram removidas para eliminar custos operacionais e dependência de serviços externos.

/**
 * Módulo "Organizador do Caos" (Bloco 4.3)
 * Processa textos ou áudios brutos do Coordenador de forma local e instantânea,
 * identificando palavras-chave estruturadas roraimenses de forma automatizada e determinística (Sem IA).
 */
export async function processarCaos(textoBruto: string) {
  if (!textoBruto || textoBruto.trim().length === 0) {
    throw new Error("Texto bruto está vazio.");
  }

  const logisticaKeywords = [
    "dinheiro", "combustível", "gasolina", "diesel", "carro", "veículo", 
    "gráfico", "adesivo", "comida", "comício", "estrutura", "pagar", 
    "comprar", "custo", "verba", "sefaz", "infraest", "pagamento", "recap"
  ];
  
  const politicaKeywords = [
    "reunião", "reunir", "falar", "ligar", "tuxaua", "líder", "liderança", 
    "apoiador", "conversar", "aliança", "acordo", "visitar", "comunidade", 
    "conversa", "candidato", "alianças", "vereador"
  ];
  
  const criseKeywords = [
    "crise", "problema", "ruim", "falta", "energia", "estrada", "lama", 
    "intransitável", "parado", "atrasado", "oposição", "ataque", "denúncia", 
    "urgente", "perigo", "risco", "reclam", "queixa", "atraso", "crítico"
  ];

  const municipiosRoraima = [
    "Boa Vista", "Rorainópolis", "Caracaraí", "Pacaraima", "Cantá", 
    "Mucajaí", "Alto Alegre", "Amajari", "Iracema", "Bonfim", 
    "Normandia", "Uiramutã", "São João da Baliza", "São Luiz", "Caroebe"
  ];

  const tarefas_logistica: string[] = [];
  const acoes_politicas: string[] = [];
  const alertas_crise: string[] = [];
  const sugestoes_agenda: { municipio: string, contexto: string }[] = [];

  // Dividir o texto em sentenças para processamento granular
  const sentences = textoBruto
    .split(/[.\n;!]/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    let categorized = false;

    // Detectar municípios do Roraima para formular sugestões de agenda
    for (const muni of municipiosRoraima) {
      if (lower.includes(muni.toLowerCase())) {
        sugestoes_agenda.push({
          municipio: muni,
          contexto: sentence
        });
        categorized = true;
      }
    }

    // Verificar se se encaixa em logística
    if (logisticaKeywords.some(kw => lower.includes(kw))) {
      tarefas_logistica.push(sentence);
      categorized = true;
    }

    // Verificar alertas de crise
    if (criseKeywords.some(kw => lower.includes(kw))) {
      alertas_crise.push(sentence);
      categorized = true;
    }

    // Verificar ações políticas estratégicas
    if (politicaKeywords.some(kw => lower.includes(kw))) {
      acoes_politicas.push(sentence);
      categorized = true;
    }

    // Back-off inteligente para sentenças não categorizadas
    if (!categorized) {
      if (lower.includes("r$") || lower.includes("reais") || lower.includes("pagar") || lower.includes("custo")) {
        tarefas_logistica.push(sentence);
      } else {
        acoes_politicas.push(sentence);
      }
    }
  }

  // Fallbacks estratégicos dinâmicos para prover uma interface limpa e rica
  if (tarefas_logistica.length === 0) {
    tarefas_logistica.push("Revisar custos de logística geral da área mencionada nos informes.");
  }
  if (acoes_politicas.length === 0) {
    acoes_politicas.push("Fazer acompanhamento local com as principais lideranças comunitárias da região.");
  }
  if (alertas_crise.length === 0) {
    alertas_crise.push("Nenhum sinalizador crítico ou risco sensível identificado nas anotações.");
  }
  if (sugestoes_agenda.length === 0) {
    // Tenta derivar o município geral ou sugere a capital
    sugestoes_agenda.push({
      municipio: "Boa Vista",
      contexto: "Agendar alinhamento estratégico central com a coordenação de campanha."
    });
  }

  return {
    tarefas_logistica,
    acoes_politicas,
    alertas_crise,
    sugestoes_agenda
  };
}

/**
 * Módulo "Anotação Rápida"
 * Transforma transcrições de áudio informais em notas de campo limpas e estruturadas (Sem IA).
 */
export async function processarNotaAudio(textoBruto: string) {
  if (!textoBruto || textoBruto.trim().length === 0) {
    throw new Error("Conteúdo da nota vazio.");
  }

  let text = textoBruto.trim();

  // Destaques estruturais locais do ecossistema de Roraima
  const localTermsToHighlight = [
    { regex: /tuxaua(s)?/gi, replace: "Tuxaua$1" },
    { regex: /lavrado/gi, replace: "Lavrado" },
    { regex: /maloca(s)?/gi, replace: "Maloca$1" },
    { regex: /vicinal(ais)?/gi, replace: "Vicinal$1" },
    { regex: /sefaz/gi, replace: "SEFAZ" }
  ];

  const municipios = [
    "Boa Vista", "Rorainópolis", "Caracaraí", "Pacaraima", "Cantá", 
    "Mucajaí", "Alto Alegre", "Amajari", "Iracema", "Bonfim", 
    "Normandia", "Uiramutã", "São João da Baliza", "São Luiz", "Caroebe"
  ];

  for (const term of localTermsToHighlight) {
    text = text.replace(term.regex, `**${term.replace}**`);
  }

  for (const m of municipios) {
    const reg = new RegExp(`\\b${m}\\b`, "gi");
    text = text.replace(reg, `**${m}**`);
  }

  // Remove vícios de linguagem comuns de áudios
  text = text
    .replace(/\b(tipo assim|né|tá|daí|entendeu|tipo|ahh+|ehh+)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length > 0) {
    // Normalizar capitalização inicial
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  return `📝 **Nota de Campo Estruturada:**\n${text}`;
}

/**
 * Gera um briefing estratégico regional para o candidato com base em demandas reais (Sem IA).
 * Carrega inteligência por perfil regionalizado do município solicitado.
 */
export async function gerarBriefingCandidato(municipio: string, demandas: any[]) {
  if (!municipio) {
    throw new Error("Município não especificado.");
  }

  const normalizedMuni = municipio.trim();
  
  // Banco estratégico local mapeado para cada região do estado de Roraima
  const muniProfiles: { [key: string]: { priority: string; avoid: string; voice: string } } = {
    "Pacaraima": {
      priority: "Foco no apoio ao microcomércio local, facilitação alfandegária e suporte ao atendimento emergencial de saúde fronteiriça.",
      avoid: "Evitar discursos inflamados sobre fronteiras federais ou prometer repasses imediatos fora da competência estadual.",
      voice: "Diplomático, resoluto e extremamente atento ao comércio."
    },
    "Uiramutã": {
      priority: "Apoio estrutural ao etnodesenvolvimento, respeito e escuta de conselhos Tuxauas nas Malocas, e manutenção crítica da estrada principal.",
      avoid: "Evitar prometer intervenção direta em áreas de reserva indígena demarcadas ou incentivar atividades não-regulamentadas.",
      voice: "Respeitoso, integrador, focado na consulta e na valorização das lideranças."
    },
    "Cantá": {
      priority: "Agilizar cascalhamento de vicinais de escoamento agrícola, melhoria de pontes e incentivo à produção hortifruti.",
      avoid: "Evitar prazos inexequíveis para pavimentação completa sem dotação orçamentária definida pelo Estado.",
      voice: "Próximo à produção, focado na infraestrutura rural e direto ao ponto."
    },
    "Rorainópolis": {
      priority: "Fomentar o comércio central como metrópole do Sul, apoiar o polo de saúde regional e fortalecer canais de ensino técnico-profissionalizante.",
      avoid: "Evitar focar o discurso meramente em Boa Vista; exaltar a independência e pujança regional de Rorainópolis.",
      voice: "Altivo, focado em governança, crescimento econômico e infraestrutura."
    },
    "Bonfim": {
      priority: "Explorar o potencial de ligação comercial física com Lethem (Guiana), incentivo à pecuária do lavrado de fronteira e fomento agroindustrial.",
      avoid: "Evitar propostas que dependam inteiramente de tratados internacionais e acordos bilaterais de governos federais.",
      voice: "Comercial, focado em parcerias produtivas e visionário regional."
    },
    "Amajari": {
      priority: "Apoiar a infraestrutura sustentável do polo de turismo do Tepequém, melhorias no atendimento médico local e agricultura familiar indígena.",
      avoid: "Não acender debates de polêmicas ambientais locais; priorizar caminhos de fomento turístico pacificados.",
      voice: "Inspirador, cuidadoso com o meio ambiente e focado em turismo sustentável."
    }
  };

  const defaultProfile = {
    priority: "Fortalecimento das estradas vicinais para escoamento da agricultura familiar, conservação de pontes e regionalização dos serviços de saúde básica.",
    avoid: "Não se comprometer com grandes repasses imediatos sem análise interna de despesas públicas estaduais.",
    voice: "Humilde, focado na escuta qualificada das lideranças locais e determinado nas prioridades de campo."
  };

  const profile = muniProfiles[normalizedMuni] || defaultProfile;

  // Processamento e formatação dinâmica de demandas locais enviadas pelas equipes
  const demandLines = demandas && demandas.length > 0 
    ? demandas.map(d => `• **${d.title || "Demanda"}**: ${d.description || "Sem detalhes adicionais"} [Status: ${d.status || "Pendente"}]`).join("\n")
    : "• Nenhuma demanda emergencial ou urgente pendente de mapeamento estratégico no painel local.";

  const briefing = `### 🦅 BRIEFING DE INTELIGÊNCIA ESTRATÉGICA: ${normalizedMuni.toUpperCase()}

#### 1. O QUE FALAR (Pautas Recomendadas)
• **Demandas Territoriais Coletadas no Painel**:
${demandLines}
• **Foco Regionalizado**: ${profile.priority}
• **Visibilidade de Base**: Agradecer nominalmente as equipes e líderes locais que mapearam as necessidades locais de forma ativa.

#### 2. RISCOS (O que EVITAR falar no palanque ou reuniões)
• **Cuidado de Visita**: ${profile.avoid}
• **Abordagem**: Evitar debates demagógicos em torno de problemas crônicos estatais; propor cronograma de vistoria e parcerias exequíveis.

#### 3. TOM DE VOZ E POSTURA INDICADOS
• **Estilo**: ${profile.voice}
• **Dica de Campo**: Escute a liderança da Maloca ou da Associação Rural antes da fala formal. Demonstre domínio das ruas citando as demandas reais registradas acima.`;

  return briefing;
}
