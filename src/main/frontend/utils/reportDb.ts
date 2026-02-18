/**
 * IndexedDB persistence layer for reports.
 * Replaces the broken backend ReportStorageService with browser-local storage.
 */
import type { ReportDto, ReportMetadataDto } from '../types/reportTypes';

const DB_NAME = 'bmdexpress-reports';
const DB_VERSION = 1;
const STORE_NAME = 'reports';

let dbInstance: IDBDatabase | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      // Clear cached instance if the connection closes unexpectedly
      dbInstance.onclose = () => { dbInstance = null; };
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
    };
  });
}

export async function saveReport(report: ReportDto): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(report);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error(`Failed to save report: ${tx.error?.message}`));
  });
}

export async function loadReport(id: string): Promise<ReportDto | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as ReportDto | undefined);
    request.onerror = () => reject(new Error(`Failed to load report: ${request.error?.message}`));
  });
}

export async function listReports(): Promise<ReportMetadataDto[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      const reports = (request.result as ReportDto[])
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((r): ReportMetadataDto => ({
          id: r.id,
          title: r.title,
          projectId: r.projectId,
          templateName: r.templateName,
          sectionCount: r.sections.length,
          completionPercent: r.sections.length > 0
            ? Math.round(
                (r.sections.filter(s => s.status === 'final').length / r.sections.length) * 100,
              )
            : 0,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      resolve(reports);
    };
    request.onerror = () => reject(new Error(`Failed to list reports: ${request.error?.message}`));
  });
}

export async function deleteReport(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error(`Failed to delete report: ${tx.error?.message}`));
  });
}
