'use client';

import React, { useEffect, useState } from 'react';
import { initializeFirebase, FirebaseProvider } from './index';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<{ app: FirebaseApp, db: Firestore, auth: Auth } | null>(null);

  useEffect(() => {
    // Only initialize once the component has mounted on the client
    const instances = initializeFirebase();
    if (instances) {
      setFirebase(instances);
    }
  }, []);

  // Return nothing until we have initialized Firebase on the client
  if (!firebase) {
    return null;
  }

  return (
    <FirebaseProvider app={firebase.app} db={firebase.db} auth={firebase.auth}>
      {children}
    </FirebaseProvider>
  );
}
