
'use client';

import { useEffect, useRef } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Match } from '@/lib/types';
import { Radio } from 'lucide-react';

export function LiveScoreWatcher() {
  const db = useFirestore();
  const { toast } = useToast();
  const prevScores = useRef<Record<string, string>>({});
  const followedHouse = typeof window !== 'undefined' ? localStorage.getItem('followedHouse') : null;

  useEffect(() => {
    if (!db) return;

    // Listen to ALL live matches
    const q = query(collection(db, 'matches'), where('status', '==', 'Live'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const match = { ...change.doc.data(), id: change.doc.id } as Match;
        const currentScore = `${match.scoreA}-${match.scoreB}`;
        const previousScore = prevScores.current[match.id];

        if (change.type === 'modified' && previousScore && previousScore !== currentScore) {
          // Score has changed!
          const isFollowedHouseMatch = match.teamA === followedHouse || match.teamB === followedHouse;

          toast({
            title: isFollowedHouseMatch ? "🔥 GOAL/POINT FOR YOUR HOUSE!" : "⚡ LIVE SCORE UPDATE",
            description: `${match.teamA} ${match.scoreA} - ${match.scoreB} ${match.teamB} (${match.sport.toUpperCase()})`,
            variant: isFollowedHouseMatch ? "default" : "secondary",
          });
        }
        
        // Update cache
        prevScores.current[match.id] = currentScore;
      });
    });

    return () => unsubscribe();
  }, [db, toast, followedHouse]);

  return null;
}
