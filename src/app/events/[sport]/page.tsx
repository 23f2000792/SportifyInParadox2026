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
import { Trophy, Zap, CircleDot, Target, Medal, MapPin, Calendar, Clock, Activity, Share2, ChevronDown } from 'lucide-react';
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
    const text = `🏆 *Paradox 2026 Results* 🏆\n\nSport: ${match.sport.toUpperCase()}\n${match.teamA} ${match.scoreA} - ${match.scoreB} ${match.teamB}\nPhase: ${match.phase}\n\nView live results on Sportify!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast({ title: "Sharing result..." });
  };

  if (matchesLoading || stdLoading || runLoading) return <Loading />;

  const IconComp = ICON_MAP[event.icon];
  const raceSchedules = sportMatches?.filter(m => m.phase === 'race');

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-32 px-4 md:px-0">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-background to-background border border-white/10 p-8 md:p-12">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           {IconComp && <IconComp className="h-48 w-48 text-primary" />}
        </div>
        <div className="relative z-10 space-y-4">
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px] font-black px-4 py-1.5 tracking-widest rounded-full">
            {sport.replace('-', ' ').toUpperCase()} DOMAIN
          </Badge>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-7xl font-black italic text-white tracking-tighter uppercase leading-none">
              {event.name}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground uppercase tracking-widest font-bold max-w-2xl opacity-70">
              {event.description}
            </p>
          </div>
        </div>
      </div>

      {sport === 'kampus-run' ? (
        <section className="space-y-10">
          {raceSchedules && raceSchedules.length > 0 && (
            <div className="space-y-6">
               <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 ml-1">
                 <Clock className="h-4 w-4" /> Race Times
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {raceSchedules.map(race => (
                    <Card key={race.id} className="premium-card">
                      <CardHeader className="p-6 border-b border-white/5 bg-white/[0.02] text-center">
                        <CardTitle className="text-2xl font-black uppercase italic text-white">
                          {race.teamA}
                        </CardTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                          {race.date} • {race.venue}
                        </p>
                      </CardHeader>
                      <CardContent className="p-8 flex items-center justify-around">
                        <div className="text-center space-y-1">
                          <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">Reporting</p>
                          <p className="text-3xl font-black text-white">{race.reportingTime || '--:--'}</p>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="text-center space-y-1">
                          <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">Start</p>
                          <p className="text-3xl font-black text-accent">{race.time}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 ml-1">
              <Medal className="h-4 w-4" /> Rankings
            </h2>
            <Card className="premium-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 text-center">Rank</TableHead>
                    <TableHead>Runner</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right pr-8">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runResults?.map((res) => (
                    <TableRow key={res.id} className="h-20">
                      <TableCell className="text-center text-2xl font-black italic text-primary">#{res.position}</TableCell>
                      <TableCell className="text-lg md:text-xl font-black uppercase italic text-white">{res.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-[9px] font-black bg-white/5">{res.category}</Badge>
                          <Badge variant="outline" className="text-[9px] font-black bg-white/5 opacity-60">{res.gender}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8 text-2xl font-black text-accent tabular-nums">{res.time}</TableCell>
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
             <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 ml-1">
               <Trophy className="h-4 w-4" /> Standings
             </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {GROUPS.map(group => {
                const groupStandings = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
                if (!groupStandings?.length) return null;
                return (
                  <Card key={group} className="premium-card">
                    <CardHeader className="p-4 border-b border-white/5 bg-white/[0.03] text-center">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Pool {group}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {groupStandings.map((row) => (
                            <TableRow key={row.team} className="h-14 border-none hover:bg-transparent">
                              <TableCell className="text-base font-black uppercase italic text-white pl-5">{row.team}</TableCell>
                              <TableCell className="text-right font-black text-2xl pr-6">
                                {row.points} <span className="text-[8px] text-muted-foreground ml-1">Pts</span>
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
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 ml-1">
              <Zap className="h-4 w-4" /> Matches
            </h2>
            <Tabs defaultValue="live" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/[0.04] border border-white/10 p-1.5 h-14 rounded-2xl">
                <TabsTrigger value="live" className="text-[10px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-primary">Live</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-[10px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-primary">Schedule</TabsTrigger>
                <TabsTrigger value="completed" className="text-[10px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-primary">History</TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="space-y-6 mt-8">
                {sportMatches?.filter(m => m.status === 'Live').map(match => (
                  <Card key={match.id} className="premium-card border-accent/20 bg-accent/[0.02]">
                    <CardContent className="p-8 md:p-10">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1 text-center md:text-right">
                          <p className="text-2xl md:text-4xl font-black uppercase italic text-white">{match.teamA}</p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                          <div className="text-5xl md:text-7xl font-black tracking-tighter bg-black/40 px-10 md:px-16 py-6 rounded-3xl border border-white/5 shadow-inner">
                            {match.scoreA} : {match.scoreB}
                          </div>
                          <Badge className="bg-accent text-black text-[9px] font-black uppercase animate-pulse px-4 py-1 tracking-widest">
                            Live Score
                          </Badge>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <p className="text-2xl md:text-4xl font-black uppercase italic text-white">{match.teamB}</p>
                        </div>
                      </div>
                      
                      {sport === 'badminton' && match.badmintonResults && (
                        <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-3">
                          {match.badmintonResults.map((sub, idx) => (
                            <div key={idx} className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
                              <p className="text-[9px] font-black text-primary uppercase mb-2">{sub.type}</p>
                              <p className="text-xl font-black text-white">{sub.score}</p>
                              {sub.winner && <p className="text-[8px] font-black text-accent uppercase mt-2 tracking-widest">W: {sub.winner}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-8 text-center border-t border-white/5 pt-6 flex flex-wrap justify-center gap-6">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/60 flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> {match.venue}
                        </span>
                        { (match.courtNumber || match.groundNumber) && (
                          <Badge variant="outline" className="text-[9px] font-black bg-accent/10 text-accent border-accent/20">
                            {match.courtNumber || match.groundNumber}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4 mt-8">
                {sportMatches?.filter(m => m.status === 'Upcoming').map(match => (
                  <Card key={match.id} className="premium-card group hover:bg-white/[0.01]">
                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="text-center md:pr-8 md:border-r border-white/5 md:w-32">
                          <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">M#{match.matchNumber}</p>
                          <p className="text-3xl font-black text-white">{match.time}</p>
                          <p className="text-[9px] font-black text-muted-foreground/40 uppercase mt-1">{match.day}</p>
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-2xl md:text-3xl font-black uppercase italic tracking-tight group-hover:text-primary transition-colors">
                            {match.teamA} <span className="text-muted-foreground/20 mx-3 text-xl font-medium">vs</span> {match.teamB}
                          </p>
                          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-3">
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase flex items-center gap-2">
                              <MapPin className="h-4 w-4" /> {match.venue}
                            </span>
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase flex items-center gap-2">
                              <Calendar className="h-4 w-4" /> {match.date}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-black h-8 bg-white/5">{match.phase.replace('-', ' ')}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-6 mt-8">
                {sportMatches?.filter(m => m.status === 'Completed').map(match => (
                  <Card key={match.id} className="premium-card border-white/5">
                    <CardContent className="p-0">
                      <div className="p-8 md:p-10 flex items-center justify-between gap-4">
                        <div className="flex-1 text-right">
                          <p className={cn("font-black text-xl md:text-3xl uppercase italic", match.scoreA > match.scoreB ? 'text-primary' : 'text-muted-foreground/40')}>
                            {match.teamA}
                          </p>
                        </div>
                        <div className="text-3xl md:text-5xl font-black bg-white/5 px-8 py-4 rounded-2xl border border-white/5">
                          {match.scoreA} - {match.scoreB}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={cn("font-black text-xl md:text-3xl uppercase italic", match.scoreB > match.scoreA ? 'text-primary' : 'text-muted-foreground/40')}>
                            {match.teamB}
                          </p>
                        </div>
                      </div>

                      {sport === 'badminton' && match.badmintonResults && (
                        <Accordion type="single" collapsible className="w-full px-8 pb-4">
                          <AccordionItem value="details" className="border-none">
                            <AccordionTrigger className="text-[9px] font-black uppercase text-primary/60 hover:no-underline py-3">
                              View Sub-Match Breakdown
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                                {match.badmintonResults.map((sub, idx) => (
                                  <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
                                    <p className="text-[8px] font-black text-primary uppercase mb-1">{sub.type}</p>
                                    <p className="text-base font-black text-white">{sub.score}</p>
                                    {sub.winner && <p className="text-[7px] font-black text-accent uppercase mt-1">W: {sub.winner}</p>}
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      <div className="flex flex-col md:flex-row items-center justify-between px-8 py-4 border-t border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                          <span className="text-[9px] font-black uppercase text-muted-foreground/40">
                            M#{match.matchNumber} • {match.phase.toUpperCase()}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => handleShare(match)} className="h-7 text-[8px] font-black text-primary hover:bg-primary/10 gap-2">
                            <Share2 className="h-3 w-3" /> Share
                          </Button>
                        </div>
                        <span className="text-[8px] font-black text-muted-foreground/20 uppercase mt-1 md:mt-0">{match.date} • {match.venue}</span>
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
