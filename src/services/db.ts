/**
 * IndexedDB Persistence Service for BritConnect Platform
 * Guarantees that datasets, cleaned data, models, scores, campaigns,
 * and chat history survive page reloads and browser restarts.
 */

import {
  RawCustomerRecord,
  CleanedCustomerRecord,
  TrainedModelSummary,
  CampaignRecord,
  CleaningActionLog,
  BusinessAssumptions,
  DatasetVersionMeta,
} from '../types/telecom';

const DB_NAME = 'BritConnect_Intelligence_DB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export async function getDb(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('appState')) {
        db.createObjectStore('appState', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('rawDataset')) {
        db.createObjectStore('rawDataset', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cleanedDataset')) {
        db.createObjectStore('cleanedDataset', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('datasetVersions')) {
        db.createObjectStore('datasetVersions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('models')) {
        db.createObjectStore('models', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('campaigns')) {
        db.createObjectStore('campaigns', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('chatHistory')) {
        db.createObjectStore('chatHistory', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cleaningLog')) {
        db.createObjectStore('cleaningLog', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('rejectedRows')) {
        db.createObjectStore('rejectedRows', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Generic KV getter / setter in appState
export async function setAppState<T>(key: string, value: T): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('appState', 'readwrite');
    const store = tx.objectStore('appState');
    store.put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAppState<T>(key: string): Promise<T | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('appState', 'readonly');
    const store = tx.objectStore('appState');
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

// Raw Dataset Store
export async function saveRawDataset(records: RawCustomerRecord[]): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rawDataset', 'readwrite');
    const store = tx.objectStore('rawDataset');
    store.clear();
    for (const record of records) {
      const id = record['Customer ID'] || record.id || `ROW-${Math.random()}`;
      store.put({ id, ...record });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getRawDataset(): Promise<RawCustomerRecord[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rawDataset', 'readonly');
    const store = tx.objectStore('rawDataset');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Cleaned Dataset Store
export async function saveCleanedDataset(records: CleanedCustomerRecord[]): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cleanedDataset', 'readwrite');
    const store = tx.objectStore('cleanedDataset');
    store.clear();
    for (const record of records) {
      store.put(record);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCleanedDataset(): Promise<CleanedCustomerRecord[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cleanedDataset', 'readonly');
    const store = tx.objectStore('cleanedDataset');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Dataset Versions
export async function saveDatasetVersion(version: DatasetVersionMeta): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('datasetVersions', 'readwrite');
    const store = tx.objectStore('datasetVersions');
    store.put(version);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDatasetVersions(): Promise<DatasetVersionMeta[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('datasetVersions', 'readonly');
    const store = tx.objectStore('datasetVersions');
    const req = store.getAll();
    req.onsuccess = () => {
      const list = req.result || [];
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

// Trained Models
export async function saveTrainedModel(model: TrainedModelSummary): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('models', 'readwrite');
    const store = tx.objectStore('models');
    store.put(model);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getTrainedModels(): Promise<TrainedModelSummary[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('models', 'readonly');
    const store = tx.objectStore('models');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Campaigns
export async function saveCampaign(campaign: CampaignRecord): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('campaigns', 'readwrite');
    const store = tx.objectStore('campaigns');
    store.put(campaign);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCampaigns(): Promise<CampaignRecord[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('campaigns', 'readonly');
    const store = tx.objectStore('campaigns');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Cleaning Log
export async function saveCleaningLogs(logs: CleaningActionLog[]): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cleaningLog', 'readwrite');
    const store = tx.objectStore('cleaningLog');
    store.clear();
    for (const log of logs) {
      store.put(log);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCleaningLogs(): Promise<CleaningActionLog[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cleaningLog', 'readonly');
    const store = tx.objectStore('cleaningLog');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Rejected Rows
export async function saveRejectedRows(rows: { rowData: any; reason: string; timestamp: string }[]): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rejectedRows', 'readwrite');
    const store = tx.objectStore('rejectedRows');
    for (const r of rows) {
      store.put(r);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getRejectedRows(): Promise<any[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rejectedRows', 'readonly');
    const store = tx.objectStore('rejectedRows');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Chat History
export async function saveChatMessage(msg: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string; toolResults?: any }): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chatHistory', 'readwrite');
    const store = tx.objectStore('chatHistory');
    store.put(msg);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getChatHistory(): Promise<any[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chatHistory', 'readonly');
    const store = tx.objectStore('chatHistory');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function clearChatHistory(): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chatHistory', 'readwrite');
    const store = tx.objectStore('chatHistory');
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Complete wipe of all IndexedDB tables
export async function wipeAllData(): Promise<void> {
  const db = await getDb();
  const stores = ['appState', 'rawDataset', 'cleanedDataset', 'datasetVersions', 'models', 'campaigns', 'chatHistory', 'cleaningLog', 'rejectedRows'];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, 'readwrite');
    stores.forEach((s) => tx.objectStore(s).clear());
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Business Assumptions Defaults
export const DEFAULT_BUSINESS_ASSUMPTIONS: BusinessAssumptions = {
  costPerContact: 15, // £15 per contact
  expectedSaveRate: 25, // 25% save rate
  averageMarginPercent: 70, // 70% gross margin
  planningHorizonMonths: 12, // 12-month value horizon
  criticalRiskCutoff: 0.70, // 70%+
  highRiskCutoff: 0.50, // 50-69%
  mediumRiskCutoff: 0.30, // 30-49%
  referenceDate: '2026-11-07',
};
