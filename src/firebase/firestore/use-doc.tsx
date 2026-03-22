
'use client';

import { useState, useEffect } from 'react';

/**
 * MOCK useDoc
 * Fetches a single document from LocalStorage.
 */

export function useDoc(path: string | null) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!path) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const fetchData = () => {
      try {
        const [collectionName, id] = path.split('/');
        const storageKey = `local_db_${collectionName}`;
        const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
        setData(stored[id] || null);
        setIsLoading(false);
      } catch (err) {
        setError(err);
        setIsLoading(false);
      }
    };

    fetchData();
    window.addEventListener('local-db-change', fetchData);
    return () => window.removeEventListener('local-db-change', fetchData);
  }, [path]);

  return { data, isLoading, error };
}
