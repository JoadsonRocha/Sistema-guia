/**
 * Serviço de Integração com a API Groq para Inteligência Tática.
 * Responsável por conectar o painel ao modelo Llama 3 para sugestões e análises.
 * 
 * NOTA: Esta implementação direta via Client-side exige que a chave VITE_GROQ_API_KEY
 * esteja no .env. Use com cautela.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant'; // Modelo atual recomendado pela Groq

// Helper to make the API call
async function callGroq(systemPrompt: string, userMessage: string, maxTokens = 800) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("Chave da API da Groq (VITE_GROQ_API_KEY) não encontrada. Configure no arquivo .env.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Erro ao processar I.A. Verifique sua chave da Groq.');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function gerarMensagemWhatsApp(contexto: string, publicoAlvo: string, candidatoNome: string) {
  const systemPrompt = `Você é um Copywriter Estrategista Político de elite. Seu objetivo é escrever mensagens de WhatsApp altamente persuasivas, humanas e engajadoras para mobilização de eleitores na campanha de ${candidatoNome}.
Regras:
1. Seja direto, caloroso e convincente.
2. Use formatação do WhatsApp (negrito com asteriscos *, itálico com _).
3. Use emojis estrategicamente (mas sem exageros).
4. O texto deve parecer ter sido escrito por um humano, sem cara de "robô".
5. Retorne APENAS o texto da mensagem, sem explicações extras.`;

  const userMessage = `Público Alvo: ${publicoAlvo}\n\nObjetivo/Contexto da Mensagem: ${contexto}\n\nEscreva a mensagem ideal para enviar no WhatsApp agora.`;

  return callGroq(systemPrompt, userMessage, 500);
}

export async function analisarRaioXEquipe(equipeData: any) {
  const systemPrompt = `Você é o Chefe de Estratégia de uma campanha política. Sua função é ler os dados numéricos de um Líder de Equipe (Cabo Eleitoral) e fornecer um diagnóstico rápido e direto de como ele pode melhorar ou manter a mobilização.
Regras:
1. Seja extremamente conciso (máximo de 3 parágrafos curtos).
2. Use tom encorajador, porém técnico.
3. Sugira uma ação prática (ex: visita domiciliar, panfletagem no bairro específico, reunião).
4. Retorne APENAS a análise, sem saudações genéricas.`;

  const userMessage = `Dados da Equipe:\n${JSON.stringify(equipeData, null, 2)}\n\nFaça o diagnóstico e sugira o próximo passo.`;

  return callGroq(systemPrompt, userMessage, 400);
}

export async function gerarOrdemDoDia(dadosCampanha: any) {
  const systemPrompt = `Você é o Diretor Tático de uma campanha política. Toda manhã, você lê o panorama geral e dita a "Ordem do Dia" para o Coordenador Geral do comitê.
Regras:
1. Seja inspirador, estratégico e vá direto ao ponto.
2. Formate como um "Briefing Matinal".
3. Destaque quais regiões/bairros merecem atenção baseando-se nos dados pendentes ou metas atrasadas.
4. Tamanho: Máximo de 4 parágrafos curtos ou bullet points.`;

  const userMessage = `Resumo de Hoje:\n${JSON.stringify(dadosCampanha, null, 2)}\n\nEscreva o briefing estratégico para hoje.`;

  return callGroq(systemPrompt, userMessage, 600);
}

export async function sugerirMetaInteligente(municipio: string, targetVoters: string | number, context: any) {
  const systemPrompt = `Você é um Cientista Político focado em estatísticas de mobilização.`;
  const userMessage = `Município: ${municipio}\nAlvo: ${targetVoters}\nContexto: ${JSON.stringify(context)}\nQual a meta ideal de conversões diárias? (Seja breve e direto).`;
  
  return callGroq(systemPrompt, userMessage, 300);
}
