
'use client';

import { useState, useEffect } from 'react';
import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { initializeFirebase, VAPID_KEY } from '../init';
import { useToast } from '@/hooks/use-toast';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

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
        if (instances?.messaging && VAPID_KEY !== 'YOUR_VAPID_KEY') {
          const token = await getToken(instances.messaging, {
            vapidKey: VAPID_KEY,
          });

          if (token) {
            // Save token to Firestore
            await setDoc(doc(db, 'fcmTokens', token), {
              token,
              createdAt: serverTimestamp(),
            });
            
            toast({
              title: "Alerts Enabled",
              description: "You'll now receive official Sportify updates.",
            });
          }
        } else if (VAPID_KEY === 'YOUR_VAPID_KEY') {
           toast({
              title: "Configuration Needed",
              description: "Admin must set up VAPID key in source code.",
            });
        }
      }
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { permission, requestPermission, loading };
}
