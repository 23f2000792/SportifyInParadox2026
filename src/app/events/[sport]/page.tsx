
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { EVENTS } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Match, RunResult, Standing, Trial } from '@/lib/types';
import EventLoading from './loading';
import { Trophy, Zap, CircleDot, Target, MapPin, Activity, Search, Filter } from 'lucide-react';
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

  const { data: rawMatches, loading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: trials, loading: trialsLoading } = useCollection<Trial>(trialsQuery);

  const filteredMatches = useMemo(() => {
    let filtered = [...(rawMatches || [])].sort((a, b) => (parseInt(a.matchNumber) || 0) - (parseInt(b.matchNumber) || 0));
    
    // Apply House Focus
    if (focusMode && myHouse) {
      filtered = filtered.filter(m => m.teamA === myHouse || m.teamB === myHouse);
    }

    // Apply Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.teamA.toLowerCase().includes(q) || 
        m.teamB.toLowerCase().includes(q) || 
        m.matchNumber.toLowerCase().includes(q) ||
        m.venue.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [rawMatches, focusMode, myHouse, searchQuery]);

  if (matchesLoading || trialsLoading) return <EventLoading />;

  const IconComp = ICON_MAP[event.icon];

  const renderMatchCard = (match: Match) => {
    const isMyMatch = match.teamA === myHouse || match.teamB === myHouse;
    const winner = match.winner || (match.scoreA > match.scoreB ? match.teamA : match.scoreB > match.scoreA ? match.teamB : "Draw");
    
    return (
      <Card key={match.id} className={cn(
        "premium-card transition-all duration-300",
        isMyMatch && "border-primary/40 bg-primary/[0.02]"
      )}>
        <CardContent className="p-0">
          <div className="p-4 bg-muted/5 flex justify-between items-center border-b border-border">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Match #{match.matchNumber}</span>
            <div className="flex items-center gap-2">
               {isMyMatch && <Badge variant="default" className="h-4 text-[8px] px-1.5 uppercase font-black bg-primary">Your House</Badge>}
               <Badge variant="outline" className="h-4 text-[8px] px-1.5 uppercase font-black border-border">{match.phase}</Badge>
            </div>
          </div>
          
          <div className="p-6 md:p-8 flex items-center justify-between gap-4">
            <div className={cn(
              "flex-1 text-right text-base md:text-2xl font-black uppercase transition-colors",
              match.status === 'Completed' && winner !== match.teamA && "text-muted-foreground/30",
              match.teamA === myHouse && "text-primary"
            )}>
              {match.teamA}
            </div>
            
            <div className="px-4 py-2 bg-muted/20 border border-border rounded-xl flex flex-col items-center min-w-[80px]">
              <span className="text-xl md:text-3xl font-black tracking-tighter">
                {match.scoreA} - {match.scoreB}
              </span>
              {match.status === 'Live' && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  <span className="text-[7px] font-black uppercase text-primary">Live</span>
                </div>
              )}
            </div>

            <div className={cn(
              "flex-1 text-left text-base md:text-2xl font-black uppercase transition-colors",
              match.status === 'Completed' && winner !== match.teamB && "text-muted-foreground/30",
              match.teamB === myHouse && "text-primary"
            )}>
              {match.teamB}
            </div>
          </div>

          <div className="p-4 bg-muted/10 border-t border-border flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {match.venue}
              </span>
              <span className="text-[9px] font-black text-muted-foreground uppercase">{match.time}</span>
            </div>
            <div className="flex items-center gap-2">
              {match.status === 'Completed' && <MatchRecapButton match={match} />}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-32">
      {/* Editorial Header */}
      <div className="text-center space-y-4 px-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/20 rounded-full border border-border">
          {IconComp && <IconComp className="h-3.5 w-3.5 text-primary" />}
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Official Tournament</p>
        </div>
        <h1 className="text-4xl md:text-7xl font-black uppercase text-foreground leading-none">{event.name}</h1>
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground max-w-lg mx-auto">{event.description}</p>
      </div>

      {/* Global Filter & Search Bar */}
      <div className="px-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4 bg-card border border-border p-3 rounded-2xl shadow-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search house or match #..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-muted/10 border-none text-xs font-black uppercase placeholder:opacity-40"
            />
          </div>
          <div className="flex items-center gap-6 shrink-0 bg-muted/20 px-4 py-2 rounded-xl border border-border/50">
            <div className="flex items-center gap-2">
              <Switch id="focus-mode" checked={focusMode} onCheckedChange={setFocusMode} disabled={!myHouse} />
              <Label htmlFor="focus-mode" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer">
                Focus on {myHouse || 'Your House'}
              </Label>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-primary">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">{filteredMatches.length} Found</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="flex w-full bg-muted/20 border border-border p-1 h-12 rounded-xl max-w-xl mx-auto mb-8">
          <TabsTrigger value="live" className="flex-1 text-[9px] font-black uppercase">Live Updates</TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1 text-[9px] font-black uppercase">Fixtures</TabsTrigger>
          <TabsTrigger value="trials" className="flex-1 text-[9px] font-black uppercase">House Trials</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 text-[9px] font-black uppercase">Archives</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4 px-4">
          {filteredMatches.filter(m => m.status === 'Live').length > 0 ? (
            filteredMatches.filter(m => m.status === 'Live').map(renderMatchCard)
          ) : (
            <div className="py-20 text-center space-y-4 opacity-40">
              <Activity className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Live Action Right Now</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4 px-4">
          {filteredMatches.filter(m => m.status === 'Upcoming').map(renderMatchCard)}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 px-4">
          {filteredMatches.filter(m => m.status === 'Completed').reverse().map(renderMatchCard)}
        </TabsContent>

        <TabsContent value="trials" className="space-y-4 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trials?.filter(t => !focusMode || t.house === myHouse).map((trial) => (
              <Card key={trial.id} className={cn("premium-card", trial.house === myHouse && "border-primary/40 bg-primary/[0.02]")}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary">{trial.house}</Badge>
                    <span className="text-[10px] font-black text-muted-foreground uppercase">{trial.date}</span>
                  </div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">Selection Trials</h3>
                  <div className="space-y-2 border-t border-border pt-4">
                    <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2"><MapPin className="h-3 w-3" /> {trial.venue}</p>
                    <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest"><Zap className="h-3 w-3" /> {trial.time}</p>
                    {trial.notes && <p className="text-[9px] font-medium text-muted-foreground/60 leading-relaxed italic mt-2">{trial.notes}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
