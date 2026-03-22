'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * LOCAL STORAGE PROVIDER
 * Manages the global authenticated user state using LocalStorage.
 */

type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
} | null;

interface FirebaseContextType {
  user: User;
  isUserLoading: boolean;
  firebaseApp: any;
  firestore: any;
  auth: any;
}

// Default value for SSR safety
const defaultContext: FirebaseContextType = {
  user: null,
  isUserLoading: true,
  firebaseApp: {},
  firestore: 'local_db',
  auth: 'local_auth'
};

const FirebaseContext = createContext<FirebaseContextType>(defaultContext);

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const syncUser = () => {
      try {
        const stored = localStorage.getItem('hub_user');
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setIsUserLoading(false);
      }
    };

    syncUser();
    window.addEventListener('local-auth-change', syncUser);
    window.addEventListener('storage', syncUser);
    
    return () => {
      window.removeEventListener('local-auth-change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  return (
    <FirebaseContext.Provider value={{ 
      user, 
      isUserLoading,
      firebaseApp: {},
      firestore: 'local_db',
      auth: 'local_auth'
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  // Return default context instead of throwing to prevent SSR crashes
  return context || defaultContext;
}

export function useUser() {
  const { user, isUserLoading } = useFirebase();
  return { user, isUserLoading };
}

export function useFirestore() {
  return 'local_db';
}

export function useAuth() {
  return 'local_auth';
}
