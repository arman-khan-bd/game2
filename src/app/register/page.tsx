
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      // 0. Verify the username is available in our master database
      const checkRes = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim() }),
      });
      const checkData = await checkRes.json();
      
      if (!checkRes.ok) {
        throw new Error(checkData.error || 'This username is already taken. Please pick another one.');
      }

      // 1. Sign up the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (user) {
        // 2. Insert into local MongoDB via API Route
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseUid: user.uid,
            username: username.trim(),
            full_name: fullName.trim(),
            email: email,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to initialize MongoDB profile');
        }
  
        toast({ 
          title: "Registration Successful!", 
          description: "Welcome to CV666 Hub. Please log in to your account." 
        });
        
        router.push('/login');
      }
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Registration Error", 
        description: err.message || "An unexpected error occurred." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[150px] rounded-full" />
      </div>

      <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border-white/10 relative z-10">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black italic tracking-tighter uppercase">JOIN <span className="text-primary">NOW</span></CardTitle>
          <CardDescription className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.2em]">Start your winning streak today</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="LuckyPlayer77" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                className="bg-background/50 border-white/10 h-11 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input 
                id="full_name" 
                placeholder="John Doe" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-background/50 border-white/10 h-11 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="bg-background/50 border-white/10 h-11 text-white"
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
                className="bg-background/50 border-white/10 h-11 text-white"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full h-12 font-black italic text-lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "CREATE ACCOUNT"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Log in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
