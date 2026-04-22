'use client';

import { useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { EVENTS } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MatchRecapButton } from '@/components/MatchRecapButton';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Match, RunResult, Standing, GROUPS } from '@/lib/types';
import Loading from '@/app/loading';
import { Trophy, Zap, CircleDot, Target, Medal, MapPin, Calendar, Clock } from 'lucide-react';

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
    return query(collection(db, 'matches'), where('sport', '==', sport), orderBy('matchNumber', 'asc'));
  }, [db, sport]);

  const standingsQuery = useMemo(() => {
    if (!db || sport === 'kampus-run') return null;
    return query(collection(db, 'standings'), where('sport', '==', sport));
  }, [db, sport]);

  const runResultsQuery = useMemo(() => {
    if (!db || sport !== 'kampus-run') return null;
    return query(collection(db, 'runResults'), orderBy('position', 'asc'));
  }, [db, sport]);

  const { data: sportMatches, loading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: standings, loading: stdLoading } = useCollection<Standing>(standingsQuery);
  const { data: runResults, loading: runLoading } = useCollection<RunResult>(runResultsQuery);

  if (matchesLoading || stdLoading || runLoading) return <Loading />;

  const IconComp = ICON_MAP[event.icon];
  const raceSchedules = sportMatches?.filter(m => m.phase === 'race');

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-20">
      {/* Hero Domain Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/20 via-background to-background border border-white/5 p-10 md:p-16">
        <div className="absolute top-0 right-0 p-12 opacity-10 blur-sm">
           <IconComp className="h-64 w-64 text-primary" />
        </div>
        <div className="relative space-y-8">
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px] font-black px-4 py-1.5 tracking-[0.3em]">
            Protocol Domain: {sport.replace('-', ' ')}
          </Badge>
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black italic text-white tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
              {event.name}
            </h1>
            <p className="text-base text-muted-foreground uppercase tracking-[0.4em] font-black max-w-2xl leading-relaxed">
              {event.description}
            </p>
          </div>
        </div>
      </div>

      {sport === 'kampus-run' ? (
        <section className="space-y-16">
          {raceSchedules && raceSchedules.length > 0 && (
            <div className="space-y-8">
               <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                 <Clock className="h-4 w-4" /> Race Day Synchronicity
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {raceSchedules.map(race => (
                    <Card key={race.id} className="premium-card">
                      <CardHeader className="p-8 bg-white/[0.03] border-b border-white/5 text-center">
                        <CardTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">
                          {race.teamA}
                        </CardTitle>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2">
                          {race.date} • {race.venue}
                        </p>
                      </CardHeader>
                      <CardContent className="p-10 flex items-center justify-around">
                        <div className="text-center space-y-2">
                          <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Reporting</p>
                          <p className="text-3xl font-black text-white">{race.reportingTime || 'TBD'}</p>
                        </div>
                        <div className="h-16 w-px bg-white/10" />
                        <div className="text-center space-y-2">
                          <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Start Vector</p>
                          <p className="text-3xl font-black text-accent">{race.time}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-8">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
              <Medal className="h-4 w-4" /> Global Performance Registry
            </h2>
            <Card className="premium-card rounded-3xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24 text-center">Rank</TableHead>
                    <TableHead>Participant Identity</TableHead>
                    <TableHead>Protocol Classification</TableHead>
                    <TableHead className="text-right pr-10">Archive Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runResults?.map((res) => (
                    <TableRow key={res.id} className="h-20">
                      <TableCell className="text-center text-2xl font-black italic text-primary">#{res.position}</TableCell>
                      <TableCell className="text-xl font-black uppercase italic text-white">{res.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-[9px] font-black uppercase h-6 bg-primary/10 border-primary/30 text-primary px-3">
                            {res.category}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] font-black uppercase h-6 border-white/10 px-3">
                            {res.gender === 'M' ? 'Male' : 'Female'}
                          </Badge>
                          {res.ageGroup !== 'Open' && (
                            <Badge variant="outline" className="text-[9px] font-black uppercase h-6 bg-accent/10 border-accent/30 text-accent px-3">
                              Age: {res.ageGroup}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10 text-2xl font-black tabular-nums text-accent">{res.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </section>
      ) : (
        <>
          <section className="space-y-8">
             <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
               <Trophy className="h-4 w-4" /> Tournament Matrix
             </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {GROUPS.map(group => {
                const groupStandings = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
                if (!groupStandings?.length) return null;
                return (
                  <Card key={group} className="premium-card">
                    <CardHeader className="p-5 border-b border-white/5 bg-white/[0.03]">
                      <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-primary text-center">Group {group}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {groupStandings.map((row) => (
                            <TableRow key={row.team} className="h-14">
                              <TableCell className="text-base font-black uppercase italic py-0">{row.team}</TableCell>
                              <TableCell className="text-right font-black text-xl py-0 pr-6">
                                {row.points} <span className="text-[9px] text-muted-foreground/40 ml-1">PTS</span>
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
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
              <Zap className="h-4 w-4" /> Live Transmission Stream
            </h2>
            <Tabs defaultValue="live" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/[0.04] border border-white/10 p-1.5 h-16 rounded-2xl">
                <TabsTrigger value="live" className="text-[10px] font-black uppercase tracking-widest rounded-xl">Live Sync</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-[10px] font-black uppercase tracking-widest rounded-xl">Protocol</TabsTrigger>
                <TabsTrigger value="completed" className="text-[10px] font-black uppercase tracking-widest rounded-xl">Archive</TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="space-y-6 mt-8">
                {sportMatches?.filter(m => m.status === 'Live').map(match => (
                  <Card key={match.id} className="premium-card border-accent/40 bg-accent/5">
                    <CardContent className="p-12">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="flex-1 text-center md:text-right">
                          <p className="text-4xl font-black uppercase italic tracking-tighter text-white">{match.teamA}</p>
                        </div>
                        <div className="flex flex-col items-center gap-6">
                          <div className="text-8xl font-black tabular-nums tracking-tighter bg-white/5 px-14 py-6 rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(var(--accent),0.2)]">
                            {match.scoreA} : {match.scoreB}
                          </div>
                          <Badge className="bg-accent text-black text-[10px] font-black uppercase animate-pulse px-4 py-1 tracking-widest">
                            Live Feed Active
                          </Badge>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <p className="text-4xl font-black uppercase italic tracking-tighter text-white">{match.teamB}</p>
                        </div>
                      </div>
                      
                      {sport === 'badminton' && match.badmintonResults && (
                        <div className="mt-12 pt-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-5 gap-4">
                          {match.badmintonResults.map((sub, idx) => (
                            <div key={idx} className="bg-white/5 rounded-2xl p-4 text-center border border-white/5 hover:bg-white/10 transition-colors">
                              <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2">{sub.type} Division</p>
                              <p className="text-xl font-black text-white">{sub.score}</p>
                              {sub.winner && <p className="text-[8px] font-black text-accent uppercase mt-2">Win: {sub.winner}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-12 text-center border-t border-white/10 pt-6 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-primary/80 tracking-[0.3em]">Transmission Match #{match.matchNumber}</span>
                        <span className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.4em] flex items-center gap-3">
                          <MapPin className="h-4 w-4" /> {match.venue} {match.courtNumber || match.groundNumber ? `• ${match.courtNumber || match.groundNumber}` : ''}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4 mt-8">
                {sportMatches?.filter(m => m.status === 'Upcoming').map(match => (
                  <Card key={match.id} className="premium-card group">
                    <CardContent className="p-8 flex items-center justify-between">
                      <div className="flex items-center gap-10">
                        <div className="text-center pr-10 border-r border-white/10 w-32">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">M#{match.matchNumber}</p>
                          <p className="text-xl font-black text-white uppercase">{match.time}</p>
                          <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">{match.day}</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black uppercase italic tracking-tight group-hover:text-primary transition-colors duration-300">
                            {match.teamA} <span className="text-muted-foreground/30 mx-2 text-lg">VS</span> {match.teamB}
                          </p>
                          <div className="flex items-center gap-6 mt-3">
                            <span className="text-[10px] font-black text-muted-foreground/50 uppercase flex items-center gap-2 tracking-widest">
                              <MapPin className="h-4 w-4" /> {match.venue}
                            </span>
                            <span className="text-[10px] font-black text-muted-foreground/50 uppercase flex items-center gap-2 tracking-widest">
                              <Calendar className="h-4 w-4" /> {match.date}
                            </span>
                            { (match.courtNumber || match.groundNumber) && (
                              <span className="text-[10px] font-black text-accent/50 uppercase tracking-widest bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                                LOC: {match.courtNumber || match.groundNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-black uppercase px-4 h-8 bg-white/5 border-white/10">{match.phase}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-6 mt-8">
                {sportMatches?.filter(m => m.status === 'Completed').map(match => (
                  <Card key={match.id} className="premium-card group">
                    <CardContent className="p-0">
                      <div className="p-10 flex items-center justify-between">
                        <div className="flex-1 text-right pr-10">
                          <p className={cn("font-black text-2xl uppercase italic tracking-tighter", match.scoreA > match.scoreB ? 'text-primary' : 'text-muted-foreground/60')}>
                            {match.teamA}
                          </p>
                        </div>
                        <div className="text-3xl font-black tabular-nums bg-white/5 px-8 py-3 rounded-2xl border border-white/10 shadow-lg">
                          {match.scoreA} - {match.scoreB}
                        </div>
                        <div className="flex-1 text-left pl-10">
                          <p className={cn("font-black text-2xl uppercase italic tracking-tighter", match.scoreB > match.scoreA ? 'text-primary' : 'text-muted-foreground/60')}>
                            {match.teamB}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-10 py-5 border-t border-white/5 bg-white/[0.02]">
                        <span className="text-[10px] font-black uppercase text-muted-foreground/30 tracking-[0.4em]">
                          Transmission Archival M#{match.matchNumber} • {match.venue} • {match.phase}
                        </span>
                        <MatchRecapButton match={match} />
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
