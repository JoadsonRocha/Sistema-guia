import { supabaseService } from './supabaseService';

interface FirestoreServiceLike {
  getDocument<T = unknown>(collection: string, id: string): Promise<T | null>;
  getCollection<T = unknown>(collection: string): Promise<T[]>;
  getCollectionFiltered<T = unknown>(collection: string, coordinatorId: string): Promise<T[]>;
  setDocument<T = unknown>(collection: string, id: string, data: T): Promise<void>;
  updateDocument<T = unknown>(collection: string, id: string, data: Partial<T>): Promise<void>;
  deleteDocument(collection: string, id: string): Promise<void>;
  subscribeToCollection<T = unknown>(collection: string, callback: (data: T[]) => void): () => void;
  subscribeToCollectionFiltered<T = unknown>(collection: string, coordinatorId: string, callback: (data: T[]) => void): () => void;
}

const fallbackService: FirestoreServiceLike = {
  async getDocument() {
    return null;
  },
  async getCollection() {
    return [];
  },
  async getCollectionFiltered() {
    return [];
  },
  async setDocument() {},
  async updateDocument() {},
  async deleteDocument() {},
  subscribeToCollection() {
    return () => undefined;
  },
  subscribeToCollectionFiltered() {
    return () => undefined;
  },
};

const service = (supabaseService as unknown as FirestoreServiceLike) || fallbackService;

export const firestoreService: FirestoreServiceLike = new Proxy(service, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof value === 'function') {
      return async (...args: unknown[]) => {
        try {
          return await value.apply(target, args);
        } catch (error) {
          console.warn('Firestore fallback engaged:', error);
          return fallbackService[prop as keyof FirestoreServiceLike](...(args as never[]));
        }
      };
    }
    return value;
  },
});

export * from './supabaseService';
