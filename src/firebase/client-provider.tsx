
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Messaging } from 'firebase/messaging';

/**
 * Orchestrates the Firebase singleton lifecycle on the client.
 */
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<{ 
    app: FirebaseApp, 
    db: Firestore, 
    auth: Auth,
    messaging: Messaging | null
  } | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    
    const instances = initializeFirebase();
    if (instances) {
      setFirebase(instances);
      initialized.current = true;
    }
  }, []);

  if (!firebase) {
    return null;
  }

  return (
    <FirebaseProvider 
      app={firebase.app} 
      db={firebase.db} 
      auth={firebase.auth}
      messaging={firebase.messaging}
    >
      {children}
    </FirebaseProvider>
  );
}
