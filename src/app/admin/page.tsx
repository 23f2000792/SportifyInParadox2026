
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
import { Save, Plus, ShieldCheck, LogOut, Trophy, Timer, ListOrdered, Users, UserPlus, Trash2, Edit2, X, MapPin, Calendar, ChevronLeft, ChevronRight, Zap, CircleDot, Target, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useAuth } from '@/firebase';
import { collection, doc, setDoc, query, where, serverTimestamp, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Match, AdminUser, RunResult, BadmintonMatchResult, HOUSES, GROUPS, Standing, MatchPhase, SportType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';

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
  const [editMatchId, setEditMatchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('control');

  // Match Scoring State
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [status, setStatus] = useState<'Upcoming' | 'Live' | 'Completed'>('Live');
  const [badmintonResults, setBadmintonResults] = useState<BadmintonMatchResult[]>([
    { type: 'MS', score: '0-0', winner: '' },
    { type: 'WS', score: '0-0', winner: '' },
    { type: 'MD', score: '0-0', winner: '' },
    { type: 'WD', score: '0-0', winner: '' },
    { type: 'XD', score: '0-0', winner: '' },
  ]);

  // Schedule Creation State
  const [schedMatchNumber, setSchedMatchNumber] = useState('');
  const [schedTeamA, setSchedTeamA] = useState('');
  const [schedTeamB, setSchedTeamB] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedReportingTime, setSchedReportingTime] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedDay, setSchedDay] = useState('');
  const [schedVenue, setSchedVenue] = useState('');
  const [schedCourtNumber, setSchedCourtNumber] = useState('');
  const [schedGroundNumber, setSchedGroundNumber] = useState('');
  const [schedGroup, setSchedGroup] = useState('A');
  const [schedPhase, setSchedPhase] = useState<MatchPhase>('group');

  // Kampus Run Specific Schedule State
  const [run3kReporting, setRun3kReporting] = useState('');
  const [run3kStart, setRun3kStart] = useState('');
  const [run5kReporting, setRun5kReporting] = useState('');
  const [run5kStart, setRun5kStart] = useState('');
  const [runDate, setRunDate] = useState('');

  // Kampus Run Result Entry State
  const [runnerName, setRunnerName] = useState('');
  const [runnerPos, setRunnerPos] = useState<number>(1);
  const [runnerTime, setRunnerTime] = useState('');
  const [runnerCat, setRunnerCat] = useState('3km');
  const [runnerGender, setRunnerGender] = useState<'M' | 'F'>('M');
  const [runnerAgeGroup, setRunnerAgeGroup] = useState('Open');

  // League Table State
  const [newStandingTeam, setNewStandingTeam] = useState('');
  const [newStandingGroup, setNewStandingGroup] = useState('A');

  // Personnel Security State
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminSport, setNewAdminSport] = useState('all');

  // Base Queries
  const rawMatchesQuery = useMemo(() => {
    if (!db || !selectedSportSlug) return null;
    return query(collection(db, 'matches'), where('sport', '==', selectedSportSlug));
  }, [db, selectedSportSlug]);
  const { data: rawMatches } = useCollection<Match>(rawMatchesQuery);

  // Client-side sorting to avoid Firestore index requirements for now
  const matches = useMemo(() => {
    return [...(rawMatches || [])].sort((a, b) => {
      const numA = parseInt(a.matchNumber) || 0;
      const numB = parseInt(b.matchNumber) || 0;
      return numA - numB;
    });
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

  const adminsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'admins');
  }, [db]);
  const { data: allAdmins } = useCollection<AdminUser>(adminsQuery);

  useEffect(() => {
    if (!userLoading && !user) router.push('/admin/login');
  }, [user, userLoading, router]);

  const activeMatch = useMemo(() => matches?.find(m => m.id === selectedMatchId), [matches, selectedMatchId]);

  useEffect(() => {
    if (activeMatch) {
      setScoreA(activeMatch.scoreA);
      setScoreB(activeMatch.scoreB);
      setStatus(activeMatch.status as any);
      if (activeMatch.badmintonResults) setBadmintonResults(activeMatch.badmintonResults);
    }
  }, [activeMatch]);

  if (userLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Timer className="animate-spin text-primary" /></div>;
  if (!user || !adminProfile) return null;

  const isSuperAdmin = adminProfile.role === 'super-admin';
  const currentSport = EVENTS.find(e => e.slug === selectedSportSlug);
  const isKampusRun = selectedSportSlug === 'kampus-run';

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
    toast({ title: "Score Synchronized" });
  };

  const handleCreateOrUpdateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedSportSlug) return;
    const data = {
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
      courtNumber: (selectedSportSlug === 'badminton' || selectedSportSlug === 'volleyball') ? schedCourtNumber : null,
      groundNumber: selectedSportSlug === 'football' ? schedGroundNumber : null,
      updatedAt: serverTimestamp(),
    };

    if (editMatchId) {
      updateDoc(doc(db, 'matches', editMatchId), data);
      setEditMatchId(null);
      toast({ title: "Schedule Updated" });
    } else {
      addDoc(collection(db, 'matches'), {
        ...data,
        scoreA: 0,
        scoreB: 0,
        status: 'Upcoming',
      });
      toast({ title: "New Match Initialized" });
    }
    // Reset fields
    setSchedMatchNumber(''); setSchedTeamA(''); setSchedTeamB(''); setSchedTime(''); setSchedReportingTime(''); setSchedDate(''); setSchedDay(''); setSchedVenue(''); setSchedCourtNumber(''); setSchedGroundNumber('');
  };

  const handleSaveRunSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    const run3k = matches?.find(m => m.matchNumber === '3km-race');
    const run5k = matches?.find(m => m.matchNumber === '5km-race');

    const common = {
      sport: 'kampus-run' as SportType,
      phase: 'race' as MatchPhase,
      date: runDate,
      day: 'Saturday',
      venue: 'Paradox Stadium',
      status: 'Upcoming' as const,
      updatedAt: serverTimestamp(),
    };

    if (run3k) {
      updateDoc(doc(db, 'matches', run3k.id), { ...common, teamA: '3km Run', matchNumber: '3km-race', time: run3kStart, reportingTime: run3kReporting });
    } else {
      addDoc(collection(db, 'matches'), { ...common, teamA: '3km Run', teamB: 'Open', matchNumber: '3km-race', time: run3kStart, reportingTime: run3kReporting, scoreA: 0, scoreB: 0 });
    }

    if (run5k) {
      updateDoc(doc(db, 'matches', run5k.id), { ...common, teamA: '5km Run', matchNumber: '5km-race', time: run5kStart, reportingTime: run5kReporting });
    } else {
      addDoc(collection(db, 'matches'), { ...common, teamA: '5km Run', teamB: 'Open', matchNumber: '5km-race', time: run5kStart, reportingTime: run5kReporting, scoreA: 0, scoreB: 0 });
    }

    toast({ title: "Race Schedule Archive Synchronized" });
  };

  const handleUpdateStanding = (standingId: string, field: string, value: number) => {
    if (!db) return;
    updateDoc(doc(db, 'standings', standingId), { [field]: Number(value), updatedAt: serverTimestamp() });
  };

  const handleAddStanding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedSportSlug || !newStandingTeam) return;
    addDoc(collection(db, 'standings'), {
      team: newStandingTeam,
      sport: selectedSportSlug,
      group: newStandingGroup,
      played: 0, won: 0, drawn: 0, lost: 0, points: 0,
      updatedAt: serverTimestamp(),
    });
    setNewStandingTeam('');
    toast({ title: "Team Added to Group Stage" });
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
      ageGroup: runnerCat === '5km' ? runnerAgeGroup : 'Open',
      updatedAt: serverTimestamp(),
    });
    setRunnerName(''); setRunnerTime('');
    toast({ title: "Runner Result Archived" });
  };

  const handleAddPersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newAdminUid || !newAdminEmail) return;
    setDoc(doc(db, 'admins', newAdminUid), {
      uid: newAdminUid,
      email: newAdminEmail,
      role: 'admin',
      assignedSport: newAdminSport === 'all' ? null : newAdminSport,
    });
    setNewAdminUid(''); setNewAdminEmail('');
    toast({ title: "Admin Identity Registered" });
  };

  if (!selectedSportSlug) {
    return (
      <div className="space-y-12 max-w-5xl mx-auto py-10">
        <div className="flex justify-between items-center border-b border-white/5 pb-8">
          <div className="space-y-2 text-left">
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">Command Hub</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Paradox 2026 Admin Authorization</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut(auth)} className="bg-white/5 border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 text-[9px] font-black uppercase tracking-widest gap-2">
            <LogOut className="h-3 w-3" /> Terminate Auth
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            return (
              <Button key={event.id} variant="ghost" className="p-0 h-auto group" onClick={() => setSelectedSportSlug(event.slug)}>
                <Card className="premium-card w-full h-48 overflow-hidden border-white/5 hover:border-primary/50 transition-all duration-500">
                  <CardContent className="p-0 flex h-full">
                    <div className="w-1/3 bg-primary/10 flex items-center justify-center border-r border-white/5 group-hover:bg-primary/20 transition-colors">
                      <IconComp className="h-12 w-12 text-primary" />
                    </div>
                    <div className="w-2/3 p-8 flex flex-col justify-center text-left space-y-2">
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Manage {event.name}</h2>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-relaxed">{event.description}</p>
                      <div className="pt-4 flex items-center text-[10px] font-black uppercase text-primary gap-2 opacity-0 group-hover:opacity-100 transition-opacity">Initialize Protocols <ChevronRight className="h-3 w-3" /></div>
                    </div>
                  </CardContent>
                </Card>
              </Button>
            );
          })}
        </div>
        {isSuperAdmin && (
          <Card className="premium-card border-primary/20 bg-primary/5 mt-10">
            <CardHeader><CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Global Systems</CardTitle></CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full uppercase font-black text-[10px] tracking-widest" onClick={() => { setSelectedSportSlug('football'); setActiveTab('access'); }}>Access Personnel Matrix</Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const tabsCount = (isKampusRun ? 3 : 4) + (isSuperAdmin ? 1 : 0);
  const gridColsClass = tabsCount === 5 ? "grid-cols-5" : 
                       tabsCount === 4 ? "grid-cols-4" : 
                       tabsCount === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSportSlug(null)} className="p-0 h-auto text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/70 gap-2 mb-2"><ChevronLeft className="h-3 w-3" /> Exit Domain</Button>
          <h1 className="text-4xl font-black italic uppercase flex items-center gap-4 tracking-tighter">{currentSport?.name} Control</h1>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] opacity-60">Identity Vector: {adminProfile.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => signOut(auth)} className="text-[9px] font-black uppercase gap-2 bg-white/5 border-white/10 hover:bg-destructive/10 hover:text-destructive transition-all"><LogOut className="h-3 w-3" /> Terminate Session</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className={cn(
          "grid w-full bg-muted/20 h-14 p-1.5 border border-white/5 rounded-2xl",
          gridColsClass
        )}>
          <TabsTrigger value="control" className="text-[9px] font-black uppercase rounded-xl">Live Scoring</TabsTrigger>
          <TabsTrigger value="schedule" className="text-[9px] font-black uppercase rounded-xl">Schedule</TabsTrigger>
          {!isKampusRun && <TabsTrigger value="standings" className="text-[9px] font-black uppercase rounded-xl">League Table</TabsTrigger>}
          <TabsTrigger value="archive" className="text-[9px] font-black uppercase rounded-xl">Archives</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="access" className="text-[9px] font-black uppercase rounded-xl hidden md:flex">Security</TabsTrigger>}
        </TabsList>

        <TabsContent value="control" className="space-y-6">
          {isKampusRun ? (
            <Card className="premium-card border-primary/20">
              <CardHeader className="bg-primary/5 border-b border-white/5"><CardTitle className="text-xs font-black uppercase italic tracking-widest text-primary">Race Result Injection Terminal</CardTitle></CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleAddRunResult} className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Participant Identity</Label>
                    <Input value={runnerName} onChange={e => setRunnerName(e.target.value)} className="bg-white/5 h-12 border-white/10 text-xs font-black uppercase" placeholder="Full Name" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Rank Vector</Label>
                    <Input type="number" value={runnerPos} onChange={e => setRunnerPos(Number(e.target.value))} className="bg-white/5 h-12 border-white/10 text-xs font-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Chrono Record</Label>
                    <Input placeholder="00:00.0" value={runnerTime} onChange={e => setRunnerTime(e.target.value)} className="bg-white/5 h-12 border-white/10 text-xs font-black" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Distance</Label>
                    <Select value={runnerCat} onValueChange={(v: any) => { setRunnerCat(v); if(v === '3km') setRunnerAgeGroup('Open'); }}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 text-[10px] font-black uppercase rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3km" className="text-[10px] font-black uppercase">3KM</SelectItem>
                        <SelectItem value="5km" className="text-[10px] font-black uppercase">5KM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Gender</Label>
                    <Select value={runnerGender} onValueChange={(v: any) => setRunnerGender(v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 text-[10px] font-black uppercase rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M" className="text-[10px] font-black uppercase">Male</SelectItem>
                        <SelectItem value="F" className="text-[10px] font-black uppercase">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {runnerCat === '5km' && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Age Group</Label>
                      <Select value={runnerAgeGroup} onValueChange={setRunnerAgeGroup}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-12 text-[10px] font-black uppercase rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="18-25" className="text-[10px] font-black uppercase">18-25</SelectItem>
                          <SelectItem value="26+" className="text-[10px] font-black uppercase">26+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button type="submit" className="h-12 mt-auto uppercase font-black text-[10px] tracking-widest shadow-xl shadow-primary/20 rounded-xl md:col-span-1"><Plus className="h-4 w-4 mr-2" /> Log Entry</Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="premium-card border-white/5">
              <CardContent className="p-10 space-y-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase opacity-50 tracking-[0.3em] ml-1">Target Broadcast Match</Label>
                  <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-16 text-sm font-black uppercase rounded-2xl">
                      <SelectValue placeholder="Selecting match vector..." />
                    </SelectTrigger>
                    <SelectContent>
                      {matches?.filter(m => m.status !== 'Completed').map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-[10px] font-black uppercase">M#{m.matchNumber} | {m.teamA} vs {m.teamB}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedMatchId && (
                  <form onSubmit={handleUpdateMatch} className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between gap-12"><div className="flex-1 space-y-4"><Label className="text-[10px] font-black uppercase text-center block opacity-40 tracking-widest">{activeMatch?.teamA}</Label><Input type="number" value={scoreA} onChange={e => setScoreA(Number(e.target.value))} className="text-center text-7xl font-black h-32 bg-white/5 border-white/10 shadow-inner rounded-3xl" /></div><div className="text-4xl font-black opacity-10 pt-10">:</div><div className="flex-1 space-y-4"><Label className="text-[10px] font-black uppercase text-center block opacity-40 tracking-widest">{activeMatch?.teamB}</Label><Input type="number" value={scoreB} onChange={e => setScoreB(Number(e.target.value))} className="text-center text-7xl font-black h-32 bg-white/5 border-white/10 shadow-inner rounded-3xl" /></div></div>
                    {selectedSportSlug === 'badminton' && (
                      <div className="space-y-6 pt-10 border-t border-white/5"><h4 className="text-[10px] font-black uppercase tracking-widest text-primary/60">Sub-Match Breakdown (Set Matrix)</h4><div className="grid grid-cols-1 md:grid-cols-5 gap-4">{badmintonResults.map((res, idx) => (<div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4 group hover:border-primary/30 transition-all"><p className="text-[9px] font-black text-primary uppercase tracking-tighter opacity-70">{res.type} Vector</p><Input value={res.score} onChange={e => { const n = [...badmintonResults]; n[idx].score = e.target.value; setBadmintonResults(n); }} className="h-10 text-xs font-black text-center bg-black/20 border-white/5 rounded-xl" placeholder="0-0" /><Select value={res.winner} onValueChange={v => { const n = [...badmintonResults]; n[idx].winner = v; setBadmintonResults(n); }}><SelectTrigger className="h-8 text-[8px] font-black uppercase bg-transparent border-white/5"><SelectValue placeholder="Winner" /></SelectTrigger><SelectContent><SelectItem value={activeMatch?.teamA || 'Team A'} className="text-[8px] uppercase">{activeMatch?.teamA}</SelectItem><SelectItem value={activeMatch?.teamB || 'Team B'} className="text-[8px] uppercase">{activeMatch?.teamB}</SelectItem></SelectContent></Select></div>))}</div></div>
                    )}
                    <div className="space-y-4"><Label className="text-[10px] font-black uppercase opacity-50 tracking-widest ml-1">Protocol Status</Label><Select value={status} onValueChange={(v: any) => setStatus(v)}><SelectTrigger className="bg-white/5 border-white/10 h-14 text-[11px] font-black uppercase tracking-wider rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Upcoming" className="text-[10px] font-black uppercase">Standby</SelectItem><SelectItem value="Live" className="text-[10px] font-black uppercase">Live Transmission</SelectItem><SelectItem value="Completed" className="text-[10px] font-black uppercase">Archive Result</SelectItem></SelectContent></Select></div>
                    <Button type="submit" className="w-full h-16 font-black uppercase text-xs tracking-[0.3em] gap-4 shadow-2xl shadow-primary/30 rounded-2xl"><ShieldCheck className="h-6 w-6" /> Push Live Update</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-8">
          {isKampusRun ? (
            <Card className="premium-card border-white/5">
              <CardHeader className="bg-primary/5 border-b border-white/5"><CardTitle className="text-xs font-black uppercase italic tracking-widest text-primary flex items-center gap-2"><Clock className="h-4 w-4" /> Race Day Scheduling Terminal</CardTitle></CardHeader>
              <CardContent className="p-10">
                <form onSubmit={handleSaveRunSchedule} className="space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Competition Date</Label><Input type="date" value={runDate} onChange={e => setRunDate(e.target.value)} className="bg-white/5 h-14 font-black uppercase text-xs rounded-xl" /></div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6">
                        <h4 className="text-[11px] font-black uppercase text-primary italic">3KM Category Domain</h4>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40">Reporting Time</Label><Input value={run3kReporting} onChange={e => setRun3kReporting(e.target.value)} placeholder="06:00 AM" className="bg-white/5 h-12 font-black text-xs" /></div>
                          <div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40">Start Time</Label><Input value={run3kStart} onChange={e => setRun3kStart(e.target.value)} placeholder="06:30 AM" className="bg-white/5 h-12 font-black text-xs" /></div>
                        </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6">
                        <h4 className="text-[11px] font-black uppercase text-primary italic">5KM Category Domain</h4>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40">Reporting Time</Label><Input value={run5kReporting} onChange={e => setRun5kReporting(e.target.value)} placeholder="05:30 AM" className="bg-white/5 h-12 font-black text-xs" /></div>
                          <div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40">Start Time</Label><Input value={run5kStart} onChange={e => setRun5kStart(e.target.value)} placeholder="06:00 AM" className="bg-white/5 h-12 font-black text-xs" /></div>
                        </div>
                      </div>
                   </div>
                   <Button type="submit" className="w-full h-16 uppercase font-black tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/20">Archive Race Timings</Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="premium-card border-white/5">
              <CardHeader className="bg-white/[0.02] border-b border-white/5"><CardTitle className="text-xs font-black uppercase italic flex items-center justify-between tracking-widest">{editMatchId ? "Modify Match Record" : "Initialize New Match"}{editMatchId && <Button variant="ghost" size="sm" onClick={() => setEditMatchId(null)} className="h-7 text-[9px] font-black uppercase gap-1 text-muted-foreground"><X className="h-3 w-3" /> Cancel</Button>}</CardTitle></CardHeader>
              <CardContent className="p-10">
                <form onSubmit={handleCreateOrUpdateSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Match Index (M#)</Label><Input value={schedMatchNumber} onChange={e => setSchedMatchNumber(e.target.value)} placeholder="e.g., 101" className="bg-white/5 border-white/10 h-14 font-black text-xs rounded-xl" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Phase Vector</Label><Select value={schedPhase} onValueChange={(v: any) => setSchedPhase(v)}><SelectTrigger className="bg-white/5 border-white/10 h-14 font-black text-[11px] uppercase rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="group" className="text-[10px] font-black uppercase">Group Stage</SelectItem><SelectItem value="semi-final" className="text-[10px] font-black uppercase">Semi Final</SelectItem><SelectItem value="third-place" className="text-[10px] font-black uppercase">3rd Place Play-off</SelectItem><SelectItem value="final" className="text-[10px] font-black uppercase">Grand Final</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Home Domain (House)</Label><Select value={schedTeamA} onValueChange={setSchedTeamA}><SelectTrigger className="bg-white/5 border-white/10 h-14 font-black text-[11px] uppercase rounded-xl"><SelectValue placeholder="Select House" /></SelectTrigger><SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[10px] font-black uppercase">{h}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Away Domain (House)</Label><Select value={schedTeamB} onValueChange={setSchedTeamB}><SelectTrigger className="bg-white/5 border-white/10 h-14 font-black text-[11px] uppercase rounded-xl"><SelectValue placeholder="Select House" /></SelectTrigger><SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[10px] font-black uppercase">{h}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Calendar Date</Label><Input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} className="bg-white/5 h-14 font-black text-xs rounded-xl" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Reporting Time</Label><Input value={schedReportingTime} onChange={e => setSchedReportingTime(e.target.value)} placeholder="04:00 PM" className="bg-white/5 h-14 font-black text-xs rounded-xl" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Start Time Vector</Label><Input placeholder="04:30 PM" value={schedTime} onChange={e => setSchedTime(e.target.value)} className="bg-white/5 h-14 font-black text-xs rounded-xl" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">General Venue</Label><Input value={schedVenue} onChange={e => setSchedVenue(e.target.value)} placeholder="e.g., Main Ground" className="bg-white/5 h-14 font-black text-xs rounded-xl" required /></div>
                  {(selectedSportSlug === 'badminton' || selectedSportSlug === 'volleyball') && (<div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Court Number</Label><Input value={schedCourtNumber} onChange={e => setSchedCourtNumber(e.target.value)} placeholder="e.g., Court 1" className="bg-white/5 h-14 font-black text-xs rounded-xl" /></div>)}
                  {selectedSportSlug === 'football' && (<div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Ground Identifier</Label><Input value={schedGroundNumber} onChange={e => setSchedGroundNumber(e.target.value)} placeholder="e.g., Ground A" className="bg-white/5 h-14 font-black text-xs rounded-xl" /></div>)}
                  <Button type="submit" className="md:col-span-2 h-16 uppercase font-black text-xs tracking-[0.3em] gap-4 shadow-xl shadow-primary/20 rounded-2xl mt-4">{editMatchId ? <Save className="h-6 w-6" /> : <Plus className="h-6 w-6" />}{editMatchId ? "Authorize Modification" : "Confirm Schedule Initialization"}</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
             <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-3 ml-2"><ListOrdered className="h-4 w-4 text-primary" /> Active Schedule Matrix</h3>
             <div className="grid grid-cols-1 gap-4">
               {matches?.map(match => (
                 <Card key={match.id} className="premium-card group hover:border-primary/30 transition-all bg-white/[0.01] rounded-2xl">
                   <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                     <div className="flex items-center gap-8 w-full">
                       <div className="text-center w-28 border-r border-white/10 pr-6">
                         <p className="text-[9px] font-black text-primary uppercase opacity-70">M#{match.matchNumber}</p>
                         <p className="text-sm font-black text-white uppercase">{match.time}</p>
                         <p className="text-[8px] font-black text-muted-foreground/40 uppercase mt-0.5">{match.date}</p>
                       </div>
                       <div className="flex-1">
                         <div className="flex items-center gap-3">
                           <p className="text-lg font-black uppercase italic group-hover:text-primary transition-colors tracking-tight leading-none">{match.teamA} {match.teamB !== 'Open' ? `vs ${match.teamB}` : ''}</p>
                           <Badge variant="outline" className="text-[7px] font-black uppercase h-5 bg-primary/5 border-primary/20 text-primary/60">{match.phase}</Badge>
                         </div>
                         <div className="flex items-center gap-4 mt-2">
                           <span className="text-[9px] font-black text-muted-foreground/40 uppercase flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {match.venue}</span>
                           {(match.courtNumber || match.groundNumber) && <span className="text-[9px] font-black text-primary/40 uppercase bg-primary/5 px-2 py-0.5 rounded border border-primary/10">Location: {match.courtNumber || match.groundNumber}</span>}
                           {match.reportingTime && <span className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><Clock className="h-3 w-3" /> Report: {match.reportingTime}</span>}
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <Button size="icon" variant="ghost" className="h-11 w-11 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => {
                         setEditMatchId(match.id); setSchedMatchNumber(match.matchNumber); setSchedTeamA(match.teamA); setSchedTeamB(match.teamB); setSchedTime(match.time); setSchedReportingTime(match.reportingTime || ''); setSchedDate(match.date); setSchedDay(match.day); setSchedVenue(match.venue); setSchedCourtNumber(match.courtNumber || ''); setSchedGroundNumber(match.groundNumber || ''); setSchedPhase(match.phase); if (match.group) setSchedGroup(match.group); window.scrollTo({ top: 0, behavior: 'smooth' });
                       }}><Edit2 className="h-5 w-5" /></Button>
                       <Button size="icon" variant="ghost" className="h-11 w-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => { if(confirm("Terminate this match entry?")) deleteDoc(doc(db!, 'matches', match.id)); }}><Trash2 className="h-5 w-5" /></Button>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
          </div>
        </TabsContent>

        {!isKampusRun && (
          <TabsContent value="standings" className="space-y-8">
             <Card className="premium-card border-white/5">
               <CardHeader className="bg-white/[0.02] border-b border-white/5"><CardTitle className="text-xs font-black uppercase italic tracking-widest text-primary flex items-center gap-2">Group Stage Configuration</CardTitle></CardHeader>
               <CardContent className="p-8">
                 <form onSubmit={handleAddStanding} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                   <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">House Domain</Label><Select value={newStandingTeam} onValueChange={setNewStandingTeam}><SelectTrigger className="bg-white/5 border-white/10 h-12 text-xs font-black uppercase rounded-xl"><SelectValue placeholder="Select House" /></SelectTrigger><SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[10px] font-black uppercase">{h}</SelectItem>)}</SelectContent></Select></div>
                   <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Group Assignment</Label><Select value={newStandingGroup} onValueChange={newStandingGroup}><SelectTrigger className="bg-white/5 border-white/10 h-12 text-xs font-black uppercase rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g} className="text-[10px] font-black uppercase">Group {g}</SelectItem>)}</SelectContent></Select></div>
                   <Button type="submit" className="h-12 uppercase font-black text-[10px] tracking-widest rounded-xl"><Plus className="h-4 w-4 mr-2" /> Assign to Group</Button>
                 </form>
               </CardContent>
             </Card>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {GROUPS.map(group => {
                 const groupItems = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
                 if (!groupItems?.length) return null;
                 return (
                   <Card key={group} className="premium-card border-white/5">
                     <CardHeader className="bg-white/[0.02] border-b border-white/5"><CardTitle className="text-[11px] font-black uppercase text-center tracking-[0.4em] text-primary">Group {group} Matrix</CardTitle></CardHeader>
                     <CardContent className="p-0">
                       <Table><TableHeader className="bg-white/5"><TableRow className="border-white/5"><TableHead className="text-[9px] font-black uppercase">Team</TableHead><TableHead className="text-[9px] font-black uppercase text-center">P</TableHead><TableHead className="text-[9px] font-black uppercase text-center">W</TableHead><TableHead className="text-[9px] font-black uppercase text-center">Pts</TableHead><TableHead className="text-right text-[9px] font-black uppercase">Del</TableHead></TableRow></TableHeader>
                         <TableBody>{groupItems.map(item => (<TableRow key={item.id} className="border-white/5 hover:bg-white/[0.01]"><TableCell className="text-xs font-black uppercase">{item.team}</TableCell><TableCell className="p-1"><Input type="number" className="h-8 w-12 text-center text-[10px] font-black bg-white/5 mx-auto" value={item.played} onChange={e => handleUpdateStanding(item.id, 'played', Number(e.target.value))} /></TableCell><TableCell className="p-1"><Input type="number" className="h-8 w-12 text-center text-[10px] font-black bg-white/5 mx-auto" value={item.won} onChange={e => handleUpdateStanding(item.id, 'won', Number(e.target.value))} /></TableCell><TableCell className="p-1"><Input type="number" className="h-8 w-14 text-center text-[10px] font-black bg-primary/10 border-primary/20 mx-auto" value={item.points} onChange={e => handleUpdateStanding(item.id, 'points', Number(e.target.value))} /></TableCell><TableCell className="text-right"><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => { if(confirm("Remove team from group?")) deleteDoc(doc(db!, 'standings', item.id)); }}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}
                         </TableBody></Table></CardContent></Card>);})}</div>
          </TabsContent>
        )}

        <TabsContent value="archive" className="space-y-6">
          <Card className="premium-card border-white/5">
             <CardHeader className="bg-white/[0.02] border-b border-white/5"><CardTitle className="text-xs font-black uppercase italic tracking-widest text-primary flex items-center gap-2"><ListOrdered className="h-4 w-4" /> Historical Transmission Vectors</CardTitle></CardHeader>
             <CardContent className="p-0">
               {isKampusRun ? (
                 <Table><TableHeader className="bg-white/5"><TableRow className="border-white/5"><TableHead className="w-16 text-center text-[9px] font-black uppercase">Pos</TableHead><TableHead className="text-[9px] font-black uppercase">Participant</TableHead><TableHead className="text-[9px] font-black uppercase">Profile</TableHead><TableHead className="text-[9px] font-black uppercase">Time</TableHead><TableHead className="text-right text-[9px] font-black uppercase">Action</TableHead></TableRow></TableHeader>
                   <TableBody>{runResults?.map(res => (<TableRow key={res.id} className="border-white/5 hover:bg-white/[0.01] h-14"><TableCell className="text-center font-black">#{res.position}</TableCell><TableCell><p className="text-xs font-black uppercase">{res.name}</p></TableCell><TableCell><Badge variant="outline" className="text-[7px] font-black uppercase h-5">{res.category} | {res.gender === 'M' ? 'Male' : 'Female'} {res.ageGroup !== 'Open' ? `| ${res.ageGroup}` : ''}</Badge></TableCell><TableCell className="text-xs font-black tabular-nums opacity-60">{res.time}</TableCell><TableCell className="text-right"><Button size="icon" variant="ghost" className="h-9 w-9 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => deleteDoc(doc(db!, 'runResults', res.id))}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table>
               ) : (
                 <Table><TableHeader className="bg-white/5"><TableRow className="border-white/5"><TableHead className="text-[9px] font-black uppercase">Transmission Profile</TableHead><TableHead className="text-[9px] font-black uppercase text-center">Final Score</TableHead><TableHead className="text-right text-[9px] font-black uppercase">Action</TableHead></TableRow></TableHeader>
                   <TableBody>{matches?.filter(m => m.status === 'Completed').map(match => (
                     <TableRow key={match.id} className="border-white/5 hover:bg-white/[0.01] h-16">
                       <TableCell><p className="text-xs font-black uppercase italic">M#{match.matchNumber} | {match.teamA} vs {match.teamB}</p><p className="text-[8px] font-black opacity-30 uppercase">{match.phase} {match.group ? `• Group ${match.group}` : ''}</p></TableCell>
                       <TableCell className="text-center font-black text-lg tracking-tighter text-primary">{match.scoreA} - {match.scoreB}</TableCell>
                       <TableCell className="text-right"><Button size="icon" variant="ghost" className="h-9 w-9 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => { if(confirm("Permanently erase archival record?")) deleteDoc(doc(db!, 'matches', match.id)); }}><Trash2 className="h-4 w-4" /></Button></TableCell>
                     </TableRow>
                   ))}</TableBody>
                 </Table>
               )}
             </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="access" className="space-y-8">
            <Card className="premium-card border-primary/20"><CardHeader className="bg-primary/5 border-b border-white/5"><CardTitle className="text-xs font-black uppercase italic tracking-widest text-primary flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Authorize Domain Personnel</CardTitle></CardHeader><CardContent className="p-10"><form onSubmit={handleAddPersonnel} className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Identity UID (Firebase)</Label><Input value={newAdminUid} onChange={e => setNewAdminUid(e.target.value)} className="bg-white/5 border-white/10 h-14 text-xs font-black rounded-xl" placeholder="Paste Firebase UID here" required /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Protocol Identity (Email)</Label><Input value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="bg-white/5 border-white/10 h-14 text-xs font-black rounded-xl" placeholder="operator@study.iitm.ac.in" required /></div><div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Assigned Operational Sector</Label><Select value={newAdminSport} onValueChange={setNewAdminSport}><SelectTrigger className="bg-white/5 border-white/10 h-14 font-black text-[10px] uppercase rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all" className="text-[10px] font-black uppercase">Universal Override (All Sectors)</SelectItem>{EVENTS.map(e => <SelectItem key={e.id} value={e.slug} className="text-[10px] font-black uppercase">{e.name} Sector Access Only</SelectItem>)}</SelectContent></Select></div><Button type="submit" className="md:col-span-2 h-14 uppercase font-black text-xs tracking-widest gap-4 shadow-xl shadow-primary/20 rounded-xl mt-4"><UserPlus className="h-6 w-6" /> Initialize Personnel Identity</Button></form></CardContent></Card>
            <div className="space-y-6"><h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-3 ml-2"><Users className="h-4 w-4 text-primary" /> Active Personnel Matrix</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{allAdmins?.map(admin => (<Card key={admin.uid} className="premium-card bg-white/[0.01] border-white/5 rounded-2xl group hover:border-primary/20 transition-all"><CardContent className="p-6 flex items-center justify-between gap-4"><div className="flex items-center gap-5"><div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all", admin.role === 'super-admin' ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10' : 'bg-muted/30 text-muted-foreground')}><ShieldCheck className="h-6 w-6" /></div><div className="min-w-0"><p className="text-xs font-black uppercase truncate text-white">{admin.email}</p><div className="flex items-center gap-2 mt-1"><Badge variant="outline" className="text-[7px] font-black uppercase px-1.5 h-4 border-white/10">{admin.role}</Badge><span className="text-[8px] font-black text-muted-foreground uppercase opacity-40 tracking-widest">{admin.assignedSport || 'Universal'}</span></div></div></div>{admin.role !== 'super-admin' && (<Button size="icon" variant="ghost" className="h-10 w-10 text-destructive/30 hover:text-destructive hover:bg-destructive/10 rounded-xl flex-shrink-0" onClick={() => deleteDoc(doc(db!, 'admins', admin.uid))}><Trash2 className="h-5 w-5" /></Button>)}</CardContent></Card>))}</div></div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
