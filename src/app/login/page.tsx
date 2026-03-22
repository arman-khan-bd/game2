
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc } from '@/firebase';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
   
      if (user) {
        // 2. Fetch latest profile data from MongoDB backend
        const res = await fetch(`/api/profile?uid=${user.uid}`);
        
        // Handle if profile wasn't found or server error
        if (!res.ok) {
           throw new Error('Profile fetch failed or profile does not exist.');
        }

        const data = await res.json();
        const profileData = data.profile;

        // 3. Sync with Local Mock state for UI components
        await setDoc(`userProfiles/${user.uid}`, {
          id: user.uid,
          username: profileData.username,
          full_name: profileData.full_name,
          email: profileData.email,
          balance: profileData.balance,
          role: profileData.role,
          status: profileData.status,
          total_wagered: profileData.total_wagered,
          total_won: profileData.total_won,
          updatedAt: new Date().toISOString()
        });

        // 4. Format user session for the Auth Provider
        const sessionUser = {
          uid: user.uid,
          email: user.email,
          displayName: profileData.username || 'User',
          photoURL: profileData.photo_url || null,
        };
  
        // 5. Update local session and notify components
        localStorage.setItem('hub_user', JSON.stringify(sessionUser));
        window.dispatchEvent(new Event('local-auth-change'));
  
        toast({ 
          title: "Access Granted", 
          description: `Welcome back, ${sessionUser.displayName}.` 
        });
        
        router.push('/');
      }
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Authentication Failed", 
        description: err.message || "Invalid credentials provided." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border-white/10 relative z-10">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black italic tracking-tighter uppercase">LOG <span className="text-primary">IN</span></CardTitle>
          <CardDescription className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.2em]">Access your winning vault</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="bg-background/50 border-white/10 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="bg-background/50 border-white/10 h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full h-12 font-black italic text-lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "ENTER SYSTEM"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account? <Link href="/register" className="text-primary font-bold hover:underline">Sign up</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
