
'use client';

import { useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { EVENTS } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MatchRecapButton } from '@/components/MatchRecapButton';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Match, RunResult, Standing, GROUPS } from '@/lib/types';
import Loading from '@/app/loading';
import { Trophy, Timer, Zap, CircleDot, Target } from 'lucide-react';

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
    return query(collection(db, 'matches'), where('sport', '==', sport), orderBy('time', 'asc'));
  }, [db, sport]);

  const standingsQuery = useMemo(() => {
    if (!db || sport === 'kampus-run') return null;
    return query(collection(db, 'standings'), where('sport', '==', sport));
  }, [db, sport]);

  const runResultsQuery = useMemo(() => {
    if (!db || sport !== 'kampus-run') return null;
    return collection(db, 'runResults');
  }, [db, sport]);

  const { data: sportMatches, loading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: standings, loading: stdLoading } = useCollection<Standing>(standingsQuery);
  const { data: runResults, loading: runLoading } = useCollection<RunResult>(runResultsQuery);

  if (matchesLoading || stdLoading || runLoading) return <Loading />;

  const IconComp = ICON_MAP[event.icon];

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <IconComp className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{event.name}</h1>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-black">{event.description}</p>
        </div>
        <div className="flex gap-2">
           <Badge className="bg-live/10 text-live border-live/20 text-[9px] font-black uppercase px-3 py-1">Transmission Online</Badge>
        </div>
      </div>

      {sport !== 'kampus-run' && (
        <section className="space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-primary" /> League Standings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GROUPS.map(group => {
              const groupStandings = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
              if (!groupStandings?.length) return null;
              return (
                <Card key={group} className="premium-card overflow-hidden">
                  <div className="bg-white/[0.03] px-5 py-3 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-primary">Group {group}</span>
                    <Badge variant="outline" className="text-[8px] font-black border-white/10 uppercase">Matrix Active</Badge>
                  </div>
                  <Table>
                    <TableHeader className="bg-white/[0.01]">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[9px] font-black uppercase">House</TableHead>
                        <TableHead className="text-center text-[9px] font-black uppercase">P</TableHead>
                        <TableHead className="text-center text-[9px] font-black uppercase">Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupStandings.map((row) => (
                        <TableRow key={row.team} className="h-12 border-white/5 hover:bg-white/[0.02] transition-colors">
                          <TableCell className="font-bold text-xs">{row.team}</TableCell>
                          <TableCell className="text-center text-[11px] text-muted-foreground">{row.played}</TableCell>
                          <TableCell className="text-center font-black text-sm">{row.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary" /> Transmission Feed
        </h2>
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/[0.03] border border-white/5 p-1 h-14 rounded-2xl">
            <TabsTrigger value="live" className="text-[10px] font-black uppercase tracking-widest">Live Now</TabsTrigger>
            <TabsTrigger value="upcoming" className="text-[10px] font-black uppercase tracking-widest">Schedule</TabsTrigger>
            <TabsTrigger value="completed" className="text-[10px] font-black uppercase tracking-widest">Archive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="live" className="space-y-4 mt-8">
            {sportMatches?.filter(m => m.status === 'Live').map(match => (
              <Card key={match.id} className="premium-card border-live/20">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex-1 text-center"><p className="font-black text-lg uppercase italic tracking-tighter">{match.teamA}</p></div>
                    <div className="flex flex-col items-center px-10">
                      <div className="text-4xl font-black tabular-nums tracking-tighter bg-white/5 px-8 py-3 rounded-2xl border border-white/10 shadow-2xl">
                        {match.scoreA} : {match.scoreB}
                      </div>
                      <Badge className="bg-live text-black text-[9px] font-black mt-4 uppercase animate-pulse">Transmission Active</Badge>
                    </div>
                    <div className="flex-1 text-center"><p className="font-black text-lg uppercase italic tracking-tighter">{match.teamB}</p></div>
                  </div>
                  <div className="text-center border-t border-white/5 pt-4">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{match.phase} • {match.group ? `Group ${match.group}` : 'Knockout'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!sportMatches?.some(m => m.status === 'Live') && (
              <div className="py-20 text-center opacity-20"><Zap className="h-10 w-10 mx-auto mb-4" /><p className="text-[10px] font-black uppercase">No Active Streams</p></div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-3 mt-8">
            {sportMatches?.filter(m => m.status === 'Upcoming').map(match => (
              <Card key={match.id} className="premium-card group border-white/5">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-center pr-6 border-r border-white/5">
                       <p className="text-xs font-black text-primary uppercase">{match.time}</p>
                       <p className="text-[8px] font-black text-muted-foreground uppercase mt-1">Scheduled</p>
                    </div>
                    <div>
                      <p className="text-base font-black uppercase italic tracking-tight group-hover:text-primary transition-colors">{match.teamA} vs {match.teamB}</p>
                      <p className="text-[9px] font-black text-muted-foreground/40 uppercase mt-1">{match.phase} • {match.group ? `Group ${match.group}` : 'Knockout'}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 opacity-30">Pending</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-8">
            {sportMatches?.filter(m => m.status === 'Completed').map(match => (
              <Card key={match.id} className="premium-card group border-white/5">
                <CardContent className="p-0">
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex-1 text-right pr-6"><p className={cn("font-black text-base uppercase italic", match.scoreA > match.scoreB ? 'text-primary' : 'text-muted-foreground')}>{match.teamA}</p></div>
                    <div className="text-2xl font-black tabular-nums bg-white/5 px-5 py-2 rounded-xl border border-white/10">
                      {match.scoreA} - {match.scoreB}
                    </div>
                    <div className="flex-1 text-left pl-6"><p className={cn("font-black text-base uppercase italic", match.scoreB > match.scoreA ? 'text-primary' : 'text-muted-foreground')}>{match.teamB}</p></div>
                  </div>
                  <div className="flex items-center justify-between px-6 py-3 border-t border-white/5 bg-white/[0.01]">
                    <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">{match.phase} • ARCHIVED RESULT</span>
                    <MatchRecapButton match={match} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
