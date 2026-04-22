'use client';

import React, { useEffect, useState } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

/**
 * Defensive Client-side Firebase provider.
 * This component manages the singleton lifecycle and ensures the rest of the 
 * app only sees stable, fully-initialized Firebase instances.
 */
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<{ app: FirebaseApp, db: Firestore, auth: Auth } | null>(null);

  useEffect(() => {
    // initializeFirebase uses a global window-level registry to prevent double-init errors
    const instances = initializeFirebase();
    if (instances) {
      setFirebase(instances);
    }
  }, []);

  // Block rendering until the client-side singleton is stable
  if (!firebase) {
    return null;
  }

  return (
    <FirebaseProvider app={firebase.app} db={firebase.db} auth={firebase.auth}>
      {children}
    </FirebaseProvider>
  );
}
