
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EVENTS } from '@/lib/mock-data';
import { Save, RotateCcw, Plus, UserPlus, ShieldCheck, LogOut, ShieldAlert, Cpu, Trophy, Zap, Timer, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useAuth } from '@/firebase';
import { collection, doc, setDoc, query, where, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { Match, AdminUser, RunResult, BadmintonMatchResult } from '@/lib/types';
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
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  
  // Scoring State
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [status, setStatus] = useState<string>('Live');
  
  // Badminton Specific State
  const [badmintonResults, setBadmintonResults] = useState<BadmintonMatchResult[]>([
    { type: 'MS', score: '0-0', winner: '' },
    { type: 'WS', score: '0-0', winner: '' },
    { type: 'MD', score: '0-0', winner: '' },
    { type: 'WD', score: '0-0', winner: '' },
    { type: 'XD', score: '0-0', winner: '' },
  ]);

  // Kampus Run State
  const [runName, setRunName] = useState('');
  const [runTime, setRunTime] = useState('');
  const [runPos, setRunPos] = useState(1);
  const [runCat, setRunCat] = useState('3km Male');

  // Admin Management State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminSport, setNewAdminSport] = useState('football');

  // Stable Firestore Queries
  const matchesQuery = useMemo(() => {
    if (!db || !selectedSport) return null;
    return query(collection(db, 'matches'), where('sport', '==', selectedSport));
  }, [db, selectedSport]);

  const { data: matches } = useCollection<Match>(matchesQuery);

  const runResultsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'runResults');
  }, [db]);
  const { data: runResults } = useCollection<RunResult>(runResultsQuery);

  const adminsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'admins');
  }, [db]);
  const { data: allAdmins } = useCollection<AdminUser>(adminsQuery);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, userLoading, router]);

  const activeMatch = useMemo(() => matches?.find(m => m.id === selectedMatchId), [matches, selectedMatchId]);

  useEffect(() => {
    if (activeMatch) {
      setScoreA(activeMatch.scoreA);
      setScoreB(activeMatch.scoreB);
      setStatus(activeMatch.status);
      if (activeMatch.badmintonResults) {
        setBadmintonResults(activeMatch.badmintonResults);
      }
    }
  }, [activeMatch]);

  if (userLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>;
  if (!user || !adminProfile) return null;

  const isSuperAdmin = adminProfile.role === 'super-admin';

  const handleUpdateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId) return;

    const matchRef = doc(db, 'matches', selectedMatchId);
    const updateData: any = {
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      status,
      updatedAt: serverTimestamp(),
    };

    if (selectedSport === 'badminton') {
      updateData.badmintonResults = badmintonResults;
    }

    setDoc(matchRef, updateData, { merge: true });
    toast({ title: "Broadcast Updated", description: "Match data synchronized successfully." });
  };

  const handleAddRunResult = (e: React.FormEvent) => {
    e.preventDefault();
    addDoc(collection(db, 'runResults'), {
      name: runName,
      time: runTime,
      position: Number(runPos),
      category: runCat,
      updatedAt: serverTimestamp(),
    });
    toast({ title: "Result Recorded", description: `${runName} added to ${runCat}` });
    setRunName(''); setRunTime('');
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUid || !newAdminEmail) return;
    setDoc(doc(db, 'admins', newAdminUid), {
      uid: newAdminUid,
      email: newAdminEmail,
      role: 'admin',
      assignedSport: newAdminSport,
    });
    toast({ title: "Admin Registered", description: `Access granted to ${newAdminEmail}` });
    setNewAdminEmail(''); setNewAdminUid('');
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">Paradox Command</h1>
            <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/30 text-primary">
              {adminProfile.role}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Operator: {adminProfile.email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[9px] font-black uppercase gap-2 hover:bg-destructive/10 hover:text-destructive w-fit">
          <LogOut className="h-3.5 w-3.5" /> Terminate Session
        </Button>
      </div>

      <Tabs defaultValue="scores" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 h-12 p-1">
          <TabsTrigger value="scores" className="text-[10px] font-black uppercase">Live Control</TabsTrigger>
          <TabsTrigger value="schedule" className="text-[10px] font-black uppercase">Archive</TabsTrigger>
          <TabsTrigger value="management" className="text-[10px] font-black uppercase">Access</TabsTrigger>
        </TabsList>

        <TabsContent value="scores" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sport & Match Selection */}
            <Card className="premium-card lg:col-span-1">
              <CardHeader className="p-4 border-b border-white/5">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-primary" /> Target Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase opacity-50">Division</Label>
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger className="h-10 bg-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENTS.map(e => <SelectItem key={e.id} value={e.slug}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {selectedSport !== 'kampus-run' && (
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-50">Match Stream</Label>
                    <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                      <SelectTrigger className="h-10 bg-white/5">
                        <SelectValue placeholder="Select Match" />
                      </SelectTrigger>
                      <SelectContent>
                        {matches?.map(m => <SelectItem key={m.id} value={m.id}>{m.teamA} vs {m.teamB}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Main Input Form */}
            <Card className="premium-card lg:col-span-2">
              <CardContent className="p-6">
                {selectedSport === 'kampus-run' ? (
                  <form onSubmit={handleAddRunResult} className="space-y-6">
                    <h3 className="text-sm font-black uppercase italic">Race Result Entry</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase">Participant Name</Label>
                        <Input value={runName} onChange={e => setRunName(e.target.value)} className="bg-white/5" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase">Finish Time (MM:SS)</Label>
                        <Input value={runTime} onChange={e => setRunTime(e.target.value)} placeholder="12:45" className="bg-white/5" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase">Category</Label>
                        <Select value={runCat} onValueChange={setRunCat}>
                          <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3km Male">3km Male</SelectItem>
                            <SelectItem value="3km Female">3km Female</SelectItem>
                            <SelectItem value="5km Male 18-25">5km Male 18-25</SelectItem>
                            <SelectItem value="5km Female 18-25">5km Female 18-25</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase">Position</Label>
                        <Input type="number" value={runPos} onChange={e => setRunPos(Number(e.target.value))} className="bg-white/5" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 text-[10px] font-black uppercase gap-2">
                      <Save className="h-4 w-4" /> Commit Result
                    </Button>
                  </form>
                ) : selectedMatchId ? (
                  <form onSubmit={handleUpdateMatch} className="space-y-8">
                    <div className="flex items-center justify-between bg-black/40 p-6 rounded-xl border border-white/5">
                      <div className="text-center flex-1 space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40">{activeMatch?.teamA}</Label>
                        <Input type="number" value={scoreA} onChange={e => setScoreA(Number(e.target.value))} className="text-center text-4xl font-black h-16 bg-white/5 border-none" />
                      </div>
                      <div className="text-xl font-black text-muted-foreground/20 italic mx-4">:</div>
                      <div className="text-center flex-1 space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40">{activeMatch?.teamB}</Label>
                        <Input type="number" value={scoreB} onChange={e => setScoreB(Number(e.target.value))} className="text-center text-4xl font-black h-16 bg-white/5 border-none" />
                      </div>
                    </div>

                    {selectedSport === 'badminton' && (
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-primary">Sub-Match Breakdown</Label>
                        <div className="grid grid-cols-1 gap-3">
                          {badmintonResults.map((res, i) => (
                            <div key={res.type} className="grid grid-cols-3 gap-3 items-center bg-white/5 p-3 rounded-lg">
                              <span className="text-[10px] font-black">{res.type}</span>
                              <Input 
                                placeholder="Score (e.g. 21-15, 21-18)" 
                                value={res.score} 
                                onChange={e => {
                                  const newRes = [...badmintonResults];
                                  newRes[i].score = e.target.value;
                                  setBadmintonResults(newRes);
                                }}
                                className="h-8 text-[10px] bg-black/20 border-white/10"
                              />
                              <Select 
                                value={res.winner} 
                                onValueChange={val => {
                                  const newRes = [...badmintonResults];
                                  newRes[i].winner = val;
                                  setBadmintonResults(newRes);
                                }}
                              >
                                <SelectTrigger className="h-8 text-[10px] bg-black/20 border-white/10">
                                  <SelectValue placeholder="Winner" />
                                </SelectTrigger>
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

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase">Transmission Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Upcoming">Upcoming</SelectItem>
                          <SelectItem value="Live">Live Stream</SelectItem>
                          <SelectItem value="Completed">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full h-12 text-[10px] font-black uppercase gap-2 shadow-lg shadow-primary/20">
                      <ShieldCheck className="h-4 w-4" /> Synchronize Matrix
                    </Button>
                  </form>
                ) : (
                  <div className="p-20 text-center space-y-4 opacity-30">
                    <Cpu className="h-12 w-12 mx-auto animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Select match target to initialize control link</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="management" className="pt-6 space-y-6">
          <Card className="premium-card">
            <CardHeader className="p-6 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" /> Authority Delegation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {isSuperAdmin ? (
                <>
                  <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase">UID</Label>
                      <Input placeholder="Firebase UID" value={newAdminUid} onChange={e => setNewAdminUid(e.target.value)} className="bg-white/5" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase">Email</Label>
                      <Input type="email" placeholder="operator@paradox" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="bg-white/5" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase">Division</Label>
                      <Select value={newAdminSport} onValueChange={setNewAdminSport}>
                        <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                        <SelectContent>{EVENTS.map(e => <SelectItem key={e.id} value={e.slug}>{e.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="h-10 font-black uppercase text-[9px] gap-2"><ShieldCheck className="h-3 w-3" /> Authorize</Button>
                  </form>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allAdmins?.map(admin => (
                      <div key={admin.uid} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="space-y-1">
                          <p className="text-xs font-black">{admin.email}</p>
                          <div className="flex gap-2"><span className="text-[8px] font-black uppercase text-primary">{admin.role}</span><span className="text-[8px] font-black uppercase text-muted-foreground/40">• {admin.assignedSport}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center p-10 opacity-40"><ShieldAlert className="h-10 w-10 mx-auto mb-4" /><p className="text-xs font-black uppercase">Insufficient privileges for personnel management</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
