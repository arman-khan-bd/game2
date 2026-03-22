
'use client';

import React from 'react';
import { FirebaseClientProvider as LocalProvider } from './provider';

/**
 * Wrapper for the Local Provider.
 */
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  return <LocalProvider>{children}</LocalProvider>;
}
