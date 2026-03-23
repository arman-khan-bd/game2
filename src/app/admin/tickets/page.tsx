
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Ticket, 
  Users, 
  Trophy, 
  Clock, 
  RefreshCcw,
  CheckCircle2,
  History,
  Search,
  Download,
  Filter,
  CreditCard,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function TicketRegistry() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'tickets' | 'winners'>('tickets');
  const { toast } = useToast();

  const fetchRegistry = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/registry');
      if (!res.ok) throw new Error('Registry sync failed');
      const data = await res.json();
      setTickets(data.tickets || []);
      setWinners(data.winners || []);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'NETWORK ERROR', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, []);

  const handleSettlePrize = async (winnerId: string) => {
    try {
      const res = await fetch('/api/admin/registry', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, action: 'settle' })
      });
      if (res.ok) {
        toast({ title: 'PRIZE TRANSFERRED', description: 'Winner prize has been marked as settled in registry.' });
        fetchRegistry();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
    t.phone.includes(filterQuery) ||
    t.gameName.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredWinners = winners.filter(w => 
    w.username.toLowerCase().includes(filterQuery.toLowerCase()) || 
    w.gameName.toLowerCase().includes(filterQuery.toLowerCase()) || 
    w.ticketNumber.includes(filterQuery)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-tight">SYSTEM <span className="text-primary">REGISTRY</span></h1>
          <p className="text-muted-foreground text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
            <Target className="w-3 h-3 text-primary" />
            Central entry & settlement audit logs
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -track-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
            <Input 
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter..."
              className="pl-11 h-12 w-full md:w-[250px] bg-white/5 border-white/5 font-bold text-xs italic tracking-widest focus:border-primary/50 transition-all"
            />
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={fetchRegistry} className="h-12 flex-1 md:flex-none border-white/10 bg-white/5 hover:bg-white/10 font-bold group">
               <RefreshCcw className={cn("w-4 h-4 mr-2 transition-transform", isLoading && "animate-spin")} />
               <span className="hidden sm:inline">REFRESH</span>
             </Button>
             <Button className="h-12 flex-1 md:flex-none bg-primary hover:bg-primary/90 font-black italic uppercase tracking-widest text-[9px] px-6">
               <Download className="w-4 h-4 mr-2" /> EXPORT
             </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/5 p-4 md:p-6 space-y-2">
           <span className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Entries</span>
           <div className="flex items-end justify-between">
              <span className="text-xl md:text-3xl font-black italic text-white leading-none">{tickets.length}</span>
              <Users className="w-4 h-4 md:w-5 md:h-5 text-primary opacity-50" />
           </div>
        </Card>
        <Card className="bg-white/5 border-white/5 p-4 md:p-6 space-y-2">
           <span className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Winners</span>
           <div className="flex items-end justify-between">
              <span className="text-xl md:text-3xl font-black italic text-[#facc15] leading-none">{winners.length}</span>
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-[#facc15] opacity-50" />
           </div>
        </Card>
        <Card className="bg-white/5 border-white/5 p-4 md:p-6 space-y-2">
           <span className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pending</span>
           <div className="flex items-end justify-between">
              <span className="text-xl md:text-3xl font-black italic text-red-500 leading-none">{winners.filter(w => !w.isSettled).length}</span>
              <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-red-500 opacity-50" />
           </div>
        </Card>
        <Card className="bg-white/5 border-white/5 p-4 md:p-6 space-y-2 border-primary/20 bg-primary/5">
           <span className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-widest">Audit</span>
           <div className="flex items-end justify-between">
              <span className="text-lg md:text-xl font-black italic text-white uppercase leading-none text-[12px] md:text-xl">Healthy</span>
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary opacity-50" />
           </div>
        </Card>
      </div>

      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit">
        <button 
          onClick={() => setActiveTab('tickets')}
          className={cn(
            "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'tickets' ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white"
          )}
        >
          Entry Registry
        </button>
        <button 
          onClick={() => setActiveTab('winners')}
          className={cn(
            "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'winners' ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white"
          )}
        >
          Winner Registry
        </button>
      </div>

      <Card className="bg-card/30 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto custom-scrollbar">
          {activeTab === 'tickets' ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300 min-w-[800px]">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#7da09d]">Timestamp</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#7da09d]">Protocol / Game</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#7da09d]">Participant Profile</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#7da09d]">Identifiers (Tickets)</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#7da09d] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-white/5">
                      <TableCell colSpan={5} className="py-8"><div className="h-4 bg-white/5 animate-pulse rounded w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center italic font-black text-white/20 uppercase tracking-[0.5em]">No records found in current segment</TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((t) => (
                    <TableRow key={t._id} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="px-6 py-5">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-white italic">{new Date(t.createdAt).toLocaleDateString()}</span>
                           <span className="text-[9px] font-bold text-muted-foreground uppercase">{new Date(t.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                         <div className="flex flex-col">
                            <span className="text-xs font-black text-primary italic uppercase tracking-tighter">{t.gameName}</span>
                            <span className="text-[8px] font-mono text-muted-foreground uppercase opacity-50">{t.gameId}</span>
                         </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                         <div className="flex flex-col">
                            <span className="text-xs font-black text-white">{t.name}</span>
                            <span className="text-[10px] font-bold text-muted-foreground">{t.phone}</span>
                         </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                         <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                            {t.ticketNumbers.slice(0, 2).map((num: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-[8px] font-mono border-white/10 text-white/60">#{num}</Badge>
                            ))}
                            {t.ticketNumbers.length > 2 && (
                               <span className="text-[8px] font-bold text-muted-foreground ml-1">+{t.ticketNumbers.length - 2} more</span>
                            )}
                         </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-center">
                         <Badge 
                           className={cn(
                             "text-[8px] font-black uppercase h-5",
                             t.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                             t.status === 'winning' ? "bg-[#facc15]/10 text-[#facc15] border border-[#facc15]/20" :
                             "bg-red-500/10 text-red-500 border border-red-500/20"
                           )}
                         >
                           {t.status || 'Active'}
                         </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 min-w-[800px]">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#7da09d]">Draw Date</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#7da09d]">Game Protocol</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#7da09d]">Profile (Winner)</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#7da09d]">Placement</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#7da09d] text-right">Prize (BDT)</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#7da09d] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWinners.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={6} className="py-20 text-center italic font-black text-white/20 uppercase tracking-[0.5em]">No winning sequences detected</TableCell>
                  </TableRow>
                ) : (
                  filteredWinners.map((w) => (
                    <TableRow key={w._id} className="border-white/5 hover:bg-white/5 transition-colors group">
                       <TableCell className="px-6 py-5">
                          <span className="text-[10px] font-black text-white/50">{new Date(w.createdAt).toLocaleDateString()}</span>
                       </TableCell>
                       <TableCell className="px-6 py-5 font-black italic text-primary uppercase text-xs">
                          {w.gameName}
                       </TableCell>
                       <TableCell className="px-6 py-5">
                          <div className="flex flex-col">
                             <span className="text-xs font-black text-white">{w.username}</span>
                             <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">TKT: #{w.ticketNumber}</span>
                          </div>
                       </TableCell>
                       <TableCell className="px-6 py-5">
                          <Badge className="bg-[#facc15]/10 text-[#facc15] border border-[#facc15]/20 text-[9px] font-black">
                            {w.rank}{w.rank === 1 ? 'ST' : w.rank === 2 ? 'ND' : w.rank === 3 ? 'RD' : 'TH'} PLACE
                          </Badge>
                       </TableCell>
                       <TableCell className="px-6 py-5 text-right font-black italic text-emerald-400">
                          ৳{w.prizeAmount.toLocaleString()}
                       </TableCell>
                       <TableCell className="px-6 py-5 text-right">
                          {w.isSettled ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black">SETTLED</Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => handleSettlePrize(w._id)}
                              className="h-8 bg-primary/20 hover:bg-primary text-primary hover:text-black font-black italic text-[9px] uppercase transition-all"
                            >
                              SETTLE POOL
                            </Button>
                          )}
                       </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        </div>
      </Card>
    </div>
  );
}
