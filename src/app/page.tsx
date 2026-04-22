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

  // Fetch all live matches across all sports for the dashboard
  const liveMatchesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'matches'), where('status', '==', 'Live'));
  }, [db]);

  const { data: liveMatches, loading } = useCollection<Match>(liveMatchesQuery);

  if (loading) return <Loading />;

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-6 md:py-10 px-4 mb-20">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.85] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/30">
          Paradox<br />2026
        </h1>
        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-primary animate-pulse">
          Event Protocol Active
        </p>
      </div>

      {/* Live Feed Section */}
      {liveMatches && liveMatches.length > 0 && (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <Radio className="h-4 w-4 animate-pulse" /> Live Now
            </h2>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest h-6 px-3">
              {liveMatches.length} Ongoing
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {liveMatches.map((match) => (
              <Link key={match.id} href={`/events/${match.sport}`}>
                <Card className="premium-card border-primary/30 bg-primary/5 hover:bg-primary/10 group transition-all duration-300">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-white text-[7px] font-black uppercase px-2 h-4">
                          {match.sport}
                        </Badge>
                        <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" /> {match.venue}
                        </span>
                      </div>
                      <p className="text-lg md:text-2xl font-black uppercase italic tracking-tighter text-white">
                        {match.teamA} <span className="text-primary/80 px-2">{match.scoreA} : {match.scoreB}</span> {match.teamB}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sport Domains Grid */}
      <section className="space-y-6">
        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground px-1">
          Select Sport
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            return (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="premium-card group h-full overflow-hidden border-white/5 hover:border-primary/50 transition-all duration-500">
                  <CardContent className="p-0">
                    <div className="flex h-36 md:h-40">
                      <div className="w-1/4 bg-primary/10 flex items-center justify-center border-r border-white/5 group-hover:bg-primary/20 transition-colors">
                        <IconComp className="h-10 w-10 text-primary" />
                      </div>
                      <div className="w-3/4 p-6 flex flex-col justify-center space-y-1.5">
                        <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">{event.name}</h2>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-tight opacity-70">
                          {event.description}
                        </p>
                        <div className="pt-2 flex items-center text-[10px] font-black uppercase text-primary gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          View Feed <ChevronRight className="h-3 w-3" />
                        </div>
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
