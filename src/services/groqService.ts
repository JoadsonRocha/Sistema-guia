/**
 * Serviço de Integração com a API Groq para Inteligência Tática.
 * Responsável por conectar o painel ao modelo Llama 3 70B para sugestões de metas.
 */

export async function sugerirMetaInteligente(municipio: string, targetVoters: string | number, context: any) {
  if (!municipio) {
    throw new Error("Localidade não especificada para a IA.");
  }

  const response = await fetch('/api/groq/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ municipio, targetVoters, context })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao processar IA no backend.');
  }

  return response.json();
}

export async function analisarRaioXEquipe(context: any) {
  const response = await fetch('/api/groq/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'raio-x-equipe', context })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao processar IA no backend.');
  }

  return response.json();
}
