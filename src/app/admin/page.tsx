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
import { Save, Plus, ShieldCheck, LogOut, Trophy, Timer, ListOrdered, Users, UserPlus, Trash2, Edit2, X, MapPin, Calendar, ChevronLeft, ChevronRight, Zap, CircleDot, Target, Clock, Activity } from 'lucide-react';
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

  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [status, setStatus] = useState<'Upcoming' | 'Live' | 'Completed'>('Live');
  const [badmintonResults, setBadmintonResults] = useState<BadmintonMatchResult[]>([
    { type: 'MS', score: '0-0', winner: '' },
    { type: 'WS', score: '0-0', winner: '' },
    { type: 'MD', score: '0-0', winner: '' },
    { type: 'XD', score: '0-0', winner: '' },
  ]);

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

  const [run3kReporting, setRun3kReporting] = useState('');
  const [run3kStart, setRun3kStart] = useState('');
  const [run5kReporting, setRun5kReporting] = useState('');
  const [run5kStart, setRun5kStart] = useState('');
  const [runDate, setRunDate] = useState('');

  const [runnerName, setRunnerName] = useState('');
  const [runnerPos, setRunnerPos] = useState<number>(1);
  const [runnerTime, setRunnerTime] = useState('');
  const [runnerCat, setRunnerCat] = useState('3km');
  const [runnerGender, setRunnerGender] = useState<'M' | 'F'>('M');
  const [runnerAgeGroup, setRunnerAgeGroup] = useState('Open');

  const [newStandingTeam, setNewStandingTeam] = useState('');
  const [newStandingGroup, setNewStandingGroup] = useState('A');

  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminSport, setNewAdminSport] = useState('all');

  const rawMatchesQuery = useMemo(() => {
    if (!db || !selectedSportSlug) return null;
    return query(collection(db, 'matches'), where('sport', '==', selectedSportSlug));
  }, [db, selectedSportSlug]);
  const { data: rawMatches } = useCollection<Match>(rawMatchesQuery);

  const matches = useMemo(() => {
    return [...(rawMatches || [])].sort((a, b) => {
      const numA = parseInt(a.matchNumber) || 0;
      const numB = parseInt(b.matchNumber) || 0;
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
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
    toast({ title: "Scores Updated" });
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
      toast({ title: "Match Added" });
    }
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

    toast({ title: "Race Schedule Saved" });
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
    toast({ title: "Team Added to Table" });
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
    toast({ title: "Result Recorded" });
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
    toast({ title: "Admin Added" });
  };

  if (!selectedSportSlug) {
    return (
      <div className="space-y-10 max-w-5xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Admin Panel</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Role: {adminProfile.role}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="bg-destructive/10 text-destructive hover:bg-destructive/20 text-[9px] font-black uppercase tracking-widest gap-2 h-8">
            <LogOut className="h-3 w-3" /> Logout
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            return (
              <Button key={event.id} variant="ghost" className="p-0 h-auto group" onClick={() => setSelectedSportSlug(event.slug)}>
                <Card className="premium-card w-full h-40 border-white/5 hover:border-primary/50 transition-all duration-500 overflow-hidden">
                  <CardContent className="p-0 flex h-full">
                    <div className="w-1/4 bg-primary/10 flex items-center justify-center border-r border-white/5 group-hover:bg-primary/20">
                      <IconComp className="h-10 w-10 text-primary" />
                    </div>
                    <div className="w-3/4 p-6 flex flex-col justify-center text-left space-y-1">
                      <h2 className="text-xl font-black italic uppercase tracking-tighter">{event.name}</h2>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{event.description}</p>
                      <div className="pt-2 flex items-center text-[10px] font-black uppercase text-primary gap-2 opacity-0 group-hover:opacity-100 transition-opacity">Manage <ChevronRight className="h-3 w-3" /></div>
                    </div>
                  </CardContent>
                </Card>
              </Button>
            );
          })}
        </div>
        {isSuperAdmin && (
          <Card className="premium-card border-primary/20 bg-primary/5 mt-8">
            <CardHeader className="py-4"><CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> System Settings</CardTitle></CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full uppercase font-black text-[9px] h-10 tracking-widest" onClick={() => { setSelectedSportSlug('football'); setActiveTab('access'); }}>Manage Personnel</Button>
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
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSportSlug(null)} className="p-0 h-auto text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/70 gap-2 mb-1"><ChevronLeft className="h-3 w-3" /> Back</Button>
          <h1 className="text-3xl font-black italic uppercase flex items-center gap-3 tracking-tighter">{currentSport?.name} Panel</h1>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">User: {adminProfile.email}</p>
        </div>
        <div className="flex items-center gap-4">
           <Badge variant="outline" className="h-7 border-primary/20 text-primary uppercase font-black text-[9px] bg-primary/5 tracking-widest px-3">Sync Active</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={cn(
          "grid w-full bg-muted/20 h-14 p-1 border border-white/5 rounded-xl overflow-x-auto no-scrollbar scroll-smooth",
          gridColsClass
        )}>
          <TabsTrigger value="control" className="text-[9px] font-black uppercase rounded-lg">Scores</TabsTrigger>
          <TabsTrigger value="schedule" className="text-[9px] font-black uppercase rounded-lg">Schedule</TabsTrigger>
          {!isKampusRun && <TabsTrigger value="standings" className="text-[9px] font-black uppercase rounded-lg">Table</TabsTrigger>}
          <TabsTrigger value="archive" className="text-[9px] font-black uppercase rounded-lg">History</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="access" className="text-[9px] font-black uppercase rounded-lg hidden md:flex">Admins</TabsTrigger>}
        </TabsList>

        <TabsContent value="control" className="space-y-6">
          {isKampusRun ? (
            <Card className="premium-card border-primary/20">
              <CardHeader className="bg-primary/5 border-b border-white/5 py-4"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Record Results</CardTitle></CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAddRunResult} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Name</Label>
                    <Input value={runnerName} onChange={e => setRunnerName(e.target.value)} className="bg-white/5 h-12 border-white/10 text-xs font-black uppercase" placeholder="Full Name" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Rank</Label>
                    <Input type="number" value={runnerPos} onChange={e => setRunnerPos(Number(e.target.value))} className="bg-white/5 h-12 border-white/10 text-xs font-black" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Time</Label>
                    <Input placeholder="00:00.0" value={runnerTime} onChange={e => setRunnerTime(e.target.value)} className="bg-white/5 h-12 border-white/10 text-xs font-black" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Category</Label>
                    <Select value={runnerCat} onValueChange={(v: any) => setRunnerCat(v)}>
                      <SelectTrigger className="bg-white/5 h-12 text-[10px] font-black uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3km" className="text-[10px] font-black uppercase">3KM</SelectItem>
                        <SelectItem value="5km" className="text-[10px] font-black uppercase">5KM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Gender</Label>
                    <Select value={runnerGender} onValueChange={(v: any) => setRunnerGender(v)}>
                      <SelectTrigger className="bg-white/5 h-12 text-[10px] font-black uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M" className="text-[10px] font-black uppercase">Male</SelectItem>
                        <SelectItem value="F" className="text-[10px] font-black uppercase">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                   {runnerCat === '5km' && (
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase opacity-60 ml-1">Age Group</Label>
                      <Select value={runnerAgeGroup} onValueChange={setRunnerAgeGroup}>
                        <SelectTrigger className="bg-white/5 h-12 text-[10px] font-black uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="18-25" className="text-[10px] font-black uppercase">18-25</SelectItem>
                          <SelectItem value="26+" className="text-[10px] font-black uppercase">26+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button type="submit" className="h-12 mt-auto uppercase font-black text-[10px] tracking-widest md:col-span-3"><Plus className="h-3.5 w-3.5 mr-2" /> Add Result</Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="premium-card border-white/5">
              <CardContent className="p-6 space-y-8">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase opacity-50 tracking-widest ml-1">Select Match</Label>
                  <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-14 text-[11px] font-black uppercase rounded-xl">
                      <SelectValue placeholder="Selecting match..." />
                    </SelectTrigger>
                    <SelectContent>
                      {matches?.filter(m => m.status !== 'Completed').map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-[10px] font-black uppercase">M#{m.matchNumber} | {m.teamA} vs {m.teamB}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedMatchId && (
                  <form onSubmit={handleUpdateMatch} className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-2 text-center">
                        <Label className="text-[9px] font-black uppercase block opacity-40">{activeMatch?.teamA}</Label>
                        <Input type="number" value={scoreA} onChange={e => setScoreA(Number(e.target.value))} className="text-center text-4xl md:text-5xl font-black h-20 md:h-24 bg-white/5 border-white/10 rounded-2xl" />
                      </div>
                      <div className="text-2xl font-black opacity-10 pt-6">:</div>
                      <div className="flex-1 space-y-2 text-center">
                        <Label className="text-[9px] font-black uppercase block opacity-40">{activeMatch?.teamB}</Label>
                        <Input type="number" value={scoreB} onChange={e => setScoreB(Number(e.target.value))} className="text-center text-4xl md:text-5xl font-black h-20 md:h-24 bg-white/5 border-white/10 rounded-2xl" />
                      </div>
                    </div>
                    {selectedSportSlug === 'badminton' && (
                      <div className="space-y-5 pt-6 border-t border-white/5">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-primary/60">Set Scores</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {badmintonResults.map((res, idx) => (
                            <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                              <p className="text-[8px] font-black text-primary uppercase tracking-tighter opacity-70">{res.type}</p>
                              <Input value={res.score} onChange={e => { const n = [...badmintonResults]; n[idx].score = e.target.value; setBadmintonResults(n); }} className="h-8 text-[10px] font-black text-center bg-black/20" placeholder="0-0" />
                              <Select value={res.winner} onValueChange={v => { const n = [...badmintonResults]; n[idx].winner = v; setBadmintonResults(n); }}>
                                <SelectTrigger className="h-7 text-[8px] font-black uppercase bg-transparent px-2"><SelectValue placeholder="Winner" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={activeMatch?.teamA || 'Team A'} className="text-[8px] uppercase">{activeMatch?.teamA}</SelectItem>
                                  <SelectItem value={activeMatch?.teamB || 'Team B'} className="text-[8px] uppercase">{activeMatch?.teamB}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase opacity-50 tracking-widest ml-1">Status</Label>
                      <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-12 text-[10px] font-black uppercase rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Upcoming" className="text-[10px] font-black uppercase">Upcoming</SelectItem>
                          <SelectItem value="Live" className="text-[10px] font-black uppercase">Live</SelectItem>
                          <SelectItem value="Completed" className="text-[10px] font-black uppercase">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full h-14 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-primary/20 rounded-xl">Update Match</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
           {isKampusRun ? (
             <Card className="premium-card border-white/5">
               <CardHeader className="bg-primary/5 border-b border-white/5 py-4"><CardTitle className="text-[10px] font-black uppercase italic tracking-widest text-primary">Race Schedule</CardTitle></CardHeader>
               <CardContent className="p-6">
                 <form onSubmit={handleSaveRunSchedule} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Date</Label><Input type="date" value={runDate} onChange={e => setRunDate(e.target.value)} className="bg-white/5 h-12 font-black text-xs" /></div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-primary italic">3KM Run</h4>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1"><Label className="text-[8px] font-black uppercase opacity-40">Reporting Time</Label><Input value={run3kReporting} onChange={e => setRun3kReporting(e.target.value)} placeholder="06:00 AM" className="bg-white/5 h-10 font-black text-xs" /></div>
                          <div className="space-y-1"><Label className="text-[8px] font-black uppercase opacity-40">Start Time</Label><Input value={run3kStart} onChange={e => setRun3kStart(e.target.value)} placeholder="06:30 AM" className="bg-white/5 h-10 font-black text-xs" /></div>
                        </div>
                      </div>
                      <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-primary italic">5KM Run</h4>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1"><Label className="text-[8px] font-black uppercase opacity-40">Reporting Time</Label><Input value={run5kReporting} onChange={e => setRun5kReporting(e.target.value)} placeholder="05:30 AM" className="bg-white/5 h-10 font-black text-xs" /></div>
                          <div className="space-y-1"><Label className="text-[8px] font-black uppercase opacity-40">Start Time</Label><Input value={run5kStart} onChange={e => setRun5kStart(e.target.value)} placeholder="06:00 AM" className="bg-white/5 h-10 font-black text-xs" /></div>
                        </div>
                      </div>
                   </div>
                   <Button type="submit" className="w-full h-14 uppercase font-black tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20">Save Schedule</Button>
                 </form>
               </CardContent>
             </Card>
           ) : (
            <Card className="premium-card border-white/5">
              <CardHeader className="bg-white/[0.02] border-b border-white/5 py-4"><CardTitle className="text-[10px] font-black uppercase italic tracking-widest">{editMatchId ? "Edit Match" : "New Match"}</CardTitle></CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCreateOrUpdateSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Match Number</Label><Input value={schedMatchNumber} onChange={e => setSchedMatchNumber(e.target.value)} placeholder="e.g., 101" className="bg-white/5 h-12 font-black text-xs" required /></div>
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Phase</Label><Select value={schedPhase} onValueChange={(v: any) => setSchedPhase(v)}><SelectTrigger className="bg-white/5 h-12 font-black text-[10px] uppercase"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="group" className="text-[10px] font-black uppercase">Group Stage</SelectItem><SelectItem value="semi-final" className="text-[10px] font-black uppercase">Semi Final</SelectItem><SelectItem value="third-place" className="text-[10px] font-black uppercase">3rd Place</SelectItem><SelectItem value="final" className="text-[10px] font-black uppercase">Grand Final</SelectItem></SelectContent></Select></div>
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Team A</Label><Select value={schedTeamA} onValueChange={setSchedTeamA}><SelectTrigger className="bg-white/5 h-12 font-black text-[10px] uppercase"><SelectValue placeholder="Select House" /></SelectTrigger><SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[10px] font-black uppercase">{h}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Team B</Label><Select value={schedTeamB} onValueChange={setSchedTeamB}><SelectTrigger className="bg-white/5 h-12 font-black text-[10px] uppercase"><SelectValue placeholder="Select House" /></SelectTrigger><SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[10px] font-black uppercase">{h}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Date</Label><Input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} className="bg-white/5 h-12 font-black text-xs" required /></div>
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Day</Label><Input value={schedDay} onChange={e => setSchedDay(e.target.value)} placeholder="e.g., Saturday" className="bg-white/5 h-12 font-black text-xs" required /></div>
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Reporting Time</Label><Input value={schedReportingTime} onChange={e => setSchedReportingTime(e.target.value)} placeholder="04:00 PM" className="bg-white/5 h-12 font-black text-xs" /></div>
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Start Time</Label><Input placeholder="04:30 PM" value={schedTime} onChange={e => setSchedTime(e.target.value)} className="bg-white/5 h-12 font-black text-xs" required /></div>
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Venue</Label><Input value={schedVenue} onChange={e => setSchedVenue(e.target.value)} placeholder="e.g., Main Ground" className="bg-white/5 h-12 font-black text-xs" required /></div>
                  {(selectedSportSlug === 'badminton' || selectedSportSlug === 'volleyball') && (<div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Court</Label><Input value={schedCourtNumber} onChange={e => setSchedCourtNumber(e.target.value)} placeholder="e.g., Court 1" className="bg-white/5 h-12 font-black text-xs" /></div>)}
                  {selectedSportSlug === 'football' && (<div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Ground</Label><Input value={schedGroundNumber} onChange={e => setSchedGroundNumber(e.target.value)} placeholder="e.g., Ground A" className="bg-white/5 h-12 font-black text-xs" /></div>)}
                  <Button type="submit" className="md:col-span-2 h-14 uppercase font-black text-[10px] tracking-[0.2em] gap-3 shadow-lg shadow-primary/20 rounded-xl mt-2">{editMatchId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editMatchId ? "Save Changes" : "Add Match"}</Button>
                </form>
              </CardContent>
            </Card>
           )}

           <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2 ml-1"><Activity className="h-4 w-4 text-primary" /> Upcoming Matches</h3>
             <div className="grid grid-cols-1 gap-3">
               {matches?.map(match => (
                 <Card key={match.id} className="premium-card group hover:border-primary/30 transition-all bg-white/[0.01]">
                   <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                     <div className="flex items-center gap-6 w-full">
                       <div className="text-center w-20 border-r border-white/10 pr-4">
                         <p className="text-[8px] font-black text-primary uppercase opacity-70">M#{match.matchNumber}</p>
                         <p className="text-base font-black text-white uppercase tabular-nums">{match.time}</p>
                       </div>
                       <div className="flex-1">
                         <p className="text-lg font-black uppercase italic group-hover:text-primary transition-colors tracking-tight leading-none">{match.teamA} {match.teamB !== 'Open' ? `vs ${match.teamB}` : ''}</p>
                         <div className="flex items-center gap-3 mt-1.5">
                           <span className="text-[8px] font-black text-muted-foreground/40 uppercase flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {match.venue}</span>
                           <Badge variant="outline" className="text-[7px] font-black uppercase h-4 bg-primary/5 border-primary/20 text-primary/60">{match.phase}</Badge>
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => {
                         setEditMatchId(match.id); setSchedMatchNumber(match.matchNumber); setSchedTeamA(match.teamA); setSchedTeamB(match.teamB); setSchedTime(match.time); setSchedReportingTime(match.reportingTime || ''); setSchedDate(match.date); setSchedDay(match.day); setSchedVenue(match.venue); setSchedCourtNumber(match.courtNumber || ''); setSchedGroundNumber(match.groundNumber || ''); setSchedPhase(match.phase); if (match.group) setSchedGroup(match.group); window.scrollTo({ top: 0, behavior: 'smooth' });
                       }}><Edit2 className="h-4 w-4" /></Button>
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteDoc(doc(db!, 'matches', match.id))}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
           </div>
        </TabsContent>

        {!isKampusRun && (
          <TabsContent value="standings" className="space-y-6">
             <Card className="premium-card border-white/5">
               <CardHeader className="bg-white/[0.02] border-b border-white/5 py-4"><CardTitle className="text-[10px] font-black uppercase italic tracking-widest text-primary flex items-center gap-2">Add Team to Table</CardTitle></CardHeader>
               <CardContent className="p-6">
                 <form onSubmit={handleAddStanding} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                   <div className="space-y-1"><Label className="text-[9px] font-black uppercase opacity-60">Team</Label><Select value={newStandingTeam} onValueChange={setNewStandingTeam}><SelectTrigger className="bg-white/5 h-10 text-xs font-black uppercase"><SelectValue placeholder="Select House" /></SelectTrigger><SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[10px] font-black uppercase">{h}</SelectItem>)}</SelectContent></Select></div>
                   <div className="space-y-1"><Label className="text-[9px] font-black uppercase opacity-60">Group</Label><Select value={newStandingGroup} onValueChange={setNewStandingGroup}><SelectTrigger className="bg-white/5 h-10 text-xs font-black uppercase"><SelectValue /></SelectTrigger><SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g} className="text-[10px] font-black uppercase">Group {g}</SelectItem>)}</SelectContent></Select></div>
                   <Button type="submit" className="h-10 uppercase font-black text-[9px] tracking-widest"><Plus className="h-3 w-3 mr-2" /> Add to Table</Button>
                 </form>
               </CardContent>
             </Card>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {GROUPS.map(group => {
                 const groupItems = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
                 if (!groupItems?.length) return null;
                 return (
                   <Card key={group} className="premium-card border-white/5">
                     <CardHeader className="bg-white/[0.02] border-b border-white/5 py-3"><CardTitle className="text-[10px] font-black uppercase text-center tracking-[0.3em] text-primary">Group {group}</CardTitle></CardHeader>
                     <CardContent className="p-0">
                       <Table><TableHeader className="bg-white/5"><TableRow className="border-white/5"><TableHead className="text-[8px] font-black uppercase px-4 h-10">Team</TableHead><TableHead className="text-[8px] font-black uppercase text-center px-2 h-10">P</TableHead><TableHead className="text-[8px] font-black uppercase text-center px-2 h-10">Pts</TableHead><TableHead className="text-right text-[8px] font-black uppercase px-4 h-10">Del</TableHead></TableRow></TableHeader>
                         <TableBody>{groupItems.map(item => (<TableRow key={item.id} className="border-white/5 hover:bg-white/[0.01]"><TableCell className="text-sm font-black uppercase px-4 py-3">{item.team}</TableCell><TableCell className="p-1 px-2"><Input type="number" className="h-8 w-10 text-center text-xs font-black bg-white/5 mx-auto" value={item.played} onChange={e => handleUpdateStanding(item.id, 'played', Number(e.target.value))} /></TableCell><TableCell className="p-1 px-2"><Input type="number" className="h-8 w-12 text-center text-xs font-black bg-primary/10 border-primary/20 mx-auto" value={item.points} onChange={e => handleUpdateStanding(item.id, 'points', Number(e.target.value))} /></TableCell><TableCell className="text-right px-4"><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/40 hover:text-destructive" onClick={() => deleteDoc(doc(db!, 'standings', item.id))}><Trash2 className="h-3 w-3" /></Button></TableCell></TableRow>))}
                         </TableBody></Table></CardContent></Card>);})}</div>
          </TabsContent>
        )}

        <TabsContent value="archive" className="space-y-6">
          <Card className="premium-card border-white/5">
             <CardHeader className="bg-white/[0.02] border-b border-white/5 py-4"><CardTitle className="text-[10px] font-black uppercase italic tracking-widest text-primary flex items-center gap-2"><ListOrdered className="h-4 w-4" /> Past Results</CardTitle></CardHeader>
             <CardContent className="p-0">
               {isKampusRun ? (
                 <Table><TableHeader className="bg-white/5"><TableRow className="border-white/5"><TableHead className="w-14 text-center text-[8px] font-black uppercase h-10 px-3">Pos</TableHead><TableHead className="text-[8px] font-black uppercase h-10 px-4">Name</TableHead><TableHead className="text-[8px] font-black uppercase h-10 px-4">Profile</TableHead><TableHead className="text-right text-[8px] font-black uppercase h-10 px-4">Action</TableHead></TableRow></TableHeader>
                   <TableBody>{runResults?.map(res => (<TableRow key={res.id} className="border-white/5 hover:bg-white/[0.01] h-14"><TableCell className="text-center font-black text-lg px-3">#{res.position}</TableCell><TableCell className="px-4"><p className="text-sm font-black uppercase">{res.name}</p></TableCell><TableCell className="px-4"><div className="flex flex-wrap gap-1"><Badge variant="outline" className="text-[7px] font-black uppercase h-4 px-1.5">{res.category}</Badge><Badge variant="outline" className="text-[7px] font-black uppercase h-4 px-1.5">{res.gender === 'M' ? 'M' : 'F'}</Badge></div></TableCell><TableCell className="text-right px-4"><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/40 hover:text-destructive" onClick={() => deleteDoc(doc(db!, 'runResults', res.id))}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table>
               ) : (
                 <Table><TableHeader className="bg-white/5"><TableRow className="border-white/5"><TableHead className="text-[8px] font-black uppercase h-10 px-4">Match</TableHead><TableHead className="text-[8px] font-black uppercase text-center h-10 px-4">Score</TableHead><TableHead className="text-right text-[8px] font-black uppercase h-10 px-4">Action</TableHead></TableRow></TableHeader>
                   <TableBody>{matches?.filter(m => m.status === 'Completed').map(match => (
                     <TableRow key={match.id} className="border-white/5 hover:bg-white/[0.01] h-16">
                       <TableCell className="px-4"><p className="text-sm font-black uppercase italic">M#{match.matchNumber} | {match.teamA} vs {match.teamB}</p><p className="text-[8px] font-black opacity-30 uppercase">{match.phase}</p></TableCell>
                       <TableCell className="text-center font-black text-xl text-primary px-4">{match.scoreA} - {match.scoreB}</TableCell>
                       <TableCell className="text-right px-4"><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/40 hover:text-destructive" onClick={() => deleteDoc(doc(db!, 'matches', match.id))}><Trash2 className="h-4 w-4" /></Button></TableCell>
                     </TableRow>
                   ))}</TableBody>
                 </Table>
               )}
             </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="access" className="space-y-8">
            <Card className="premium-card border-primary/20"><CardHeader className="bg-primary/5 border-b border-white/5 py-4"><CardTitle className="text-[10px] font-black uppercase italic tracking-widest text-primary flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Add Administrator</CardTitle></CardHeader><CardContent className="p-6"><form onSubmit={handleAddPersonnel} className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Identity UID</Label><Input value={newAdminUid} onChange={e => setNewAdminUid(e.target.value)} className="bg-white/5 border-white/10 h-12 text-xs font-black" placeholder="Firebase UID" required /></div><div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Email</Label><Input value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="bg-white/5 border-white/10 h-12 text-xs font-black" placeholder="operator@study.iitm.ac.in" required /></div><div className="space-y-1 md:col-span-2"><Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Assigned Sport</Label><Select value={newAdminSport} onValueChange={setNewAdminSport}><SelectTrigger className="bg-white/5 h-12 font-black text-[10px] uppercase"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all" className="text-[10px] font-black uppercase">All Sports</SelectItem>{EVENTS.map(e => <SelectItem key={e.id} value={e.slug} className="text-[10px] font-black uppercase">{e.name}</SelectItem>)}</SelectContent></Select></div><Button type="submit" className="md:col-span-2 h-12 uppercase font-black text-[10px] tracking-widest gap-3 shadow-lg shadow-primary/20 rounded-xl mt-2"><UserPlus className="h-4 w-4" /> Add Admin</Button></form></CardContent></Card>
            <div className="space-y-4"><h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2 ml-1"><Users className="h-4 w-4 text-primary" /> Active Admins</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{allAdmins?.map(admin => (<Card key={admin.uid} className="premium-card bg-white/[0.01] border-white/5 rounded-xl group hover:border-primary/20 transition-all"><CardContent className="p-4 flex items-center justify-between gap-3"><div className="flex items-center gap-4"><div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all", admin.role === 'super-admin' ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10' : 'bg-muted/30 text-muted-foreground')}><ShieldCheck className="h-5 w-5" /></div><div className="min-w-0"><p className="text-[10px] font-black uppercase truncate text-white">{admin.email}</p><div className="flex items-center gap-2 mt-0.5"><Badge variant="outline" className="text-[6px] font-black uppercase px-1.5 h-3.5 border-white/10">{admin.role}</Badge></div></div></div>{admin.role !== 'super-admin' && (<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/30 hover:text-destructive flex-shrink-0" onClick={() => deleteDoc(doc(db!, 'admins', admin.uid))}><Trash2 className="h-4 w-4" /></Button>)}</CardContent></Card>))}</div></div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
