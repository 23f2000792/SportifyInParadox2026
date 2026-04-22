
'use client';

import { useMemo, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { EVENTS, FOOTBALL_STANDINGS, RUN_RESULTS } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MatchRecapButton } from '@/components/MatchRecapButton';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Match, RunResult } from '@/lib/types';
import Loading from '@/app/loading';
import { Trophy, Timer, User, MapPin } from 'lucide-react';

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

  const runResultsQuery = useMemo(() => {
    if (!db || sport !== 'kampus-run') return null;
    return collection(db, 'runResults');
  }, [db, sport]);

  const { data: sportMatches, loading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: runResults, loading: runLoading } = useCollection<RunResult>(runResultsQuery);

  const runCategories = ['3km Male', '3km Female', '5km Male 18-25', '5km Female 18-25'];

  if (matchesLoading || (sport === 'kampus-run' && runLoading)) return <Loading />;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">{event.name}</h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black">{event.description}</p>
      </div>

      {sport === 'kampus-run' ? (
        <div className="space-y-8">
          <Tabs defaultValue={runCategories[0]} className="w-full">
            <div className="overflow-x-auto no-scrollbar mb-6 bg-white/[0.03] border border-white/5 p-1 rounded-xl">
              <TabsList className="flex w-max h-12 bg-transparent gap-1">
                {runCategories.map(cat => (
                  <TabsTrigger key={cat} value={cat} className="text-[10px] font-black uppercase px-6 whitespace-nowrap data-[state=active]:bg-primary transition-all">
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {runCategories.map(cat => {
              const filteredResults = runResults
                ?.filter(r => r.category === cat)
                .sort((a, b) => a.position - b.position) || [];
                
              return (
                <TabsContent key={cat} value={cat} className="mt-0">
                  <Card className="premium-card overflow-hidden">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-white/[0.03]">
                            <TableRow className="hover:bg-transparent border-none">
                              <TableHead className="w-20 text-center text-[9px] font-black uppercase text-muted-foreground">Pos</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-muted-foreground">Participant</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-muted-foreground">Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredResults.length > 0 ? filteredResults.map(res => (
                              <TableRow key={res.id} className="h-16 border-white/5 transition-colors hover:bg-white/[0.02]">
                                <TableCell className="text-center"><span className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center mx-auto text-[10px] font-black text-muted-foreground">{res.position}</span></TableCell>
                                <TableCell><span className="font-black text-sm text-white">{res.name}</span></TableCell>
                                <TableCell><div className="flex items-center gap-2"><Timer className="h-3 w-3 text-primary" /><span className="text-sm font-black text-primary">{res.time}</span></div></TableCell>
                              </TableRow>
                            )) : (
                              <TableRow><TableCell colSpan={3} className="h-32 text-center text-[10px] font-black uppercase opacity-20">Awaiting Finishers</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      ) : (
        <div className="space-y-10">
          {sport === 'football' && (
            <section className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
                <span className="h-1 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(147,51,234,0.5)]"></span>
                League Matrix
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['A', 'B'].map(group => (
                  <Card key={group} className="premium-card">
                    <div className="bg-white/[0.03] px-5 py-3 border-b border-white/5 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary">Group {group}</span>
                      <Trophy className="h-3.5 w-3.5 text-primary/30" />
                    </div>
                    <Table>
                      <TableHeader><TableRow className="border-white/5"><TableHead className="text-[9px] font-black uppercase">Team</TableHead><TableHead className="text-center text-[9px] font-black uppercase">P</TableHead><TableHead className="text-center text-[9px] font-black uppercase">Pts</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {FOOTBALL_STANDINGS.filter(s => s.group === group).sort((a,b) => b.points - a.points).map((row, i) => (
                          <TableRow key={row.team} className="h-12 border-white/5">
                            <TableCell className="font-bold text-xs">{row.team}</TableCell>
                            <TableCell className="text-center text-[11px] text-muted-foreground">{row.played}</TableCell>
                            <TableCell className="text-center font-black">{row.points}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
              <span className="h-1 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(147,51,234,0.5)]"></span>
              Live Broadcast Feed
            </h2>
            <Tabs defaultValue="live" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/[0.03] border border-white/5 p-1 h-12 rounded-xl">
                <TabsTrigger value="live" className="text-[10px] font-black uppercase">Live</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-[10px] font-black uppercase">Upcoming</TabsTrigger>
                <TabsTrigger value="completed" className="text-[10px] font-black uppercase">Archived</TabsTrigger>
              </TabsList>
              
              <TabsContent value="live" className="space-y-4 mt-6">
                {sportMatches?.filter(m => m.status === 'Live').map(match => (
                  <Card key={match.id} className="premium-card border-live/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex-1 text-right pr-4"><p className="font-black text-base">{match.teamA}</p></div>
                        <div className="flex flex-col items-center">
                          <div className="text-3xl font-black tabular-nums tracking-tighter bg-live/10 px-6 py-2 rounded-xl border border-live/20 shadow-[0_0_20px_rgba(255,193,7,0.1)]">
                            {match.scoreA} : {match.scoreB}
                          </div>
                          <Badge className="bg-live text-black text-[8px] font-black mt-3 uppercase animate-pulse">Transmission Active</Badge>
                        </div>
                        <div className="flex-1 text-left pl-4"><p className="font-black text-base">{match.teamB}</p></div>
                      </div>
                      {match.badmintonResults && (
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 border-t border-white/5 pt-4">
                          {match.badmintonResults.map(res => (
                            <div key={res.type} className="bg-white/5 p-2 rounded text-center">
                              <p className="text-[8px] font-black text-muted-foreground uppercase">{res.type}</p>
                              <p className="text-[10px] font-black text-primary mt-1">{res.score}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-3 mt-6">
                {sportMatches?.filter(m => m.status === 'Upcoming').map(match => (
                  <Card key={match.id} className="premium-card border-white/5 group">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-primary uppercase">{match.time}</span>
                          <span className="text-[9px] font-black text-muted-foreground/40 uppercase">{match.group ? `Group ${match.group}` : 'Elimination'}</span>
                        </div>
                        <p className="text-base font-bold mt-1 group-hover:text-primary transition-colors">{match.teamA} vs {match.teamB}</p>
                      </div>
                      <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-muted-foreground/30">Scheduled</Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-3 mt-6">
                {sportMatches?.filter(m => m.status === 'Completed').map(match => (
                  <Card key={match.id} className="premium-card border-white/5 group">
                    <CardContent className="p-0">
                      <div className="p-6 flex items-center justify-between">
                        <div className="flex-1 text-right pr-4"><p className={cn("font-bold text-sm", match.scoreA > match.scoreB ? 'text-primary' : 'text-muted-foreground')}>{match.teamA}</p></div>
                        <div className="text-2xl font-black tabular-nums bg-white/5 px-4 py-1.5 rounded-lg border border-white/5">
                          {match.scoreA} - {match.scoreB}
                        </div>
                        <div className="flex-1 text-left pl-4"><p className={cn("font-bold text-sm", match.scoreB > match.scoreA ? 'text-primary' : 'text-muted-foreground')}>{match.teamB}</p></div>
                      </div>
                      {match.badmintonResults && (
                        <div className="px-6 pb-4 grid grid-cols-1 sm:grid-cols-5 gap-2">
                          {match.badmintonResults.map(res => (
                            <div key={res.type} className={cn("p-2 rounded border border-white/5", res.winner === (match.scoreA > match.scoreB ? match.teamA : match.teamB) ? 'bg-primary/5' : 'bg-white/[0.02]')}>
                              <p className="text-[7px] font-black uppercase text-center opacity-40">{res.type}</p>
                              <p className="text-[9px] font-black text-center mt-0.5">{res.score}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-center border-t border-white/5 py-2 bg-white/[0.01]">
                        <MatchRecapButton match={match} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </section>
        </div>
      )}
    </div>
  );
}
