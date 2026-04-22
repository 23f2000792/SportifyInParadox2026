'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Enhanced Singleton Registry for Firebase Services.
 * Specifically designed to prevent "INTERNAL ASSERTION FAILED (ID: ca9)" in Firestore v11
 * by ensuring services are instantiated EXACTLY once per browser session.
 */

let cachedInstances: { app: FirebaseApp, db: Firestore, auth: Auth } | null = null;

export function initializeFirebase() {
  if (typeof window === 'undefined') return null;

  // 1. Check local module cache (fastest)
  if (cachedInstances) return cachedInstances;

  // 2. Check window-level registry (survives HMR and React double-mounts)
  const _window = window as any;
  if (_window.__FIREBASE_SINGLETON__) {
    cachedInstances = _window.__FIREBASE_SINGLETON__;
    return cachedInstances;
  }

  // 3. Initialize or retrieve the core App
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  // 4. Instantiate services strictly once
  const db = getFirestore(app);
  const auth = getAuth(app);

  cachedInstances = { app, db, auth };
  _window.__FIREBASE_SINGLETON__ = cachedInstances;

  return cachedInstances;
}
