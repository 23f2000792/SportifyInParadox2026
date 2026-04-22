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
import { Trophy, Zap, CircleDot, Target, MapPin, Share2 } from 'lucide-react';
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
    <div className="space-y-10 max-w-6xl mx-auto pb-32 px-4 md:px-0">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.02] border border-white/[0.05] p-10 md:p-20 text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30">
              {IconComp && <IconComp className="h-8 w-8 text-primary" />}
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl md:text-8xl font-black italic text-white tracking-tighter uppercase leading-none">
              {event.name}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-[0.4em] font-bold max-w-2xl mx-auto">
              {event.description}
            </p>
          </div>
        </div>
      </div>

      {sport === 'kampus-run' ? (
        <section className="space-y-12">
          {raceSchedules && raceSchedules.length > 0 && (
            <div className="space-y-6">
               <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary text-center">
                 Race Protocol
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {raceSchedules.map(race => (
                    <Card key={race.id} className="premium-card">
                      <CardHeader className="p-6 border-b border-white/[0.05] text-center">
                        <CardTitle className="text-xl font-black uppercase italic text-white">
                          {race.teamA}
                        </CardTitle>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">
                          {race.date} • {race.venue}
                        </p>
                      </CardHeader>
                      <CardContent className="p-8 flex items-center justify-around">
                        <div className="text-center space-y-2">
                          <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">Reporting</p>
                          <p className="text-2xl md:text-4xl font-black text-white">{race.reportingTime || '--:--'}</p>
                        </div>
                        <div className="h-12 w-px bg-white/[0.05]" />
                        <div className="text-center space-y-2">
                          <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">Start Time</p>
                          <p className="text-2xl md:text-4xl font-black text-primary">{race.time}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary text-center">
              Official Leaderboard
            </h2>
            <Card className="premium-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24 text-center">Rank</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead className="text-right pr-8">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runResults?.map((res) => (
                    <TableRow key={res.id} className="h-20">
                      <TableCell className="text-center text-2xl md:text-3xl font-black italic text-primary">#{res.position}</TableCell>
                      <TableCell>
                        <p className="text-lg md:text-xl font-black uppercase italic text-white">{res.name}</p>
                        <div className="flex gap-2 mt-1 sm:hidden">
                           <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{res.category} • {res.gender}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-[10px] font-black border-white/10 bg-white/[0.02] px-3">{res.category}</Badge>
                          <Badge variant="outline" className="text-[10px] font-black border-white/10 bg-white/[0.02] opacity-60 px-3">{res.gender}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8 text-2xl md:text-3xl font-black text-white tracking-tighter tabular-nums">{res.time}</TableCell>
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
             <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary text-center">
               House Standings
             </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {GROUPS.map(group => {
                const groupStandings = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
                if (!groupStandings?.length) return null;
                return (
                  <Card key={group} className="premium-card border-none bg-white/[0.01]">
                    <CardHeader className="p-5 border-b border-white/[0.05] text-center bg-white/[0.02]">
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">Pool {group}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {groupStandings.map((row) => (
                            <TableRow key={row.team} className="h-16 border-none hover:bg-white/[0.03]">
                              <TableCell className="text-base font-black uppercase italic text-white pl-6">{row.team}</TableCell>
                              <TableCell className="text-right font-black text-2xl pr-6">
                                {row.points} <span className="text-[10px] text-muted-foreground/40 ml-1">PTS</span>
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
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary text-center">
              Match Center
            </h2>
            <Tabs defaultValue="live" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/[0.03] border border-white/[0.08] p-1.5 h-16 rounded-2xl max-w-md mx-auto">
                <TabsTrigger value="live" className="text-[10px] font-black uppercase tracking-widest rounded-xl">Live</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-[10px] font-black uppercase tracking-widest rounded-xl">Schedule</TabsTrigger>
                <TabsTrigger value="completed" className="text-[10px] font-black uppercase tracking-widest rounded-xl">Archives</TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="space-y-6 mt-10">
                {sportMatches?.filter(m => m.status === 'Live').map(match => (
                  <Card key={match.id} className="premium-card border-primary/20 bg-primary/[0.02]">
                    <CardContent className="p-10 md:p-16">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex-1 text-center md:text-right">
                          <p className="text-3xl md:text-5xl font-black uppercase italic text-white tracking-tighter">{match.teamA}</p>
                        </div>
                        <div className="flex flex-col items-center gap-6">
                          <div className="text-6xl md:text-8xl font-black tracking-tighter bg-black/50 px-10 py-8 rounded-[2.5rem] border border-white/[0.08] shadow-2xl">
                            {match.scoreA} : {match.scoreB}
                          </div>
                          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Live Broadcast</span>
                          </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <p className="text-3xl md:text-5xl font-black uppercase italic text-white tracking-tighter">{match.teamB}</p>
                        </div>
                      </div>
                      
                      {sport === 'badminton' && match.badmintonResults && (
                        <div className="mt-10 pt-10 border-t border-white/[0.05] grid grid-cols-2 md:grid-cols-4 gap-4">
                          {match.badmintonResults.map((sub, idx) => (
                            <div key={idx} className="bg-white/[0.03] rounded-2xl p-5 text-center border border-white/[0.05]">
                              <p className="text-[10px] font-black text-primary/80 uppercase mb-2 tracking-widest">{sub.type}</p>
                              <p className="text-xl font-black text-white tracking-tight">{sub.score}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4 mt-10">
                {sportMatches?.filter(m => m.status === 'Upcoming').map(match => (
                  <Card key={match.id} className="premium-card group bg-white/[0.01] hover:bg-white/[0.03]">
                    <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="text-center md:pr-10 md:border-r border-white/[0.05] md:w-40">
                          <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] mb-1.5">M#{match.matchNumber}</p>
                          <p className="text-3xl md:text-4xl font-black text-white tracking-tighter">{match.time}</p>
                          <p className="text-[11px] font-bold text-muted-foreground/40 uppercase mt-1 tracking-[0.2em]">{match.day}</p>
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                            {match.teamA} <span className="text-white/20 mx-3 font-light">VS</span> {match.teamB}
                          </p>
                          <div className="flex flex-wrap justify-center md:justify-start items-center gap-5 mt-3">
                            <span className="text-[11px] font-bold text-muted-foreground/60 uppercase flex items-center gap-2 tracking-widest">
                              <MapPin className="h-3.5 w-3.5" /> {match.venue}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black border-white/10 bg-white/[0.02] px-5 py-1 uppercase">{match.phase.replace('-', ' ')}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-6 mt-10">
                {sportMatches?.filter(m => m.status === 'Completed').map(match => (
                  <Card key={match.id} className="premium-card border-none bg-white/[0.01]">
                    <CardContent className="p-0">
                      <div className="p-8 md:p-12 flex items-center justify-between gap-6">
                        <div className="flex-1 text-right">
                          <p className={cn("font-black text-xl md:text-4xl uppercase italic tracking-tighter", match.scoreA > match.scoreB ? 'text-white' : 'text-muted-foreground/50')}>
                            {match.teamA}
                          </p>
                        </div>
                        <div className="text-3xl md:text-5xl font-black bg-black/50 px-8 py-6 rounded-3xl border border-white/[0.08]">
                          {match.scoreA} - {match.scoreB}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={cn("font-black text-xl md:text-4xl uppercase italic tracking-tighter", match.scoreB > match.scoreA ? 'text-white' : 'text-muted-foreground/50')}>
                            {match.teamB}
                          </p>
                        </div>
                      </div>

                      {sport === 'badminton' && match.badmintonResults && (
                        <Accordion type="single" collapsible className="w-full px-8 pb-6">
                          <AccordionItem value="details" className="border-none">
                            <AccordionTrigger className="text-[11px] font-black uppercase text-primary hover:no-underline py-3 tracking-widest">
                              View Sub-Match Scores
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3">
                                {match.badmintonResults.map((sub, idx) => (
                                  <div key={idx} className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.05] text-center">
                                    <p className="text-[10px] font-black text-primary/70 uppercase mb-2 tracking-widest">{sub.type}</p>
                                    <p className="text-lg font-black text-white tracking-tight">{sub.score}</p>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      <div className="flex flex-col md:flex-row items-center justify-between px-8 py-5 border-t border-white/[0.05] bg-white/[0.01]">
                        <div className="flex items-center gap-6">
                          <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">
                            M#{match.matchNumber} • {match.phase.toUpperCase()}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => handleShare(match)} className="h-8 text-[11px] font-black text-primary hover:text-primary hover:bg-primary/10 gap-2">
                            <Share2 className="h-3.5 w-3.5" /> Share Results
                          </Button>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase mt-2 md:mt-0 tracking-widest">{match.date} • {match.venue}</span>
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
