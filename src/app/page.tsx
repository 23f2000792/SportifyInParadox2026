
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, ChevronRight, Radio, MapPin, Star, CalendarClock, Activity, ClipboardList, Medal, TrendingUp } from 'lucide-react';
import { EVENTS } from '@/lib/mock-data';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Match, HOUSES, Trial, ChampionshipStanding } from '@/lib/types';
import Loading from '@/app/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

const HOUSE_COLORS: Record<string, string> = {
  Sundarbans: "#10b981",
  Nallamala: "#f59e0b",
  Gir: "#3b82f6",
  Bandipur: "#ef4444",
  Kaziranga: "#8b5cf6",
  Corbett: "#ec4899",
  Wayanad: "#06b6d4",
  Nilgiri: "#f97316",
  Saranda: "#6366f1",
  Namdapha: "#14b8a6",
  Pichavaram: "#a855f7",
  Kanha: "#fbbf24",
};

export default function Home() {
  const db = useFirestore();
  const [myHouse, setMyHouse] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('followedHouse');
    if (saved) setMyHouse(saved);
  }, []);

  const handleFollowHouse = (house: string) => {
    triggerHaptic('success');
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

  const standingsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'championship'), orderBy('points', 'desc'));
  }, [db]);

  const { data: liveMatches, loading: matchesLoading } = useCollection<Match>(liveMatchesQuery);
  const { data: allUpcoming } = useCollection<Match>(upcomingMatchesQuery);
  const { data: allTrials } = useCollection<Trial>(houseTrialsQuery);
  const { data: overallStandings } = useCollection<ChampionshipStanding>(standingsQuery);

  const chartData = useMemo(() => {
    if (!overallStandings) return [];
    return overallStandings.slice(0, 6).map(s => ({
      name: s.house,
      points: s.points,
      fill: HOUSE_COLORS[s.house] || "#7c3aed"
    }));
  }, [overallStandings]);

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

        {/* My House Personalization */}
        <div className="max-w-xs mx-auto pt-6">
          <div className="bg-card border border-border rounded-md p-4 space-y-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Personalize Your Hub</p>
            <Select value={myHouse} onValueChange={handleFollowHouse}>
              <SelectTrigger className="bg-muted h-11 text-[11px] font-black uppercase rounded-sm" onClick={() => triggerHaptic('light')}>
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

      {/* Championship Dashboard */}
      {overallStandings && overallStandings.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Championship Race
            </h2>
            <Link href="/standings" className="text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">View All</Link>
          </div>
          <Card className="premium-card bg-muted/5 border-primary/10 overflow-hidden">
            <div className="p-6 md:p-10 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {overallStandings.slice(0, 4).map((h, i) => (
                  <div key={h.house} className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Rank #{i + 1}</p>
                    <p className="text-lg font-black uppercase italic tracking-tighter leading-none">{h.house}</p>
                    <p className="text-2xl font-black text-primary">{h.points} <span className="text-[10px] opacity-40 uppercase tracking-widest">Pts</span></p>
                  </div>
                ))}
              </div>
              
              <div className="h-[200px] w-full mt-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => v.substring(0, 3).toUpperCase()}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(124, 58, 237, 0.05)'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card border border-border p-3 rounded-sm shadow-xl">
                              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{payload[0].payload.name}</p>
                              <p className="text-lg font-black">{payload[0].value} PTS</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="points" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Unified House Timeline */}
      {myHouse && myHouseTimeline.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> Your House Schedule
            </h2>
          </div>
          <div className="relative px-4 md:px-0">
            <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
              <CarouselContent className="-ml-4">
                {myHouseTimeline.map((item: any) => (
                  <CarouselItem key={item.id} className="pl-4 basis-[85%] sm:basis-[45%] md:basis-[30%] lg:basis-[25%]">
                    <Link href={`/events/${item.sport}`} className="block h-full" onClick={() => triggerHaptic('light')}>
                      <Card className={cn(
                        "premium-card h-full group",
                        item.type === 'trial' ? "border-accent/20 bg-accent/5" : "border-primary/10 bg-primary/5"
                      )}>
                        <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{item.sport.replace('-', ' ')}</p>
                              {item.type === 'trial' ? <ClipboardList className="h-3 w-3 text-accent" /> : <Activity className="h-3 w-3 text-primary" />}
                            </div>
                            <p className="text-base font-black italic uppercase text-foreground leading-tight line-clamp-2">
                              {item.type === 'match' ? `VS ${item.teamA === myHouse ? item.teamB : item.teamA}` : `SELECTION TRIAL`}
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
                <Link key={match.id} href={`/events/${match.sport}`} onClick={() => triggerHaptic('medium')}>
                  <Card className={cn(
                    "premium-card group",
                    isMyMatch && "border-primary bg-primary/5"
                  )}>
                    <CardContent className="p-4 md:p-8 flex items-center justify-between gap-2 md:gap-4">
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[8px] md:text-[9px] font-black text-primary uppercase tracking-widest">Live</span>
                          </div>
                          <span className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" /> {match.venue}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                          <p className={cn(
                            "text-[13px] md:text-4xl font-black uppercase italic tracking-tighter text-foreground leading-none flex-1 text-right break-words", 
                            match.teamA === myHouse && "text-primary"
                          )}>
                            {match.teamA}
                          </p>
                          <div className="flex flex-col items-center shrink-0">
                            <span className="text-xl md:text-5xl font-black text-primary bg-muted px-2 md:px-4 py-1 rounded-md border border-border">
                              {match.scoreA}:{match.scoreB}
                            </span>
                          </div>
                          <p className={cn(
                            "text-[13px] md:text-4xl font-black uppercase italic tracking-tighter text-foreground leading-none flex-1 text-left break-words", 
                            match.teamB === myHouse && "text-primary"
                          )}>
                            {match.teamB}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground/20 group-hover:text-primary transition-all shrink-0" />
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
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40 px-2">Explore Tournament</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            return (
              <Link key={event.id} href={`/events/${event.slug}`} onClick={() => triggerHaptic('light')}>
                <Card className="premium-card group h-full">
                  <CardContent className="p-0">
                    <div className="flex h-36 md:h-44">
                      <div className="w-1/4 bg-muted/50 flex items-center justify-center border-r border-border group-hover:bg-primary/5 transition-colors">
                        {IconComp && <IconComp className="h-8 w-8 text-muted-foreground/30 group-hover:text-primary transition-all duration-300" />}
                      </div>
                      <div className="w-3/4 p-6 flex flex-col justify-center space-y-1">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">{event.name}</h2>
                        <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest leading-relaxed">{event.description}</p>
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
