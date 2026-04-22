
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LOGO_URL = "https://ik.imagekit.io/qaugsnc1c/sportify_logo1.png?updatedAt=1762330168970";

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
        title: "Access Granted",
        description: "Welcome to the Admin Panel.",
      });
      router.push('/admin');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Unauthorized",
        description: "Invalid credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md premium-card">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="flex justify-center mb-6">
            <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-black/40 border border-white/10 p-2">
              <Image 
                src={LOGO_URL}
                alt="Sportify Logo"
                fill
                className="object-contain p-2"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">Admin Access</CardTitle>
          <p className="text-[9px] font-black uppercase text-primary tracking-widest">Broadcast Command Center</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase tracking-wider ml-1 opacity-50">Email</Label>
              <Input 
                type="email" 
                placeholder="admin@paradox.com" 
                className="h-12 bg-muted/30 border-border text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase tracking-wider ml-1 opacity-50">Password</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="h-12 bg-muted/30 border-border text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enter Terminal'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
