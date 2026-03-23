'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Trophy, Zap, Wallet, Trash2, CheckCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.uid}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    try {
        await fetch(`/api/notifications?userId=${user.uid}`, { method: 'PATCH' });
        fetchNotifications();
    } catch {}
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'game_start': return <Zap className="w-5 h-5 text-[#facc15]" />;
      case 'win': return <Trophy className="w-5 h-5 text-emerald-400" />;
      case 'deposit': return <Wallet className="w-5 h-5 text-blue-400" />;
      default: return <Bell className="w-5 h-5 text-[#7da09d]" />;
    }
  };

  if (!user) return (
     <div className="min-h-screen bg-[#001c19] flex items-center justify-center p-4">
        <Card className="bg-[#002d28] border-white/5 p-12 text-center max-w-sm">
           <Zap className="w-16 h-16 text-[#facc15]/20 mx-auto mb-6" />
           <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">Auth Required</h2>
           <p className="text-xs font-bold text-[#7da09d] uppercase tracking-widest mt-2 mb-8">Please login to access your secure alert system.</p>
           <Link href="/login"><Button className="w-full bg-[#facc15] hover:bg-yellow-400 text-black font-black italic uppercase tracking-widest h-14 rounded-2xl shadow-xl">System Entry</Button></Link>
        </Card>
     </div>
  );

  return (
    <div className="min-h-screen bg-[#001c19] py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
              Signal <span className="text-[#facc15]">Control Center</span>
            </h1>
            <p className="text-[10px] uppercase font-bold text-[#7da09d] tracking-widest">Global & System Alert Frequency</p>
          </div>
          <Button 
            onClick={markAllRead} 
            variant="outline" 
            className="hidden md:flex bg-black/20 border-white/10 text-white/60 hover:text-[#facc15] font-black italic uppercase text-[10px] tracking-widest h-12 px-6 rounded-2xl"
          >
             <CheckCheck className="w-4 h-4 mr-2" /> Mark All Read
          </Button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
             <Loader2 className="w-12 h-12 text-[#facc15] animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <Card className="bg-[#002d28] border-white/5 border-dashed border-2 p-20 text-center rounded-[40px]">
             <Bell className="w-16 h-16 text-white/5 mx-auto mb-6" />
             <p className="text-xs font-black uppercase tracking-widest text-[#7da09d]">No active signals intercepted.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <Card key={n._id} className={`bg-[#002d28] border-white/5 rounded-[32px] overflow-hidden group hover:border-[#facc15]/20 transition-all ${!n.isRead ? 'border-l-4 border-l-[#facc15]' : ''}`}>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className={`p-4 rounded-2xl ${!n.isRead ? 'bg-[#facc15]/10' : 'bg-black/20 opacity-40'}`}>
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-black italic uppercase tracking-tighter ${!n.isRead ? 'text-white' : 'text-white/40'}`}>{n.title}</h3>
                      <span className="text-[8px] font-black text-[#7da09d] uppercase">{formatDistanceToNow(new Date(n.createdAt))} ago</span>
                    </div>
                    <p className={`text-xs font-bold leading-relaxed ${!n.isRead ? 'text-[#7da09d]' : 'text-[#7da09d]/30'}`}>{n.message}</p>
                    {n.metadata?.gameId && (
                       <Link href={`/${n.metadata.gameId}`} className="block pt-2">
                          <span className="text-[10px] font-black italic text-[#facc15] hover:underline uppercase tracking-widest">Join Game Instance →</span>
                       </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
