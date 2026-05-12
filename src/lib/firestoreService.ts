import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  FirestoreError,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let rawError = error instanceof FirestoreError ? `${error.code}: ${error.message}` : String(error);
  let errorMessage = rawError;
  
  // Tradução amigável
  if (rawError.includes('permission-denied') || rawError.includes('insufficient permissions')) {
    errorMessage = `Acesso Negado (Firebase: ${rawError}). Operação: ${operationType}, Path: ${path}.`;
  }

  const errInfo: FirestoreErrorInfo = {
    error: rawError,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Erro detalhado no Firestore: ', JSON.stringify(errInfo));
  
  // No caso de LIST (assinaturas) ou GET (leituras iniciais), não jogamos erro para não dar tela branca
  if (operationType !== OperationType.WRITE && operationType !== OperationType.UPDATE && operationType !== OperationType.DELETE) {
    console.warn("Falha silenciosa em leitura para evitar crash.");
    return;
  }

  throw new Error(errorMessage);
}

export const firestoreService = {
  async getCollection<T>(path: string): Promise<T[]> {
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getDocument<T>(path: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, path, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${path}/${id}`);
      return null;
    }
  },

  async setDocument(path: string, id: string, data: any, merge: boolean = true) {
    try {
      await setDoc(doc(db, path, id), data, { merge });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${id}`);
    }
  },

  async updateDocument(path: string, id: string, data: any) {
    try {
      await updateDoc(doc(db, path, id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
    }
  },
  
  async deleteDocument(path: string, id: string) {
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
    }
  },

  subscribeToCollection<T>(path: string, callback: (data: T[]) => void) {
    const q = collection(db, path);
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      callback(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};
