
'use client';

import { useFirebase } from '../provider';

/**
 * Compatibility hook for user auth.
 */
export function useUser() {
  const { user, isUserLoading } = useFirebase();
  return { user, isUserLoading };
}
