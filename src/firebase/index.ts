'use client';

/**
 * Stable Barrel File for Firebase functionality.
 * Exports initialization logic, hooks, and providers.
 */

export * from './init';
export { FirebaseProvider, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
