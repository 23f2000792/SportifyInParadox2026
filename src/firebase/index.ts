'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

// Module-level variables to cache the singleton instances on the client.
// These persist across re-renders and Strict Mode double-invocations.
let cachedApp: FirebaseApp | undefined;
let cachedDb: Firestore | undefined;
let cachedAuth: Auth | undefined;

/**
 * Defensive Firebase initialization for Next.js.
 * Ensures that the Firebase App and its services (Firestore, Auth) 
 * are initialized exactly once on the client side.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return null;
  }

  // 1. Initialize or retrieve the App
  if (!cachedApp) {
    if (getApps().length > 0) {
      cachedApp = getApp();
    } else {
      cachedApp = initializeApp(firebaseConfig);
    }
  }

  // 2. Initialize or retrieve Firestore instance
  if (!cachedDb) {
    cachedDb = getFirestore(cachedApp);
  }
  
  // 3. Initialize or retrieve Auth instance
  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
  }

  return { 
    app: cachedApp, 
    db: cachedDb, 
    auth: cachedAuth 
  };
}

export { FirebaseProvider, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
