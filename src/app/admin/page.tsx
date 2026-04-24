
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EVENTS } from '@/lib/mock-data';
import { Save, Plus, ShieldCheck, LogOut, Trophy, Timer, ListOrdered, UserPlus, Trash2, ChevronLeft, Zap, CircleDot, Target, Minus, Sparkles, Pencil, Check, X, Megaphone, Share2, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useAuth } from '@/firebase';
import { collection, doc, setDoc, query, where, serverTimestamp, addDoc, deleteDoc, updateDoc, arrayUnion, orderBy, limit } from 'firebase/firestore';
import { Match, AdminUser, RunResult, BadmintonMatchResult, HOUSES, GROUPS, Standing, MatchPhase, SportType, Broadcast } from '@/lib/types';
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

  // --- Schedule State ---
  const [schedMatchNumber, setSchedMatchNumber] = useState('');
  const [schedTeamA, setSchedTeamA] = useState('');
  const [schedTeamB, setSchedTeamB] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedReportingTime, setSchedReportingTime] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedDay, setSchedDay] = useState('');
  const [schedVenue, setSchedVenue] = useState('');
  const [schedPhase, setSchedPhase] = useState<MatchPhase>('group');
  const [schedGroup, setSchedGroup] = useState('A');

  // --- Run Result Entry State ---
  const [runnerName, setRunnerName] = useState('');
  const [runnerPos, setRunnerPos] = useState<number>(1);
  const [runnerTime, setRunnerTime] = useState('');
  const [runnerCat, setRunnerCat] = useState('3km');
  const [runnerGender, setRunnerGender] = useState<'M' | 'F'>('M');

  // --- League State ---
  const [newStandingTeam, setNewStandingTeam] = useState('');
  const [newStandingGroup, setNewStandingGroup] = useState('A');

  // --- Admin Access State ---
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminSport, setNewAdminSport] = useState('all');

  // --- Data Fetching ---
  const rawMatchesQuery = useMemo(() => {
    if (!db || !selectedSportSlug) return null;
    return query(collection(db, 'matches'), where('sport', '==', selectedSportSlug));
  }, [db, selectedSportSlug]);
  const { data: rawMatches } = useCollection<Match>(rawMatchesQuery);

  const matches = useMemo(() => {
    return [...(rawMatches || [])].sort((a, b) => (parseInt(a.matchNumber) || 0) - (parseInt(b.matchNumber) || 0));
  }, [rawMatches]);

  const standingsQuery = useMemo(() => {
    if (!db || !selectedSportSlug || selectedSportSlug === 'kampus-run') return null;
    return query(collection(db, 'standings'), where('sport', '==', selectedSportSlug));
  }, [db, selectedSportSlug]);
  const { data: standings } = useCollection<Standing>(standingsQuery);

  const runResultsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'runResults'));
  }, [db]);
  const { data: rawRunResults } = useCollection<RunResult>(runResultsQuery);

  const runResults = useMemo(() => {
    return [...(rawRunResults || [])].sort((a, b) => a.position - b.position);
  }, [rawRunResults]);

  const broadcastQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'broadcasts'), orderBy('timestamp', 'desc'), limit(10));
  }, [db]);
  const { data: recentBroadcasts } = useCollection<Broadcast>(broadcastQuery);

  // --- Auth & Profile ---
  useEffect(() => {
    if (!userLoading && !user) router.push('/admin/login');
  }, [user, userLoading, router]);

  const activeMatch = useMemo(() => matches?.find(m => m.id === selectedMatchId), [matches, selectedMatchId]);

  useEffect(() => {
    if (activeMatch) {
      setScoreA(activeMatch.scoreA);
      setScoreB(activeMatch.scoreB);
      setStatus(activeMatch.status as any);
      if (activeMatch.badmintonResults) {
        setBadmintonResults(activeMatch.badmintonResults);
      } else {
        setBadmintonResults([
          { type: 'MS', score: '0-0', winner: '' },
          { type: 'WS', score: '0-0', winner: '' },
          { type: 'MD', score: '0-0', winner: '' },
          { type: 'XD', score: '0-0', winner: '' },
        ]);
      }
    }
  }, [activeMatch]);

  // --- Handlers ---
  const handlePostBroadcast = (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msg = customMsg || broadcastMessage;
    if (!db || !msg) return;
    addDoc(collection(db, 'broadcasts'), {
      message: msg,
      active: true,
      timestamp: serverTimestamp(),
    });
    if (!customMsg) setBroadcastMessage('');
    toast({ title: "Global announcement published." });
  };

  const handleUpdateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !db) return;
    updateDoc(doc(db, 'matches', selectedMatchId), {
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      status,
      badmintonResults: selectedSportSlug === 'badminton' ? badmintonResults : null,
      updatedAt: serverTimestamp(),
    });
    toast({ title: "Match status updated." });
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

  const handleSaveEditHighlight = () => {
    if (!selectedMatchId || !db || !activeMatch || editingHighlightIndex === null) return;
    const updatedEvents = [...(activeMatch.keyEvents || [])];
    updatedEvents[editingHighlightIndex] = editingHighlightText;
    updateDoc(doc(db, 'matches', selectedMatchId), {
      keyEvents: updatedEvents,
      updatedAt: serverTimestamp(),
    });
    setEditingHighlightIndex(null);
    setEditingHighlightText('');
    toast({ title: "Highlight refined." });
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedSportSlug) return;
    addDoc(collection(db, 'matches'), {
      matchNumber: schedMatchNumber,
      sport: selectedSportSlug,
      teamA: schedTeamA,
      teamB: schedTeamB,
      phase: schedPhase,
      group: schedPhase === 'group' ? schedGroup : null,
      time: schedTime,
      reportingTime: schedReportingTime,
      date: schedDate,
      day: schedDay,
      venue: schedVenue,
      scoreA: 0,
      scoreB: 0,
      status: 'Upcoming',
      keyEvents: [],
      updatedAt: serverTimestamp(),
    });
    setSchedMatchNumber(''); setSchedTeamA(''); setSchedTeamB('');
    toast({ title: "Match scheduled." });
  };

  const handleAddRunResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    addDoc(collection(db, 'runResults'), {
      name: runnerName,
      position: Number(runnerPos),
      time: runnerTime,
      category: runnerCat,
      gender: runnerGender,
      ageGroup: 'Open',
      updatedAt: serverTimestamp(),
    });
    setRunnerName(''); setRunnerPos(runnerPos + 1); setRunnerTime('');
    toast({ title: "Result added." });
  };

  const handleAddStanding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedSportSlug || !newStandingTeam) return;
    addDoc(collection(db, 'standings'), {
      team: newStandingTeam,
      group: newStandingGroup,
      sport: selectedSportSlug,
      played: 0, won: 0, drawn: 0, lost: 0, points: 0,
      updatedAt: serverTimestamp(),
    });
    setNewStandingTeam('');
    toast({ title: "House enrolled." });
  };

  const handleUpdateStanding = (id: string, field: string, value: number) => {
    if (!db) return;
    updateDoc(doc(db, 'standings', id), { 
      [field]: value, 
      updatedAt: serverTimestamp() 
    }).catch(err => {
      toast({ variant: "destructive", title: "Update failed", description: err.message });
    });
  };

  const handleAddPersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newAdminUid || !newAdminEmail) return;
    setDoc(doc(db, 'admins', newAdminUid), {
      uid: newAdminUid, email: newAdminEmail, role: 'admin', assignedSport: newAdminSport,
    });
    setNewAdminUid(''); setNewAdminEmail('');
    toast({ title: "Admin permissions assigned." });
  };

  const handleShareResultBroadcast = (match: Match) => {
    const winner = match.scoreA > match.scoreB ? match.teamA : match.scoreB > match.scoreA ? match.teamB : "DRAW";
    const text = `🏆 *OFFICIAL ANNOUNCEMENT: A CHAMPION RISES!* 🏆\n\n` +
      `The final whistle has blown at the Paradox arena!\n\n` +
      `🏅 *Sport:* ${match.sport.replace('-', ' ').toUpperCase()}\n` +
      `⚔️ *Battle:* ${match.teamA} vs ${match.teamB}\n` +
      `📊 *Final Score:* ${match.scoreA} - ${match.scoreB}\n\n` +
      `✨ *RESULT:* ${winner === 'DRAW' ? 'THE BATTLE ENDS IN A DRAW!' : winner.toUpperCase() + ' TAKES THE GLORY!'} ✨\n\n` +
      `Check the updated House Table and highlights on the Official Paradox Portal:\n` +
      `🔗 https://sportify-in-paradox2026.vercel.app/`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePushResultToPortal = (match: Match) => {
    const winner = match.scoreA > match.scoreB ? match.teamA : match.scoreB > match.scoreA ? match.teamB : "Draw";
    const msg = `OFFICIAL: ${match.teamA} vs ${match.teamB} ended ${match.scoreA}-${match.scoreB}. ${winner === 'Draw' ? 'Match ends in a draw!' : winner + ' wins!'}`;
    handlePostBroadcast(undefined, msg);
  };

  if (userLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Timer className="animate-spin text-primary" /></div>;
  if (!user || !adminProfile) return null;

  const isSuperAdmin = adminProfile.role === 'super-admin';
  const currentSport = EVENTS.find(e => e.slug === selectedSportSlug);
  const isKampusRun = selectedSportSlug === 'kampus-run';

  if (!selectedSportSlug) {
    return (
      <div className="space-y-6 md:space-y-10 max-w-5xl mx-auto py-6 md:py-10 px-4">
        <div className="flex justify-between items-center border-b border-border pb-4 md:pb-8">
          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-black italic uppercase text-foreground">Control Terminal</h1>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-primary">Domain Select</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="bg-destructive/10 text-destructive hover:bg-destructive/20 text-[9px] md:text-[10px] font-black uppercase h-8 md:h-9 rounded-full px-4 md:px-6">
            <LogOut className="h-3.5 w-3.5 mr-2" /> Logout
          </Button>
        </div>
        
        {/* Global Announcement for ALL admins on root selection screen */}
        <Card className="premium-card border-primary/20 overflow-visible">
          <CardHeader className="p-4 md:p-6 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Megaphone className="h-4 w-4" /> Global Announcement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <form onSubmit={handlePostBroadcast} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input 
                  value={broadcastMessage} 
                  onChange={e => setBroadcastMessage(e.target.value)} 
                  placeholder="Announcement message..." 
                  className="bg-muted/20 h-12 text-xs md:text-sm font-black"
                />
                <Button type="submit" className="h-12 px-8 uppercase font-black text-[10px] tracking-widest w-full sm:w-auto">Broadcast</Button>
              </div>
            </form>
            <div className="mt-6 space-y-3">
               <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-wider">Recent Bulletins</p>
               <div className="space-y-2">
                 {recentBroadcasts?.map(b => (
                   <div key={b.id} className="flex justify-between items-center p-3 bg-muted/10 rounded-lg border border-border">
                     <div className="flex items-center gap-3 flex-1 min-w-0">
                       <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", b.active ? "bg-primary animate-pulse" : "bg-muted")} />
                       <span className="text-[10px] font-bold text-foreground break-words truncate">{b.message}</span>
                     </div>
                     <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/40 hover:text-destructive shrink-0 ml-2" onClick={() => deleteDoc(doc(db!, 'broadcasts', b.id))}><Trash2 className="h-4 w-4" /></Button>
                   </div>
                 ))}
                 {!recentBroadcasts?.length && <p className="text-[10px] italic text-muted-foreground/30 text-center py-4">No recent broadcasts</p>}
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            const shortName = ADMIN_SPORT_NAMES[event.slug] || event.name;
            return (
              <Button key={event.id} variant="ghost" className="p-0 h-auto group text-left" onClick={() => setSelectedSportSlug(event.slug)}>
                <Card className="premium-card w-full h-28 md:h-32">
                  <CardContent className="p-0 flex h-full">
                    <div className="w-1/4 bg-muted/20 flex items-center justify-center border-r border-border">
                      {IconComp && <IconComp className="h-6 w-6 md:h-8 md:w-8 text-primary" />}
                    </div>
                    <div className="w-3/4 p-4 md:p-6 flex flex-col justify-center overflow-hidden">
                      <h2 className="text-lg md:text-xl font-black italic uppercase text-foreground group-hover:text-primary transition-colors truncate">{shortName}</h2>
                      <p className="text-[9px] md:text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">Open Broadcast Controls</p>
                    </div>
                  </CardContent>
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
      <div className="border-b border-border pb-6">
        <Button variant="ghost" size="sm" onClick={() => setSelectedSportSlug(null)} className="p-0 h-auto text-[10px] font-black uppercase text-primary hover:text-primary/70 gap-1.5 mb-2"><ChevronLeft className="h-3.5 w-3.5" /> Switch Sport</Button>
        <h1 className="text-xl md:text-4xl font-black italic uppercase text-foreground">{ADMIN_SPORT_NAMES[currentSport?.slug || ''] || currentSport?.name} Control</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto no-scrollbar justify-start bg-muted/20 h-12 p-1 border border-border rounded-xl gap-1">
          <TabsTrigger value="control" className="flex-1 px-4 text-[9px] md:text-[10px] font-black uppercase rounded-lg">Scoring</TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1 px-4 text-[9px] md:text-[10px] font-black uppercase rounded-lg">Scheduling</TabsTrigger>
          {!isKampusRun && <TabsTrigger value="standings" className="flex-1 px-4 text-[9px] md:text-[10px] font-black uppercase rounded-lg">House Table</TabsTrigger>}
          <TabsTrigger value="history" className="flex-1 px-4 text-[9px] md:text-[10px] font-black uppercase rounded-lg">Archives</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="access" className="flex-1 px-4 text-[9px] md:text-[10px] font-black uppercase rounded-lg">Access</TabsTrigger>}
        </TabsList>

        <TabsContent value="control" className="space-y-6">
          {!isKampusRun && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="premium-card lg:col-span-2">
                <CardContent className="p-4 md:p-12 space-y-8 md:space-y-10">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Select Active Match</Label>
                    <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                      <SelectTrigger className="bg-muted/20 border-border h-12 md:h-14 text-xs md:text-sm font-black uppercase">
                        <SelectValue placeholder="Select Match" />
                      </SelectTrigger>
                      <SelectContent>
                        {matches?.filter(m => m.status !== 'Completed').map(m => (
                          <SelectItem key={m.id} value={m.id} className="text-[10px] font-black uppercase">{m.teamA} vs {m.teamB}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedMatchId && (
                    <form onSubmit={handleUpdateMatch} className="space-y-8 md:space-y-10">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
                        <div className="w-full md:flex-1 space-y-4">
                          <Label className="text-[10px] font-black uppercase block text-center opacity-60 truncate">{activeMatch?.teamA}</Label>
                          <div className="flex items-center justify-center gap-3">
                             <Button type="button" variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-lg" onClick={() => setScoreA(Math.max(0, scoreA - 1))}><Minus className="h-4 w-4" /></Button>
                             <Input type="number" value={scoreA} onChange={e => setScoreA(Number(e.target.value))} className="text-center text-3xl md:text-4xl font-black h-16 md:h-20 bg-muted/20 border-border rounded-xl w-full" />
                             <Button type="button" variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-lg text-primary" onClick={() => setScoreA(scoreA + 1)}><Plus className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        <div className="w-full md:flex-1 space-y-4">
                          <Label className="text-[10px] font-black uppercase block text-center opacity-60 truncate">{activeMatch?.teamB}</Label>
                          <div className="flex items-center justify-center gap-3">
                             <Button type="button" variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-lg" onClick={() => setScoreB(Math.max(0, scoreB - 1))}><Minus className="h-4 w-4" /></Button>
                             <Input type="number" value={scoreB} onChange={e => setScoreB(Number(e.target.value))} className="text-center text-3xl md:text-4xl font-black h-16 md:h-20 bg-muted/20 border-border rounded-xl w-full" />
                             <Button type="button" variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-lg text-primary" onClick={() => setScoreB(scoreB + 1)}><Plus className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </div>

                      {selectedSportSlug === 'badminton' && (
                        <div className="space-y-6 pt-6 border-t border-border">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Sub-Match Details (Badminton)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {badmintonResults.map((res, idx) => (
                              <Card key={res.type} className="bg-muted/10 border-border p-4 space-y-3">
                                <Badge variant="outline" className="text-[9px] font-black">{res.type}</Badge>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-[8px] uppercase opacity-50">Score</Label>
                                    <Input 
                                      value={res.score} 
                                      onChange={e => {
                                        const newRes = [...badmintonResults];
                                        newRes[idx].score = e.target.value;
                                        setBadmintonResults(newRes);
                                      }}
                                      placeholder="21-15"
                                      className="h-8 text-[10px] bg-background"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[8px] uppercase opacity-50">Winner</Label>
                                    <Select 
                                      value={res.winner} 
                                      onValueChange={v => {
                                        const newRes = [...badmintonResults];
                                        newRes[idx].winner = v;
                                        setBadmintonResults(newRes);
                                      }}
                                    >
                                      <SelectTrigger className="h-8 text-[9px] bg-background">
                                        <SelectValue placeholder="House" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {HOUSES.map(h => <SelectItem key={h} value={h} className="text-[9px] font-black uppercase">{h}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase opacity-60">Status</Label>
                        <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                          <SelectTrigger className="bg-muted/20 h-12 text-[10px] font-black uppercase"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Upcoming" className="text-[10px] font-black uppercase">Upcoming</SelectItem>
                            <SelectItem value="Live" className="text-[10px] font-black uppercase">Live</SelectItem>
                            <SelectItem value="Completed" className="text-[10px] font-black uppercase">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full h-12 md:h-14 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20">Commit Broadcast</Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                 <Card className="premium-card">
                   <CardHeader className="p-4 md:p-6 border-b border-border"><CardTitle className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Sparkles className="h-4 w-4" /> Live Highlights</CardTitle></CardHeader>
                   <CardContent className="p-4 md:p-6 space-y-4">
                     {selectedMatchId ? (
                       <>
                         <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase opacity-60">
                             {editingHighlightIndex !== null ? 'Refine Highlight' : 'Log New Highlight'}
                           </Label>
                           <div className="flex gap-2">
                             <Input 
                               value={editingHighlightIndex !== null ? editingHighlightText : newHighlight} 
                               onChange={e => editingHighlightIndex !== null ? setEditingHighlightText(e.target.value) : setNewHighlight(e.target.value)} 
                               placeholder="e.g. Penalty Goal at 35'" 
                               className="bg-muted/20 text-[10px] font-black h-12 flex-1" 
                             />
                             {editingHighlightIndex !== null ? (
                               <div className="flex gap-1">
                                 <Button size="icon" onClick={handleSaveEditHighlight} className="h-12 w-12"><Check className="h-4 w-4" /></Button>
                                 <Button size="icon" variant="ghost" onClick={() => setEditingHighlightIndex(null)} className="h-12 w-12 text-destructive"><X className="h-4 w-4" /></Button>
                               </div>
                             ) : (
                               <Button onClick={handleAddHighlight} className="h-12 px-4 md:px-6 text-[9px] font-black uppercase"><Plus className="h-4 w-4" /></Button>
                             )}
                           </div>
                         </div>
                         <div className="space-y-2 pt-4">
                           <p className="text-[9px] font-black uppercase opacity-40">Timeline</p>
                           <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                             {activeMatch?.keyEvents?.slice().reverse().map((ev, i) => {
                               const originalIndex = activeMatch.keyEvents!.length - 1 - i;
                               return (
                                 <div key={i} className="group bg-muted/20 p-3 rounded text-[10px] border-l-2 border-primary flex justify-between items-center gap-3">
                                   <span className="flex-1 text-foreground leading-tight">{ev}</span>
                                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <Button 
                                       size="icon" 
                                       variant="ghost" 
                                       className="h-7 w-7 text-primary/60 hover:text-primary"
                                       onClick={() => {
                                         setEditingHighlightIndex(originalIndex);
                                         setEditingHighlightText(ev);
                                       }}
                                     >
                                       <Pencil className="h-3 w-3" />
                                     </Button>
                                     <Button 
                                       size="icon" 
                                       variant="ghost" 
                                       className="h-7 w-7 text-destructive/60 hover:text-destructive"
                                       onClick={() => handleDeleteHighlight(originalIndex)}
                                     >
                                       <Trash2 className="h-3 w-3" />
                                     </Button>
                                   </div>
                                 </div>
                               );
                             })}
                           </div>
                         </div>
                       </>
                     ) : (
                       <p className="text-[10px] font-black uppercase opacity-30 text-center py-10 italic">Select a match to manage highlights</p>
                     )}
                   </CardContent>
                 </Card>
              </div>
            </div>
          )}
          {isKampusRun && (
             <Card className="premium-card">
               <CardHeader className="bg-primary/5 border-b border-border py-4"><CardTitle className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-primary">Log Result</CardTitle></CardHeader>
               <CardContent className="p-4 md:p-8">
                 <form onSubmit={handleAddRunResult} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase opacity-60">Participant Name</Label><Input value={runnerName} onChange={e => setRunnerName(e.target.value)} className="bg-muted/20 h-12 md:h-14 border-border text-sm font-black uppercase" placeholder="Full Name" required /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Rank</Label><Input type="number" value={runnerPos} onChange={e => setRunnerPos(Number(e.target.value))} className="bg-muted/20 h-12 md:h-14 border-border text-sm font-black" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Finish Time</Label><Input placeholder="00:00.0" value={runnerTime} onChange={e => setRunnerTime(e.target.value)} className="bg-muted/20 h-12 md:h-14 border-border text-sm font-black" required /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Category</Label><Select value={runnerCat} onValueChange={(v: any) => setRunnerCat(v)}><SelectTrigger className="bg-muted/20 h-12 md:h-14 text-[10px] font-black uppercase"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="3km" className="text-[10px] font-black">3KM</SelectItem><SelectItem value="5km" className="text-[10px] font-black">5KM</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Gender</Label><Select value={runnerGender} onValueChange={(v: any) => setRunnerGender(v)}><SelectTrigger className="bg-muted/20 h-12 md:h-14 text-[10px] font-black uppercase"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="M" className="text-[10px] font-black">Male</SelectItem><SelectItem value="F" className="text-[10px] font-black">Female</SelectItem></SelectContent></Select></div>
                    <Button type="submit" className="h-12 md:h-14 mt-auto uppercase font-black text-[10px] tracking-widest md:col-span-3 rounded-lg"><Plus className="h-5 w-5 mr-2" /> Add to Board</Button>
                 </form>
               </CardContent>
             </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
            <Card className="premium-card">
              <CardHeader className="bg-muted/10 border-b border-border py-4"><CardTitle className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-primary">Schedule Match</CardTitle></CardHeader>
              <CardContent className="p-4 md:p-8">
                <form onSubmit={handleCreateSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Match #</Label><Input value={schedMatchNumber} onChange={e => setSchedMatchNumber(e.target.value)} placeholder="101" className="bg-muted/20 h-12 md:h-14 font-black text-sm" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Phase</Label><Select value={schedPhase} onValueChange={(v: any) => setSchedPhase(v)}><SelectTrigger className="bg-muted/20 h-12 md:h-14 font-black text-[10px] uppercase"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="group" className="text-[10px] font-black uppercase">Group</SelectItem><SelectItem value="semi-final" className="text-[10px] font-black uppercase">Semi Final</SelectItem><SelectItem value="final" className="text-[10px] font-black uppercase">Final</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Team A</Label><Select value={schedTeamA} onValueChange={setSchedTeamA}><SelectTrigger className="bg-muted/20 h-12 md:h-14 font-black text-[10px] uppercase"><SelectValue placeholder="Select House" /></SelectTrigger><SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[10px] font-black uppercase">{h}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Team B</Label><Select value={schedTeamB} onValueChange={setSchedTeamB}><SelectTrigger className="bg-muted/20 h-12 md:h-14 font-black text-[10px] uppercase"><SelectValue placeholder="Select House" /></SelectTrigger><SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[10px] font-black uppercase">{h}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Date</Label><Input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} className="bg-muted/20 h-12 md:h-14 font-black text-sm" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Start Time</Label><Input placeholder="04:30 PM" value={schedTime} onChange={e => setSchedTime(e.target.value)} className="bg-muted/20 h-12 md:h-14 font-black text-sm" required /></div>
                  <div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase opacity-60">Venue</Label><Input value={schedVenue} onChange={e => setSchedVenue(e.target.value)} placeholder="Location" className="bg-muted/20 h-12 md:h-14 font-black text-sm" required /></div>
                  <Button type="submit" className="md:col-span-2 h-12 md:h-14 uppercase font-black text-[10px] tracking-widest rounded-xl mt-4 shadow-xl shadow-primary/10"><Plus className="h-6 w-6 mr-2" /> Add Match</Button>
                </form>
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="standings" className="space-y-6">
           <Card className="premium-card">
             <CardHeader className="bg-muted/10 border-b border-border py-4"><CardTitle className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-primary">Enroll House</CardTitle></CardHeader>
             <CardContent className="p-4 md:p-8">
               <form onSubmit={handleAddStanding} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                 <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">House</Label><Select value={newStandingTeam} onValueChange={setNewStandingTeam}><SelectTrigger className="bg-muted/20 h-12 md:h-14 text-sm font-black uppercase"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[10px] font-black uppercase">{h}</SelectItem>)}</SelectContent></Select></div>
                 <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Pool</Label><Select value={newStandingGroup} onValueChange={setNewStandingGroup}><SelectTrigger className="bg-muted/20 h-12 md:h-14 text-sm font-black"><SelectValue /></SelectTrigger><SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g} className="text-[10px] font-black uppercase">Pool {g}</SelectItem>)}</SelectContent></Select></div>
                 <Button type="submit" className="h-12 md:h-14 uppercase font-black text-[10px] tracking-widest rounded-lg"><Plus className="h-4 w-4 mr-2" /> Enroll House</Button>
               </form>
             </CardContent>
           </Card>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {GROUPS.map(group => {
               const groupItems = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
               if (!groupItems?.length) return null;
               return (
                 <Card key={group} className="premium-card">
                   <CardHeader className="bg-muted/10 border-b border-border py-3 md:py-4"><CardTitle className="text-[10px] md:text-[11px] font-black uppercase text-center tracking-widest text-primary">Pool {group}</CardTitle></CardHeader>
                   <CardContent className="p-0 overflow-x-auto no-scrollbar">
                     <Table>
                       <TableHeader className="bg-muted/20">
                         <TableRow className="border-border">
                           <TableHead className="text-[9px] font-black uppercase px-2 md:px-4">House</TableHead>
                           <TableHead className="text-[9px] font-black uppercase text-center p-1">P</TableHead>
                           <TableHead className="text-[9px] font-black uppercase text-center p-1">W</TableHead>
                           <TableHead className="text-[9px] font-black uppercase text-center p-1">D</TableHead>
                           <TableHead className="text-[9px] font-black uppercase text-center p-1">L</TableHead>
                           <TableHead className="text-[9px] font-black uppercase text-center p-1">Pts</TableHead>
                           <TableHead className="text-right text-[9px] font-black uppercase px-2 md:px-4">X</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                        {groupItems.map(item => (
                          <TableRow key={item.id} className="border-border h-12 md:h-14">
                            <TableCell className="text-[9px] md:text-[10px] font-black uppercase italic px-2 md:px-4 text-foreground truncate max-w-[80px] md:max-w-none">{item.team}</TableCell>
                            <TableCell className="p-1">
                              <Input 
                                type="number" 
                                className="h-7 w-10 md:h-8 md:w-14 text-center text-[10px] md:text-[11px] font-black bg-muted/20 mx-auto text-foreground p-1" 
                                value={item.played} 
                                onChange={e => handleUpdateStanding(item.id, 'played', Number(e.target.value))} 
                              />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input 
                                type="number" 
                                className="h-7 w-10 md:h-8 md:w-14 text-center text-[10px] md:text-[11px] font-black bg-muted/20 mx-auto text-foreground p-1" 
                                value={item.won} 
                                onChange={e => handleUpdateStanding(item.id, 'won', Number(e.target.value))} 
                              />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input 
                                type="number" 
                                className="h-7 w-10 md:h-8 md:w-14 text-center text-[10px] md:text-[11px] font-black bg-muted/20 mx-auto text-foreground p-1" 
                                value={item.drawn} 
                                onChange={e => handleUpdateStanding(item.id, 'drawn', Number(e.target.value))} 
                              />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input 
                                type="number" 
                                className="h-7 w-10 md:h-8 md:w-14 text-center text-[10px] md:text-[11px] font-black bg-muted/20 mx-auto text-foreground p-1" 
                                value={item.lost} 
                                onChange={e => handleUpdateStanding(item.id, 'lost', Number(e.target.value))} 
                              />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input 
                                type="number" 
                                className="h-7 w-10 md:h-8 md:w-14 text-center text-[10px] md:text-[11px] font-black bg-primary/20 border-primary/30 mx-auto text-foreground p-1" 
                                value={item.points} 
                                onChange={e => handleUpdateStanding(item.id, 'points', Number(e.target.value))} 
                              />
                            </TableCell>
                            <TableCell className="text-right px-2 md:px-4">
                              <Button size="icon" variant="ghost" className="h-7 w-7 md:h-8 md:w-8 text-destructive/40 hover:text-destructive" onClick={() => deleteDoc(doc(db!, 'standings', item.id))}><Trash2 className="h-3 w-3 md:h-4 md:w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                       </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="premium-card">
             <CardHeader className="bg-muted/10 border-b border-border py-4"><CardTitle className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><ListOrdered className="h-5 w-5" /> Archive</CardTitle></CardHeader>
             <CardContent className="p-0 overflow-x-auto no-scrollbar">
               {isKampusRun ? (
                 <Table><TableHeader className="bg-muted/20"><TableRow className="border-border"><TableHead className="w-16 text-center text-[9px] font-black px-2 md:px-4">Rank</TableHead><TableHead className="text-[9px] font-black px-2 md:px-6">Runner</TableHead><TableHead className="text-right text-[9px] font-black px-2 md:px-6">X</TableHead></TableRow></TableHeader>
                   <TableBody>{runResults?.map(res => (<TableRow key={res.id} className="border-border h-12 md:h-14"><TableCell className="text-center font-black text-base md:text-lg text-primary px-2 md:px-4">#{res.position}</TableCell><TableCell className="px-2 md:px-6"><p className="text-[10px] md:text-sm font-black uppercase italic text-foreground truncate max-w-[120px] md:max-w-none">{res.name}</p></TableCell><TableCell className="text-right px-2 md:px-6"><Button size="icon" variant="ghost" className="h-7 w-7 md:h-8 md:w-8 text-destructive/40 hover:text-destructive" onClick={() => deleteDoc(doc(db!, 'runResults', res.id))}><Trash2 className="h-3 w-3 md:h-4 md:w-4" /></Button></TableCell></TableRow>))}</TableBody></Table>
               ) : (
                 <Table><TableHeader className="bg-muted/20"><TableRow className="border-border"><TableHead className="text-[9px] font-black px-4 uppercase">Match</TableHead><TableHead className="text-[9px] font-black text-center px-2 uppercase">Score</TableHead><TableHead className="text-right text-[9px] font-black px-4 uppercase">Actions</TableHead></TableRow></TableHeader>
                   <TableBody>{matches?.filter(m => m.status === 'Completed').map(match => (
                     <TableRow key={match.id} className="border-border h-14 md:h-16">
                       <TableCell className="px-4"><p className="text-[10px] md:text-sm font-black uppercase italic break-words max-w-[120px] md:max-w-[200px] text-foreground leading-tight">{match.teamA} vs {match.teamB}</p></TableCell>
                       <TableCell className="text-center font-black text-base md:text-xl text-primary px-2">{match.scoreA} - {match.scoreB}</TableCell>
                       <TableCell className="text-right px-4">
                         <div className="flex justify-end gap-1 md:gap-2">
                            <Button size="icon" variant="ghost" className="h-7 w-7 md:h-8 md:w-8 text-primary/60 hover:text-primary" title="Push Result to Portal" onClick={() => handlePushResultToPortal(match)}><Globe className="h-4 w-4" /></Button>
                            <Button size="icon" variant="outline" className="h-7 w-7 md:h-8 md:w-8 text-primary" onClick={() => handleShareResultBroadcast(match)}><Share2 className="h-3 w-3 md:h-4 md:w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 md:h-8 md:w-8 text-destructive/40 hover:text-destructive" onClick={() => deleteDoc(doc(db!, 'matches', match.id))}><Trash2 className="h-3 w-3 md:h-4 md:w-4" /></Button>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}</TableBody>
                 </Table>
               )}
             </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="access" className="space-y-6">
            <Card className="premium-card border-primary/20"><CardHeader className="bg-primary/5 border-b border-border py-4"><CardTitle className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Admin Access</CardTitle></CardHeader><CardContent className="p-4 md:p-8"><form onSubmit={handleAddPersonnel} className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">UID</Label><Input value={newAdminUid} onChange={e => setNewAdminUid(e.target.value)} className="bg-muted/20 border-border h-12 md:h-14 text-sm font-black" placeholder="Firebase UID" required /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Email</Label><Input value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="bg-muted/20 border-border h-12 md:h-14 text-sm font-black" placeholder="Email" required /></div><div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase opacity-60">Domain</Label><Select value={newAdminSport} onValueChange={setNewAdminSport}><SelectTrigger className="bg-muted/20 h-12 md:h-14 font-black text-[10px] uppercase"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all" className="text-[10px] font-black uppercase">All Sports</SelectItem>{EVENTS.map(e => <SelectItem key={e.id} value={e.slug} className="text-[10px] font-black uppercase">{e.name}</SelectItem>)}</SelectContent></Select></div><Button type="submit" className="md:col-span-2 h-12 md:h-14 uppercase font-black text-[10px] tracking-widest rounded-lg mt-4 shadow-xl shadow-primary/10"><UserPlus className="h-5 w-5 mr-2" /> Assign Permissions</Button></form></CardContent></Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
