'use client';

import { useMemo, useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { EVENTS, FOOTBALL_STANDINGS, VOLLEYBALL_STANDINGS, BADMINTON_STANDINGS, RUN_RESULTS } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MatchRecapButton } from '@/components/MatchRecapButton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Match } from '@/lib/types';
import Loading from '@/app/loading';

export default function EventPage() {
  const params = useParams();
  const sport = params.sport as string;
  const db = useFirestore();

  const event = EVENTS.find(e => e.slug === sport);
  if (!event) notFound();

  // Live Firestore Match Query
  const matchesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'matches'), where('sport', '==', sport));
  }, [db, sport]);

  const { data: sportMatches, loading: matchesLoading } = useCollection<Match>(matchesQuery);

  const runCategories = [
    '3km Male',
    '3km Female',
    '5km Male 18-25',
    '5km Male 26+',
    '5km Female 18-25',
    '5km Female 26+'
  ];

  if (matchesLoading) return <Loading />;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">{event.name}</h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black">{event.description}</p>
      </div>

      {sport === 'football' && (
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
              <span className="h-1 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(147,51,234,0.5)]"></span>
              Division Standings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['A', 'B', 'C', 'D'].map((group) => (
                <Card key={group} className="premium-card overflow-hidden">
                  <div className="bg-white/[0.03] px-5 py-3 border-b border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">Group {group}</span>
                  </div>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-white/[0.01] hover:bg-transparent border-white/5">
                          <TableHead className="text-[9px] font-black uppercase h-10 px-5 text-muted-foreground">Team</TableHead>
                          <TableHead className="text-center text-[9px] font-black uppercase w-8 p-0 text-muted-foreground">P</TableHead>
                          <TableHead className="text-center text-[9px] font-black uppercase w-12 text-muted-foreground">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {FOOTBALL_STANDINGS.filter(s => s.group === group).sort((a, b) => b.points - a.points).map((row, i) => (
                          <TableRow key={row.team} className={cn("h-12 border-white/5 transition-colors", i === 0 ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-white/[0.02]')}>
                            <TableCell className={cn("font-bold text-xs px-5", i === 0 ? 'text-primary' : 'text-foreground/90')}>{row.team}</TableCell>
                            <TableCell className="text-center text-[11px] font-medium p-0 text-muted-foreground/80">{row.played}</TableCell>
                            <TableCell className={cn("text-center font-black", i === 0 ? 'text-primary' : 'text-white')}>{row.points}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
              <span className="h-1 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(147,51,234,0.5)]"></span>
              Fixtures & Live Results
            </h2>
            <Tabs defaultValue="live" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/[0.03] border border-white/5 p-1 h-12 rounded-xl">
                <TabsTrigger value="live" className="text-[10px] font-black uppercase">Live</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-[10px] font-black uppercase">Upcoming</TabsTrigger>
                <TabsTrigger value="completed" className="text-[10px] font-black uppercase">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="live" className="space-y-3 mt-6">
                {sportMatches?.filter(m => m.status === 'Live').length > 0 ? (
                  sportMatches.filter(m => m.status === 'Live').map(match => (
                    <Card key={match.id} className="premium-card border border-live/20">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex-1 text-right"><p className="font-black text-sm">{match.teamA}</p></div>
                        <div className="flex flex-col items-center px-8">
                          <div className="text-3xl font-black tabular-nums tracking-tighter bg-live/10 px-4 py-1.5 rounded-lg border border-live/20">
                            {match.scoreA} : {match.scoreB}
                          </div>
                          <Badge className="bg-live text-black text-[8px] font-black mt-2 uppercase animate-pulse">Live Transmission</Badge>
                        </div>
                        <div className="flex-1 text-left"><p className="font-black text-sm">{match.teamB}</p></div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 rounded-xl bg-white/[0.02] border border-dashed border-white/10 italic">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">No Active Data Stream</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-3 mt-6">
                {sportMatches?.filter(m => m.status === 'Upcoming').map(match => (
                  <Card key={match.id} className="premium-card border border-white/5 group">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-primary uppercase">{match.time}</span>
                          <span className="text-[9px] font-black text-muted-foreground/40 uppercase">Group {match.group}</span>
                        </div>
                        <p className="text-base font-bold mt-1 group-hover:text-primary transition-colors">{match.teamA} v {match.teamB}</p>
                      </div>
                      <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-muted-foreground/30">Scheduled</Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-3 mt-6">
                {sportMatches?.filter(m => m.status === 'Completed').map(match => (
                  <Card key={match.id} className="premium-card border border-white/5 group">
                    <CardContent className="p-0">
                      <div className="p-6 grid grid-cols-7 items-center">
                        <div className="col-span-2 text-right"><p className="font-bold text-sm group-hover:text-primary transition-colors">{match.teamA}</p></div>
                        <div className="col-span-3 flex flex-col items-center">
                          <div className="text-2xl font-black tabular-nums bg-white/5 px-4 py-1.5 rounded-lg border border-white/5">
                            {match.scoreA} - {match.scoreB}
                          </div>
                        </div>
                        <div className="col-span-2 text-left"><p className="font-bold text-sm group-hover:text-primary transition-colors">{match.teamB}</p></div>
                      </div>
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

      {sport === 'kampus-run' && (
        <div className="space-y-6">
          <Tabs defaultValue={runCategories[0]} className="w-full">
            <div className="overflow-x-auto no-scrollbar mb-6 bg-white/[0.03] border border-white/5 p-1 rounded-xl">
              <TabsList className="flex w-max h-12 bg-transparent gap-1">
                {runCategories.map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="text-[10px] font-black uppercase px-6 whitespace-nowrap data-[state=active]:bg-primary transition-all">
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {runCategories.map((cat) => {
              const categoryResults = RUN_RESULTS.filter(r => r.category === cat).sort((a, b) => a.position - b.position);
              return (
                <TabsContent key={cat} value={cat} className="mt-0">
                  <Card className="premium-card overflow-hidden">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-white/[0.03] shadow-lg">
                          <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-20 text-center text-[9px] font-black uppercase text-muted-foreground">Pos</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-muted-foreground">Participant</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-muted-foreground">Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryResults.map((res) => (
                            <TableRow key={res.name} className="h-16 border-white/5 transition-colors hover:bg-white/[0.02]">
                              <TableCell className="text-center font-black text-muted-foreground/30">{res.position}</TableCell>
                              <TableCell><span className="font-black text-sm text-white">{res.name}</span></TableCell>
                              <TableCell><span className="text-sm font-black text-primary">{res.time}</span></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      )}
      
      {/* Volleyball and Badminton can be expanded similarly with Live data */}
    </div>
  );
}
