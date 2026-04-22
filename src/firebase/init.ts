'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Advanced Singleton Registry for Firebase Services.
 * This pattern ensures that getFirestore and getAuth are called EXACTLY once
 * per client session, preventing internal assertion failures (ID: ca9).
 */
export function initializeFirebase() {
  // Prevent server-side initialization
  if (typeof window === 'undefined') return null;

  const _window = window as any;

  // 1. Return existing instances if they exist globally
  if (_window.__FIREBASE_INSTANCE__) {
    return _window.__FIREBASE_INSTANCE__;
  }

  // 2. Initialize the core app or retrieve the existing one
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  // 3. Instantiate services strictly once
  // Note: These must be called on the client only and only once per app instance
  const db = getFirestore(app);
  const auth = getAuth(app);

  const instance = { app, db, auth };

  // 4. Cache globally to survive HMR (Hot Module Replacement) and React re-renders
  _window.__FIREBASE_INSTANCE__ = instance;

  return instance;
}
