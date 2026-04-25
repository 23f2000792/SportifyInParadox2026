
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, ChevronRight, Radio, MapPin, Star, CalendarClock, Activity, ClipboardList, Medal } from 'lucide-react';
import { EVENTS } from '@/lib/mock-data';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Match, HOUSES, Trial, ChampionshipStanding } from '@/lib/types';
import Loading from '@/app/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

  // Queries
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

  const championshipQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'championship'), orderBy('points', 'desc'));
  }, [db]);

  const { data: liveMatches, loading: matchesLoading } = useCollection<Match>(liveMatchesQuery);
  const { data: allUpcoming } = useCollection<Match>(upcomingMatchesQuery);
  const { data: allTrials } = useCollection<Trial>(houseTrialsQuery);
  const { data: championshipData } = useCollection<ChampionshipStanding>(championshipQuery);

  // Unified Timeline for Followed House
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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/20 border border-border mb-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Sportify Paradox 2026</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.9] text-foreground">
            SPORTIFY
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.5em] text-primary/60">Official Broadcast Hub</p>
        </div>

        {/* My House Personalization */}
        <div className="max-w-xs mx-auto pt-6">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Personalize Your Hub</p>
            <Select value={myHouse} onValueChange={handleFollowHouse}>
              <SelectTrigger className="bg-muted/30 border-border h-11 text-[11px] font-black uppercase">
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

      {/* Unified House Timeline - CAROUSEL */}
      {myHouse && myHouseTimeline.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> Your House Schedule
            </h2>
            <div className="hidden md:flex gap-2">
               <p className="text-[8px] font-black uppercase text-muted-foreground/40 mr-2 self-center">Swipe to explore</p>
            </div>
          </div>
          <div className="relative px-4 md:px-0">
            <Carousel
              opts={{
                align: "start",
                dragFree: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {myHouseTimeline.map((item: any) => (
                  <CarouselItem key={item.id} className="pl-4 basis-[85%] sm:basis-[45%] md:basis-[30%] lg:basis-[25%]">
                    <Link href={`/events/${item.sport}`} className="block h-full">
                      <Card className={cn(
                        "premium-card h-full group transition-transform active:scale-95",
                        item.type === 'trial' ? "border-amber-500/20 bg-amber-500/[0.02]" : "border-primary/20 bg-primary/[0.02]"
                      )}>
                        <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">{item.sport.replace('-', ' ')}</p>
                              {item.type === 'trial' ? (
                                <ClipboardList className="h-3 w-3 text-amber-500" />
                              ) : (
                                <Activity className="h-3 w-3 text-primary" />
                              )}
                            </div>
                            <p className="text-base font-black italic uppercase text-foreground leading-tight line-clamp-2">
                              {item.type === 'match' 
                                ? `VS ${item.teamA === myHouse ? item.teamB : item.teamA}`
                                : `SELECTION TRIAL`}
                            </p>
                          </div>
                          <div className="space-y-1 border-t border-border/10 pt-3 mt-auto">
                            <p className="text-[10px] font-black text-foreground">{item.time} • {item.date}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 shrink-0" /> {item.venue}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="-left-12 h-8 w-8" />
                <CarouselNext className="-right-12 h-8 w-8" />
              </div>
            </Carousel>
          </div>
        </section>
      )}

      {/* Live Feed */}
      {liveMatches && liveMatches.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <Radio className="h-4 w-4" /> Live Highlights
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {liveMatches.map((match) => {
              const isMyMatch = match.teamA === myHouse || match.teamB === myHouse;
              return (
                <Link key={match.id} href={`/events/${match.sport}`}>
                  <Card className={cn(
                    "premium-card group border-primary/20",
                    isMyMatch && "border-primary shadow-xl shadow-primary/10 bg-primary/[0.02]"
                  )}>
                    <CardContent className="p-6 md:p-8 flex items-center justify-between gap-4">
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Live Arena</span>
                          </div>
                          <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {match.venue}
                          </span>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 overflow-hidden">
                          <p className={cn(
                            "text-xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground leading-tight break-words flex-1",
                            match.teamA === myHouse && "text-primary"
                          )}>
                            {match.teamA}
                          </p>
                          <div className="flex flex-col items-center">
                            <span className="text-3xl md:text-5xl font-black text-primary whitespace-nowrap bg-muted/20 px-4 py-1 rounded-xl border border-border">
                              {match.scoreA} : {match.scoreB}
                            </span>
                          </div>
                          <p className={cn(
                            "text-xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground leading-tight break-words flex-1 md:text-left",
                            match.teamB === myHouse && "text-primary"
                          )}>
                            {match.teamB}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-8 w-8 text-muted-foreground/20 group-hover:text-primary transition-all shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Championship Glory Board */}
      <section className="space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 px-2">
          <Trophy className="h-4 w-4" /> Championship Glory Board
        </h2>
        <Card className="premium-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Pos</TableHead>
                <TableHead>House</TableHead>
                <TableHead className="text-center"><div className="flex justify-center"><Medal className="h-4 w-4 text-yellow-500" /></div></TableHead>
                <TableHead className="text-center"><div className="flex justify-center"><Medal className="h-4 w-4 text-slate-400" /></div></TableHead>
                <TableHead className="text-center"><div className="flex justify-center"><Medal className="h-4 w-4 text-amber-700" /></div></TableHead>
                <TableHead className="text-right">PTS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {championshipData && championshipData.length > 0 ? (
                championshipData.map((s, idx) => (
                  <TableRow key={s.id} className={cn(s.house === myHouse && "bg-primary/[0.05]")}>
                    <TableCell className="text-xs font-black">{idx + 1}</TableCell>
                    <TableCell className="text-xs font-black uppercase">{s.house}</TableCell>
                    <TableCell className="text-center text-xs font-bold">{s.gold}</TableCell>
                    <TableCell className="text-center text-xs font-bold">{s.silver}</TableCell>
                    <TableCell className="text-center text-xs font-bold">{s.bronze}</TableCell>
                    <TableCell className="text-right text-sm font-black text-primary">{s.points}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 opacity-30 text-[9px] font-black uppercase">Championship data syncing...</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* Sport Grid */}
      <section className="space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40 px-2">
          Explore Tournament
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
                          {event.slug === 'kampus-run' ? event.description.split('. ')[0] : event.description}
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
