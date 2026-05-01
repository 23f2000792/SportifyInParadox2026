
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken, onMessage, getMessaging, isSupported } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useFirebaseApp } from '../provider';
import { VAPID_KEY } from '../init';
import { useToast } from '@/hooks/use-toast';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const db = useFirestore();
  const app = useFirebaseApp();
  const { toast } = useToast();

  const checkSubscription = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      const savedToken = localStorage.getItem('fcm_token');
      setIsSubscribed(!!savedToken && Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Handle foreground messages
  useEffect(() => {
    let unsubscribe: () => void;
    
    isSupported().then(supported => {
      if (supported && typeof window !== 'undefined') {
        const messaging = getMessaging(app);
        unsubscribe = onMessage(messaging, (payload) => {
          console.log('Message received in foreground: ', payload);
          if (payload.notification) {
            toast({
              title: payload.notification.title || 'Sportify Update',
              description: payload.notification.body,
            });
            // Show native notification for consistency if browser allows
            if (Notification.permission === 'granted') {
              new Notification(payload.notification.title || 'Sportify Update', {
                body: payload.notification.body,
                icon: 'https://ik.imagekit.io/qaugsnc1c/sportify_logo1.png?updatedAt=1762330168970'
              });
            }
          }
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [app, toast]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast({
        variant: "destructive",
        title: "Unsupported",
        description: "Notifications are not supported on this browser.",
      });
      return false;
    }

    setLoading(true);
    try {
      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === 'granted') {
        const supported = await isSupported();
        if (!supported) {
          throw new Error('Messaging is not supported on this browser.');
        }

        const messaging = getMessaging(app);
        
        // Register service worker explicitly to ensure it's found
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        // Wait for service worker to be active
        await navigator.serviceWorker.ready;

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        });

        if (token) {
          // Save token to Firestore - permissions are now updated in firestore.rules
          await setDoc(doc(db, 'fcmTokens', token), {
            token,
            createdAt: serverTimestamp(),
            platform: navigator.platform,
            userAgent: navigator.userAgent
          });
          
          localStorage.setItem('fcm_token', token);
          setIsSubscribed(true);
          toast({
            title: "Alerts Enabled",
            description: "Official Sportify updates will now be pushed to this device.",
          });
          return true;
        } else {
          throw new Error('Failed to retrieve FCM token.');
        }
      } else {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "Please enable notifications in settings to receive live alerts.",
        });
      }
      return status === 'granted';
    } catch (error: any) {
      console.error('Error requesting notification permission:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to enable notifications. Please check your browser permissions.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('fcm_token');
      if (token) {
        await deleteDoc(doc(db, 'fcmTokens', token));
        localStorage.removeItem('fcm_token');
      }
      setIsSubscribed(false);
      toast({
        title: "Alerts Disabled",
        description: "You will no longer receive push notifications on this device.",
      });
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not disable alerts. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return { permission, isSubscribed, requestPermission, unsubscribe, loading };
}
