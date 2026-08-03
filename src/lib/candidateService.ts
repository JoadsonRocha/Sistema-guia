import { firestoreService } from './firestoreService';

export interface CandidateInfo {
  name: string;
  title: string;
  photoUrl: string;
  bio: string;
  badgeTitle: string;
  subtitle: string;
  updatedAt?: number;
  updatedBy?: string;
}

export const DEFAULT_CANDIDATE_INFO: CandidateInfo = {
  name: 'Seu Candidato',
  title: 'Campanha Eleitoral',
  photoUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=600',
  bio: 'Seja bem-vindo à nossa campanha eleitoral.',
  badgeTitle: 'Faça Parte do Nosso Projeto! 🎉',
  subtitle: 'Preencha o formulário abaixo e ajude a construir o nosso projeto. Seus dados estão seguros e protegidos.'
};

const CACHE_KEY = 'nexus_candidate_info_cache';

function getLocalCache(): CandidateInfo | null {
  try {
    const item = localStorage.getItem(CACHE_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      if (parsed && parsed.name) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function setLocalCache(info: CandidateInfo) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(info));
  } catch (e) {
    // ignore
  }
}

function extractCandidateData(data: any): CandidateInfo {
  return {
    name: data.name || DEFAULT_CANDIDATE_INFO.name,
    title: data.title || DEFAULT_CANDIDATE_INFO.title,
    photoUrl: data.photoUrl || DEFAULT_CANDIDATE_INFO.photoUrl,
    bio: data.bio || DEFAULT_CANDIDATE_INFO.bio,
    badgeTitle: data.badgeTitle || DEFAULT_CANDIDATE_INFO.badgeTitle,
    subtitle: data.subtitle || DEFAULT_CANDIDATE_INFO.subtitle,
    updatedAt: data.updatedAt,
    updatedBy: data.updatedBy
  };
}

export const candidateService = {
  async getCandidateInfo(coordinatorId?: string): Promise<CandidateInfo> {
    try {
      if (coordinatorId) {
        const docCoord = await firestoreService.getDocument<any>('settings', `candidate_${coordinatorId}`);
        if (docCoord) {
          const info = extractCandidateData(docCoord);
          setLocalCache(info);
          return info;
        }
      }

      const docGlobal = await firestoreService.getDocument<any>('settings', 'candidate');
      if (docGlobal) {
        const info = extractCandidateData(docGlobal);
        setLocalCache(info);
        return info;
      }

      const cached = getLocalCache();
      if (cached) return cached;
    } catch (error) {
      console.warn("Aviso ao buscar configurações do candidato no Supabase:", error);
    }
    return DEFAULT_CANDIDATE_INFO;
  },

  async saveCandidateInfo(info: CandidateInfo, userId?: string, coordinatorId?: string): Promise<void> {
    const payload = {
      ...info,
      updatedAt: Date.now(),
      updatedBy: userId || 'coordenador_geral'
    };

    setLocalCache(payload);

    try {
      await firestoreService.setDocument('settings', 'candidate', payload, true);

      if (coordinatorId) {
        await firestoreService.setDocument('settings', `candidate_${coordinatorId}`, payload, true);
      }

      if (userId && userId !== coordinatorId) {
        await firestoreService.setDocument('settings', `candidate_${userId}`, payload, true);
      }
    } catch (e) {
      console.error("Erro ao salvar dados do candidato no Supabase:", e);
      throw e;
    }
  },

  subscribeCandidateInfo(callback: (info: CandidateInfo) => void, coordinatorId?: string) {
    this.getCandidateInfo(coordinatorId).then(callback);

    const unsub = firestoreService.subscribeToCollection<any>('settings', () => {
      this.getCandidateInfo(coordinatorId).then(callback);
    });

    return unsub;
  }
};
