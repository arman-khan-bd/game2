
'use client';

/**
 * MOCK FIREBASE INDEX
 * This file provides a compatibility layer for components that were previously using Firebase.
 * It now routes all data and authentication to LocalStorage.
 */

export * from './provider';

// Mock Firestore path resolution
export function doc(_db: any, path: string, ...segments: string[]) {
  return [path, ...segments].filter(Boolean).join('/');
}

export function collection(_db: any, path: string, ...segments: string[]) {
  return [path, ...segments].filter(Boolean).join('/');
}

// Mock mutation functions
export async function setDoc(path: string, data: any, options?: { merge?: boolean }) {
  const [collectionName, id] = path.split('/');
  const storageKey = `local_db_${collectionName}`;
  const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
  
  if (options?.merge) {
    existing[id] = { ...existing[id], ...data };
  } else {
    existing[id] = { ...data, updatedAt: new Date().toISOString() };
  }
  
  localStorage.setItem(storageKey, JSON.stringify(existing));
  window.dispatchEvent(new CustomEvent('local-db-change', { detail: { path } }));
}

export async function updateDoc(path: string, data: any) {
  const [collectionName, id] = path.split('/');
  const storageKey = `local_db_${collectionName}`;
  const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
  const doc = stored[id] || {};

  const newData = { ...data };
  for (const key in newData) {
    if (newData[key] && typeof newData[key] === 'object' && newData[key].__type === 'increment') {
      const currentVal = doc[key] || 0;
      newData[key] = currentVal + newData[key].value;
    }
  }

  stored[id] = { ...doc, ...newData, updatedAt: new Date().toISOString() };
  localStorage.setItem(storageKey, JSON.stringify(stored));
  window.dispatchEvent(new CustomEvent('local-db-change', { detail: { path } }));
}

export async function addDoc(collectionPath: string, data: any) {
  const id = Math.random().toString(36).substring(2, 15);
  await setDoc(`${collectionPath}/${id}`, { ...data, id });
  return { id };
}

export function increment(n: number) {
  return { __type: 'increment', value: n };
}

// Export custom hooks
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';

export function useFirestore() { return 'local_db'; }
export function useAuth() { return 'local_auth'; }
export function useMemoFirebase<T>(fn: () => T, _deps: any[]): T { return fn(); }
