'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Defensive Firebase initialization for Next.js.
 * Uses a global singleton on the window object to prevent 
 * re-initialization of services (Firestore/Auth) which causes 
 * "INTERNAL ASSERTION FAILED (ID: ca9)" errors in Firebase v11.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return null;
  }

  const _window = window as any;

  // 1. Initialize or retrieve the App
  let app: FirebaseApp;
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }

  // 2. Initialize or retrieve Firestore instance
  if (!_window.__FIREBASE_DB__) {
    _window.__FIREBASE_DB__ = getFirestore(app);
  }
  
  // 3. Initialize or retrieve Auth instance
  if (!_window.__FIREBASE_AUTH__) {
    _window.__FIREBASE_AUTH__ = getAuth(app);
  }

  return { 
    app, 
    db: _window.__FIREBASE_DB__ as Firestore, 
    auth: _window.__FIREBASE_AUTH__ as Auth 
  };
}

export { FirebaseProvider, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
