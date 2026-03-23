"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { TicketForm } from "./TicketForm";
import { TicketVisual } from "./TicketVisual";
import { WinnerSequence } from "./WinnerSequence";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, Play, Ticket as TicketIcon, Trophy, 
  Loader2, Timer, Download, FastForward, Clock,
  RefreshCcw, AlertCircle, User, MapPin, Phone
} from "lucide-react";
import { useUser, useDoc } from "@/firebase";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";

export interface TicketData {
  id: string;
  name: string;
  phone: string;
  address: string;
  ticketNumbers: string[];
  purchaseDate: string;
  userId?: string;
}

// ----------------------------------------------------------------------
// INTERNAL SLOT REEL COMPONENT
// ----------------------------------------------------------------------
const SlotReelEngine = ({ 
  participants, 
  spinning, 
  winningTicket, 
  onSpinEnd 
}: { 
  participants: string[], 
  spinning: boolean, 
  winningTicket: string | null, 
  onSpinEnd: () => void 
}) => {
  const [displayedNumber, setDisplayedNumber] = useState('88888888');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (spinning) {
      let counter = 0;
      const totalSpins = 40 + Math.floor(Math.random() * 20);
      
      const tick = () => {
        const randomIdx = Math.floor(Math.random() * participants.length);
        setDisplayedNumber(participants[randomIdx] || '88888888');
        counter++;

        if (counter < totalSpins) {
          const speed = counter > totalSpins - 10 ? 150 : 50;
          timerRef.current = setTimeout(tick, speed);
        } else {
          if (winningTicket) setDisplayedNumber(winningTicket);
          onSpinEnd();
        }
      };
      tick();
    } else if (winningTicket) {
      setDisplayedNumber(winningTicket);
    }
    
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [spinning, participants, winningTicket, onSpinEnd]);

  return (
    <div className="w-full max-w-lg h-24 md:h-32 bg-black/60 border-2 border-[#facc15]/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden relative mx-auto z-10">
       <div className="text-3xl md:text-7xl font-mono font-black uppercase tracking-[0.2em] text-[#facc15] drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]">
         {displayedNumber}
       </div>
       <div className="absolute top-1/2 left-0 right-0 h-px bg-[#facc15]/10 pointer-events-none" />
    </div>
  );
};

// ----------------------------------------------------------------------
// MAIN SLOT-STYLE RAFFLE SYSTEM
// ----------------------------------------------------------------------
export const SlotRaffleGame = ({ game }: { game?: any }) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const [activeTickets, setActiveTickets] = useState<TicketData[]>([]);
  const [lastPurchase, setLastPurchase] = useState<TicketData | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/profile?uid=${user.uid}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        if (data.profile?.role === 'admin') setIsAdmin(true);
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const config = game || {
    winners_count: 5,
    prizes: [],
    manual_winners: {},
    ticket_price: 1,
    next_winner_minutes: 5
  };
  
  const [activeTab, setActiveTab] = useState("buy");
  const [systemStatus, setSystemStatus] = useState<"buying" | "pre-game" | "drawing" | "finished">("buying");
  const [targetDrawDate, setTargetDrawDate] = useState<Date | null>(game?.draw_date ? new Date(game.draw_date) : null);
  const [eventCountdown, setEventCountdown] = useState<number>(0);
  const [preGameCountdown, setPreGameCountdown] = useState<number|null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [winners, setWinners] = useState<TicketData[]>([]);
  const [winningNumbers, setWinningNumbers] = useState<string[]>([]);
  const [showWinnerSequence, setShowWinnerSequence] = useState(false);
  const [drawStep, setDrawStep] = useState(0); 
  const [interWinnerCountdown, setInterWinnerCountdown] = useState<number|null>(null);
  const [rolloverCountdown, setRolloverCountdown] = useState<number|null>(null);

  const fetchTickets = useCallback(async () => {
    if (!game?.id) return;
    try {
      const res = await fetch(`/api/tickets?gameId=${game.id}`);
      const data = await res.json();
      if (res.ok) setActiveTickets(data.tickets || []);
    } catch (err) {
      console.error('Fetch tickets error:', err);
    }
  }, [game?.id]);

  const broadcastEvent = useCallback(async (event: string, payload: any) => {
    if (!game?.id) return;
    await supabase.channel(`raffle-${game.id}`).send({
      type: 'broadcast',
      event,
      payload
    });
  }, [game?.id]);

  const triggerNextSpin = useCallback((step: number, list: string[]) => {
    setIsDrawing(true);
    setInterWinnerCountdown(null);
  }, []);

  // Sync / Monitor Effect
  useEffect(() => {
    if (!game?.id) return;

    const channel = supabase.channel(`raffle-${game.id}`)
      .on('broadcast', { event: 'DRAW_STARTED' }, ({ payload }) => {
        setWinners(payload.winners || []);
        setWinningNumbers(payload.winningNumbers || []);
        setDrawStep(0);
        setSystemStatus("drawing");
        setActiveTab("draw");
      })
      .on('broadcast', { event: 'NEXT_STEP' }, ({ payload }) => {
        setDrawStep(payload.step);
        setIsDrawing(false);
        setInterWinnerCountdown(null);
        triggerNextSpin(payload.step, winningNumbers);
      })
      .on('broadcast', { event: 'TICKET_BOUGHT' }, ({ payload }) => {
        if (payload.allTickets) setActiveTickets(payload.allTickets);
        else fetchTickets();
      })
      .on('broadcast', { event: 'GAME_ROLLOVER' }, ({ payload }) => {
        setTargetDrawDate(new Date(payload.drawDate));
        setSystemStatus("buying");
        setActiveTab("buy");
        setWinners([]); // Clear current winner list for new round
        setWinningNumbers([]);
      })
      .subscribe();

    const recoveryInterval = setInterval(async () => {
      if ((systemStatus === "drawing" || systemStatus === "finished") && winningNumbers.length === 0) {
        try {
           const res = await fetch(`/api/admin/games/${game.id}`);
           const { game: updatedGame } = await res.json();
           if (updatedGame?.current_winners?.length > 0) {
              setWinners(updatedGame.current_winners);
              setWinningNumbers(updatedGame.current_winning_numbers);
              setDrawStep(updatedGame.current_step || 0);
           }
        } catch {}
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(recoveryInterval);
    };
  }, [game?.id, systemStatus, winningNumbers, triggerNextSpin, fetchTickets]);

  // Timer Effect
  useEffect(() => {
    if (!targetDrawDate) return;

    const updateTimer = () => {
      const now = Date.now() + serverTimeOffset;
      const diff = Math.floor((targetDrawDate.getTime() - now) / 1000);

      if (diff > 0) {
        setEventCountdown(diff);
        setSystemStatus("buying");
        return;
      }

      if (game?.draw_started_at) {
        const startedAt = new Date(game.draw_started_at).getTime();
        const revealMins = 20 * 60 * 1000;
        const timeSinceStart = now - startedAt;
        
        if (timeSinceStart < revealMins) {
           setWinners(game.current_winners || []);
           setWinningNumbers(game.current_winning_numbers || []);
           setDrawStep(game.current_step || 0);
           setSystemStatus("finished");
           setActiveTab("draw");
           setRolloverCountdown(Math.floor((revealMins - timeSinceStart) / 1000));
           return;
        }
      } else if (now > targetDrawDate.getTime()) {
         setActiveTab("draw");
      }

      setEventCountdown(0);
      if (systemStatus === "buying") {
        setSystemStatus("pre-game");
        setActiveTab("draw");
        setPreGameCountdown(5);
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [targetDrawDate, systemStatus, serverTimeOffset, game?.draw_started_at, game?.current_winners, game?.current_winning_numbers, game?.current_step]);

  useEffect(() => {
    fetchTickets();
    if (user) {
      fetch(`/api/profile?uid=${user.uid}`).then(r => r.json()).then(d => { if (d?.profile?.role === 'admin') setIsAdmin(true); });
    }
  }, [fetchTickets, user]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getRankSuffix = (n: number) => {
    if (n === 1) return "Grand Champion";
    const j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) return n + "st Place";
    if (j === 2 && k !== 12) return n + "nd Place";
    if (j === 3 && k !== 13) return n + "rd Place";
    return n + "th Place";
  };

  const handleRollover = useCallback(async () => {
    if (!game?.id) return;
    try {
      const res = await fetch(`/api/admin/games/${game?.id || game?._id}/rollover`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTargetDrawDate(new Date(data.draw_date));
        setSystemStatus("buying");
        setActiveTab("buy");
        toast({ title: "NEXT ROUND ACTIVE", description: `You can buy tickets for the next draw now!` });
        broadcastEvent('GAME_ROLLOVER', { drawDate: data.draw_date });
      }
    } catch (err) {
      console.error('Rollover error:', err);
    }
  }, [game?.id, game?._id, broadcastEvent, toast]);

  const handleNextRequest = useCallback(() => {
    setShowWinnerSequence(false);
    if (drawStep < (config.winners_count || 1) - 1) {
      const nextStep = drawStep + 1;
      setDrawStep(nextStep);
      setIsDrawing(false);
      setInterWinnerCountdown(null);
      broadcastEvent('NEXT_STEP', { step: nextStep });
      setTimeout(() => triggerNextSpin(nextStep, winningNumbers), 500);
    } else {
      setSystemStatus("finished");
      handleRollover(); // <--- INSTANT ROLLOVER
    }
  }, [drawStep, winningNumbers, triggerNextSpin, config.winners_count, broadcastEvent, handleRollover]);

  const startDraw = useCallback(async () => {
    if (!game?.id) return;
    setSystemStatus("drawing");
    try {
      const res = await fetch(`/api/admin/games/${game.id}/start-draw`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "DRAW FAILED", description: data.error });
        setSystemStatus("buying");
        return;
      }
      setWinningNumbers(data.winningNumbers);
      setWinners(data.winners);
      setDrawStep(0);
      broadcastEvent('DRAW_STARTED', { 
        winningNumbers: data.winningNumbers,
        winners: data.winners,
        draw_started_at: data.draw_started_at
      });
      setTimeout(() => triggerNextSpin(0, data.winningNumbers), 100);
    } catch (err: any) {
      toast({ variant: "destructive", title: "CONNECTION ERROR", description: "RNG system unreachable." });
    }
  }, [game?.id, toast, triggerNextSpin, broadcastEvent]);

  const handleSpinEnd = useCallback(async () => {
    setIsDrawing(false);
    setShowWinnerSequence(true);
    
    // Auto-save result logic here if needed, but start-draw already saved winners
    if (drawStep < (game?.winners_count || 1) - 1) {
      setInterWinnerCountdown((game?.next_winner_minutes || 5) * 60); 
    } else {
      setSystemStatus("finished");
      setRolloverCountdown(1200);
    }
  }, [drawStep, game?.winners_count, game?.next_winner_minutes]);

  // Render Logic
  const allTicketNumbers = activeTickets.flatMap(t => t.ticketNumbers);
  const currentActiveWinningTicketStr = winningNumbers[drawStep] || null;

  return (
    <div className="min-h-screen bg-[#001c19] text-white overflow-x-hidden font-sans pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-[#002d28] p-1 h-16 rounded-[24px] border border-white/5 w-full max-w-md mx-auto grid grid-cols-2">
            <TabsTrigger value="buy" className="rounded-2xl font-black italic uppercase text-[10px] tracking-widest data-[state=active]:bg-[#facc15] data-[state=active]:text-black transition-all">
              <TicketIcon className="w-3.5 h-3.5 mr-2" /> Get Tickets
            </TabsTrigger>
            <TabsTrigger value="draw" className="rounded-2xl font-black italic uppercase text-[10px] tracking-widest data-[state=active]:bg-[#facc15] data-[state=active]:text-black transition-all">
              <Play className="w-3.5 h-3.5 mr-2" /> Live Draw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                   <Card className="bg-[#002d28] border-white/5 rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl relative">
                      <div className="absolute top-0 right-0 p-4 md:p-8">
                         <div className="bg-[#facc15]/10 border border-[#facc15]/20 px-4 md:px-6 py-1 md:py-2 rounded-xl md:rounded-2xl flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 md:w-4 h-4 text-[#facc15]" />
                            <span className="text-sm md:text-xl font-black italic text-[#facc15]">{formatTime(eventCountdown)}</span>
                         </div>
                      </div>
                      <CardHeader className="p-6 md:p-12 pb-4 md:pb-6 pt-16 md:pt-12">
                         <div className="flex items-center gap-3 mb-2">
                            <Sparkles className="w-5 h-5 md:w-6 h-6 text-[#facc15]" />
                            <span className="text-[9px] md:text-[10px] font-black text-[#7da09d] uppercase tracking-[0.3em] md:tracking-[0.4em]">GRAND SLOT RAFFLE</span>
                         </div>
                         <CardTitle className="text-3xl md:text-6xl font-black italic uppercase tracking-tighter text-white max-w-xl">
                            Secure Your <span className="text-[#facc15]">Legacy</span> Entry.
                         </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 md:p-12 pt-0">
                         <TicketForm 
                            onSubmit={async (data) => {
                               if (!user) {
                                  toast({ variant: "destructive", title: "AUTH REQUIRED", description: "Login to purchase tickets." });
                                  return;
                               }
                               
                               const cost = data.quantity * (config.ticket_price || 1);
                               if ((profile?.balance || 0) < cost) {
                                  toast({ variant: "destructive", title: "INSUFFICIENT BALANCE", description: "Top up your account." });
                                  return;
                               }

                               try {
                                 // Generate random tickets locally for the user
                                 const ticketNumbers = Array.from({ length:data.quantity }, () => 
                                    Math.floor(10000000 + Math.random() * 90000000).toString()
                                 );

                                 const res = await fetch('/api/tickets', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({ 
                                      ...data, 
                                      ticketNumbers, 
                                      gameId: game.id, 
                                      userId: user.uid 
                                   })
                                 });
                                 
                                 const result = await res.json();
                                 if (!res.ok) throw new Error(result.error);
                                 
                                 await fetchTickets();
                                 await fetchProfile(); // REFRESH BALANCE
                                 toast({ title: "SUCCESS", description: `Secured ${data.quantity} tickets! New Balance: ৳${result.balance.toLocaleString()}` });
                               } catch (e: any) {
                                 toast({ variant: "destructive", title: "FAILED", description: e.message });
                               }
                            }} 
                            ticketPrice={config.ticket_price}
                            balance={profile?.balance || 0}
                         />
                      </CardContent>
                   </Card>
                </div>

                <div className="space-y-8">
                   <Card className="bg-[#002d28] border-white/5 rounded-[40px] overflow-hidden">
                      <CardHeader className="p-8 border-b border-white/5">
                         <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black italic uppercase tracking-widest text-[#facc15]">Live Participants</h3>
                            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold">{activeTickets.length} ACTIVE</span>
                         </div>
                      </CardHeader>
                      <CardContent className="p-0">
                         <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                            {activeTickets.length === 0 ? (
                               <div className="p-20 text-center space-y-4">
                                  <AlertCircle className="w-12 h-12 text-white/5 mx-auto" />
                                  <p className="text-[10px] font-bold text-[#7da09d] uppercase tracking-widest">Awaiting First Entry...</p>
                               </div>
                            ) : (
                               activeTickets.map((t: any) => (
                                  <div key={t._id || t.id} className="p-6 flex items-center justify-between group hover:bg-white/5 transition-colors">
                                     <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 text-[#facc15] font-black uppercase italic text-xs">
                                           {t.name[0]}
                                        </div>
                                        <div>
                                           <p className="text-xs font-black uppercase text-white">{t.name}</p>
                                           <p className="text-[9px] font-mono text-[#7da09d]">#{t.ticketNumbers[0]}</p>
                                        </div>
                                     </div>
                                     <div className="bg-[#facc15]/10 px-3 py-1 rounded-lg border border-[#facc15]/20">
                                        <span className="text-[10px] font-black italic text-[#facc15]">{t.ticketNumbers.length}X</span>
                                     </div>
                                  </div>
                               ))
                            )}
                         </div>
                      </CardContent>
                   </Card>

                    {systemStatus === "finished" && winners.length > 0 && (
                     <Card className="bg-[#002d28] border-[#facc15]/20 rounded-[40px] overflow-hidden shadow-[0_0_40px_rgba(250,204,21,0.1)] border-t-4 border-t-[#facc15]">
                        <CardHeader className="p-8 border-b border-white/5 bg-[#facc15]/5">
                           <div className="flex items-center gap-3">
                              <Trophy className="w-5 h-5 text-[#facc15]" />
                              <h3 className="text-sm font-black italic uppercase tracking-widest text-white">Last Draw Hall of Fame</h3>
                           </div>
                        </CardHeader>
                        <CardContent className="p-0">
                           <div className="divide-y divide-white/5">
                              {winners.slice().reverse().map((w: any, idx) => {
                                 const rank = idx + 1;
                                 const prizeConfig = (config.prizes || []).find((p: any) => p.rank === rank);
                                 const poolTotal = (activeTickets.length > 0 ? activeTickets.length : winners.length) * (config.ticket_price || 1);
                                 const prizeAmount = prizeConfig ? (poolTotal * (prizeConfig.percentage || 0)) / 100 : 0;

                                 return (
                                    <div key={w._id || idx} className="p-6 flex items-center justify-between group hover:bg-white/5 transition-all">
                                       <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-xs border ${rank === 1 ? 'bg-[#facc15]/20 border-[#facc15] text-[#facc15]' : 'bg-black/40 border-white/10 text-white/40'}`}>
                                             {rank}
                                          </div>
                                          <div>
                                             <p className="text-xs font-black uppercase text-white">{w.name}</p>
                                             <p className="text-[8px] font-mono text-[#7da09d]">TICKET: #{w.ticketNumbers[0]}</p>
                                          </div>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-xs font-black italic text-[#facc15]">৳{prizeAmount.toLocaleString()}</p>
                                          <p className="text-[8px] font-bold text-[#7da09d] uppercase opacity-40">PRIZE REWARD</p>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </CardContent>
                     </Card>
                    )}
                 </div>
              </div>
          </TabsContent>

          <TabsContent value="draw">
             <div className="max-w-4xl mx-auto space-y-12 py-12">
                <div className="text-center space-y-2 md:space-y-4">
                   <div className="inline-flex items-center gap-2 bg-[#facc15]/10 border border-[#facc15]/20 px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl">
                      <RefreshCcw className="w-3.5 h-3.5 md:w-4 h-4 text-[#facc15] animate-spin" />
                      <span className="text-[9px] md:text-[10px] font-black text-[#facc15] uppercase tracking-widest">LIVE DRAW ENGINE</span>
                   </div>
                   <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white">
                      {systemStatus === "drawing" ? "Drawing Winners" : "Final Results"}
                   </h2>
                </div>

                <SlotReelEngine 
                  participants={allTicketNumbers}
                  spinning={isDrawing}
                  winningTicket={currentActiveWinningTicketStr}
                  onSpinEnd={handleSpinEnd}
                />

                <div className="flex justify-center">
                   {systemStatus === "pre-game" ? (
                      <div className="flex flex-col items-center gap-6">
                        <div className="flex items-center gap-4">
                           {[1,2,3,4,5].map(i => (
                             <div key={i} className={`w-3 h-3 rounded-full transition-all duration-300 ${preGameCountdown && i <= preGameCountdown ? 'bg-[#facc15] scale-125 shadow-[0_0_15px_#facc15]' : 'bg-white/10'}`} />
                           ))}
                        </div>
                        <p className="text-xs font-black italic text-[#7da09d] uppercase tracking-[0.4em]">INITIATING LOCAL RNG SEQUENCER...</p>
                        {isAdmin && (
                          <Button onClick={startDraw} className="bg-[#facc15] hover:bg-yellow-400 text-black font-black italic px-12 py-6 rounded-2xl text-lg uppercase tracking-widest shadow-2xl">
                             Force Start Draw
                          </Button>
                        )}
                      </div>
                   ) : isDrawing ? (
                      <div className="bg-black/40 px-8 py-4 rounded-2xl border border-[#facc15]/30 flex items-center gap-3">
                         <RefreshCcw className="w-6 h-6 text-[#facc15] animate-spin" />
                         <span className="text-xl font-black italic text-[#facc15] uppercase tracking-tighter">
                            DRAWING {getRankSuffix((config.winners_count || 1) - drawStep)}...
                         </span>
                      </div>
                   ) : interWinnerCountdown !== null ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="bg-emerald-500/10 border border-emerald-500/30 px-6 py-2 rounded-2xl">
                           <span className="text-[#facc15] font-black italic uppercase tracking-widest">NEXT DRAW IN {formatTime(interWinnerCountdown)}</span>
                        </div>
                        {isAdmin && <Button variant="ghost" className="text-[10px] font-black uppercase text-[#7da09d] hover:text-white" onClick={handleNextRequest}>Manual Skip <FastForward className="w-3 h-3 ml-2" /></Button>}
                      </div>
                   ) : systemStatus === "finished" ? (
                      <div className="text-center space-y-4">
                         <Trophy className="w-16 h-16 text-[#facc15] mx-auto animate-bounce" />
                         <p className="text-xs font-black text-[#facc15] uppercase tracking-[0.3em]">NEXT RAFFLE DRAW ACCESS IN {formatTime(rolloverCountdown || 0)}:</p>
                      </div>
                   ) : null}
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>

      <WinnerSequence 
        open={showWinnerSequence} 
        onOpenChange={setShowWinnerSequence} 
        winners={winners} 
        currentStep={drawStep}
        onNext={handleNextRequest}
        currentUserUid={user?.uid}
        prizes={config.prizes || []}
        totalPoolValue={allTicketNumbers.length * (config.ticket_price || 1)}
        countdown={interWinnerCountdown}
      />
    </div>
  );
};
