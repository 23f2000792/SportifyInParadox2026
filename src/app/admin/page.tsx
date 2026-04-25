
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EVENTS } from '@/lib/mock-data';
import { 
  Plus, Trophy, Timer, Trash2, Zap, CircleDot, Target, Minus, 
  Megaphone, Star, MapPin, ClipboardList, ListOrdered, Settings 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useAuth } from '@/firebase';
import { 
  collection, doc, setDoc, query, where, serverTimestamp, 
  addDoc, updateDoc, deleteDoc, orderBy 
} from 'firebase/firestore';
import { Match, RunResult, BadmintonMatchResult, SportType, Broadcast, Trial, Standing, HOUSES, MatchPhase } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

const ADMIN_SPORT_NAMES: Record<string, string> = {
  'kampus-run': 'Kampus Run',
  'football': 'Football',
  'volleyball': 'Volleyball',
  'badminton': 'Badminton',
};

export default function AdminPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { user, adminProfile, loading: userLoading } = useUser();
  
  const [selectedSportSlug, setSelectedSportSlug] = useState<SportType | null>(null);
  const [activeTab, setActiveTab] = useState('control');

  // --- Broadcast State ---
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // --- Score Control State ---
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [matchWinner, setMatchWinner] = useState<string>('');
  const [status, setStatus] = useState<'Upcoming' | 'Live' | 'Completed'>('Live');
  
  // --- New Item States ---
  const [newMatch, setNewMatch] = useState<Partial<Match>>({
    matchNumber: '', teamA: '', teamB: '', phase: 'group', time: '', date: '', day: '', venue: ''
  });
  const [newTrial, setNewTrial] = useState<Partial<Trial>>({
    house: '', date: '', time: '', venue: '', notes: ''
  });
  const [newStanding, setNewStanding] = useState<Partial<Standing>>({
    team: '', played: 0, won: 0, drawn: 0, lost: 0, points: 0, group: 'A'
  });

  // --- Kampus Run State ---
  const [runName, setRunName] = useState('');
  const [runTime, setRunTime] = useState('');
  const [runPos, setRunPos] = useState<number>(1);
  const [runCat, setRunCat] = useState('3km');
  const [runGen, setRunGen] = useState<'M' | 'F'>('M');
  const [runAge, setRunAge] = useState('All');

  const [badmintonResults, setBadmintonResults] = useState<BadmintonMatchResult[]>([
    { type: 'MS', score: '0-0', winner: '' },
    { type: 'WS', score: '0-0', winner: '' },
    { type: 'MD', score: '0-0', winner: '' },
    { type: 'XD', score: '0-0', winner: '' },
  ]);

  // --- Data Fetching ---
  const rawMatchesQuery = useMemo(() => {
    if (!db || !selectedSportSlug) return null;
    return query(collection(db, 'matches'), where('sport', '==', selectedSportSlug));
  }, [db, selectedSportSlug]);
  const { data: rawMatches } = useCollection<Match>(rawMatchesQuery);

  const trialsQuery = useMemo(() => {
    if (!db || !selectedSportSlug) return null;
    return query(collection(db, 'trials'), where('sport', '==', selectedSportSlug));
  }, [db, selectedSportSlug]);
  const { data: trials } = useCollection<Trial>(trialsQuery);

  const standingsQuery = useMemo(() => {
    if (!db || !selectedSportSlug) return null;
    return query(collection(db, 'standings'), where('sport', '==', selectedSportSlug), orderBy('points', 'desc'));
  }, [db, selectedSportSlug]);
  const { data: standings } = useCollection<Standing>(standingsQuery);

  const runResultsQuery = useMemo(() => {
    if (!db || selectedSportSlug !== 'kampus-run') return null;
    return query(collection(db, 'runResults'), orderBy('position', 'asc'));
  }, [db, selectedSportSlug]);
  const { data: runResults } = useCollection<RunResult>(runResultsQuery);

  const matches = useMemo(() => {
    return [...(rawMatches || [])].sort((a, b) => (parseInt(a.matchNumber) || 0) - (parseInt(b.matchNumber) || 0));
  }, [rawMatches]);

  useEffect(() => {
    if (!userLoading && !user) router.push('/admin/login');
  }, [user, userLoading, router]);

  const activeMatch = useMemo(() => matches?.find(m => m.id === selectedMatchId), [matches, selectedMatchId]);
  const initializedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeMatch && selectedMatchId !== initializedIdRef.current) {
      setScoreA(activeMatch.scoreA || 0);
      setScoreB(activeMatch.scoreB || 0);
      setStatus(activeMatch.status as any || 'Live');
      setMatchWinner(activeMatch.winner || '');
      if (activeMatch.badmintonResults) setBadmintonResults([...activeMatch.badmintonResults]);
      initializedIdRef.current = selectedMatchId;
    }
  }, [activeMatch, selectedMatchId]);

  const handlePostBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !broadcastMessage) return;
    addDoc(collection(db, 'broadcasts'), { message: broadcastMessage, active: true, timestamp: serverTimestamp() });
    setBroadcastMessage('');
    toast({ title: "Broadcast published." });
  };

  const handleUpdateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !db) return;
    updateDoc(doc(db, 'matches', selectedMatchId), {
      scoreA: Number(scoreA), scoreB: Number(scoreB), status, winner: matchWinner,
      badmintonResults: selectedSportSlug === 'badminton' ? badmintonResults : null,
      updatedAt: serverTimestamp(),
    });
    toast({ title: "Match updated." });
  };

  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedSportSlug) return;
    addDoc(collection(db, 'matches'), { ...newMatch, sport: selectedSportSlug, scoreA: 0, scoreB: 0, status: 'Upcoming', createdAt: serverTimestamp() });
    setNewMatch({ matchNumber: '', teamA: '', teamB: '', phase: 'group', time: '', date: '', day: '', venue: '' });
    toast({ title: "Fixture added." });
  };

  const handleAddTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedSportSlug) return;
    addDoc(collection(db, 'trials'), { ...newTrial, sport: selectedSportSlug, createdAt: serverTimestamp() });
    setNewTrial({ house: '', date: '', time: '', venue: '', notes: '' });
    toast({ title: "Trial scheduled." });
  };

  const handleAddStanding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedSportSlug) return;
    addDoc(collection(db, 'standings'), { ...newStanding, sport: selectedSportSlug, createdAt: serverTimestamp() });
    setNewStanding({ team: '', played: 0, won: 0, drawn: 0, lost: 0, points: 0, group: 'A' });
    toast({ title: "Team added to league." });
  };

  const handleAddRunResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !runName || !runTime) return;
    addDoc(collection(db, 'runResults'), {
      name: runName, time: runTime, position: Number(runPos), category: runCat, gender: runGen, ageGroup: runAge, updatedAt: serverTimestamp()
    });
    setRunName(''); setRunTime('');
    toast({ title: "Result added." });
  };

  if (userLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Timer className="animate-spin text-primary" /></div>;
  if (!user || !adminProfile) return null;

  const currentEvent = EVENTS.find(e => e.slug === selectedSportSlug);
  const isKampusRun = selectedSportSlug === 'kampus-run';

  if (!selectedSportSlug) {
    return (
      <div className="space-y-10 max-w-5xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center border-b border-border pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase text-foreground">Admin Terminal</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Paradox 2026 Core</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="bg-destructive/10 text-destructive text-[9px] font-black uppercase rounded-full px-6">Logout</Button>
        </div>
        
        <Card className="premium-card">
          <CardHeader className="border-b border-border"><CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Megaphone className="h-4 w-4" /> Global Announcement</CardTitle></CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handlePostBroadcast} className="flex flex-col sm:flex-row gap-3">
              <Input value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="Type announcement..." className="bg-muted/20 h-12 text-xs font-black uppercase" />
              <Button type="submit" className="h-12 px-8 uppercase font-black text-[10px] tracking-widest">Broadcast</Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            return (
              <Button key={event.id} variant="ghost" className="p-0 h-auto text-left" onClick={() => setSelectedSportSlug(event.slug)}>
                <Card className="premium-card w-full h-28 flex items-center px-6 gap-6 hover:bg-muted/10">
                  <div className="h-12 w-12 bg-muted/20 rounded-xl flex items-center justify-center border border-border">
                    {IconComp && <IconComp className="h-6 w-6 text-primary" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase text-foreground">{ADMIN_SPORT_NAMES[event.slug] || event.name}</h2>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Broadcast Control</p>
                  </div>
                </Card>
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 px-4">
      <div className="border-b border-border pb-6 pt-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedSportSlug(null)} className="p-0 h-auto text-[10px] font-black uppercase text-primary gap-1.5 mb-2">Switch Terminal</Button>
        <h1 className="text-2xl md:text-4xl font-black uppercase text-foreground">{ADMIN_SPORT_NAMES[currentEvent?.slug || ''] || currentEvent?.name}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full bg-muted/20 border border-border p-1 h-12 rounded-xl overflow-x-auto no-scrollbar">
          <TabsTrigger value="control" className="flex-1 text-[9px] font-black uppercase whitespace-nowrap px-4">{isKampusRun ? "Race Manager" : "Live Feed"}</TabsTrigger>
          {!isKampusRun && <TabsTrigger value="fixtures" className="flex-1 text-[9px] font-black uppercase whitespace-nowrap px-4">Fixtures</TabsTrigger>}
          {!isKampusRun && <TabsTrigger value="trials" className="flex-1 text-[9px] font-black uppercase whitespace-nowrap px-4">Trials</TabsTrigger>}
          {!isKampusRun && <TabsTrigger value="standings" className="flex-1 text-[9px] font-black uppercase whitespace-nowrap px-4">League Table</TabsTrigger>}
        </TabsList>

        <TabsContent value="control" className="space-y-6">
          {isKampusRun ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="premium-card lg:col-span-2">
                <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Enter Runner Stats</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAddRunResult} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Runner Name</Label><Input value={runName} onChange={e => setRunName(e.target.value)} className="bg-muted/20" required /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Official Time (MM:SS.ms)</Label><Input value={runTime} onChange={e => setRunTime(e.target.value)} className="bg-muted/20" placeholder="e.g. 14:32.4" required /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Rank / Position</Label><Input type="number" value={runPos} onChange={e => setRunPos(Number(e.target.value))} className="bg-muted/20" required /></div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Category</Label>
                        <Select value={runCat} onValueChange={setRunCat}>
                          <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="3km">3KM</SelectItem><SelectItem value="5km">5KM</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Gender</Label>
                        <Select value={runGen} onValueChange={(v: any) => setRunGen(v)}>
                          <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Age Group</Label>
                        <Select value={runAge} onValueChange={setRunAge}>
                          <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="All">All Ages (3KM)</SelectItem><SelectItem value="18-25">18-25</SelectItem><SelectItem value="26+">26+</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 uppercase font-black text-[10px] tracking-widest">Publish Result</Button>
                  </form>
                </CardContent>
              </Card>
              <Card className="premium-card">
                <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Official Rankings</CardTitle></CardHeader>
                <CardContent className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                  {runResults?.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-muted/20 rounded border-l-2 border-primary">
                      <div><p className="text-[10px] font-black uppercase">{r.name}</p></div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-primary">{r.time}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteDoc(doc(db!, 'runResults', r.id))}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <Card className="premium-card">
                <CardContent className="p-6 md:p-12 space-y-10">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Select Active Match</Label>
                    <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                      <SelectTrigger className="bg-muted/20 h-12 font-black uppercase"><SelectValue placeholder="Select Match" /></SelectTrigger>
                      <SelectContent>{matches?.filter(m => m.status !== 'Completed').map(m => (<SelectItem key={m.id} value={m.id} className="text-[10px] font-black uppercase">{m.teamA} vs {m.teamB}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  {selectedMatchId && (
                    <form onSubmit={handleUpdateMatch} className="space-y-10">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="w-full md:flex-1 space-y-4">
                          <Label className="text-[10px] font-black uppercase block text-center opacity-60">{activeMatch?.teamA}</Label>
                          <div className="flex items-center justify-center gap-3">
                             <Button type="button" variant="outline" size="icon" onClick={() => setScoreA(Math.max(0, scoreA - 1))}><Minus className="h-4 w-4" /></Button>
                             <Input type="number" value={scoreA} onChange={e => setScoreA(Number(e.target.value))} className="text-center text-4xl font-black h-20 bg-muted/20" />
                             <Button type="button" variant="outline" size="icon" onClick={() => setScoreA(scoreA + 1)}><Plus className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        <div className="w-full md:flex-1 space-y-4">
                          <Label className="text-[10px] font-black uppercase block text-center opacity-60">{activeMatch?.teamB}</Label>
                          <div className="flex items-center justify-center gap-3">
                             <Button type="button" variant="outline" size="icon" onClick={() => setScoreB(Math.max(0, scoreB - 1))}><Minus className="h-4 w-4" /></Button>
                             <Input type="number" value={scoreB} onChange={e => setScoreB(Number(e.target.value))} className="text-center text-4xl font-black h-20 bg-muted/20" />
                             <Button type="button" variant="outline" size="icon" onClick={() => setScoreB(scoreB + 1)}><Plus className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </div>

                      {selectedSportSlug === 'badminton' && (
                        <div className="space-y-6 pt-6 border-t border-border">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Sub-Match Results</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {badmintonResults.map((res, idx) => (
                              <Card key={res.type} className="bg-muted/10 border-border p-4 space-y-3">
                                <Badge variant="outline" className="text-[9px] font-black">{res.type}</Badge>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input value={res.score} onChange={e => {
                                    const newRes = [...badmintonResults];
                                    newRes[idx].score = e.target.value;
                                    setBadmintonResults(newRes);
                                  }} className="h-8 text-[10px]" />
                                  <Select value={res.winner} onValueChange={v => {
                                    const newRes = [...badmintonResults];
                                    newRes[idx].winner = v;
                                    setBadmintonResults(newRes);
                                  }}>
                                    <SelectTrigger className="h-8 text-[9px]"><SelectValue placeholder="Winner" /></SelectTrigger>
                                    <SelectContent>
                                      {[activeMatch?.teamA, activeMatch?.teamB].map(h => h && (<SelectItem key={h} value={h} className="text-[9px] font-black uppercase">{h}</SelectItem>))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase opacity-60">Status</Label>
                          <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                            <SelectTrigger className="bg-muted/20 h-12 text-[10px] font-black uppercase"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="Upcoming">Upcoming</SelectItem><SelectItem value="Live">Live</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase opacity-60">Official Outcome</Label>
                          <Select value={matchWinner} onValueChange={setMatchWinner}>
                            <SelectTrigger className="bg-muted/20 h-12 text-[10px] font-black uppercase"><SelectValue placeholder="Select Winner" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Draw">Draw / No Result</SelectItem>
                              {activeMatch && (
                                <>
                                  <SelectItem value={activeMatch.teamA}>{activeMatch.teamA}</SelectItem>
                                  <SelectItem value={activeMatch.teamB}>{activeMatch.teamB}</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-14 font-black uppercase text-[10px] tracking-widest shadow-xl">Update Official Feed</Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="fixtures" className="space-y-6">
          <Card className="premium-card">
            <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><MapPin className="h-4 w-4" /> Create Fixture</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddMatch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Match Number (e.g. 1)" value={newMatch.matchNumber} onChange={e => setNewMatch({...newMatch, matchNumber: e.target.value})} className="bg-muted/20 h-11" required />
                <Select value={newMatch.phase} onValueChange={v => setNewMatch({...newMatch, phase: v as MatchPhase})}>
                  <SelectTrigger className="bg-muted/20 h-11 uppercase font-black text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Group Stage</SelectItem>
                    <SelectItem value="semi-final">Semi-Final</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newMatch.teamA} onValueChange={v => setNewMatch({...newMatch, teamA: v})}>
                  <SelectTrigger className="bg-muted/20 h-11 uppercase font-black text-[10px]"><SelectValue placeholder="Team A" /></SelectTrigger>
                  <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={newMatch.teamB} onValueChange={v => setNewMatch({...newMatch, teamB: v})}>
                  <SelectTrigger className="bg-muted/20 h-11 uppercase font-black text-[10px]"><SelectValue placeholder="Team B" /></SelectTrigger>
                  <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Date (e.g. 25th May)" value={newMatch.date} onChange={e => setNewMatch({...newMatch, date: e.target.value})} className="bg-muted/20 h-11" required />
                <Input placeholder="Time (e.g. 09:00 AM)" value={newMatch.time} onChange={e => setNewMatch({...newMatch, time: e.target.value})} className="bg-muted/20 h-11" required />
                <Input placeholder="Venue" value={newMatch.venue} onChange={e => setNewMatch({...newMatch, venue: e.target.value})} className="bg-muted/20 h-11" required />
                <Button type="submit" className="md:col-span-2 h-12 uppercase font-black text-[10px] tracking-widest">Schedule Match</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trials" className="space-y-6">
          <Card className="premium-card">
            <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Schedule Trials</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddTrial} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={newTrial.house} onValueChange={v => setNewTrial({...newTrial, house: v})}>
                  <SelectTrigger className="bg-muted/20 h-11 uppercase font-black text-[10px]"><SelectValue placeholder="Select House" /></SelectTrigger>
                  <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Venue" value={newTrial.venue} onChange={e => setNewTrial({...newTrial, venue: e.target.value})} className="bg-muted/20 h-11" required />
                <Input placeholder="Date" value={newTrial.date} onChange={e => setNewTrial({...newTrial, date: e.target.value})} className="bg-muted/20 h-11" required />
                <Input placeholder="Time" value={newTrial.time} onChange={e => setNewTrial({...newTrial, time: e.target.value})} className="bg-muted/20 h-11" required />
                <Input placeholder="Notes (Optional)" value={newTrial.notes} onChange={e => setNewTrial({...newTrial, notes: e.target.value})} className="bg-muted/20 h-11 md:col-span-2" />
                <Button type="submit" className="md:col-span-2 h-12 uppercase font-black text-[10px] tracking-widest">Publish Trial Schedule</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standings" className="space-y-6">
          <Card className="premium-card">
            <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><ListOrdered className="h-4 w-4" /> League Management</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddStanding} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={newStanding.team} onValueChange={v => setNewStanding({...newStanding, team: v})}>
                  <SelectTrigger className="bg-muted/20 h-11 uppercase font-black text-[10px]"><SelectValue placeholder="Team" /></SelectTrigger>
                  <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" placeholder="P" value={newStanding.played} onChange={e => setNewStanding({...newStanding, played: Number(e.target.value)})} className="bg-muted/20 h-11" />
                <Input type="number" placeholder="W" value={newStanding.won} onChange={e => setNewStanding({...newStanding, won: Number(e.target.value)})} className="bg-muted/20 h-11" />
                <Input type="number" placeholder="D" value={newStanding.drawn} onChange={e => setNewStanding({...newStanding, drawn: Number(e.target.value)})} className="bg-muted/20 h-11" />
                <Input type="number" placeholder="L" value={newStanding.lost} onChange={e => setNewStanding({...newStanding, lost: Number(e.target.value)})} className="bg-muted/20 h-11" />
                <Input type="number" placeholder="PTS" value={newStanding.points} onChange={e => setNewStanding({...newStanding, points: Number(e.target.value)})} className="bg-muted/20 h-11" />
                <Button type="submit" className="md:col-span-3 h-12 uppercase font-black text-[10px] tracking-widest">Update Standing</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
