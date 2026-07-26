import { doc, getDoc, setDoc, getCountFromServer, collection, query, where } from 'firebase/firestore';
import { db } from './firebase';

export type PlanType = 'start' | 'comando' | 'dominio' | 'none';

export interface SubscriptionInfo {
  plan: PlanType;
  status: 'active' | 'canceled' | 'pending' | 'none';
  coordinatorEmail?: string;
  maxVoters: number;
  maxLeaders: number;
  expiresAt?: number;
}

export const PLAN_CONFIGS: Record<PlanType, { name: string; maxVoters: number; maxLeaders: number }> = {
  start: {
    name: 'Plano Start Tático',
    maxVoters: 2500,
    maxLeaders: 25,
  },
  comando: {
    name: 'Plano Comando Tático',
    maxVoters: 10000,
    maxLeaders: 100,
  },
  dominio: {
    name: 'Plano Domínio Total',
    maxVoters: Infinity,
    maxLeaders: Infinity,
  },
  none: {
    name: 'Sem Plano Ativo',
    maxVoters: 0,
    maxLeaders: 0,
  },
};

/**
 * Consulta as informações de assinatura do Coordenador Geral no Firestore.
 */
export async function getSubscriptionInfo(coordinatorId?: string): Promise<SubscriptionInfo> {
  try {
    const subDoc = await getDoc(doc(db, 'settings', 'subscription'));
    if (subDoc.exists()) {
      const data = subDoc.data();
      const plan: PlanType = (data.plan as PlanType) || 'none';
      const status = data.status || 'none';
      const config = PLAN_CONFIGS[plan] || PLAN_CONFIGS.none;

      return {
        plan,
        status: status === 'active' ? 'active' : 'none',
        coordinatorEmail: data.coordinatorEmail || '',
        maxVoters: config.maxVoters,
        maxLeaders: config.maxLeaders,
        expiresAt: data.expiresAt,
      };
    }

    const candDoc = await getDoc(doc(db, 'settings', 'candidate'));
    if (candDoc.exists()) {
      const data = candDoc.data();
      if (data.plan) {
        const plan: PlanType = (data.plan as PlanType) || 'none';
        const status = data.subscriptionStatus || 'active';
        const config = PLAN_CONFIGS[plan] || PLAN_CONFIGS.none;
        return {
          plan,
          status: status === 'active' ? 'active' : 'none',
          coordinatorEmail: data.coordinatorEmail || '',
          maxVoters: config.maxVoters,
          maxLeaders: config.maxLeaders,
        };
      }
    }
  } catch (error) {
    console.warn("Aviso ao buscar assinatura:", error);
  }

  // Padrão de demonstração padrão (Plano Comando Tático Ativo por padrão se ainda não configurado)
  return {
    plan: 'comando',
    status: 'active',
    maxVoters: PLAN_CONFIGS.comando.maxVoters,
    maxLeaders: PLAN_CONFIGS.comando.maxLeaders,
  };
}

/**
 * Salva ou atualiza a licença de uso da campanha.
 */
export async function saveSubscriptionPlan(
  plan: PlanType,
  status: 'active' | 'none' | 'canceled' = 'active',
  coordinatorEmail?: string
): Promise<void> {
  const payload = {
    plan,
    status,
    coordinatorEmail: coordinatorEmail || '',
    updatedAt: Date.now(),
  };

  await setDoc(doc(db, 'settings', 'subscription'), payload, { merge: true });
  await setDoc(doc(db, 'settings', 'candidate'), { plan, subscriptionStatus: status }, { merge: true });
}

/**
 * Valida se é possível realizar um novo cadastro de eleitor.
 */
export async function validateVoterRegistration(coordinatorId?: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
  planName?: string;
}> {
  const sub = await getSubscriptionInfo(coordinatorId);

  // 1. Bloqueio caso a campanha esteja marcada como sem plano ativo
  if (sub.status !== 'active' || sub.plan === 'none') {
    return {
      allowed: false,
      reason: 'A campanha atual não possui um plano ativo contratado para o Coordenador Geral. Regularize o plano na tela de licenças para habilitar novos cadastros de eleitores.',
      currentCount: 0,
      limit: 0,
      planName: 'Sem Plano Ativo',
    };
  }

  // 2. Se for plano ilimitado (Domínio Total)
  if (sub.maxVoters === Infinity) {
    return { allowed: true, planName: PLAN_CONFIGS[sub.plan].name };
  }

  // 3. Contagem total de eleitores cadastrados na campanha
  try {
    const votersColl = collection(db, 'voters');
    const q = coordinatorId && coordinatorId !== 'demo_coord_geral'
      ? query(votersColl, where('coordinatorId', '==', coordinatorId))
      : votersColl;
    
    const snap = await getCountFromServer(q);
    const totalVoters = snap.data().count;

    if (totalVoters >= sub.maxVoters) {
      return {
        allowed: false,
        reason: `Limite de cadastros atingido para o ${PLAN_CONFIGS[sub.plan].name} (${totalVoters.toLocaleString('pt-BR')} de ${sub.maxVoters.toLocaleString('pt-BR')} eleitores permitidos). Faça o upgrade da licença da campanha para liberar novos cadastros.`,
        currentCount: totalVoters,
        limit: sub.maxVoters,
        planName: PLAN_CONFIGS[sub.plan].name,
      };
    }

    return {
      allowed: true,
      currentCount: totalVoters,
      limit: sub.maxVoters,
      planName: PLAN_CONFIGS[sub.plan].name,
    };
  } catch (error) {
    console.warn("Erro ao verificar limite de eleitores:", error);
    return { allowed: true };
  }
}
