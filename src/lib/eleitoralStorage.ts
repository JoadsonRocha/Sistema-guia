// Utility for high-capacity IndexedDB storage for TRE electoral spreadsheet data

const DB_NAME = 'SistemaUrna360_TRE_DB';
const DB_VERSION = 1;
const STORE_NAME = 'tre_locations';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export const eleitoralStorage = {
  async saveLocations(coordinatorId: string, locations: any[]): Promise<void> {
    if (!coordinatorId) return;
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(locations, `sistema_urna360_eleitoral_data_${coordinatorId}`);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn("IndexedDB save warning, falling back to localStorage:", e);
      try {
        localStorage.setItem(`sistema_urna360_eleitoral_data_${coordinatorId}`, JSON.stringify(locations));
      } catch (err) {}
    }
  },

  async loadLocations(coordinatorId: string): Promise<any[] | null> {
    if (!coordinatorId) return null;
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(`sistema_urna360_eleitoral_data_${coordinatorId}`);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      try {
        const saved = localStorage.getItem(`sistema_urna360_eleitoral_data_${coordinatorId}`);
        return saved ? JSON.parse(saved) : null;
      } catch (err) {
        return null;
      }
    }
  },

  async clearLocations(coordinatorId: string): Promise<void> {
    if (!coordinatorId) return;
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(`sistema_urna360_eleitoral_data_${coordinatorId}`);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch (e) {}
    try {
      localStorage.removeItem(`sistema_urna360_eleitoral_data_${coordinatorId}`);
    } catch (e) {}
  }
};
