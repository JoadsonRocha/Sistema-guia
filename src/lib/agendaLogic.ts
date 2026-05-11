/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MATRIZ DE DISTÂNCIAS E TEMPOS - ROTEIRIZADOR AMAZÔNICO (Bloco 4.1)
 * Estimativas em HORAS considerando a realidade das estradas de Roraima.
 * Nota: Alguns trajetos (ex: Uiramutã) consideram vicinais de terra e relevo.
 */
export const TEMPOS_VIAGEM: Record<string, Record<string, number>> = {
  "Boa Vista": {
    "Pacaraima": 3,
    "Rorainópolis": 4.5,
    "Uiramutã": 6,
    "Cantá": 0.8,
    "Alto Alegre": 1.5,
    "Mucajaí": 1,
    "Amajari": 2.5,
    "Bonfim": 2,
    "Normandia": 3.5,
    "Caracaraí": 2.5,
    "Iracema": 1.5,
    "Boa Vista": 0.5 // Deslocamento interno
  },
  "Pacaraima": { "Boa Vista": 3, "Amajari": 2 },
  "Rorainópolis": { "Boa Vista": 4.5, "Caracaraí": 2, "São Luiz": 1.5 },
  "Uiramutã": { "Boa Vista": 6, "Normandia": 3 },
  "Cantá": { "Boa Vista": 0.8 },
  "Alto Alegre": { "Boa Vista": 1.5 },
  "São Luiz": { "Rorainópolis": 1.5, "São João da Baliza": 1 },
  "São João da Baliza": { "São Luiz": 1, "Caroebe": 0.5 },
  "Caroebe": { "São João da Baliza": 0.5 }
};

export interface AgendaItem {
  id?: string;
  municipio: string;
  hora_inicio: string; // Formato "HH:mm"
  hora_fim: string;    // Formato "HH:mm"
  data: string;        // Formato "YYYY-MM-DD"
}

/**
 * Converte string "HH:mm" em minutos totais do dia para cálculos matemáticos.
 */
const aMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Tenta encontrar o tempo de viagem entre dois pontos.
 * Se não houver rota direta na matriz, assume um tempo padrão ou passa por Boa Vista (Hub).
 */
const calcularTempoDeslocamento = (origem: string, destino: string): number => {
  if (origem === destino) return 0.5; // Deslocamento interno padrão (30 min)

  // Rota Direta
  if (TEMPOS_VIAGEM[origem]?.[destino]) return TEMPOS_VIAGEM[origem][destino];
  if (TEMPOS_VIAGEM[destino]?.[origem]) return TEMPOS_VIAGEM[destino][origem];

  // Rota via Boa Vista (Hub Central)
  const paraBVB = TEMPOS_VIAGEM[origem]?.["Boa Vista"] || TEMPOS_VIAGEM["Boa Vista"]?.[origem] || 3;
  const deBVB = TEMPOS_VIAGEM["Boa Vista"]?.[destino] || TEMPOS_VIAGEM[destino]?.["Boa Vista"] || 3;

  return paraBVB + deBVB;
};

/**
 * Função Core de Validação de Agenda e Logística
 */
export function validarSugestaoAgenda(
  novaAgenda: AgendaItem,
  agendasConfirmadas: AgendaItem[]
): { aprovada: boolean; motivo_recusa: string | null } {
  
  const hInicioNova = aMinutos(novaAgenda.hora_inicio);
  const hFimNova = aMinutos(novaAgenda.hora_fim);
  const MARGEM_SEGURANCA_MINUTOS = 30;

  // Filtrar agendas do mesmo dia e ordenar por horário
  const agendaDoDia = agendasConfirmadas
    .filter(a => a.data === novaAgenda.data)
    .sort((a, b) => aMinutos(a.hora_inicio) - aMinutos(b.hora_inicio));

  for (const confirmada of agendaDoDia) {
    const hInicioConf = aMinutos(confirmada.hora_inicio);
    const hFimConf = aMinutos(confirmada.hora_fim);

    // --- TRAVA 1: CHOQUE FÍSICO (SOBREPOSIÇÃO) ---
    // (Início da nova está dentro de uma confirmada) OU (Fim da nova está dentro de uma confirmada) 
    // OU (Nova engloba a confirmada)
    if (
      (hInicioNova >= hInicioConf && hInicioNova < hFimConf) ||
      (hFimNova > hInicioConf && hFimNova <= hFimConf) ||
      (hInicioNova <= hInicioConf && hFimNova >= hFimConf)
    ) {
      return { 
        aprovada: false, 
        motivo_recusa: `Choque de horário com agenda já confirmada em ${confirmada.municipio} (${confirmada.hora_inicio} às ${confirmada.hora_fim}).` 
      };
    }
  }

  // --- TRAVA 2: ROTEIRIZADOR AMAZÔNICO (LOGÍSTICA) ---
  // Encontrar o compromisso imediatamente anterior e posterior
  const anterior = [...agendaDoDia].reverse().find(a => aMinutos(a.hora_fim) <= hInicioNova);
  const posterior = agendaDoDia.find(a => aMinutos(a.hora_inicio) >= hFimNova);

  // Validar com o anterior
  if (anterior) {
    const horasViagem = calcularTempoDeslocamento(anterior.municipio, novaAgenda.municipio);
    const minutosNecessarios = (horasViagem * 60) + MARGEM_SEGURANCA_MINUTOS;
    const tempoDisponivel = hInicioNova - aMinutos(anterior.hora_fim);

    if (tempoDisponivel < minutosNecessarios) {
      return {
        aprovada: false,
        motivo_recusa: `Tempo de deslocamento insuficiente entre ${anterior.municipio} e ${novaAgenda.municipio}. São necessárias aprox. ${horasViagem}h de viagem (Vicinais/BRs).`
      };
    }
  }

  // Validar com o posterior
  if (posterior) {
    const horasViagem = calcularTempoDeslocamento(novaAgenda.municipio, posterior.municipio);
    const minutosNecessarios = (horasViagem * 60) + MARGEM_SEGURANCA_MINUTOS;
    const tempoDisponivel = aMinutos(posterior.hora_inicio) - hFimNova;

    if (tempoDisponivel < minutosNecessarios) {
      return {
        aprovada: false,
        motivo_recusa: `Logística impossível: Esta agenda impediria a chegada a tempo no compromisso seguinte em ${posterior.municipio}.`
      };
    }
  }

  return { aprovada: true, motivo_recusa: null };
}
