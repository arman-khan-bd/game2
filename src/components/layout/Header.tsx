
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useUser, useDoc, setDoc } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Menu, 
  RefreshCcw, 
  Wallet, 
  Star, 
  Download, 
  X, 
  Gift, 
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, isUserLoading } = useUser();
  const { data: profile } = useDoc(user ? `userProfiles/${user.uid}` : null);
  const [dbRole, setDbRole] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Fetch role directly from MongoDB 'profiles' via API for absolute accuracy
  const fetchUserMetadata = useCallback(async () => {
    if (!user) {
      setDbRole(null);
      return;
    }
    
    try {
      const res = await fetch(`/api/profile?uid=${user.uid}`);
      if (!res.ok) return;

      const { profile: data } = await res.json();
      
      if (data) {
        setDbRole(data.role);
        // Sync with local mock layer to ensure UI consistency
        await setDoc(`userProfiles/${user.uid}`, {
          ...data,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e) {
      console.error("Header Role Sync Error:", e);
    }
  }, [user]);

  useEffect(() => {
    fetchUserMetadata();
  }, [fetchUserMetadata]);

  const handleRefreshBalance = async () => {
    if (isRefreshing || !user) return;
    setIsRefreshing(true);
    await fetchUserMetadata();
    // Simulate a brief delay for better UX feel
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Robust admin check: checks both fetched dbRole and local profile role (case-insensitive)
  const isAdmin = [dbRole, profile?.role].some(r => r?.toLowerCase() === 'admin');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('hub_user');
      window.dispatchEvent(new Event('local-auth-change'));
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex flex-col w-full z-50">
      {/* Top yellow promo bar */}
      <div className="bg-[#fbbf24] text-black px-4 py-2 flex items-center justify-between text-[11px] font-black italic">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 rounded p-0.5">
             <Star className="w-3 h-3 text-white fill-current" />
          </div>
          <span className="uppercase tracking-tighter">APP UP TO ৳18 {">>>"}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-current" />)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-yellow-400 border border-yellow-600 px-3 py-1 rounded-md shadow-sm">Download</button>
          <div className="relative">
             <X className="w-4 h-4 opacity-40" />
             <Gift className="w-5 h-5 text-indigo-700 absolute -top-1 -right-4 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Main navigation row */}
      <header className="bg-[#002d28] border-b border-white/5 h-16 flex items-center justify-between px-4 sticky top-0">
        <div className="flex items-center gap-3">
          <Menu className="w-6 h-6 text-white" />
          <Link href="/" className="text-[#facc15] font-black text-xl tracking-tighter italic">
            CV666.COM
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {!isUserLoading && user ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="hidden md:flex bg-[#facc15]/10 border-[#facc15]/20 text-[#facc15] hover:bg-[#facc15]/20 font-black italic text-[10px] uppercase tracking-widest h-9 px-4 rounded-lg">
                    <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                    Admin Panel
                  </Button>
                  <Button variant="outline" size="icon" className="md:hidden bg-[#facc15]/10 border-[#facc15]/20 text-[#facc15] h-9 w-9 rounded-lg">
                    <LayoutDashboard className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 focus:outline-none group">
                      <Avatar className="h-9 w-9 border-2 border-[#facc15] p-0.5 transition-transform group-active:scale-95">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          {profile?.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-3 h-3 text-white/40 group-hover:text-white transition-colors" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#002d28] border-white/10 text-white p-2 rounded-xl backdrop-blur-xl shadow-2xl">
                    <DropdownMenuLabel className="px-2 py-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-xs font-black italic uppercase text-[#facc15] tracking-tighter">{profile?.username || 'Member'}</p>
                        <p className="text-[10px] font-bold text-[#7da09d] truncate uppercase tracking-tighter">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/5" />
                    
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild className="focus:bg-[#facc15]/10 focus:text-[#facc15] cursor-pointer py-3 rounded-lg font-black italic text-[10px] uppercase tracking-widest transition-colors">
                          <Link href="/admin" className="flex items-center w-full">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                      </>
                    )}

                    <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-[#facc15] cursor-pointer py-3 rounded-lg font-black italic text-[10px] uppercase tracking-widest transition-colors">
                      <Link href="/profile" className="flex items-center w-full">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-[#facc15] cursor-pointer py-3 rounded-lg font-black italic text-[10px] uppercase tracking-widest transition-colors">
                      <Link href="/profile" className="flex items-center w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-emerald-400 cursor-pointer py-3 rounded-lg font-black italic text-[10px] uppercase tracking-widest transition-colors">
                      <Link href="/deposit" className="flex items-center w-full">
                        <Wallet className="w-4 h-4 mr-2" />
                        Vault & Balance
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={handleLogout} className="focus:bg-red-500/10 focus:text-red-400 cursor-pointer py-3 rounded-lg font-black italic text-[10px] uppercase tracking-widest transition-colors">
                      <LogOut className="w-4 h-4 mr-2" />
                      Exit System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div 
                  onClick={handleRefreshBalance}
                  className="bg-[#044e45] rounded-full px-3 py-1.5 flex items-center gap-2 border border-white/10 shadow-inner cursor-pointer hover:bg-[#055a4f] transition-colors group"
                >
                  <span className="text-white font-black text-xs">৳ {(profile?.balance || 0).toLocaleString()}</span>
                  {isRefreshing ? (
                    <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  ) : (
                    <RefreshCcw className="w-3.5 h-3.5 text-emerald-400 group-active:rotate-180 transition-transform duration-500" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" className="text-white text-xs font-bold uppercase">Login</Button></Link>
              <Link href="/register"><Button className="bg-[#facc15] hover:bg-yellow-400 text-black text-xs font-black uppercase rounded-lg px-6 h-9">Join</Button></Link>
            </div>
          )}
        </div>
      </header>

      {/* Announcement bar */}
      <div className="bg-[#001c19] px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
           <RefreshCcw className="w-3 h-3 text-orange-400 rotate-45" />
           <span className="text-[10px] text-[#7da09d] font-bold uppercase truncate">Welcome to CV666.COM - The ultimate gambling experience!</span>
        </div>
        <span className="text-[10px] text-[#7da09d] font-black shrink-0 ml-4">No anr</span>
      </div>
    </div>
  );
}
