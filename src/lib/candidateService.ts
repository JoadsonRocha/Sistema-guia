import { supabaseService } from './supabaseService';

export interface CandidateInfo {
  id?: string;
  name: string;
  title: string; // Cargo / Função (Deputado Estadual, Deputado Federal, Senador, Governador, etc.)
  photoUrl: string;
  bio: string;
  proposals?: string;
  badgeTitle?: string;
  subtitle?: string;
  updatedAt?: number;
  updatedBy?: string;
}

export const DEFAULT_CANDIDATE_INFO: CandidateInfo = {
  id: 'default_deputado',
  name: 'Seu Candidato',
  title: 'Deputado Estadual',
  photoUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=600',
  bio: 'Seja bem-vindo à nossa campanha eleitoral.',
  proposals: '• Saúde com atendimento ágil e exames zerados\n• Educação estruturada e valorização dos professores\n• Apoio ao comércio, empreendedorismo e geração de empregos\n• Segurança comunitária e infraestrutura nos bairros',
  badgeTitle: 'Faça Parte do Nosso Projeto! 🎉',
  subtitle: 'Preencha o formulário abaixo e ajude a construir o nosso projeto. Seus dados estão seguros e protegidos.'
};

const CACHE_KEY_LIST = 'nexus_candidates_list_cache';

function getLocalCacheList(): CandidateInfo[] {
  try {
    const item = localStorage.getItem(CACHE_KEY_LIST);
    if (item) {
      const parsed = JSON.parse(item);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return [DEFAULT_CANDIDATE_INFO];
}

function setLocalCacheList(candidates: CandidateInfo[]) {
  try {
    localStorage.setItem(CACHE_KEY_LIST, JSON.stringify(candidates));
  } catch (e) {
    // ignore
  }
}

function normalizeTitle(title: string): string {
  return (title || '').trim().toLowerCase();
}

export const candidateService = {
  /**
   * Return all registered candidates for the campaign
   */
  async getCandidatesList(coordinatorId?: string): Promise<CandidateInfo[]> {
    try {
      if (coordinatorId) {
        const docCoord = await supabaseService.getDocument<any>('settings', `candidates_${coordinatorId}`);
        if (docCoord && Array.isArray(docCoord.list) && docCoord.list.length > 0) {
          setLocalCacheList(docCoord.list);
          return docCoord.list;
        }
      }

      const docGlobal = await supabaseService.getDocument<any>('settings', 'candidates_list');
      if (docGlobal && Array.isArray(docGlobal.list) && docGlobal.list.length > 0) {
        setLocalCacheList(docGlobal.list);
        return docGlobal.list;
      }

      const cached = getLocalCacheList();
      if (cached && cached.length > 0) return cached;
    } catch (error) {
      console.warn("Aviso ao buscar lista de candidatos:", error);
    }
    return [DEFAULT_CANDIDATE_INFO];
  },

  /**
   * Return the primary/selected candidate or fallback
   */
  async getCandidateInfo(coordinatorId?: string): Promise<CandidateInfo> {
    const list = await this.getCandidatesList(coordinatorId);
    return list[0] || DEFAULT_CANDIDATE_INFO;
  },

  /**
   * Add or update a candidate in the campaign.
   * Enforces uniqueness: cannot register 2 candidates for the exact same cargo!
   */
  async saveCandidate(candidate: CandidateInfo, userId?: string, coordinatorId?: string): Promise<CandidateInfo[]> {
    const currentList = await this.getCandidatesList(coordinatorId);

    const normTitle = normalizeTitle(candidate.title);
    if (!normTitle) {
      throw new Error("O cargo / função do candidato é obrigatório.");
    }

    // Check if another candidate has the exact same cargo
    const candidateId = candidate.id || `cand_${Date.now()}`;
    const duplicate = currentList.find(c => c.id !== candidateId && normalizeTitle(c.title) === normTitle);

    if (duplicate) {
      throw new Error(`Já existe um candidato cadastrado para o cargo '${candidate.title}'. Não é permitido cadastrar mais de um candidato para o mesmo cargo.`);
    }

    const updatedCandidate: CandidateInfo = {
      ...candidate,
      id: candidateId,
      updatedAt: Date.now(),
      updatedBy: userId || 'coordenador_geral'
    };

    let newList: CandidateInfo[];
    const index = currentList.findIndex(c => c.id === candidateId);
    if (index >= 0) {
      newList = [...currentList];
      newList[index] = updatedCandidate;
    } else {
      newList = [updatedCandidate, ...currentList];
    }

    setLocalCacheList(newList);

    const payload = {
      list: newList,
      updatedAt: Date.now(),
      updatedBy: userId || 'coordenador_geral'
    };

    try {
      await supabaseService.setDocument('settings', 'candidates_list', payload, true);
      await supabaseService.setDocument('settings', 'candidate', updatedCandidate, true);

      if (coordinatorId) {
        await supabaseService.setDocument('settings', `candidates_${coordinatorId}`, payload, true);
        await supabaseService.setDocument('settings', `candidate_${coordinatorId}`, updatedCandidate, true);
      }
    } catch (e) {
      console.error("Erro ao salvar candidato no Supabase:", e);
    }

    return newList;
  },

  /**
   * Save single candidate (backward compatibility)
   */
  async saveCandidateInfo(info: CandidateInfo, userId?: string, coordinatorId?: string): Promise<void> {
    await this.saveCandidate(info, userId, coordinatorId);
  },

  /**
   * Delete a candidate by ID
   */
  async deleteCandidate(candidateId: string, userId?: string, coordinatorId?: string): Promise<CandidateInfo[]> {
    const currentList = await this.getCandidatesList(coordinatorId);
    const newList = currentList.filter(c => c.id !== candidateId);
    const final = newList.length > 0 ? newList : [DEFAULT_CANDIDATE_INFO];

    setLocalCacheList(final);

    const payload = {
      list: final,
      updatedAt: Date.now(),
      updatedBy: userId || 'coordenador_geral'
    };

    try {
      await supabaseService.setDocument('settings', 'candidates_list', payload, true);
      if (coordinatorId) {
        await supabaseService.setDocument('settings', `candidates_${coordinatorId}`, payload, true);
      }
    } catch (e) {
      console.error("Erro ao remover candidato:", e);
    }

    return final;
  },

  subscribeCandidateInfo(callback: (info: CandidateInfo) => void, coordinatorId?: string) {
    this.getCandidateInfo(coordinatorId).then(callback);

    const unsub = supabaseService.subscribeToCollection<any>('settings', () => {
      this.getCandidateInfo(coordinatorId).then(callback);
    });

    return unsub;
  },

  subscribeCandidatesList(callback: (list: CandidateInfo[]) => void, coordinatorId?: string) {
    this.getCandidatesList(coordinatorId).then(callback);

    const unsub = supabaseService.subscribeToCollection<any>('settings', () => {
      this.getCandidatesList(coordinatorId).then(callback);
    });

    return unsub;
  }
};
