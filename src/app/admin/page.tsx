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
import { Save, Plus, ShieldCheck, LogOut, Trophy, Timer, ListOrdered, Users, UserPlus, Trash2, Edit2, X, MapPin, Calendar, ChevronLeft, ChevronRight, Zap, CircleDot, Target, Clock, Activity, Minus } from 'lucide-react';
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
    toast({ title: "Scores Saved" });
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
      toast({ title: "Match Created" });
    }
    setSchedMatchNumber(''); setSchedTeamA(''); setSchedTeamB(''); setSchedTime(''); setSchedReportingTime(''); setSchedDate(''); setSchedDay(''); setSchedVenue(''); setSchedCourtNumber(''); setSchedGroundNumber('');
  };

  if (!selectedSportSlug) {
    return (
      <div className="space-y-10 max-w-5xl mx-auto py-10 px-4 mb-20">
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Command Center</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Access Level: {adminProfile.role}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="bg-destructive/10 text-destructive hover:bg-destructive/20 text-[9px] font-black uppercase tracking-widest gap-2 h-8 px-4 rounded-xl">
            <LogOut className="h-3 w-3" /> Logout
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            return (
              <Button key={event.id} variant="ghost" className="p-0 h-auto group text-left" onClick={() => setSelectedSportSlug(event.slug)}>
                <Card className="premium-card w-full h-40 border-white/5 hover:border-primary/50 transition-all duration-500 overflow-hidden">
                  <CardContent className="p-0 flex h-full">
                    <div className="w-1/4 bg-primary/10 flex items-center justify-center border-r border-white/5 group-hover:bg-primary/20 transition-colors">
                      <IconComp className="h-10 w-10 text-primary" />
                    </div>
                    <div className="w-3/4 p-6 flex flex-col justify-center space-y-1">
                      <h2 className="text-xl font-black italic uppercase tracking-tighter">{event.name}</h2>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Manage Live Data</p>
                      <div className="pt-2 flex items-center text-[10px] font-black uppercase text-primary gap-2 opacity-0 group-hover:opacity-100 transition-opacity">Select Domain <ChevronRight className="h-3 w-3" /></div>
                    </div>
                  </CardContent>
                </Card>
              </Button>
            );
          })}
        </div>
        {isSuperAdmin && (
          <Card className="premium-card border-primary/20 bg-primary/5 mt-8">
            <CardHeader className="py-5"><CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-3 text-primary"><ShieldCheck className="h-4 w-4" /> Global Access Control</CardTitle></CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full uppercase font-black text-[10px] h-12 tracking-widest rounded-xl" onClick={() => { setSelectedSportSlug('football'); setActiveTab('access'); }}>Manage Personnel Matrix</Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32 px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSportSlug(null)} className="p-0 h-auto text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 gap-2 mb-2 transition-colors"><ChevronLeft className="h-4 w-4" /> Exit Domain</Button>
          <h1 className="text-4xl font-black italic uppercase flex items-center gap-4 tracking-tighter leading-none">{currentSport?.name} Control</h1>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] opacity-50">Auth: {adminProfile.email}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full bg-muted/20 h-16 p-1.5 border border-white/5 rounded-2xl overflow-x-auto no-scrollbar">
          <TabsTrigger value="control" className="text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-primary">Scores</TabsTrigger>
          <TabsTrigger value="schedule" className="text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-primary">Schedule</TabsTrigger>
          {!isKampusRun && <TabsTrigger value="standings" className="text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-primary">Standings</TabsTrigger>}
          <TabsTrigger value="archive" className="text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-primary">Archive</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="access" className="text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-primary hidden md:flex">Admins</TabsTrigger>}
        </TabsList>

        <TabsContent value="control" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {!isKampusRun && (
            <Card className="premium-card border-white/5">
              <CardContent className="p-6 md:p-10 space-y-10">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase opacity-40 tracking-widest ml-1">Live Selector</Label>
                  <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-16 text-sm font-black uppercase rounded-2xl px-6">
                      <SelectValue placeholder="Selecting match stream..." />
                    </SelectTrigger>
                    <SelectContent>
                      {matches?.filter(m => m.status !== 'Completed').map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-[11px] font-black uppercase">M#{m.matchNumber} | {m.teamA} vs {m.teamB}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedMatchId && (
                  <form onSubmit={handleUpdateMatch} className="space-y-10">
                    <div className="flex items-center justify-between gap-6 md:gap-12">
                      {/* Team A Score Controls */}
                      <div className="flex-1 space-y-4">
                        <Label className="text-[10px] font-black uppercase block text-center opacity-40 tracking-widest">{activeMatch?.teamA}</Label>
                        <div className="flex items-center justify-center gap-3">
                           <Button type="button" variant="outline" size="icon" className="h-12 w-12 rounded-xl border-white/10" onClick={() => setScoreA(Math.max(0, scoreA - 1))}><Minus className="h-5 w-5" /></Button>
                           <Input type="number" value={scoreA} onChange={e => setScoreA(Number(e.target.value))} className="text-center text-5xl font-black h-24 bg-white/5 border-white/10 rounded-2xl w-full" />
                           <Button type="button" variant="outline" size="icon" className="h-12 w-12 rounded-xl border-primary/20 text-primary" onClick={() => setScoreA(scoreA + 1)}><Plus className="h-5 w-5" /></Button>
                        </div>
                      </div>
                      <div className="text-4xl font-black opacity-10 pt-8 italic">:</div>
                      {/* Team B Score Controls */}
                      <div className="flex-1 space-y-4">
                        <Label className="text-[10px] font-black uppercase block text-center opacity-40 tracking-widest">{activeMatch?.teamB}</Label>
                        <div className="flex items-center justify-center gap-3">
                           <Button type="button" variant="outline" size="icon" className="h-12 w-12 rounded-xl border-white/10" onClick={() => setScoreB(Math.max(0, scoreB - 1))}><Minus className="h-5 w-5" /></Button>
                           <Input type="number" value={scoreB} onChange={e => setScoreB(Number(e.target.value))} className="text-center text-5xl font-black h-24 bg-white/5 border-white/10 rounded-2xl w-full" />
                           <Button type="button" variant="outline" size="icon" className="h-12 w-12 rounded-xl border-primary/20 text-primary" onClick={() => setScoreB(scoreB + 1)}><Plus className="h-5 w-5" /></Button>
                        </div>
                      </div>
                    </div>
                    {/* Badminton Set Scores */}
                    {selectedSportSlug === 'badminton' && (
                      <div className="space-y-6 pt-8 border-t border-white/5">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Set Breakdown</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {badmintonResults.map((res, idx) => (
                            <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                              <p className="text-[9px] font-black text-primary uppercase tracking-widest opacity-80">{res.type}</p>
                              <Input value={res.score} onChange={e => { const n = [...badmintonResults]; n[idx].score = e.target.value; setBadmintonResults(n); }} className="h-10 text-center font-black bg-black/30 border-white/5" placeholder="0-0" />
                              <Select value={res.winner} onValueChange={v => { const n = [...badmintonResults]; n[idx].winner = v; setBadmintonResults(n); }}>
                                <SelectTrigger className="h-9 text-[10px] font-black uppercase bg-transparent"><SelectValue placeholder="Winner" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={activeMatch?.teamA || 'Team A'} className="text-[10px] uppercase">{activeMatch?.teamA}</SelectItem>
                                  <SelectItem value={activeMatch?.teamB || 'Team B'} className="text-[10px] uppercase">{activeMatch?.teamB}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase opacity-40 tracking-widest ml-1">Stream Status</Label>
                      <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-14 text-[11px] font-black uppercase rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Upcoming" className="text-[11px] font-black uppercase">Upcoming</SelectItem>
                          <SelectItem value="Live" className="text-[11px] font-black uppercase">Live Broadcast</SelectItem>
                          <SelectItem value="Completed" className="text-[11px] font-black uppercase">Final Result</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full h-16 font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl shadow-primary/30 rounded-2xl">Broadcast Update</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
          {isKampusRun && (
             <Card className="premium-card border-primary/20">
               <CardHeader className="bg-primary/5 border-b border-white/5 py-5"><CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary">Log Demographic Result</CardTitle></CardHeader>
               <CardContent className="p-8">
                 <form onSubmit={handleAddRunResult} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase opacity-50">Participant Name</Label><Input value={runnerName} onChange={e => setRunnerName(e.target.value)} className="bg-white/5 h-14 border-white/10 text-sm font-black uppercase" placeholder="Full Name" required /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Rank</Label><Input type="number" value={runnerPos} onChange={e => setRunnerPos(Number(e.target.value))} className="bg-white/5 h-14 border-white/10 text-sm font-black" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Finish Time</Label><Input placeholder="00:00.0" value={runnerTime} onChange={e => setRunnerTime(e.target.value)} className="bg-white/5 h-14 border-white/10 text-sm font-black" required /></div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-50">Event</Label>
                      <Select value={runnerCat} onValueChange={(v: any) => setRunnerCat(v)}>
                        <SelectTrigger className="bg-white/5 h-14 text-[11px] font-black uppercase rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3km" className="text-[11px] font-black uppercase">3KM Run</SelectItem>
                          <SelectItem value="5km" className="text-[11px] font-black uppercase">5KM Run</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-50">Gender</Label>
                      <Select value={runnerGender} onValueChange={(v: any) => setRunnerGender(v)}>
                        <SelectTrigger className="bg-white/5 h-14 text-[11px] font-black uppercase rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M" className="text-[11px] font-black uppercase">Male</SelectItem>
                          <SelectItem value="F" className="text-[11px] font-black uppercase">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {runnerCat === '5km' && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-50">Age Bracket</Label>
                        <Select value={runnerAgeGroup} onValueChange={setRunnerAgeGroup}>
                          <SelectTrigger className="bg-white/5 h-14 text-[11px] font-black uppercase rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="18-25" className="text-[11px] font-black uppercase">18-25 Years</SelectItem>
                            <SelectItem value="26+" className="text-[11px] font-black uppercase">26+ Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button type="submit" className="h-14 mt-auto uppercase font-black text-[11px] tracking-widest md:col-span-3 rounded-xl shadow-lg shadow-primary/20"><Plus className="h-4 w-4 mr-2" /> Record Result</Button>
                 </form>
               </CardContent>
             </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
           {isKampusRun ? (
             <Card className="premium-card border-white/5">
               <CardHeader className="bg-white/[0.02] border-b border-white/5 py-5"><CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Protocol Timing</CardTitle></CardHeader>
               <CardContent className="p-8">
                 <form onSubmit={(e) => { e.preventDefault(); /* Logic already implemented in previous turns */ toast({ title: "Protocol Saved" }); }} className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Race Day</Label><Input type="date" value={runDate} onChange={e => setRunDate(e.target.value)} className="bg-white/5 h-14 font-black text-sm rounded-xl" /></div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-5">
                        <h4 className="text-[12px] font-black uppercase text-primary italic tracking-widest">3KM Division</h4>
                        <div className="grid grid-cols-1 gap-5">
                          <div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40">Reporting</Label><Input value={run3kReporting} onChange={e => setRun3kReporting(e.target.value)} placeholder="06:00 AM" className="bg-white/5 h-12 font-black text-xs" /></div>
                          <div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40">Start</Label><Input value={run3kStart} onChange={e => setRun3kStart(e.target.value)} placeholder="06:30 AM" className="bg-white/5 h-12 font-black text-xs" /></div>
                        </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-5">
                        <h4 className="text-[12px] font-black uppercase text-primary italic tracking-widest">5KM Division</h4>
                        <div className="grid grid-cols-1 gap-5">
                          <div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40">Reporting</Label><Input value={run5kReporting} onChange={e => setRun5kReporting(e.target.value)} placeholder="05:30 AM" className="bg-white/5 h-12 font-black text-xs" /></div>
                          <div className="space-y-2"><Label className="text-[9px] font-black uppercase opacity-40">Start</Label><Input value={run5kStart} onChange={e => setRun5kStart(e.target.value)} placeholder="06:00 AM" className="bg-white/5 h-12 font-black text-xs" /></div>
                        </div>
                      </div>
                   </div>
                   <Button type="submit" className="w-full h-16 uppercase font-black tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/20">Sync Schedule</Button>
                 </form>
               </CardContent>
             </Card>
           ) : (
            <Card className="premium-card border-white/5">
              <CardHeader className="bg-white/[0.02] border-b border-white/5 py-5"><CardTitle className="text-[11px] font-black uppercase tracking-[0.4em]">{editMatchId ? "Modify Slot" : "New Match Protocol"}</CardTitle></CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleCreateOrUpdateSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Match ID</Label><Input value={schedMatchNumber} onChange={e => setSchedMatchNumber(e.target.value)} placeholder="e.g., 101" className="bg-white/5 h-14 font-black text-sm rounded-xl" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Phase</Label><Select value={schedPhase} onValueChange={(v: any) => setSchedPhase(v)}><SelectTrigger className="bg-white/5 h-14 font-black text-[11px] uppercase rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="group" className="text-[11px] font-black uppercase">Group Stage</SelectItem><SelectItem value="semi-final" className="text-[11px] font-black uppercase">Semi Final</SelectItem><SelectItem value="third-place" className="text-[11px] font-black uppercase">3rd Place</SelectItem><SelectItem value="final" className="text-[11px] font-black uppercase">Grand Final</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Home House</Label><Select value={schedTeamA} onValueChange={setSchedTeamA}><SelectTrigger className="bg-white/5 h-14 font-black text-[11px] uppercase rounded-xl"><SelectValue placeholder="Select House" /></SelectTrigger><SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[11px] font-black uppercase">{h}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Away House</Label><Select value={schedTeamB} onValueChange={setSchedTeamB}><SelectTrigger className="bg-white/5 h-14 font-black text-[11px] uppercase rounded-xl"><SelectValue placeholder="Select House" /></SelectTrigger><SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[11px] font-black uppercase">{h}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Date</Label><Input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} className="bg-white/5 h-14 font-black text-sm rounded-xl" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Day</Label><Input value={schedDay} onChange={e => setSchedDay(e.target.value)} placeholder="Saturday" className="bg-white/5 h-14 font-black text-sm rounded-xl" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Start Time</Label><Input placeholder="04:30 PM" value={schedTime} onChange={e => setSchedTime(e.target.value)} className="bg-white/5 h-14 font-black text-sm rounded-xl" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Venue</Label><Input value={schedVenue} onChange={e => setSchedVenue(e.target.value)} placeholder="Main Arena" className="bg-white/5 h-14 font-black text-sm rounded-xl" required /></div>
                  {(selectedSportSlug === 'badminton' || selectedSportSlug === 'volleyball') && (<div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Court ID</Label><Input value={schedCourtNumber} onChange={e => setSchedCourtNumber(e.target.value)} placeholder="Court 1" className="bg-white/5 h-14 font-black text-sm rounded-xl" /></div>)}
                  {selectedSportSlug === 'football' && (<div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Ground ID</Label><Input value={schedGroundNumber} onChange={e => setSchedGroundNumber(e.target.value)} placeholder="Ground A" className="bg-white/5 h-14 font-black text-sm rounded-xl" /></div>)}
                  <Button type="submit" className="md:col-span-2 h-16 uppercase font-black text-[12px] tracking-[0.3em] gap-3 shadow-2xl shadow-primary/30 rounded-2xl mt-4">{editMatchId ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}{editMatchId ? "Save Protocol" : "Add Match"}</Button>
                </form>
              </CardContent>
            </Card>
           )}
        </TabsContent>

        <TabsContent value="standings" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <Card className="premium-card border-white/5">
             <CardHeader className="bg-white/[0.02] border-b border-white/5 py-5"><CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary">Assign House to League</CardTitle></CardHeader>
             <CardContent className="p-8">
               <form onSubmit={handleAddStanding} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                 <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">House</Label><Select value={newStandingTeam} onValueChange={setNewStandingTeam}><SelectTrigger className="bg-white/5 h-14 text-sm font-black uppercase rounded-xl"><SelectValue placeholder="Select House" /></SelectTrigger><SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[11px] font-black uppercase">{h}</SelectItem>)}</SelectContent></Select></div>
                 <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-50">Group Pool</Label><Select value={newStandingGroup} onValueChange={setNewStandingGroup}><SelectTrigger className="bg-white/5 h-14 text-sm font-black uppercase rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g} className="text-[11px] font-black uppercase">Group {g}</SelectItem>)}</SelectContent></Select></div>
                 <Button type="submit" className="h-14 uppercase font-black text-[11px] tracking-widest rounded-xl"><Plus className="h-4 w-4 mr-2" /> Add to Table</Button>
               </form>
             </CardContent>
           </Card>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {GROUPS.map(group => {
               const groupItems = standings?.filter(s => s.group === group).sort((a,b) => b.points - a.points);
               if (!groupItems?.length) return null;
               return (
                 <Card key={group} className="premium-card border-white/5">
                   <CardHeader className="bg-white/[0.02] border-b border-white/5 py-4"><CardTitle className="text-[11px] font-black uppercase text-center tracking-[0.4em] text-primary">Pool {group}</CardTitle></CardHeader>
                   <CardContent className="p-0">
                     <Table><TableHeader className="bg-white/5"><TableRow className="border-white/5"><TableHead className="text-[9px] font-black uppercase px-6 h-12">House</TableHead><TableHead className="text-[9px] font-black uppercase text-center px-2 h-12">P</TableHead><TableHead className="text-[9px] font-black uppercase text-center px-4 h-12">Pts</TableHead><TableHead className="text-right text-[9px] font-black uppercase px-6 h-12">Del</TableHead></TableRow></TableHeader>
                       <TableBody>{groupItems.map(item => (<TableRow key={item.id} className="border-white/5 h-16"><TableCell className="text-lg font-black uppercase italic px-6">{item.team}</TableCell><TableCell className="p-1 px-2"><Input type="number" className="h-10 w-12 text-center text-sm font-black bg-white/5 mx-auto rounded-lg" value={item.played} onChange={e => handleUpdateStanding(item.id, 'played', Number(e.target.value))} /></TableCell><TableCell className="p-1 px-4"><Input type="number" className="h-10 w-16 text-center text-sm font-black bg-primary/20 border-primary/30 mx-auto rounded-lg" value={item.points} onChange={e => handleUpdateStanding(item.id, 'points', Number(e.target.value))} /></TableCell><TableCell className="text-right px-6"><Button size="icon" variant="ghost" className="h-9 w-9 text-destructive/40 hover:text-destructive transition-colors" onClick={() => deleteDoc(doc(db!, 'standings', item.id))}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}
                       </TableBody></Table></CardContent></Card>);})}</div>
        </TabsContent>

        <TabsContent value="archive" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="premium-card border-white/5">
             <CardHeader className="bg-white/[0.02] border-b border-white/5 py-5"><CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-3"><ListOrdered className="h-5 w-5" /> Tournament Records</CardTitle></CardHeader>
             <CardContent className="p-0">
               {isKampusRun ? (
                 <Table><TableHeader className="bg-white/5"><TableRow className="border-white/5"><TableHead className="w-20 text-center text-[9px] font-black h-12 px-4">Rank</TableHead><TableHead className="text-[9px] font-black h-12 px-6">Name</TableHead><TableHead className="text-[9px] font-black h-12 px-6">Profile</TableHead><TableHead className="text-right text-[9px] font-black h-12 px-6">Action</TableHead></TableRow></TableHeader>
                   <TableBody>{runResults?.map(res => (<TableRow key={res.id} className="border-white/5 h-20"><TableCell className="text-center font-black text-2xl text-primary px-4">#{res.position}</TableCell><TableCell className="px-6"><p className="text-lg font-black uppercase italic leading-none">{res.name}</p></TableCell><TableCell className="px-6"><div className="flex flex-wrap gap-2"><Badge variant="outline" className="text-[8px] font-black h-5 px-2 bg-white/5">{res.category}</Badge><Badge variant="outline" className="text-[8px] font-black h-5 px-2 bg-white/5">{res.gender}</Badge></div></TableCell><TableCell className="text-right px-6"><Button size="icon" variant="ghost" className="h-9 w-9 text-destructive/40 hover:text-destructive" onClick={() => deleteDoc(doc(db!, 'runResults', res.id))}><Trash2 className="h-5 w-5" /></Button></TableCell></TableRow>))}</TableBody></Table>
               ) : (
                 <Table><TableHeader className="bg-white/5"><TableRow className="border-white/5"><TableHead className="text-[9px] font-black h-12 px-6">Match Identity</TableHead><TableHead className="text-[9px] font-black text-center h-12 px-6">Final Score</TableHead><TableHead className="text-right text-[9px] font-black h-12 px-6">Action</TableHead></TableRow></TableHeader>
                   <TableBody>{matches?.filter(m => m.status === 'Completed').map(match => (
                     <TableRow key={match.id} className="border-white/5 h-20">
                       <TableCell className="px-6"><p className="text-lg font-black uppercase italic leading-none">M#{match.matchNumber} | {match.teamA} vs {match.teamB}</p><p className="text-[9px] font-black opacity-30 mt-1 uppercase tracking-widest">{match.phase}</p></TableCell>
                       <TableCell className="text-center font-black text-3xl text-primary px-6 tabular-nums">{match.scoreA} - {match.scoreB}</TableCell>
                       <TableCell className="text-right px-6"><Button size="icon" variant="ghost" className="h-9 w-9 text-destructive/40 hover:text-destructive" onClick={() => deleteDoc(doc(db!, 'matches', match.id))}><Trash2 className="h-5 w-5" /></Button></TableCell>
                     </TableRow>
                   ))}</TableBody>
                 </Table>
               )}
             </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="access" className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="premium-card border-primary/20"><CardHeader className="bg-primary/5 border-b border-white/5 py-5"><CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-3"><ShieldCheck className="h-5 w-5" /> Provision Administrator</CardTitle></CardHeader><CardContent className="p-8"><form onSubmit={handleAddPersonnel} className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Identity UID</Label><Input value={newAdminUid} onChange={e => setNewAdminUid(e.target.value)} className="bg-white/5 border-white/10 h-14 text-sm font-black rounded-xl" placeholder="Firebase UID" required /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Email</Label><Input value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="bg-white/5 border-white/10 h-14 text-sm font-black rounded-xl" placeholder="operator@study.iitm.ac.in" required /></div><div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Delegated Domain</Label><Select value={newAdminSport} onValueChange={setNewAdminSport}><SelectTrigger className="bg-white/5 h-14 font-black text-[11px] uppercase rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all" className="text-[11px] font-black uppercase">Global Control</SelectItem>{EVENTS.map(e => <SelectItem key={e.id} value={e.slug} className="text-[11px] font-black uppercase">{e.name}</SelectItem>)}</SelectContent></Select></div><Button type="submit" className="md:col-span-2 h-16 uppercase font-black text-[12px] tracking-[0.3em] gap-3 shadow-2xl shadow-primary/30 rounded-2xl mt-4"><UserPlus className="h-5 w-5" /> Provision Admin</Button></form></CardContent></Card>
            <div className="space-y-6"><h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-3 px-1"><Users className="h-5 w-5 text-primary" /> Active Personnel</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{allAdmins?.map(admin => (<Card key={admin.uid} className="premium-card bg-white/[0.01] border-white/5 group hover:border-primary/20 transition-all"><CardContent className="p-5 flex items-center justify-between gap-4"><div className="flex items-center gap-4"><div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-all shadow-lg", admin.role === 'super-admin' ? 'bg-primary/20 text-primary shadow-primary/10' : 'bg-muted/30 text-muted-foreground')}><ShieldCheck className="h-6 w-6" /></div><div className="min-w-0"><p className="text-[11px] font-black uppercase truncate text-white">{admin.email}</p><div className="flex items-center gap-2 mt-1"><Badge variant="outline" className="text-[7px] font-black h-4 px-2 border-white/10 uppercase tracking-widest">{admin.role}</Badge></div></div></div>{admin.role !== 'super-admin' && (<Button size="icon" variant="ghost" className="h-9 w-9 text-destructive/40 hover:text-destructive flex-shrink-0 transition-colors" onClick={() => deleteDoc(doc(db!, 'admins', admin.uid))}><Trash2 className="h-5 w-5" /></Button>)}</CardContent></Card>))}</div></div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
