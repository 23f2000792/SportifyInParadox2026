import { notFound } from 'next/navigation';
import { EVENTS, MOCK_MATCHES, FOOTBALL_STANDINGS, VOLLEYBALL_STANDINGS, BADMINTON_STANDINGS, RUN_RESULTS } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MatchRecapButton } from '@/components/MatchRecapButton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export default async function EventPage({ params }: { params: { sport: string } }) {
  const { sport } = await params;
  const event = EVENTS.find(e => e.slug === sport);
  
  if (!event) notFound();

  const sportMatches = MOCK_MATCHES.filter(m => m.sport === sport);

  const runCategories = [
    '3km Male',
    '3km Female',
    '5km Male 18-25',
    '5km Male 26+',
    '5km Female 18-25',
    '5km Female 26+'
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
        <h1 className="text-3xl font-black text-white">{event.name}</h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black">{event.description}</p>
      </div>

      {/* FOOTBALL SPECIFIC LAYOUT */}
      {sport === 'football' && (
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
              <span className="h-1 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(147,51,234,0.5)]"></span>
              League Standings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['A', 'B', 'C', 'D'].map((group) => (
                <Card key={group} className="premium-card overflow-hidden">
                  <div className="bg-white/[0.03] px-5 py-3 border-b border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">Group {group}</span>
                  </div>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-white/[0.01] hover:bg-transparent border-white/5">
                            <TableHead className="text-[9px] font-black uppercase h-10 px-5 text-muted-foreground">Team</TableHead>
                            <TableHead className="text-center text-[9px] font-black uppercase w-8 p-0 text-muted-foreground">P</TableHead>
                            <TableHead className="text-center text-[9px] font-black uppercase w-8 p-0 text-muted-foreground">W</TableHead>
                            <TableHead className="text-center text-[9px] font-black uppercase w-8 p-0 text-muted-foreground">D</TableHead>
                            <TableHead className="text-center text-[9px] font-black uppercase w-8 p-0 text-muted-foreground">L</TableHead>
                            <TableHead className="text-center text-[9px] font-black uppercase w-12 text-muted-foreground">Pts</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {FOOTBALL_STANDINGS.filter(s => s.group === group).sort((a, b) => b.points - a.points || (b.won - a.won)).map((row, i) => (
                            <TableRow key={row.team} className={cn("h-12 border-white/5 transition-colors", i === 0 ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-white/[0.02]')}>
                              <TableCell className={cn("font-bold text-xs px-5", i === 0 ? 'text-primary' : 'text-foreground/90')}>
                                {row.team}
                              </TableCell>
                              <TableCell className="text-center text-[11px] font-medium p-0 text-muted-foreground/80">{row.played}</TableCell>
                              <TableCell className="text-center text-[11px] font-medium p-0 text-muted-foreground/80">{row.won}</TableCell>
                              <TableCell className="text-center text-[11px] font-medium p-0 text-muted-foreground/80">{row.drawn}</TableCell>
                              <TableCell className="text-center text-[11px] font-medium p-0 text-muted-foreground/80">{row.lost}</TableCell>
                              <TableCell className={cn("text-center font-black", i === 0 ? 'text-primary' : 'text-white')}>{row.points}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
              <span className="h-1 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(147,51,234,0.5)]"></span>
              Fixtures & Results
            </h2>
            <Tabs defaultValue="live" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/[0.03] border border-white/5 p-1 h-12 rounded-xl">
                <TabsTrigger value="live" className="text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Live</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Upcoming</TabsTrigger>
                <TabsTrigger value="completed" className="text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="live" className="space-y-3 mt-6">
                {sportMatches.filter(m => m.status === 'Live').length > 0 ? (
                  sportMatches.filter(m => m.status === 'Live').map(match => (
                    <Card key={match.id} className="premium-card border border-live/20">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex-1 text-right">
                          <p className="font-black text-sm">{match.teamA}</p>
                        </div>
                        <div className="flex flex-col items-center px-8">
                          <div className="text-3xl font-black tabular-nums tracking-tighter bg-live/10 px-4 py-1.5 rounded-lg border border-live/20">
                            {match.scoreA} : {match.scoreB}
                          </div>
                          <Badge className="bg-live text-black text-[8px] font-black mt-2 uppercase animate-pulse">Live Transmission</Badge>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-black text-sm">{match.teamB}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 rounded-xl bg-white/[0.02] border border-dashed border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">No Active Data Stream</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-3 mt-6">
                {sportMatches.filter(m => m.status === 'Upcoming').map(match => (
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
                {sportMatches.filter(m => m.status === 'Completed').map(match => (
                  <Card key={match.id} className="premium-card border border-white/5 group">
                    <CardContent className="p-0">
                      <div className="p-6 grid grid-cols-7 items-center">
                        <div className="col-span-2 text-right">
                          <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">{match.teamA}</p>
                        </div>
                        <div className="col-span-3 flex flex-col items-center">
                          <div className="text-2xl font-black tabular-nums bg-white/5 px-4 py-1.5 rounded-lg border border-white/5">
                            {match.scoreA} - {match.scoreB}
                          </div>
                          <span className="text-[8px] font-black uppercase text-muted-foreground/40 mt-2 tracking-widest">Final Outcome</span>
                        </div>
                        <div className="col-span-2 text-left">
                          <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">{match.teamB}</p>
                        </div>
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

      {/* KAMPUS RUN LAYOUT */}
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
                      <div className="max-h-[600px] overflow-auto">
                        <Table>
                          <TableHeader className="bg-white/[0.03] sticky top-0 z-10 shadow-lg border-b border-white/10">
                            <TableRow className="hover:bg-transparent border-none">
                              <TableHead className="w-20 text-center text-[9px] font-black uppercase text-muted-foreground">Pos</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-muted-foreground">Participant</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-muted-foreground">Record Time</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-center text-muted-foreground">Bracket</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoryResults.length > 0 ? (
                              categoryResults.map((res) => {
                                const isTop3 = res.position <= 3;
                                const podiumBg = res.position === 1 ? 'bg-yellow-500/5' : res.position === 2 ? 'bg-gray-400/5' : res.position === 3 ? 'bg-orange-500/5' : '';

                                return (
                                  <TableRow key={res.name} className={cn("h-16 border-white/5 transition-colors hover:bg-white/[0.02]", isTop3 && podiumBg)}>
                                    <TableCell className="text-center">
                                      {res.position === 1 ? (
                                        <div className="flex flex-col items-center">
                                          <span className="text-2xl drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">🥇</span>
                                        </div>
                                      ) : res.position === 2 ? (
                                        <div className="flex flex-col items-center">
                                          <span className="text-2xl drop-shadow-[0_0_8px_rgba(156,163,175,0.5)]">🥈</span>
                                        </div>
                                      ) : res.position === 3 ? (
                                        <div className="flex flex-col items-center">
                                          <span className="text-2xl drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">🥉</span>
                                        </div>
                                      ) : (
                                        <span className="font-black text-muted-foreground/30 text-base">{res.position}</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-black text-sm tracking-tight text-white">{res.name}</span>
                                        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">{res.gender === 'M' ? 'Male Division' : 'Female Division'}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className={cn("text-base font-black tabular-nums tracking-tighter", isTop3 ? 'text-primary' : 'text-white/80')}>
                                        {res.time}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="outline" className="text-[9px] font-black uppercase border-white/10 bg-white/5 text-muted-foreground">
                                        {res.ageGroup}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] italic">
                                  No Record Entries Available
                                </TableCell>
                              </TableRow>
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
      )}

      {/* VOLLEYBALL LAYOUT */}
      {sport === 'volleyball' && (
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
              <span className="h-1 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(147,51,234,0.5)]"></span>
              Rankings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['A', 'B', 'C', 'D'].map((group) => (
                <Card key={group} className="premium-card">
                  <div className="bg-white/[0.03] px-5 py-3 border-b border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">Group {group}</span>
                  </div>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-white/[0.01] hover:bg-transparent border-white/5">
                          <TableHead className="text-[9px] font-black uppercase h-10 px-5 text-muted-foreground">Team</TableHead>
                          <TableHead className="text-center text-[9px] font-black uppercase w-12 text-muted-foreground">P</TableHead>
                          <TableHead className="text-center text-[9px] font-black uppercase w-12 text-muted-foreground">W</TableHead>
                          <TableHead className="text-center text-[9px] font-black uppercase w-12 text-muted-foreground">L</TableHead>
                          <TableHead className="text-center text-[9px] font-black uppercase w-12 text-muted-foreground">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {VOLLEYBALL_STANDINGS.filter(s => s.group === group).sort((a, b) => b.points - a.points).map((row, i) => (
                          <TableRow key={row.team} className={cn("h-12 border-white/5 transition-colors", i === 0 ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-white/[0.02]')}>
                            <TableCell className={cn("font-bold text-xs px-5", i === 0 ? 'text-primary' : 'text-white/80')}>
                              {row.team}
                            </TableCell>
                            <TableCell className="text-center text-[11px] font-medium text-muted-foreground/60">{row.played}</TableCell>
                            <TableCell className="text-center text-[11px] font-medium text-muted-foreground/60">{row.won}</TableCell>
                            <TableCell className="text-center text-[11px] font-medium text-muted-foreground/60">{row.lost}</TableCell>
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
              Live & Recent Data
            </h2>
            <div className="space-y-3">
              {sportMatches.filter(m => m.status !== 'Upcoming').map(match => (
                <Card key={match.id} className="premium-card border border-white/5 group">
                  <CardContent className="p-0">
                    <div className="p-6 flex items-center justify-between">
                      <div className="flex-1 text-right">
                        <p className="font-bold text-sm group-hover:text-primary transition-colors">{match.teamA}</p>
                      </div>
                      <div className="px-10 flex flex-col items-center">
                        <span className="text-2xl font-black tabular-nums bg-white/5 px-4 py-1.5 rounded-lg border border-white/5">
                          {match.scoreA} - {match.scoreB}
                        </span>
                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase mt-2 tracking-widest">Sets Record</span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-sm group-hover:text-primary transition-colors">{match.teamB}</p>
                      </div>
                    </div>
                    {match.status === 'Completed' && (
                      <div className="flex justify-center border-t border-white/5 py-2 bg-white/[0.01]">
                        <MatchRecapButton match={match} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* BADMINTON LAYOUT */}
      {sport === 'badminton' && (
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
              <span className="h-1 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(147,51,234,0.5)]"></span>
              Group Standings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['A', 'B', 'C', 'D'].map((group) => (
                <Card key={group} className="premium-card">
                  <div className="bg-white/[0.03] px-5 py-3 border-b border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">Group {group}</span>
                  </div>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-white/[0.01] hover:bg-transparent border-white/5">
                          <TableHead className="text-[9px] font-black uppercase h-10 px-5 text-muted-foreground">House</TableHead>
                          <TableHead className="text-center text-[9px] font-black uppercase w-12 text-muted-foreground">P</TableHead>
                          <TableHead className="text-center text-[9px] font-black uppercase w-12 text-muted-foreground">W</TableHead>
                          <TableHead className="text-center text-[9px] font-black uppercase w-12 text-muted-foreground">L</TableHead>
                          <TableHead className="text-center text-[9px] font-black uppercase w-12 text-muted-foreground">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {BADMINTON_STANDINGS.filter(s => s.group === group).sort((a, b) => b.points - a.points).map((row, i) => (
                          <TableRow key={row.team} className={cn("h-12 border-white/5 transition-colors", i === 0 ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-white/[0.02]')}>
                            <TableCell className={cn("font-bold text-xs px-5", i === 0 ? 'text-primary' : 'text-white/80')}>
                              {row.team}
                            </TableCell>
                            <TableCell className="text-center text-[11px] font-medium text-muted-foreground/60">{row.played}</TableCell>
                            <TableCell className="text-center text-[11px] font-medium text-muted-foreground/60">{row.won}</TableCell>
                            <TableCell className="text-center text-[11px] font-medium text-muted-foreground/60">{row.lost}</TableCell>
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
              Match Ties
            </h2>
            <div className="space-y-3">
              {sportMatches.map((match) => (
                <Accordion key={match.id} type="single" collapsible className="w-full">
                  <AccordionItem value={match.id} className="border-none premium-card rounded-xl shadow-lg overflow-hidden group">
                    <AccordionTrigger className="px-6 py-5 hover:no-underline [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-muted-foreground/40">
                      <div className="flex justify-between w-full pr-6 items-center">
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col items-end min-w-[100px]">
                            <span className="text-sm font-black group-hover:text-primary transition-colors truncate max-w-[120px]">{match.teamA}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className={cn("text-xl font-black tabular-nums px-4 py-1 rounded-lg border", match.status === 'Live' ? 'bg-live/10 text-live border-live/20 animate-pulse' : 'bg-white/5 text-primary border-white/10')}>
                              {match.scoreA} - {match.scoreB}
                            </span>
                            <span className="text-[8px] font-black uppercase text-muted-foreground/40 mt-1.5 tracking-widest">{match.status} Status</span>
                          </div>
                          <div className="flex flex-col items-start min-w-[100px]">
                            <span className="text-sm font-black group-hover:text-primary transition-colors truncate max-w-[120px]">{match.teamB}</span>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-4">
                          <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">{match.time}</span>
                          {match.status === 'Live' && (
                            <div className="h-2 w-2 rounded-full bg-live animate-pulse" />
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 border-t border-white/5 bg-black/20">
                       {match.badmintonResults && match.badmintonResults.length > 0 ? (
                         <div className="divide-y divide-white/5 text-[11px] font-medium">
                            {match.badmintonResults.map((res, idx) => (
                              <div key={idx} className="flex justify-between p-4 px-10 hover:bg-white/[0.01] transition-colors">
                                <span className="text-muted-foreground/60 uppercase font-black tracking-wider text-[10px]">{res.type} Match</span>
                                <div className="flex items-center gap-6">
                                  <span className="text-muted-foreground/40 text-[9px] uppercase font-bold">{res.winner} Dominance</span>
                                  <span className="font-black tabular-nums text-primary text-sm tracking-tighter">{res.score}</span>
                                </div>
                              </div>
                            ))}
                         </div>
                       ) : (
                         <div className="p-8 text-center text-[10px] font-black uppercase text-muted-foreground/30 tracking-widest italic">
                            Lineup details pending stream start...
                         </div>
                       )}
                       {match.status === 'Completed' && (
                         <div className="flex justify-center border-t border-white/5 py-3 bg-white/[0.01]">
                            <MatchRecapButton match={match} />
                         </div>
                       )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
