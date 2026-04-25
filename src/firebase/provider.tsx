
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Messaging } from 'firebase/messaging';

interface FirebaseContextType {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  messaging: Messaging | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

/**
 * Pure React Provider for Firebase instances.
 */
export function FirebaseProvider({
  children,
  app,
  db,
  auth,
  messaging,
}: {
  children: ReactNode;
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  messaging: Messaging | null;
}) {
  return (
    <FirebaseContext.Provider value={{ app, db, auth, messaging }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  return useFirebase().app;
}

export function useFirestore() {
  return useFirebase().db;
}

export function useAuth() {
  return useFirebase().auth;
}

export function useMessaging() {
  return useFirebase().messaging;
}
