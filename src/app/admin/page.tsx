
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { EVENTS } from '@/lib/mock-data';
import { 
  Plus, Trophy, Timer, Trash2, Zap, CircleDot, Target, Minus, 
  Megaphone, Star, MapPin, ClipboardList, ListOrdered, Settings, Medal, Share2, Edit2, X, Radio, Clock, UserPlus, ShieldCheck, Info, LogOut, CalendarDays, BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useAuth, useDoc } from '@/firebase';
import { 
  collection, doc, query, where, serverTimestamp, 
  addDoc, updateDoc, deleteDoc, orderBy, limit, setDoc
} from 'firebase/firestore';
import { Match, RunResult, SportType, Trial, Standing, HOUSES, MatchPhase, GROUPS, Broadcast, AdminUser, SportEvent, BadmintonMatchResult, ChampionshipStanding } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { triggerHaptic } from '@/lib/haptics';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
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
  const [editingBroadcastId, setEditingBroadcastId] = useState<string | null>(null);

  // --- Score Control State ---
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [matchWinner, setMatchWinner] = useState<string>('');
  const [status, setStatus] = useState<'Upcoming' | 'Live' | 'Completed'>('Live');
  
  // --- Badminton Results State ---
  const [badmintonResults, setBadmintonResults] = useState<BadmintonMatchResult[]>([
    { type: 'MS', score: '0-0', winner: '' },
    { type: 'WS', score: '0-0', winner: '' },
    { type: 'MD', score: '0-0', winner: '' },
    { type: 'XD', score: '0-0', winner: '' }
  ]);

  // --- Championship Points State ---
  const [newChampionship, setNewChampionship] = useState<Partial<ChampionshipStanding>>({
    house: '', gold: 0, silver: 0, bronze: 0, points: 0
  });

  // --- Kampus Run Results State ---
  const [runResult, setRunResult] = useState<Partial<RunResult>>({
    name: '', position: 1, time: '', gender: 'M', ageGroup: '18-25', category: '5km'
  });

  // --- Kampus Run Schedule State ---
  const [raceSchedule, setRaceSchedule] = useState({
    reportingTime: '', flagOffTime: '', notes: ''
  });

  // --- System Admin Management State ---
  const [newAdmin, setNewAdmin] = useState<Partial<AdminUser>>({ uid: '', email: '', role: 'admin', assignedSport: 'all' });
  const [editingAdminUid, setEditingAdminUid] = useState<string | null>(null);

  // --- New Item States ---
  const [newMatch, setNewMatch] = useState<Partial<Match>>({
    matchNumber: '', teamA: '', teamB: '', phase: 'group', time: '', date: '', day: '', venue: ''
  });
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  const [newTrial, setNewTrial] = useState<Partial<Trial>>({
    house: '', date: '', time: '', venue: '', notes: ''
  });
  const [editingTrialId, setEditingTrialId] = useState<string | null>(null);

  const [newStanding, setNewStanding] = useState<Partial<Standing>>({
    team: '', played: 0, won: 0, drawn: 0, lost: 0, points: 0, group: 'A'
  });
  const [editingStandingId, setEditingStandingId] = useState<string | null>(null);

  // --- Data Fetching ---
  const broadcastsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'broadcasts'), orderBy('timestamp', 'desc'), limit(15));
  }, [db]);
  const { data: broadcasts } = useCollection<Broadcast>(broadcastsQuery);

  const rawMatchesQuery = useMemo(() => {
    if (!db || !selectedSportSlug) return null;
    return query(collection(db, 'matches'), where('sport', '==', selectedSportSlug));
  }, [db, selectedSportSlug]);
  const { data: rawMatches } = useCollection<Match>(rawMatchesQuery);

  const trialsQuery = useMemo(() => {
    if (!db || !selectedSportSlug) return null;
    return query(collection(db, 'trials'), where('sport', '==', selectedSportSlug));
  }, [db, selectedSportSlug]);
  const { data: rawTrials } = useCollection<Trial>(trialsQuery);

  const standingsQuery = useMemo(() => {
    if (!db || !selectedSportSlug) return null;
    return query(collection(db, 'standings'), where('sport', '==', selectedSportSlug));
  }, [db, selectedSportSlug]);
  const { data: standings } = useCollection<Standing>(standingsQuery);

  const championshipQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'championship'), orderBy('points', 'desc'));
  }, [db]);
  const { data: championshipStandings } = useCollection<ChampionshipStanding>(championshipQuery);

  const runResultsQuery = useMemo(() => {
    if (!db || selectedSportSlug !== 'kampus-run') return null;
    return query(collection(db, 'runResults'), orderBy('position', 'asc'));
  }, [db, selectedSportSlug]);
  const { data: runResults } = useCollection<RunResult>(runResultsQuery);

  const adminsQuery = useMemo(() => {
    if (!db || adminProfile?.role !== 'super-admin') return null;
    return query(collection(db, 'admins'));
  }, [db, adminProfile]);
  const { data: allAdmins } = useCollection<AdminUser>(adminsQuery);

  const eventDocRef = useMemo(() => selectedSportSlug ? doc(db!, 'events', selectedSportSlug) : null, [db, selectedSportSlug]);
  const { data: currentEventData } = useDoc<SportEvent>(eventDocRef);

  useEffect(() => {
    if (currentEventData && selectedSportSlug === 'kampus-run') {
      setRaceSchedule({
        reportingTime: currentEventData.reportingTime || '',
        flagOffTime: currentEventData.flagOffTime || '',
        notes: currentEventData.notes || ''
      });
    }
  }, [currentEventData, selectedSportSlug]);

  const matches = useMemo(() => {
    return [...(rawMatches || [])].sort((a, b) => (parseInt(a.matchNumber) || 0) - (parseInt(b.matchNumber) || 0));
  }, [rawMatches]);

  const groupedStandings = useMemo(() => {
    if (!standings) return {};
    return GROUPS.reduce((acc, g) => {
      acc[g] = standings.filter(s => s.group === g).sort((a, b) => b.points - a.points);
      return acc;
    }, {} as Record<string, Standing[]>);
  }, [standings]);

  useEffect(() => {
    if (!userLoading && !user) router.push('/admin/login');
  }, [user, userLoading, router]);

  useEffect(() => {
    if (adminProfile && adminProfile.role !== 'super-admin' && adminProfile.assignedSport !== 'all') {
      setSelectedSportSlug(adminProfile.assignedSport as SportType);
    }
  }, [adminProfile]);

  const activeMatch = useMemo(() => matches?.find(m => m.id === selectedMatchId), [matches, selectedMatchId]);
  const lastMatchIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeMatch && selectedMatchId !== lastMatchIdRef.current) {
      setScoreA(activeMatch.scoreA || 0);
      setScoreB(activeMatch.scoreB || 0);
      setStatus(activeMatch.status as any || 'Live');
      setMatchWinner(activeMatch.winner || '');
      if (activeMatch.badmintonResults) {
        setBadmintonResults(activeMatch.badmintonResults);
      } else {
        setBadmintonResults([
          { type: 'MS', score: '0-0', winner: '' },
          { type: 'WS', score: '0-0', winner: '' },
          { type: 'MD', score: '0-0', winner: '' },
          { type: 'XD', score: '0-0', winner: '' }
        ]);
      }
      lastMatchIdRef.current = selectedMatchId;
    }
  }, [activeMatch, selectedMatchId]);

  const handlePostBroadcast = (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    triggerHaptic('medium');
    const messageToPost = customMsg || broadcastMessage;
    if (!db || !messageToPost) return;

    if (editingBroadcastId && !customMsg) {
      updateDoc(doc(db, 'broadcasts', editingBroadcastId), {
        message: messageToPost,
        updatedAt: serverTimestamp(),
      });
      setEditingBroadcastId(null);
      toast({ title: "Broadcast updated." });
    } else {
      addDoc(collection(db, 'broadcasts'), { 
        message: messageToPost, 
        active: true, 
        timestamp: serverTimestamp() 
      });
      toast({ title: "Broadcast published." });
    }
    
    if (!customMsg) setBroadcastMessage('');
  };

  const handleUpdateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !db) return;
    triggerHaptic('heavy');
    
    const prevStatus = activeMatch?.status;
    
    updateDoc(doc(db, 'matches', selectedMatchId), {
      scoreA: Number(scoreA), 
      scoreB: Number(scoreB), 
      status, 
      winner: matchWinner,
      badmintonResults: selectedSportSlug === 'badminton' ? badmintonResults : null,
      updatedAt: serverTimestamp(),
    });
    
    if (status === 'Live' && prevStatus !== 'Live') {
      const msg = `📢 LIVE ACTION ALERT: ${activeMatch?.teamA} vs ${activeMatch?.teamB} (${selectedSportSlug?.toUpperCase()}) is NOW LIVE!`;
      handlePostBroadcast(undefined, msg);
    } else if (status === 'Completed' && prevStatus !== 'Completed') {
      const msg = `📢 FINAL RESULT ALERT: ${activeMatch?.teamA} ${scoreA} - ${scoreB} ${activeMatch?.teamB}. Winner: ${matchWinner || 'N/A'}`;
      handlePostBroadcast(undefined, msg);
    }
    
    toast({ title: "Match updated." });
  };

  const handleUpdateRaceSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || selectedSportSlug !== 'kampus-run') return;
    triggerHaptic('medium');
    updateDoc(doc(db, 'events', 'kampus-run'), {
      reportingTime: raceSchedule.reportingTime,
      flagOffTime: raceSchedule.flagOffTime,
      notes: raceSchedule.notes,
      updatedAt: serverTimestamp(),
    });
    toast({ title: "Race information updated." });
  };

  const handleBroadcastTrialStart = (trial: Trial) => {
    if (!db) return;
    triggerHaptic('heavy');
    const sportName = EVENTS.find(e => e.slug === trial.sport)?.name || trial.sport;
    const msg = `📢 TRIAL ALERT: ${trial.house} ${sportName.toUpperCase()} selection is starting now at ${trial.venue}! Report immediately.`;
    handlePostBroadcast(undefined, msg);
  };

  const handleSaveChampionship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newChampionship.house) return;
    triggerHaptic('medium');
    const docId = newChampionship.house.toLowerCase().replace(/\s+/g, '-');
    setDoc(doc(db, 'championship', docId), {
      ...newChampionship,
      updatedAt: serverTimestamp()
    }, { merge: true });
    setNewChampionship({ house: '', gold: 0, silver: 0, bronze: 0, points: 0 });
    toast({ title: "Championship tally updated." });
  };

  const handleSaveAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newAdmin.uid || !newAdmin.email) return;
    triggerHaptic('medium');
    const { createdAt, ...updateData } = newAdmin as any;
    const adminData: any = {
      ...updateData,
      updatedAt: serverTimestamp(),
    };
    if (!editingAdminUid) {
      adminData.createdAt = serverTimestamp();
    }
    setDoc(doc(db, 'admins', newAdmin.uid), adminData, { merge: true });
    setNewAdmin({ uid: '', email: '', role: 'admin', assignedSport: 'all' });
    setEditingAdminUid(null);
    toast({ title: editingAdminUid ? "Admin updated." : "New admin added." });
  };

  const handleEditAdmin = (admin: AdminUser) => {
    triggerHaptic('light');
    setNewAdmin(admin);
    setEditingAdminUid(admin.uid);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAdmin = (uid: string) => {
    if (!db) return;
    triggerHaptic('error');
    deleteDoc(doc(db, 'admins', uid));
    toast({ title: "Admin removed." });
  };

  const handleEditBroadcast = (b: Broadcast) => {
    triggerHaptic('light');
    setBroadcastMessage(b.message);
    setEditingBroadcastId(b.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBroadcast = (id: string) => {
    if (!db) return;
    triggerHaptic('error');
    deleteDoc(doc(db, 'broadcasts', id));
    toast({ title: "Broadcast removed." });
  };

  const handleAddRunResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !runResult.name || !runResult.time) return;
    triggerHaptic('medium');
    addDoc(collection(db, 'runResults'), { 
      ...runResult, 
      createdAt: serverTimestamp() 
    });
    setRunResult({ ...runResult, name: '', position: (runResult.position || 0) + 1, time: '' });
    toast({ title: "Run result added." });
  };

  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedSportSlug) return;
    triggerHaptic('medium');
    const matchData = {
      ...newMatch,
      sport: selectedSportSlug,
      updatedAt: serverTimestamp()
    };
    if (editingMatchId) {
      updateDoc(doc(db, 'matches', editingMatchId), matchData);
      setEditingMatchId(null);
      toast({ title: "Fixture updated." });
    } else {
      addDoc(collection(db, 'matches'), { 
        ...matchData, 
        scoreA: 0, 
        scoreB: 0, 
        status: 'Upcoming', 
        createdAt: serverTimestamp() 
      });
      toast({ title: "Fixture added." });
    }
    setNewMatch({ matchNumber: '', teamA: '', teamB: '', phase: 'group', time: '', date: '', day: '', venue: '' });
  };

  const handleAddOrUpdateTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedSportSlug || !newTrial.house) return;
    triggerHaptic('medium');
    if (editingTrialId) {
      updateDoc(doc(db, 'trials', editingTrialId), { 
        ...newTrial, 
        updatedAt: serverTimestamp() 
      });
      setEditingTrialId(null);
      toast({ title: "Trial schedule updated." });
    } else {
      addDoc(collection(db, 'trials'), { 
        ...newTrial, 
        sport: selectedSportSlug, 
        createdAt: serverTimestamp() 
      });
      toast({ title: "Trial scheduled successfully." });
    }
    setNewTrial({ house: '', date: '', time: '', venue: '', notes: '' });
  };

  const handleAddOrUpdateStanding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedSportSlug || !newStanding.team) return;
    triggerHaptic('medium');
    if (editingStandingId) {
      updateDoc(doc(db, 'standings', editingStandingId), { 
        ...newStanding, 
        updatedAt: serverTimestamp() 
      });
      setEditingStandingId(null);
      toast({ title: "Standing updated." });
    } else {
      addDoc(collection(db, 'standings'), { 
        ...newStanding, 
        sport: selectedSportSlug, 
        createdAt: serverTimestamp() 
      });
      toast({ title: "House added to group." });
    }
    setNewStanding({ team: '', played: 0, won: 0, drawn: 0, lost: 0, points: 0, group: 'A' });
  };

  const updateBadmintonResult = (index: number, field: keyof BadmintonMatchResult, value: string) => {
    const updated = [...badmintonResults];
    updated[index] = { ...updated[index], [field]: value };
    setBadmintonResults(updated);
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  if (userLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Timer className="animate-spin text-primary" /></div>;
  if (!user || !adminProfile) return null;

  const isKampusRun = selectedSportSlug === 'kampus-run';
  const isSuperAdmin = adminProfile.role === 'super-admin';
  const isSportSpecificAdmin = adminProfile.role === 'admin' && adminProfile.assignedSport !== 'all';

  if (!selectedSportSlug) {
    return (
      <div className="space-y-10 max-w-5xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center border-b border-border pb-6">
          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-black uppercase text-foreground tracking-tighter">Admin Terminal</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Paradox 2026 Core</p>
          </div>
          <div className="flex gap-2">
            {isSuperAdmin && (
              <Button variant="outline" size="sm" onClick={() => { triggerHaptic('light'); setActiveTab(activeTab === 'system' ? 'control' : 'system'); }} className="text-[9px] font-black uppercase rounded-sm px-6">
                {activeTab === 'system' ? 'Control Panel' : 'System Mgmt'}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => { triggerHaptic('error'); signOut(auth); }} className="bg-destructive/10 text-destructive text-[9px] font-black uppercase rounded-sm px-6">Logout</Button>
          </div>
        </div>
        
        {isSuperAdmin && activeTab === 'system' && (
          <div className="space-y-12">
            <Card className="premium-card">
              <CardHeader><CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Manage Access</CardTitle></CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveAdmin} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase">UID</Label><Input value={newAdmin.uid} onChange={e => setNewAdmin({...newAdmin, uid: e.target.value})} className="bg-muted/20 h-11" required disabled={!!editingAdminUid} /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase">Email</Label><Input type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} className="bg-muted/20 h-11" required /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase">Role</Label>
                    <Select value={newAdmin.role} onValueChange={v => setNewAdmin({...newAdmin, role: v as any})}>
                      <SelectTrigger className="bg-muted/20 h-11"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="super-admin">Super Admin</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase">Assigned Sport</Label>
                    <Select value={newAdmin.assignedSport} onValueChange={v => setNewAdmin({...newAdmin, assignedSport: v})}>
                      <SelectTrigger className="bg-muted/20 h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sports</SelectItem>
                        {EVENTS.map(e => <SelectItem key={e.id} value={e.slug}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-4 flex gap-2">
                    <Button type="submit" className="flex-1 h-11 uppercase font-black text-[10px]">{editingAdminUid ? 'Update Access' : 'Add Access'}</Button>
                  </div>
                </form>
                <div className="space-y-3">
                  {allAdmins?.map(a => (
                    <div key={a.uid} className="flex items-center justify-between p-4 bg-muted/10 rounded-sm border border-border/40">
                      <div>
                        <p className="text-[11px] font-black uppercase">{a.email}</p>
                        <p className="text-[8px] opacity-40 font-bold uppercase">{a.role} • {a.assignedSport === 'all' ? 'All Sports' : a.assignedSport?.toUpperCase()}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="text-primary" onClick={() => handleEditAdmin(a)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAdmin(a.uid)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardHeader><CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Championship Points</CardTitle></CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveChampionship} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase">House</Label>
                    <Select value={newChampionship.house} onValueChange={v => setNewChampionship({...newChampionship, house: v})}>
                      <SelectTrigger className="bg-muted/20 h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase">Gold</Label><Input type="number" value={newChampionship.gold} onChange={e => setNewChampionship({...newChampionship, gold: Number(e.target.value)})} className="bg-muted/20 h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase">Silver</Label><Input type="number" value={newChampionship.silver} onChange={e => setNewChampionship({...newChampionship, silver: Number(e.target.value)})} className="bg-muted/20 h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase">Bronze</Label><Input type="number" value={newChampionship.bronze} onChange={e => setNewChampionship({...newChampionship, bronze: Number(e.target.value)})} className="bg-muted/20 h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase">Total Points</Label><Input type="number" value={newChampionship.points} onChange={e => setNewChampionship({...newChampionship, points: Number(e.target.value)})} className="bg-muted/20 h-11" /></div>
                  <Button type="submit" className="md:col-span-2 lg:col-span-5 h-11 uppercase font-black text-[10px]">Update Tally</Button>
                </form>
                <div className="space-y-3">
                  {championshipStandings?.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-muted/10 rounded-sm border border-border/40">
                      <div>
                        <p className="text-[11px] font-black uppercase">{s.house}</p>
                        <p className="text-[8px] opacity-40 font-bold uppercase">G: {s.gold} • S: {s.silver} • B: {s.bronze} • PTS: {s.points}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setNewChampionship(s)}><Edit2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab !== 'system' && (
          <>
            <Card className="premium-card">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Megaphone className="h-4 w-4" /> Global Broadcast Push
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handlePostBroadcast} className="flex flex-col gap-3">
                  <Input 
                    value={broadcastMessage} 
                    onChange={e => setBroadcastMessage(e.target.value)} 
                    placeholder="Type announcement..." 
                    className="bg-muted/20 h-12 text-xs font-black uppercase" 
                  />
                  <Button type="submit" className="h-12 w-full uppercase font-black text-[10px] tracking-widest gap-2">
                    <Radio className="h-4 w-4" /> Transmit Broadcast
                  </Button>
                </form>
              </CardContent>
            </Card>

            <section className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary px-2">Broadcast Archive</h2>
              <div className="grid grid-cols-1 gap-3">
                {broadcasts?.map((b) => (
                  <Card key={b.id} className="premium-card bg-muted/5 border-border/40">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] md:text-[11px] font-bold text-foreground leading-relaxed italic">"{b.message}"</p>
                        <div className="flex items-center gap-2 opacity-40">
                          <Clock className="h-3 w-3" />
                          <span className="text-[8px] font-black uppercase tracking-widest">{formatTimestamp(b.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEditBroadcast(b)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteBroadcast(b.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EVENTS.filter(e => isSuperAdmin || adminProfile.assignedSport === 'all' || e.slug === adminProfile.assignedSport).map((event) => {
                const IconComp = ICON_MAP[event.icon];
                return (
                  <Button key={event.id} variant="ghost" className="p-0 h-auto text-left w-full" onClick={() => { triggerHaptic('light'); setSelectedSportSlug(event.slug); }}>
                    <Card className="premium-card w-full min-h-[80px] py-4 flex items-center px-4 sm:px-6 gap-3 sm:gap-6 hover:bg-muted/10">
                      <div className="h-10 w-10 md:h-12 md:w-12 bg-muted/20 rounded-sm flex items-center justify-center border border-border shrink-0">
                        {IconComp && <IconComp className="h-5 w-5 md:h-6 md:w-6 text-primary" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xs sm:text-sm md:text-lg font-black uppercase text-foreground tracking-tight line-clamp-2 leading-tight">{event.name}</h2>
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Broadcast Control</p>
                      </div>
                    </Card>
                  </Button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 px-4">
      <div className="border-b border-border pb-6 pt-4 flex items-center justify-between">
        <div>
          {!isSportSpecificAdmin && (
            <Button variant="ghost" size="sm" onClick={() => { triggerHaptic('light'); setSelectedSportSlug(null); }} className="p-0 h-auto text-[10px] font-black uppercase text-primary gap-1.5 mb-2">Switch Terminal</Button>
          )}
          <h1 className="text-lg md:text-4xl font-black uppercase text-foreground tracking-tighter truncate">{EVENTS.find(e => e.slug === selectedSportSlug)?.name}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { triggerHaptic('error'); signOut(auth); }} className="h-10 text-destructive bg-destructive/5 text-[9px] font-black uppercase px-4 rounded-sm flex items-center gap-2">
          <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { triggerHaptic('light'); setActiveTab(v); }} className="space-y-6">
        <TabsList className="flex w-full bg-muted/20 border border-border p-1 h-14 rounded-sm overflow-x-auto no-scrollbar flex-nowrap justify-start md:justify-center">
          <TabsTrigger value="control" className="shrink-0 text-[10px] font-black uppercase px-6 h-full data-[state=active]:bg-background">{isKampusRun ? 'Race Results' : 'Live Feed'}</TabsTrigger>
          {isKampusRun && <TabsTrigger value="schedule" className="shrink-0 text-[10px] font-black uppercase px-6 h-full data-[state=active]:bg-background">Race Info</TabsTrigger>}
          {!isKampusRun && <TabsTrigger value="fixtures" className="shrink-0 text-[10px] font-black uppercase px-6 h-full data-[state=active]:bg-background">Fixtures</TabsTrigger>}
          {!isKampusRun && <TabsTrigger value="trials" className="shrink-0 text-[10px] font-black uppercase px-6 h-full data-[state=active]:bg-background">Trials</TabsTrigger>}
          {!isKampusRun && <TabsTrigger value="standings" className="shrink-0 text-[10px] font-black uppercase px-6 h-full data-[state=active]:bg-background">Standings</TabsTrigger>}
        </TabsList>

        <TabsContent value="control" className="space-y-6">
          {isKampusRun ? (
            <div className="space-y-10">
              <Card className="premium-card">
                <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Trophy className="h-4 w-4" /> Enter Race Outcome</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAddRunResult} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase">Participant Name</Label>
                      <Input value={runResult.name} onChange={e => setRunResult({...runResult, name: e.target.value})} className="bg-muted/20 h-11" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase">Position</Label>
                      <Input type="number" value={runResult.position} onChange={e => setRunResult({...runResult, position: Number(e.target.value)})} className="bg-muted/20 h-11" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase">Time</Label>
                      <Input value={runResult.time} onChange={e => setRunResult({...runResult, time: e.target.value})} className="bg-muted/20 h-11" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase">Gender</Label>
                      <Select value={runResult.gender} onValueChange={v => setRunResult({...runResult, gender: v as any})}>
                        <SelectTrigger className="bg-muted/20 h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase">Age Group</Label>
                      <Select value={runResult.ageGroup} onValueChange={v => setRunResult({...runResult, ageGroup: v})}>
                        <SelectTrigger className="bg-muted/20 h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="18-25">18-25</SelectItem>
                          <SelectItem value="26+">26+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase">Category</Label>
                      <Select value={runResult.category} onValueChange={v => setRunResult({...runResult, category: v})}>
                        <SelectTrigger className="bg-muted/20 h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3km">3KM</SelectItem>
                          <SelectItem value="5km">5KM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="lg:col-span-3 h-12 uppercase font-black text-[10px] tracking-widest">Publish Result</Button>
                  </form>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 gap-3">
                {runResults?.map(r => (
                  <div key={r.id} className="premium-card p-4 flex items-center justify-between bg-muted/5">
                    <div>
                      <p className="text-[11px] font-black uppercase">#{r.position} {r.name}</p>
                      <p className="text-[8px] opacity-40 uppercase font-black">{r.time} • {r.gender} • {r.ageGroup} • {r.category.toUpperCase()}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDoc(doc(db!, 'runResults', r.id))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card className="premium-card">
              <CardContent className="p-6 md:p-12 space-y-10">
                <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                  <SelectTrigger className="bg-muted/20 h-12 font-black uppercase"><SelectValue placeholder="Select Match" /></SelectTrigger>
                  <SelectContent>
                    {matches?.filter(m => m.status !== 'Completed').map(m => (
                      <SelectItem key={m.id} value={m.id} className="text-[10px] font-black uppercase">{m.teamA} vs {m.teamB}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedMatchId && (
                  <form onSubmit={handleUpdateMatch} className="space-y-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                      <div className="w-full md:flex-1 space-y-4">
                        <Label className="text-[10px] font-black uppercase block text-center opacity-60">{activeMatch?.teamA}</Label>
                        <Input type="number" value={scoreA} onChange={e => setScoreA(Number(e.target.value))} className="text-center text-4xl font-black h-20 bg-muted/20 border-none" />
                      </div>
                      <div className="w-full md:flex-1 space-y-4">
                        <Label className="text-[10px] font-black uppercase block text-center opacity-60">{activeMatch?.teamB}</Label>
                        <Input type="number" value={scoreB} onChange={e => setScoreB(Number(e.target.value))} className="text-center text-4xl font-black h-20 bg-muted/20 border-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase opacity-50">Match Status</Label>
                        <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                          <SelectTrigger className="h-11 bg-muted/20"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Upcoming">Upcoming</SelectItem>
                            <SelectItem value="Live">Live</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase opacity-50">Winner (If Completed)</Label>
                        <Select value={matchWinner} onValueChange={setMatchWinner}>
                          <SelectTrigger className="h-11 bg-muted/20"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={activeMatch?.teamA || 'A'}>{activeMatch?.teamA}</SelectItem>
                            <SelectItem value={activeMatch?.teamB || 'B'}>{activeMatch?.teamB}</SelectItem>
                            <SelectItem value="Draw">Draw</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {selectedSportSlug === 'badminton' && (
                      <div className="space-y-6 bg-muted/10 p-6 rounded-sm border border-border">
                        <h3 className="text-xs font-black uppercase text-primary">Sub-Match Results</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {badmintonResults.map((res, idx) => (
                            <div key={res.type} className="flex gap-2">
                              <Input placeholder="Score" value={res.score} onChange={(e) => updateBadmintonResult(idx, 'score', e.target.value)} className="h-10 bg-muted/20 text-[10px] font-black uppercase" />
                              <Select value={res.winner} onValueChange={(v) => updateBadmintonResult(idx, 'winner', v)}>
                                <SelectTrigger className="h-10 bg-muted/20 text-[9px] font-black uppercase"><SelectValue placeholder="Winner" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={activeMatch?.teamA || 'Team A'}>{activeMatch?.teamA}</SelectItem>
                                  <SelectItem value={activeMatch?.teamB || 'Team B'}>{activeMatch?.teamB}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button type="submit" className="w-full h-14 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">Push Update</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {isKampusRun && (
          <TabsContent value="schedule" className="px-4">
            <Card className="premium-card">
              <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Clock className="h-4 w-4" /> Edit Race Info</CardTitle></CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleUpdateRaceSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Reporting Time</Label><Input placeholder="e.g. 05:00 AM" value={raceSchedule.reportingTime} onChange={e => setRaceSchedule({...raceSchedule, reportingTime: e.target.value})} className="bg-muted/20 h-11" required /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Flag Off Time</Label><Input placeholder="e.g. 05:30 AM" value={raceSchedule.flagOffTime} onChange={e => setRaceSchedule({...raceSchedule, flagOffTime: e.target.value})} className="bg-muted/20 h-11" required /></div>
                  <div className="md:col-span-2 space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Race Notes</Label><Textarea placeholder="Instructions..." value={raceSchedule.notes} onChange={e => setRaceSchedule({...raceSchedule, notes: e.target.value})} className="bg-muted/20 min-h-[100px]" /></div>
                  <Button type="submit" className="md:col-span-2 h-12 uppercase font-black text-[10px]">Update Race Info</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="fixtures" className="space-y-10">
          <Card className="premium-card">
            <CardHeader><CardTitle className="text-[10px] font-black uppercase text-primary">Schedule Match</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddMatch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Match #" value={newMatch.matchNumber} onChange={e => setNewMatch({...newMatch, matchNumber: e.target.value})} className="bg-muted/20 h-11" required />
                <Select value={newMatch.teamA} onValueChange={v => setNewMatch({...newMatch, teamA: v})}>
                  <SelectTrigger className="bg-muted/20 h-11"><SelectValue placeholder="Team A" /></SelectTrigger>
                  <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={newMatch.teamB} onValueChange={v => setNewMatch({...newMatch, teamB: v})}>
                  <SelectTrigger className="bg-muted/20 h-11"><SelectValue placeholder="Team B" /></SelectTrigger>
                  <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="date" value={newMatch.date} onChange={e => setNewMatch({...newMatch, date: e.target.value})} className="bg-muted/20 h-11" required />
                <Input placeholder="Time" value={newMatch.time} onChange={e => setNewMatch({...newMatch, time: e.target.value})} className="bg-muted/20 h-11" required />
                <Input placeholder="Venue" value={newMatch.venue} onChange={e => setNewMatch({...newMatch, venue: e.target.value})} className="bg-muted/20 h-11" required />
                <Button type="submit" className="md:col-span-2 h-12 uppercase font-black text-[10px]">Schedule Match</Button>
              </form>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-3">
            {matches?.map(m => (
              <div key={m.id} className="premium-card p-4 flex items-center justify-between bg-muted/5">
                <div>
                  <p className="text-[11px] font-black uppercase">{m.teamA} vs {m.teamB} (#{m.matchNumber})</p>
                  <p className="text-[8px] opacity-40 uppercase font-black">{m.date} • {m.time}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { triggerHaptic('light'); setNewMatch(m); setEditingMatchId(m.id); }}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDoc(doc(db!, 'matches', m.id))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trials" className="space-y-10">
          <Card className="premium-card">
            <CardHeader><CardTitle className="text-[10px] font-black uppercase text-primary">Schedule Selection Trials</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddOrUpdateTrial} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select value={newTrial.house} onValueChange={v => setNewTrial({...newTrial, house: v})}>
                  <SelectTrigger className="bg-muted/20 h-11"><SelectValue placeholder="Select House" /></SelectTrigger>
                  <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Venue" value={newTrial.venue} onChange={e => setNewTrial({...newTrial, venue: e.target.value})} className="bg-muted/20 h-11" required />
                <Input type="date" value={newTrial.date} onChange={e => setNewTrial({...newTrial, date: e.target.value})} className="bg-muted/20 h-11" required />
                <Input placeholder="Time" value={newTrial.time} onChange={e => setNewTrial({...newTrial, time: e.target.value})} className="bg-muted/20 h-11" required />
                <Button type="submit" className="md:col-span-2 h-12 uppercase font-black text-[10px]">Publish Selection Schedule</Button>
              </form>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-3">
            {rawTrials?.map(t => (
              <div key={t.id} className="premium-card p-4 flex items-center justify-between bg-muted/5">
                <div>
                  <p className="text-[11px] font-black uppercase">{t.house} Trials</p>
                  <p className="text-[8px] opacity-40 uppercase font-black">{t.venue} • {t.date} • {t.time}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-primary" onClick={() => { triggerHaptic('light'); setNewTrial(t); setEditingTrialId(t.id); }}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" className="h-8 text-[8px] font-black uppercase" onClick={() => handleBroadcastTrialStart(t)}>Broadcast Start</Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDoc(doc(db!, 'trials', t.id))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="standings" className="space-y-12">
          <Card className="premium-card">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <ListOrdered className="h-4 w-4" /> Assign House to Group
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddOrUpdateStanding} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-40">Team</Label>
                    <Select value={newStanding.team} onValueChange={v => setNewStanding({...newStanding, team: v})}>
                      <SelectTrigger className="bg-muted/20 h-11"><SelectValue placeholder="Select House" /></SelectTrigger>
                      <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-40">Group</Label>
                    <Select value={newStanding.group} onValueChange={v => setNewStanding({...newStanding, group: v})}>
                      <SelectTrigger className="bg-muted/20 h-11"><SelectValue placeholder="Group" /></SelectTrigger>
                      <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g}>Group {g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-40">Played</Label>
                    <Input type="number" value={newStanding.played} onChange={e => setNewStanding({...newStanding, played: Number(e.target.value)})} className="bg-muted/20 h-11" placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-40">Wins</Label>
                    <Input type="number" value={newStanding.won} onChange={e => setNewStanding({...newStanding, won: Number(e.target.value)})} className="bg-muted/20 h-11" placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-40">Draws</Label>
                    <Input type="number" value={newStanding.drawn} onChange={e => setNewStanding({...newStanding, drawn: Number(e.target.value)})} className="bg-muted/20 h-11" placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-40">Losses</Label>
                    <Input type="number" value={newStanding.lost} onChange={e => setNewStanding({...newStanding, lost: Number(e.target.value)})} className="bg-muted/20 h-11" placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-40">Points</Label>
                    <Input type="number" value={newStanding.points} onChange={e => setNewStanding({...newStanding, points: Number(e.target.value)})} className="bg-muted/20 h-11" placeholder="0" />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full h-11 uppercase font-black text-[10px] tracking-widest">{editingStandingId ? 'Update Standing' : 'Assign to Group'}</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          {GROUPS.map(g => (
            <div key={g} className="space-y-4">
              <h3 className="text-[9px] font-black uppercase tracking-widest opacity-40 px-2">Group {g}</h3>
              {groupedStandings[g]?.map(s => (
                <div key={s.id} className="premium-card p-4 flex items-center justify-between bg-muted/5">
                  <div>
                    <p className="text-[11px] font-black uppercase">{s.team}</p>
                    <p className="text-[8px] opacity-40 uppercase font-black">P: {s.played} • W: {s.won} • D: {s.drawn} • L: {s.lost} • PTS: {s.points}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { triggerHaptic('light'); setNewStanding(s); setEditingStandingId(s.id); }}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { triggerHaptic('error'); deleteDoc(doc(db!, 'standings', s.id)); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
