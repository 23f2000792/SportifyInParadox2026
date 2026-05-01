'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  memoryLocalCache, 
  Firestore,
  getFirestore
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getMessaging, Messaging } from 'firebase/messaging';
import { firebaseConfig } from './config';

/**
 * Defensive Singleton Registry for Firebase Services.
 */

// Authoritative VAPID Key
export const VAPID_KEY = "BNMnnZBI9XVPREVNQP68srGciyyULwP_GaQXX8Y5JngkyJl1yOsef7BmB1ksZ--hha8p_aE-HmivqBvVyiXMvxc";

let cachedInstances: { 
  app: FirebaseApp, 
  db: Firestore, 
  auth: Auth,
  messaging: Messaging | null
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
  
  const instances = { app, db, auth, messaging: null as Messaging | null };
  
  cachedInstances = instances;
  _window.__FIREBASE_SINGLETON__ = cachedInstances;

  return cachedInstances;
}
