'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken, onMessage, getMessaging, isSupported } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useFirebaseApp } from '../provider';
import { VAPID_KEY } from '../init';
import { useToast } from '@/hooks/use-toast';

export function useNotifications() {
  const [loading, setLoading] = useState(false);
  const db = useFirestore();
  const app = useFirebaseApp();
  const { toast } = useToast();

  const registerToken = useCallback(async () => {
    try {
      const supported = await isSupported();
      if (!supported) return;

      const messaging = getMessaging(app);
      
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      
      await navigator.serviceWorker.ready;
      
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        await setDoc(doc(db, 'fcmTokens', token), {
          token,
          createdAt: serverTimestamp(),
          platform: navigator.platform || 'unknown',
          userAgent: navigator.userAgent
        }, { merge: true });
        
        localStorage.setItem('fcm_token', token);
      }
    } catch (error) {
      console.error('FCM Registration failed:', error);
    }
  }, [app, db]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      registerToken();
    }
  }, [registerToken]);

  useEffect(() => {
    let unsubscribe: () => void;
    
    isSupported().then(supported => {
      if (supported && typeof window !== 'undefined') {
        try {
          const messaging = getMessaging(app);
          unsubscribe = onMessage(messaging, (payload) => {
            if (payload.notification) {
              toast({
                title: payload.notification.title || 'Sportify Update',
                description: payload.notification.body,
              });
            }
          });
        } catch (e) {
          console.error('Messaging listener failed:', e);
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [app, toast]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;

    setLoading(true);
    try {
      const status = await Notification.requestPermission();
      if (status === 'granted') {
        await registerToken();
        toast({
          title: "Notifications Enabled",
          description: "You'll receive live goal and trial alerts!",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { requestPermission, loading };
}
