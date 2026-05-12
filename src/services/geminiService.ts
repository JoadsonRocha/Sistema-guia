/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

// Use a safe wrapper for the API key to avoid crashing the whole app if process is not defined
const getApiKey = () => {
    try {
        return process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
    } catch {
        return "";
    }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

/**
 * Módulo "Organizador do Caos" (Bloco 4.3)
 * Processa textos ou áudios brutos do Coordenador utilizando a inteligência regionalizada.
 */
export async function processarCaos(textoBruto: string) {
  if (!textoBruto || textoBruto.trim().length === 0) {
    throw new Error("Texto bruto está vazio.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: textoBruto,
      config: {
        systemInstruction: `
          Você é um assistente estratégico sênior de uma campanha política para Deputado Estadual em Roraima (Brasil).
          Sua missão é atuar como o "Organizador do Caos", transformando relatos informais, áudios transcritos e anotações apressadas do Coordenador Geral em tarefas e inteligência acionável.

          DICIONÁRIO DE CONTEXTO RORAIMENSE (Crucial para precisão):
          - Tuxaua: Líder de comunidade indígena.
          - Lavrado: Ecossistema de savana típico de Roraima.
          - Maloca: Construção ou moradia em comunidade indígena.
          - Vicinais: Estradas de terra secundárias que ligam a zona rural (ex: Vicinal 1, Vicinal 26).
          - SEFAZ: Secretaria da Fazenda (frequentemente citada em logística de combustível ou impostos).
          - Garimpo / Garimpeiro: Termo frequente na dinâmica econômica local.
          - Municípios: Boa Vista, Rorainópolis, Caracaraí, Pacaraima, Cantá, Mucajaí, Alto Alegre, Amajari, Iracema, Bonfim, Normandia, Uiramutã, São João da Baliza, São Luiz, Caroebe.

          REGRAS DE EXTRAÇÃO:
          1. Tarefas de Logística: Tudo relacionado a dinheiro, combustível, material gráfico, veículos ou estrutura.
          2. Ações Políticas: Reuniões estratégicas, ligações para lideranças, promessas de campanha ou acordos.
          3. Alertas de Crise: Problemas graves (falta de energia, estradas intransitáveis, insatisfação de grupos, ataques da oposição).
          4. Sugestões de Agenda: Propostas de viagens ou visitas aos municípios citados no texto.

          Sua resposta deve ser ESTRITAMENTE um objeto JSON conforme o schema definido.
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tarefas_logistica: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de tarefas financeiras ou de combustível extraídas"
            },
            acoes_politicas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Ligar para pessoas, agendar reuniões, acordos políticos"
            },
            alertas_crise: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Riscos detectados, insatisfações ou problemas operacionais"
            },
            sugestoes_agenda: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  municipio: { type: Type.STRING },
                  contexto: { type: Type.STRING, description: "O que deve ser feito ou discutido lá" }
                },
                required: ["municipio", "contexto"]
              }
            }
          },
          required: ["tarefas_logistica", "acoes_politicas", "alertas_crise", "sugestoes_agenda"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Sinal fraco. A IA não conseguiu processar o seu relato agora.");
    }

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Erro no Organizador do Caos:", error);
    throw new Error("Sinal fraco. A IA não conseguiu processar o seu áudio agora. Tente em instantes.");
  }
}
