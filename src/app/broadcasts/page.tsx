'use client';

import { useMemo } from 'react';
import { Megaphone, Clock, MapPin, Radio, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Broadcast } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function BroadcastsArchivePage() {
  const db = useFirestore();

  const broadcastQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'broadcasts'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
  }, [db]);

  const { data: broadcasts, loading } = useCollection<Broadcast>(broadcastQuery);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-32">
      <div className="text-center space-y-4 px-4 pt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
          <Megaphone className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Broadcast Archive</p>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black uppercase text-foreground leading-none tracking-tighter italic">
          Official Bulletins
        </h1>
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground">Historical feed of all tournament announcements</p>
      </div>

      <div className="space-y-6 px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Radio className="h-8 w-8 text-primary animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Syncing Archive...</p>
          </div>
        ) : broadcasts && broadcasts.length > 0 ? (
          <div className="relative space-y-4">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border/40 md:left-1/2" />
            
            {broadcasts.map((b, idx) => (
              <div key={b.id} className={cn(
                "relative flex flex-col md:flex-row items-start md:items-center gap-6",
                idx % 2 === 0 ? "md:flex-row-reverse" : ""
              )}>
                {/* Timeline Dot */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-primary border-4 border-background z-10" />
                
                <div className="flex-1 w-full pl-12 md:pl-0">
                  <Card className={cn(
                    "premium-card transition-all hover:border-primary/40",
                    b.active ? "bg-primary/[0.03] border-primary/20" : "bg-muted/10 opacity-70"
                  )}>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground/40" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                            {formatTimestamp(b.timestamp)}
                          </span>
                        </div>
                        {b.active && (
                          <span className="text-[8px] font-black uppercase text-primary tracking-tighter bg-primary/10 px-2 py-0.5 rounded-sm animate-broadcast-pulse">Active</span>
                        )}
                      </div>
                      
                      <p className="text-sm md:text-base font-bold italic leading-relaxed text-foreground break-words">
                        "{b.message}"
                      </p>
                      
                      <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Radio className="h-3 w-3 text-primary" />
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Sportify Feed</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="hidden md:block flex-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 opacity-20">
            <Megaphone className="h-12 w-12 mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Bulletins Found</p>
          </div>
        )}
      </div>
    </div>
  );
}