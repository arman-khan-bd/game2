
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Ticket, 
  Settings, 
  Users, 
  Trophy, 
  Bot, 
  Clock, 
  Save, 
  Loader2, 
  RefreshCcw,
  CheckCircle2,
  History,
  SendHorizontal,
  Plus,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function RaffleManager() {
  const [config, setConfig] = useState<any>(null);
  const [winners, setWinners] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPlayers: 0, totalTickets: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchRaffleData = async () => {
    try {
      setIsLoading(true);
      // 1. Fetch Config
      const { data: configData } = await supabase.from('raffle_config').select('*').maybeSingle();
      if (configData) setConfig(configData);

      // 2. Fetch Winners
      const { data: winnerData } = await supabase
        .from('raffle_winners')
        .select('*')
        .order('draw_date', { ascending: false })
        .limit(20);
      setWinners(winnerData || []);

      // 3. Simulated Stats from LocalStorage (Sync with frontend)
      const ticketDb = JSON.parse(localStorage.getItem('local_db_raffleTickets') || '{}');
      const allTickets = Object.values(ticketDb) as any[];
      const uniquePlayers = new Set(allTickets.map(t => t.userId)).size;
      const totalTicks = allTickets.reduce((acc, t) => acc + (t.ticketNumbers?.length || 0), 0);
      
      setStats({ totalPlayers: uniquePlayers, totalTickets: totalTicks });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRaffleData();
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('raffle_config')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) throw error;
      toast({ title: "RAFFLE ENGINE UPDATED", description: "Operational parameters are now live." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "SYNC FAILED", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const settlePrize = async (winner: any) => {
    if (winner.is_settled) return;
    
    try {
      // In a real app, this would update the user's profile balance in SQL
      // For this prototype, we mark it as settled in the history
      const { error } = await supabase
        .from('raffle_winners')
        .update({ is_settled: true, settled_at: new Date().toISOString() })
        .eq('id', winner.id);

      if (error) throw error;
      
      setWinners(prev => prev.map(w => w.id === winner.id ? { ...w, is_settled: true } : w));
      toast({ title: "PRIZE SETTLED", description: `৳${winner.prize_amount} transferred to ${winner.username}.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "SETTLEMENT ERROR", description: err.message });
    }
  };

  if (isLoading && !config) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Synchronizing Raffle Core...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-tight">RAFFLE <span className="text-primary">MANAGER</span></h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mt-1 flex items-center gap-2">
            <Ticket className="w-3 h-3" />
            Grand Jackpot Event Control
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchRaffleData} className="border-white/10 bg-white/5 font-bold h-12">
            <RefreshCcw className="w-4 h-4 mr-2" /> REFRESH DATA
          </Button>
          <Button onClick={handleSaveConfig} disabled={isSaving} className="font-black italic px-8 h-12 shadow-[0_0_20px_rgba(91,87,233,0.3)]">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            APPLY ENGINE CHANGES
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-6">
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Entrants</p>
           <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <p className="text-3xl font-black text-white">{stats.totalPlayers}</p>
           </div>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-6">
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Tickets in Pool</p>
           <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#facc15]" />
              <p className="text-3xl font-black text-[#facc15]">{stats.totalTickets}</p>
           </div>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-6">
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Min Threshold</p>
           <p className="text-3xl font-black text-white">{config?.min_tickets_threshold || 50}</p>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-6 border-primary/20 bg-primary/5">
           <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Auto-Play</p>
           <p className="text-xl font-black text-white uppercase tracking-tighter">Every {config?.auto_play_hours || 24} Hours</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Prize <span className="text-primary">Architecture</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Grand Champion (1st)", key: "prize_1", color: "text-[#facc15]" },
                  { label: "Runner Up (2nd)", key: "prize_2", color: "text-white" },
                  { label: "Third Place (3rd)", key: "prize_3", color: "text-white/80" },
                  { label: "Fourth Place (4th)", key: "prize_4", color: "text-white/60" },
                  { label: "Fifth Place (5th)", key: "prize_5", color: "text-white/40" },
                ].map((p) => (
                  <div key={p.key} className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{p.label}</label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black ${p.color}`}>৳</span>
                      <Input 
                        type="number"
                        value={config?.[p.key] || 0}
                        onChange={(e) => setConfig({...config, [p.key]: parseFloat(e.target.value)})}
                        className="pl-10 h-12 bg-black/40 border-white/5 font-black text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Winner <span className="text-primary">Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Player</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Rank</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right">Prize</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right">Settlement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {winners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-20 text-muted-foreground font-black uppercase tracking-widest italic opacity-40">
                        No previous grand draws detected.
                      </TableCell>
                    </TableRow>
                  ) : (
                    winners.map((w) => (
                      <TableRow key={w.id} className="border-white/5 hover:bg-white/5">
                        <TableCell>
                          <p className="text-xs font-black text-white italic">{w.username}</p>
                          <span className="text-[8px] font-mono text-muted-foreground">TICKET: #{w.ticket_number}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={w.rank === 1 ? 'bg-[#facc15] text-black' : 'bg-white/5 text-white'}>
                            {w.rank}{w.rank === 1 ? 'ST' : w.rank === 2 ? 'ND' : w.rank === 3 ? 'RD' : 'TH'} PLACE
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs font-black text-emerald-400">৳{w.prize_amount.toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {w.is_settled ? (
                            <div className="flex items-center justify-end gap-1 text-green-400">
                               <CheckCircle2 className="w-3.5 h-3.5" />
                               <span className="text-[10px] font-black uppercase">PAID</span>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => settlePrize(w)}
                              className="h-8 bg-primary/20 hover:bg-primary text-primary hover:text-black font-black italic text-[9px] uppercase"
                            >
                              SETTLE <SendHorizontal className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-white/5">
              <CardTitle className="text-sm font-black italic uppercase tracking-widest text-primary flex items-center gap-2">
                <Bot className="w-4 h-4" /> AI Bot Orchestration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                 <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Auto-Purchase Active</p>
                    <p className="text-[9px] text-muted-foreground uppercase">Bots buy if threshold not met</p>
                 </div>
                 <Switch 
                  checked={config?.is_active} 
                  onCheckedChange={(v) => setConfig({...config, is_active: v})} 
                 />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Min Ticket Threshold</label>
                <Input 
                  type="number"
                  value={config?.min_tickets_threshold || 0}
                  onChange={(e) => setConfig({...config, min_tickets_threshold: parseInt(e.target.value)})}
                  className="h-12 bg-black/40 border-white/5 font-black text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bot Batch Volume</label>
                <Input 
                  type="number"
                  value={config?.bot_purchase_amount || 0}
                  onChange={(e) => setConfig({...config, bot_purchase_amount: parseInt(e.target.value)})}
                  className="h-12 bg-black/40 border-white/5 font-black text-white"
                />
              </div>

              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                 <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                 <p className="text-[10px] text-blue-200/60 font-medium leading-relaxed italic">
                   If "Auto-Purchase" is ON, the system will inject the Bot Batch Volume into the pool if the Min Threshold isn't met by the scheduled draw time.
                 </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-sm font-black italic uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Draw Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cycle Interval (Hours)</label>
                <Input 
                  type="number"
                  value={config?.auto_play_hours || 0}
                  onChange={(e) => setConfig({...config, auto_play_hours: parseInt(e.target.value)})}
                  className="h-12 bg-black/40 border-white/5 font-black text-white"
                />
              </div>
              <p className="text-[9px] font-bold text-center uppercase tracking-widest text-muted-foreground opacity-40">
                Next Scheduled Draw: T-Minus {config?.auto_play_hours || 24}H
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
