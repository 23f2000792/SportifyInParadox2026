
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
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const initialized = initializeFirebase();
      setFirebase(initialized);
    } catch (e: any) {
      console.error("Firebase initialization failed:", e);
      setError(e);
    }
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <div className="max-w-md w-full p-6 bg-destructive/10 border border-destructive/20 rounded-xl space-y-4">
          <h2 className="text-lg font-black uppercase text-destructive tracking-tight">Firebase Configuration Error</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {error.message}
          </p>
          <div className="pt-2">
            <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">
              Action Required: Ensure project is provisioned in Firebase Console.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!firebase) return null;

  return (
    <FirebaseProvider app={firebase.app} db={firebase.db} auth={firebase.auth}>
      {children}
    </FirebaseProvider>
  );
}
