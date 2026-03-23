
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
  Loader2,
  Bell,
  Zap,
  CheckCheck,
  Trophy
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.uid}`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.notifications?.filter((n: any) => !n.isRead).length || 0);
    } catch {}
  }, [user]);

  const monitorGames = useCallback(async () => {
    if (!user) return;
    try {
       const res = await fetch('/api/admin/games');
       const { games } = await res.json();
       const now = Date.now();

       for (const game of games) {
          if (!game.draw_date) continue;
          const drawTime = new Date(game.draw_date).getTime();
          const diff = drawTime - now;

          // Game starting in less than 75 seconds (1 minute + buffer)
          if (diff > 0 && diff < 75000) {
             // Create notification if recently not created
             await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                   userId: user.uid,
                   title: 'GAME LAUNCHING',
                   message: `${game.name} starting in less than 1 minute! Join now.`,
                   type: 'game_start',
                   metadata: { gameId: game.id || game._id }
                })
             });
             fetchNotifications();
          }
       }
    } catch {}
  }, [user, fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
    const nInterval = setInterval(fetchNotifications, 60000); // 1 min sync
    const mInterval = setInterval(monitorGames, 30000); // 30s monitor
    return () => { clearInterval(nInterval); clearInterval(mInterval); };
  }, [fetchNotifications, monitorGames]);

  const markRead = async () => {
    if (!user) return;
    try {
       await fetch(`/api/notifications?userId=${user.uid}`, { method: 'PATCH' });
       fetchNotifications();
    } catch {}
  };

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
              <div className="flex items-center gap-3">
                <DropdownMenu onOpenChange={(open) => { if (open) markRead(); }}>
                  <DropdownMenuTrigger asChild>
                    <button className="relative p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                      <Bell className="w-5 h-5 text-[#7da09d] group-hover:text-[#facc15] transition-colors" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 border-2 border-[#002d28] rounded-full flex items-center justify-center text-[8px] font-black text-white animate-bounce">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 bg-[#002d28] border-white/10 text-white p-0 rounded-2xl backdrop-blur-3xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-4 bg-white/5 flex items-center justify-between border-b border-white/5">
                      <h3 className="text-[10px] font-black italic uppercase tracking-widest text-[#facc15]">Signal Receiver</h3>
                      <Link href="/notifications" className="text-[8px] font-black uppercase text-[#7da09d] hover:text-white transition-colors">View All Signals</Link>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto overflow-x-hidden custom-scrollbar divide-y divide-white/5">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center">
                           <Bell className="w-8 h-8 text-white/5 mx-auto mb-2" />
                           <p className="text-[9px] font-bold uppercase text-[#7da09d]">No active signals</p>
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                           <DropdownMenuItem key={n._id} onClick={() => n.metadata?.gameId && router.push(`/${n.metadata.gameId}`)} className="p-4 flex flex-col items-start gap-1 focus:bg-white/5 cursor-pointer transition-colors group">
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[9px] font-black italic uppercase text-[#facc15]">{n.title}</span>
                                <span className="text-[7px] font-bold text-[#7da09d] uppercase opacity-40">{formatDistanceToNow(new Date(n.createdAt))} ago</span>
                              </div>
                              <p className="text-[10px] font-bold text-[#7da09d] group-hover:text-white transition-colors line-clamp-2 uppercase leading-tight">{n.message}</p>
                           </DropdownMenuItem>
                        ))
                      )}
                    </div>
                    <Link href="/notifications" className="block p-3 text-center bg-white/5 hover:bg-[#facc15] hover:text-black transition-all">
                       <span className="text-[9px] font-black italic uppercase tracking-[.2em]">Open Control Center</span>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>

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
