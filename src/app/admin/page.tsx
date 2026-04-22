
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
import { Save, Plus, ShieldCheck, LogOut, Trophy, Timer, Settings, ListOrdered, Users, UserPlus, Trash2, Edit2, X, MapPin, Hash, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useAuth } from '@/firebase';
import { collection, doc, setDoc, query, where, serverTimestamp, addDoc, deleteDoc, orderBy, updateDoc } from 'firebase/firestore';
import { Match, AdminUser, RunResult, BadmintonMatchResult, HOUSES, GROUPS, Standing, MatchPhase } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { user, adminProfile, loading: userLoading } = useUser();
  
  const [selectedSport, setSelectedSport] = useState<string>('football');
  const [editMatchId, setEditMatchId] = useState<string | null>(null);
  
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
  const [schedDate, setSchedDate] = useState('');
  const [schedDay, setSchedDay] = useState('');
  const [schedVenue, setSchedVenue] = useState('');
  const [schedCourtNumber, setSchedCourtNumber] = useState('');
  const [schedGroundNumber, setSchedGroundNumber] = useState('');
  const [schedGroup, setSchedGroup] = useState('A');
  const [schedPhase, setSchedPhase] = useState<MatchPhase>('group');

  // Personnel State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminSport, setNewAdminSport] = useState('all');

  // Kampus Run State
  const [runnerName, setRunnerName] = useState('');
  const [runnerPos, setRunnerPos] = useState<number>(1);
  const [runnerTime, setRunnerTime] = useState('');
  const [runnerCat, setRunnerCat] = useState('5km');
  const [runnerGender, setRunnerGender] = useState<'M' | 'F'>('M');

  // Queries
  const matchesQuery = useMemo(() => {
    if (!db || !selectedSport) return null;
    return query(collection(db, 'matches'), where('sport', '==', selectedSport), orderBy('matchNumber', 'asc'));
  }, [db, selectedSport]);
  const { data: matches } = useCollection<Match>(matchesQuery);

  const runResultsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'runResults'), orderBy('position', 'asc'));
  }, [db]);
  const { data: runResults } = useCollection<RunResult>(runResultsQuery);

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
      setStatus(matchStatusMap(activeMatch.status));
      if (activeMatch.badmintonResults) setBadmintonResults(activeMatch.badmintonResults);
    }
  }, [activeMatch]);

  const matchStatusMap = (s: string): 'Upcoming' | 'Live' | 'Completed' => {
    if (s === 'Upcoming' || s === 'Live' || s === 'Completed') return s;
    return 'Upcoming';
  };

  if (userLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Timer className="animate-spin text-primary" /></div>;
  if (!user || !adminProfile) return null;

  const isSuperAdmin = adminProfile.role === 'super-admin';

  const handleUpdateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId) return;
    updateDoc(doc(db, 'matches', selectedMatchId), {
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      status,
      badmintonResults: selectedSport === 'badminton' ? badmintonResults : null,
      updatedAt: serverTimestamp(),
    });
    toast({ title: "Score Synchronized" });
  };

  const handleCreateOrUpdateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      matchNumber: schedMatchNumber,
      sport: selectedSport,
      teamA: schedTeamA,
      teamB: schedTeamB,
      phase: schedPhase,
      group: schedPhase === 'group' ? schedGroup : null,
      time: schedTime,
      date: schedDate,
      day: schedDay,
      venue: schedVenue,
      courtNumber: (selectedSport === 'badminton' || selectedSport === 'volleyball') ? schedCourtNumber : null,
      groundNumber: selectedSport === 'football' ? schedGroundNumber : null,
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
    
    // Reset form
    setSchedMatchNumber(''); setSchedTeamA(''); setSchedTeamB(''); setSchedTime(''); setSchedDate(''); setSchedDay(''); setSchedVenue(''); setSchedCourtNumber(''); setSchedGroundNumber('');
  };

  const handleDeleteMatch = (id: string) => {
    if (confirm("Permanently terminate this match transmission?")) {
      deleteDoc(doc(db, 'matches', id));
      toast({ title: "Transmission Terminated" });
    }
  };

  const handleEditMatch = (match: Match) => {
    setEditMatchId(match.id);
    setSchedMatchNumber(match.matchNumber);
    setSchedTeamA(match.teamA);
    setSchedTeamB(match.teamB);
    setSchedTime(match.time);
    setSchedDate(match.date);
    setSchedDay(match.day);
    setSchedVenue(match.venue);
    setSchedCourtNumber(match.courtNumber || '');
    setSchedGroundNumber(match.groundNumber || '');
    setSchedPhase(match.phase);
    if (match.group) setSchedGroup(match.group);
    // Switch tab to schedule
    document.querySelector('[data-value="schedule"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };

  const handleAddRunResult = (e: React.FormEvent) => {
    e.preventDefault();
    addDoc(collection(db, 'runResults'), {
      name: runnerName,
      position: Number(runnerPos),
      time: runnerTime,
      category: runnerCat,
      gender: runnerGender,
      ageGroup: 'Open',
      updatedAt: serverTimestamp(),
    });
    setRunnerName(''); setRunnerTime('');
    toast({ title: "Runner Result Archived" });
  };

  const handleAddPersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUid || !newAdminEmail) return;
    setDoc(doc(db, 'admins', newAdminUid), {
      uid: newAdminUid,
      email: newAdminEmail,
      role: 'admin',
      assignedSport: newAdminSport === 'all' ? null : newAdminSport,
    });
    setNewAdminUid(''); setNewAdminEmail('');
    toast({ title: "Admin Identity Registered" });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black italic uppercase flex items-center gap-3 tracking-tighter">
            Paradox Command <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[9px] tracking-widest">{adminProfile.role}</Badge>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Identity: {adminProfile.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => signOut(auth)} className="text-[9px] font-black uppercase gap-2 bg-white/5 border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all">
          <LogOut className="h-3.5 w-3.5" /> Terminate Auth Session
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="premium-card lg:col-span-3 h-fit border-white/5">
          <CardHeader className="p-4 border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 tracking-widest opacity-50"><Settings className="h-3.5 w-3.5" /> Sector Switch</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {EVENTS.map(e => (
              <Button 
                key={e.id}
                variant="ghost" 
                className={cn(
                  "w-full justify-start text-[10px] font-black uppercase h-11 tracking-wider gap-3 transition-all",
                  selectedSport === e.slug ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-white/5 text-muted-foreground"
                )}
                onClick={() => setSelectedSport(e.slug)}
              >
                {e.name}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Tabs defaultValue="control" className="lg:col-span-9">
          <TabsList className="grid w-full grid-cols-4 bg-muted/30 h-12 p-1 border border-white/5 rounded-xl">
            <TabsTrigger value="control" className="text-[9px] font-black uppercase">Live Control</TabsTrigger>
            <TabsTrigger value="schedule" className="text-[9px] font-black uppercase">Schedule</TabsTrigger>
            <TabsTrigger value="archive" className="text-[9px] font-black uppercase">Database</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="access" className="text-[9px] font-black uppercase">Security</TabsTrigger>}
          </TabsList>

          <TabsContent value="control" className="space-y-6 pt-6">
            {selectedSport === 'kampus-run' ? (
              <Card className="premium-card border-primary/20">
                <CardHeader className="bg-primary/5"><CardTitle className="text-xs font-black uppercase italic tracking-widest text-primary">Race Result Terminal</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAddRunResult} className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase">Participant Identity</Label>
                      <Input value={runnerName} onChange={e => setRunnerName(e.target.value)} className="bg-white/5 h-11 border-white/10" placeholder="Full Name" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Rank</Label>
                      <Input type="number" value={runnerPos} onChange={e => setRunnerPos(Number(e.target.value))} className="bg-white/5 h-11 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Chrono Time</Label>
                      <Input placeholder="00:00.0" value={runnerTime} onChange={e => setRunnerTime(e.target.value)} className="bg-white/5 h-11 border-white/10" required />
                    </div>
                    <Button type="submit" className="h-11 mt-auto uppercase font-black text-[10px] tracking-widest shadow-xl shadow-primary/20"><Plus className="h-4 w-4 mr-2" /> Log Entry</Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="premium-card border-white/5">
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase opacity-50 tracking-[0.2em]">Target Broadcast</Label>
                    <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-14 text-sm font-black uppercase">
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
                    <form onSubmit={handleUpdateMatch} className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex items-center justify-between gap-8">
                        <div className="flex-1 space-y-3">
                          <Label className="text-[9px] font-black uppercase text-center block opacity-40 tracking-widest">{activeMatch?.teamA}</Label>
                          <Input type="number" value={scoreA} onChange={e => setScoreA(Number(e.target.value))} className="text-center text-5xl font-black h-24 bg-white/5 border-white/10 shadow-inner" />
                        </div>
                        <div className="text-3xl font-black opacity-10">:</div>
                        <div className="flex-1 space-y-3">
                          <Label className="text-[9px] font-black uppercase text-center block opacity-40 tracking-widest">{activeMatch?.teamB}</Label>
                          <Input type="number" value={scoreB} onChange={e => setScoreB(Number(e.target.value))} className="text-center text-5xl font-black h-24 bg-white/5 border-white/10 shadow-inner" />
                        </div>
                      </div>

                      {selectedSport === 'badminton' && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-8 border-t border-white/5">
                          {badmintonResults.map((res, idx) => (
                            <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3 group hover:border-primary/30 transition-all">
                              <p className="text-[9px] font-black text-primary uppercase tracking-tighter opacity-70">{res.type} Vector</p>
                              <Input value={res.score} onChange={e => { const n = [...badmintonResults]; n[idx].score = e.target.value; setBadmintonResults(n); }} className="h-10 text-xs font-black text-center bg-black/20 border-white/5" />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase opacity-50 tracking-widest">Protocol Status</Label>
                        <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                          <SelectTrigger className="bg-white/5 border-white/10 h-12 text-[10px] font-black uppercase tracking-wider"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Upcoming" className="text-[10px] font-black uppercase">Standby</SelectItem>
                            <SelectItem value="Live" className="text-[10px] font-black uppercase">Broadcasting</SelectItem>
                            <SelectItem value="Completed" className="text-[10px] font-black uppercase">Archive Result</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button type="submit" className="w-full h-14 font-black uppercase text-xs tracking-[0.2em] gap-3 shadow-2xl shadow-primary/30 rounded-2xl">
                        <ShieldCheck className="h-5 w-5" /> Push Broadcast Update
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="pt-6 space-y-8">
            <Card className="premium-card border-white/5">
              <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <CardTitle className="text-xs font-black uppercase italic flex items-center justify-between tracking-widest">
                  {editMatchId ? "Modify Transmission" : "Initialize Transmission"}
                  {editMatchId && <Button variant="ghost" size="sm" onClick={() => setEditMatchId(null)} className="h-7 text-[9px] font-black uppercase gap-1 text-muted-foreground"><X className="h-3 w-3" /> Cancel Edit</Button>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleCreateOrUpdateSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Match Number</Label>
                    <Input value={schedMatchNumber} onChange={e => setSchedMatchNumber(e.target.value)} placeholder="e.g., 101" className="bg-white/5 border-white/10 h-12 font-black text-xs" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Phase Vector</Label>
                    <Select value={schedPhase} onValueChange={(v: any) => setSchedPhase(v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 font-black text-[11px] uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="group" className="text-[10px] font-black uppercase">Group Stage</SelectItem>
                        <SelectItem value="semi-final" className="text-[10px] font-black uppercase">Semi Final</SelectItem>
                        <SelectItem value="third-place" className="text-[10px] font-black uppercase">3rd Place</SelectItem>
                        <SelectItem value="final" className="text-[10px] font-black uppercase">Grand Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Home Domain</Label>
                    <Select value={schedTeamA} onValueChange={setSchedTeamA}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 font-black text-[11px] uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[10px] font-black uppercase">{h}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Away Domain</Label>
                    <Select value={schedTeamB} onValueChange={setSchedTeamB}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 font-black text-[11px] uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h} className="text-[10px] font-black uppercase">{h}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Date</Label>
                    <Input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} className="bg-white/5 border-white/10 h-12 font-black text-xs uppercase" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Day</Label>
                    <Select value={schedDay} onValueChange={setSchedDay}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 font-black text-[11px] uppercase"><SelectValue placeholder="Select Day" /></SelectTrigger>
                      <SelectContent>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <SelectItem key={d} value={d} className="text-[10px] font-black uppercase">{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Time</Label>
                    <Input placeholder="e.g., 04:30 PM" value={schedTime} onChange={e => setSchedTime(e.target.value)} className="bg-white/5 border-white/10 h-12 font-black text-xs uppercase" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">General Venue</Label>
                    <Input value={schedVenue} onChange={e => setSchedVenue(e.target.value)} placeholder="e.g., Main Ground" className="bg-white/5 border-white/10 h-12 font-black text-xs uppercase" required />
                  </div>
                  {(selectedSport === 'badminton' || selectedSport === 'volleyball') && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Court Number</Label>
                      <Input value={schedCourtNumber} onChange={e => setSchedCourtNumber(e.target.value)} placeholder="e.g., Court 1" className="bg-white/5 border-white/10 h-12 font-black text-xs uppercase" />
                    </div>
                  )}
                  {selectedSport === 'football' && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Ground Number</Label>
                      <Input value={schedGroundNumber} onChange={e => setSchedGroundNumber(e.target.value)} placeholder="e.g., Ground A" className="bg-white/5 border-white/10 h-12 font-black text-xs uppercase" />
                    </div>
                  )}
                  {schedPhase === 'group' && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Group Index</Label>
                      <Select value={schedGroup} onValueChange={setSchedGroup}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-12 font-black text-[11px] uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g} className="text-[10px] font-black uppercase">Group {g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button type="submit" className="md:col-span-2 h-14 uppercase font-black text-xs tracking-[0.2em] gap-3 shadow-xl shadow-primary/20 rounded-2xl transition-all hover:scale-[1.01]">
                    {editMatchId ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />} {editMatchId ? "Authorize Modification" : "Initialize Transmission"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3"><ListOrdered className="h-4 w-4" /> Schedule Matrix</h3>
               <div className="grid grid-cols-1 gap-3">
                 {matches?.map(match => (
                   <Card key={match.id} className="premium-card group hover:border-primary/20 bg-white/[0.01]">
                     <CardContent className="p-5 flex items-center justify-between">
                       <div className="flex items-center gap-6">
                         <div className="text-center w-24 border-r border-white/5 pr-4">
                           <p className="text-[8px] font-black text-primary uppercase opacity-60">M#{match.matchNumber}</p>
                           <p className="text-xs font-black text-white uppercase">{match.time}</p>
                           <p className="text-[7px] font-black text-muted-foreground uppercase opacity-40">{match.date}</p>
                         </div>
                         <div>
                           <p className="text-sm font-black uppercase italic group-hover:text-primary transition-colors tracking-tight">{match.teamA} vs {match.teamB}</p>
                           <p className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest flex items-center gap-2">
                             <MapPin className="h-2 w-2" /> {match.venue} {match.courtNumber || match.groundNumber ? `• ${match.courtNumber || match.groundNumber}` : ''}
                           </p>
                           <p className="text-[7px] font-black text-primary/40 uppercase tracking-widest mt-1">{match.phase} {match.group ? `• Group ${match.group}` : ''}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                         <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => handleEditMatch(match)}>
                           <Edit2 className="h-4 w-4" />
                         </Button>
                         <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => handleDeleteMatch(match.id)}>
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
            </div>
          </TabsContent>

          <TabsContent value="archive" className="pt-6">
            <Card className="premium-card border-white/5">
               <CardHeader className="bg-white/[0.02] border-b border-white/5">
                 <CardTitle className="text-xs font-black uppercase italic tracking-widest text-primary flex items-center gap-2"><ListOrdered className="h-4 w-4" /> Archived Vectors</CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                 {selectedSport === 'kampus-run' ? (
                   <Table>
                     <TableHeader className="bg-white/5"><TableRow className="border-white/5"><TableHead className="text-[9px] font-black uppercase">Pos</TableHead><TableHead className="text-[9px] font-black uppercase">Participant</TableHead><TableHead className="text-[9px] font-black uppercase">Time</TableHead><TableHead className="text-right text-[9px] font-black uppercase">Action</TableHead></TableRow></TableHeader>
                     <TableBody>
                       {runResults?.map(res => (
                         <TableRow key={res.id} className="border-white/5 hover:bg-white/[0.01]">
                           <TableCell className="font-black text-xs">#{res.position}</TableCell>
                           <TableCell><p className="text-xs font-black uppercase">{res.name}</p><p className="text-[8px] font-black opacity-40 uppercase">{res.category} • {res.gender}</p></TableCell>
                           <TableCell className="text-xs font-black tabular-nums opacity-60">{res.time}</TableCell>
                           <TableCell className="text-right">
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => deleteDoc(doc(db, 'runResults', res.id))}>
                               <Trash2 className="h-3.5 w-3.5" />
                             </Button>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 ) : (
                   <Table>
                     <TableHeader className="bg-white/5"><TableRow className="border-white/5"><TableHead className="text-[9px] font-black uppercase">Transmission</TableHead><TableHead className="text-[9px] font-black uppercase text-center">Score</TableHead><TableHead className="text-right text-[9px] font-black uppercase">Action</TableHead></TableRow></TableHeader>
                     <TableBody>
                       {matches?.filter(m => m.status === 'Completed').map(match => (
                         <TableRow key={match.id} className="border-white/5 hover:bg-white/[0.01]">
                           <TableCell><p className="text-xs font-black uppercase italic">M#{match.matchNumber} | {match.teamA} vs {match.teamB}</p><p className="text-[8px] font-black opacity-30 uppercase">{match.phase}</p></TableCell>
                           <TableCell className="text-center font-black text-sm tracking-tighter">{match.scoreA} - {match.scoreB}</TableCell>
                           <TableCell className="text-right">
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => handleDeleteMatch(match.id)}>
                               <Trash2 className="h-3.5 w-3.5" />
                             </Button>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 )}
               </CardContent>
            </Card>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="access" className="pt-6 space-y-8">
              <Card className="premium-card border-primary/20">
                <CardHeader className="bg-primary/5"><CardTitle className="text-xs font-black uppercase italic tracking-widest text-primary flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Authorize Personnel</CardTitle></CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleAddPersonnel} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Personnel UID</Label>
                      <Input value={newAdminUid} onChange={e => setNewAdminUid(e.target.value)} className="bg-white/5 border-white/10 h-11 text-xs" placeholder="Firebase UID" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Protocol Identity (Email)</Label>
                      <Input value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="bg-white/5 border-white/10 h-11 text-xs" placeholder="email@study.iitm.ac.in" required />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Assigned Sector</Label>
                      <Select value={newAdminSport} onValueChange={setNewAdminSport}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-11 font-black text-[10px] uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-[10px] font-black uppercase">Universal Override (All Sports)</SelectItem>
                          {EVENTS.map(e => <SelectItem key={e.id} value={e.slug} className="text-[10px] font-black uppercase">{e.name} Sector Only</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="md:col-span-2 h-12 uppercase font-black text-xs tracking-widest gap-3 shadow-xl shadow-primary/20 rounded-xl">
                      <UserPlus className="h-5 w-5" /> Register Identity
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3"><Users className="h-4 w-4" /> Active Personnel Matrix</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allAdmins?.map(admin => (
                    <Card key={admin.uid} className="premium-card bg-white/[0.01] border-white/5">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", admin.role === 'super-admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div><p className="text-xs font-black uppercase truncate max-w-[150px]">{admin.email}</p><p className="text-[8px] font-black text-muted-foreground uppercase opacity-60 tracking-widest">{admin.role} • {admin.assignedSport || 'Universal'}</p></div>
                        </div>
                        {admin.role !== 'super-admin' && <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive/30 hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => deleteDoc(doc(db, 'admins', admin.uid))}><Trash2 className="h-4 w-4" /></Button>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
