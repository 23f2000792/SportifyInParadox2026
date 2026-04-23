'use client';

import { useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { EVENTS } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Match, RunResult, Standing, GROUPS } from '@/lib/types';
import Loading from '@/app/loading';
import { Trophy, Zap, CircleDot, Target, MapPin, Share2, Sparkles, Activity } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MatchRecapButton } from '@/components/MatchRecapButton';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

const APP_URL = "https://sportify-in-paradox2026.vercel.app/";

export default function EventPage() {
  const params = useParams();
  const sport = params.sport as string;
  const db = useFirestore();
  const { toast } = useToast();

  const event = EVENTS.find(e => e.slug === sport);
  if (!event) notFound();

  const matchesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'matches'), where('sport', '==', sport));
  }, [db, sport]);

  const standingsQuery = useMemo(() => {
    if (!db || sport === 'kampus-run') return null;
    return query(collection(db, 'standings'), where('sport', '==', sport));
  }, [db, sport]);

  const runResultsQuery = useMemo(() => {
    if (!db || sport !== 'kampus-run') return null;
    return query(collection(db, 'runResults'));
  }, [db, sport]);

  const { data: rawMatches, loading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: standings, loading: stdLoading } = useCollection<Standing>(standingsQuery);
  const { data: rawRunResults, loading: runLoading } = useCollection<RunResult>(runResultsQuery);

  const sportMatches = useMemo(() => {
    return [...(rawMatches || [])].sort((a, b) => (parseInt(a.matchNumber) || 0) - (parseInt(b.matchNumber) || 0));
  }, [rawMatches]);

  const runResults = useMemo(() => {
    return [...(rawRunResults || [])].sort((a, b) => a.position - b.position);
  }, [rawRunResults]);

  const handleShareMatch = (match: Match) => {
    const winnerText = match.scoreA > match.scoreB 
      ? `🏆 *${match.teamA}* wins!` 
      : match.scoreB > match.scoreA 
      ? `🏆 *${match.teamB}* wins!` 
      : `🤝 Draw!`;

    const highlightsText = match.keyEvents?.length 
      ? `🔥 *HIGHLIGHTS:*\n` + match.keyEvents.map(ev => `• ${ev}`).join('\n') + `\n\n`
      : "";

    const text = `🏅 *PARADOX 2026 - MATCH CENTER* 🏅\n\n` +
      `🏅 *Sport:* ${match.sport.replace('-', ' ').toUpperCase()}\n` +
      `⚔️ *BATTLE:* ${match.teamA} (${match.scoreA}) vs ${match.teamB} (${match.scoreB})\n\n` +
      `${winnerText}\n\n` +
      `${highlightsText}` +
      `🏟️ *Venue:* ${match.venue}\n` +
      `📲 *Check all scores here:* ${APP_URL}`;
      
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    toast({ title: "Sharing result..." });
  };

  if (matchesLoading || stdLoading || runLoading) return <Loading />;

  const IconComp = ICON_MAP[event.icon];

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-32 px-4 md:px-0">
      <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.02] border border-white/[0.05] p-6 md:p-20 text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30">
              {IconComp && <IconComp className="h-6 w-6 md:h-8 md:w-8 text-primary" />}
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl md:text-8xl font-black italic text-white tracking-tighter uppercase leading-none break-words">{event.name}</h1>
            <p className="text-[10px] md:text-sm text-muted-foreground/60 uppercase tracking-[0.4em] font-bold max-w-2xl mx-auto opacity-70">{event.description}</p>
          </div>
        </div>
      </div>

      {sport === 'kampus-run' ? (
        <section className="space-y-12">
          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary text-center">Race Board</h2>
            <Card className="premium-card overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead className="w-16 md:w-24 text-center px-2">Rank</TableHead><TableHead className="px-2">Participant</TableHead><TableHead className="text-right px-4 pr-8">Time</TableHead></TableRow></TableHeader>
                <TableBody>{runResults?.map((res) => (
                  <TableRow key={res.id} className="h-16 md:h-20 group">
                    <TableCell className="text-center text-xl md:text-3xl font-black italic text-primary px-2">#{res.position}</TableCell>
                    <TableCell className="px-2">
                      <p className="text-sm md:text-xl font-black uppercase italic text-white leading-tight break-words">{res.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground/60 tracking-widest uppercase">{res.category}</p>
                    </TableCell>
                    <TableCell className="text-right px-4 pr-8 text-xl md:text-3xl font-black text-white tabular-nums">{res.time}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </Card>
          </div>
        </section>
      ) : (
        <>
          <section className="space-y-6">
             <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary text-center">House Table</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {GROUPS.map(group => {
                const groupStandings = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
                if (!groupStandings?.length) return null;
                return (
                  <Card key={group} className="premium-card border-none bg-white/[0.01]">
                    <CardHeader className="p-4 border-b border-white/[0.05] text-center bg-white/[0.02]"><CardTitle className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/80">Pool {group}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table><TableBody>{groupStandings.map((row) => (
                        <TableRow key={row.team} className="h-14 border-none hover:bg-white/[0.03]"><TableCell className="text-sm font-black uppercase italic text-white pl-4 break-words">{row.team}</TableCell><TableCell className="text-right font-black text-xl pr-4">{row.points} <span className="text-[9px] text-muted-foreground/60 ml-0.5">PTS</span></TableCell></TableRow>
                      ))}</TableBody></Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary text-center">Match Center</h2>
            <Tabs defaultValue="live" className="w-full">
              <TabsList className="flex w-full bg-white/[0.03] border border-white/[0.08] p-1 h-14 rounded-2xl max-w-md mx-auto gap-1">
                <TabsTrigger value="live" className="flex-1 text-[9px] font-black uppercase rounded-xl">Live</TabsTrigger>
                <TabsTrigger value="upcoming" className="flex-1 text-[9px] font-black uppercase rounded-xl">Schedule</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1 text-[9px] font-black uppercase rounded-xl">Archives</TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="space-y-6 mt-10">
                {sportMatches?.filter(m => m.status === 'Live').map(match => (
                  <Card key={match.id} className="premium-card border-primary/20 bg-primary/[0.02]">
                    <CardContent className="p-0">
                      <div className="p-6 md:p-16 flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="flex-1 text-center md:text-right text-xl md:text-5xl font-black uppercase italic text-white leading-tight break-words">{match.teamA}</p>
                        <div className="flex flex-col items-center gap-4">
                          <div className="text-4xl md:text-8xl font-black bg-black/50 px-6 py-4 rounded-2xl border border-white/[0.08] whitespace-nowrap">{match.scoreA} : {match.scoreB}</div>
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /><span className="text-[9px] font-black text-primary uppercase tracking-widest">Live Now</span></div>
                        </div>
                        <p className="flex-1 text-center md:text-left text-xl md:text-5xl font-black uppercase italic text-white leading-tight break-words">{match.teamB}</p>
                      </div>
                      
                      {match.keyEvents && match.keyEvents.length > 0 && (
                        <div className="border-t border-white/[0.05] bg-black/20 p-6 md:p-8">
                          <div className="flex items-center gap-2 mb-4">
                            <Activity className="h-4 w-4 text-primary" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Live Timeline</h3>
                          </div>
                          <div className="space-y-3">
                            {match.keyEvents.slice().reverse().map((ev, i) => (
                              <div key={i} className={cn(
                                "flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border-l-2 border-primary text-[11px] font-medium leading-relaxed",
                                i === 0 && "bg-primary/[0.05] border-primary"
                              )}>
                                {ev}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4 mt-10">
                {sportMatches?.filter(m => m.status === 'Upcoming').map(match => (
                  <Card key={match.id} className="premium-card group bg-white/[0.01]">
                    <CardContent className="p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex flex-col md:flex-row items-center gap-8 flex-1">
                        <div className="text-center md:pr-10 md:border-r border-white/5 min-w-[100px]"><p className="text-[9px] font-black text-primary/60 uppercase mb-1">M#{match.matchNumber}</p><p className="text-2xl font-black text-white whitespace-nowrap">{match.time}</p><p className="text-[10px] font-bold text-muted-foreground/60 uppercase">{match.day}</p></div>
                        <p className="text-lg md:text-3xl font-black uppercase italic text-white leading-tight text-center md:text-left break-words">
                          {match.teamA} <span className="text-white/20 mx-2">VS</span> {match.teamB}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-black border-white/10 px-5 py-1 uppercase whitespace-nowrap">{match.phase.replace('-', ' ')}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-6 mt-10">
                {sportMatches?.filter(m => m.status === 'Completed').map(match => (
                  <Card key={match.id} className="premium-card border-none bg-white/[0.01]">
                    <CardContent className="p-0">
                      <div className="p-6 md:p-12 flex items-center justify-between gap-6">
                        <p className={cn("flex-1 text-right font-black text-lg md:text-4xl uppercase italic leading-tight break-words", match.scoreA > match.scoreB ? 'text-white' : 'text-muted-foreground/40')}>{match.teamA}</p>
                        <div className="text-xl md:text-5xl font-black bg-black/50 px-4 py-3 rounded-xl border border-white/[0.08] whitespace-nowrap">{match.scoreA} - {match.scoreB}</div>
                        <p className={cn("flex-1 text-left font-black text-lg md:text-4xl uppercase italic leading-tight break-words", match.scoreB > match.scoreA ? 'text-white' : 'text-muted-foreground/40')}>{match.teamB}</p>
                      </div>

                      {match.badmintonResults && (
                        <div className="px-6 md:px-12 py-6 border-t border-white/5 bg-black/10">
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {match.badmintonResults.map(res => (
                                <div key={res.type} className="bg-white/5 p-3 rounded-lg border border-white/5">
                                   <div className="flex justify-between items-center mb-1">
                                      <span className="text-[9px] font-black uppercase text-primary/60">{res.type}</span>
                                      <span className="text-[10px] font-black text-white">{res.score}</span>
                                   </div>
                                   <p className="text-[10px] font-black uppercase italic text-white/90">{res.winner || 'TBD'}</p>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      <div className="flex flex-col md:flex-row items-center justify-between px-8 py-4 border-t border-white/[0.05] bg-white/[0.01] gap-4">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                          <span className="text-[9px] font-black uppercase text-muted-foreground/60">M#{match.matchNumber} • {match.phase.toUpperCase()}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleShareMatch(match)} className="h-8 text-[9px] font-black text-primary hover:bg-primary/10 gap-2 px-3"><Share2 className="h-3.5 w-3.5" /> Share</Button>
                          <MatchRecapButton match={match} />
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase text-center md:text-right">{match.date} • {match.venue}</span>
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