
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { EVENTS } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Match, RunResult, Standing, GROUPS, HOUSES } from '@/lib/types';
import Loading from '@/app/loading';
import { Trophy, Zap, CircleDot, Target, MapPin, Share2, Sparkles, Activity, Star, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MatchRecapButton } from '@/components/MatchRecapButton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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

  const [myHouse, setMyHouse] = useState<string>('');
  const [focusMode, setFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('followedHouse');
    if (saved) setMyHouse(saved);
  }, []);

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
    let filtered = [...(rawMatches || [])].sort((a, b) => (parseInt(a.matchNumber) || 0) - (parseInt(b.matchNumber) || 0));
    if (focusMode && myHouse) {
      filtered = filtered.filter(m => m.teamA === myHouse || m.teamB === myHouse);
    }
    return filtered;
  }, [rawMatches, focusMode, myHouse]);

  const runResults = useMemo(() => {
    let filtered = [...(rawRunResults || [])].sort((a, b) => a.position - b.position);
    if (searchQuery) {
      filtered = filtered.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  }, [rawRunResults, searchQuery]);

  const handleShareRunResult = (res: RunResult) => {
    const text = `🏃‍♂️ *PARADOX 2026 - KAMPUS RUN ACHIEVER* 🏅\n\n` +
      `🏅 *Name:* ${res.name.toUpperCase()}\n` +
      `🏆 *Rank:* #${res.position}\n` +
      `⏱️ *Time:* ${res.time}\n` +
      `👟 *Category:* ${res.category}\n\n` +
      `🔥 *Check the full board:* ${APP_URL}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    toast({ title: "Sharing result..." });
  };

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
      `🏟️ *Venue:* ${match.venue}\n\n` +
      `📲 *Check all scores here:* ${APP_URL}`;
      
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    toast({ title: "Sharing result..." });
  };

  if (matchesLoading || stdLoading || runLoading) return <Loading />;

  const IconComp = ICON_MAP[event.icon];

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-32 px-4 md:px-0">
      <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.02] dark:bg-white/[0.02] border border-border p-6 md:p-14 text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30">
              {IconComp && <IconComp className="h-6 w-6 md:h-8 md:w-8 text-primary" />}
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl md:text-7xl font-black italic text-foreground tracking-tighter uppercase leading-none break-words">{event.name}</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-[0.4em] font-bold max-w-2xl mx-auto">{event.description}</p>
          </div>
          
          {myHouse && sport !== 'kampus-run' && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Label htmlFor="focus-mode" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Focus on {myHouse}</Label>
              <Switch id="focus-mode" checked={focusMode} onCheckedChange={setFocusMode} />
            </div>
          )}
        </div>
      </div>

      {sport === 'kampus-run' ? (
        <section className="space-y-12">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Race Board</h2>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                <Input 
                  placeholder="Search Runner..." 
                  className="pl-9 bg-muted/30 border-border h-10 text-xs font-black uppercase"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Card className="premium-card overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead className="w-16 md:w-24 text-center px-2">Rank</TableHead><TableHead className="px-2">Participant</TableHead><TableHead className="text-right px-4 pr-8">Result</TableHead></TableRow></TableHeader>
                <TableBody>{runResults?.map((res) => (
                  <TableRow key={res.id} className="h-16 md:h-20 group">
                    <TableCell className="text-center text-xl md:text-3xl font-black italic text-primary px-2">#{res.position}</TableCell>
                    <TableCell className="px-2">
                      <p className="text-sm md:text-lg font-black uppercase italic text-foreground leading-tight break-words">{res.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">{res.category}</p>
                    </TableCell>
                    <TableCell className="text-right px-4 pr-8">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xl md:text-3xl font-black text-foreground tabular-nums">{res.time}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleShareRunResult(res)} className="h-6 text-[8px] font-black uppercase text-primary hover:bg-primary/5 gap-1 px-2"><Share2 className="h-2.5 w-2.5" /> Share</Button>
                      </div>
                    </TableCell>
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
                  <Card key={group} className="premium-card border-border">
                    <CardHeader className="p-4 border-b border-border text-center bg-muted/10"><CardTitle className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/80">Pool {group}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table><TableBody>{groupStandings.map((row) => (
                        <TableRow key={row.team} className={cn(
                          "h-14 border-none hover:bg-muted/5",
                          row.team === myHouse && "bg-primary/5"
                        )}>
                          <TableCell className={cn(
                            "text-xs font-black uppercase italic text-foreground pl-4 break-words leading-tight flex items-center gap-2",
                            row.team === myHouse && "text-primary"
                          )}>
                            {row.team}
                            {row.team === myHouse && <Star className="h-2.5 w-2.5 fill-primary" />}
                          </TableCell>
                          <TableCell className="text-right font-black text-lg pr-4">{row.points} <span className="text-[9px] text-muted-foreground ml-0.5">PTS</span></TableCell>
                        </TableRow>
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
              <TabsList className="flex w-full bg-muted/20 border border-border p-1 h-14 rounded-2xl max-w-md mx-auto gap-1">
                <TabsTrigger value="live" className="flex-1 text-[9px] font-black uppercase rounded-xl">Live</TabsTrigger>
                <TabsTrigger value="upcoming" className="flex-1 text-[9px] font-black uppercase rounded-xl">Schedule</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1 text-[9px] font-black uppercase rounded-xl">Archives</TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="space-y-6 mt-10">
                {sportMatches?.filter(m => m.status === 'Live').map(match => {
                  const isMyMatch = match.teamA === myHouse || match.teamB === myHouse;
                  return (
                    <Card key={match.id} className={cn(
                      "premium-card border-primary/20 bg-primary/[0.02]",
                      isMyMatch && "border-primary shadow-xl shadow-primary/10"
                    )}>
                      <CardContent className="p-0">
                        <div className="p-4 sm:p-6 md:p-14 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                          <p className={cn(
                            "flex-1 text-center md:text-right text-sm sm:text-base md:text-4xl font-black uppercase italic text-foreground leading-tight break-words",
                            match.teamA === myHouse && "text-primary"
                          )}>{match.teamA}</p>
                          <div className="flex flex-col items-center gap-2 sm:gap-4">
                            <div className="text-2xl sm:text-4xl md:text-7xl font-black bg-muted/30 px-4 py-2 sm:px-6 sm:py-4 rounded-2xl border border-border whitespace-nowrap">{match.scoreA} : {match.scoreB}</div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /><span className="text-[9px] font-black text-primary uppercase tracking-widest">Live Broadcast</span></div>
                          </div>
                          <p className={cn(
                            "flex-1 text-center md:text-left text-sm sm:text-base md:text-4xl font-black uppercase italic text-foreground leading-tight break-words",
                            match.teamB === myHouse && "text-primary"
                          )}>{match.teamB}</p>
                        </div>
                        
                        {match.keyEvents && match.keyEvents.length > 0 && (
                          <div className="border-t border-border bg-muted/10 p-4 sm:p-6 md:p-10">
                            <div className="flex items-center gap-2 mb-4">
                              <Activity className="h-4 w-4 text-primary" />
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Live Timeline</h3>
                            </div>
                            <div className="space-y-3">
                              {match.keyEvents.slice().reverse().map((ev, i) => (
                                <div key={i} className={cn(
                                  "flex items-start gap-3 p-4 rounded-xl bg-muted/20 border-l-2 border-primary text-[11px] font-bold leading-relaxed",
                                  i === 0 && "bg-primary/5 border-primary"
                                )}>
                                  {ev}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4 mt-10">
                {sportMatches?.filter(m => m.status === 'Upcoming').map(match => {
                  const isMyMatch = match.teamA === myHouse || match.teamB === myHouse;
                  return (
                    <Card key={match.id} className={cn(
                      "premium-card group border-border",
                      isMyMatch && "border-primary/40 bg-primary/[0.02]"
                    )}>
                      <CardContent className="p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-8 flex-1">
                          <div className="text-center md:pr-10 md:border-r border-border min-w-[100px]"><p className="text-[9px] font-black text-primary/60 uppercase mb-1">M#{match.matchNumber}</p><p className="text-xl md:text-2xl font-black text-foreground whitespace-nowrap">{match.time}</p><p className="text-[10px] font-bold text-muted-foreground uppercase">{match.day}</p></div>
                          <p className="text-lg md:text-3xl font-black uppercase italic text-foreground leading-tight text-center md:text-left break-words">
                            <span className={cn(match.teamA === myHouse && "text-primary")}>{match.teamA}</span> 
                            <span className="text-muted-foreground/30 mx-2">VS</span> 
                            <span className={cn(match.teamB === myHouse && "text-primary")}>{match.teamB}</span>
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-black border-border px-5 py-1 uppercase whitespace-nowrap">{match.phase.replace('-', ' ')}</Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="completed" className="space-y-6 mt-10">
                <div className="relative max-w-md mx-auto mb-8">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input 
                    placeholder="Search Teams or Events..." 
                    className="pl-9 bg-muted/20 border-border h-11 text-xs font-black uppercase rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {sportMatches?.filter(m => m.status === 'Completed').filter(m => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return m.teamA.toLowerCase().includes(query) || 
                         m.teamB.toLowerCase().includes(query) || 
                         m.phase.toLowerCase().includes(query) ||
                         m.matchNumber.includes(query);
                }).map(match => {
                  const isMyMatch = match.teamA === myHouse || match.teamB === myHouse;
                  return (
                    <Card key={match.id} className={cn(
                      "premium-card border-border",
                      isMyMatch && "border-primary/20 bg-primary/[0.01]"
                    )}>
                      <CardContent className="p-0">
                        <div className="p-4 sm:p-6 md:p-12 flex items-center justify-between gap-2 sm:gap-6 overflow-hidden">
                          <p className={cn(
                            "flex-1 text-right font-black text-[10px] sm:text-base md:text-3xl uppercase italic leading-tight break-words hyphens-auto", 
                            match.scoreA > match.scoreB ? 'text-foreground' : 'text-muted-foreground/50',
                            match.teamA === myHouse && "text-primary"
                          )}>{match.teamA}</p>
                          <div className="text-sm sm:text-xl md:text-5xl font-black bg-muted/30 px-2 py-1.5 sm:px-4 sm:py-3 rounded-xl border border-border whitespace-nowrap flex-shrink-0 mx-2">{match.scoreA} - {match.scoreB}</div>
                          <p className={cn(
                            "flex-1 text-left font-black text-[10px] sm:text-base md:text-3xl uppercase italic leading-tight break-words hyphens-auto", 
                            match.scoreB > match.scoreA ? 'text-foreground' : 'text-muted-foreground/50',
                            match.teamB === myHouse && "text-primary"
                          )}>{match.teamB}</p>
                        </div>

                        {match.badmintonResults && (
                          <div className="px-6 md:px-12 py-6 border-t border-border bg-muted/5">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {match.badmintonResults.map(res => (
                                  <div key={res.type} className="bg-muted/10 p-3 rounded-lg border border-border">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] font-black uppercase text-primary/60">{res.type}</span>
                                        <span className="text-[10px] font-black text-foreground">{res.score}</span>
                                    </div>
                                    <p className={cn(
                                      "text-[9px] font-black uppercase italic leading-tight break-words",
                                      res.winner === myHouse ? "text-primary" : "text-foreground"
                                    )}>{res.winner || 'TBD'}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row items-center justify-between px-6 sm:px-8 py-5 border-t border-border bg-muted/5 gap-4">
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">M#{match.matchNumber} • {match.phase.toUpperCase()}</span>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleShareMatch(match)} className="h-8 text-[10px] font-black text-primary hover:bg-primary/10 gap-2 px-3"><Share2 className="h-3.5 w-3.5" /> Share Result</Button>
                              <MatchRecapButton match={match} />
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase text-center md:text-right tracking-widest">{match.date} • {match.venue}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            </Tabs>
          </section>
        </>
      )}
    </div>
  );
}
