
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  Users, 
  Bot, 
  Gamepad2, 
  TrendingUp, 
  Circle,
  Cpu,
  Monitor,
  Loader2,
  RefreshCcw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface SessionRecord {
  id: string;
  username: string;
  is_bot: boolean;
  game_id: string;
  bet_amount: number;
  win_amount: number;
  created_at: string;
}

export default function ServerMonitor() {
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    activePlayers: 0,
    activeBots: 0,
    totalVolume: 0,
    serverLoad: 12
  });

  const fetchLiveLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        setHistory(data);
        
        const volume = data.reduce((acc, curr) => acc + (parseFloat(curr.bet_amount) || 0), 0);
        const botCount = data.filter(d => d.is_bot).length;
        
        // Dynamic load calculation for visual effect
        setStats({
          activePlayers: data.length + Math.floor(Math.random() * 5),
          activeBots: botCount,
          totalVolume: volume,
          serverLoad: 10 + Math.floor(Math.random() * 8)
        });
      }
    } catch (err) {
      console.error('Monitor sync error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveLogs();
    const interval = setInterval(fetchLiveLogs, 5000); 
    return () => clearInterval(interval);
  }, []);

  if (isLoading && history.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Synchronizing Session Logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-tight">SERVER <span className="text-primary">MONITOR</span></h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mt-1 flex items-center gap-2">
            <Cpu className="w-3 h-3 text-primary animate-pulse" />
            Live Platform Engine Synchronization
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={fetchLiveLogs} className="border-white/10 bg-white/5 font-bold h-10">
            <RefreshCcw className="w-4 h-4 mr-2" /> REFRESH
          </Button>
          <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-white/60">System Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Logs', value: history.length, icon: Users, color: 'text-blue-400' },
          { label: 'AI Entities', value: stats.activeBots, icon: Bot, color: 'text-purple-400' },
          { label: 'CPU Cluster', value: `${stats.serverLoad}%`, icon: Monitor, color: 'text-accent' },
          { label: 'Total Stake', value: `$${stats.totalVolume.toLocaleString()}`, icon: TrendingUp, color: 'text-green-400' },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl bg-white/5 border border-white/5 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <Circle className="w-2 h-2 fill-current opacity-20" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-white">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-white/5">
           <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Live <span className="text-primary">Session Log</span>
           </CardTitle>
           <CardDescription className="text-xs uppercase tracking-widest font-bold">Real-time player activity across all game instances</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Player Handle</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Game Instance</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right">Stake</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right">Yield (Earn)</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right">Deficit (Loss)</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-black uppercase tracking-widest italic opacity-40">
                    Waiting for platform activity...
                  </TableCell>
                </TableRow>
              ) : (
                history.map((p) => {
                  const bet = parseFloat(p.bet_amount?.toString() || '0');
                  const win = parseFloat(p.win_amount?.toString() || '0');
                  const isWin = win > 0;
                  const isLoss = win === 0 && bet > 0;
                  
                  return (
                    <TableRow key={p.id} className="border-white/5 hover:bg-white/5 transition-all group">
                      <TableCell className="py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${p.is_bot ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                            {p.is_bot ? <Bot className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className={`text-xs font-black italic uppercase ${p.is_bot ? 'text-purple-400' : 'text-white'}`}>
                              {p.username || 'ANONYMOUS'} {p.is_bot ? '(BOT)' : ''}
                            </p>
                            <Badge variant="outline" className="text-[8px] font-black border-white/5 bg-white/5 px-1 py-0 h-4">
                              {p.is_bot ? 'AI_NODE' : 'USER_CLIENT'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <Gamepad2 className="w-3 h-3 text-muted-foreground" />
                           <span className="text-[11px] font-black italic uppercase tracking-widest text-white/60">{p.game_id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs font-black text-white">${bet.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isWin ? (
                          <div className="inline-flex items-center gap-1 text-green-400 font-black text-xs">
                            <ArrowUpRight className="w-3 h-3" />
                            +${win.toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-xs font-black text-white/20">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isLoss ? (
                          <div className="inline-flex items-center gap-1 text-red-400 font-black text-xs">
                            <ArrowDownRight className="w-3 h-3" />
                            -${bet.toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-xs font-black text-white/20">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {p.created_at ? new Date(p.created_at).toLocaleTimeString() : '---'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
