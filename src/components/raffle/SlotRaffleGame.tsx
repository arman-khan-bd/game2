"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { TicketForm } from "./TicketForm";
import { TicketVisual } from "./TicketVisual";
import { WinnerSequence } from "./WinnerSequence";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, Play, Ticket as TicketIcon, Trophy, 
  Loader2, Timer, Download, FastForward, Clock,
  RefreshCcw, AlertCircle
} from "lucide-react";
import { useUser, addDoc, useCollection, useDoc } from "@/firebase";
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
// Exclusively spins rapidly through ticket strings and decelerates.
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const spinSpeedRef = useRef(50);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const internalSpinState = useRef<"idle" | "spinning" | "stopping">("idle");

  useEffect(() => {
    // Start spin action triggered by parent state update
    if (spinning && internalSpinState.current === "idle" && participants.length > 0) {
      internalSpinState.current = "spinning";
      let spinsLeft = Math.max(30, Math.floor(Math.random() * 20) + 30);
      spinSpeedRef.current = 40; // Fast initial speed
      
      const tick = () => {
        setCurrentIndex((prev) => (prev + 1) % participants.length);
        spinsLeft--;

        if (spinsLeft < 15) {
          spinSpeedRef.current += 30; // Friction slowdown
        }

        if (spinsLeft > 0) {
          timerRef.current = setTimeout(tick, spinSpeedRef.current);
        } else {
          // Stop requested, hard set to winning target index
          if (winningTicket) {
             const targetIndex = participants.indexOf(winningTicket);
             if (targetIndex !== -1) setCurrentIndex(targetIndex);
          }
          internalSpinState.current = "idle";
          onSpinEnd(); // Inform parent spin has concluded
        }
      };
      
      tick();
    } else if (!spinning) {
      // Emergency reset if parent sets spinning to false preemptively
      internalSpinState.current = "idle";
      if (timerRef.current) clearTimeout(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [spinning, participants, winningTicket, onSpinEnd]);

  const displayedTicketNumber = participants.length > 0 
    ? participants[currentIndex]
    : '88888888';

  return (
    <div className="w-full max-w-lg h-32 bg-black/60 border-2 border-white/10 rounded-2xl shadow-[inset_0_0_50px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden relative mx-auto z-10">
       <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
       <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black via-black/80 to-transparent z-10" />
       
       <div className="w-full text-center transform transition-transform duration-75">
         <div className={`text-4xl md:text-7xl font-mono font-black uppercase tracking-[0.2em] transition-all duration-75 ${(!spinning && winningTicket) ? 'text-[#facc15] scale-110 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]' : 'text-white/80 scale-100 blur-[0.5px]'}`}>
           {displayedTicketNumber}
         </div>
       </div>
       
       <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xs border-x border-white/5 pointer-events-none" />
       <div className="absolute top-1/2 left-0 right-0 h-px bg-[#facc15]/30 pointer-events-none" />
    </div>
  );
};

// ----------------------------------------------------------------------
// MAIN SLOT-STYLE RAFFLE SYSTEM
// ----------------------------------------------------------------------
export const SlotRaffleGame = ({ game }: { game?: any }) => {
  const { user } = useUser();
  const { toast } = useToast();
  const { data: profile } = useDoc(user ? `userProfiles/${user.uid}` : null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [activeTickets, setActiveTickets] = useState<TicketData[]>([]);
  const [lastPurchase, setLastPurchase] = useState<TicketData | null>(null);

  // Use passed game config or fallback
  const config = game || {
    winners_count: 5,
    prizes: [
      { rank: 1, percentage: 40 },
      { rank: 2, percentage: 25 },
      { rank: 3, percentage: 15 },
      { rank: 4, percentage: 10 },
      { rank: 5, percentage: 10 }
    ],
    manual_winners: {},
    is_bot_play: false,
    ticket_price: 1,
    next_winner_minutes: 5
  };
  
  // System State
  const [activeTab, setActiveTab] = useState("buy");
  const [systemStatus, setSystemStatus] = useState<"buying" | "pre-game" | "drawing" | "finished">("buying");
  
  // Synced Timer Logic
  const [targetDrawDate, setTargetDrawDate] = useState<Date | null>(game?.draw_date ? new Date(game.draw_date) : null);
  const [eventCountdown, setEventCountdown] = useState<number>(0);
  const [preGameCountdown, setPreGameCountdown] = useState<number|null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Update countdown based on target draw date
  useEffect(() => {
    if (!targetDrawDate || systemStatus !== "buying") return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.floor((targetDrawDate.getTime() - now) / 1000);
      
      if (diff <= 0) {
        setEventCountdown(0);
        setSystemStatus("pre-game");
        setActiveTab("draw");
        setPreGameCountdown(5);
        toast({ title: "ENTRIES CLOSED", description: "Transitioning to live slot engine..." });
      } else {
        setEventCountdown(diff);
      }
    };

    updateTimer(); // Initial call
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [targetDrawDate, systemStatus, toast]);

  // Fallback if no draw_date is set (backward compatibility)
  useEffect(() => {
    if (!targetDrawDate && systemStatus === "buying") {
      const initialSeconds = (game?.auto_play_hours || 24) * 3600;
      setEventCountdown(initialSeconds);
      
      const timerId = setInterval(() => {
        setEventCountdown(prev => {
          if (prev <= 1) {
            setSystemStatus("pre-game");
            setActiveTab("draw");
            setPreGameCountdown(5);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [targetDrawDate, systemStatus, game?.auto_play_hours]);

  // Drawing States
  const [winners, setWinners] = useState<TicketData[]>([]);
  const [winningNumbers, setWinningNumbers] = useState<string[]>([]);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState<number|null>(null);
  const [showWinnerSequence, setShowWinnerSequence] = useState(false);
  const [drawStep, setDrawStep] = useState(0); 
  const [interWinnerCountdown, setInterWinnerCountdown] = useState<number|null>(null);

  const fetchTickets = useCallback(async () => {
    if (!game?.id) return;
    try {
      const res = await fetch(`/api/tickets?gameId=${game.id}`);
      const data = await res.json();
      if (res.ok) {
        setActiveTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
    }
  }, [game?.id]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const broadcastEvent = useCallback(async (event: string, payload: any) => {
    if (!game?.id) return;
    await supabase.channel(`raffle-${game.id}`).send({
      type: 'broadcast',
      event,
      payload
    });
  }, [game?.id]);

  useEffect(() => {
    if (!game?.id) return;
    const channel = supabase.channel(`raffle-${game.id}`)
      .on('broadcast', { event: 'TIMER_SYNC' }, ({ payload }) => {
        if (payload.drawDate) {
          setTargetDrawDate(new Date(payload.drawDate));
        }
        if (payload.eventCountdown !== undefined) setEventCountdown(payload.eventCountdown);
        if (payload.preGameCountdown !== undefined) setPreGameCountdown(payload.preGameCountdown);
        if (payload.status) setSystemStatus(payload.status);
      })
      .on('broadcast', { event: 'TICKET_BOUGHT' }, () => {
        fetchTickets();
      })
      .on('broadcast', { event: 'DRAW_STARTED' }, ({ payload }) => {
        if (payload.winners) setWinners(payload.winners);
        if (payload.winningNumbers) setWinningNumbers(payload.winningNumbers);
        setDrawStep(0);
        setSystemStatus("drawing");
        setActiveTab("draw");
      })
      .on('broadcast', { event: 'NEXT_STEP' }, ({ payload }) => {
        setDrawStep(payload.step);
        setIsDrawing(false);
        setCurrentWinnerIndex(null);
        setInterWinnerCountdown(null);
        triggerNextSpin(payload.step, winningNumbers);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [game?.id, fetchTickets, winningNumbers]);

  // UI Dialog States
  const [selectedTicketForDownload, setSelectedTicketForDownload] = useState<TicketData|null>(null);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);

  const allTicketNumbers = activeTickets.flatMap(t => t.ticketNumbers);

  useEffect(() => {
    if (user) {
      fetch(`/api/profile?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => { if (data?.profile?.role === 'admin') setIsAdmin(true); })
        .catch(console.error);
    }
  }, [user]);

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

  const triggerNextSpin = useCallback((step: number, list: string[]) => {
    setIsDrawing(true);
    setInterWinnerCountdown(null);
  }, []);

  const handleNextRequest = useCallback(() => {
    setShowWinnerSequence(false);
    if (drawStep < (config.winners_count - 1)) {
      const nextStep = drawStep + 1;
      setDrawStep(nextStep);
      setIsDrawing(false);
      setCurrentWinnerIndex(null);
      setInterWinnerCountdown(null);

      broadcastEvent('NEXT_STEP', { step: nextStep });

      setTimeout(() => {
        triggerNextSpin(nextStep, winningNumbers);
      }, 500);
    } else {
      setSystemStatus("finished");
    }
  }, [drawStep, winningNumbers, triggerNextSpin, config.winners_count, broadcastEvent]);

  const startDraw = useCallback(() => {
    const winnerLimit = config.winners_count || 1;
    if (allTicketNumbers.length < winnerLimit) {
      toast({
        variant: "destructive",
        title: "INSUFFICIENT POOL",
        description: `A minimum of ${winnerLimit} total tickets must be in the pool to start the grand format.`
      });
      return;
    }

    setSystemStatus("drawing");
    const pool = [...allTicketNumbers];
    const selectedWinningNumbers: string[] = [];
    const selectedWinningTickets: TicketData[] = [];

    for (let i = 0; i < winnerLimit; i++) {
      const rank = winnerLimit - i; 
      const manualTicketNumber = config.manual_winners?.[rank.toString()];
      
      let number;
      if (manualTicketNumber && pool.includes(manualTicketNumber)) {
        number = manualTicketNumber;
        const poolIdx = pool.indexOf(number);
        pool.splice(poolIdx, 1);
      } else {
        const idx = Math.floor(Math.random() * pool.length);
        number = pool.splice(idx, 1)[0];
      }

      selectedWinningNumbers.push(number);
      
      const originalTicket = activeTickets.find(t => t.ticketNumbers.includes(number));
      if (originalTicket) {
        selectedWinningTickets.push({
          ...originalTicket,
          ticketNumbers: [number] 
        });
      }
    }
    
    setWinningNumbers(selectedWinningNumbers);
    setWinners(selectedWinningTickets);
    setDrawStep(0);
    setCurrentWinnerIndex(null);
    setInterWinnerCountdown(null);
    
    broadcastEvent('DRAW_STARTED', { 
      winningNumbers: selectedWinningNumbers,
      winners: selectedWinningTickets
    });
    
    setTimeout(() => {
      triggerNextSpin(0, selectedWinningNumbers);
    }, 100);
  }, [allTicketNumbers, activeTickets, toast, triggerNextSpin, config, broadcastEvent]);

  // Main Event Countdown Logic
  useEffect(() => {
    if (systemStatus !== "buying") return;
    
    if (eventCountdown <= 0) {
      setSystemStatus("pre-game");
      setActiveTab("draw");
      setPreGameCountdown(5); // 5 sec short transition
      toast({ title: "ENTRIES CLOSED", description: "Transitioning to live slot engine..." });
      return;
    }

    const timerId = setTimeout(() => setEventCountdown(eventCountdown - 1), 1000);
    return () => clearTimeout(timerId);
  }, [eventCountdown, systemStatus, toast]);

  // Pre-Game Countdown Logic
  useEffect(() => {
    if (systemStatus !== "pre-game" || preGameCountdown === null) return;

    if (preGameCountdown <= 0) {
      setPreGameCountdown(null);
      startDraw(); // Auto start
      return;
    }

    const timerId = setTimeout(() => setPreGameCountdown(preGameCountdown - 1), 1000);
    return () => clearTimeout(timerId);
  }, [preGameCountdown, systemStatus, startDraw]);

  // Inter-winner countdown
  useEffect(() => {
    if (interWinnerCountdown === null) return;
    if (interWinnerCountdown <= 0) {
      setInterWinnerCountdown(null);
      handleNextRequest();
      return;
    }
    const timerId = setTimeout(() => setInterWinnerCountdown(interWinnerCountdown - 1), 1000);
    return () => clearTimeout(timerId);
  }, [interWinnerCountdown, handleNextRequest]);

  const handlePurchase = async (data: { name: string; phone: string; address: string; quantity: number }) => {
    if (systemStatus !== "buying") {
      toast({ variant: "destructive", title: "PURCHASE BLOCKED", description: "The grand pool is closed." });
      return;
    }

    const ticketPrice = config.ticket_price || 1;
    const totalCost = data.quantity * ticketPrice;

    if ((profile?.balance || 0) < totalCost) {
      toast({
        variant: "destructive",
        title: "INSUFFICIENT BALANCE",
        description: `Your balance (৳${profile?.balance || 0}) is not enough to cover the ৳${totalCost} fee.`
      });
      return;
    }

    const newNumbers = Array.from({ length: data.quantity }).map(() => {
      return Math.floor(100000000 + Math.random() * 900000000).toString();
    });

    const ticketRecord: any = {
      gameId: game?.id || 'slot_raffle',
      userId: user?.uid,
      name: data.name,
      phone: data.phone,
      address: data.address,
      ticketNumbers: newNumbers,
    };

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketRecord),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);
      
      const savedTicket = result.ticket;
      setLastPurchase(savedTicket);
      fetchTickets(); // Sync local state
      
      broadcastEvent('TICKET_BOUGHT', { ticket: savedTicket });

      toast({ title: "TICKETS SECURED", description: `You generated ${data.quantity} tickets.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "PURCHASE FAILED", description: e.message || "Error generating signatures." });
    }
  };

  const currentActiveWinningTicketStr = (isDrawing || winners.length === 0) 
     ? null 
     : winningNumbers[drawStep];

  const handleSpinEnd = useCallback(async () => {
    setIsDrawing(false);
    setShowWinnerSequence(true);

    const currentWinner = winners[drawStep];
    if (currentWinner) {
      try {
        const rank = (config.winners_count || 1) - drawStep;
        const prizeInfo = config.prizes?.find((p: any) => p.rank === rank) || { percentage: 0 };
        const totalPrizePool = allTicketNumbers.length * (config.ticket_price || 1);
        const winAmount = (totalPrizePool * (prizeInfo.percentage / 100)) || 0;

        await fetch('/api/admin/registry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: game?.id || 'default',
            userId: currentWinner.userId || null,
            username: currentWinner.name,
            ticketNumber: currentWinner.ticketNumbers[0],
            rank: rank,
            prizeAmount: winAmount
          })
        });
      } catch (e) {
        console.warn("Save err:", e);
      }
    }

    if (drawStep < (config.winners_count || 1) - 1) {
      setInterWinnerCountdown(300); // Wait 5 mins for next spin
    } else {
      // Game fully finalized, expire all tickets
      fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game?.id || 'slot_raffle', action: 'expire_all' })
      }).catch(console.error);
    }
  }, [winners, drawStep, config, allTicketNumbers.length, game?.id]);

  const skipTimer = () => {
    let nextStatus = systemStatus;
    let nextEventCount = eventCountdown;
    let nextPreCount = preGameCountdown;

    if (systemStatus === "buying") {
      nextEventCount = 0;
      nextStatus = "pre-game";
    } else if (systemStatus === "pre-game") {
      nextPreCount = 0;
    } else if (interWinnerCountdown !== null) {
      setInterWinnerCountdown(0);
    }

    broadcastEvent('TIMER_SYNC', {
      eventCountdown: nextEventCount,
      preGameCountdown: nextPreCount,
      status: nextStatus
    });

    if (systemStatus === "buying") setEventCountdown(0);
    else if (systemStatus === "pre-game") setPreGameCountdown(0);
    else if (interWinnerCountdown !== null) setInterWinnerCountdown(0);
  };

  const openDownloadDialog = (ticket: TicketData) => {
    setSelectedTicketForDownload(ticket);
    setIsDownloadDialogOpen(true);
  };

  const openDialogIfUser = (t: TicketData) => {
    setSelectedTicketForDownload(t);
    setIsDownloadDialogOpen(true);
  }

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-[#002d28] border border-white/5 p-1 rounded-2xl w-full grid grid-cols-2 mb-8">
              <TabsTrigger 
                value="buy" 
                disabled={systemStatus !== "buying"}
                className="font-black italic text-[11px] py-4 uppercase tracking-widest rounded-xl data-[state=active]:bg-[#001f1c] data-[state=active]:text-[#facc15] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <TicketIcon className="w-4 h-4 mr-2" /> GET TICKETS
              </TabsTrigger>
              <TabsTrigger 
                value="draw" 
                className="font-black italic text-[11px] py-4 uppercase tracking-widest rounded-xl data-[state=active]:bg-[#001f1c] data-[state=active]:text-[#facc15]"
              >
                <Play className="w-4 h-4 mr-2" /> LIVE DRAW
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
               {systemStatus === "buying" && (
                 <div className="bg-[#002d28] border border-white/5 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#facc15]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-[#facc15]/10 flex items-center justify-center border border-[#facc15]/20 shadow-inner">
                        <Timer className="w-7 h-7 text-[#facc15] animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7da09d] mb-0.5">Registration Window</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-3xl font-black italic text-white uppercase tracking-tighter">
                            {formatTime(eventCountdown)}
                          </p>
                          <span className="text-[10px] font-bold text-[#facc15] uppercase tracking-widest animate-pulse">Remaining</span>
                        </div>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <Button 
                        onClick={skipTimer}
                        variant="outline" 
                        className="relative z-10 h-14 border-white/10 bg-black/20 hover:bg-[#facc15] hover:text-black text-[#facc15] font-black italic uppercase text-xs tracking-widest px-8 rounded-2xl transition-all active:scale-95 group/btn"
                      >
                        <FastForward className="w-4 h-4 mr-2 group-hover/btn:translate-x-1 transition-transform" />
                        SKIP TO DRAW
                      </Button>
                    )}
                 </div>
               )}

               {user ? (
                 <TicketForm onSubmit={handlePurchase} ticketPrice={config.ticket_price} balance={profile?.balance || 0} />
               ) : (
                 <div className="bg-[#002d28] border border-white/5 rounded-3xl p-8 text-center space-y-4 shadow-xl">
                    <Trophy className="w-12 h-12 text-[#facc15] mx-auto opacity-50 mb-4" />
                    <h3 className="text-xl font-black italic uppercase text-white tracking-widest">Authentication Required</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#7da09d]">Please log in or register an account to secure your position in the grand draw.</p>
                    <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
                      <Link href="/login" className="w-full sm:w-auto">
                        <Button className="w-full bg-[#facc15] hover:bg-[#eab308] text-black font-black italic uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg">
                          Login
                        </Button>
                      </Link>
                      <Link href="/register" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full border-[#044e45] text-[#7da09d] hover:text-white font-black italic uppercase tracking-widest h-12 px-8 rounded-xl hover:bg-white/5">
                          Create Account
                        </Button>
                      </Link>
                    </div>
                 </div>
               )}
               
               {lastPurchase && (
                 <div className="animate-in zoom-in-95 duration-500">
                   <TicketVisual ticket={lastPurchase} />
                 </div>
               )}
            </TabsContent>

            <TabsContent value="draw" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="bg-[#002d28] border border-white/5 rounded-[40px] p-8 md:p-12 relative overflow-hidden flex flex-col items-center">
                  
                  <div className="text-center space-y-4 mb-10 relative z-20">
                    <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">
                       Grand <span className="text-[#facc15]">Selection Engine</span>
                    </h2>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#7da09d]">
                       Live Slot-Style Draw Sequence
                    </p>
                  </div>
                  
                  {/* CENTRAL SLOT ENGINE UI */}
                  <SlotReelEngine 
                    participants={allTicketNumbers}
                    spinning={isDrawing}
                    winningTicket={currentActiveWinningTicketStr}
                    onSpinEnd={handleSpinEnd}
                  />

                  <div className="mt-12 w-full flex flex-col items-center gap-4 relative z-20">
                    {systemStatus === "buying" ? (
                      <div className="flex flex-col items-center gap-3 bg-black/40 px-10 py-6 rounded-3xl border border-white/10 text-center">
                         <Clock className="w-10 h-10 text-[#7da09d] animate-pulse" />
                         <p className="text-sm font-bold text-white uppercase tracking-widest">Entries are still being accepted</p>
                          <p className="text-[10px] text-[#7da09d] max-w-[200px] leading-relaxed">
                            Engine auto-calibrates in {formatTime(eventCountdown)}.
                          </p>
                          {isAdmin && (
                            <Button 
                              onClick={skipTimer}
                              variant="outline" 
                              className="mt-4 h-11 border-white/10 bg-black/20 hover:bg-[#facc15] hover:text-black text-[#facc15] font-black italic uppercase text-[10px] tracking-widest px-6 rounded-xl transition-all active:scale-95 group/btn"
                            >
                              <FastForward className="w-3 h-3 mr-2 group-hover/btn:translate-x-1 transition-transform" />
                              SKIP TIMER
                            </Button>
                          )}
                       </div>
                    ) : systemStatus === "pre-game" ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-4 bg-[#facc15]/10 px-10 py-6 rounded-3xl border border-[#facc15]/30 shadow-[0_0_30px_rgba(250,204,21,0.2)]">
                          <Loader2 className="w-8 h-8 text-[#facc15] animate-spin" />
                          <div className="text-left">
                             <p className="text-2xl font-black italic text-[#facc15] uppercase tracking-tighter leading-none">
                                LAUNCHING IN {formatTime(preGameCountdown || 0)}
                             </p>
                             <p className="text-[9px] font-black text-[#facc15]/60 uppercase tracking-widest mt-1">
                                Calibrating RNG & Ticket Signatures
                             </p>
                          </div>
                        </div>
                      </div>
                    ) : isDrawing ? (
                      <div className="flex flex-col items-center gap-2 animate-in zoom-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3 bg-black/40 px-8 py-4 rounded-2xl border border-[#facc15]/30">
                          <RefreshCcw className="w-6 h-6 text-[#facc15] animate-spin" />
                          <span className="text-xl font-black italic text-[#facc15] uppercase tracking-tighter">
                            DRAWING {getRankSuffix((config.winners_count || 1) - drawStep)}...
                          </span>
                        </div>
                      </div>
                    ) : interWinnerCountdown !== null ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3 bg-black/40 px-8 py-4 rounded-2xl border border-emerald-500/30">
                          <Timer className="w-6 h-6 text-emerald-400 animate-pulse" />
                          <span className="text-xl font-black italic text-emerald-400 uppercase tracking-tighter">
                            NEXT DRAW IN {formatTime(interWinnerCountdown)}
                          </span>
                        </div>
                        {isAdmin && (
                           <Button onClick={skipTimer} variant="outline" className="text-[10px] h-8 font-black uppercase hover:bg-emerald-500 hover:text-black border-emerald-500/50 text-emerald-400 mt-2">
                              Skip Timer
                           </Button>
                        )}
                      </div>
                    ) : systemStatus === "finished" ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-3xl text-center space-y-2">
                         <Trophy className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                         <p className="text-xl font-black text-white italic uppercase">DRAW COMPLETE</p>
                         <p className="text-xs font-bold text-[#7da09d] uppercase tracking-widest">All rank positions have been resolved.</p>
                      </div>
                    ) : null}
                    
                    <p className="text-[10px] font-black text-[#7da09d] uppercase tracking-widest opacity-50 mt-4">
                      Total Ticket Signatures Intercepted: {allTicketNumbers.length}
                    </p>
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* SIDEBAR LOGS */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-[#002d28] border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-emerald-500/10 p-6 border-b border-white/5">
              <h3 className="text-sm font-black italic uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Final Standings
              </h3>
            </div>
            <CardContent className="p-0">
               <div className="divide-y divide-white/5">
                  {(() => {
                    const totalPrizePool = allTicketNumbers.length * (config.ticket_price || 1);
                    return Array.from({ length: config.winners_count || 1 }).map((_, i) => {
                      const rank = i + 1;
                      const prizeObj = config.prizes?.find((p: any) => p.rank === rank) || { percentage: 0 };
                      const prizeAmount = totalPrizePool * ((prizeObj.percentage || 0) / 100);
                      const stepIndex = (config.winners_count || 1) - rank;

                      let color = "text-white/40";
                      if (rank === 1) color = "text-[#facc15]";
                      else if (rank === 2) color = "text-white";
                      else if (rank === 3) color = "text-white/80";
                      else if (rank === 4) color = "text-white/60";

                      const winner = winners[stepIndex];
                      const isRevealed = winners.length > 0 && (drawStep > stepIndex || (drawStep === stepIndex && (showWinnerSequence || interWinnerCountdown !== null)));
                      const isDrawingCurrent = isDrawing && drawStep === stepIndex;

                      return { rank, prizeAmount, stepIndex, color, isRevealed, winner, isDrawingCurrent };
                    });
                  })().sort((a, b) => a.rank - b.rank).map((p, i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between">
                       <div className="flex flex-col">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${p.color}`}>{getRankSuffix(p.rank)}</span>
                          {p.isRevealed && p.winner ? (
                            <span className="text-sm font-bold text-white truncate max-w-[150px]">{p.winner.name}</span>
                          ) : p.isDrawingCurrent ? (
                            <span className="text-[10px] font-black text-emerald-400 animate-pulse uppercase">Drawing...</span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#7da09d] italic opacity-40">Pending Draw</span>
                          )}
                       </div>
                       <div className="text-right">
                          <span className={`text-lg font-black italic block ${p.color}`}>৳ {Math.round(p.prizeAmount).toLocaleString()}</span>
                          {p.isRevealed && p.winner && (
                            <span className="text-[9px] font-mono text-white/40">#{p.winner.ticketNumbers[0]}</span>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>

          {systemStatus !== "finished" && (
            <Card className="bg-[#002d28] border-white/5 rounded-3xl overflow-hidden text-white shadow-2xl relative group">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
               <div className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7da09d] flex items-center gap-2">
                       LIVE PARTICIPANTS
                       {isDrawing && <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(91,87,233,0.8)]" />}
                    </h3>
                  </div>
                  <div className="space-y-3">
                     {activeTickets.length === 0 ? (
                       <p className="text-xs font-bold text-white/20 uppercase italic py-8 text-center">Awaiting initial protocols...</p>
                     ) : (
                       activeTickets.slice(-5).reverse().map((t, i) => (
                         <div 
                          key={i} 
                          className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 hover:border-primary/30 transition-all group"
                          onClick={() => openDialogIfUser(t)}
                         >
                            <div>
                               <p className="text-xs font-black text-white">{t.name}</p>
                               <p className="text-[8px] font-bold text-[#7da09d] uppercase">Clusters: {t.ticketNumbers.length}</p>
                            </div>
                            <div className="text-right">
                               <span className="text-[9px] font-mono tracking-widest text-primary block">[{t.ticketNumbers[0].substring(0, 4)}...]</span>
                            </div>
                         </div>
                       ))
                     )}
                  </div>
               </div>
            </Card>
          )}
        </div>
      </div>

      <WinnerSequence 
        open={showWinnerSequence} 
        onOpenChange={setShowWinnerSequence} 
        winners={winners} 
        currentStep={drawStep}
        onNext={handleNextRequest}
        currentUserUid={user?.uid}
        prizes={[config.prize_5, config.prize_4, config.prize_3, config.prize_2, config.prize_1]}
        countdown={interWinnerCountdown}
      />

      <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
        <DialogContent className="sm:max-w-4xl bg-[#001f1c] border-white/10 text-white max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic uppercase text-[#facc15]">Your Secured Entry</DialogTitle>
            <DialogDescription className="text-[#7da09d] font-bold uppercase text-[10px] tracking-widest">
              Review and download your grand raffle ticket for verification
            </DialogDescription>
          </DialogHeader>
          {selectedTicketForDownload && (
            <div className="py-6">
              <TicketVisual ticket={selectedTicketForDownload} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
