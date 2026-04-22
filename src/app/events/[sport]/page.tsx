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
import { Trophy, Zap, CircleDot, Target, Medal, MapPin, Calendar, Clock, Activity, ChevronDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
    <div className="space-y-10 max-w-6xl mx-auto pb-20 px-4 md:px-0">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/30 via-background to-background border border-white/5 p-8 md:p-14 shadow-2xl">
        <div className="absolute -top-10 -right-10 opacity-5 blur-xl">
           {IconComp && <IconComp className="h-64 w-64 text-primary" />}
        </div>
        <div className="relative z-10 space-y-4">
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[9px] font-black px-4 py-1.5 tracking-[0.3em] animate-pulse">
            LIVE: {sport.toUpperCase()}
          </Badge>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-7xl font-black italic text-white tracking-tighter uppercase leading-[0.9] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/30">
              {event.name}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-[0.2em] font-black max-w-xl leading-relaxed opacity-70">
              {event.description}
            </p>
          </div>
        </div>
      </div>

      {sport === 'kampus-run' ? (
        <section className="space-y-12">
          {raceSchedules && raceSchedules.length > 0 && (
            <div className="space-y-6">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3 ml-1">
                 <Clock className="h-4 w-4" /> RACE SCHEDULE
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {raceSchedules.map(race => (
                    <Card key={race.id} className="premium-card bg-white/[0.02]">
                      <CardHeader className="p-6 border-b border-white/5 text-center">
                        <CardTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">
                          {race.teamA}
                        </CardTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1 opacity-50">
                          {race.date} • {race.venue}
                        </p>
                      </CardHeader>
                      <CardContent className="p-8 flex items-center justify-around">
                        <div className="text-center space-y-1">
                          <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">REPORTING</p>
                          <p className="text-3xl font-black text-white tabular-nums">{race.reportingTime || '--:--'}</p>
                        </div>
                        <div className="h-14 w-px bg-white/10" />
                        <div className="text-center space-y-1">
                          <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">START TIME</p>
                          <p className="text-3xl font-black text-accent tabular-nums">{race.time}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3 ml-1">
              <Medal className="h-4 w-4" /> RACE RESULTS
            </h2>
            <Card className="premium-card rounded-[1.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20 text-center">RANK</TableHead>
                      <TableHead>NAME</TableHead>
                      <TableHead>CATEGORY</TableHead>
                      <TableHead className="text-right pr-8">TIME</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runResults?.map((res) => (
                      <TableRow key={res.id} className="h-20 hover:bg-white/[0.03]">
                        <TableCell className="text-center text-2xl font-black italic text-primary">#{res.position}</TableCell>
                        <TableCell className="text-lg md:text-xl font-black uppercase italic text-white tracking-tighter">{res.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-[9px] font-black uppercase h-6 bg-primary/10 border-primary/20 text-primary px-3 tracking-widest">
                              {res.category}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] font-black uppercase h-6 border-white/10 px-3 tracking-widest opacity-60">
                              {res.gender === 'M' ? 'MALE' : 'FEMALE'}
                            </Badge>
                            {res.ageGroup && res.ageGroup !== 'Open' && (
                               <Badge variant="outline" className="text-[9px] font-black uppercase h-6 border-accent/20 text-accent px-3 tracking-widest">{res.ageGroup}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8 text-2xl md:text-3xl font-black tabular-nums text-accent">{res.time}</TableCell>
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
          <section className="space-y-6">
             <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3 ml-1">
               <Trophy className="h-4 w-4" /> STANDINGS
             </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {GROUPS.map(group => {
                const groupStandings = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
                if (!groupStandings?.length) return null;
                return (
                  <Card key={group} className="premium-card bg-white/[0.01]">
                    <CardHeader className="p-4 border-b border-white/5 bg-white/[0.04] text-center">
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">GROUP {group}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {groupStandings.map((row) => (
                            <TableRow key={row.team} className="h-14">
                              <TableCell className="text-base font-black uppercase italic text-white py-0 pl-4">{row.team}</TableCell>
                              <TableCell className="text-right font-black text-2xl py-0 pr-6">
                                {row.points} <span className="text-[9px] text-muted-foreground/30 ml-1">PTS</span>
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

          <section className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3 ml-1">
              <Zap className="h-4 w-4" /> LIVE MATCHES
            </h2>
            <Tabs defaultValue="live" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/[0.04] border border-white/10 p-1.5 h-14 rounded-xl">
                <TabsTrigger value="live" className="text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">LIVE</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-[10px] font-black uppercase tracking-widest rounded-lg">UPCOMING</TabsTrigger>
                <TabsTrigger value="completed" className="text-[10px] font-black uppercase tracking-widest rounded-lg">RESULTS</TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="space-y-6 mt-8">
                {sportMatches?.filter(m => m.status === 'Live').map(match => (
                  <Card key={match.id} className="premium-card border-accent/30 bg-accent/5 rounded-[2rem]">
                    <CardContent className="p-8 md:p-12">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1 text-center md:text-right">
                          <p className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">{match.teamA}</p>
                        </div>
                        <div className="flex flex-col items-center gap-6">
                          <div className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter bg-black/40 px-10 md:px-14 py-6 md:py-8 rounded-[2rem] border border-white/10 shadow-lg border-accent/20">
                            {match.scoreA} : {match.scoreB}
                          </div>
                          <Badge className="bg-accent text-black text-[10px] font-black uppercase animate-pulse px-4 py-1.5 tracking-widest rounded-full">
                            LIVE
                          </Badge>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <p className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">{match.teamB}</p>
                        </div>
                      </div>
                      
                      {sport === 'badminton' && match.badmintonResults && (
                        <div className="mt-12 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3">
                          {match.badmintonResults.map((sub, idx) => (
                            <div key={idx} className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                              <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-2">{sub.type}</p>
                              <p className="text-xl font-black text-white tabular-nums">{sub.score}</p>
                              {sub.winner && <p className="text-[8px] font-black text-accent uppercase mt-2 tracking-widest">WIN: {sub.winner}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-10 text-center border-t border-white/10 pt-8 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.3em] opacity-80">M#{match.matchNumber} MATCH DETAILS</span>
                        <div className="flex flex-wrap justify-center gap-4">
                          <span className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-[0.3em] flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> {match.venue}
                          </span>
                           { (match.courtNumber || match.groundNumber) && (
                              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-accent/10 border-accent/20 text-accent px-3 py-0.5">
                                {match.courtNumber || match.groundNumber}
                              </Badge>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4 mt-8">
                {sportMatches?.filter(m => m.status === 'Upcoming').map(match => (
                  <Card key={match.id} className="premium-card group hover:bg-white/[0.02]">
                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="text-center md:pr-8 md:border-r border-white/10 md:w-32">
                          <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">M#{match.matchNumber}</p>
                          <p className="text-3xl font-black text-white uppercase tabular-nums">{match.time}</p>
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1 opacity-50">{match.day}</p>
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-2xl md:text-3xl font-black uppercase italic tracking-tight group-hover:text-primary transition-all duration-300">
                            {match.teamA} <span className="text-muted-foreground/20 mx-3 text-xl font-medium">VS</span> {match.teamB}
                          </p>
                          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-3">
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase flex items-center gap-2 tracking-widest">
                              <MapPin className="h-3.5 w-3.5" /> {match.venue}
                            </span>
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase flex items-center gap-2 tracking-widest">
                              <Calendar className="h-3.5 w-3.5" /> {match.date}
                            </span>
                            { (match.courtNumber || match.groundNumber) && (
                              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-accent/10 border-accent/20 text-accent px-3 py-0.5">
                                {match.courtNumber || match.groundNumber}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-black uppercase px-4 py-1.5 h-8 bg-white/5 border-white/10 tracking-widest">{match.phase}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-6 mt-8">
                {sportMatches?.filter(m => m.status === 'Completed').map(match => (
                  <Card key={match.id} className="premium-card group border-white/5">
                    <CardContent className="p-0">
                      <div className="p-8 md:p-10 flex items-center justify-between gap-4">
                        <div className="flex-1 text-right">
                          <p className={cn("font-black text-xl md:text-3xl uppercase italic tracking-tighter", match.scoreA > match.scoreB ? 'text-primary' : 'text-muted-foreground/40')}>
                            {match.teamA}
                          </p>
                        </div>
                        <div className="text-3xl md:text-5xl font-black tabular-nums bg-white/5 px-8 py-4 rounded-2xl border border-white/10 shadow-md border-white/5">
                          {match.scoreA} - {match.scoreB}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={cn("font-black text-xl md:text-3xl uppercase italic tracking-tighter", match.scoreB > match.scoreA ? 'text-primary' : 'text-muted-foreground/40')}>
                            {match.teamB}
                          </p>
                        </div>
                      </div>

                      {sport === 'badminton' && match.badmintonResults && (
                        <Accordion type="single" collapsible className="w-full px-8 pb-4">
                          <AccordionItem value="details" className="border-none">
                            <AccordionTrigger className="text-[10px] font-black uppercase text-primary/60 hover:no-underline py-2">
                              Match Scores
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                                {match.badmintonResults.map((sub, idx) => (
                                  <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                                    <p className="text-[8px] font-black text-primary uppercase mb-1">{sub.type}</p>
                                    <p className="text-sm font-black text-white">{sub.score}</p>
                                    {sub.winner && <p className="text-[7px] font-black text-accent uppercase mt-1">Winner: {sub.winner}</p>}
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      <div className="flex flex-col md:flex-row items-center justify-between px-8 py-4 border-t border-white/5 bg-white/[0.03]">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/20 tracking-[0.3em]">
                          M#{match.matchNumber} RESULT • {match.venue.toUpperCase()} • {match.phase.toUpperCase()}
                        </span>
                        <span className="text-[8px] font-black text-primary/30 uppercase tracking-widest mt-1 md:mt-0">{match.date}</span>
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
