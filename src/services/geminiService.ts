/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Este módulo foi atualizado para consumir a API de Inteligência Artificial de forma segura
// através do backend (server.ts), não expondo mais a GEMINI_API_KEY no cliente.

export async function processarCaos(textoBruto: string) {
  if (!textoBruto || textoBruto.trim().length === 0) {
    throw new Error("Texto bruto está vazio.");
  }

  const response = await fetch('/api/ai/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: textoBruto, type: 'caos' })
  });

  if (!response.ok) {
    throw new Error('Erro ao processar IA no backend.');
  }

  return response.json();
}

export async function processarNotaAudio(textoBruto: string) {
  if (!textoBruto || textoBruto.trim().length === 0) {
    throw new Error("Conteúdo da nota vazio.");
  }

  const response = await fetch('/api/ai/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: textoBruto, type: 'nota' })
  });

  if (!response.ok) {
    throw new Error('Erro ao processar IA no backend.');
  }

  const data = await response.json();
  return data.text;
}

export async function gerarBriefingCandidato(municipio: string, demandas: any[]) {
  if (!municipio) {
    throw new Error("Município não especificado.");
  }

  const response = await fetch('/api/ai/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: '', type: 'briefing', context: { municipio, demandas } })
  });

  if (!response.ok) {
    throw new Error('Erro ao processar IA no backend.');
  }

  const data = await response.json();
  return data.text;
}
