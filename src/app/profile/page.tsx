
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, updateDoc, setDoc } from '@/firebase';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  ChevronLeft, 
  Wallet, 
  ShieldCheck,
  ShieldAlert,
  ShieldEllipsis,
  Trophy,
  TrendingUp,
  Settings2,
  LogOut,
  User,
  History,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { BottomNav } from '@/components/layout/BottomNav';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const { data: profile, isLoading: isDocLoading } = useDoc(user ? `userProfiles/${user.uid}` : null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Handle missing profile initialization
  useEffect(() => {
    async function initializeProfile() {
      if (!isUserLoading && user && !isDocLoading && !profile && !isInitializing) {
        setIsInitializing(true);
        try {
          await setDoc(`userProfiles/${user.uid}`, {
            id: user.uid,
            username: user.displayName || user.email?.split('@')[0] || 'Member',
            fullName: user.displayName || '',
            email: user.email,
            balance: 1000,
            role: 'user',
            status: 'active',
            totalWagered: 0,
            totalWon: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } catch (e) {
          console.error("Profile initialization failed:", e);
        } finally {
          setIsInitializing(false);
        }
      }
    }
    initializeProfile();
  }, [user, isUserLoading, profile, isDocLoading, isInitializing]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setFullName(profile.fullName || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !username.trim()) return;

    setIsSaving(true);
    try {
      await updateDoc(`userProfiles/${user.uid}`, {
        username: username.trim(),
        fullName: fullName.trim(),
        updatedAt: new Date().toISOString(),
      });
      toast({ title: "MEMBER UPDATED", description: "Your profile has been synchronized with the core." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "SYNC FAILED", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('hub_user');
      window.dispatchEvent(new Event('local-auth-change'));
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('hub_user');
      window.dispatchEvent(new Event('local-auth-change'));
      router.push('/');
    }
  };

  if (isUserLoading || isDocLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-[#001f1c] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-[#facc15]" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7da09d]">Loading Archives...</p>
      </div>
    );
  }

  if (!user || !profile) return null;

  const getRoleBadge = (role: string) => {
    const r = (role || 'user').toLowerCase();
    switch(r) {
      case 'admin':
        return <Badge className="bg-red-500 font-black italic px-3 text-[10px]"><ShieldAlert className="w-3 h-3 mr-1" /> CORE ADMIN</Badge>;
      case 'moderator':
        return <Badge className="bg-purple-500 font-black italic px-3 text-[10px]"><ShieldCheck className="w-3 h-3 mr-1" /> MODERATOR</Badge>;
      case 'agent':
        return <Badge className="bg-blue-500 font-black italic px-3 text-[10px]"><ShieldEllipsis className="w-3 h-3 mr-1" /> HUB AGENT</Badge>;
      default:
        return <Badge variant="secondary" className="font-black italic px-3 text-[10px] bg-white/5 border-white/10 text-emerald-400">PLAYER</Badge>;
    }
  }

  const winRatio = (profile.totalWagered && profile.totalWagered > 0)
    ? ((profile.totalWon / profile.totalWagered) * 100).toFixed(1)
    : '0.0';

  return (
    <main className="min-h-screen bg-[#001f1c] text-white flex flex-col pb-32">
      <Header />
      
      <div className="relative z-10 flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="text-[#7da09d] hover:text-white group p-0">
              <ChevronLeft className="mr-1 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              HUB DIRECTORY
            </Button>
          </Link>
          <Button onClick={handleLogout} variant="ghost" className="text-red-400 hover:text-red-500 hover:bg-red-500/10 font-black italic text-xs uppercase tracking-widest">
            <LogOut className="w-4 h-4 mr-2" /> LOGOUT
          </Button>
        </div>

        <div className="space-y-6">
          {/* Identity Card */}
          <Card className="bg-[#002d28] border-white/5 overflow-hidden rounded-3xl shadow-2xl">
            <CardContent className="pt-8 flex flex-col items-center text-center">
              <div className="relative mb-6">
                 <Avatar className="h-28 w-28 border-4 border-[#001f1c] shadow-2xl">
                    <AvatarImage src={profile.photoUrl || undefined} />
                    <AvatarFallback className="text-4xl bg-[#facc15]/10 text-[#facc15] font-black italic">
                      {profile.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-[#facc15] p-2 rounded-xl shadow-lg">
                     <Trophy className="w-5 h-5 text-black" />
                  </div>
              </div>
              <h2 className="text-3xl font-black tracking-tighter italic mb-2 text-white uppercase">{profile.username}</h2>
              <div className="flex items-center gap-2 mb-6">
                 {getRoleBadge(profile.role)}
                 <span className="text-[10px] font-bold text-[#7da09d] uppercase tracking-widest px-2 border-l border-white/10">ID: {user.uid.substring(0, 8)}</span>
              </div>
              
              <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                 <div className="bg-black/20 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] font-black uppercase text-[#7da09d] mb-1">Vault Status</p>
                    <div className="flex items-center justify-center gap-2">
                       <Wallet className="w-4 h-4 text-[#facc15]" />
                       <span className="text-xl font-black text-white">৳ {(profile.balance || 0).toLocaleString()}</span>
                    </div>
                 </div>
                 <div className="bg-black/20 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] font-black uppercase text-[#7da09d] mb-1">Win Ratio</p>
                    <div className="flex items-center justify-center gap-2">
                       <TrendingUp className="w-4 h-4 text-emerald-400" />
                       <span className="text-xl font-black text-emerald-400">{winRatio}%</span>
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="management" className="w-full">
            <TabsList className="bg-[#002d28] border border-white/5 p-1 rounded-2xl w-full grid grid-cols-3">
              <TabsTrigger value="management" className="font-black italic text-[11px] py-3 uppercase tracking-widest rounded-xl data-[state=active]:bg-[#001f1c] data-[state=active]:text-[#facc15]">IDENTITY</TabsTrigger>
              <TabsTrigger value="stats" className="font-black italic text-[11px] py-3 uppercase tracking-widest rounded-xl data-[state=active]:bg-[#001f1c] data-[state=active]:text-[#facc15]">STATS</TabsTrigger>
              <TabsTrigger value="financials" className="font-black italic text-[11px] py-3 uppercase tracking-widest rounded-xl data-[state=active]:bg-[#001f1c] data-[state=active]:text-[#facc15]">FINANCIALS</TabsTrigger>
            </TabsList>

            <TabsContent value="management" className="pt-4 animate-in fade-in slide-in-from-bottom-2">
              <Card className="bg-[#002d28]/60 border-white/5 rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-black italic text-white flex items-center gap-3">
                    <Settings2 className="w-5 h-5 text-[#facc15]" />
                    MEMBER <span className="text-[#facc15]">CONFIG</span>
                  </CardTitle>
                </CardHeader>
                <form onSubmit={handleUpdateProfile}>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7da09d] ml-1">FULL NAME</Label>
                        <Input 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-14 bg-black/40 border-white/5 text-white font-bold rounded-xl focus:border-[#facc15]"
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7da09d] ml-1">PLATFORM HANDLE</Label>
                        <Input 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="h-14 bg-black/40 border-white/5 text-white font-black italic rounded-xl focus:border-[#facc15]"
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7da09d] ml-1">EMAIL ADDRESS (SECURED)</Label>
                      <Input 
                        value={user.email || ''}
                        disabled
                        className="h-14 bg-black/20 border-white/5 text-[#7da09d] font-bold rounded-xl opacity-60"
                      />
                    </div>
                  </CardContent>
                  <CardContent className="pt-0">
                    <Button className="w-full h-14 font-black italic uppercase tracking-widest bg-[#facc15] hover:bg-yellow-400 text-black rounded-xl" disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "SYNCHRONIZE CHANGES"}
                    </Button>
                  </CardContent>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="pt-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-[#002d28]/60 border-white/5 rounded-3xl p-6">
                  <p className="text-[10px] font-black uppercase text-[#7da09d] mb-4 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> WAGER OVERVIEW
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl">
                      <span className="text-xs font-bold text-white/60">Total Wagered</span>
                      <span className="text-lg font-black text-white">৳ {(profile.totalWagered || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl">
                      <span className="text-xs font-bold text-white/60">Total Won</span>
                      <span className="text-lg font-black text-emerald-400">৳ {(profile.totalWon || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
                <Card className="bg-[#002d28]/60 border-white/5 rounded-3xl p-6">
                  <p className="text-[10px] font-black uppercase text-[#7da09d] mb-4 flex items-center gap-2">
                    <Trophy className="w-3 h-3" /> PERFORMANCE
                  </p>
                  <div className="flex flex-col items-center justify-center h-full py-2">
                    <span className="text-4xl font-black text-[#facc15] italic">{winRatio}%</span>
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Winning Efficiency</span>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financials" className="pt-4 animate-in fade-in slide-in-from-bottom-2">
              <Card className="bg-[#002d28]/60 border-white/5 rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-black italic text-white flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    VAULT <span className="text-emerald-400">CONTROL</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                  <div className="flex flex-col items-center justify-center py-10 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
                    <span className="text-[10px] font-black text-[#7da09d] uppercase tracking-[0.3em] mb-2">Available Credits</span>
                    <span className="text-6xl font-black text-white italic tracking-tighter">৳ {(profile.balance || 0).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Link href="/deposit" className="w-full">
                      <Button className="w-full h-16 font-black italic text-lg uppercase bg-[#facc15] hover:bg-yellow-400 text-black rounded-2xl shadow-xl shadow-[#facc15]/5">DEPOSIT</Button>
                    </Link>
                    <Link href="/withdraw" className="w-full">
                      <Button variant="outline" className="w-full h-16 font-black italic text-lg uppercase border-white/10 hover:bg-white/5 rounded-2xl">WITHDRAW</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
