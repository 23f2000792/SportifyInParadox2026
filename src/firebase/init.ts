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
 * Robust Singleton Registry for Firebase Services.
 * Forces memory-only cache to prevent "INTERNAL ASSERTION FAILED (ID: ca9)" 
 * which is commonly caused by persistent cache conflicts in Firestore v11.
 */

let cachedInstances: { app: FirebaseApp, db: Firestore, auth: Auth } | null = null;

export function initializeFirebase() {
  if (typeof window === 'undefined') return null;

  // 1. Check local module cache
  if (cachedInstances) return cachedInstances;

  // 2. Check window-level registry to survive HMR/Strict Mode double-mounts
  const _window = window as any;
  if (_window.__FIREBASE_SINGLETON__) {
    cachedInstances = _window.__FIREBASE_SINGLETON__;
    return cachedInstances;
  }

  // 3. Initialize the core App
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  // 4. Instantiate services strictly once with defensive settings
  // Using initializeFirestore with memoryLocalCache() is the definitive fix for ID: ca9
  let db: Firestore;
  try {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  } catch (e) {
    // If already initialized, fallback to getFirestore
    db = getFirestore(app);
  }

  const auth = getAuth(app);

  cachedInstances = { app, db, auth };
  _window.__FIREBASE_SINGLETON__ = cachedInstances;

  return cachedInstances;
}
