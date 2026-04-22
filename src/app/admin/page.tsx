
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
import { Save, Plus, ShieldCheck, LogOut, Zap, Trophy, Timer, Settings, Calendar, ListOrdered, Users, UserPlus, Trash2 } from 'lucide-react';
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
  
  // Scoring State
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

  // Schedule Creation State
  const [schedTeamA, setSchedTeamA] = useState('');
  const [schedTeamB, setSchedTeamB] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedGroup, setSchedGroup] = useState('A');
  const [schedPhase, setSchedPhase] = useState<MatchPhase>('group');

  // Standing Management State
  const [stdHouse, setStdHouse] = useState(HOUSES[0]);
  const [stdGroup, setStdGroup] = useState('A');
  const [stdPlayed, setStdPlayed] = useState(0);
  const [stdWon, setStdWon] = useState(0);
  const [stdDrawn, setStdDrawn] = useState(0);
  const [stdLost, setStdLost] = useState(0);
  const [stdPoints, setStdPoints] = useState(0);

  // Personnel Management State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminSport, setNewAdminSport] = useState('all');

  // Firestore Queries
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

  if (userLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Timer className="animate-spin" /></div>;
  if (!user || !adminProfile) return null;

  const isSuperAdmin = adminProfile.role === 'super-admin';

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
    toast({ title: "Schedule Updated", description: "New match transmission scheduled." });
    setSchedTeamA(''); setSchedTeamB('');
  };

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
    toast({ title: "Transmission Synchronized" });
  };

  const handleUpsertStanding = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `${selectedSport}_${stdHouse}`;
    setDoc(doc(db, 'standings', id), {
      team: stdHouse,
      sport: selectedSport,
      group: stdGroup,
      played: Number(stdPlayed),
      won: Number(stdWon),
      drawn: Number(stdDrawn),
      lost: Number(stdLost),
      points: Number(stdPoints),
    });
    toast({ title: "Standing Saved", description: `${stdHouse} matrix updated.` });
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUid || !newAdminEmail) return;
    setDoc(doc(db, 'admins', newAdminUid), {
      uid: newAdminUid,
      email: newAdminEmail,
      role: 'admin',
      assignedSport: newAdminSport === 'all' ? null : newAdminSport,
    });
    setNewAdminEmail('');
    setNewAdminUid('');
    toast({ title: "Admin Registered", description: `Access granted to ${newAdminEmail}.` });
  };

  const handleDeleteAdmin = (uid: string) => {
    if (uid === user.uid) {
      toast({ variant: "destructive", title: "Error", description: "Cannot terminate your own root access." });
      return;
    }
    deleteDoc(doc(db, 'admins', uid));
    toast({ title: "Personnel Removed" });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-black italic uppercase flex items-center gap-2">
            Paradox Command <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[9px]">{adminProfile.role}</Badge>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Operator: {adminProfile.email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[9px] font-black uppercase gap-2">
          <LogOut className="h-3 w-3" /> Terminate
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="premium-card md:col-span-1 h-fit">
          <CardHeader className="p-4 border-b border-white/5">
            <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2"><Settings className="h-3 w-3" /> Domain</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="bg-white/5 border-none h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENTS.map(e => <SelectItem key={e.id} value={e.slug}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Tabs defaultValue="scoring" className="md:col-span-3">
          <TabsList className={cn("grid w-full bg-muted/50 h-12 p-1", isSuperAdmin ? "grid-cols-4" : "grid-cols-3")}>
            <TabsTrigger value="scoring" className="text-[9px] font-black uppercase">Live</TabsTrigger>
            <TabsTrigger value="schedule" className="text-[9px] font-black uppercase">Schedule</TabsTrigger>
            <TabsTrigger value="standings" className="text-[9px] font-black uppercase">League</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="access" className="text-[9px] font-black uppercase">Personnel</TabsTrigger>}
          </TabsList>

          <TabsContent value="scoring" className="space-y-6 pt-6">
            <Card className="premium-card">
              <CardContent className="p-6 space-y-8">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase opacity-50">Select Target Match</Label>
                  <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                    <SelectTrigger className="bg-white/5 border-none h-12">
                      <SelectValue placeholder="Targeting..." />
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase opacity-50">Transmission Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger className="bg-white/5 border-none"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Upcoming">Upcoming</SelectItem>
                            <SelectItem value="Live">Live Stream</SelectItem>
                            <SelectItem value="Completed">Archive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-12 font-black uppercase text-[10px] gap-2 shadow-xl shadow-primary/20">
                      <ShieldCheck className="h-4 w-4" /> Broadcast Update
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="pt-6">
            <Card className="premium-card">
              <CardHeader><CardTitle className="text-xs font-black uppercase italic">Deployment Module</CardTitle></CardHeader>
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
                    <Label className="text-[9px] font-black uppercase">Group (If Group Stage)</Label>
                    <Select value={schedGroup} onValueChange={setSchedGroup} disabled={schedPhase !== 'group'}>
                      <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g}>Group {g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-[9px] font-black uppercase">Transmission Time</Label>
                    <Input placeholder="e.g., 14:00 PM" value={schedTime} onChange={e => setSchedTime(e.target.value)} className="bg-white/5" />
                  </div>
                  <Button type="submit" className="col-span-2 h-12 uppercase font-black text-[10px] gap-2">
                    <Calendar className="h-4 w-4" /> Deploy Match
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="standings" className="pt-6 space-y-6">
            <Card className="premium-card">
              <CardHeader><CardTitle className="text-xs font-black uppercase italic">League Matrix Manager</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleUpsertStanding} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-[9px] font-black uppercase">Target House</Label>
                    <Select value={stdHouse} onValueChange={setStdHouse}>
                      <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-[9px] font-black uppercase">Assigned Group</Label>
                    <Select value={stdGroup} onValueChange={setStdGroup}>
                      <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g}>Group {g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black">Played</Label><Input type="number" value={stdPlayed} onChange={e => setStdPlayed(Number(e.target.value))} className="bg-white/5" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black">Won</Label><Input type="number" value={stdWon} onChange={e => setStdWon(Number(e.target.value))} className="bg-white/5" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black">Points</Label><Input type="number" value={stdPoints} onChange={e => setStdPoints(Number(e.target.value))} className="bg-white/5" /></div>
                  <Button type="submit" className="h-10 mt-auto uppercase font-black text-[10px]"><Plus className="h-3 w-3 mr-2" /> Sync</Button>
                </form>

                <div className="mt-8 overflow-hidden border border-white/5 rounded-xl">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow><TableHead className="text-[9px] font-black">House</TableHead><TableHead className="text-[9px] font-black">Grp</TableHead><TableHead className="text-[9px] font-black">Pts</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings?.sort((a,b) => a.group.localeCompare(b.group) || b.points - a.points).map(s => (
                        <TableRow key={s.id} className="border-white/5 h-10">
                          <TableCell className="text-[10px] font-black">{s.team}</TableCell>
                          <TableCell className="text-[10px] font-black text-primary">{s.group}</TableCell>
                          <TableCell className="text-[10px] font-black">{s.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="access" className="pt-6 space-y-6">
               <Card className="premium-card">
                <CardHeader><CardTitle className="text-xs font-black uppercase italic">Personnel Authorization</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5 md:col-span-1">
                      <Label className="text-[9px] font-black uppercase">Auth UID</Label>
                      <Input placeholder="Firebase UID" value={newAdminUid} onChange={e => setNewAdminUid(e.target.value)} className="bg-white/5" required />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                      <Label className="text-[9px] font-black uppercase">Email Identity</Label>
                      <Input placeholder="operator@paradox.com" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="bg-white/5" required />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                      <Label className="text-[9px] font-black uppercase">Sport Domain</Label>
                      <Select value={newAdminSport} onValueChange={setNewAdminSport}>
                        <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Global Control</SelectItem>
                          {EVENTS.map(e => <SelectItem key={e.id} value={e.slug}>{e.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="h-10 uppercase font-black text-[10px] gap-2"><UserPlus className="h-4 w-4" /> Grant Access</Button>
                  </form>

                  <div className="border border-white/5 rounded-xl overflow-hidden mt-6">
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow>
                          <TableHead className="text-[9px] font-black">Email</TableHead>
                          <TableHead className="text-[9px] font-black">Role</TableHead>
                          <TableHead className="text-[9px] font-black">Domain</TableHead>
                          <TableHead className="text-right text-[9px] font-black">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allAdmins?.map((adm) => (
                          <TableRow key={adm.uid} className="border-white/5 h-12">
                            <TableCell className="text-[10px] font-bold">{adm.email}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[8px] uppercase">{adm.role}</Badge></TableCell>
                            <TableCell className="text-[10px] font-black uppercase text-primary">{adm.assignedSport || 'Universal'}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteAdmin(adm.uid)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
               </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
