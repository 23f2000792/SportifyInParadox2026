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
import { Save, Plus, ShieldCheck, LogOut, Zap, Trophy, Timer, Settings, Calendar, ListOrdered, Users, UserPlus, Trash2, Medal, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useAuth } from '@/firebase';
import { collection, doc, setDoc, query, where, serverTimestamp, addDoc, deleteDoc, orderBy } from 'firebase/firestore';
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
  
  // Match Scoring State
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [status, setStatus] = useState<string>('Live');
  const [badmintonResults, setBadmintonResults] = useState<BadmintonMatchResult[]>([
    { type: 'MS', score: '0-0', winner: '' },
    { type: 'WS', score: '0-0', winner: '' },
    { type: 'MD', score: '0-0', winner: '' },
    { type: 'WD', score: '0-0', winner: '' },
    { type: 'XD', score: '0-0', winner: '' },
  ]);

  // Kampus Run State
  const [runnerName, setRunnerName] = useState('');
  const [runnerPos, setRunnerPos] = useState<number>(1);
  const [runnerTime, setRunnerTime] = useState('');
  const [runnerCat, setRunnerCat] = useState('5km');
  const [runnerGender, setRunnerGender] = useState<'M' | 'F'>('M');

  // Schedule Creation State
  const [schedTeamA, setSchedTeamA] = useState('');
  const [schedTeamB, setSchedTeamB] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedGroup, setSchedGroup] = useState('A');
  const [schedPhase, setSchedPhase] = useState<MatchPhase>('group');

  // Standing Management State
  const [stdHouse, setStdHouse] = useState(HOUSES[0]);
  const [stdGroup, setStdGroup] = useState('A');
  const [stdPoints, setStdPoints] = useState(0);

  // Personnel State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminSport, setNewAdminSport] = useState('all');

  // Queries
  const matchesQuery = useMemo(() => {
    if (!db || !selectedSport) return null;
    return query(collection(db, 'matches'), where('sport', '==', selectedSport), orderBy('time', 'asc'));
  }, [db, selectedSport]);
  const { data: matches } = useCollection<Match>(matchesQuery);

  const standingsQuery = useMemo(() => {
    if (!db || !selectedSport) return null;
    return query(collection(db, 'standings'), where('sport', '==', selectedSport));
  }, [db, selectedSport]);
  const { data: standings } = useCollection<Standing>(standingsQuery);

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
      setStatus(activeMatch.status);
      if (activeMatch.badmintonResults) setBadmintonResults(activeMatch.badmintonResults);
    }
  }, [activeMatch]);

  if (userLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Timer className="animate-spin text-primary" /></div>;
  if (!user || !adminProfile) return null;

  const isSuperAdmin = adminProfile.role === 'super-admin';

  const handleUpdateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId) return;
    setDoc(doc(db, 'matches', selectedMatchId), {
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      status,
      badmintonResults: selectedSport === 'badminton' ? badmintonResults : null,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    toast({ title: "Broadcast Synchronized" });
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
    toast({ title: "Runner Clocked In" });
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    addDoc(collection(db, 'matches'), {
      sport: selectedSport,
      teamA: schedTeamA,
      teamB: schedTeamB,
      scoreA: 0,
      scoreB: 0,
      status: 'Upcoming',
      phase: schedPhase,
      group: schedPhase === 'group' ? schedGroup : null,
      time: schedTime,
      updatedAt: serverTimestamp(),
    });
    toast({ title: "Schedule Transmission Set" });
  };

  const handleUpsertStanding = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `${selectedSport}_${stdHouse}`;
    setDoc(doc(db, 'standings', id), {
      team: stdHouse,
      sport: selectedSport,
      group: stdGroup,
      points: Number(stdPoints),
      played: 0, won: 0, drawn: 0, lost: 0, // Simplified for this view
    }, { merge: true });
    toast({ title: "Matrix Updated" });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black italic uppercase flex items-center gap-2">
            Command Center <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[9px]">{adminProfile.role}</Badge>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Operator: {adminProfile.email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="text-[9px] font-black uppercase gap-2 bg-white/5">
          <LogOut className="h-3 w-3" /> Terminate Access
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="premium-card md:col-span-1 h-fit">
          <CardHeader className="p-4 border-b border-white/5">
            <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2"><Settings className="h-3.5 w-3.5" /> Domain Switch</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="bg-white/5 border-none h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENTS.map(e => <SelectItem key={e.id} value={e.slug}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Tabs defaultValue="control" className="md:col-span-3">
          <TabsList className={cn("grid w-full bg-muted/50 h-12 p-1", isSuperAdmin ? "grid-cols-4" : "grid-cols-3")}>
            <TabsTrigger value="control" className="text-[9px] font-black uppercase">Operation</TabsTrigger>
            <TabsTrigger value="schedule" className="text-[9px] font-black uppercase">Schedule</TabsTrigger>
            <TabsTrigger value="standings" className="text-[9px] font-black uppercase">League</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="access" className="text-[9px] font-black uppercase">Personnel</TabsTrigger>}
          </TabsList>

          <TabsContent value="control" className="space-y-6 pt-6">
            {selectedSport === 'kampus-run' ? (
              <Card className="premium-card">
                <CardHeader><CardTitle className="text-xs font-black uppercase italic">Race Clock Terminal</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleAddRunResult} className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-[9px] font-black">Participant Name</Label>
                      <Input value={runnerName} onChange={e => setRunnerName(e.target.value)} className="bg-white/5 h-10" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black">Pos</Label>
                      <Input type="number" value={runnerPos} onChange={e => setRunnerPos(Number(e.target.value))} className="bg-white/5 h-10" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black">Time</Label>
                      <Input placeholder="00:00.0" value={runnerTime} onChange={e => setRunnerTime(e.target.value)} className="bg-white/5 h-10" required />
                    </div>
                    <Button type="submit" className="h-10 mt-auto uppercase font-black text-[10px]"><Plus className="h-3 w-3 mr-2" /> Record</Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="premium-card">
                <CardContent className="p-6 space-y-8">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase opacity-50">Select Target Transmission</Label>
                    <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                      <SelectTrigger className="bg-white/5 border-none h-12">
                        <SelectValue placeholder="Tracking match..." />
                      </SelectTrigger>
                      <SelectContent>
                        {matches?.filter(m => m.status !== 'Completed').map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.teamA} vs {m.teamB} ({m.phase})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedMatchId && (
                    <form onSubmit={handleUpdateMatch} className="space-y-8">
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex-1 space-y-2">
                          <Label className="text-[9px] font-black uppercase text-center block opacity-40">{activeMatch?.teamA}</Label>
                          <Input type="number" value={scoreA} onChange={e => setScoreA(Number(e.target.value))} className="text-center text-4xl font-black h-20 bg-white/5 border-none" />
                        </div>
                        <div className="text-2xl font-black opacity-20">:</div>
                        <div className="flex-1 space-y-2">
                          <Label className="text-[9px] font-black uppercase text-center block opacity-40">{activeMatch?.teamB}</Label>
                          <Input type="number" value={scoreB} onChange={e => setScoreB(Number(e.target.value))} className="text-center text-4xl font-black h-20 bg-white/5 border-none" />
                        </div>
                      </div>

                      {selectedSport === 'badminton' && (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-4 border-t border-white/5">
                          {badmintonResults.map((res, idx) => (
                            <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2">
                              <p className="text-[8px] font-black text-primary uppercase">{res.type}</p>
                              <Input 
                                value={res.score} 
                                onChange={e => {
                                  const n = [...badmintonResults]; n[idx].score = e.target.value; setBadmintonResults(n);
                                }}
                                className="h-8 text-xs font-black text-center"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase opacity-50">Operational Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger className="bg-white/5 border-none"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Upcoming">Standby</SelectItem>
                            <SelectItem value="Live">Broadcasting</SelectItem>
                            <SelectItem value="Completed">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button type="submit" className="w-full h-12 font-black uppercase text-[10px] gap-2 shadow-xl shadow-primary/20">
                        <ShieldCheck className="h-4 w-4" /> Broadcast Sync
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="pt-6">
            <Card className="premium-card">
              <CardHeader><CardTitle className="text-xs font-black uppercase italic">Match Deployment</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateMatch} className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-1">
                    <Label className="text-[9px] font-black uppercase">Home House</Label>
                    <Select value={schedTeamA} onValueChange={setSchedTeamA}>
                      <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <Label className="text-[9px] font-black uppercase">Away House</Label>
                    <Select value={schedTeamB} onValueChange={setSchedTeamB}>
                      <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase">Phase</Label>
                    <Select value={schedPhase} onValueChange={(v: any) => setSchedPhase(v)}>
                      <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="group">Group Stage</SelectItem>
                        <SelectItem value="semi-final">Semi Final</SelectItem>
                        <SelectItem value="third-place">3rd Place</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase">Group Index</Label>
                    <Select value={schedGroup} onValueChange={setSchedGroup} disabled={schedPhase !== 'group'}>
                      <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g}>Group {g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-[9px] font-black uppercase">Transmission Time</Label>
                    <Input placeholder="e.g., 16:30 PM" value={schedTime} onChange={e => setSchedTime(e.target.value)} className="bg-white/5" />
                  </div>
                  <Button type="submit" className="col-span-2 h-12 uppercase font-black text-[10px] gap-2">
                    <Calendar className="h-4 w-4" /> Initialize Match
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="standings" className="pt-6 space-y-6">
            <Card className="premium-card">
              <CardHeader><CardTitle className="text-xs font-black uppercase italic">League Matrix Control</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleUpsertStanding} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-[9px] font-black uppercase">House Domain</Label>
                    <Select value={stdHouse} onValueChange={setStdHouse}>
                      <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <Label className="text-[9px] font-black uppercase">Group</Label>
                    <Select value={stdGroup} onValueChange={setStdGroup}>
                      <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g}>Group {g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <Label className="text-[9px] font-black uppercase">Points</Label>
                    <Input type="number" value={stdPoints} onChange={e => setStdPoints(Number(e.target.value))} className="bg-white/5" />
                  </div>
                  <Button type="submit" className="col-span-2 md:col-span-4 h-10 uppercase font-black text-[10px]"><Plus className="h-3 w-3 mr-2" /> Sync Standing</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
