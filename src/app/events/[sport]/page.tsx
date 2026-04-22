
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
import { Trophy, Zap, CircleDot, Target, Medal, MapPin, Calendar, Clock, Map } from 'lucide-react';

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
    <div className="space-y-10 max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl bg-white/[0.02] border border-white/5 p-8 md:p-12">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <IconComp className="h-48 w-48 text-primary" />
        </div>
        <div className="relative space-y-6">
          <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[9px] font-black px-3 py-1 tracking-widest">Domain: {sport.replace('-', ' ')}</Badge>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter uppercase leading-none">{event.name}</h1>
            <p className="text-sm text-muted-foreground uppercase tracking-[0.3em] font-black max-w-xl">{event.description}</p>
          </div>
        </div>
      </div>

      {sport === 'kampus-run' ? (
        <section className="space-y-12">
          {raceSchedules && raceSchedules.length > 0 && (
            <div className="space-y-6">
               <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-primary" /> Race Day Schedule</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {raceSchedules.map(race => (
                    <Card key={race.id} className="premium-card border-white/5">
                      <CardHeader className="p-6 bg-white/[0.02] border-b border-white/5 text-center">
                        <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-primary">{race.teamA}</CardTitle>
                        <p className="text-[9px] font-black uppercase text-muted-foreground/60">{race.date} | {race.venue}</p>
                      </CardHeader>
                      <CardContent className="p-8 flex items-center justify-around">
                        <div className="text-center">
                          <p className="text-[8px] font-black uppercase opacity-40 mb-1">Reporting</p>
                          <p className="text-xl font-black">{race.reportingTime || 'TBD'}</p>
                        </div>
                        <div className="h-10 w-px bg-white/5" />
                        <div className="text-center">
                          <p className="text-[8px] font-black uppercase opacity-40 mb-1">Race Start</p>
                          <p className="text-xl font-black text-live">{race.time}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-8">
            <div className="flex items-center justify-between"><h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2"><Medal className="h-3.5 w-3.5 text-primary" /> Global Leaderboard</h2></div>
            <Card className="premium-card">
              <Table><TableHeader className="bg-white/5"><TableRow className="border-white/5"><TableHead className="w-16 text-center text-[9px] font-black uppercase">Pos</TableHead><TableHead className="text-[9px] font-black uppercase">Participant</TableHead><TableHead className="text-[9px] font-black uppercase">Classification</TableHead><TableHead className="text-right text-[9px] font-black uppercase">Time</TableHead></TableRow></TableHeader>
                <TableBody>{runResults?.map((res) => (<TableRow key={res.id} className="h-16 border-white/5 hover:bg-white/[0.02] transition-colors"><TableCell className="text-center font-black">#{res.position}</TableCell><TableCell><p className="font-bold text-sm uppercase">{res.name}</p></TableCell><TableCell><div className="flex flex-wrap gap-2"><Badge variant="outline" className="text-[7px] font-black uppercase h-5 bg-primary/5 border-primary/20 text-primary">{res.category}</Badge><Badge variant="outline" className="text-[7px] font-black uppercase h-5">{res.gender === 'M' ? 'Male' : 'Female'}</Badge>{res.ageGroup !== 'Open' && <Badge variant="outline" className="text-[7px] font-black uppercase h-5 bg-accent/10 border-accent/20 text-accent-foreground">{res.ageGroup}</Badge>}</div></TableCell><TableCell className="text-right font-black tabular-nums">{res.time}</TableCell></TableRow>))}</TableBody></Table>
            </Card>
          </div>
        </section>
      ) : (
        <>
          <section className="space-y-6">
             <div className="flex items-center justify-between"><h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2"><Trophy className="h-3.5 w-3.5 text-primary" /> League Matrix</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {GROUPS.map(group => {
                const groupStandings = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
                if (!groupStandings?.length) return null;
                return (
                  <Card key={group} className="premium-card">
                    <CardHeader className="p-4 border-b border-white/5 bg-white/[0.02]"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary text-center">Group {group}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table><TableBody>{groupStandings.map((row) => (<TableRow key={row.team} className="border-white/5 h-12"><TableCell className="font-bold text-[11px] py-0">{row.team}</TableCell><TableCell className="text-right font-black text-xs py-0 pr-4">{row.points} <span className="text-[8px] text-muted-foreground ml-1">PTS</span></TableCell></TableRow>))}</TableBody></Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between"><h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-primary" /> Transmission Feed</h2></div>
            <Tabs defaultValue="live" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/[0.03] border border-white/5 p-1 h-12 rounded-xl">
                <TabsTrigger value="live" className="text-[9px] font-black uppercase">Live</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-[9px] font-black uppercase">Schedule</TabsTrigger>
                <TabsTrigger value="completed" className="text-[9px] font-black uppercase">Archive</TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="space-y-4 mt-6">
                {sportMatches?.filter(m => m.status === 'Live').map(match => (
                  <Card key={match.id} className="premium-card border-live/30">
                    <CardContent className="p-8">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-8"><div className="flex-1 text-center md:text-right"><p className="text-2xl font-black uppercase italic tracking-tighter">{match.teamA}</p></div><div className="flex flex-col items-center gap-4"><div className="text-6xl font-black tabular-nums tracking-tighter bg-white/5 px-10 py-4 rounded-3xl border border-white/10 shadow-2xl">{match.scoreA} : {match.scoreB}</div><Badge className="bg-live text-black text-[9px] font-black uppercase animate-pulse">Transmission Active</Badge></div><div className="flex-1 text-center md:text-left"><p className="text-2xl font-black uppercase italic tracking-tighter">{match.teamB}</p></div></div>
                      {sport === 'badminton' && match.badmintonResults && (<div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-5 gap-3">{match.badmintonResults.map((sub, idx) => (<div key={idx} className="bg-white/5 rounded-xl p-3 text-center border border-white/5"><p className="text-[8px] font-black text-muted-foreground uppercase mb-1">{sub.type}</p><p className="text-xs font-black">{sub.score}</p>{sub.winner && <p className="text-[7px] font-black text-primary uppercase mt-1">Win: {sub.winner}</p>}</div>))}</div>)}
                      <div className="mt-8 text-center border-t border-white/5 pt-4 flex flex-col items-center gap-1"><span className="text-[9px] font-black uppercase text-primary/60 tracking-[0.2em]">Match #{match.matchNumber}</span><span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.3em] flex items-center gap-2"><MapPin className="h-3 w-3" /> {match.venue} {match.courtNumber || match.groundNumber ? `• ${match.courtNumber || match.groundNumber}` : ''}</span></div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-3 mt-6">
                {sportMatches?.filter(m => m.status === 'Upcoming').map(match => (
                  <Card key={match.id} className="premium-card group border-white/5">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-6"><div className="text-center pr-6 border-r border-white/5 w-24"><p className="text-[8px] font-black text-primary/60 uppercase">M#{match.matchNumber}</p><p className="text-xs font-black text-white uppercase">{match.time}</p><p className="text-[7px] font-black text-muted-foreground/40 uppercase">{match.day}</p></div><div><p className="text-base font-black uppercase italic tracking-tight group-hover:text-primary transition-colors">{match.teamA} vs {match.teamB}</p><div className="flex items-center gap-3 mt-1"><span className="text-[8px] font-black text-muted-foreground/40 uppercase flex items-center gap-1"><MapPin className="h-2 w-2" /> {match.venue}</span><span className="text-[8px] font-black text-muted-foreground/40 uppercase flex items-center gap-1"><Calendar className="h-2 w-2" /> {match.date}</span>{ (match.courtNumber || match.groundNumber) && <span className="text-[8px] font-black text-primary/40 uppercase">Loc: {match.courtNumber || match.groundNumber}</span> }</div></div></div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 mt-6">
                {sportMatches?.filter(m => m.status === 'Completed').map(match => (
                  <Card key={match.id} className="premium-card group border-white/5">
                    <CardContent className="p-0">
                      <div className="p-6 flex items-center justify-between"><div className="flex-1 text-right pr-6"><p className={cn("font-black text-base uppercase italic", match.scoreA > match.scoreB ? 'text-primary' : 'text-muted-foreground')}>{match.teamA}</p></div><div className="text-2xl font-black tabular-nums bg-white/5 px-6 py-2 rounded-xl border border-white/10">{match.scoreA} - {match.scoreB}</div><div className="flex-1 text-left pl-6"><p className={cn("font-black text-base uppercase italic", match.scoreB > match.scoreA ? 'text-primary' : 'text-muted-foreground')}>{match.teamB}</p></div></div>
                      <div className="flex items-center justify-between px-6 py-3 border-t border-white/5 bg-white/[0.01]"><span className="text-[8px] font-black uppercase text-muted-foreground/30 tracking-widest">Match #{match.matchNumber} • {match.venue} • {match.phase}</span><MatchRecapButton match={match} /></div>
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
