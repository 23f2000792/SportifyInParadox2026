
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, ChevronRight, Radio, MapPin, Star, CalendarClock } from 'lucide-react';
import { EVENTS } from '@/lib/mock-data';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Match, HOUSES } from '@/lib/types';
import Loading from '@/app/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

export default function Home() {
  const db = useFirestore();
  const [myHouse, setMyHouse] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('followedHouse');
    if (saved) setMyHouse(saved);
  }, []);

  const handleFollowHouse = (house: string) => {
    setMyHouse(house);
    localStorage.setItem('followedHouse', house);
  };

  const liveMatchesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'matches'), where('status', '==', 'Live'));
  }, [db]);

  const upcomingMatchesQuery = useMemo(() => {
    if (!db || !myHouse) return null;
    return query(collection(db, 'matches'), where('status', '==', 'Upcoming'));
  }, [db, myHouse]);

  const { data: liveMatches, loading: matchesLoading } = useCollection<Match>(liveMatchesQuery);
  const { data: allUpcoming } = useCollection<Match>(upcomingMatchesQuery);

  const houseUpcoming = useMemo(() => {
    if (!myHouse || !allUpcoming) return [];
    return allUpcoming
      .filter(m => m.teamA === myHouse || m.teamB === myHouse)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [allUpcoming, myHouse]);

  if (matchesLoading) return <Loading />;

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-10 md:py-16 px-4 mb-24">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/20 border border-border mb-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Paradox 2026 Official</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.9] text-foreground">
            SPORTIFY
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.5em] text-primary/60">Broadcast Hub</p>
        </div>

        {/* My House Personalization */}
        <div className="max-w-xs mx-auto pt-6">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Follow Your House</p>
            <Select value={myHouse} onValueChange={handleFollowHouse}>
              <SelectTrigger className="bg-muted/30 border-border h-11 text-[11px] font-black uppercase">
                <SelectValue placeholder="Select Team" />
              </SelectTrigger>
              <SelectContent>
                {HOUSES.map(h => (
                  <SelectItem key={h} value={h} className="text-[11px] font-black uppercase">{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {myHouse && (
              <p className="text-[9px] font-black text-primary uppercase animate-in fade-in slide-in-from-top-1">
                Tracking: {myHouse}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* House Specific Timeline */}
      {myHouse && houseUpcoming.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> {myHouse} Timeline
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {houseUpcoming.map((match) => (
              <Link key={match.id} href={`/events/${match.sport}`}>
                <Card className="premium-card bg-primary/[0.02] border-primary/20 h-full group">
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">{match.sport.replace('-', ' ')}</p>
                      <p className="text-lg font-black italic uppercase text-foreground leading-none">VS {match.teamA === myHouse ? match.teamB : match.teamA}</p>
                    </div>
                    <div className="space-y-1 border-t border-primary/10 pt-3">
                      <p className="text-[10px] font-black text-foreground">{match.time} • {match.day}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {match.venue}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
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
            {liveMatches.map((match) => {
              const isMyMatch = match.teamA === myHouse || match.teamB === myHouse;
              return (
                <Link key={match.id} href={`/events/${match.sport}`}>
                  <Card className={cn(
                    "premium-card group",
                    isMyMatch && "border-primary/40 bg-primary/[0.02] shadow-lg shadow-primary/5"
                  )}>
                    <CardContent className="p-6 md:p-8 flex items-center justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">{match.sport.replace('-', ' ')}</span>
                          <span className="w-1 h-1 rounded-full bg-border hidden xs:block" />
                          <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {match.venue}
                          </span>
                          {isMyMatch && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary text-[9px] font-black text-white uppercase ml-auto">
                              <Star className="h-2.5 w-2.5 fill-white" /> My House
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                          <p className={cn(
                            "text-lg md:text-3xl font-black uppercase italic tracking-tighter text-foreground leading-tight break-words flex-1",
                            match.teamA === myHouse && "text-primary"
                          )}>
                            {match.teamA}
                          </p>
                          <span className="text-2xl md:text-4xl font-black text-primary whitespace-nowrap">
                            {match.scoreA} : {match.scoreB}
                          </span>
                          <p className={cn(
                            "text-lg md:text-3xl font-black uppercase italic tracking-tighter text-foreground leading-tight break-words flex-1 md:text-left",
                            match.teamB === myHouse && "text-primary"
                          )}>
                            {match.teamB}
                          </p>
                        </div>
                        {match.keyEvents && match.keyEvents.length > 0 && (
                          <div className="flex items-center gap-2 pt-2">
                            <span className="text-[9px] font-black text-primary/60 uppercase">Latest:</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase truncate">{match.keyEvents[match.keyEvents.length - 1]}</span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-6 w-6 text-muted-foreground/20 group-hover:text-primary transition-colors shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
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
                <Card className="premium-card group h-full">
                  <CardContent className="p-0">
                    <div className="flex h-36 md:h-44">
                      <div className="w-1/4 bg-muted/10 flex items-center justify-center border-r border-border group-hover:bg-primary/[0.05] transition-colors">
                        <IconComp className="h-8 w-8 text-muted-foreground/20 group-hover:text-primary transition-all duration-500" />
                      </div>
                      <div className="w-3/4 p-6 flex flex-col justify-center space-y-1">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">{event.name}</h2>
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
