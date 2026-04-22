
'use client';

import { useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { EVENTS } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Match, RunResult, Standing, GROUPS } from '@/lib/types';
import Loading from '@/app/loading';
import { Trophy, Zap, CircleDot, Target, Medal, MapPin, Calendar, Clock, Activity } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

export default function EventPage() {
  const params = useParams();
  const sport = params.sport as string;
  const db = useFirestore();

  const event = EVENTS.find(e => e.slug === sport);
  if (!event) notFound();

  const matchesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'matches'), where('sport', '==', sport));
  }, [db, sport]);

  const standingsQuery = useMemo(() => {
    if (!db || sport === 'kampus-run') return null;
    return query(collection(db, 'standings'), where('sport', '==', sport));
  }, [db, sport]);

  const runResultsQuery = useMemo(() => {
    if (!db || sport !== 'kampus-run') return null;
    return query(collection(db, 'runResults'));
  }, [db, sport]);

  const { data: rawMatches, loading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: standings, loading: stdLoading } = useCollection<Standing>(standingsQuery);
  const { data: rawRunResults, loading: runLoading } = useCollection<RunResult>(runResultsQuery);

  const sportMatches = useMemo(() => {
    return [...(rawMatches || [])].sort((a, b) => {
      const numA = parseInt(a.matchNumber) || 0;
      const numB = parseInt(b.matchNumber) || 0;
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });
  }, [rawMatches]);

  const runResults = useMemo(() => {
    return [...(rawRunResults || [])].sort((a, b) => a.position - b.position);
  }, [rawRunResults]);

  if (matchesLoading || stdLoading || runLoading) return <Loading />;

  const IconComp = ICON_MAP[event.icon];
  const raceSchedules = sportMatches?.filter(m => m.phase === 'race');

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-20 px-4 md:px-0">
      {/* High-Impact Broadcast Hero */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/30 via-background to-background border border-white/5 p-8 md:p-20 shadow-2xl">
        <div className="absolute -top-10 -right-10 opacity-5 blur-xl">
           {IconComp && <IconComp className="h-96 w-96 text-primary" />}
        </div>
        <div className="relative z-10 space-y-6">
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px] font-black px-6 py-2 tracking-[0.4em] animate-pulse">
            TRANSMISSION ACTIVE: {sport.toUpperCase()}
          </Badge>
          <div className="space-y-4">
            <h1 className="text-5xl md:text-9xl font-black italic text-white tracking-tighter uppercase leading-[0.85] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/30">
              {event.name}
            </h1>
            <p className="text-sm md:text-lg text-muted-foreground uppercase tracking-[0.3em] font-black max-w-2xl leading-relaxed opacity-70">
              {event.description}
            </p>
          </div>
        </div>
      </div>

      {sport === 'kampus-run' ? (
        <section className="space-y-16">
          {raceSchedules && raceSchedules.length > 0 && (
            <div className="space-y-8">
               <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-primary flex items-center gap-4 ml-2">
                 <Clock className="h-5 w-5" /> RACE PROTOCOL
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {raceSchedules.map(race => (
                    <Card key={race.id} className="premium-card bg-white/[0.02]">
                      <CardHeader className="p-8 border-b border-white/5 text-center">
                        <CardTitle className="text-3xl font-black uppercase italic tracking-tighter text-white">
                          {race.teamA}
                        </CardTitle>
                        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mt-2 opacity-50">
                          {race.date} • {race.venue}
                        </p>
                      </CardHeader>
                      <CardContent className="p-10 flex items-center justify-around">
                        <div className="text-center space-y-2">
                          <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">REPORTING</p>
                          <p className="text-4xl font-black text-white tabular-nums">{race.reportingTime || '--:--'}</p>
                        </div>
                        <div className="h-20 w-px bg-white/10" />
                        <div className="text-center space-y-2">
                          <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">START VECTOR</p>
                          <p className="text-4xl font-black text-accent tabular-nums">{race.time}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-8">
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-primary flex items-center gap-4 ml-2">
              <Medal className="h-5 w-5" /> PERFORMANCE REGISTRY
            </h2>
            <Card className="premium-card rounded-[2rem] overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24 text-center">RANK</TableHead>
                      <TableHead>PARTICIPANT</TableHead>
                      <TableHead>PROTOCOL</TableHead>
                      <TableHead className="text-right pr-10">RECORD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runResults?.map((res) => (
                      <TableRow key={res.id} className="h-24 hover:bg-white/[0.03]">
                        <TableCell className="text-center text-3xl font-black italic text-primary">#{res.position}</TableCell>
                        <TableCell className="text-xl md:text-3xl font-black uppercase italic text-white tracking-tighter">{res.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-[10px] font-black uppercase h-7 bg-primary/10 border-primary/20 text-primary px-4 tracking-widest">
                              {res.category}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-black uppercase h-7 border-white/10 px-4 tracking-widest opacity-60">
                              {res.gender === 'M' ? 'MALE' : 'FEMALE'}
                            </Badge>
                            {res.ageGroup && res.ageGroup !== 'Open' && (
                               <Badge variant="outline" className="text-[10px] font-black uppercase h-7 border-accent/20 text-accent px-4 tracking-widest">{res.ageGroup}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-10 text-3xl md:text-5xl font-black tabular-nums text-accent">{res.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </section>
      ) : (
        <>
          <section className="space-y-8">
             <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-primary flex items-center gap-4 ml-2">
               <Trophy className="h-5 w-5" /> TOURNAMENT MATRIX
             </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {GROUPS.map(group => {
                const groupStandings = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
                if (!groupStandings?.length) return null;
                return (
                  <Card key={group} className="premium-card bg-white/[0.01]">
                    <CardHeader className="p-6 border-b border-white/5 bg-white/[0.04] text-center">
                      <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">GROUP {group}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {groupStandings.map((row) => (
                            <TableRow key={row.team} className="h-16">
                              <TableCell className="text-xl font-black uppercase italic text-white py-0 pl-6">{row.team}</TableCell>
                              <TableCell className="text-right font-black text-3xl py-0 pr-8">
                                {row.points} <span className="text-[10px] text-muted-foreground/30 ml-1">PTS</span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-primary flex items-center gap-4 ml-2">
              <Zap className="h-5 w-5" /> LIVE TRANSMISSION STREAM
            </h2>
            <Tabs defaultValue="live" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/[0.04] border border-white/10 p-2 h-16 rounded-2xl">
                <TabsTrigger value="live" className="text-[11px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">LIVE FEED</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-[11px] font-black uppercase tracking-widest rounded-xl">SCHEDULE</TabsTrigger>
                <TabsTrigger value="completed" className="text-[11px] font-black uppercase tracking-widest rounded-xl">ARCHIVE</TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="space-y-8 mt-10">
                {sportMatches?.filter(m => m.status === 'Live').map(match => (
                  <Card key={match.id} className="premium-card border-accent/30 bg-accent/5 rounded-[2.5rem]">
                    <CardContent className="p-8 md:p-16">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="flex-1 text-center md:text-right">
                          <p className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter text-white">{match.teamA}</p>
                        </div>
                        <div className="flex flex-col items-center gap-8">
                          <div className="text-7xl md:text-9xl font-black tabular-nums tracking-tighter bg-black/40 px-12 md:px-20 py-8 md:py-10 rounded-[3rem] border border-white/10 shadow-[0_0_80px_rgba(var(--accent),0.3)] border-accent/20">
                            {match.scoreA} : {match.scoreB}
                          </div>
                          <Badge className="bg-accent text-black text-[11px] font-black uppercase animate-pulse px-6 py-2 tracking-widest rounded-full">
                            TRANSMISSION LIVE
                          </Badge>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <p className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter text-white">{match.teamB}</p>
                        </div>
                      </div>
                      
                      {sport === 'badminton' && match.badmintonResults && (
                        <div className="mt-16 pt-16 border-t border-white/10 grid grid-cols-2 md:grid-cols-5 gap-4">
                          {match.badmintonResults.map((sub, idx) => (
                            <div key={idx} className="bg-white/5 rounded-3xl p-6 text-center border border-white/5">
                              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-3">{sub.type}</p>
                              <p className="text-2xl font-black text-white tabular-nums">{sub.score}</p>
                              {sub.winner && <p className="text-[8px] font-black text-accent uppercase mt-3 tracking-widest">WIN: {sub.winner}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-16 text-center border-t border-white/10 pt-10 flex flex-col items-center gap-3">
                        <span className="text-[11px] font-black uppercase text-primary tracking-[0.5em] opacity-80">M#{match.matchNumber} TRANSMISSION VECTOR</span>
                        <div className="flex flex-wrap justify-center gap-4">
                          <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.4em] flex items-center gap-3">
                            <MapPin className="h-5 w-5" /> {match.venue}
                          </span>
                           { (match.courtNumber || match.groundNumber) && (
                              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-accent/10 border-accent/20 text-accent px-4 py-1">
                                {match.courtNumber || match.groundNumber}
                              </Badge>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-6 mt-10">
                {sportMatches?.filter(m => m.status === 'Upcoming').map(match => (
                  <Card key={match.id} className="premium-card group hover:bg-white/[0.02]">
                    <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="text-center md:pr-10 md:border-r border-white/10 md:w-40">
                          <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-2">M#{match.matchNumber}</p>
                          <p className="text-4xl font-black text-white uppercase tabular-nums">{match.time}</p>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2 opacity-50">{match.day}</p>
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-3xl md:text-5xl font-black uppercase italic tracking-tight group-hover:text-primary transition-all duration-300">
                            {match.teamA} <span className="text-muted-foreground/20 mx-4 text-2xl font-medium">VS</span> {match.teamB}
                          </p>
                          <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 mt-4">
                            <span className="text-[11px] font-black text-muted-foreground/40 uppercase flex items-center gap-3 tracking-widest">
                              <MapPin className="h-4 w-4" /> {match.venue}
                            </span>
                            <span className="text-[11px] font-black text-muted-foreground/40 uppercase flex items-center gap-3 tracking-widest">
                              <Calendar className="h-4 w-4" /> {match.date}
                            </span>
                            { (match.courtNumber || match.groundNumber) && (
                              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-accent/10 border-accent/20 text-accent px-4 py-1">
                                {match.courtNumber || match.groundNumber}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black uppercase px-6 py-2 h-10 bg-white/5 border-white/10 tracking-widest">{match.phase}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-8 mt-10">
                {sportMatches?.filter(m => m.status === 'Completed').map(match => (
                  <Card key={match.id} className="premium-card group border-white/5">
                    <CardContent className="p-0">
                      <div className="p-10 md:p-14 flex items-center justify-between gap-6">
                        <div className="flex-1 text-right">
                          <p className={cn("font-black text-2xl md:text-5xl uppercase italic tracking-tighter", match.scoreA > match.scoreB ? 'text-primary' : 'text-muted-foreground/40')}>
                            {match.teamA}
                          </p>
                        </div>
                        <div className="text-4xl md:text-7xl font-black tabular-nums bg-white/5 px-10 py-5 rounded-3xl border border-white/10 shadow-xl border-white/5">
                          {match.scoreA} - {match.scoreB}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={cn("font-black text-2xl md:text-5xl uppercase italic tracking-tighter", match.scoreB > match.scoreA ? 'text-primary' : 'text-muted-foreground/40')}>
                            {match.teamB}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row items-center justify-between px-10 py-6 border-t border-white/5 bg-white/[0.03]">
                        <span className="text-[11px] font-black uppercase text-muted-foreground/20 tracking-[0.5em]">
                          M#{match.matchNumber} ARCHIVE • {match.venue.toUpperCase()} • {match.phase.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-black text-primary/30 uppercase tracking-widest mt-2 md:mt-0">{match.date}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </section>
        </>
      )}
    </div>
  );
}
