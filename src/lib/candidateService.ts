import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

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

export const candidateService = {
  async getCandidateInfo(coordinatorId?: string): Promise<CandidateInfo> {
    try {
      const docKey = coordinatorId ? `candidate_${coordinatorId}` : 'candidate';
      const snap = await getDoc(doc(db, 'settings', docKey));
      if (snap.exists()) {
        const data = snap.data();
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
    } catch (error) {
      console.warn("Aviso ao buscar configurações do candidato no Firestore:", error);
    }
    return DEFAULT_CANDIDATE_INFO;
  },

  async saveCandidateInfo(info: CandidateInfo, userId?: string, coordinatorId?: string): Promise<void> {
    const payload = {
      ...info,
      updatedAt: Date.now(),
      updatedBy: userId || 'coordenador_geral'
    };
    const docKey = coordinatorId ? `candidate_${coordinatorId}` : 'candidate';
    await setDoc(doc(db, 'settings', docKey), payload, { merge: true });
  },

  subscribeCandidateInfo(callback: (info: CandidateInfo) => void, coordinatorId?: string) {
    const docKey = coordinatorId ? `candidate_${coordinatorId}` : 'candidate';
    return onSnapshot(doc(db, 'settings', docKey), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
          name: data.name || DEFAULT_CANDIDATE_INFO.name,
          title: data.title || DEFAULT_CANDIDATE_INFO.title,
          photoUrl: data.photoUrl || DEFAULT_CANDIDATE_INFO.photoUrl,
          bio: data.bio || DEFAULT_CANDIDATE_INFO.bio,
          badgeTitle: data.badgeTitle || DEFAULT_CANDIDATE_INFO.badgeTitle,
          subtitle: data.subtitle || DEFAULT_CANDIDATE_INFO.subtitle,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        });
      } else {
        callback(DEFAULT_CANDIDATE_INFO);
      }
    }, (error) => {
      console.warn("Erro no listener de dados do candidato:", error);
      callback(DEFAULT_CANDIDATE_INFO);
    });
  }
};
