
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { EVENTS } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Match, RunResult, Trial } from '@/lib/types';
import EventLoading from './loading';
import { Trophy, Zap, CircleDot, Target, MapPin, Activity, Search, Filter, Timer, Medal } from 'lucide-react';
import { MatchRecapButton } from '@/components/MatchRecapButton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

  const trialsQuery = useMemo(() => {
    if (!db || sport === 'kampus-run') return null;
    return query(collection(db, 'trials'), where('sport', '==', sport));
  }, [db, sport]);

  const runResultsQuery = useMemo(() => {
    if (!db || sport !== 'kampus-run') return null;
    return query(collection(db, 'runResults'), orderBy('position', 'asc'));
  }, [db, sport]);

  const { data: rawMatches, loading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: trials, loading: trialsLoading } = useCollection<Trial>(trialsQuery);
  const { data: runResults, loading: runLoading } = useCollection<RunResult>(runResultsQuery);

  const filteredMatches = useMemo(() => {
    let filtered = [...(rawMatches || [])].sort((a, b) => (parseInt(a.matchNumber) || 0) - (parseInt(b.matchNumber) || 0));
    if (focusMode && myHouse) filtered = filtered.filter(m => m.teamA === myHouse || m.teamB === myHouse);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m => m.teamA.toLowerCase().includes(q) || m.teamB.toLowerCase().includes(q) || m.matchNumber.toLowerCase().includes(q));
    }
    return filtered;
  }, [rawMatches, focusMode, myHouse, searchQuery]);

  if (matchesLoading || trialsLoading || runLoading) return <EventLoading />;

  const IconComp = ICON_MAP[event.icon];
  const isKampusRun = sport === 'kampus-run';

  const renderRunCategory = (title: string, category: string, gender: string, ageGroup: string = 'All') => {
    const results = runResults?.filter(r => r.category === category && r.gender === gender && r.ageGroup === ageGroup) || [];
    
    return (
      <div key={title} className="space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-2">
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-primary border-primary/20">{title}</Badge>
        </div>
        <Card className="premium-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length > 0 ? (
                results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.position <= 3 ? (
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10">
                          <Medal className={cn("h-3.5 w-3.5", r.position === 1 ? "text-yellow-500" : r.position === 2 ? "text-slate-400" : "text-amber-700")} />
                        </div>
                      ) : (
                        <span className="text-[11px] font-black text-muted-foreground/40 ml-2">#{r.position}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-black uppercase tracking-tight">{r.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-primary">{r.time}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 opacity-30 text-[9px] font-black uppercase">Awaiting Official Results</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  const renderMatchCard = (match: Match) => {
    const isMyMatch = match.teamA === myHouse || match.teamB === myHouse;
    return (
      <Card key={match.id} className={cn("premium-card", isMyMatch && "border-primary/40 bg-primary/[0.02]")}>
        <CardContent className="p-0">
          <div className="p-4 bg-muted/5 flex justify-between items-center border-b border-border">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Match #{match.matchNumber}</span>
            <Badge variant="outline" className="h-4 text-[8px] px-1.5 uppercase font-black border-border">{match.phase}</Badge>
          </div>
          <div className="p-6 md:p-8 flex items-center justify-between gap-4">
            <div className={cn("flex-1 text-right text-base md:text-2xl font-black uppercase", match.teamA === myHouse && "text-primary")}>{match.teamA}</div>
            <div className="px-4 py-2 bg-muted/20 border border-border rounded-xl flex flex-col items-center min-w-[80px]">
              <span className="text-xl md:text-3xl font-black tracking-tighter">{match.scoreA} - {match.scoreB}</span>
              {match.status === 'Live' && <span className="text-[7px] font-black uppercase text-primary animate-pulse">Live</span>}
            </div>
            <div className={cn("flex-1 text-left text-base md:text-2xl font-black uppercase", match.teamB === myHouse && "text-primary")}>{match.teamB}</div>
          </div>
          <div className="p-4 bg-muted/10 border-t border-border flex justify-between items-center">
            <span className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1"><MapPin className="h-3 w-3" /> {match.venue}</span>
            {match.status === 'Completed' && <MatchRecapButton match={match} />}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-32">
      <div className="text-center space-y-4 px-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/20 rounded-full border border-border">
          {IconComp && <IconComp className="h-3.5 w-3.5 text-primary" />}
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Official Tournament</p>
        </div>
        <h1 className="text-4xl md:text-7xl font-black uppercase text-foreground leading-none">{event.name}</h1>
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground max-w-lg mx-auto">{event.description}</p>
      </div>

      {!isKampusRun && (
        <div className="px-4">
          <div className="flex flex-col md:flex-row items-center gap-4 bg-card border border-border p-3 rounded-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search house..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-11 bg-muted/10 border-none text-xs font-black uppercase" />
            </div>
            <div className="flex items-center gap-2 shrink-0 bg-muted/20 px-4 py-2 rounded-xl border border-border/50">
              <Switch checked={focusMode} onCheckedChange={setFocusMode} disabled={!myHouse} />
              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Focus on {myHouse || 'Your House'}</Label>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue={isKampusRun ? "results" : "live"} className="w-full">
        <TabsList className="flex w-full bg-muted/20 border border-border p-1 h-12 rounded-xl max-w-xl mx-auto mb-8">
          {isKampusRun ? (
            <>
              <TabsTrigger value="results" className="flex-1 text-[9px] font-black uppercase">Race Leaderboard</TabsTrigger>
              <TabsTrigger value="schedule" className="flex-1 text-[9px] font-black uppercase">Race Details</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="live" className="flex-1 text-[9px] font-black uppercase">Live Updates</TabsTrigger>
              <TabsTrigger value="upcoming" className="flex-1 text-[9px] font-black uppercase">Fixtures</TabsTrigger>
              <TabsTrigger value="trials" className="flex-1 text-[9px] font-black uppercase">House Trials</TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 text-[9px] font-black uppercase">Archives</TabsTrigger>
            </>
          )}
        </TabsList>

        {isKampusRun ? (
          <>
            <TabsContent value="results" className="space-y-10 px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {renderRunCategory("3KM Male", "3km", "M")}
                {renderRunCategory("3KM Female", "3km", "F")}
                {renderRunCategory("5KM Male (18-25)", "5km", "M", "18-25")}
                {renderRunCategory("5KM Male (26+)", "5km", "M", "26+")}
                {renderRunCategory("5KM Female (18-25)", "5km", "F", "18-25")}
                {renderRunCategory("5KM Female (26+)", "5km", "F", "26+")}
              </div>
            </TabsContent>
            <TabsContent value="schedule" className="px-4">
               <Card className="premium-card p-10 text-center space-y-4">
                  <Timer className="h-10 w-10 text-primary mx-auto" />
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">Reporting Time: 05:00 AM</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Flag Off: 05:30 AM • SAC Grounds</p>
               </Card>
            </TabsContent>
          </>
        ) : (
          <>
            <TabsContent value="live" className="space-y-4 px-4">
              {filteredMatches.filter(m => m.status === 'Live').length > 0 ? filteredMatches.filter(m => m.status === 'Live').map(renderMatchCard) : <div className="py-20 text-center opacity-40 uppercase font-black text-[10px] tracking-widest">No Live Action</div>}
            </TabsContent>
            <TabsContent value="upcoming" className="space-y-4 px-4">{filteredMatches.filter(m => m.status === 'Upcoming').map(renderMatchCard)}</TabsContent>
            <TabsContent value="completed" className="space-y-4 px-4">{filteredMatches.filter(m => m.status === 'Completed').reverse().map(renderMatchCard)}</TabsContent>
            <TabsContent value="trials" className="space-y-4 px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trials?.filter(t => !focusMode || t.house === myHouse).map((trial) => (
                  <Card key={trial.id} className={cn("premium-card", trial.house === myHouse && "border-primary/40 bg-primary/[0.02]")}>
                    <CardContent className="p-6 space-y-4">
                      <Badge variant="outline" className="text-[9px] font-black uppercase text-primary border-primary/20">{trial.house}</Badge>
                      <h3 className="text-xl font-black uppercase italic tracking-tighter">Selection Trials</h3>
                      <div className="space-y-1 border-t border-border pt-4">
                        <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2"><MapPin className="h-3 w-3" /> {trial.venue}</p>
                        <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2"><Timer className="h-3 w-3" /> {trial.time} • {trial.date}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
