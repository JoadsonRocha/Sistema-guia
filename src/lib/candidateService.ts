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
  name: 'Soldado Sampaio',
  title: 'Governador do Estado de Roraima',
  photoUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=600',
  bio: 'Soldado Sampaio – Governador do Estado de Roraima Francisco dos Santos Sampaio, conhecido como Soldado Sampaio, nasceu em 12 de maio de 1976, em Pedreiras, Maranhão. Filho de agricultores, desde cedo aprendeu o valor do trabalho e da dedicação com a comunidade.',
  badgeTitle: 'Faça Parte do Nosso Projeto! 🎉',
  subtitle: 'Preencha o formulário abaixo e ajude a construir um futuro melhor para nossa comunidade. Seus dados estão seguros e protegidos.'
};

export const candidateService = {
  async getCandidateInfo(): Promise<CandidateInfo> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'candidate'));
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

  async saveCandidateInfo(info: CandidateInfo, userId?: string): Promise<void> {
    const payload = {
      ...info,
      updatedAt: Date.now(),
      updatedBy: userId || 'coordenador_geral'
    };
    await setDoc(doc(db, 'settings', 'candidate'), payload, { merge: true });
  },

  subscribeCandidateInfo(callback: (info: CandidateInfo) => void) {
    return onSnapshot(doc(db, 'settings', 'candidate'), (snap) => {
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
