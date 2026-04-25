
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
import { Match, RunResult, Standing, GROUPS, HOUSES, Trial } from '@/lib/types';
import Loading from '@/app/loading';
import { Trophy, Zap, CircleDot, Target, MapPin, Share2, Activity, Star, Search, CalendarPlus, ClipboardList, Clock, Info, ChevronRight } from 'lucide-react';
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
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('followedHouse');
    if (saved) setMyHouse(saved);
    const now = new Date();
    setTodayStr(now.toISOString().split('T')[0]);
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

  const standingsQuery = useMemo(() => {
    if (!db || sport === 'kampus-run') return null;
    return query(collection(db, 'standings'), where('sport', '==', sport));
  }, [db, sport]);

  const runResultsQuery = useMemo(() => {
    if (!db || sport !== 'kampus-run') return null;
    return query(collection(db, 'runResults'));
  }, [db, sport]);

  const { data: rawMatches, loading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: trials, loading: trialsLoading } = useCollection<Trial>(trialsQuery);
  const { data: standings, loading: stdLoading } = useCollection<Standing>(standingsQuery);
  const { data: rawRunResults, loading: runLoading } = useCollection<RunResult>(runResultsQuery);

  const sportMatches = useMemo(() => {
    let filtered = [...(rawMatches || [])].sort((a, b) => (parseInt(a.matchNumber) || 0) - (parseInt(b.matchNumber) || 0));
    if (focusMode && myHouse) {
      filtered = filtered.filter(m => m.teamA === myHouse || m.teamB === myHouse);
    }
    return filtered;
  }, [rawMatches, focusMode, myHouse]);

  const getWinner = (match: Match) => {
    if (match.winner) return match.winner;
    if (match.scoreA > match.scoreB) return match.teamA;
    if (match.scoreB > match.scoreA) return match.teamB;
    return "Draw";
  };

  if (matchesLoading || stdLoading || runLoading || trialsLoading) return <Loading />;

  const IconComp = ICON_MAP[event.icon];

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-32">
      <div className="text-center space-y-4 px-4">
        <h1 className="text-4xl md:text-6xl font-black uppercase text-foreground">{event.name}</h1>
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-primary">{event.description}</p>
        {myHouse && sport !== 'kampus-run' && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <Label htmlFor="focus-mode" className="text-[10px] font-black uppercase text-muted-foreground">Focus on {myHouse}</Label>
            <Switch id="focus-mode" checked={focusMode} onCheckedChange={setFocusMode} />
          </div>
        )}
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="flex w-full bg-muted/20 border border-border p-1 h-12 rounded-xl max-w-xl mx-auto mb-10">
          <TabsTrigger value="live" className="flex-1 text-[9px] font-black uppercase">Live</TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1 text-[9px] font-black uppercase">Fixtures</TabsTrigger>
          <TabsTrigger value="trials" className="flex-1 text-[9px] font-black uppercase">Trials</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 text-[9px] font-black uppercase">Archives</TabsTrigger>
        </TabsList>

        <TabsContent value="completed" className="space-y-4 px-4">
          {sportMatches?.filter(m => m.status === 'Completed').map(match => {
            const winner = getWinner(match);
            return (
              <Card key={match.id} className="premium-card">
                <CardContent className="p-0">
                  <div className="p-6 md:p-10 flex items-center justify-between gap-6">
                    <p className={cn("flex-1 text-right text-base md:text-3xl font-black uppercase", winner === match.teamA ? 'text-foreground' : 'text-muted-foreground/40')}>{match.teamA}</p>
                    <div className="text-xl md:text-5xl font-black bg-muted/30 px-4 py-2 rounded-xl border border-border">{match.scoreA} - {match.scoreB}</div>
                    <p className={cn("flex-1 text-left text-base md:text-3xl font-black uppercase", winner === match.teamB ? 'text-foreground' : 'text-muted-foreground/40')}>{match.teamB}</p>
                  </div>
                  <div className="p-4 bg-muted/10 border-t border-border flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span>RESULT: {winner.toUpperCase()}</span>
                    <MatchRecapButton match={match} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="live" className="space-y-6 px-4">
          {sportMatches?.filter(m => m.status === 'Live').map(match => (
            <Card key={match.id} className="premium-card border-primary/40 bg-primary/[0.02]">
              <CardContent className="p-6 md:p-14 flex flex-col items-center gap-8">
                <div className="flex w-full items-center justify-between gap-4">
                  <p className="flex-1 text-right text-xl md:text-4xl font-black uppercase">{match.teamA}</p>
                  <div className="text-3xl md:text-7xl font-black px-6 py-4 rounded-2xl bg-muted/30 border border-border">{match.scoreA} : {match.scoreB}</div>
                  <p className="flex-1 text-left text-xl md:text-4xl font-black uppercase">{match.teamB}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">Live Broadcast</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        {/* Other Tabs content follows same pattern... */}
      </Tabs>
    </div>
  );
}
