export async function generateCampaignInsights(tseData: any, baseData: any) {
  const systemPrompt = `Você é um Estrategista Político de Dados Sênior. 
Sua tarefa é comparar os dados oficiais do TSE com a base de eleitores cadastrados na campanha e fornecer insights táticos.
Regras:
1. Comece com um diagnóstico demográfico: A campanha está focando no público certo?
2. Aponte discrepâncias (ex: "O TSE diz que 55% da Zona X são mulheres, mas nossa base só tem 30%").
3. Sugira uma ação prática para os Cabos Eleitorais corrigirem a rota.
4. Formatação Markdown limpa com bullet points curtos e precisos.`;

  const userMessage = `Dados Demográficos do TSE:\n${JSON.stringify(tseData, null, 2)}\n\nNossa Base Cadastrada:\n${JSON.stringify(baseData, null, 2)}\n\nAnalise as lacunas e gere o plano de ação.`;

  return callGroq(systemPrompt, userMessage, 800);
}
