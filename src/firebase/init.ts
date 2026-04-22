'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

let cachedInstances: { app: FirebaseApp; db: Firestore; auth: Auth } | null = null;

/**
 * Strictly defensive Firebase initialization.
 * Prevents "INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9)" by ensuring
 * getFirestore and getAuth are called exactly once per client session.
 * 
 * We use both module-level and global-level caching to handle Next.js hot-reloads
 * and React 18 Strict Mode double-renders.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') return null;

  const _window = window as any;

  // 1. Check local module cache
  if (cachedInstances) return cachedInstances;

  // 2. Check global window cache (resilient to module re-evaluations during HMR)
  if (_window.__FIREBASE_INSTANCE__) {
    cachedInstances = _window.__FIREBASE_INSTANCE__;
    return cachedInstances;
  }

  // 3. Initialize fresh instances
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  cachedInstances = { app, db, auth };
  _window.__FIREBASE_INSTANCE__ = cachedInstances;

  return cachedInstances;
}
