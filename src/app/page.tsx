'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, ChevronRight, Radio, MapPin } from 'lucide-react';
import { EVENTS } from '@/lib/mock-data';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Match } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Loading from '@/app/loading';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

export default function Home() {
  const db = useFirestore();

  const liveMatchesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'matches'), where('status', '==', 'Live'));
  }, [db]);

  const { data: liveMatches, loading } = useCollection<Match>(liveMatchesQuery);

  if (loading) return <Loading />;

  return (
    <div className="space-y-16 max-w-5xl mx-auto py-12 md:py-20 px-4 mb-24">
      {/* Premium Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05] mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Paradox 2026 Official</p>
        </div>
        <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter uppercase leading-[0.8] text-white">
          SPORTIFY
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-primary/60">Broadcast Hub</p>
      </div>

      {/* Live Feed - Minimalist Style */}
      {liveMatches && liveMatches.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <Radio className="h-3 w-3" /> Live Now
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{liveMatches.length} Matches</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {liveMatches.map((match) => (
              <Link key={match.id} href={`/events/${match.sport}`}>
                <Card className="premium-card group bg-white/[0.01] hover:bg-white/[0.03]">
                  <CardContent className="p-8 flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{match.sport.replace('-', ' ')}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {match.venue}
                        </span>
                      </div>
                      <p className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
                        {match.teamA} <span className="text-primary mx-3">{match.scoreA} : {match.scoreB}</span> {match.teamB}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full border border-white/[0.05] flex items-center justify-center group-hover:border-primary/30 transition-colors">
                      <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sport Grid - Minimalist Cards */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 px-2">
          Tournament Domains
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            return (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="premium-card group h-full hover:bg-white/[0.02]">
                  <CardContent className="p-0">
                    <div className="flex h-40 md:h-48">
                      <div className="w-1/3 bg-white/[0.01] flex items-center justify-center border-r border-white/[0.03] group-hover:bg-primary/[0.02] transition-colors">
                        <IconComp className="h-10 w-10 text-white/20 group-hover:text-primary transition-all duration-500" />
                      </div>
                      <div className="w-2/3 p-8 flex flex-col justify-center space-y-2">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors">{event.name}</h2>
                        <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
