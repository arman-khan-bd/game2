
'use client';

import { useState, useEffect } from 'react';

/**
 * MOCK useCollection
 * Fetches data from LocalStorage and listens for 'local-db-change' events.
 */

export function useCollection(path: string | null) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!path) {
      setData([]);
      setIsLoading(false);
      return;
    }

    const fetchData = () => {
      try {
        const [collectionName] = path.split('/');
        const storageKey = `local_db_${collectionName}`;
        const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const items = Object.values(stored);
        setData(items);
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
