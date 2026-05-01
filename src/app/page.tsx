'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, ChevronRight, Radio, MapPin, Activity, ClipboardList, CalendarClock, Star, BarChart3, Medal } from 'lucide-react';
import { EVENTS } from '@/lib/mock-data';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Match, HOUSES, Trial } from '@/lib/types';
import Loading from '@/app/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

export default function Home() {
  const db = useFirestore();
  const [myHouse, setMyHouse] = useState<string>('');
  const [activeTab, setActiveTab] = useState('feed');

  useEffect(() => {
    const saved = localStorage.getItem('followedHouse');
    if (saved) setMyHouse(saved);
  }, []);

  const handleFollowHouse = (house: string) => {
    triggerHaptic('success');
    setMyHouse(house);
    localStorage.setItem('followedHouse', house);
  };

  const liveMatchesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'matches'), where('status', '==', 'Live'));
  }, [db]);

  const upcomingMatchesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'matches'), where('status', '==', 'Upcoming'));
  }, [db]);

  const houseTrialsQuery = useMemo(() => {
    if (!db || !myHouse) return null;
    return query(collection(db, 'trials'), where('house', '==', myHouse));
  }, [db, myHouse]);

  const { data: liveMatches, loading: matchesLoading } = useCollection<Match>(liveMatchesQuery);
  const { data: allUpcoming } = useCollection<Match>(upcomingMatchesQuery);
  const { data: allTrials } = useCollection<Trial>(houseTrialsQuery);

  const myHouseTimeline = useMemo(() => {
    if (!myHouse) return [];
    const houseMatches = (allUpcoming || [])
      .filter(m => m.teamA === myHouse || m.teamB === myHouse)
      .map(m => ({ ...m, type: 'match' as const }));
    const houseTrials = (allTrials || [])
      .map(t => ({ ...t, type: 'trial' as const }));
    return [...houseMatches, ...houseTrials]
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allUpcoming, allTrials, myHouse]);

  if (matchesLoading) return <Loading />;

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-10 md:py-16 px-4 mb-24">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border mb-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sportify Paradox 2026</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.9] text-foreground">
            SPORTIFY
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.5em] text-primary/60">Official Broadcast Hub</p>
        </div>
        <div className="max-w-xs mx-auto pt-6">
          <div className="bg-card border border-border rounded-md p-4 space-y-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Personalize Your Hub</p>
            <Select value={myHouse} onValueChange={handleFollowHouse}>
              <SelectTrigger className="bg-muted h-11 text-[11px] font-black uppercase rounded-sm">
                <SelectValue placeholder="Follow Your House" />
              </SelectTrigger>
              <SelectContent>
                {HOUSES.map(h => (
                  <SelectItem key={h} value={h} className="text-[11px] font-black uppercase">{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {myHouse && (
              <div className="flex items-center justify-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <p className="text-[9px] font-black text-primary uppercase tracking-widest">Tracking {myHouse} activities</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {/* Unified House Timeline */}
        {myHouse && myHouseTimeline.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 px-2">
              <CalendarClock className="h-4 w-4" /> House Schedule
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myHouseTimeline.map((item: any) => (
                <Link key={item.id} href={`/events/${item.sport}`} className="block" onClick={() => triggerHaptic('light')}>
                  <Card className={cn(
                    "premium-card h-full group",
                    item.type === 'trial' ? "border-accent/20 bg-accent/5" : "border-primary/10 bg-primary/5"
                  )}>
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div>
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{item.sport.replace('-', ' ')}</p>
                        <p className="text-base font-black italic uppercase text-foreground leading-tight line-clamp-2 mt-1">
                          {item.type === 'match' ? `VS ${item.teamA === myHouse ? item.teamB : item.teamA}` : `SELECTION TRIAL`}
                        </p>
                      </div>
                      <div className="space-y-1 border-t border-border/10 pt-3">
                        <p className="text-[10px] font-black text-foreground">{item.time} • {item.date}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" /> {item.venue}</p>
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
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 px-2">
              <Radio className="h-4 w-4" /> Live Highlights
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {liveMatches.map((match) => (
                <Link key={match.id} href={`/events/${match.sport}`} onClick={() => triggerHaptic('medium')}>
                  <Card className={cn("premium-card group", (match.teamA === myHouse || match.teamB === myHouse) && "border-primary bg-primary/5")}>
                    <CardContent className="p-4 md:p-8 flex items-center justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Live</span>
                          </div>
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest border-l border-border pl-4">
                            {match.sport.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 md:gap-6">
                          <p className="text-[13px] md:text-3xl font-black uppercase tracking-tighter flex-1 text-right truncate">{match.teamA}</p>
                          <span className="text-xl md:text-4xl font-black text-primary bg-muted px-3 py-1 rounded-md border border-border min-w-[70px] text-center">{match.scoreA}:{match.scoreB}</span>
                          <p className="text-[13px] md:text-3xl font-black uppercase tracking-tighter flex-1 text-left truncate">{match.teamB}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-muted-foreground/20 group-hover:text-primary transition-all" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sport Grid */}
        <section className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40 px-2">Explore Tournament</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {EVENTS.map((event) => {
              const IconComp = ICON_MAP[event.icon];
              return (
                <Link key={event.id} href={`/events/${event.slug}`} onClick={() => triggerHaptic('light')}>
                  <Card className="premium-card group h-full">
                    <CardContent className="p-0 flex h-36">
                      <div className="w-1/4 bg-muted/50 flex items-center justify-center border-r border-border group-hover:bg-primary/5 transition-colors">
                        {IconComp && <IconComp className="h-8 w-8 text-muted-foreground/30 group-hover:text-primary transition-all duration-300" />}
                      </div>
                      <div className="w-3/4 p-6 flex flex-col justify-center space-y-1">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">{event.name}</h2>
                        <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest leading-relaxed">{event.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
