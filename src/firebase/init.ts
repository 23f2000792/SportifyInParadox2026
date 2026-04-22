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
 * Forces memory-only cache to prevent "INTERNAL ASSERTION FAILED (ID: ca9)" 
 * which is caused by persistent cache conflicts in Firestore v11.
 */

let cachedInstances: { app: FirebaseApp, db: Firestore, auth: Auth } | null = null;

export function initializeFirebase() {
  if (typeof window === 'undefined') return null;

  // 1. Check module-level cache
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
  let db: Firestore;
  try {
    // Force memory-only cache to bypass the "ID: ca9" persistent cache bug
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  } catch (e) {
    // Fallback if already initialized
    db = getFirestore(app);
  }

  const auth = getAuth(app);

  cachedInstances = { app, db, auth };
  _window.__FIREBASE_SINGLETON__ = cachedInstances;

  return cachedInstances;
}
