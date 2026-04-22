import { notFound } from 'next/navigation';
import { EVENTS, MOCK_MATCHES, FOOTBALL_STANDINGS, RUN_RESULTS, AUCTION_DATA } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MatchRecapButton } from '@/components/MatchRecapButton';
import { ChevronRight, Filter } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default async function EventPage({ params }: { params: { sport: string } }) {
  const { sport } = await params;
  const event = EVENTS.find(e => e.slug === sport);
  
  if (!event) notFound();

  const sportMatches = MOCK_MATCHES.filter(m => m.sport === sport);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl">{event.name}</h1>
        <p className="text-muted-foreground">{event.description}</p>
      </div>

      {sport === 'kampus-run' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Race Results</CardTitle>
            <Badge variant="outline"><Filter className="w-3 h-3 mr-1"/> Filter</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Pos</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RUN_RESULTS.map((res) => (
                  <TableRow key={res.position} className={res.position <= 3 ? "bg-accent/10" : ""}>
                    <TableCell className="font-bold">
                      {res.position === 1 && "🥇"}
                      {res.position === 2 && "🥈"}
                      {res.position === 3 && "🥉"}
                      {res.position > 3 && res.position}
                    </TableCell>
                    <TableCell className="font-medium">{res.name}</TableCell>
                    <TableCell>{res.time}</TableCell>
                    <TableCell>{res.gender}</TableCell>
                    <TableCell>{res.ageGroup}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(sport === 'football' || sport === 'volleyball') && (
        <Tabs defaultValue="standings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standings" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">P</TableHead>
                      <TableHead className="text-center">W</TableHead>
                      <TableHead className="text-center">D</TableHead>
                      <TableHead className="text-center">L</TableHead>
                      <TableHead className="text-center font-bold">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {FOOTBALL_STANDINGS.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.team}</TableCell>
                        <TableCell className="text-center">{row.played}</TableCell>
                        <TableCell className="text-center">{row.won}</TableCell>
                        <TableCell className="text-center">{row.drawn}</TableCell>
                        <TableCell className="text-center">{row.lost}</TableCell>
                        <TableCell className="text-center font-bold">{row.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {sportMatches.filter(m => m.status === 'Completed').map(match => (
              <Card key={match.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b bg-muted/50 flex justify-between items-center text-xs font-semibold">
                    <span>{match.group ? `Group ${match.group}` : 'Match Result'}</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>
                  </div>
                  <div className="p-6 flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="font-bold text-lg">{match.teamA}</p>
                    </div>
                    <div className="flex flex-col items-center px-4">
                      <div className="text-3xl font-black bg-primary text-white px-4 py-1 rounded">
                        {match.scoreA} - {match.scoreB}
                      </div>
                    </div>
                    <div className="text-center flex-1">
                      <p className="font-bold text-lg">{match.teamB}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-accent/5 flex justify-center">
                    <MatchRecapButton match={match} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
             {sportMatches.filter(m => m.status === 'Upcoming' || m.status === 'Live').map(match => (
               <Card key={match.id} className={match.status === 'Live' ? "border-l-4 border-l-yellow-400" : ""}>
                 <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-bold">{match.time}</span>
                      <p className="font-bold text-lg">{match.teamA} vs {match.teamB}</p>
                    </div>
                    {match.status === 'Live' ? (
                       <Badge className="bg-yellow-400 text-yellow-900 animate-pulse">LIVE NOW</Badge>
                    ) : (
                      <Badge variant="outline">Scheduled</Badge>
                    )}
                 </CardContent>
               </Card>
             ))}
          </TabsContent>
        </Tabs>
      )}

      {sport === 'badminton' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tie Results (House vs House)</h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {[1, 2].map((i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border rounded-lg bg-white overflow-hidden">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <span className="font-bold">Gryffindor</span>
                      <span className="text-xl font-black">3 - 1</span>
                      <span className="font-bold">Slytherin</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Final</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                   <div className="divide-y text-sm">
                      <div className="flex justify-between p-3 px-6 hover:bg-muted/50">
                        <span>Men's Singles (MS)</span>
                        <span className="font-mono">21-18, 21-15</span>
                      </div>
                      <div className="flex justify-between p-3 px-6 hover:bg-muted/50">
                        <span>Women's Singles (WS)</span>
                        <span className="font-mono">15-21, 10-21</span>
                      </div>
                      <div className="flex justify-between p-3 px-6 hover:bg-muted/50">
                        <span>Men's Doubles (MD)</span>
                        <span className="font-mono">21-19, 21-19</span>
                      </div>
                   </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {sport === 'ipl-auction' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AUCTION_DATA.map((team, idx) => (
            <Card key={idx} className="overflow-hidden border-t-4 border-t-primary">
              <CardHeader className="bg-accent/5">
                <div className="flex justify-between items-center">
                  <CardTitle>{team.house}</CardTitle>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Remaining Purse</p>
                    <p className="text-lg font-black text-primary">₹ {team.remainingPurse} Cr</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                   <div>
                     <p className="text-xs font-bold text-muted-foreground uppercase mb-2">House Squad</p>
                     <div className="flex flex-wrap gap-2">
                        {team.squad.map((player, pIdx) => (
                          <Badge key={pIdx} variant="secondary">{player}</Badge>
                        ))}
                     </div>
                   </div>
                   <div className="pt-4 border-t flex justify-between items-center">
                      <span className="text-sm font-bold">Total Team Points</span>
                      <span className="text-xl font-black text-primary">{team.totalPoints}</span>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
