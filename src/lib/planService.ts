import { doc, getDoc, setDoc, getCountFromServer, collection, query, where } from 'firebase/firestore';
import { db } from './firebase';

export type PlanType = 'free' | 'start' | 'comando' | 'dominio' | 'none';

export interface SubscriptionInfo {
  plan: PlanType;
  status: 'active' | 'canceled' | 'pending' | 'none';
  coordinatorEmail?: string;
  maxVoters: number;
  maxLeaders: number;
  maxRegionals: number;
  maxGeneralCoordinators: number;
  expiresAt?: number;
}

export const PLAN_CONFIGS: Record<PlanType, { 
  name: string; 
  price: string;
  maxVoters: number; 
  maxLeaders: number; 
  maxRegionals: number;
  maxGeneralCoordinators: number;
}> = {
  free: {
    name: 'Plano Grátis (Degustação)',
    price: 'Grátis',
    maxVoters: 7,
    maxLeaders: 2,
    maxRegionals: 2,
    maxGeneralCoordinators: 1,
  },
  start: {
    name: 'Plano Start Tático',
    price: 'R$ 490/mês',
    maxVoters: 2500,
    maxLeaders: 25,
    maxRegionals: 25,
    maxGeneralCoordinators: 1,
  },
  comando: {
    name: 'Plano Comando Tático',
    price: 'R$ 1.290/mês',
    maxVoters: 10000,
    maxLeaders: 100,
    maxRegionals: 100,
    maxGeneralCoordinators: 1,
  },
  dominio: {
    name: 'Plano Domínio Total',
    price: 'R$ 2.490/mês',
    maxVoters: Infinity,
    maxLeaders: Infinity,
    maxRegionals: Infinity,
    maxGeneralCoordinators: Infinity,
  },
  none: {
    name: 'Sem Plano Ativo',
    price: 'Inativo',
    maxVoters: 0,
    maxLeaders: 0,
    maxRegionals: 0,
    maxGeneralCoordinators: 0,
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
      const plan: PlanType = (data.plan as PlanType) || 'free';
      const status = data.status || 'active';
      const config = PLAN_CONFIGS[plan] || PLAN_CONFIGS.free;

      return {
        plan,
        status: status === 'active' ? 'active' : 'none',
        coordinatorEmail: data.coordinatorEmail || '',
        maxVoters: config.maxVoters,
        maxLeaders: config.maxLeaders,
        maxRegionals: config.maxRegionals,
        maxGeneralCoordinators: config.maxGeneralCoordinators,
        expiresAt: data.expiresAt,
      };
    }

    const candDoc = await getDoc(doc(db, 'settings', 'candidate'));
    if (candDoc.exists()) {
      const data = candDoc.data();
      if (data.plan) {
        const plan: PlanType = (data.plan as PlanType) || 'free';
        const status = data.subscriptionStatus || 'active';
        const config = PLAN_CONFIGS[plan] || PLAN_CONFIGS.free;
        return {
          plan,
          status: status === 'active' ? 'active' : 'none',
          coordinatorEmail: data.coordinatorEmail || '',
          maxVoters: config.maxVoters,
          maxLeaders: config.maxLeaders,
          maxRegionals: config.maxRegionals,
          maxGeneralCoordinators: config.maxGeneralCoordinators,
        };
      }
    }
  } catch (error) {
    console.warn("Aviso ao buscar assinatura:", error);
  }

  // Padrão de entrada: Plano Grátis (Degustação)
  return {
    plan: 'free',
    status: 'active',
    maxVoters: PLAN_CONFIGS.free.maxVoters,
    maxLeaders: PLAN_CONFIGS.free.maxLeaders,
    maxRegionals: PLAN_CONFIGS.free.maxRegionals,
    maxGeneralCoordinators: PLAN_CONFIGS.free.maxGeneralCoordinators,
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
 * Dispara aviso de limite e redireciona à página de aquisição de planos SOMENTE se for o Coordenador Geral.
 */
export function triggerUpgradeRedirect(reason: string, isCoordenadorGeral: boolean = false) {
  if (isCoordenadorGeral) {
    alert(`🚨 LIMITE DE CADASTROS DO PLANO ATINGIDO (COORDENADOR GERAL):\n\n${reason}\n\nVocê será redirecionado para a página de apresentação dos planos para escolher e adquirir a licença da sua campanha.`);
    window.dispatchEvent(new CustomEvent('open_sales_landing', { detail: { reason } }));
    setTimeout(() => {
      const el = document.getElementById('planos');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  } else {
    alert(`⚠️ LIMITE DO PLANO DA CAMPANHA ATINGIDO:\n\n${reason}\n\nO limite do plano grátis/atual da sua campanha foi atingido. Por favor, solicite ao Coordenador Geral da campanha que adquira um dos planos para liberar novos cadastros.`);
  }
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

  if (sub.status !== 'active' || sub.plan === 'none') {
    return {
      allowed: false,
      reason: 'A campanha atual não possui um plano ativo contratado para o Coordenador Geral. Regularize o plano na página de planos para habilitar novos cadastros de eleitores.',
      currentCount: 0,
      limit: 0,
      planName: 'Sem Plano Ativo',
    };
  }

  if (sub.maxVoters === Infinity) {
    return { allowed: true, planName: PLAN_CONFIGS[sub.plan].name };
  }

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
        reason: `Você atingiu o limite máximo de ${sub.maxVoters} eleitores do seu ${PLAN_CONFIGS[sub.plan].name}. O cadastro do 8º eleitor (ou seguinte) exige o upgrade da sua licença.`,
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

/**
 * Valida se é possível cadastrar uma nova Equipe / Líder.
 */
export async function validateLeaderRegistration(coordinatorId?: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
  planName?: string;
}> {
  const sub = await getSubscriptionInfo(coordinatorId);

  if (sub.status !== 'active' || sub.plan === 'none') {
    return {
      allowed: false,
      reason: 'A campanha atual não possui um plano ativo contratado. Regularize seu plano para cadastrar novas equipes e líderes.',
    };
  }

  if (sub.maxLeaders === Infinity) {
    return { allowed: true, planName: PLAN_CONFIGS[sub.plan].name };
  }

  try {
    const teamsColl = collection(db, 'teams');
    const q = coordinatorId && coordinatorId !== 'demo_coord_geral'
      ? query(teamsColl, where('coordinatorId', '==', coordinatorId))
      : teamsColl;

    const snap = await getCountFromServer(q);
    const totalLeaders = snap.data().count;

    if (totalLeaders >= sub.maxLeaders) {
      return {
        allowed: false,
        reason: `Você atingiu o limite máximo de ${sub.maxLeaders} líderes/equipes do seu ${PLAN_CONFIGS[sub.plan].name}. O cadastro da 3ª equipe exige o upgrade para um plano superior.`,
        currentCount: totalLeaders,
        limit: sub.maxLeaders,
        planName: PLAN_CONFIGS[sub.plan].name,
      };
    }

    return {
      allowed: true,
      currentCount: totalLeaders,
      limit: sub.maxLeaders,
      planName: PLAN_CONFIGS[sub.plan].name,
    };
  } catch (error) {
    console.warn("Erro ao verificar limite de líderes:", error);
    return { allowed: true };
  }
}

/**
 * Valida se é possível cadastrar um novo Coordenador Regional.
 */
export async function validateRegionalRegistration(coordinatorId?: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
  planName?: string;
}> {
  const sub = await getSubscriptionInfo(coordinatorId);

  if (sub.status !== 'active' || sub.plan === 'none') {
    return {
      allowed: false,
      reason: 'A campanha atual não possui um plano ativo contratado. Regularize seu plano para cadastrar novos coordenadores regionais.',
    };
  }

  if (sub.maxRegionals === Infinity) {
    return { allowed: true, planName: PLAN_CONFIGS[sub.plan].name };
  }

  try {
    const regionalsColl = collection(db, 'regional_coordinators');
    const q = coordinatorId && coordinatorId !== 'demo_coord_geral'
      ? query(regionalsColl, where('coordinatorId', '==', coordinatorId))
      : regionalsColl;

    const snap = await getCountFromServer(q);
    const totalRegionals = snap.data().count;

    if (totalRegionals >= sub.maxRegionals) {
      return {
        allowed: false,
        reason: `Você atingiu o limite máximo de ${sub.maxRegionals} coordenadores regionais do seu ${PLAN_CONFIGS[sub.plan].name}. O cadastro do 3º coordenador regional exige o upgrade para um plano superior.`,
        currentCount: totalRegionals,
        limit: sub.maxRegionals,
        planName: PLAN_CONFIGS[sub.plan].name,
      };
    }

    return {
      allowed: true,
      currentCount: totalRegionals,
      limit: sub.maxRegionals,
      planName: PLAN_CONFIGS[sub.plan].name,
    };
  } catch (error) {
    console.warn("Erro ao verificar limite de regionais:", error);
    return { allowed: true };
  }
}

/**
 * Valida se é possível cadastrar um novo Coordenador Geral na tela de login/registro.
 */
export async function validateGeneralCoordinatorRegistration(): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
  planName?: string;
}> {
  const sub = await getSubscriptionInfo();

  if (sub.maxGeneralCoordinators === Infinity) {
    return { allowed: true, planName: PLAN_CONFIGS[sub.plan].name };
  }

  try {
    const usersColl = collection(db, 'users');
    const q1 = query(usersColl, where('role', '==', 'coordenador_geral'));
    const q2 = query(usersColl, where('role', '==', 'coordenador'));

    const [snap1, snap2] = await Promise.all([
      getCountFromServer(q1),
      getCountFromServer(q2)
    ]);

    const totalGeneral = snap1.data().count + snap2.data().count;

    if (totalGeneral >= sub.maxGeneralCoordinators) {
      return {
        allowed: false,
        reason: `A campanha já possui ${totalGeneral} Coordenador Geral cadastrado (o primeiro cadastro obrigatório). O cadastro de novos coordenadores gerais exige um plano ilimitado.`,
        currentCount: totalGeneral,
        limit: sub.maxGeneralCoordinators,
        planName: PLAN_CONFIGS[sub.plan].name,
      };
    }

    return {
      allowed: true,
      currentCount: totalGeneral,
      limit: sub.maxGeneralCoordinators,
      planName: PLAN_CONFIGS[sub.plan].name,
    };
  } catch (error) {
    console.warn("Erro ao verificar limite de coordenador geral:", error);
    return { allowed: true };
  }
}

