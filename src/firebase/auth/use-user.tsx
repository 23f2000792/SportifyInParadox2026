
'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';
import { AdminUser } from '@/lib/types';

export function useUser() {
  const auth = useAuth();
  const db = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setAdminProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (!user) return;

    const unsubscribeProfile = onSnapshot(doc(db, 'admins', user.uid), (doc) => {
      if (doc.exists()) {
        setAdminProfile(doc.data() as AdminUser);
      } else {
        // Fallback for hardcoded super admin email check for first-time setup
        if (user.email === '23f2000792@ds.study.iitm.ac.in') {
          setAdminProfile({
            uid: user.uid,
            email: user.email!,
            role: 'super-admin'
          });
        } else {
          setAdminProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribeProfile();
  }, [user, db]);

  return { user, adminProfile, loading };
}
