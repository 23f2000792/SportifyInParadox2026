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
import { Trophy, Zap, CircleDot, Target, MapPin, Calendar, Share2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
      return numA - numB;
    });
  }, [rawMatches]);

  const runResults = useMemo(() => {
    return [...(rawRunResults || [])].sort((a, b) => a.position - b.position);
  }, [rawRunResults]);

  const handleShare = (match: Match) => {
    const text = `🏆 *Paradox 2026 Results* 🏆\n\nSport: ${match.sport.toUpperCase()}\n${match.teamA} ${match.scoreA} - ${match.scoreB} ${match.teamB}\nPhase: ${match.phase}\n\nView results on Sportify!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast({ title: "Sharing result..." });
  };

  if (matchesLoading || stdLoading || runLoading) return <Loading />;

  const IconComp = ICON_MAP[event.icon];
  const raceSchedules = sportMatches?.filter(m => m.phase === 'race');

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-32 px-4 md:px-0">
      {/* Refined Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.01] border border-white/[0.03] p-8 md:p-16 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              {IconComp && <IconComp className="h-6 w-6 text-primary" />}
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-7xl font-black italic text-white tracking-tighter uppercase leading-none">
              {event.name}
            </h1>
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-[0.3em] font-bold max-w-xl mx-auto opacity-60">
              {event.description}
            </p>
          </div>
        </div>
      </div>

      {sport === 'kampus-run' ? (
        <section className="space-y-12">
          {raceSchedules && raceSchedules.length > 0 && (
            <div className="space-y-6">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary text-center">
                 Race Protocols
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {raceSchedules.map(race => (
                    <Card key={race.id} className="premium-card">
                      <CardHeader className="p-6 border-b border-white/[0.03] text-center">
                        <CardTitle className="text-lg font-black uppercase italic text-white">
                          {race.teamA}
                        </CardTitle>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1">
                          {race.date} • {race.venue}
                        </p>
                      </CardHeader>
                      <CardContent className="p-8 flex items-center justify-around">
                        <div className="text-center space-y-1">
                          <p className="text-[10px] font-black uppercase text-muted-foreground/30 tracking-widest">Reporting</p>
                          <p className="text-2xl md:text-3xl font-black text-white">{race.reportingTime || '--:--'}</p>
                        </div>
                        <div className="h-10 w-px bg-white/[0.03]" />
                        <div className="text-center space-y-1">
                          <p className="text-[10px] font-black uppercase text-muted-foreground/30 tracking-widest">Start</p>
                          <p className="text-2xl md:text-3xl font-black text-primary">{race.time}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary text-center">
              Official Leaderboard
            </h2>
            <Card className="premium-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 text-center">Rank</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead className="hidden sm:table-cell">Details</TableHead>
                    <TableHead className="text-right pr-6">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runResults?.map((res) => (
                    <TableRow key={res.id} className="h-20">
                      <TableCell className="text-center text-xl md:text-2xl font-black italic text-primary">#{res.position}</TableCell>
                      <TableCell>
                        <p className="text-base md:text-lg font-black uppercase italic text-white">{res.name}</p>
                        <div className="flex gap-2 mt-0.5 sm:hidden">
                           <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{res.category} • {res.gender}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold border-white/5 bg-white/[0.01] px-2">{res.category}</Badge>
                          <Badge variant="outline" className="text-[10px] font-bold border-white/5 bg-white/[0.01] opacity-60 px-2">{res.gender}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 text-xl md:text-2xl font-black text-white tracking-tighter tabular-nums">{res.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </section>
      ) : (
        <>
          <section className="space-y-6">
             <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary text-center">
               House Table
             </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {GROUPS.map(group => {
                const groupStandings = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
                if (!groupStandings?.length) return null;
                return (
                  <Card key={group} className="premium-card border-none bg-white/[0.01]">
                    <CardHeader className="p-4 border-b border-white/[0.03] text-center bg-white/[0.01]">
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Pool {group}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {groupStandings.map((row) => (
                            <TableRow key={row.team} className="h-14 border-none hover:bg-white/[0.02]">
                              <TableCell className="text-base font-black uppercase italic text-white pl-6">{row.team}</TableCell>
                              <TableCell className="text-right font-black text-xl pr-6">
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
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary text-center">
              Match Center
            </h2>
            <Tabs defaultValue="live" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/[0.02] border border-white/[0.05] p-1 h-14 rounded-xl max-w-lg mx-auto">
                <TabsTrigger value="live" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Live</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Schedule</TabsTrigger>
                <TabsTrigger value="completed" className="text-[10px] font-black uppercase tracking-widest rounded-lg">History</TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="space-y-4 mt-8">
                {sportMatches?.filter(m => m.status === 'Live').map(match => (
                  <Card key={match.id} className="premium-card border-primary/10 bg-primary/[0.01]">
                    <CardContent className="p-8 md:p-12">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1 text-center md:text-right">
                          <p className="text-2xl md:text-4xl font-black uppercase italic text-white tracking-tighter">{match.teamA}</p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                          <div className="text-5xl md:text-7xl font-black tracking-tighter bg-black/60 px-8 py-6 rounded-3xl border border-white/[0.05] shadow-2xl">
                            {match.scoreA} : {match.scoreB}
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">Live Score</span>
                          </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <p className="text-2xl md:text-4xl font-black uppercase italic text-white tracking-tighter">{match.teamB}</p>
                        </div>
                      </div>
                      
                      {sport === 'badminton' && match.badmintonResults && (
                        <div className="mt-8 pt-8 border-t border-white/[0.03] grid grid-cols-2 md:grid-cols-4 gap-3">
                          {match.badmintonResults.map((sub, idx) => (
                            <div key={idx} className="bg-white/[0.02] rounded-xl p-4 text-center border border-white/[0.03]">
                              <p className="text-[9px] font-black text-primary/60 uppercase mb-2 tracking-widest">{sub.type}</p>
                              <p className="text-lg font-black text-white tracking-tight">{sub.score}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4 mt-8">
                {sportMatches?.filter(m => m.status === 'Upcoming').map(match => (
                  <Card key={match.id} className="premium-card group bg-white/[0.01] hover:bg-white/[0.02]">
                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="text-center md:pr-8 md:border-r border-white/[0.03] md:w-32">
                          <p className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] mb-1">M#{match.matchNumber}</p>
                          <p className="text-2xl md:text-3xl font-black text-white tracking-tighter">{match.time}</p>
                          <p className="text-[10px] font-bold text-muted-foreground/20 uppercase mt-1 tracking-widest">{match.day}</p>
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-white">
                            {match.teamA} <span className="text-white/10 mx-2 font-light">VS</span> {match.teamB}
                          </p>
                          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-2">
                            <span className="text-[10px] font-bold text-muted-foreground/30 uppercase flex items-center gap-1.5 tracking-widest">
                              <MapPin className="h-3 w-3" /> {match.venue}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black border-white/5 bg-white/[0.01] px-4 uppercase">{match.phase.replace('-', ' ')}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 mt-8">
                {sportMatches?.filter(m => m.status === 'Completed').map(match => (
                  <Card key={match.id} className="premium-card border-none bg-white/[0.01]">
                    <CardContent className="p-0">
                      <div className="p-6 md:p-10 flex items-center justify-between gap-4">
                        <div className="flex-1 text-right">
                          <p className={cn("font-black text-lg md:text-3xl uppercase italic tracking-tighter", match.scoreA > match.scoreB ? 'text-white' : 'text-muted-foreground/20')}>
                            {match.teamA}
                          </p>
                        </div>
                        <div className="text-2xl md:text-4xl font-black bg-black/40 px-6 py-4 rounded-2xl border border-white/[0.05]">
                          {match.scoreA} - {match.scoreB}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={cn("font-black text-lg md:text-3xl uppercase italic tracking-tighter", match.scoreB > match.scoreA ? 'text-white' : 'text-muted-foreground/20')}>
                            {match.teamB}
                          </p>
                        </div>
                      </div>

                      {sport === 'badminton' && match.badmintonResults && (
                        <Accordion type="single" collapsible className="w-full px-6 pb-4">
                          <AccordionItem value="details" className="border-none">
                            <AccordionTrigger className="text-[10px] font-black uppercase text-primary/40 hover:no-underline py-2 tracking-widest">
                              View Sub-Match Scores
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                                {match.badmintonResults.map((sub, idx) => (
                                  <div key={idx} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.03] text-center">
                                    <p className="text-[9px] font-black text-primary/60 uppercase mb-1">{sub.type}</p>
                                    <p className="text-base font-black text-white">{sub.score}</p>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-white/[0.03] bg-white/[0.005]">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black uppercase text-muted-foreground/20 tracking-widest">
                            M#{match.matchNumber} • {match.phase.toUpperCase()}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => handleShare(match)} className="h-7 text-[10px] font-black text-primary/60 hover:text-primary gap-1.5">
                            <Share2 className="h-3 w-3" /> Share
                          </Button>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground/10 uppercase mt-1 md:mt-0">{match.date} • {match.venue}</span>
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
