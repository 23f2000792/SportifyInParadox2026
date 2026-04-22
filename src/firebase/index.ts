'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Robust Firebase initialization for Next.js.
 * Uses a global singleton pattern on the window object to prevent 
 * re-initialization of services (Firestore/Auth) which causes 
 * "INTERNAL ASSERTION FAILED (ID: ca9)" errors in Firebase v11.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return null;
  }

  // Initialize App
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  // Singleton pattern for services using the window object
  const _window = window as any;

  if (!_window.__FIREBASE_DB__) {
    _window.__FIREBASE_DB__ = getFirestore(app);
  }
  
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
