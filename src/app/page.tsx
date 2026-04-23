
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, ChevronRight, Radio, MapPin, ListOrdered, Award } from 'lucide-react';
import { EVENTS } from '@/lib/mock-data';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Match, Standing, HOUSES } from '@/lib/types';
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

  const allStandingsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'standings');
  }, [db]);

  const { data: liveMatches, loading: matchesLoading } = useCollection<Match>(liveMatchesQuery);
  const { data: allStandings, loading: standingsLoading } = useCollection<Standing>(allStandingsQuery);

  const overallTally = useMemo(() => {
    if (!allStandings) return [];
    const tally: Record<string, number> = {};
    HOUSES.forEach(house => { tally[house] = 0; });
    
    allStandings.forEach(s => {
      if (tally[s.team] !== undefined) {
        tally[s.team] += (s.points || 0);
      }
    });

    return Object.entries(tally)
      .map(([house, points]) => ({ house, points }))
      .sort((a, b) => b.points - a.points)
      .filter(item => item.points > 0);
  }, [allStandings]);

  if (matchesLoading || standingsLoading) return <Loading />;

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-10 md:py-16 px-4 mb-24">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] mb-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Paradox 2026 Official</p>
        </div>
        <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.9] text-white">
          SPORTIFY
        </h1>
        <p className="text-xs font-bold uppercase tracking-[0.5em] text-primary/60">Broadcast Hub</p>
      </div>

      {/* Overall Medal Tally (Advanced Feature) */}
      {overallTally.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <Award className="h-4 w-4" /> Championship Leaderboard
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Cross-Sport Total</p>
          </div>
          <Card className="premium-card bg-white/[0.01]">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05]">
                {overallTally.slice(0, 4).map((item, idx) => (
                  <div key={item.house} className="bg-background p-6 text-center space-y-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                      {idx === 0 ? '🥇 Leader' : idx === 1 ? '🥈 Second' : idx === 2 ? '🥉 Third' : 'Rank 4'}
                    </p>
                    <p className="text-lg md:text-xl font-black uppercase italic text-white truncate">{item.house}</p>
                    <p className="text-2xl font-black text-primary/80">{item.points} <span className="text-[10px] uppercase opacity-40">Pts</span></p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

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
                  <CardContent className="p-6 md:p-8 flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{match.sport.replace('-', ' ')}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {match.venue}
                        </span>
                      </div>
                      <p className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                        {match.teamA} <span className="text-primary mx-3">{match.scoreA} : {match.scoreB}</span> {match.teamB}
                      </p>
                    </div>
                    <ChevronRight className="h-6 w-6 text-white/20 group-hover:text-primary transition-colors" />
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
