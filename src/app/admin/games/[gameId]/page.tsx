
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Fully Mongoose-driven file no longer relying on direct client-side Supabase queries
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ChevronLeft, 
  Loader2, 
  Save, 
  Gamepad2,
  Settings,
  Clock,
  Users,
  Percent,
  UploadCloud,
  FileText,
  Type,
  Database,
  AlertCircle,
  ShieldCheck,
  Trophy,
  Ticket as TicketIcon,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Script from 'next/script';

declare global {
  interface Window {
    cloudinary: any;
  }
}

export default function GameConfigPage() {
  const params = useParams();
  const gameId = params?.gameId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [game, setGame] = useState<any>(null);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    game_type: 'raffle',
    total_tickets: 100,
    ticket_price: 1,
    auto_play_hours: 24,
    next_winner_minutes: 10,
    is_bot_play: false,
    winners_count: 1,
    prizes: [],
    manual_winners: {},
    is_active: true
  });

  const [activeTab, setActiveTab] = useState('config');
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [ticketSearch, setTicketSearch] = useState('');
  
  const fetchTickets = async () => {
    if (!gameId) return;
    try {
      const res = await fetch(`/api/tickets?gameId=${gameId}`);
      const data = await res.json();
      if (res.ok) setAllTickets(data.tickets || []);
    } catch (err) {
      console.error('Fetch admin tickets error:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [gameId]);

  // Real-time synchronization
  useEffect(() => {
    if (!gameId) return;
    const { supabase } = require('@/lib/supabase'); // Dynamic import to prevent SSR issues if needed
    
    const channel = supabase.channel(`raffle-${gameId}`)
      .on('broadcast', { event: 'TICKET_BOUGHT' }, () => {
        fetchTickets(); // Refresh entries list
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);
  
  const [presetsInput, setPresetsInput] = useState('');

  const fetchGame = async () => {
    if (!gameId) return;
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/games/${gameId}`, { cache: 'no-store' });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch MongoDB game data');
      }
      
      if (result.game) {
        const data = result.game;
        setGame(data);
        setFormData({
          name: data.name || '',
          game_type: data.game_type || 'raffle',
          total_tickets: data.total_tickets || 100,
          ticket_price: data.ticket_price || 1,
          auto_play_hours: data.auto_play_hours || 24,
          next_winner_minutes: data.next_winner_minutes || 10,
          is_bot_play: Boolean(data.is_bot_play),
          winners_count: data.winners_count || 1,
          prizes: data.prizes || [],
          manual_winners: data.manual_winners instanceof Map 
            ? Object.fromEntries(data.manual_winners) 
            : (data.manual_winners || {}),
          is_active: data.is_active !== false,
          photo_url: data.photo_url || ''
        });
      } else {
        toast({ variant: "destructive", title: "Engine Missing", description: "The requested game core record does not exist in the database." });
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      toast({ variant: "destructive", title: "Fetch Failed", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  const handleUpload = () => {
    if (!window.cloudinary) {
      toast({ variant: "destructive", title: "Widget Loading", description: "Cloudinary script is not yet available." });
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast({ 
        variant: "destructive", 
        title: "Config Error", 
        description: "Cloudinary credentials missing in .env file." 
      });
      return;
    }

    try {
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: cloudName.trim(),
          uploadPreset: uploadPreset.trim(),
          multiple: false,
          resourceType: 'image',
          clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
          cropping: true,
          showAdvancedOptions: false,
          styles: {
            palette: {
              window: "#0B0E1B",
              windowBorder: "#5B57E9",
              tabIcon: "#5B57E9",
              menuIcons: "#5B57E9",
              textDark: "#FFFFFF",
              textLight: "#FFFFFF",
              link: "#5B57E9",
              action: "#5B57E9",
              inactiveTabIcon: "#FFFFFF",
              error: "#F43F5E",
              inProgress: "#5B57E9",
              complete: "#10B981",
              sourceBg: "#141A2E"
            }
          }
        },
        (error: any, result: any) => {
          if (!error && result && result.event === "success") {
            const imageUrl = result.info.secure_url;
            setFormData((prev: any) => ({ ...prev, photo_url: imageUrl }));
            toast({ title: "Asset Uploaded", description: "Cloudinary link synchronized. Click SAVE to persist." });
          } else if (error) {
            console.error('Upload widget error:', error);
            toast({ 
              variant: "destructive", 
              title: "Upload Failed", 
              description: error.message || "Ensure your preset is 'Unsigned' and Cloud Name is correct." 
            });
          }
        }
      );
      widget.open();
    } catch (e: any) {
      console.error('Widget open exception:', e);
      toast({ variant: "destructive", title: "Widget Error", description: e.message });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const presets = presetsInput.split(',')
        .map(p => parseFloat(p.trim()))
        .filter(p => !isNaN(p));

      const updatePayload = {
        name: formData.name,
        game_type: formData.game_type,
        total_tickets: parseInt(formData.total_tickets) || 100,
        ticket_price: parseFloat(formData.ticket_price) || 1,
        auto_play_hours: parseInt(formData.auto_play_hours) || 24,
        next_winner_minutes: parseInt(formData.next_winner_minutes) || 10,
        is_bot_play: !!formData.is_bot_play,
        winners_count: parseInt(formData.winners_count) || 1,
        prizes: formData.prizes,
        manual_winners: formData.manual_winners,
        is_active: formData.is_active,
        photo_url: formData.photo_url,
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sync to MongoDB Engine Database.");
      }

      setGame(result.game);
      toast({ title: "CORE SYNCED", description: "Operational parameters are now live in production." });
      
    } catch (err: any) {
      console.error('Save failed:', err);
      toast({ 
        variant: "destructive", 
        title: "SYNC FAILURE", 
        description: err.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Accessing Core Archives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/games">
            <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-xl">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-tight">ENGINE <span className="text-primary">CONFIG</span></h1>
            <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60">{game?.name || 'RAFFLE CORE'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white/5 border border-white/5 rounded-xl p-1 h-12">
            <TabsList className="bg-transparent border-none p-0 h-full">
              <TabsTrigger value="config" className="text-[10px] font-black uppercase px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg transition-all flex items-center gap-2">
                <Settings className="w-3 h-3" /> ENGINE CONFIGURATION
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button onClick={handleSave} disabled={isSaving} className="font-black italic px-10 h-12 shadow-[0_0_20px_rgba(91,87,233,0.3)] uppercase tracking-widest text-[10px]">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            SAVE PARAMETERS
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="config" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden shadow-2xl">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">System Status</span>
                    <div className="flex items-center gap-2">
                      <span className={formData.is_active ? 'text-green-400 font-bold text-xs' : 'text-red-400 font-bold text-xs'}>
                        {formData.is_active ? 'OPERATIONAL' : 'OFFLINE'}
                      </span>
                      <Switch 
                        checked={formData.is_active} 
                        onCheckedChange={(val) => setFormData({...formData, is_active: val})} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Bot Play</span>
                    <div className="flex items-center gap-2">
                      <span className={formData.is_bot_play ? 'text-primary font-bold text-xs' : 'text-muted-foreground font-bold text-xs'}>
                        {formData.is_bot_play ? 'ENABLED' : 'DISABLED'}
                      </span>
                      <Switch 
                        checked={formData.is_bot_play} 
                        onCheckedChange={(val) => setFormData({...formData, is_bot_play: val})} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden text-white">
                <CardHeader className="border-b border-white/5 pb-6">
                  <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <Settings className="w-5 h-5 text-primary" />
                    Operational <span className="text-primary">Logic</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Type className="w-3 h-3" /> Architecture Type
                      </Label>
                      <select 
                        value={formData.game_type || 'raffle'} 
                        onChange={(e) => setFormData({...formData, game_type: e.target.value})}
                        className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="raffle">Raffle Draw</option>
                        <option value="slot_raffle">Slot-Style Raffle</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Type className="w-3 h-3" /> Display Name
                      </Label>
                      <input 
                        value={formData.name || ''} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Tickets</Label>
                      <input 
                        type="number"
                        value={formData.total_tickets} 
                        onChange={(e) => setFormData({...formData, total_tickets: e.target.value})}
                        className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ticket Price ($)</Label>
                      <input 
                        type="number"
                        step="0.01"
                        value={formData.ticket_price} 
                        onChange={(e) => setFormData({...formData, ticket_price: e.target.value})}
                        className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Auto-Play Frequency (Hours)
                      </Label>
                      <input 
                        type="number"
                        value={formData.auto_play_hours} 
                        onChange={(e) => setFormData({...formData, auto_play_hours: e.target.value})}
                        className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Next Winner Interval (Minutes)
                      </Label>
                      <input 
                        type="number"
                        value={formData.next_winner_minutes} 
                        onChange={(e) => setFormData({...formData, next_winner_minutes: e.target.value})}
                        className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Trophy className="w-3 h-3" /> Number of Winners
                      </Label>
                      <select 
                        value={formData.winners_count} 
                        onChange={(e) => {
                          const count = Number(e.target.value);
                          const newPrizes = Array.from({ length: count }).map((_, i) => ({
                            rank: i + 1,
                            percentage: i === 0 ? 100 : 0
                          }));
                          setFormData({...formData, winners_count: count, prizes: newPrizes});
                        }}
                        className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-4 font-black text-white focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <option key={n} value={n}>{n} WINNER{n > 1 ? 'S' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic opacity-50">WIN DISTRIBUTION (TOTAL 100%)</Label>
                        <div className="flex gap-2">
                           <Button 
                             size="sm" 
                             variant="outline" 
                             type="button"
                             className="h-6 text-[8px] font-black italic uppercase rounded-md bg-white/5 border-white/10"
                             onClick={() => {
                               const count = formData.winners_count;
                               const evenP = Math.floor(100 / count);
                               const updated = formData.prizes.map((p: any) => ({ ...p, percentage: evenP }));
                               if (count > 0) updated[0].percentage += (100 - (evenP * count));
                               setFormData({...formData, prizes: updated});
                             }}
                           >
                             Balance Evenly
                           </Button>
                           <Button 
                             size="sm" 
                             variant="outline" 
                             type="button"
                             className="h-6 text-[8px] font-black italic uppercase rounded-md bg-white/5 border-white/10"
                             onClick={() => {
                               const updated = formData.prizes.map((p: any, i: number) => ({ ...p, percentage: i === 0 ? 100 : 0 }));
                               setFormData({...formData, prizes: updated});
                             }}
                           >
                             Winner Take All
                           </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                         {formData.prizes.map((p: any, i: number) => (
                           <div key={i} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5 group transition-all hover:border-primary/50">
                              <span className="text-[10px] font-black text-primary px-1">Rank {p.rank}:</span>
                              <input 
                                type="number"
                                value={p.percentage}
                                onChange={(e) => {
                                  const updated = [...formData.prizes];
                                  updated[i].percentage = Number(e.target.value);
                                  setFormData({...formData, prizes: updated});
                                }}
                                className="bg-transparent w-full text-xs font-black focus:outline-none"
                              />
                              <span className="text-[10px] font-black opacity-30">%</span>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* LIVE TICKET BUYERS & WINNER PINS - PROMOTE TO MAIN VIEW */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Winner Assignments Summary */}
        {Object.keys(formData.manual_winners).length > 0 && (
          <Card className="bg-primary/5 border-primary/20 shadow-2xl overflow-hidden">
            <CardHeader className="py-4 border-b border-primary/10">
              <CardTitle className="text-sm font-black italic uppercase tracking-widest text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Live Winner Assignments (Pinned)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-wrap gap-4 p-4">
                {Array.from({ length: formData.winners_count }).map((_, i) => {
                  const rank = i + 1;
                  const ticketNum = formData.manual_winners[rank.toString()];
                  return (
                    <div key={rank} className="flex items-center gap-3 bg-black/40 border border-white/5 pl-4 pr-2 py-2 rounded-2xl group transition-all hover:border-primary/50">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-primary uppercase">Rank {rank}</span>
                        <span className="text-xs font-mono font-black text-white">{ticketNum || 'UNASSIGNED'}</span>
                      </div>
                      {ticketNum && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-xl hover:bg-white/5 text-white/40 hover:text-red-400 transition-colors"
                          onClick={() => {
                            const newManual = { ...formData.manual_winners };
                            delete newManual[rank.toString()];
                            setFormData({ ...formData, manual_winners: newManual });
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardHeader className="border-b border-white/5 pb-6 flex flex-row items-center justify-between relative z-10">
            <div>
              <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <TicketIcon className="w-5 h-5 text-white" />
                </div>
                LIVE <span className="text-primary">TICKET BUYERS</span> & WINNER PINS
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Real-time WebSocket connection active (Auto-refresh enabled)
              </CardDescription>
            </div>
            <div className="w-64">
              <input 
                placeholder="Search phone or name..."
                value={ticketSearch}
                onChange={e => setTicketSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-black text-white focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 relative z-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 font-black uppercase tracking-widest text-[8px] text-muted-foreground">
                    <th className="px-6 py-4">Participant</th>
                    <th className="px-6 py-4">Contact & Location</th>
                    <th className="px-6 py-4">Ticket Multi-Select</th>
                    <th className="px-6 py-4 text-center">Pin Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(allTickets as any[])?.filter(t => 
                    t.name?.toLowerCase().includes(ticketSearch.toLowerCase()) || 
                    t.phone?.includes(ticketSearch)
                  ).map((ticket, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-white">
                        <div className="flex flex-col">
                          <span className="text-sm font-black italic">{ticket.name}</span>
                          <span className="text-[9px] font-mono text-muted-foreground uppercase opacity-50">{ticket.id || ticket._id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-white/80">{ticket.phone}</span>
                          <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[150px]">{ticket.address}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                          {ticket.ticketNumbers?.map((n: string, i: number) => {
                             const assignedRank = Object.keys(formData.manual_winners).find(r => formData.manual_winners[r] === n);
                             return (
                               <button 
                                 key={i} 
                                 className={cn(
                                   "px-2 py-1.5 rounded-lg border font-mono text-[9px] font-black transition-all",
                                   assignedRank 
                                    ? "bg-primary/20 border-primary text-primary ring-2 ring-primary/20" 
                                    : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30"
                                 )}
                               >
                                 #{n.substring(0, 5)}
                                 {assignedRank && <span className="ml-1 opacity-60">R{assignedRank}</span>}
                               </button>
                             );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-2">
                            <select 
                              className="bg-black/60 border border-white/10 rounded-lg h-9 px-2 text-[10px] font-black text-white focus:outline-none focus:ring-1 focus:ring-primary appearance-none text-center"
                              onChange={(e) => {
                                if (!e.target.value) return;
                                const [rank, ticketNum] = e.target.value.split('|');
                                const newManual = { ...formData.manual_winners };
                                newManual[rank] = ticketNum;
                                setFormData({ ...formData, manual_winners: newManual });
                                e.target.value = ""; // reset
                              }}
                            >
                              <option value="">SELECT WINNER RANK...</option>
                              {Array.from({ length: formData.winners_count }).map((_, rankIdx) => {
                                const rank = rankIdx + 1;
                                return (
                                  <optgroup key={rank} label={`Rank ${rank}`}>
                                    {ticket.ticketNumbers?.map((n: string) => (
                                      <option key={`${rank}-${n}`} value={`${rank}|${n}`}>
                                        Set #{n} as Rank {rank}
                                      </option>
                                    ))}
                                  </optgroup>
                                );
                              })}
                            </select>
                            <p className="text-[7px] font-black text-center text-muted-foreground uppercase tracking-widest">
                              Pick a ranking for this entrant
                            </p>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!allTickets || allTickets.length === 0) && (
              <div className="py-20 text-center text-[10px] font-black uppercase text-muted-foreground opacity-30">
                No tickets detected in the grand pool (WebSocket Waiting...)
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
