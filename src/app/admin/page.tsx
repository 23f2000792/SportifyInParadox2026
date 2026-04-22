"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EVENTS } from '@/lib/mock-data';
import { Save, RotateCcw, Plus, UserPlus, ShieldCheck, LogOut, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useAuth } from '@/firebase';
import { collection, doc, setDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { Match, AdminUser } from '@/lib/types';
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
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [status, setStatus] = useState<string>('Live');

  // Admin Management State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminSport, setNewAdminSport] = useState('football');

  const matchesQuery = useMemo(() => 
    query(collection(db, 'matches'), where('sport', '==', selectedSport)), 
  [db, selectedSport]);
  const { data: matches } = useCollection<Match>(matchesQuery);

  const { data: allAdmins } = useCollection<AdminUser>(collection(db, 'admins'));

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, userLoading, router]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !adminProfile) return null;

  const isSuperAdmin = adminProfile.role === 'super-admin';

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId) return;

    const matchRef = doc(db, 'matches', selectedMatchId);
    setDoc(matchRef, {
      scoreA,
      scoreB,
      status,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    toast({
      title: "Updated",
      description: "Match results have been synchronized with the live broadcast.",
    });
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

    toast({
      title: "Admin Registered",
      description: `Access granted to ${newAdminEmail} for ${newAdminSport}.`,
    });
    setNewAdminEmail('');
    setNewAdminUid('');
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">Command Center</h1>
            <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/30 text-primary">
              {adminProfile.role} Access
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Operator: {adminProfile.email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[9px] font-black uppercase gap-2 hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-3.5 w-3.5" /> Log Out
        </Button>
      </div>

      <Tabs defaultValue="scores" className="w-full">
        <TabsList className={cn("grid w-full bg-muted/50 h-12 p-1", isSuperAdmin ? "grid-cols-3" : "grid-cols-2")}>
          <TabsTrigger value="scores" className="text-[10px] font-black uppercase">Live Scoring</TabsTrigger>
          <TabsTrigger value="schedule" className="text-[10px] font-black uppercase">Schedule</TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="management" className="text-[10px] font-black uppercase">Admin Control</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="scores" className="space-y-6 pt-6">
          <Card className="premium-card">
            <CardHeader className="p-6 pb-0">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Score Synchronization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <form className="space-y-6" onSubmit={handleUpdate}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">Sport Category</Label>
                    <Select value={selectedSport} onValueChange={setSelectedSport}>
                      <SelectTrigger className="h-10 bg-white/5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENTS.map(e => (
                          <SelectItem key={e.id} value={e.slug}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">Active Match</Label>
                    <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                      <SelectTrigger className="h-10 bg-white/5">
                        <SelectValue placeholder="Select match" />
                      </SelectTrigger>
                      <SelectContent>
                        {matches?.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.teamA} v {m.teamB}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6 bg-black/40 p-8 rounded-xl border border-white/5 shadow-inner">
                  <div className="text-center flex-1 space-y-3">
                    <Label className="text-[10px] font-black uppercase block opacity-40">Home Team</Label>
                    <Input 
                      type="number" 
                      value={scoreA} 
                      onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                      className="text-center text-4xl font-black h-20 w-full bg-white/5 border-none shadow-xl" 
                    />
                  </div>
                  <div className="text-2xl font-black text-muted-foreground/20 italic mt-6">:</div>
                  <div className="text-center flex-1 space-y-3">
                    <Label className="text-[10px] font-black uppercase block opacity-40">Away Team</Label>
                    <Input 
                      type="number" 
                      value={scoreB} 
                      onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                      className="text-center text-4xl font-black h-20 w-full bg-white/5 border-none shadow-xl" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase">Transmission Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-10 bg-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                      <SelectItem value="Live">Live</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 h-12 text-[10px] font-black uppercase gap-2 shadow-lg shadow-primary/20">
                    <Save className="h-4 w-4" /> Commit Changes
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-12 text-[10px] font-black uppercase gap-2 bg-white/5"
                    onClick={() => {
                      setScoreA(0);
                      setScoreB(0);
                      setStatus('Live');
                    }}
                  >
                    <RotateCcw className="h-4 w-4" /> Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="management" className="pt-6 space-y-6">
            <Card className="premium-card">
              <CardHeader className="p-6">
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Privilege Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-8">
                <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase">UID</Label>
                    <Input 
                      placeholder="Auth UID" 
                      value={newAdminUid} 
                      onChange={(e) => setNewAdminUid(e.target.value)}
                      className="h-10 bg-white/5"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase">Email Address</Label>
                    <Input 
                      type="email" 
                      placeholder="admin@sportify" 
                      value={newAdminEmail} 
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="h-10 bg-white/5"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase">Assigned Sport</Label>
                    <Select value={newAdminSport} onValueChange={setNewAdminSport}>
                      <SelectTrigger className="h-10 bg-white/5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENTS.map(e => (
                          <SelectItem key={e.id} value={e.slug}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="h-10 font-black uppercase text-[9px] gap-2">
                    <ShieldCheck className="h-3 w-3" /> Grant Access
                  </Button>
                </form>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Authorized Personnel
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allAdmins?.map((admin) => (
                      <div key={admin.uid} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-primary/20 transition-all">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-white">{admin.email}</p>
                          <div className="flex gap-2">
                            <span className="text-[8px] font-black uppercase text-primary">{admin.role}</span>
                            {admin.assignedSport && <span className="text-[8px] font-black uppercase text-muted-foreground/40">• {admin.assignedSport}</span>}
                          </div>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-black/40 flex items-center justify-center border border-white/10">
                          <ShieldCheck className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="schedule" className="pt-6">
          <Card className="premium-card flex flex-col items-center justify-center p-20 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
              <ShieldAlert className="h-8 w-8 text-muted-foreground/10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase italic tracking-tighter">Draft Schedule Module</h3>
              <p className="text-[10px] text-muted-foreground max-w-[200px] leading-relaxed font-bold">This unit is currently under system lock for maintenance.</p>
            </div>
            <Button disabled className="mt-4 text-[9px] font-black uppercase bg-white/5 text-muted-foreground border border-white/10">Locked</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: string, className?: string }) {
  const styles = variant === "outline" ? "border" : "bg-primary text-white";
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black", styles, className)}>
      {children}
    </span>
  );
}
