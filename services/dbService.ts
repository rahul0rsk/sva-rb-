
import { mockClients, mockTasks, mockInteractions, mockUsers, mockActivityLogs, mockCommitments, mockTeams, mockDocuments } from '../data/mockData';

const DB_NAME = 'sva-loan-crm-db';
const DB_VERSION = 1;
const STORE_NAMES = ['clients', 'tasks', 'interactions', 'users', 'teams', 'activityLogs', 'commitments', 'documents'] as const;
type StoreName = typeof STORE_NAMES[number];

const mockDataMap: { [key in StoreName]: any[] } = {
    clients: mockClients,
    tasks: mockTasks,
    interactions: mockInteractions,
    users: mockUsers,
    teams: mockTeams,
    activityLogs: mockActivityLogs,
    commitments: mockCommitments,
    documents: mockDocuments,
};

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening database:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      STORE_NAMES.forEach(storeName => {
        if (!dbInstance.objectStoreNames.contains(storeName)) {
          dbInstance.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };
  });
};

const seedData = async (dbInstance: IDBDatabase) => {
    return new Promise<void>((resolve, reject) => {
        const transaction = dbInstance.transaction(STORE_NAMES as any, 'readonly');
        const store = transaction.objectStore('clients');
        const countRequest = store.count();

        countRequest.onsuccess = () => {
            if (countRequest.result === 0) {
                console.log('Database is empty. Seeding with mock data...');
                const writeTransaction = dbInstance.transaction(STORE_NAMES as any, 'readwrite');
                writeTransaction.onerror = () => reject(writeTransaction.error);
                writeTransaction.oncomplete = () => {
                    console.log('Seeding complete.');
                    resolve();
                };

                STORE_NAMES.forEach(storeName => {
                    const objectStore = writeTransaction.objectStore(storeName);
                    mockDataMap[storeName].forEach(item => objectStore.put(item));
                });
            } else {
                resolve();
            }
        };
        countRequest.onerror = () => reject(countRequest.error);
    });
}

export const initDB = async (): Promise<void> => {
    const dbInstance = await openDB();
    await seedData(dbInstance);
};

const performTransaction = <T>(
    storeName: StoreName,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest
): Promise<T> => {
    return new Promise(async (resolve, reject) => {
        if (!db) return reject('Database not initialized');
        
        try {
            const transaction = db.transaction(storeName, mode);
            transaction.onerror = () => reject(transaction.error);
            
            const store = transaction.objectStore(storeName);
            const request = operation(store);
            
            request.onsuccess = () => resolve(request.result as T);
            request.onerror = () => reject(request.error);
        } catch(error) {
            reject(error);
        }
    });
};

export const getAll = <T>(storeName: StoreName): Promise<T[]> => {
    return performTransaction<T[]>(storeName, 'readonly', store => store.getAll());
};

export const add = <T>(storeName: StoreName, item: T): Promise<IDBValidKey> => {
    return performTransaction<IDBValidKey>(storeName, 'readwrite', store => store.add(item));
};

export const put = <T>(storeName: StoreName, item: T): Promise<IDBValidKey> => {
    return performTransaction<IDBValidKey>(storeName, 'readwrite', store => store.put(item));
};

export const deleteItem = (storeName: StoreName, id: string): Promise<void> => {
    return performTransaction<void>(storeName, 'readwrite', store => store.delete(id));
};

export const bulkAdd = async <T>(storeName: StoreName, items: T[]): Promise<void> => {
    return new Promise(async(resolve, reject) => {
        if(!db) return reject('DB not init');
        const tx = db.transaction(storeName, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        const store = tx.objectStore(storeName);
        items.forEach(item => store.add(item));
    });
};

export const bulkPut = async <T>(storeName: StoreName, items: T[]): Promise<void> => {
    return new Promise(async(resolve, reject) => {
        if(!db) return reject('DB not init');
        const tx = db.transaction(storeName, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        const store = tx.objectStore(storeName);
        items.forEach(item => store.put(item));
    });
};

export const clearDB = async (): Promise<void> => {
    return new Promise(async(resolve, reject) => {
        if(!db) return reject('DB not init');
        const tx = db.transaction(STORE_NAMES as any, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        STORE_NAMES.forEach(storeName => {
            tx.objectStore(storeName).clear();
        });
    });
}
