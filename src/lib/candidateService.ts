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

const CACHE_KEY = 'nexus_candidate_info_cache';

function getLocalCache(): CandidateInfo | null {
  try {
    const item = localStorage.getItem(CACHE_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      if (parsed && parsed.name && parsed.name !== DEFAULT_CANDIDATE_INFO.name) {
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

function isCustomData(info: CandidateInfo): boolean {
  return (
    (info.name && info.name !== DEFAULT_CANDIDATE_INFO.name) ||
    (info.title && info.title !== DEFAULT_CANDIDATE_INFO.title) ||
    (info.photoUrl && info.photoUrl !== DEFAULT_CANDIDATE_INFO.photoUrl)
  );
}

export const candidateService = {
  async getCandidateInfo(coordinatorId?: string): Promise<CandidateInfo> {
    try {
      if (coordinatorId) {
        const snapCoord = await getDoc(doc(db, 'settings', `candidate_${coordinatorId}`));
        if (snapCoord.exists()) {
          const info = extractCandidateData(snapCoord.data());
          if (isCustomData(info)) {
            setLocalCache(info);
            return info;
          }
        }
      }

      const snapGlobal = await getDoc(doc(db, 'settings', 'candidate'));
      if (snapGlobal.exists()) {
        const info = extractCandidateData(snapGlobal.data());
        if (isCustomData(info)) {
          setLocalCache(info);
          return info;
        }
      }

      const cached = getLocalCache();
      if (cached) return cached;
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

    setLocalCache(payload);

    try {
      // Save master candidate doc
      await setDoc(doc(db, 'settings', 'candidate'), payload, { merge: true });

      // Save specific candidate doc for coordinatorId
      if (coordinatorId) {
        await setDoc(doc(db, 'settings', `candidate_${coordinatorId}`), payload, { merge: true });
      }

      // Save specific candidate doc for userId if different
      if (userId && userId !== coordinatorId) {
        await setDoc(doc(db, 'settings', `candidate_${userId}`), payload, { merge: true });
      }
    } catch (e) {
      console.error("Erro ao salvar dados do candidato no Firestore:", e);
      throw e;
    }
  },

  subscribeCandidateInfo(callback: (info: CandidateInfo) => void, coordinatorId?: string) {
    let specificInfo: CandidateInfo | null = null;
    let globalInfo: CandidateInfo | null = null;

    const emitCurrent = () => {
      if (specificInfo && isCustomData(specificInfo)) {
        setLocalCache(specificInfo);
        callback(specificInfo);
        return;
      }
      if (globalInfo && isCustomData(globalInfo)) {
        setLocalCache(globalInfo);
        callback(globalInfo);
        return;
      }
      if (specificInfo) {
        callback(specificInfo);
        return;
      }
      if (globalInfo) {
        callback(globalInfo);
        return;
      }
      const cached = getLocalCache();
      if (cached) {
        callback(cached);
        return;
      }
      callback(DEFAULT_CANDIDATE_INFO);
    };

    // Global listener
    const unsubGlobal = onSnapshot(
      doc(db, 'settings', 'candidate'),
      (snap) => {
        if (snap.exists()) {
          globalInfo = extractCandidateData(snap.data());
        } else {
          globalInfo = null;
        }
        emitCurrent();
      },
      (err) => {
        console.warn("Aviso no listener global do candidato:", err);
        emitCurrent();
      }
    );

    let unsubSpecific: (() => void) | null = null;
    if (coordinatorId) {
      unsubSpecific = onSnapshot(
        doc(db, 'settings', `candidate_${coordinatorId}`),
        (snap) => {
          if (snap.exists()) {
            specificInfo = extractCandidateData(snap.data());
          } else {
            specificInfo = null;
          }
          emitCurrent();
        },
        (err) => {
          console.warn("Aviso no listener específico do candidato:", err);
          emitCurrent();
        }
      );
    }

    return () => {
      unsubGlobal();
      if (unsubSpecific) unsubSpecific();
    };
  }
};
