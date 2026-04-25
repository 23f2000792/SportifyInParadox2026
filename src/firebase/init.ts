
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  memoryLocalCache, 
  Firestore,
  getFirestore
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';
import { firebaseConfig } from './config';

/**
 * Defensive Singleton Registry for Firebase Services.
 */

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
  
  // Messaging initialization
  let messaging: Messaging | null = null;
  isSupported().then(supported => {
    if (supported) {
      messaging = getMessaging(app);
      if (cachedInstances) cachedInstances.messaging = messaging;
    }
  });

  cachedInstances = { app, db, auth, messaging };
  _window.__FIREBASE_SINGLETON__ = cachedInstances;

  return cachedInstances;
}

/**
 * Replace 'YOUR_VAPID_KEY' with the key from Firebase Console:
 * Project Settings > Cloud Messaging > Web configuration > Web Push certificates
 */
export const VAPID_KEY = 'YOUR_VAPID_KEY';
