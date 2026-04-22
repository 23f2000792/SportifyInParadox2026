import { notFound } from 'next/navigation';
import { EVENTS, MOCK_MATCHES, FOOTBALL_STANDINGS, VOLLEYBALL_STANDINGS, BADMINTON_STANDINGS, RUN_RESULTS } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MatchRecapButton } from '@/components/MatchRecapButton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-2xl font-black">{event.name}</h1>
        <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold text-[10px]">{event.description}</p>
      </div>

      {/* FOOTBALL SPECIFIC LAYOUT */}
      {sport === 'football' && (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              League Standings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map((group) => (
                <Card key={group} className="border-none shadow-sm overflow-hidden bg-white">
                  <div className="bg-muted/50 px-4 py-2 border-b">
                    <span className="text-[10px] font-black uppercase">Group {group}</span>
                  </div>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 h-10">
                          <TableHead className="text-[10px] font-black uppercase">Team</TableHead>
                          <TableHead className="text-center text-[10px] font-black uppercase w-8 p-0">P</TableHead>
                          <TableHead className="text-center text-[10px] font-black uppercase w-8 p-0">W</TableHead>
                          <TableHead className="text-center text-[10px] font-black uppercase w-8 p-0">D</TableHead>
                          <TableHead className="text-center text-[10px] font-black uppercase w-8 p-0">L</TableHead>
                          <TableHead className="text-center text-[10px] font-black uppercase w-10">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {FOOTBALL_STANDINGS.filter(s => s.group === group).sort((a, b) => b.points - a.points || (b.won - a.won)).map((row, i) => (
                          <TableRow key={row.team} className={`h-10 ${i === 0 ? 'bg-primary/5' : ''}`}>
                            <TableCell className={`font-bold text-xs truncate max-w-[100px] ${i === 0 ? 'text-primary' : ''}`}>
                              {row.team}
                            </TableCell>
                            <TableCell className="text-center text-[11px] font-medium p-0">{row.played}</TableCell>
                            <TableCell className="text-center text-[11px] font-medium p-0">{row.won}</TableCell>
                            <TableCell className="text-center text-[11px] font-medium p-0">{row.drawn}</TableCell>
                            <TableCell className="text-center text-[11px] font-medium p-0">{row.lost}</TableCell>
                            <TableCell className={`text-center font-black ${i === 0 ? 'text-primary' : ''}`}>{row.points}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              Fixtures & Results
            </h2>
            <Tabs defaultValue="live" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-10">
                <TabsTrigger value="live" className="text-[10px] font-black uppercase">Live</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-[10px] font-black uppercase">Upcoming</TabsTrigger>
                <TabsTrigger value="completed" className="text-[10px] font-black uppercase">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="live" className="space-y-2 mt-4">
                {sportMatches.filter(m => m.status === 'Live').length > 0 ? (
                  sportMatches.filter(m => m.status === 'Live').map(match => (
                    <Card key={match.id} className="border-none shadow-sm ring-1 ring-yellow-400 overflow-hidden">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1 text-right">
                          <p className="font-black text-sm">{match.teamA}</p>
                        </div>
                        <div className="flex flex-col items-center px-6">
                          <div className="text-2xl font-black tabular-nums">
                            {match.scoreA} : {match.scoreB}
                          </div>
                          <Badge className="bg-yellow-400 text-yellow-900 text-[8px] font-black mt-1 uppercase animate-pulse">LIVE NOW</Badge>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-black text-sm">{match.teamB}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center py-8 text-[10px] font-black uppercase text-muted-foreground border border-dashed rounded-lg">No matches live</p>
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-2 mt-4">
                {sportMatches.filter(m => m.status === 'Upcoming').length > 0 ? (
                  sportMatches.filter(m => m.status === 'Upcoming').map(match => (
                    <Card key={match.id} className="border-none shadow-sm hover:ring-1 hover:ring-muted-foreground/10 fast-transition">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-primary uppercase">{match.time}</span>
                            {match.group && <span className="text-[9px] font-black text-muted-foreground uppercase bg-muted px-1 rounded">Group {match.group}</span>}
                          </div>
                          <p className="text-sm font-bold">{match.teamA} v {match.teamB}</p>
                        </div>
                        <Badge variant="outline" className="text-[8px] font-black uppercase border-muted-foreground/20 text-muted-foreground">Scheduled</Badge>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center py-8 text-[10px] font-black uppercase text-muted-foreground border border-dashed rounded-lg">No upcoming fixtures</p>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-2 mt-4">
                {sportMatches.filter(m => m.status === 'Completed').length > 0 ? (
                  sportMatches.filter(m => m.status === 'Completed').sort((a,b) => b.time.localeCompare(a.time)).map(match => (
                    <Card key={match.id} className="border-none shadow-sm overflow-hidden bg-white">
                      <CardContent className="p-0">
                        <div className="p-4 grid grid-cols-7 items-center">
                          <div className="col-span-2 text-right">
                            <p className="font-bold text-sm truncate">{match.teamA}</p>
                          </div>
                          <div className="col-span-3 flex flex-col items-center">
                            <div className="text-xl font-black tabular-nums bg-muted/30 px-3 py-0.5 rounded">
                              {match.scoreA} - {match.scoreB}
                            </div>
                            <span className="text-[8px] font-black uppercase text-muted-foreground/60 mt-1">Final Score {match.group ? `(Group ${match.group})` : ''}</span>
                          </div>
                          <div className="col-span-2 text-left">
                            <p className="font-bold text-sm truncate">{match.teamB}</p>
                          </div>
                        </div>
                        <div className="flex justify-center border-t py-1 bg-muted/10">
                          <MatchRecapButton match={match} />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center py-8 text-[10px] font-black uppercase text-muted-foreground border border-dashed rounded-lg">No results recorded</p>
                )}
              </TabsContent>
            </Tabs>
          </section>
        </div>
      )}

      {/* KAMPUS RUN LAYOUT */}
      {sport === 'kampus-run' && (
        <div className="space-y-4">
          <Tabs defaultValue={runCategories[0]} className="w-full">
            <div className="overflow-x-auto no-scrollbar mb-4 bg-muted/50 p-1 rounded-lg">
              <TabsList className="flex w-max h-10 bg-transparent gap-1">
                {runCategories.map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="text-[10px] font-black uppercase px-4 whitespace-nowrap">
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {runCategories.map((cat) => {
              const categoryResults = RUN_RESULTS.filter(r => r.category === cat).sort((a, b) => a.position - b.position);
              return (
                <TabsContent key={cat} value={cat} className="mt-0">
                  <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-0">
                      <div className="max-h-[600px] overflow-auto">
                        <Table>
                          <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                            <TableRow className="hover:bg-transparent border-none">
                              <TableHead className="w-16 text-center text-[10px] font-black uppercase">Pos</TableHead>
                              <TableHead className="text-[10px] font-black uppercase">Participant</TableHead>
                              <TableHead className="text-[10px] font-black uppercase">Time</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-center">Category</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoryResults.length > 0 ? (
                              categoryResults.map((res) => {
                                const isTop3 = res.position <= 3;
                                const podiumBg = res.position === 1 ? 'bg-yellow-50' : res.position === 2 ? 'bg-gray-50' : res.position === 3 ? 'bg-orange-50' : '';

                                return (
                                  <TableRow key={res.name} className={`h-12 border-muted/20 ${isTop3 ? podiumBg : ''}`}>
                                    <TableCell className="text-center">
                                      {res.position === 1 ? (
                                        <div className="flex flex-col items-center">
                                          <span className="text-xl">🥇</span>
                                          <span className="text-[8px] font-black text-yellow-600 -mt-1">1ST</span>
                                        </div>
                                      ) : res.position === 2 ? (
                                        <div className="flex flex-col items-center">
                                          <span className="text-xl">🥈</span>
                                          <span className="text-[8px] font-black text-gray-500 -mt-1">2ND</span>
                                        </div>
                                      ) : res.position === 3 ? (
                                        <div className="flex flex-col items-center">
                                          <span className="text-xl">🥉</span>
                                          <span className="text-[8px] font-black text-orange-600 -mt-1">3RD</span>
                                        </div>
                                      ) : (
                                        <span className="font-black text-muted-foreground/60">{res.position}</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-black text-sm">{res.name}</span>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{res.gender === 'M' ? 'Male' : 'Female'}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className={`text-sm font-black tabular-nums ${isTop3 ? 'text-primary' : ''}`}>
                                        {res.time}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="secondary" className="text-[9px] font-black uppercase bg-muted/80">
                                        {res.ageGroup}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-xs font-black text-muted-foreground uppercase italic">
                                  No records found for this category.
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
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              Rankings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map((group) => (
                <Card key={group} className="border-none shadow-sm overflow-hidden bg-white">
                  <div className="bg-muted/50 px-4 py-2 border-b">
                    <span className="text-[10px] font-black uppercase">Group {group}</span>
                  </div>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 h-10">
                          <TableHead className="text-[10px] font-black uppercase">Team</TableHead>
                          <TableHead className="text-center text-[10px] font-black uppercase w-12">Played</TableHead>
                          <TableHead className="text-center text-[10px] font-black uppercase w-12">Won</TableHead>
                          <TableHead className="text-center text-[10px] font-black uppercase w-12">Lost</TableHead>
                          <TableHead className="text-center text-[10px] font-black uppercase w-12">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {VOLLEYBALL_STANDINGS.filter(s => s.group === group).sort((a, b) => b.points - a.points).map((row, i) => (
                          <TableRow key={row.team} className={`h-10 ${i === 0 ? 'bg-primary/5' : ''}`}>
                            <TableCell className={`font-bold text-xs ${i === 0 ? 'text-primary' : ''}`}>
                              {row.team}
                            </TableCell>
                            <TableCell className="text-center text-[11px] font-medium">{row.played}</TableCell>
                            <TableCell className="text-center text-[11px] font-medium">{row.won}</TableCell>
                            <TableCell className="text-center text-[11px] font-medium">{row.lost}</TableCell>
                            <TableCell className={`text-center font-black ${i === 0 ? 'text-primary' : ''}`}>{row.points}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              Fixtures & Results
            </h2>
            <Tabs defaultValue="results" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 h-10">
                <TabsTrigger value="results" className="text-[10px] font-black uppercase">Results</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-[10px] font-black uppercase">Upcoming</TabsTrigger>
              </TabsList>
              
              <TabsContent value="results" className="mt-4 space-y-2">
                {sportMatches.filter(m => m.status === 'Completed').length > 0 ? (
                  sportMatches.filter(m => m.status === 'Completed').map(match => (
                    <Card key={match.id} className="border-none shadow-sm overflow-hidden bg-white">
                      <CardContent className="p-0">
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex-1 text-right">
                            <p className="font-bold text-sm">{match.teamA}</p>
                          </div>
                          <div className="px-6 flex flex-col items-center">
                            <span className="text-xl font-black tabular-nums bg-muted/30 px-3 py-0.5 rounded">
                              {match.scoreA} - {match.scoreB}
                            </span>
                            <span className="text-[8px] font-black text-muted-foreground uppercase mt-1">Sets {match.group ? `(Group ${match.group})` : ''}</span>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-bold text-sm">{match.teamB}</p>
                          </div>
                        </div>
                        <div className="flex justify-center border-t py-1 bg-muted/10">
                          <MatchRecapButton match={match} />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center py-8 text-[10px] font-black uppercase text-muted-foreground border border-dashed rounded-lg">No results yet</p>
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="mt-4 space-y-2">
                {sportMatches.filter(m => m.status === 'Upcoming' || m.status === 'Live').length > 0 ? (
                  sportMatches.filter(m => m.status === 'Upcoming' || m.status === 'Live').map(match => (
                    <Card key={match.id} className={`border-none shadow-sm ${match.status === 'Live' ? 'ring-1 ring-yellow-400' : ''}`}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-primary uppercase">{match.time}</span>
                            {match.group && <span className="text-[9px] font-black text-muted-foreground uppercase bg-muted px-1 rounded">Group {match.group}</span>}
                          </div>
                          <p className="font-bold text-sm">{match.teamA} v {match.teamB}</p>
                        </div>
                        {match.status === 'Live' ? (
                          <Badge className="bg-yellow-400 text-yellow-900 text-[9px] font-black animate-pulse">LIVE NOW</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[8px] font-black uppercase">Upcoming</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center py-8 text-[10px] font-black uppercase text-muted-foreground border border-dashed rounded-lg">No upcoming matches</p>
                )}
              </TabsContent>
            </Tabs>
          </section>
        </div>
      )}

      {/* BADMINTON LAYOUT */}
      {sport === 'badminton' && (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              Group Standings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map((group) => (
                <Card key={group} className="border-none shadow-sm overflow-hidden bg-white">
                  <div className="bg-muted/50 px-4 py-2 border-b">
                    <span className="text-[10px] font-black uppercase">Group {group}</span>
                  </div>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 h-10">
                          <TableHead className="text-[10px] font-black uppercase">House</TableHead>
                          <TableHead className="text-center text-[10px] font-black uppercase w-12">P</TableHead>
                          <TableHead className="text-center text-[10px] font-black uppercase w-12">W</TableHead>
                          <TableHead className="text-center text-[10px] font-black uppercase w-12">L</TableHead>
                          <TableHead className="text-center text-[10px] font-black uppercase w-12">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {BADMINTON_STANDINGS.filter(s => s.group === group).sort((a, b) => b.points - a.points).map((row, i) => (
                          <TableRow key={row.team} className={`h-10 ${i === 0 ? 'bg-primary/5' : ''}`}>
                            <TableCell className={`font-bold text-xs ${i === 0 ? 'text-primary' : ''}`}>
                              {row.team}
                            </TableCell>
                            <TableCell className="text-center text-[11px] font-medium">{row.played}</TableCell>
                            <TableCell className="text-center text-[11px] font-medium">{row.won}</TableCell>
                            <TableCell className="text-center text-[11px] font-medium">{row.lost}</TableCell>
                            <TableCell className={`text-center font-black ${i === 0 ? 'text-primary' : ''}`}>{row.points}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              Match Ties
            </h2>
            <div className="space-y-3">
              {sportMatches.map((match) => (
                <Accordion key={match.id} type="single" collapsible className="w-full">
                  <AccordionItem value={match.id} className="border-none bg-white rounded-lg shadow-sm overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline [&>svg]:h-4 [&>svg]:w-4">
                      <div className="flex justify-between w-full pr-4 items-center">
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end min-w-[80px]">
                            <span className="text-xs font-bold truncate max-w-[100px]">{match.teamA}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className={`text-lg font-black tabular-nums px-2 rounded ${match.status === 'Live' ? 'bg-yellow-100 text-yellow-700 animate-pulse' : 'bg-muted/30 text-primary'}`}>
                              {match.scoreA} - {match.scoreB}
                            </span>
                            <span className="text-[8px] font-black uppercase text-muted-foreground/60 mt-0.5">{match.status}</span>
                          </div>
                          <div className="flex flex-col items-start min-w-[80px]">
                            <span className="text-xs font-bold truncate max-w-[100px]">{match.teamB}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black text-muted-foreground uppercase">{match.time}</span>
                          {match.status === 'Completed' && (
                            <Badge className="bg-green-100 text-green-700 text-[8px] font-black uppercase px-2 h-5">Final</Badge>
                          )}
                          {match.status === 'Live' && (
                            <Badge className="bg-yellow-400 text-yellow-900 text-[8px] font-black uppercase px-2 h-5 animate-pulse">Live</Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 border-t border-muted/50 bg-muted/5">
                       {match.badmintonResults && match.badmintonResults.length > 0 ? (
                         <div className="divide-y divide-muted/20 text-[11px] font-medium">
                            {match.badmintonResults.map((res, idx) => (
                              <div key={idx} className="flex justify-between p-3 px-6 hover:bg-white/50 transition-colors">
                                <span className="text-muted-foreground uppercase font-black">{res.type}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-muted-foreground text-[10px]">{res.winner} wins</span>
                                  <span className="font-black tabular-nums text-primary">{res.score}</span>
                                </div>
                              </div>
                            ))}
                         </div>
                       ) : (
                         <div className="p-4 text-center text-[10px] font-black uppercase text-muted-foreground italic">
                            Lineup details will be visible once the match starts.
                         </div>
                       )}
                       {match.status === 'Completed' && (
                         <div className="flex justify-center border-t py-1.5 bg-muted/10">
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
