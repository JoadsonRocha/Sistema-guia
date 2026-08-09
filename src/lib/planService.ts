import { supabaseService } from './supabaseService';

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
    price: 'R$ 379/mês',
    maxVoters: 2500,
    maxLeaders: 25,
    maxRegionals: 25,
    maxGeneralCoordinators: 1,
  },
  comando: {
    name: 'Plano Comando Tático',
    price: 'R$ 679/mês',
    maxVoters: 10000,
    maxLeaders: 100,
    maxRegionals: 100,
    maxGeneralCoordinators: 1,
  },
  dominio: {
    name: 'Plano Domínio Total',
    price: 'R$ 850/mês',
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

export async function getSubscriptionInfo(coordinatorId?: string): Promise<SubscriptionInfo> {
  try {
    const subDoc = await supabaseService.getDocument<any>('settings', 'subscription');
    if (subDoc) {
      const plan: PlanType = (subDoc.plan as PlanType) || 'free';
      const status = subDoc.status || 'active';
      const config = PLAN_CONFIGS[plan] || PLAN_CONFIGS.free;

      return {
        plan,
        status: status === 'active' ? 'active' : 'none',
        coordinatorEmail: subDoc.coordinatorEmail || '',
        maxVoters: config.maxVoters ?? Infinity,
        maxLeaders: config.maxLeaders ?? Infinity,
        maxRegionals: config.maxRegionals ?? Infinity,
        maxGeneralCoordinators: config.maxGeneralCoordinators ?? Infinity,
        expiresAt: subDoc.expiresAt,
      };
    }

    const candDoc = await supabaseService.getDocument<any>('settings', 'candidate');
    if (candDoc && candDoc.plan) {
      const plan: PlanType = (candDoc.plan as PlanType) || 'free';
      const status = candDoc.subscriptionStatus || 'active';
      const config = PLAN_CONFIGS[plan] || PLAN_CONFIGS.free;
      return {
        plan,
        status: status === 'active' ? 'active' : 'none',
        coordinatorEmail: candDoc.coordinatorEmail || '',
        maxVoters: config.maxVoters ?? Infinity,
        maxLeaders: config.maxLeaders ?? Infinity,
        maxRegionals: config.maxRegionals ?? Infinity,
        maxGeneralCoordinators: config.maxGeneralCoordinators ?? Infinity,
      };
    }
  } catch (error) {
    console.warn("Aviso ao buscar assinatura:", error);
  }

  return {
    plan: 'free',
    status: 'active',
    maxVoters: PLAN_CONFIGS.free.maxVoters,
    maxLeaders: PLAN_CONFIGS.free.maxLeaders,
    maxRegionals: PLAN_CONFIGS.free.maxRegionals,
    maxGeneralCoordinators: PLAN_CONFIGS.free.maxGeneralCoordinators,
  };
}

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

  await supabaseService.setDocument('settings', 'subscription', payload, true);
  await supabaseService.setDocument('settings', 'candidate', { plan, subscriptionStatus: status }, true);
}

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
      reason: 'A campanha atual não possui um plano ativo contratado para o Coordenador Geral.',
      currentCount: 0,
      limit: 0,
      planName: 'Sem Plano Ativo',
    };
  }

  if (sub.maxVoters === Infinity) {
    return { allowed: true, planName: PLAN_CONFIGS[sub.plan].name };
  }

  try {
    const totalVoters = await supabaseService.getCount('voters', coordinatorId);

    if (totalVoters >= sub.maxVoters) {
      return {
        allowed: false,
        reason: `Você atingiu o limite máximo de ${sub.maxVoters} eleitores do seu ${PLAN_CONFIGS[sub.plan].name}.`,
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

  if (!sub.maxLeaders || sub.maxLeaders === Infinity || sub.plan === 'dominio') {
    return { allowed: true, planName: PLAN_CONFIGS[sub.plan]?.name || 'Plano Domínio' };
  }

  try {
    const totalLeaders = await supabaseService.getCount('teams', coordinatorId);

    if (totalLeaders >= sub.maxLeaders) {
      return {
        allowed: false,
        reason: `Você atingiu o limite máximo de ${sub.maxLeaders} líderes/equipes do seu ${PLAN_CONFIGS[sub.plan].name}.`,
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
      reason: 'A campanha atual não possui um plano ativo contratado.',
    };
  }

  if (!sub.maxRegionals || sub.maxRegionals === Infinity || sub.plan === 'dominio') {
    return { allowed: true, planName: PLAN_CONFIGS[sub.plan]?.name || 'Plano Domínio' };
  }

  try {
    const totalRegionals = await supabaseService.getCount('regional_coordinators', coordinatorId);

    if (totalRegionals >= sub.maxRegionals) {
      return {
        allowed: false,
        reason: `Você atingiu o limite máximo de ${sub.maxRegionals} coordenadores regionais do seu ${PLAN_CONFIGS[sub.plan].name}.`,
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
    const users = await supabaseService.getCollection<any>('users');
    const totalGeneral = users.filter(u => u.role === 'coordenador_geral' || u.role === 'coordenador').length;

    if (totalGeneral >= sub.maxGeneralCoordinators) {
      return {
        allowed: false,
        reason: `A campanha já possui ${totalGeneral} Coordenador Geral cadastrado.`,
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
