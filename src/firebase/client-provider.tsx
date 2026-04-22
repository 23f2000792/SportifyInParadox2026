'use client';

import React, { useEffect, useState } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

/**
 * Client-side Firebase provider that ensures initialization occurs only
 * once after the component has safely mounted in the browser.
 */
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<{ app: FirebaseApp, db: Firestore, auth: Auth } | null>(null);

  useEffect(() => {
    // initializeFirebase uses a singleton pattern to prevent double-init errors
    const instances = initializeFirebase();
    if (instances) {
      setFirebase(instances);
    }
  }, []);

  // Wait for client-side initialization before rendering the tree
  if (!firebase) {
    return null;
  }

  return (
    <FirebaseProvider app={firebase.app} db={firebase.db} auth={firebase.auth}>
      {children}
    </FirebaseProvider>
  );
}
