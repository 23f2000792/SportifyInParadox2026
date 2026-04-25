
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  memoryLocalCache, 
  Firestore,
  getFirestore
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Defensive Singleton Registry for Firebase Services.
 */

let cachedInstances: { 
  app: FirebaseApp, 
  db: Firestore, 
  auth: Auth
} | null = null;

export function initializeFirebase() {
  if (typeof window === 'undefined') return null;

  if (cachedInstances) return cachedInstances;

  const _window = window as any;
  if (_window.__FIREBASE_SINGLETON__) {
    cachedInstances = _window.__FIREBASE_SINGLETON__;
    return cachedInstances;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  let db: Firestore;
  try {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  } catch (e) {
    db = getFirestore(app);
  }

  const auth = getAuth(app);

  cachedInstances = { app, db, auth };
  _window.__FIREBASE_SINGLETON__ = cachedInstances;

  return cachedInstances;
}
