
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
import { Plus, Trophy, Timer, Trash2, Zap, CircleDot, Target, Minus, Sparkles, Megaphone, Star, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useAuth } from '@/firebase';
import { collection, doc, setDoc, query, where, serverTimestamp, addDoc, updateDoc, arrayUnion, deleteDoc, orderBy } from 'firebase/firestore';
import { Match, RunResult, BadmintonMatchResult, SportType, Broadcast, Trial } from '@/lib/types';
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
  const [newHighlight, setNewHighlight] = useState('');

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

  const handleAddRunResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !runName || !runTime) return;
    addDoc(collection(db, 'runResults'), {
      name: runName, time: runTime, position: Number(runPos), category: runCat, gender: runGen, ageGroup: runAge, updatedAt: serverTimestamp()
    });
    setRunName(''); setRunTime('');
    toast({ title: "Result added." });
  };

  const handleDeleteRunResult = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'runResults', id));
    toast({ title: "Result deleted." });
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
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Manage Controls</p>
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
        <Button variant="ghost" size="sm" onClick={() => setSelectedSportSlug(null)} className="p-0 h-auto text-[10px] font-black uppercase text-primary gap-1.5 mb-2">Switch Sport</Button>
        <h1 className="text-2xl md:text-4xl font-black uppercase text-foreground">{ADMIN_SPORT_NAMES[currentEvent?.slug || ''] || currentEvent?.name} Center</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full bg-muted/20 border border-border p-1 h-12 rounded-xl">
          <TabsTrigger value="control" className="flex-1 text-[9px] font-black uppercase">{isKampusRun ? "Leaderboard Editor" : "Live Scoring"}</TabsTrigger>
          {!isKampusRun && <TabsTrigger value="schedule" className="flex-1 text-[9px] font-black uppercase">Fixtures</TabsTrigger>}
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
                <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Live Rankings</CardTitle></CardHeader>
                <CardContent className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                  {runResults?.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-muted/20 rounded border-l-2 border-primary">
                      <div>
                        <p className="text-[10px] font-black uppercase">{r.name}</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">{r.category} {r.gender} • {r.ageGroup}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-primary">{r.time}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDeleteRunResult(r.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="premium-card lg:col-span-2">
                <CardContent className="p-6 md:p-12 space-y-10">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Active Match</Label>
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
                          <Label className="text-[10px] font-black uppercase opacity-60">Outcome</Label>
                          <Select value={matchWinner} onValueChange={setMatchWinner}>
                            <SelectTrigger className="bg-muted/20 h-12 text-[10px] font-black uppercase"><SelectValue placeholder="Winner" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Draw">Draw</SelectItem>
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
      </Tabs>
    </div>
  );
}
