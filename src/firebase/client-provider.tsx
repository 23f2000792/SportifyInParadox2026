
'use client';

import React, { useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { initializeFirebase, FirebaseProvider } from './index';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp;
    db: Firestore;
    auth: Auth;
  } | null>(null);

  useEffect(() => {
    const initialized = initializeFirebase();
    setFirebase(initialized);
  }, []);

  if (!firebase) return null;

  return (
    <FirebaseProvider app={firebase.app} db={firebase.db} auth={firebase.auth}>
      {children}
    </FirebaseProvider>
  );
}
