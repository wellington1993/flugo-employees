import { generateUUID } from '@/helpers/uuid'

export interface QueuedMutation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_DELETE';
  collection: 'staffs' | 'departments';
  data: any;
  options?: any;
  timestamp: number;
}

export class OfflineQueue {
  private static readonly DB_NAME = 'flugo_offline_db';
  private static readonly STORE_NAME = 'mutations';
  private static readonly VERSION = 1;

  private static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async add(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): Promise<string> {
    const id = generateUUID();
    const timestamp = Date.now();
    const item: QueuedMutation = { ...mutation, id, timestamp };

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(item);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  static async getAll(): Promise<QueuedMutation[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async remove(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
