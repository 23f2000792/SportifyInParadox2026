
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
import { Plus, Trophy, Timer, Trash2, ChevronLeft, Zap, CircleDot, Target, Minus, Sparkles, Pencil, Check, Megaphone, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useAuth } from '@/firebase';
import { collection, doc, setDoc, query, where, serverTimestamp, addDoc, updateDoc, arrayUnion, orderBy, limit } from 'firebase/firestore';
import { Match, RunResult, BadmintonMatchResult, HOUSES, Standing, MatchPhase, SportType, Broadcast, Trial } from '@/lib/types';
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
  const [editingHighlightIndex, setEditingHighlightIndex] = useState<number | null>(null);
  const [editingHighlightText, setEditingHighlightText] = useState('');

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

  const matches = useMemo(() => {
    return [...(rawMatches || [])].sort((a, b) => (parseInt(a.matchNumber) || 0) - (parseInt(b.matchNumber) || 0));
  }, [rawMatches]);

  useEffect(() => {
    if (!userLoading && !user) router.push('/admin/login');
  }, [user, userLoading, router]);

  const activeMatch = useMemo(() => matches?.find(m => m.id === selectedMatchId), [matches, selectedMatchId]);

  // Track initialization to avoid overwriting edits
  const initializedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeMatch && selectedMatchId !== initializedIdRef.current) {
      setScoreA(activeMatch.scoreA || 0);
      setScoreB(activeMatch.scoreB || 0);
      setStatus(activeMatch.status as any || 'Live');
      setMatchWinner(activeMatch.winner || '');
      
      if (activeMatch.badmintonResults && activeMatch.badmintonResults.length > 0) {
        setBadmintonResults([...activeMatch.badmintonResults]);
      } else {
        setBadmintonResults([
          { type: 'MS', score: '0-0', winner: '' },
          { type: 'WS', score: '0-0', winner: '' },
          { type: 'MD', score: '0-0', winner: '' },
          { type: 'XD', score: '0-0', winner: '' },
        ]);
      }
      initializedIdRef.current = selectedMatchId;
    }
  }, [activeMatch, selectedMatchId]);

  useEffect(() => {
    if (!selectedMatchId) initializedIdRef.current = null;
  }, [selectedMatchId]);

  // --- Handlers ---
  const handlePostBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !broadcastMessage) return;
    addDoc(collection(db, 'broadcasts'), {
      message: broadcastMessage,
      active: true,
      timestamp: serverTimestamp(),
    });
    setBroadcastMessage('');
    toast({ title: "Announcement published." });
  };

  const handleUpdateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !db) return;
    updateDoc(doc(db, 'matches', selectedMatchId), {
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      status,
      winner: matchWinner,
      badmintonResults: selectedSportSlug === 'badminton' ? badmintonResults : null,
      updatedAt: serverTimestamp(),
    });
    toast({ title: "Match updated successfully." });
  };

  const handleAddHighlight = () => {
    if (!selectedMatchId || !newHighlight || !db) return;
    updateDoc(doc(db, 'matches', selectedMatchId), {
      keyEvents: arrayUnion(newHighlight),
      updatedAt: serverTimestamp(),
    });
    setNewHighlight('');
    toast({ title: "Highlight logged." });
  };

  const handleDeleteHighlight = (index: number) => {
    if (!selectedMatchId || !db || !activeMatch) return;
    const updatedEvents = [...(activeMatch.keyEvents || [])];
    updatedEvents.splice(index, 1);
    updateDoc(doc(db, 'matches', selectedMatchId), {
      keyEvents: updatedEvents,
      updatedAt: serverTimestamp(),
    });
    toast({ title: "Highlight removed." });
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
          <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="bg-destructive/10 text-destructive hover:bg-destructive/20 text-[9px] font-black uppercase rounded-full px-6">
            Logout
          </Button>
        </div>
        
        <Card className="premium-card">
          <CardHeader className="border-b border-border"><CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Megaphone className="h-4 w-4" /> Global Announcement</CardTitle></CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handlePostBroadcast} className="flex flex-col sm:flex-row gap-3">
              <Input value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="Type announcement..." className="bg-muted/20 h-12 text-xs font-black" />
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
          <TabsTrigger value="control" className="flex-1 text-[9px] font-black uppercase">Live Scoring</TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1 text-[9px] font-black uppercase">Match Management</TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="space-y-6">
          {!isKampusRun && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="premium-card lg:col-span-2">
                <CardContent className="p-6 md:p-12 space-y-10">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60">Active Match</Label>
                    <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                      <SelectTrigger className="bg-muted/20 h-12 text-xs font-black uppercase"><SelectValue placeholder="Select Match" /></SelectTrigger>
                      <SelectContent>
                        {matches?.filter(m => m.status !== 'Completed').map(m => (
                          <SelectItem key={m.id} value={m.id} className="text-[10px] font-black uppercase">{m.teamA} vs {m.teamB}</SelectItem>
                        ))}
                      </SelectContent>
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
                                      {[activeMatch?.teamA, activeMatch?.teamB].map(h => h && (
                                        <SelectItem key={h} value={h} className="text-[9px] font-black uppercase">{h}</SelectItem>
                                      ))}
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
                            <SelectContent>
                              <SelectItem value="Upcoming">Upcoming</SelectItem>
                              <SelectItem value="Live">Live</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase opacity-60">Match Outcome</Label>
                          <Select value={matchWinner} onValueChange={setMatchWinner}>
                            <SelectTrigger className="bg-muted/20 h-12 text-[10px] font-black uppercase"><SelectValue placeholder="Choose Winner" /></SelectTrigger>
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
                      <Button type="submit" className="w-full h-14 font-black uppercase text-[10px] tracking-widest shadow-xl">Sync Broadcast Data</Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader className="border-b border-border"><CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Sparkles className="h-4 w-4" /> Live Highlights</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-4">
                  {selectedMatchId ? (
                    <>
                      <div className="flex gap-2">
                        <Input value={newHighlight} onChange={e => setNewHighlight(e.target.value)} placeholder="Enter highlight..." className="bg-muted/20 text-[10px] font-black h-12 flex-1" />
                        <Button onClick={handleAddHighlight} className="h-12 px-4"><Plus className="h-4 w-4" /></Button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto pt-4">
                        {activeMatch?.keyEvents?.slice().reverse().map((ev, i) => (
                          <div key={i} className="group bg-muted/20 p-3 rounded text-[10px] border-l-2 border-primary flex justify-between items-center">
                            <span className="flex-1">{ev}</span>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteHighlight(activeMatch.keyEvents!.length - 1 - i)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <p className="text-[10px] font-black uppercase opacity-30 text-center py-20">Select a match to log highlights</p>}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
