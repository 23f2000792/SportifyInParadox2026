'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { initializeFirebase, VAPID_KEY } from '../init';
import { useToast } from '@/hooks/use-toast';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const db = useFirestore();
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
        const instances = initializeFirebase();
        if (instances?.messaging) {
          const token = await getToken(instances.messaging, {
            vapidKey: VAPID_KEY,
          });

          if (token) {
            await setDoc(doc(db, 'fcmTokens', token), {
              token,
              createdAt: serverTimestamp(),
            });
            localStorage.setItem('fcm_token', token);
            setIsSubscribed(true);
            toast({
              title: "Alerts Enabled",
              description: "Official Sportify updates will now be pushed to this device.",
            });
            return true;
          }
        }
      } else {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings to receive alerts.",
        });
      }
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to enable notifications.",
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
    } catch (error) {
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
