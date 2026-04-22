'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

interface FirebaseContextType {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

/**
 * Pure React Provider for Firebase instances.
 * This should only be used internally by the FirebaseClientProvider.
 */
export function FirebaseProvider({
  children,
  app,
  db,
  auth,
}: {
  children: ReactNode;
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}) {
  return (
    <FirebaseContext.Provider value={{ app, db, auth }}>
      {children}
    </FirebaseContext.Provider>
  );
}

/**
 * Access the core Firebase Context.
 */
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

/**
 * Access the initialized FirebaseApp instance.
 */
export function useFirebaseApp() {
  return useFirebase().app;
}

/**
 * Access the initialized Firestore instance.
 */
export function useFirestore() {
  return useFirebase().db;
}

/**
 * Access the initialized Auth instance.
 */
export function useAuth() {
  return useFirebase().auth;
}
