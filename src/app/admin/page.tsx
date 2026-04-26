
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { EVENTS } from '@/lib/mock-data';
import { 
  Plus, Trophy, Timer, Trash2, Zap, CircleDot, Target, Minus, 
  Megaphone, Star, MapPin, ClipboardList, ListOrdered, Settings, Medal, Share2, Edit2, X, Radio, Clock, UserPlus, ShieldCheck, Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useAuth, useDoc } from '@/firebase';
import { 
  collection, doc, query, where, serverTimestamp, 
  addDoc, updateDoc, deleteDoc, orderBy, limit, setDoc
} from 'firebase/firestore';
import { Match, RunResult, SportType, Trial, Standing, HOUSES, MatchPhase, GROUPS, Broadcast, AdminUser, SportEvent, BadmintonMatchResult } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

const OFFICIAL_URL = "https://sportify-in-paradox2026.vercel.app/";

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

  // --- Kampus Run Results State ---
  const [runResult, setRunResult] = useState<Partial<RunResult>>({
    name: '', position: 1, time: '', gender: 'M', ageGroup: '18-25', category: '5km'
  });

  // --- Kampus Run Schedule State ---
  const [raceSchedule, setRaceSchedule] = useState({
    reportingTime: '', flagOffTime: '', notes: ''
  });

  // --- System Admin Management State ---
  const [newAdmin, setNewAdmin] = useState<Partial<AdminUser>>({ uid: '', email: '', role: 'admin' });

  // --- New Item States ---
  const [newMatch, setNewMatch] = useState<Partial<Match>>({
    matchNumber: '', teamA: '', teamB: '', phase: 'group', time: '', date: '', day: '', venue: ''
  });
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

  const trials = useMemo(() => {
    return [...(rawTrials || [])].sort((a, b) => a.date.localeCompare(b.date));
  }, [rawTrials]);

  useEffect(() => {
    if (!userLoading && !user) router.push('/admin/login');
  }, [user, userLoading, router]);

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

  const handleUpdateRaceSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || selectedSportSlug !== 'kampus-run') return;
    setDoc(doc(db, 'events', 'kampus-run'), {
      ...raceSchedule,
      updatedAt: serverTimestamp()
    }, { merge: true });
    toast({ title: "Race schedule updated." });
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newAdmin.uid || !newAdmin.email) return;
    setDoc(doc(db, 'admins', newAdmin.uid), {
      ...newAdmin,
      createdAt: serverTimestamp()
    });
    setNewAdmin({ uid: '', email: '', role: 'admin' });
    toast({ title: "New admin added." });
  };

  const handleDeleteAdmin = (uid: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'admins', uid));
    toast({ title: "Admin removed." });
  };

  const handleEditBroadcast = (b: Broadcast) => {
    setBroadcastMessage(b.message);
    setEditingBroadcastId(b.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBroadcast = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'broadcasts', id));
    toast({ title: "Broadcast removed." });
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
    
    if (status === 'Completed' || status === 'Live') {
      const activeMatch = matches.find(m => m.id === selectedMatchId);
      const msg = status === 'Completed' 
        ? `🏆 *FINAL RESULT ALERT!* 🏆\n\n🥇 *${activeMatch?.teamA}* ${scoreA} - ${scoreB} *${activeMatch?.teamB}*\nWinner: ${matchWinner || 'N/A'}\n\nView stats at ${OFFICIAL_URL}` 
        : `🏟️ *LIVE UPDATE:* ${activeMatch?.teamA} ${scoreA} - ${scoreB} ${activeMatch?.teamB} (${selectedSportSlug?.toUpperCase()})\n\nFollow live: ${OFFICIAL_URL}`;
      handlePostBroadcast(undefined, msg);
    }
    
    toast({ title: "Match updated." });
  };

  const handleAddRunResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !runResult.name || !runResult.time) return;
    addDoc(collection(db, 'runResults'), { 
      ...runResult, 
      createdAt: serverTimestamp() 
    });
    setRunResult({ ...runResult, name: '', position: (runResult.position || 0) + 1, time: '' });
    toast({ title: "Run result added." });
  };

  const handleDeleteRunResult = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'runResults', id));
    toast({ title: "Result removed." });
  };

  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedSportSlug) return;
    addDoc(collection(db, 'matches'), { 
      ...newMatch, 
      sport: selectedSportSlug, 
      scoreA: 0, 
      scoreB: 0, 
      status: 'Upcoming', 
      createdAt: serverTimestamp() 
    });
    setNewMatch({ matchNumber: '', teamA: '', teamB: '', phase: 'group', time: '', date: '', day: '', venue: '' });
    toast({ title: "Fixture added." });
  };

  const handleAddOrUpdateTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedSportSlug || !newTrial.house) return;
    
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

  const handleBroadcastTrial = (t: Trial) => {
    const msg = `📢 *TRIAL ALERT:* ${t.house} ${t.sport.toUpperCase().replace('-', ' ')} selection is starting now at ${t.venue}!\n\nTrack pulse at ${OFFICIAL_URL}`;
    handlePostBroadcast(undefined, msg);
  };

  const handleEditTrial = (t: Trial) => {
    setNewTrial(t);
    setEditingTrialId(t.id);
    setActiveTab('trials');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTrial = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'trials', id));
    toast({ title: "Trial removed." });
  };

  const handleAddOrUpdateStanding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedSportSlug || !newStanding.team) return;
    
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

  const handleEditStanding = (s: Standing) => {
    setNewStanding(s);
    setEditingStandingId(s.id);
    setActiveTab('standings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteStanding = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'standings', id));
    toast({ title: "House removed from league." });
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

  if (!selectedSportSlug) {
    return (
      <div className="space-y-10 max-w-5xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center border-b border-border pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase text-foreground tracking-tighter">Admin Terminal</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Paradox 2026 Core</p>
          </div>
          <div className="flex gap-2">
            {isSuperAdmin && (
              <Button variant="outline" size="sm" onClick={() => setActiveTab('system')} className="text-[9px] font-black uppercase rounded-full px-6">System Mgmt</Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="bg-destructive/10 text-destructive text-[9px] font-black uppercase rounded-full px-6">Logout</Button>
          </div>
        </div>
        
        {isSuperAdmin && activeTab === 'system' && (
          <div className="space-y-10">
            <Button variant="link" onClick={() => setActiveTab('control')} className="p-0 h-auto text-[10px] font-black uppercase">Back to Broadcasts</Button>
            <Card className="premium-card">
              <CardHeader><CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><UserPlus className="h-4 w-4" /> Manage Admins</CardTitle></CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase">UID</Label><Input value={newAdmin.uid} onChange={e => setNewAdmin({...newAdmin, uid: e.target.value})} className="bg-muted/20 h-11" required /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase">Email</Label><Input type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} className="bg-muted/20 h-11" required /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase">Role</Label>
                    <Select value={newAdmin.role} onValueChange={v => setNewAdmin({...newAdmin, role: v as any})}>
                      <SelectTrigger className="bg-muted/20 h-11"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="super-admin">Super Admin</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="md:col-span-3 h-11 uppercase font-black text-[10px]">Add Access</Button>
                </form>
                
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase opacity-40 px-2">Access List</h3>
                  {allAdmins?.map(a => (
                    <div key={a.uid} className="flex items-center justify-between p-4 bg-muted/10 rounded-xl border border-border/40">
                      <div>
                        <p className="text-[11px] font-black uppercase">{a.email}</p>
                        <p className="text-[8px] opacity-40 font-bold uppercase">{a.role} • UID: {a.uid}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAdmin(a.uid)}><Trash2 className="h-4 w-4" /></Button>
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
                  <div className="relative">
                    <Input 
                      value={broadcastMessage} 
                      onChange={e => setBroadcastMessage(e.target.value)} 
                      placeholder="Type announcement for all students..." 
                      className="bg-muted/20 h-12 text-xs font-black uppercase pr-10" 
                    />
                    {editingBroadcastId && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6" 
                        onClick={() => {
                          setEditingBroadcastId(null);
                          setBroadcastMessage('');
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <Button type="submit" className="h-12 w-full uppercase font-black text-[10px] tracking-widest gap-2">
                    {editingBroadcastId ? <Edit2 className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
                    {editingBroadcastId ? 'Update Broadcast' : 'Transmit Broadcast'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <section className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary px-2">Broadcast Archive</h2>
              <div className="grid grid-cols-1 gap-3">
                {broadcasts && broadcasts.length > 0 ? broadcasts.map((b) => (
                  <Card key={b.id} className="premium-card bg-muted/5 border-border/40">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <p className="text-[11px] font-bold text-foreground leading-relaxed italic line-clamp-2">"{b.message}"</p>
                        <div className="flex items-center gap-2 opacity-40">
                          <Clock className="h-3 w-3" />
                          <span className="text-[8px] font-black uppercase tracking-widest">{formatTimestamp(b.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => handleEditBroadcast(b)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteBroadcast(b.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="py-10 text-center opacity-20 text-[9px] font-black uppercase tracking-widest">No previous broadcasts</div>
                )}
              </div>
            </section>

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
                        <h2 className="text-lg font-black uppercase text-foreground tracking-tight">{event.name}</h2>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Broadcast Control</p>
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
          <Button variant="ghost" size="sm" onClick={() => setSelectedSportSlug(null)} className="p-0 h-auto text-[10px] font-black uppercase text-primary gap-1.5 mb-2">Switch Terminal</Button>
          <h1 className="text-2xl md:text-4xl font-black uppercase text-foreground tracking-tighter">{EVENTS.find(e => e.slug === selectedSportSlug)?.name}</h1>
        </div>
        {!isKampusRun && selectedMatchId && (
          <Button onClick={() => {
             const activeMatch = matches.find(m => m.id === selectedMatchId);
             if (!activeMatch) return;
             const msg = activeMatch.status === 'Completed' 
                ? `🏆 *FINAL RESULT ALERT!* 🏆\n\n🥇 *${activeMatch.teamA}* ${scoreA} - ${scoreB} *${activeMatch.teamB}*\nWinner: ${matchWinner || 'N/A'}\n\nGlory has been claimed! Witness full breakdown: ${OFFICIAL_URL}` 
                : `🏟️ *LIVE UPDATE:* ${activeMatch.teamA} ${scoreA} - ${scoreB} ${activeMatch.teamB} (${selectedSportSlug?.toUpperCase()})\n\nFollow every point: ${OFFICIAL_URL}`;
             window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
          }} variant="outline" className="h-10 text-[10px] font-black uppercase tracking-widest gap-2">
            <Share2 className="h-4 w-4" /> Blast Result
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full bg-muted/20 border border-border p-1 h-12 rounded-xl overflow-x-auto no-scrollbar">
          <TabsTrigger value="control" className="flex-1 text-[9px] font-black uppercase whitespace-nowrap px-4">{isKampusRun ? 'Race Results' : 'Live Feed'}</TabsTrigger>
          {isKampusRun && <TabsTrigger value="schedule" className="flex-1 text-[9px] font-black uppercase whitespace-nowrap px-4">Race Schedule</TabsTrigger>}
          {!isKampusRun && <TabsTrigger value="fixtures" className="flex-1 text-[9px] font-black uppercase whitespace-nowrap px-4">Fixtures</TabsTrigger>}
          {!isKampusRun && <TabsTrigger value="trials" className="flex-1 text-[9px] font-black uppercase whitespace-nowrap px-4">Trials</TabsTrigger>}
          {!isKampusRun && <TabsTrigger value="standings" className="flex-1 text-[9px] font-black uppercase whitespace-nowrap px-4">Standings</TabsTrigger>}
          {!isKampusRun && <TabsTrigger value="archives" className="flex-1 text-[9px] font-black uppercase whitespace-nowrap px-4">Archives</TabsTrigger>}
        </TabsList>

        <TabsContent value="control" className="space-y-6">
          {isKampusRun ? (
            <div className="space-y-10">
              <Card className="premium-card">
                <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Trophy className="h-4 w-4" /> Enter Race Outcome</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAddRunResult} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Participant Name</Label><Input value={runResult.name} onChange={e => setRunResult({...runResult, name: e.target.value})} className="bg-muted/20 h-11" required /></div>
                    <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Position</Label><Input type="number" value={runResult.position} onChange={e => setRunResult({...runResult, position: Number(e.target.value)})} className="bg-muted/20 h-11" required /></div>
                    <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Time (MM:SS.ms)</Label><Input value={runResult.time} onChange={e => setRunResult({...runResult, time: e.target.value})} className="bg-muted/20 h-11" required /></div>
                    <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Category</Label>
                      <Select value={runResult.category} onValueChange={v => setRunResult({...runResult, category: v})}>
                        <SelectTrigger className="bg-muted/20 h-11 font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="3km">3KM</SelectItem><SelectItem value="5km">5KM</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Gender</Label>
                      <Select value={runResult.gender} onValueChange={v => setRunResult({...runResult, gender: v as 'M' | 'F'})}>
                        <SelectTrigger className="bg-muted/20 h-11 font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Age Group</Label>
                      <Select value={runResult.ageGroup} onValueChange={v => setRunResult({...runResult, ageGroup: v})}>
                        <SelectTrigger className="bg-muted/20 h-11 font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="All">All (3KM Only)</SelectItem><SelectItem value="18-25">18-25 (5KM)</SelectItem><SelectItem value="26+">26+ (5KM)</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="lg:col-span-3 h-12 uppercase font-black text-[10px] tracking-widest">Publish Result</Button>
                  </form>
                </CardContent>
              </Card>
              
              <div className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-primary px-2">Published Outcomes</h2>
                <div className="grid grid-cols-1 gap-3">
                  {runResults?.map(r => (
                    <Card key={r.id} className="premium-card bg-muted/5 border-border/40">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-black uppercase">{r.name} - {r.time}</p>
                          <p className="text-[8px] opacity-40 uppercase font-bold">Pos #{r.position} • {r.category.toUpperCase()} {r.gender} ({r.ageGroup})</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRunResult(r.id)}><Trash2 className="h-4 w-4" /></Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Card className="premium-card">
              <CardContent className="p-6 md:p-12 space-y-10">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Select Active Match</Label>
                  <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                    <SelectTrigger className="bg-muted/20 h-12 font-black uppercase"><SelectValue placeholder="Select Match" /></SelectTrigger>
                    <SelectContent>
                      {matches?.filter(m => m.status !== 'Completed').map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-[10px] font-black uppercase">
                          {m.teamA} vs {m.teamB} (#{m.matchNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedMatchId && (
                  <form onSubmit={handleUpdateMatch} className="space-y-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                      <div className="w-full md:flex-1 space-y-4">
                        <Label className="text-[10px] font-black uppercase block text-center opacity-60 tracking-widest">{activeMatch?.teamA}</Label>
                        <div className="flex items-center justify-center gap-3">
                           <Button type="button" variant="outline" size="icon" onClick={() => setScoreA(Math.max(0, scoreA - 1))}><Minus className="h-4 w-4" /></Button>
                           <Input type="number" value={scoreA} onChange={e => setScoreA(Number(e.target.value))} className="text-center text-4xl font-black h-20 bg-muted/20 border-none" />
                           <Button type="button" variant="outline" size="icon" onClick={() => setScoreA(scoreA + 1)}><Plus className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <div className="w-full md:flex-1 space-y-4">
                        <Label className="text-[10px] font-black uppercase block text-center opacity-60 tracking-widest">{activeMatch?.teamB}</Label>
                        <div className="flex items-center justify-center gap-3">
                           <Button type="button" variant="outline" size="icon" onClick={() => setScoreB(Math.max(0, scoreB - 1))}><Minus className="h-4 w-4" /></Button>
                           <Input type="number" value={scoreB} onChange={e => setScoreB(Number(e.target.value))} className="text-center text-4xl font-black h-20 bg-muted/20 border-none" />
                           <Button type="button" variant="outline" size="icon" onClick={() => setScoreB(scoreB + 1)}><Plus className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>

                    {selectedSportSlug === 'badminton' && (
                      <div className="space-y-6 bg-muted/10 p-6 rounded-2xl border border-border">
                        <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                          <Target className="h-4 w-4" /> Sub-Match Results
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {badmintonResults.map((res, idx) => (
                            <div key={res.type} className="space-y-3">
                              <Label className="text-[10px] font-black uppercase opacity-60">
                                {res.type === 'MS' ? "Men's Singles" : 
                                 res.type === 'WS' ? "Women's Singles" : 
                                 res.type === 'MD' ? "Men's Doubles" : "Mixed Doubles"}
                              </Label>
                              <div className="flex gap-2">
                                <Input 
                                  placeholder="Score (e.g. 21-18)" 
                                  value={res.score} 
                                  onChange={(e) => updateBadmintonResult(idx, 'score', e.target.value)}
                                  className="h-10 bg-muted/20 text-[10px] font-black uppercase"
                                />
                                <Select value={res.winner} onValueChange={(v) => updateBadmintonResult(idx, 'winner', v)}>
                                  <SelectTrigger className="h-10 bg-muted/20 text-[9px] font-black uppercase">
                                    <SelectValue placeholder="Winner" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={activeMatch?.teamA || 'Team A'}>{activeMatch?.teamA}</SelectItem>
                                    <SelectItem value={activeMatch?.teamB || 'Team B'}>{activeMatch?.teamB}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
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
                        <Label className="text-[10px] font-black uppercase opacity-60">Overall Winner</Label>
                        <Select value={matchWinner} onValueChange={setMatchWinner}>
                          <SelectTrigger className="bg-muted/20 h-12 text-[10px] font-black uppercase"><SelectValue placeholder="Select Outcome" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Draw">Draw / Tie</SelectItem>
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
                    <Button type="submit" className="w-full h-14 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">Push Update</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {isKampusRun && (
          <TabsContent value="schedule" className="space-y-6">
            <Card className="premium-card">
              <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Clock className="h-4 w-4" /> Edit Race Schedule</CardTitle></CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleUpdateRaceSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Reporting Time</Label><Input placeholder="e.g. 05:00 AM" value={raceSchedule.reportingTime} onChange={e => setRaceSchedule({...raceSchedule, reportingTime: e.target.value})} className="bg-muted/20 h-11" required /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Flag Off Time</Label><Input placeholder="e.g. 05:30 AM" value={raceSchedule.flagOffTime} onChange={e => setRaceSchedule({...raceSchedule, flagOffTime: e.target.value})} className="bg-muted/20 h-11" required /></div>
                  <div className="md:col-span-2 space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Race Notes (Visible to all participants)</Label><Textarea placeholder="Instructions, water stations, route info..." value={raceSchedule.notes} onChange={e => setRaceSchedule({...raceSchedule, notes: e.target.value})} className="bg-muted/20 min-h-[100px]" /></div>
                  <Button type="submit" className="md:col-span-2 h-12 uppercase font-black text-[10px] tracking-widest">Update Race Details</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="fixtures" className="space-y-6">
          <Card className="premium-card">
            <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><MapPin className="h-4 w-4" /> Create Fixture</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddMatch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Match Number</Label><Input placeholder="e.g. 1" value={newMatch.matchNumber} onChange={e => setNewMatch({...newMatch, matchNumber: e.target.value})} className="bg-muted/20 h-11" required /></div>
                <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Phase</Label>
                <Select value={newMatch.phase} onValueChange={v => setNewMatch({...newMatch, phase: v as MatchPhase})}>
                  <SelectTrigger className="bg-muted/20 h-11 uppercase font-black text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Group Stage</SelectItem>
                    <SelectItem value="semi-final">Semi-Final</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Team A</Label>
                <Select value={newMatch.teamA} onValueChange={v => setNewMatch({...newMatch, teamA: v})}>
                  <SelectTrigger className="bg-muted/20 h-11 uppercase font-black text-[10px]"><SelectValue placeholder="Team A" /></SelectTrigger>
                  <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Team B</Label>
                <Select value={newMatch.teamB} onValueChange={v => setNewMatch({...newMatch, teamB: v})}>
                  <SelectTrigger className="bg-muted/20 h-11 uppercase font-black text-[10px]"><SelectValue placeholder="Team B" /></SelectTrigger>
                  <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Date (YYYY-MM-DD)</Label><Input type="date" value={newMatch.date} onChange={e => setNewMatch({...newMatch, date: e.target.value})} className="bg-muted/20 h-11" required /></div>
                <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-50">Time</Label><Input placeholder="e.g. 09:00 AM" value={newMatch.time} onChange={e => setNewMatch({...newMatch, time: e.target.value})} className="bg-muted/20 h-11" required /></div>
                <div className="space-y-1.5 md:col-span-2"><Label className="text-[9px] font-black uppercase opacity-50">Venue</Label><Input placeholder="Venue" value={newMatch.venue} onChange={e => setNewMatch({...newMatch, venue: e.target.value})} className="bg-muted/20 h-11" required /></div>
                <Button type="submit" className="md:col-span-2 h-12 uppercase font-black text-[10px] tracking-widest">Schedule Match</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trials" className="space-y-10">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> {editingTrialId ? 'Edit Trial Schedule' : 'Schedule Selection Trials'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddOrUpdateTrial} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase opacity-50">House</Label>
                  <Select value={newTrial.house} onValueChange={v => setNewTrial({...newTrial, house: v})}>
                    <SelectTrigger className="bg-muted/20 h-11 uppercase font-black text-[10px]"><SelectValue placeholder="Select House" /></SelectTrigger>
                    <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase opacity-50">Venue</Label>
                  <Input placeholder="e.g. SAC Grounds" value={newTrial.venue} onChange={e => setNewTrial({...newTrial, venue: e.target.value})} className="bg-muted/20 h-11" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase opacity-50">Date (YYYY-MM-DD)</Label>
                  <Input type="date" value={newTrial.date} onChange={e => setNewTrial({...newTrial, date: e.target.value})} className="bg-muted/20 h-11" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase opacity-50">Time</Label>
                  <Input placeholder="e.g. 04:30 PM" value={newTrial.time} onChange={e => setNewTrial({...newTrial, time: e.target.value})} className="bg-muted/20 h-11" required />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[9px] font-black uppercase opacity-50">Notes (Optional)</Label>
                  <Input placeholder="Any specific requirements..." value={newTrial.notes} onChange={e => setNewTrial({...newTrial, notes: e.target.value})} className="bg-muted/20 h-11" />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" className="flex-1 h-12 uppercase font-black text-[10px] tracking-widest">
                    {editingTrialId ? 'Update Schedule' : 'Publish Selection Schedule'}
                  </Button>
                  {editingTrialId && (
                    <Button type="button" variant="outline" onClick={() => {
                      setEditingTrialId(null);
                      setNewTrial({ house: '', date: '', time: '', venue: '', notes: '' });
                    }} className="h-12 w-12 px-0"><X className="h-4 w-4" /></Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary px-2">Active Trials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trials && trials.length > 0 ? trials.map((t) => (
                <Card key={t.id} className="premium-card bg-muted/5 border-border/40">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[9px] font-black uppercase text-primary border-primary/20">{t.house}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" title="Broadcast Live" onClick={() => handleBroadcastTrial(t)}><Radio className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditTrial(t)}><Edit2 className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTrial(t.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-tight">{t.date} • {t.time}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {t.venue}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="md:col-span-3 py-16 text-center opacity-20 text-[10px] font-black uppercase tracking-[0.2em]">
                  No trials scheduled
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="standings" className="space-y-8">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <ListOrdered className="h-4 w-4" /> {editingStandingId ? 'Update Standing' : 'Assign House to Group'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddOrUpdateStanding} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase opacity-50">Team</Label>
                  <Select value={newStanding.team} onValueChange={v => setNewStanding({...newStanding, team: v})}>
                    <SelectTrigger className="bg-muted/20 h-11 uppercase font-black text-[10px]"><SelectValue placeholder="Select House" /></SelectTrigger>
                    <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase opacity-50">Group</Label>
                  <Select value={newStanding.group} onValueChange={v => setNewStanding({...newStanding, group: v})}>
                    <SelectTrigger className="bg-muted/20 h-11 uppercase font-black text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g}>Group {g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase opacity-50">Played</Label>
                  <Input type="number" value={newStanding.played} onChange={e => setNewStanding({...newStanding, played: Number(e.target.value)})} className="bg-muted/20 h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase opacity-50">Wins</Label>
                  <Input type="number" value={newStanding.won} onChange={e => setNewStanding({...newStanding, won: Number(e.target.value)})} className="bg-muted/20 h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase opacity-50">Draws</Label>
                  <Input type="number" value={newStanding.drawn || 0} onChange={e => setNewStanding({...newStanding, drawn: Number(e.target.value)})} className="bg-muted/20 h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase opacity-50">Losses</Label>
                  <Input type="number" value={newStanding.lost || 0} onChange={e => setNewStanding({...newStanding, lost: Number(e.target.value)})} className="bg-muted/20 h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase opacity-50">Points</Label>
                  <Input type="number" value={newStanding.points} onChange={e => setNewStanding({...newStanding, points: Number(e.target.value)})} className="bg-muted/20 h-11" />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" className="flex-1 h-11 uppercase font-black text-[10px] tracking-widest">
                    {editingStandingId ? 'Save' : 'Add'}
                  </Button>
                  {editingStandingId && (
                    <Button type="button" variant="outline" onClick={() => {
                      setEditingStandingId(null);
                      setNewStanding({ team: '', played: 0, won: 0, drawn: 0, lost: 0, points: 0, group: 'A' });
                    }} className="h-11 uppercase font-black text-[10px]">X</Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary px-2">Active League Table</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GROUPS.map(g => {
                const groupTeams = standings?.filter(s => s.group === g) || [];
                return (
                  <Card key={g} className="premium-card bg-muted/5 border-border/50">
                    <CardHeader className="py-4 border-b border-border/30 bg-muted/10">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-foreground">Group {g}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/20">
                        {groupTeams.length > 0 ? groupTeams.map((s, idx) => (
                          <div key={s.id} className="flex items-center justify-between p-4 hover:bg-muted/5 transition-colors">
                            <div className="flex items-center gap-4">
                              <span className="text-[9px] font-black opacity-30">#{idx + 1}</span>
                              <div>
                                <p className="text-[10px] font-black uppercase">{s.team}</p>
                                <p className="text-[8px] opacity-40 uppercase font-bold">P: {s.played} • W: {s.won} • D: {s.drawn || 0} • L: {s.lost || 0} • PTS: {s.points}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditStanding(s)}><Edit2 className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteStanding(s.id)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </div>
                        )) : (
                          <div className="p-6 text-center opacity-20 text-[9px] font-black uppercase">No teams assigned</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="archives" className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-primary px-2">Manage Completed Matches</h2>
          <div className="grid grid-cols-1 gap-3">
            {matches?.filter(m => m.status === 'Completed').reverse().map(m => (
              <div key={m.id} className="premium-card p-4 flex items-center justify-between bg-muted/5">
                <div>
                  <p className="text-[10px] font-black uppercase">{m.teamA} {m.scoreA} - {m.scoreB} {m.teamB}</p>
                  <p className="text-[8px] opacity-40 uppercase font-bold">Match #{m.matchNumber} • {m.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setSelectedMatchId(m.id);
                    setActiveTab('control');
                  }}><Settings className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDoc(doc(db!, 'matches', m.id))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
