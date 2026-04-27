
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { EVENTS } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { Match, RunResult, Trial, Standing, GROUPS, SportEvent } from '@/lib/types';
import EventLoading from './loading';
import { Trophy, Zap, CircleDot, Target, MapPin, Search, Timer, Medal, Calendar, Share2, Clock, ExternalLink, BookOpen } from 'lucide-react';
import { MatchRecapButton } from '@/components/MatchRecapButton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { triggerHaptic } from '@/lib/haptics';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

const OAT_MAPS_LINK = "https://maps.app.goo.gl/smHmEL9hih1NqRvW6";
const OFFICIAL_PORTAL_URL = "https://sportify-in-paradox2026.vercel.app/";

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

  const eventStatic = EVENTS.find(e => e.slug === sport);
  if (!eventStatic) notFound();

  const eventDocRef = useMemo(() => sport ? doc(db!, 'events', sport) : null, [db, sport]);
  const { data: eventDynamic } = useDoc<SportEvent>(eventDocRef);

  const event = { ...eventStatic, ...eventDynamic };

  const matchesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'matches'), where('sport', '==', sport));
  }, [db, sport]);

  const trialsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'trials'), where('sport', '==', sport));
  }, [db, sport]);

  const standingsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'standings'), where('sport', '==', sport));
  }, [db, sport]);

  const runResultsQuery = useMemo(() => {
    if (!db || sport !== 'kampus-run') return null;
    return query(collection(db, 'runResults'), orderBy('position', 'asc'));
  }, [db, sport]);

  const { data: rawMatches, loading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: trials, loading: trialsLoading } = useCollection<Trial>(trialsQuery);
  const { data: standings, loading: standingsLoading } = useCollection<Standing>(standingsQuery);
  const { data: runResults, loading: runLoading } = useCollection<RunResult>(runResultsQuery);

  const filteredMatches = useMemo(() => {
    let filtered = [...(rawMatches || [])].sort((a, b) => (parseInt(a.matchNumber) || 0) - (parseInt(b.matchNumber) || 0));
    if (focusMode && myHouse) filtered = filtered.filter(m => m.teamA === myHouse || m.teamB === myHouse);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m => m.teamA.toLowerCase().includes(q) || m.teamB.toLowerCase().includes(q));
    }
    return filtered;
  }, [rawMatches, focusMode, myHouse, searchQuery]);

  const groupedStandings = useMemo(() => {
    if (!standings) return {};
    return GROUPS.reduce((acc, g) => {
      acc[g] = [...standings]
        .filter(s => s.group === g)
        .sort((a, b) => b.points - a.points);
      return acc;
    }, {} as Record<string, Standing[]>);
  }, [standings]);

  if (matchesLoading || trialsLoading || runLoading || standingsLoading) return <EventLoading />;

  const IconComp = ICON_MAP[event.icon];
  const isKampusRun = sport === 'kampus-run';

  const handleAddToCalendar = (match: Match) => {
    triggerHaptic('light');
    const title = encodeURIComponent(`Sportify: ${event.name} - ${match.teamA} vs ${match.teamB}`);
    const details = encodeURIComponent(`Match #${match.matchNumber} at ${match.venue}.`);
    const location = encodeURIComponent(match.venue);
    const dateStr = match.date.replace(/-/g, '');
    const timeParts = match.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let hourStr = '00';
    let minStr = '00';
    if (timeParts) {
      let hours = parseInt(timeParts[1]);
      const minutes = timeParts[2];
      const ampm = timeParts[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      hourStr = hours.toString().padStart(2, '0');
      minStr = minutes;
    }
    const startTime = `${dateStr}T${hourStr}${minStr}00`;
    let endHours = parseInt(hourStr);
    let endMins = parseInt(minStr) + 30;
    if (endMins >= 60) {
      endHours += 1;
      endMins -= 60;
    }
    const endTime = `${dateStr}T${endHours.toString().padStart(2, '0')}${endMins.toString().padStart(2, '0')}00`;
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startTime}/${endTime}`;
    window.open(url, '_blank');
  };

  const handleAddTrialToCalendar = (trial: Trial) => {
    triggerHaptic('light');
    const title = encodeURIComponent(`Sportify Trial: ${event.name} (${trial.house})`);
    const details = encodeURIComponent(`Selection trials for ${event.name} - ${trial.house} House. Venue: ${trial.venue}.`);
    const location = encodeURIComponent(trial.venue);
    const dateStr = trial.date.replace(/-/g, '');
    const timeParts = trial.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let hourStr = '00';
    let minStr = '00';
    if (timeParts) {
      let hours = parseInt(timeParts[1]);
      const minutes = timeParts[2];
      const ampm = timeParts[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      hourStr = hours.toString().padStart(2, '0');
      minStr = minutes;
    }
    const startTime = `${dateStr}T${hourStr}${minStr}00`;
    let endHours = parseInt(hourStr);
    let endMins = parseInt(minStr) + 30;
    if (endMins >= 60) {
      endHours += 1;
      endMins -= 60;
    }
    const endTime = `${dateStr}T${endHours.toString().padStart(2, '0')}${endMins.toString().padStart(2, '0')}00`;
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startTime}/${endTime}`;
    window.open(url, '_blank');
  };

  const handleShareMatch = (match: Match) => {
    triggerHaptic('light');
    const currentSport = event.name.toUpperCase();
    
    let msg = "";
    if (match.status === 'Live') {
      msg = `🔥 *LIVE ACTION ALERT: ${currentSport}* 🔥\n\n⚔️ *${match.teamA}* ${match.scoreA} - ${match.scoreB} *${match.teamB}*\n📍 Venue: ${match.venue}\n\nCatch every play on the Official Sportify Portal:\n🔗 ${OFFICIAL_PORTAL_URL}`;
    } else if (match.status === 'Completed') {
      msg = `🏆 *MATCH RESULT: ${currentSport}* 🏆\n\n🏁 *${match.teamA}* ${match.scoreA} - ${match.scoreB} *${match.teamB}*\n🏅 Winner: *${match.winner || 'N/A'}*\n\nView full standings and highlights:\n🔗 ${OFFICIAL_PORTAL_URL}`;
    } else {
      msg = `🗓️ *MATCH SCHEDULE: ${currentSport}* 🗓️\n\n⚔️ *${match.teamA}* vs *${match.teamB}*\n⏰ Time: ${match.time}\n📅 Date: ${match.date}\n📍 Venue: ${match.venue}\n\nStay updated with the official broadcast:\n🔗 ${OFFICIAL_PORTAL_URL}`;
    }
    
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const renderRunCategory = (title: string, category: string, gender: 'M' | 'F', ageGroup: string = 'All') => {
    const results = runResults?.filter(r => r.category === category && r.gender === gender && (ageGroup === 'All' || r.ageGroup === ageGroup)) || [];
    return (
      <div key={title} className="space-y-4">
        <div className="flex items-center gap-2 px-1">
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
              {results.length > 0 ? results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.position <= 3 ? (
                      <div className="flex items-center gap-2">
                        <Medal className={cn(
                          "h-4 w-4", 
                          r.position === 1 ? "text-yellow-500" : 
                          r.position === 2 ? "text-slate-400" : 
                          "text-amber-700"
                        )} />
                        <span className="text-[10px] font-black">{r.position}</span>
                      </div>
                    ) : (
                      <span className="opacity-40 ml-1 text-[10px] font-bold">#{r.position}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-black uppercase">{r.name}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-primary">{r.time}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 opacity-30">
                    <p className="text-[9px] uppercase font-black tracking-widest">Waiting for Results</p>
                  </TableCell>
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
        <div className="p-4 bg-muted/5 flex justify-between items-center border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Match #{match.matchNumber}</span>
            <Badge variant="outline" className="text-[8px] uppercase font-black">{match.phase}</Badge>
          </div>
          {match.status === 'Upcoming' && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10" onClick={() => handleAddToCalendar(match)}>
              <Calendar className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="p-6 flex items-center justify-between gap-4">
          <div className={cn(
            "flex-1 text-right text-[11px] sm:text-base md:text-2xl font-black uppercase tracking-tight break-words leading-none", 
            match.teamA === myHouse && "text-primary"
          )}>
            {match.teamA}
          </div>
          <div className="px-3 py-2 bg-muted/20 border border-border rounded-sm flex flex-col items-center min-w-[70px] md:min-w-[100px] shrink-0">
            <span className="text-xl md:text-4xl font-black tracking-tighter leading-none">{match.scoreA} - {match.scoreB}</span>
            {match.status === 'Live' && <span className="text-[8px] font-black uppercase text-primary animate-pulse tracking-[0.2em] mt-1">Live</span>}
            {match.status === 'Upcoming' && <span className="text-[8px] font-black uppercase opacity-40 mt-1">{match.time}</span>}
            {match.status === 'Completed' && <span className="text-[8px] font-black uppercase text-green-500 tracking-[0.2em] mt-1">Final</span>}
          </div>
          <div className={cn(
            "flex-1 text-left text-[11px] sm:text-base md:text-2xl font-black uppercase tracking-tight break-words leading-none", 
            match.teamB === myHouse && "text-primary"
          )}>
            {match.teamB}
          </div>
        </div>

        {sport === 'badminton' && match.badmintonResults && match.badmintonResults.length > 0 && (
          <div className="px-6 pb-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="results" className="border-none bg-muted/10 rounded-sm px-4">
                <AccordionTrigger className="hover:no-underline py-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Target className="h-3 w-3" /> Match Breakdown
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-3">
                  {match.badmintonResults.map((res) => (
                    <div key={res.type} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase text-muted-foreground/60">
                          {res.type === 'MS' ? "Men's Singles" : 
                           res.type === 'WS' ? "Women's Singles" : 
                           res.type === 'MD' ? "Men's Doubles" : "Mixed Doubles"}
                        </p>
                        <p className={cn("text-[10px] font-black uppercase", res.winner ? "text-foreground" : "text-muted-foreground/40")}>
                          Winner: {res.winner || 'Pending'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[9px] font-black">{res.score}</Badge>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        <div className="p-4 bg-muted/10 border-t border-border flex justify-between items-center">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" /> {match.venue}</span>
            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase">{match.date}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-30 hover:opacity-100" onClick={() => handleShareMatch(match)}>
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            {match.status === 'Completed' && <MatchRecapButton match={match} />}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-32">
      <div className="text-center space-y-4 px-4 pt-4">
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/20 rounded-full border border-border">
            {IconComp && <IconComp className="h-3.5 w-3.5 text-primary" />}
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Official Stream</p>
          </div>
          {event.rulebookUrl && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 rounded-sm text-[8px] font-black uppercase gap-1.5 border-primary/20 hover:bg-primary/5"
              onClick={() => { triggerHaptic('light'); window.open(event.rulebookUrl, '_blank'); }}
            >
              <BookOpen className="h-3 w-3" /> Official Rulebook
            </Button>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase text-foreground leading-none tracking-tighter italic">
          {event.name}
        </h1>
        {isKampusRun ? (
          <div className="space-y-2">
             <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.5em] text-foreground/80">MILES WITH PURPOSE.</p>
             <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">RUN FOR YOUR MIND, RUN FOR YOURSELF.</p>
          </div>
        ) : (
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground max-w-lg mx-auto">{event.description}</p>
        )}
      </div>

      {!isKampusRun && (
        <div className="px-4">
          <div className="flex flex-col md:flex-row items-center gap-4 bg-card border border-border p-3 rounded-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search house..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-11 bg-muted/10 border-none text-xs font-black uppercase" />
            </div>
            <div className="flex items-center gap-2 shrink-0 bg-muted/20 px-4 py-2 rounded-sm border border-border/50">
              <Switch checked={focusMode} onCheckedChange={(v) => { triggerHaptic('light'); setFocusMode(v); }} disabled={!myHouse} />
              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Follow {myHouse || 'House'}</Label>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue={isKampusRun ? "results" : "live"} className="w-full">
        <TabsList className="flex w-full bg-muted/20 border border-border p-1 h-14 rounded-sm max-w-2xl mx-auto mb-8 overflow-x-auto no-scrollbar flex-nowrap justify-start md:justify-center">
          {isKampusRun ? (
            <>
              <TabsTrigger value="results" className="shrink-0 text-[10px] font-black uppercase whitespace-nowrap px-8 h-full data-[state=active]:bg-background">Rankings</TabsTrigger>
              <TabsTrigger value="schedule" className="shrink-0 text-[10px] font-black uppercase whitespace-nowrap px-8 h-full data-[state=active]:bg-background">Race Info</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="live" className="shrink-0 text-[10px] font-black uppercase whitespace-nowrap px-8 h-full data-[state=active]:bg-background">Live Feed</TabsTrigger>
              <TabsTrigger value="upcoming" className="shrink-0 text-[10px] font-black uppercase whitespace-nowrap px-8 h-full data-[state=active]:bg-background">Fixtures</TabsTrigger>
              <TabsTrigger value="trials" className="shrink-0 text-[10px] font-black uppercase whitespace-nowrap px-8 h-full data-[state=active]:bg-background">House Trials</TabsTrigger>
              <TabsTrigger value="standings" className="shrink-0 text-[10px] font-black uppercase whitespace-nowrap px-8 h-full data-[state=active]:bg-background">Standings</TabsTrigger>
              <TabsTrigger value="completed" className="shrink-0 text-[10px] font-black uppercase whitespace-nowrap px-8 h-full data-[state=active]:bg-background">Archives</TabsTrigger>
            </>
          )}
        </TabsList>

        {isKampusRun ? (
          <>
            <TabsContent value="results" className="space-y-12 px-4">
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
               <div className="max-w-xl mx-auto space-y-4">
                  <Card className="premium-card p-10 text-center space-y-6">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Reporting: {event.reportingTime || '05:00 AM'}</h2>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Flag Off: {event.flagOffTime || '05:30 AM'}</p>
                      <div className="flex flex-col items-center gap-2 pt-2">
                        <p className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-primary" /> Open Air Theater, IIT Madras
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 rounded-sm text-[8px] font-black uppercase gap-1.5 border-primary/20"
                          onClick={() => { triggerHaptic('light'); window.open(OAT_MAPS_LINK, '_blank'); }}
                        >
                          <ExternalLink className="h-3 w-3" /> Get Directions
                        </Button>
                      </div>
                    </div>
                    {event.notes && (
                      <div className="pt-6 border-t border-border/50 text-[9px] font-bold text-muted-foreground/60 uppercase leading-relaxed whitespace-pre-wrap">
                        {event.notes}
                      </div>
                    )}
                  </Card>
               </div>
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
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="text-[9px] font-black uppercase text-primary border-primary/20">{trial.house}</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => handleAddTrialToCalendar(trial)}>
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-tighter">Selection Trials</h3>
                      <div className="space-y-1.5 border-t border-border pt-4">
                        <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2"><MapPin className="h-3 w-3 shrink-0" /> {trial.venue}</p>
                        <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2"><Timer className="h-3 w-3 shrink-0" /> {trial.time} • {trial.date}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="standings" className="px-4 space-y-8">
              {GROUPS.map(g => (
                <div key={g} className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary px-2">Group {g}</h3>
                  <Card className="premium-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Pos</TableHead>
                          <TableHead>House</TableHead>
                          <TableHead className="text-center">P</TableHead>
                          <TableHead className="text-center">W</TableHead>
                          <TableHead className="text-center">D</TableHead>
                          <TableHead className="text-center">L</TableHead>
                          <TableHead className="text-center">PTS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedStandings[g]?.length ? groupedStandings[g].map((s, idx) => (
                          <TableRow key={s.id} className={cn(s.team === myHouse && "bg-primary/[0.05]")}>
                            <TableCell className="text-xs font-black">{idx + 1}</TableCell>
                            <TableCell className="text-xs font-black uppercase">{s.team}</TableCell>
                            <TableCell className="text-center text-xs">{s.played}</TableCell>
                            <TableCell className="text-center text-xs">{s.won}</TableCell>
                            <TableCell className="text-center text-xs">{s.drawn || 0}</TableCell>
                            <TableCell className="text-center text-xs">{s.lost || 0}</TableCell>
                            <TableCell className="text-center text-xs font-black text-primary">{s.points}</TableCell>
                          </TableRow>
                        )) : <TableRow><TableCell colSpan={7} className="text-center py-6 opacity-30 text-[9px] font-black uppercase">Pending</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              ))}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
