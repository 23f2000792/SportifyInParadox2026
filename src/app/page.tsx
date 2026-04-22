
'use client';

import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, ChevronRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EVENTS } from '@/lib/mock-data';
import { Match } from '@/lib/types';
import { useMemo } from 'react';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

export default function Home() {
  const db = useFirestore();

  const liveMatchesQuery = useMemo(() => 
    query(collection(db, 'matches'), where('status', '==', 'Live')), 
  [db]);
  const { data: liveMatches } = useCollection<Match>(liveMatchesQuery);

  const upcomingMatchesQuery = useMemo(() => 
    query(collection(db, 'matches'), where('status', '==', 'Upcoming'), orderBy('time', 'asc'), limit(5)), 
  [db]);
  const { data: upcomingMatches } = useCollection<Match>(upcomingMatchesQuery);

  const completedMatchesQuery = useMemo(() => 
    query(collection(db, 'matches'), where('status', '==', 'Completed'), orderBy('time', 'desc'), limit(5)), 
  [db]);
  const { data: completedMatches } = useCollection<Match>(completedMatchesQuery);
  
  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* 1. Live Now Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-live"></span>
            </span>
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-live">Live Control Room</h2>
          </div>
          {liveMatches?.length > 0 && <span className="text-[9px] font-bold text-muted-foreground uppercase">{liveMatches.length} Matches Active</span>}
        </div>
        
        {liveMatches?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches.map((match) => (
              <Card key={match.id} className="premium-card group">
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <Badge className="bg-primary/10 text-primary text-[8px] font-black border border-primary/20 px-2 uppercase">
                      {match.sport}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rounded-full bg-live animate-pulse" />
                      <span className="text-[9px] font-black text-live uppercase tracking-wider">Live</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <p className="text-sm font-black text-center truncate w-full group-hover:text-primary transition-colors">{match.teamA}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-black tabular-nums tracking-tighter bg-white/5 px-4 py-1 rounded-lg border border-white/5">
                        {match.scoreA}<span className="text-muted-foreground/30 mx-2">:</span>{match.scoreB}
                      </div>
                    </div>
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <p className="text-sm font-black text-center truncate w-full group-hover:text-primary transition-colors">{match.teamB}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl p-10 text-center border border-dashed border-white/10">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">All Systems Clear - No Active Matches</p>
          </div>
        )}
      </section>

      {/* 2. Quick Access Cards */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Tournament Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            return (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="premium-card group aspect-[4/3] flex flex-col items-center justify-center gap-3 p-4 hover:ring-1 hover:ring-primary/50 transition-all">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 group-hover:bg-primary/20 transition-colors">
                    <IconComp className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-[11px] font-black uppercase text-center leading-tight tracking-wide">
                    {event.name}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* 3. Today's Schedule */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Upcoming Transmission</h2>
            <Clock className="h-3.5 w-3.5 text-muted-foreground/30" />
          </div>
          <Card className="premium-card border border-white/5">
            <CardContent className="p-0 divide-y divide-white/5">
              {upcomingMatches?.length > 0 ? (
                upcomingMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-primary uppercase">{match.time}</span>
                        <span className="text-[9px] font-black text-muted-foreground/50 uppercase">{match.sport}</span>
                      </div>
                      <p className="text-sm font-bold mt-1 group-hover:text-primary transition-colors">{match.teamA} v {match.teamB}</p>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-muted-foreground/40">Scheduled</Badge>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-[10px] text-muted-foreground uppercase tracking-widest">End of Schedule</div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* 4. Latest Results */}
        <section className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Archive Results</h2>
            <Trophy className="h-3.5 w-3.5 text-muted-foreground/30" />
          </div>
          <div className="space-y-3">
            {completedMatches?.map((match) => (
              <Card key={match.id} className="premium-card hover:bg-white/[0.03] transition-colors border border-white/5 group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-muted-foreground/60 uppercase">{match.sport}</span>
                      <span className="text-[9px] font-medium text-muted-foreground/30">{match.time}</span>
                    </div>
                    <p className="text-sm font-bold mt-1">
                      <span className={match.scoreA > match.scoreB ? 'text-primary' : 'text-foreground/70'}>{match.teamA}</span>
                      <span className="mx-2 text-muted-foreground/20 italic font-medium">vs</span>
                      <span className={match.scoreB > match.scoreA ? 'text-primary' : 'text-foreground/70'}>{match.teamB}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-base font-black tabular-nums bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                      {match.scoreA} - {match.scoreB}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
