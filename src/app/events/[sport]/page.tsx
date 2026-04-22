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
import { Trophy, Zap, CircleDot, Target, Medal, MapPin, Calendar, Clock, Activity, Share2 } from 'lucide-react';
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
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });
  }, [rawMatches]);

  const runResults = useMemo(() => {
    return [...(rawRunResults || [])].sort((a, b) => a.position - b.position);
  }, [rawRunResults]);

  const handleShare = (match: Match) => {
    const text = `🏆 *Sportify Paradox 2026 Result* 🏆\n\nSport: ${match.sport.toUpperCase()}\n${match.teamA} ${match.scoreA} - ${match.scoreB} ${match.teamB}\nPhase: ${match.phase}\n\nView more live results on Sportify!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast({ title: "Sharing to WhatsApp..." });
  };

  if (matchesLoading || stdLoading || runLoading) return <Loading />;

  const IconComp = ICON_MAP[event.icon];
  const raceSchedules = sportMatches?.filter(m => m.phase === 'race');

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-32 px-4 md:px-0">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/40 via-background to-background border border-white/5 p-8 md:p-16 shadow-2xl">
        <div className="absolute -top-10 -right-10 opacity-10 blur-2xl">
           {IconComp && <IconComp className="h-80 w-80 text-primary" />}
        </div>
        <div className="relative z-10 space-y-6">
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px] font-black px-5 py-2 tracking-[0.4em] animate-pulse rounded-full">
            Active Domain: {sport.toUpperCase()}
          </Badge>
          <div className="space-y-3">
            <h1 className="text-5xl md:text-8xl font-black italic text-white tracking-tighter uppercase leading-[0.8] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/30">
              {event.name}
            </h1>
            <p className="text-xs md:text-base text-muted-foreground uppercase tracking-[0.2em] font-black max-w-2xl leading-relaxed opacity-60">
              {event.description}
            </p>
          </div>
        </div>
      </div>

      {sport === 'kampus-run' ? (
        <section className="space-y-12">
          {raceSchedules && raceSchedules.length > 0 && (
            <div className="space-y-8">
               <h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-primary flex items-center gap-4 ml-1">
                 <Clock className="h-5 w-5" /> Race Schedule
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {raceSchedules.map(race => (
                    <Card key={race.id} className="premium-card bg-white/[0.02] rounded-[2rem]">
                      <CardHeader className="p-8 border-b border-white/5 text-center">
                        <CardTitle className="text-3xl font-black uppercase italic tracking-tighter text-white">
                          {race.teamA}
                        </CardTitle>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2 opacity-50">
                          {race.date} • {race.venue}
                        </p>
                      </CardHeader>
                      <CardContent className="p-10 flex items-center justify-around">
                        <div className="text-center space-y-2">
                          <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Reporting</p>
                          <p className="text-4xl font-black text-white tabular-nums">{race.reportingTime || '--:--'}</p>
                        </div>
                        <div className="h-16 w-px bg-white/10" />
                        <div className="text-center space-y-2">
                          <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Start Time</p>
                          <p className="text-4xl font-black text-accent tabular-nums">{race.time}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-8">
            <h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-primary flex items-center gap-4 ml-1">
              <Medal className="h-5 w-5" /> Results Feed
            </h2>
            <Card className="premium-card rounded-[2.5rem] overflow-hidden border-white/5">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24 text-center">Rank</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right pr-10">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runResults?.map((res) => (
                      <TableRow key={res.id} className="h-24 hover:bg-white/[0.03]">
                        <TableCell className="text-center text-3xl font-black italic text-primary">#{res.position}</TableCell>
                        <TableCell className="text-xl md:text-2xl font-black uppercase italic text-white tracking-tighter">{res.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-[10px] font-black uppercase h-7 bg-primary/10 border-primary/20 text-primary px-4 tracking-widest">
                              {res.category}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-black uppercase h-7 border-white/10 px-4 tracking-widest opacity-60">
                              {res.gender === 'M' ? 'Male' : 'Female'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-10 text-3xl md:text-4xl font-black tabular-nums text-accent">{res.time}</TableCell>
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
             <h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-primary flex items-center gap-4 ml-1">
               <Trophy className="h-5 w-5" /> Group Standings
             </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {GROUPS.map(group => {
                const groupStandings = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
                if (!groupStandings?.length) return null;
                return (
                  <Card key={group} className="premium-card bg-white/[0.01] rounded-[2rem]">
                    <CardHeader className="p-5 border-b border-white/5 bg-white/[0.04] text-center">
                      <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Pool {group}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {groupStandings.map((row) => (
                            <TableRow key={row.team} className="h-16">
                              <TableCell className="text-lg font-black uppercase italic text-white py-0 pl-6">{row.team}</TableCell>
                              <TableCell className="text-right font-black text-3xl py-0 pr-8">
                                {row.points} <span className="text-[10px] text-muted-foreground/30 ml-1">Pts</span>
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
            <h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-primary flex items-center gap-4 ml-1">
              <Zap className="h-5 w-5" /> Match Feeds
            </h2>
            <Tabs defaultValue="live" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/[0.04] border border-white/10 p-1.5 h-16 rounded-2xl">
                <TabsTrigger value="live" className="text-[11px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-primary transition-all">Live Now</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-[11px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-primary transition-all">Schedule</TabsTrigger>
                <TabsTrigger value="completed" className="text-[11px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-primary transition-all">Results</TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="space-y-8 mt-10">
                {sportMatches?.filter(m => m.status === 'Live').map(match => (
                  <Card key={match.id} className="premium-card border-accent/30 bg-accent/5 rounded-[2.5rem] animate-in fade-in zoom-in-95 duration-700">
                    <CardContent className="p-10 md:p-14">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex-1 text-center md:text-right">
                          <p className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">{match.teamA}</p>
                        </div>
                        <div className="flex flex-col items-center gap-6">
                          <div className="text-6xl md:text-8xl font-black tabular-nums tracking-tighter bg-black/50 px-12 md:px-20 py-8 md:py-10 rounded-[3rem] border border-white/10 shadow-2xl border-accent/20">
                            {match.scoreA} : {match.scoreB}
                          </div>
                          <Badge className="bg-accent text-black text-[11px] font-black uppercase animate-pulse px-6 py-2 tracking-widest rounded-full">
                            Live Stream
                          </Badge>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <p className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">{match.teamB}</p>
                        </div>
                      </div>
                      
                      {sport === 'badminton' && match.badmintonResults && (
                        <div className="mt-14 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
                          {match.badmintonResults.map((sub, idx) => (
                            <div key={idx} className="bg-white/5 rounded-[1.5rem] p-5 text-center border border-white/5">
                              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">{sub.type}</p>
                              <p className="text-2xl font-black text-white tabular-nums">{sub.score}</p>
                              {sub.winner && <p className="text-[9px] font-black text-accent uppercase mt-3 tracking-widest leading-none">Winner: {sub.winner}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-12 text-center border-t border-white/10 pt-10 flex flex-col items-center gap-4">
                        <span className="text-[11px] font-black uppercase text-primary tracking-[0.4em] opacity-80">M#{match.matchNumber} Stream Details</span>
                        <div className="flex flex-wrap justify-center gap-6">
                          <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.3em] flex items-center gap-3">
                            <MapPin className="h-5 w-5" /> {match.venue}
                          </span>
                           { (match.courtNumber || match.groundNumber) && (
                              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-accent/10 border-accent/20 text-accent px-4 py-1">
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
                  <Card key={match.id} className="premium-card group hover:bg-white/[0.02] rounded-[2rem]">
                    <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="text-center md:pr-10 md:border-r border-white/10 md:w-40">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">M#{match.matchNumber}</p>
                          <p className="text-4xl font-black text-white uppercase tabular-nums">{match.time}</p>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2 opacity-40">{match.day}</p>
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-3xl md:text-4xl font-black uppercase italic tracking-tight group-hover:text-primary transition-all duration-300 leading-none">
                            {match.teamA} <span className="text-muted-foreground/20 mx-4 text-2xl font-medium">VS</span> {match.teamB}
                          </p>
                          <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 mt-5">
                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase flex items-center gap-3 tracking-widest">
                              <MapPin className="h-5 w-5" /> {match.venue}
                            </span>
                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase flex items-center gap-3 tracking-widest">
                              <Calendar className="h-5 w-5" /> {match.date}
                            </span>
                            { (match.courtNumber || match.groundNumber) && (
                              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-accent/10 border-accent/20 text-accent px-4 py-1">
                                {match.courtNumber || match.groundNumber}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[11px] font-black uppercase px-6 py-2 h-10 bg-white/5 border-white/10 tracking-widest rounded-xl">{match.phase}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-8 mt-10">
                {sportMatches?.filter(m => m.status === 'Completed').map(match => (
                  <Card key={match.id} className="premium-card group border-white/5 rounded-[2.5rem]">
                    <CardContent className="p-0">
                      <div className="p-10 md:p-14 flex items-center justify-between gap-6">
                        <div className="flex-1 text-right">
                          <p className={cn("font-black text-2xl md:text-4xl uppercase italic tracking-tighter leading-none", match.scoreA > match.scoreB ? 'text-primary' : 'text-muted-foreground/40')}>
                            {match.teamA}
                          </p>
                        </div>
                        <div className="text-4xl md:text-6xl font-black tabular-nums bg-white/5 px-10 py-6 rounded-3xl border border-white/10 shadow-xl border-white/5">
                          {match.scoreA} - {match.scoreB}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={cn("font-black text-2xl md:text-4xl uppercase italic tracking-tighter leading-none", match.scoreB > match.scoreA ? 'text-primary' : 'text-muted-foreground/40')}>
                            {match.teamB}
                          </p>
                        </div>
                      </div>

                      {sport === 'badminton' && match.badmintonResults && (
                        <Accordion type="single" collapsible className="w-full px-10 pb-6">
                          <AccordionItem value="details" className="border-none">
                            <AccordionTrigger className="text-[11px] font-black uppercase text-primary/60 hover:no-underline py-4 tracking-widest">
                              Detailed Set Scores
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                {match.badmintonResults.map((sub, idx) => (
                                  <div key={idx} className="bg-white/5 rounded-2xl p-5 border border-white/5 text-center">
                                    <p className="text-[9px] font-black text-primary uppercase mb-2 tracking-widest">{sub.type}</p>
                                    <p className="text-lg font-black text-white tabular-nums">{sub.score}</p>
                                    {sub.winner && <p className="text-[8px] font-black text-accent uppercase mt-2 tracking-widest opacity-60">Winner: {sub.winner}</p>}
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      <div className="flex flex-col md:flex-row items-center justify-between px-10 py-6 border-t border-white/5 bg-white/[0.03]">
                        <div className="flex items-center gap-6">
                          <span className="text-[10px] font-black uppercase text-muted-foreground/30 tracking-[0.4em]">
                            M#{match.matchNumber} Result • {match.phase.toUpperCase()}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => handleShare(match)} className="h-8 text-[9px] font-black uppercase text-primary hover:bg-primary/10 gap-2 rounded-lg">
                            <Share2 className="h-3 w-3" /> Share Result
                          </Button>
                        </div>
                        <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest mt-2 md:mt-0">{match.date} • {match.venue.toUpperCase()}</span>
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
