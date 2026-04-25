
'use client';

/**
 * Stable Barrel File for Firebase functionality.
 */

export * from './init';
export { 
  FirebaseProvider, 
  useFirebaseApp, 
  useFirestore, 
  useAuth, 
  useMessaging 
} from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
export { useNotifications } from './messaging/use-notifications';
