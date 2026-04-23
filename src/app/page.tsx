'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, ChevronRight, Radio, MapPin } from 'lucide-react';
import { EVENTS } from '@/lib/mock-data';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Match } from '@/lib/types';
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

  const { data: liveMatches, loading: matchesLoading } = useCollection<Match>(liveMatchesQuery);

  if (matchesLoading) return <Loading />;

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-10 md:py-16 px-4 mb-24">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] mb-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Paradox 2026 Official</p>
        </div>
        <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.9] text-white">
          SPORTIFY
        </h1>
        <p className="text-xs font-bold uppercase tracking-[0.5em] text-primary/60">Broadcast Hub</p>
      </div>

      {/* Live Feed */}
      {liveMatches && liveMatches.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <Radio className="h-4 w-4" /> Live Now
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {liveMatches.map((match) => (
              <Link key={match.id} href={`/events/${match.sport}`}>
                <Card className="premium-card group bg-white/[0.01] hover:bg-white/[0.03]">
                  <CardContent className="p-6 md:p-8 flex items-center justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{match.sport.replace('-', ' ')}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10 hidden xs:block" />
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {match.venue}
                        </span>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <p className="text-lg md:text-3xl font-black uppercase italic tracking-tighter text-white leading-tight break-words flex-1">
                          {match.teamA}
                        </p>
                        <span className="text-2xl md:text-4xl font-black text-primary whitespace-nowrap">
                          {match.scoreA} : {match.scoreB}
                        </span>
                        <p className="text-lg md:text-3xl font-black uppercase italic tracking-tighter text-white leading-tight break-words flex-1">
                          {match.teamB}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-white/20 group-hover:text-primary transition-colors shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sport Grid */}
      <section className="space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40 px-2">
          Tournament Events
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            return (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="premium-card group h-full hover:bg-white/[0.02]">
                  <CardContent className="p-0">
                    <div className="flex h-36 md:h-44">
                      <div className="w-1/4 bg-white/[0.01] flex items-center justify-center border-r border-white/[0.03] group-hover:bg-primary/[0.02] transition-colors">
                        <IconComp className="h-8 w-8 text-white/20 group-hover:text-primary transition-all duration-500" />
                      </div>
                      <div className="w-3/4 p-6 flex flex-col justify-center space-y-1">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors">{event.name}</h2>
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