'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Bot, 
  Plus, 
  Trash2, 
  Power, 
  PowerOff, 
  Loader2, 
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Database,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BOT_NAMES = [
  'Astro_Bot', 'CyberPulse', 'VoidWalker', 'NeonSlayer', 'GhostMachine', 
  'QuantumBit', 'BinaryBeast', 'NovaLink', 'EchoVoid', 'ZenithAI'
];

const GAMES = ['crash', 'roulette', 'slots', 'raffle'];

export default function BotManager() {
  const [bots, setBots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchCount, setBatchCount] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchBots = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBots(data || []);
    } catch (err: any) {
      console.error('Bot fetch error:', err);
      toast({ variant: "destructive", title: "Sync Error", description: "The bots table may be missing the created_at column. Please run the Repair SQL." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const handleCreateBatch = async () => {
    setIsProcessing(true);
    const newBots = Array.from({ length: batchCount }).map(() => ({
      name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + '_' + Math.floor(Math.random() * 999),
      is_active: true,
      game_preference: GAMES[Math.floor(Math.random() * GAMES.length)]
    }));

    const { error } = await supabase.from('bots').insert(newBots);
    
    if (error) {
      toast({ variant: "destructive", title: "Deployment Failed", description: error.message });
    } else {
      toast({ title: "AI Nodes Deployed", description: `Successfully created ${batchCount} new bots.` });
      fetchBots();
    }
    setIsProcessing(false);
  };

  const handleToggleStatus = async (botId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('bots')
      .update({ is_active: !currentStatus })
      .eq('id', botId);

    if (!error) {
      setBots(bots.map(b => b.id === botId ? { ...b, is_active: !currentStatus } : b));
    }
  };

  const handleBulkStatus = async (status: boolean) => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);

    const { error } = await supabase
      .from('bots')
      .update({ is_active: status })
      .in('id', selectedIds);

    if (error) {
      toast({ variant: "destructive", title: "Batch Update Failed", description: error.message });
    } else {
      toast({ title: "Command Confirmed", description: `System status updated for ${selectedIds.length} entities.` });
      fetchBots();
    }
    setIsProcessing(false);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Confirm mass termination of ${selectedIds.length} bots?`)) return;

    setIsProcessing(true);
    const { error } = await supabase
      .from('bots')
      .delete()
      .in('id', selectedIds);

    if (error) {
      toast({ variant: "destructive", title: "Termination Error", description: error.message });
    } else {
      toast({ title: "Entities Purged", description: "Successfully removed selected AI nodes." });
      setSelectedIds([]);
      fetchBots();
    }
    setIsProcessing(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === bots.length ? [] : bots.map(b => b.id));
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Accessing AI Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-tight">BOT <span className="text-primary">MANAGER</span></h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mt-1 flex items-center gap-2">
            <Database className="w-3 h-3" />
            AI Node Orchestration Control
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white/5 border border-white/5 rounded-xl px-4 py-2 gap-3">
             <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Batch Size</span>
             <input 
               type="number" 
               value={batchCount}
               onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
               className="w-12 bg-transparent border-none text-white font-black text-center focus:ring-0"
             />
          </div>
          <Button onClick={handleCreateBatch} disabled={isProcessing} className="font-black italic uppercase tracking-widest text-[10px] h-12 px-8 shadow-[0_0_20px_rgba(91,87,233,0.3)]">
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            DEPLOY BATCH
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-6">
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Nodes</p>
           <p className="text-3xl font-black text-white">{bots.length}</p>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-6">
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active AI</p>
           <p className="text-3xl font-black text-green-400">{bots.filter(b => b.is_active).length}</p>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-6">
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Selected</p>
           <p className="text-3xl font-black text-primary">{selectedIds.length}</p>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 p-6 border-primary/20 bg-primary/5">
           <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Status</p>
           <p className="text-xs font-bold text-white uppercase tracking-tighter">System Synchronized</p>
        </Card>
      </div>

      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-50 bg-primary p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <span className="text-xs font-black italic uppercase tracking-widest text-white">{selectedIds.length} Nodes Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => handleBulkStatus(true)} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white font-black italic text-[10px] uppercase tracking-widest border border-white/10">
              <Power className="w-3 h-3 mr-2" /> ACTIVATE
            </Button>
            <Button onClick={() => handleBulkStatus(false)} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white font-black italic text-[10px] uppercase tracking-widest border border-white/10">
              <PowerOff className="w-3 h-3 mr-2" /> DEACTIVATE
            </Button>
            <Button onClick={handleBulkDelete} variant="destructive" className="bg-red-950/40 hover:bg-red-900 border border-red-500/30 font-black italic text-[10px] uppercase tracking-widest">
              <Trash2 className="w-3 h-3 mr-2" /> TERMINATE
            </Button>
          </div>
        </div>
      )}

      <Card className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-white/5">
          <div className="flex justify-between items-center">
             <div>
               <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  Node <span className="text-primary">Registry</span>
               </CardTitle>
               <CardDescription className="text-xs uppercase tracking-widest font-bold">Manage AI entity deployment and status</CardDescription>
             </div>
             <div className="relative w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input className="pl-10 h-10 bg-black/40 border-white/5 rounded-xl text-xs" placeholder="Search bots..." />
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-12 py-5">
                  <Checkbox 
                    checked={selectedIds.length === bots.length && bots.length > 0} 
                    onCheckedChange={toggleSelectAll} 
                  />
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Bot Handle</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Preference</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right">Created</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right">Control</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-black uppercase tracking-widest italic opacity-40">
                    No active AI nodes detected. Deploy a batch to start.
                  </TableCell>
                </TableRow>
              ) : (
                bots.map((bot) => (
                  <TableRow key={bot.id} className="border-white/5 hover:bg-white/5 transition-all group">
                    <TableCell className="py-5">
                      <Checkbox 
                        checked={selectedIds.includes(bot.id)} 
                        onCheckedChange={() => toggleSelect(bot.id)} 
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${bot.is_active ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`text-sm font-black italic uppercase ${bot.is_active ? 'text-white' : 'text-muted-foreground'}`}>
                            {bot.name}
                          </p>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">AI_NODE_{bot.id.substring(0, 4)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-widest py-0.5">
                        {bot.game_preference || 'ALL_GAMES'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${bot.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className={`text-[10px] font-black uppercase ${bot.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          {bot.is_active ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {bot.created_at ? new Date(bot.created_at).toLocaleDateString() : '---'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch 
                        checked={bot.is_active} 
                        onCheckedChange={() => handleToggleStatus(bot.id, bot.is_active)} 
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}