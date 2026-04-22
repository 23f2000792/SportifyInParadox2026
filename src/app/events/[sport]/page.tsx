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
    <div className="space-y-4">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-2xl font-black">{event.name}</h1>
        <p className="text-sm text-muted-foreground">{event.description}</p>
      </div>

      {sport === 'kampus-run' && (
        <Card className="border-none shadow-sm overflow-hidden">
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
                    <TableCell className="font-bold py-2">{res.name}</TableCell>
                    <TableCell className="font-medium text-primary">{res.time}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center text-xs text-muted-foreground">{res.ageGroup}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(sport === 'football' || sport === 'volleyball') && (
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-9">
            <TabsTrigger value="results" className="text-[10px] font-black uppercase">Results</TabsTrigger>
            <TabsTrigger value="schedule" className="text-[10px] font-black uppercase">Schedule</TabsTrigger>
            <TabsTrigger value="standings" className="text-[10px] font-black uppercase">Table</TabsTrigger>
          </TabsList>
          
          <TabsContent value="results" className="space-y-2 mt-3">
            {sportMatches.filter(m => m.status === 'Completed').map(match => (
              <Card key={match.id} className="border-none shadow-sm hover:shadow-md fast-transition overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-3 grid grid-cols-7 items-center">
                    <div className="col-span-2 text-right">
                      <p className="font-bold text-sm truncate">{match.teamA}</p>
                    </div>
                    <div className="col-span-3 flex flex-col items-center">
                      <div className="bg-primary/5 px-3 py-1 rounded text-lg font-black text-primary">
                        {match.scoreA} - {match.scoreB}
                      </div>
                      <span className="text-[9px] font-black uppercase text-muted-foreground/60 mt-1">Final Score</span>
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
            ))}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-2 mt-3">
             {sportMatches.filter(m => m.status === 'Upcoming' || m.status === 'Live').map(match => (
               <Card key={match.id} className={`border-none shadow-sm ${match.status === 'Live' ? 'ring-1 ring-yellow-400' : ''}`}>
                 <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase">{match.time}</span>
                      <p className="font-bold text-sm">{match.teamA} vs {match.teamB}</p>
                    </div>
                    {match.status === 'Live' ? (
                       <Badge className="bg-yellow-400 text-yellow-900 text-[9px] font-black animate-pulse">LIVE NOW</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-black border-muted-foreground/20 text-muted-foreground">SCHEDULED</Badge>
                    )}
                 </CardContent>
               </Card>
             ))}
          </TabsContent>

          <TabsContent value="standings" className="mt-3">
            <Card className="border-none shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="h-8">
                      <TableHead className="text-[10px] font-black uppercase">Team</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase w-8">P</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase w-8">W</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase w-8">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {FOOTBALL_STANDINGS.map((row, i) => (
                      <TableRow key={i} className="h-10">
                        <TableCell className="font-bold text-sm">{row.team}</TableCell>
                        <TableCell className="text-center text-xs">{row.played}</TableCell>
                        <TableCell className="text-center text-xs">{row.won}</TableCell>
                        <TableCell className="text-center font-black text-primary">{row.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {sport === 'badminton' && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Match Ties</h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {[1, 2].map((i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-white rounded-lg shadow-sm overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex justify-between w-full pr-4 items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">House {i}</span>
                      <span className="text-lg font-black text-primary">3 - 1</span>
                      <span className="text-sm font-bold">House {i+1}</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700 text-[9px] font-black">FINAL</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0 border-t border-muted/50">
                   <div className="divide-y divide-muted/30 text-xs">
                      <div className="flex justify-between p-2 px-6">
                        <span className="text-muted-foreground">Men's Singles</span>
                        <span className="font-mono font-bold">21-18, 21-15</span>
                      </div>
                      <div className="flex justify-between p-2 px-6">
                        <span className="text-muted-foreground">Women's Singles</span>
                        <span className="font-mono font-bold">15-21, 10-21</span>
                      </div>
                   </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {sport === 'ipl-auction' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AUCTION_DATA.map((team, idx) => (
            <Card key={idx} className="border-none shadow-sm hover:ring-1 hover:ring-primary/20 fast-transition">
              <CardHeader className="p-4 bg-muted/20">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-black">{team.house}</CardTitle>
                  <div className="text-right">
                    <p className="text-[9px] text-muted-foreground uppercase font-black">Purse Left</p>
                    <p className="text-sm font-black text-primary">₹{team.remainingPurse}Cr</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                 <div>
                   <p className="text-[9px] font-black text-muted-foreground uppercase mb-2">Key Players</p>
                   <div className="flex flex-wrap gap-1">
                      {team.squad.map((player, pIdx) => (
                        <Badge key={pIdx} variant="secondary" className="bg-muted text-[10px] py-0 px-2">{player}</Badge>
                      ))}
                   </div>
                 </div>
                 <div className="pt-2 border-t flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Team Pts</span>
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
