
'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Successful",
        description: "Welcome to the Paradox Command Center.",
      });
      router.push('/admin');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Invalid credentials provided.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <Card className="w-full max-w-md premium-card">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">Command Portal</CardTitle>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sportify Paradox 2026 Admin</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider ml-1">Access Email</Label>
              <Input 
                type="email" 
                placeholder="admin@sportify.paradox" 
                className="h-12 bg-white/5 border-white/10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider ml-1">Secure Key</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="h-12 bg-white/5 border-white/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 font-black uppercase text-xs tracking-widest gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Authorize Access'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
