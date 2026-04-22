import { notFound } from 'next/navigation';
import { EVENTS, MOCK_MATCHES, FOOTBALL_STANDINGS, RUN_RESULTS, AUCTION_DATA } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MatchRecapButton } from '@/components/MatchRecapButton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default async function EventPage({ params }: { params: { sport: string } }) {
  const { sport } = await params;
  const event = EVENTS.find(e => e.slug === sport);
  
  if (!event) notFound();

  const sportMatches = MOCK_MATCHES.filter(m => m.sport === sport);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-2xl font-black">{event.name}</h1>
        <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold text-[10px]">{event.description}</p>
      </div>

      {/* FOOTBALL SPECIFIC LAYOUT */}
      {sport === 'football' && (
        <div className="space-y-8">
          {/* 1. Points Table Section */}
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

          {/* 2. Matches Section with Tabs */}
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
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12 text-center text-[10px] font-black uppercase">Pos</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Participant</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Time</TableHead>
                  <TableHead className="hidden sm:table-cell text-[10px] font-black uppercase text-center">Cat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RUN_RESULTS.map((res) => (
                  <TableRow key={res.position} className="h-10">
                    <TableCell className="text-center font-black">
                      {res.position === 1 ? "🥇" : res.position === 2 ? "🥈" : res.position === 3 ? "🥉" : res.position}
                    </TableCell>
                    <TableCell className="font-bold py-2 text-sm">{res.name}</TableCell>
                    <TableCell className="font-black text-primary text-sm">{res.time}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center text-[10px] font-black text-muted-foreground uppercase">{res.ageGroup}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* VOLLEYBALL LAYOUT (Minimalist Version) */}
      {sport === 'volleyball' && (
        <div className="space-y-4">
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 h-10">
              <TabsTrigger value="results" className="text-[10px] font-black uppercase">Match Results</TabsTrigger>
              <TabsTrigger value="upcoming" className="text-[10px] font-black uppercase">Upcoming</TabsTrigger>
            </TabsList>
            <TabsContent value="results" className="mt-4 space-y-2">
              {sportMatches.filter(m => m.status === 'Completed').map(match => (
                <Card key={match.id} className="border-none shadow-sm overflow-hidden bg-white">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 text-right">
                      <p className="font-bold text-sm">{match.teamA}</p>
                    </div>
                    <div className="px-6 flex flex-col items-center">
                       <span className="text-xl font-black tabular-nums">{match.scoreA} - {match.scoreB}</span>
                       <span className="text-[8px] font-black text-muted-foreground uppercase">Sets</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-sm">{match.teamB}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="upcoming" className="mt-4 space-y-2">
              {sportMatches.filter(m => m.status === 'Upcoming' || m.status === 'Live').map(match => (
                <Card key={match.id} className={`border-none shadow-sm ${match.status === 'Live' ? 'ring-1 ring-yellow-400' : ''}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-primary uppercase">{match.time}</span>
                      <p className="font-bold text-sm">{match.teamA} v {match.teamB}</p>
                    </div>
                    {match.status === 'Live' ? (
                      <Badge className="bg-yellow-400 text-yellow-900 text-[9px] font-black animate-pulse">LIVE NOW</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[8px] font-black uppercase">Upcoming</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* BADMINTON LAYOUT */}
      {sport === 'badminton' && (
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Tournament Ties</h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {[1, 2].map((i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-white rounded-lg shadow-sm overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline [&>svg]:h-4 [&>svg]:w-4">
                  <div className="flex justify-between w-full pr-4 items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold">House {i}</span>
                      <span className="text-lg font-black text-primary">3 - 1</span>
                      <span className="text-xs font-bold">House {i+1}</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700 text-[9px] font-black uppercase px-2">Final</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0 border-t border-muted/50 bg-muted/5">
                   <div className="divide-y divide-muted/20 text-[11px] font-medium">
                      <div className="flex justify-between p-3 px-6">
                        <span className="text-muted-foreground uppercase">Men's Singles</span>
                        <span className="font-black tabular-nums">21-18, 21-15</span>
                      </div>
                      <div className="flex justify-between p-3 px-6">
                        <span className="text-muted-foreground uppercase">Women's Singles</span>
                        <span className="font-black tabular-nums">15-21, 10-21</span>
                      </div>
                      <div className="flex justify-between p-3 px-6">
                        <span className="text-muted-foreground uppercase">Men's Doubles</span>
                        <span className="font-black tabular-nums">21-14, 21-19</span>
                      </div>
                   </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* IPL AUCTION LAYOUT */}
      {sport === 'ipl-auction' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AUCTION_DATA.map((team, idx) => (
            <Card key={idx} className="border-none shadow-sm bg-white">
              <CardHeader className="p-4 bg-muted/10">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-black uppercase tracking-tight">{team.house}</CardTitle>
                  <div className="text-right">
                    <p className="text-[8px] text-muted-foreground uppercase font-black">Purse Left</p>
                    <p className="text-sm font-black text-primary">₹{team.remainingPurse}Cr</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                 <div>
                   <p className="text-[9px] font-black text-muted-foreground uppercase mb-2">Squad List</p>
                   <div className="flex flex-wrap gap-1.5">
                      {team.squad.map((player, pIdx) => (
                        <Badge key={pIdx} variant="secondary" className="bg-muted text-[10px] font-bold py-0.5 px-2">{player}</Badge>
                      ))}
                   </div>
                 </div>
                 <div className="pt-3 border-t flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Team Total Pts</span>
                    <span className="text-lg font-black text-primary">{team.totalPoints}</span>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}