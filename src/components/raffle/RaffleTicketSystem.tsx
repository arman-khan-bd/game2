"use client";

import React, { useState, useCallback, useEffect } from "react";
import { TicketForm } from "./TicketForm";
import { TicketVisual } from "./TicketVisual";
import { RaffleBoard } from "./RaffleBoard";
import { WinnerSequence } from "./WinnerSequence";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Play, Ticket as TicketIcon, Trophy, Loader2, Timer, Download, FastForward, Clock } from "lucide-react";
import { useUser, addDoc, useCollection } from "@/firebase";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface TicketData {
  id: string;
  name: string;
  phone: string;
  address: string;
  ticketNumbers: string[];
  purchaseDate: string;
  userId?: string;
}

export const RaffleTicketSystem = () => {
  const { user } = useUser();
  const { toast } = useToast();
  
  const { data: storedTickets } = useCollection('raffleTickets');
  const [activeTickets, setActiveTickets] = useState<TicketData[]>([]);
  const [lastPurchase, setLastPurchase] = useState<TicketData | null>(null);
  const [config, setConfig] = useState<any>({
    prize_1: 100000, prize_2: 50000, prize_3: 25000, prize_4: 10000, prize_5: 5000
  });
  
  // System State
  const [activeTab, setActiveTab] = useState("buy");
  const [systemStatus, setSystemStatus] = useState<"buying" | "pre-game" | "drawing" | "finished">("buying");
  const [eventCountdown, setEventCountdown] = useState<number>(300); // 5 minutes main event
  const [preGameCountdown, setPreGameCountdown] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Drawing States
  const [winners, setWinners] = useState<TicketData[]>([]);
  const [winningNumbers, setWinningNumbers] = useState<string[]>([]);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState<number | null>(null);
  const [showWinnerSequence, setShowWinnerSequence] = useState(false);
  const [drawStep, setDrawStep] = useState(0); 
  const [interWinnerCountdown, setInterWinnerCountdown] = useState<number | null>(null);
  const [revealedPool, setRevealedPool] = useState<string[]>([]);

  // UI Dialog States
  const [selectedTicketForDownload, setSelectedTicketForDownload] = useState<TicketData | null>(null);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);

  const allTicketNumbers = activeTickets.flatMap(t => t.ticketNumbers);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const triggerNextSpin = useCallback((step: number, list: string[]) => {
    const winningTicket = list[step];
    const wheelIndex = allTicketNumbers.indexOf(winningTicket);
    
    setCurrentWinnerIndex(wheelIndex !== -1 ? wheelIndex : 0);
    setIsDrawing(true);
    setInterWinnerCountdown(null);
  }, [allTicketNumbers]);

  const handleNextRequest = useCallback(() => {
    setShowWinnerSequence(false);
    if (drawStep < 4) {
      const nextStep = drawStep + 1;
      setDrawStep(nextStep);
      setIsDrawing(false);
      setCurrentWinnerIndex(null);
      setInterWinnerCountdown(null);

      setTimeout(() => {
        triggerNextSpin(nextStep, winningNumbers);
      }, 500);
    } else {
      setSystemStatus("finished");
    }
  }, [drawStep, winningNumbers, triggerNextSpin]);

  const startDraw = useCallback(() => {
    if (allTicketNumbers.length < 5) {
      toast({
        variant: "destructive",
        title: "INSUFFICIENT POOL",
        description: "A minimum of 5 total tickets must be in the pool to start the grand draw."
      });
      return;
    }

    setSystemStatus("drawing");
    const pool = [...allTicketNumbers];
    const selectedWinningNumbers: string[] = [];
    const selectedWinningTickets: TicketData[] = [];

    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      const number = pool.splice(idx, 1)[0];
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
    
    setTimeout(() => {
      triggerNextSpin(0, selectedWinningNumbers);
    }, 100);
  }, [allTicketNumbers, activeTickets, toast, triggerNextSpin]);

  // Main Event Countdown Logic
  useEffect(() => {
    if (systemStatus !== "buying") return;
    
    if (eventCountdown <= 0) {
      setSystemStatus("pre-game");
      setActiveTab("draw");
      setPreGameCountdown(60); // Start 1 minute pre-game
      toast({
        title: "ENTRIES CLOSED",
        description: "The grand pool is now locked. Transitioning to live draw...",
      });
      return;
    }

    const timerId = setTimeout(() => setEventCountdown(eventCountdown - 1), 1000);
    return () => clearTimeout(timerId);
  }, [eventCountdown, systemStatus, toast]);

  // Pre-Game 1 Minute Countdown Logic - AUTOMATED START
  useEffect(() => {
    if (systemStatus !== "pre-game" || preGameCountdown === null) return;

    if (preGameCountdown <= 0) {
      setPreGameCountdown(null);
      // AUTO SPIN START
      startDraw();
      return;
    }

    const timerId = setTimeout(() => setPreGameCountdown(preGameCountdown - 1), 1000);
    return () => clearTimeout(timerId);
  }, [preGameCountdown, systemStatus, startDraw]);

  // Inter-winner 5 minute countdown
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

  // Live Ticket Adding Logic for the Wheel UI
  useEffect(() => {
    if (systemStatus === "pre-game") {
      setRevealedPool([]);
      const currentSnapshot = [...allTicketNumbers];
      const total = currentSnapshot.length;
      if (total === 0) return;

      let i = 0;
      const targetPopulationTime = 15000; 
      const intervalTime = Math.max(50, targetPopulationTime / total);

      const interval = setInterval(() => {
        if (i < total) {
          const ticketVal = currentSnapshot[i];
          if (ticketVal) {
            setRevealedPool(prev => [...prev, ticketVal]);
          }
          i++;
        } else {
          clearInterval(interval);
        }
      }, intervalTime);

      return () => clearInterval(interval);
    } else if (systemStatus === "drawing" || systemStatus === "finished") {
      setRevealedPool(allTicketNumbers);
    } else {
      setRevealedPool([]);
    }
  }, [systemStatus, allTicketNumbers.length]);

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase.from('raffle_config').select('*').maybeSingle();
      if (data) setConfig(data);
    }
    fetchConfig();
  }, []);

  useEffect(() => {
    if (storedTickets) {
      setActiveTickets(storedTickets as TicketData[]);
    }
  }, [storedTickets]);

  const handlePurchase = async (data: { name: string; phone: string; address: string; quantity: number }) => {
    if (systemStatus !== "buying") {
      toast({ variant: "destructive", title: "PURCHASE BLOCKED", description: "The grand pool is already closed for the draw." });
      return;
    }

    const newNumbers = Array.from({ length: data.quantity }).map(() => {
      return Math.floor(100000000000 + Math.random() * 900000000000).toString();
    });

    const ticketRecord: TicketData = {
      id: Math.random().toString(36).substring(2, 9),
      name: data.name,
      phone: data.phone,
      address: data.address,
      ticketNumbers: newNumbers,
      purchaseDate: new Date().toISOString(),
      userId: user?.uid
    };

    try {
      await addDoc('raffleTickets', { ...ticketRecord, userId: user?.uid });
      setLastPurchase(ticketRecord);
      
      toast({
        title: "TICKETS SECURED",
        description: `Successfully generated ${data.quantity} ticket numbers for ${data.name}.`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "PURCHASE FAILED",
        description: "System error during ticket encryption."
      });
    }
  };

  const handleSpinEnd = useCallback(async () => {
    setIsDrawing(false);
    setShowWinnerSequence(true);

    const currentWinner = winners[drawStep];
    if (currentWinner) {
      try {
        const prizeMap = [config.prize_5, config.prize_4, config.prize_3, config.prize_2, config.prize_1];
        await supabase.from('raffle_winners').insert({
          ticket_number: currentWinner.ticketNumbers[0],
          user_id: currentWinner.userId || null,
          username: currentWinner.name,
          rank: 5 - drawStep,
          prize_amount: prizeMap[drawStep] || 0
        });
      } catch (e) {
        console.warn("History save error:", e);
      }
    }

    if (drawStep < 4) {
      setInterWinnerCountdown(300); // 5 minutes between winners
    }
  }, [winners, drawStep, config]);

  const skipTimer = () => {
    if (systemStatus === "buying") setEventCountdown(0);
    else if (systemStatus === "pre-game") setPreGameCountdown(0);
    else if (interWinnerCountdown !== null) setInterWinnerCountdown(0);
  };

  const openDownloadDialog = (ticket: TicketData) => {
    setSelectedTicketForDownload(ticket);
    setIsDownloadDialogOpen(true);
  };

  return (
    <div className="space-y-8 pb-20">
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
                    
                    <Button 
                      onClick={skipTimer}
                      variant="outline" 
                      className="relative z-10 h-14 border-white/10 bg-black/20 hover:bg-[#facc15] hover:text-black text-[#facc15] font-black italic uppercase text-xs tracking-widest px-8 rounded-2xl transition-all active:scale-95 group/btn"
                    >
                      <FastForward className="w-4 h-4 mr-2 group-hover/btn:translate-x-1 transition-transform" />
                      SKIP TO DRAW
                    </Button>
                 </div>
               )}

               <TicketForm onSubmit={handlePurchase} />
               
               {lastPurchase && (
                 <div className="animate-in zoom-in-95 duration-500">
                   <TicketVisual ticket={lastPurchase} />
                 </div>
               )}
            </TabsContent>

            <TabsContent value="draw" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="bg-[#002d28] border border-white/5 rounded-[40px] p-8 md:p-12 relative overflow-hidden flex flex-col items-center">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Trophy className="w-20 h-20 text-[#facc15]" />
                  </div>
                  
                  <RaffleBoard 
                    participants={revealedPool} 
                    spinning={isDrawing} 
                    winnerIndex={currentWinnerIndex} 
                    onSpinEnd={handleSpinEnd}
                    duration={isDrawing ? 60 : 0} 
                  />

                  <div className="mt-12 w-full flex flex-col items-center gap-4">
                    {systemStatus === "buying" ? (
                      <div className="flex flex-col items-center gap-3 bg-black/40 px-10 py-6 rounded-3xl border border-white/10 text-center">
                         <Clock className="w-10 h-10 text-[#7da09d] animate-pulse" />
                         <p className="text-sm font-bold text-white uppercase tracking-widest">Entries are still being accepted</p>
                         <p className="text-[10px] text-[#7da09d] max-w-[200px] leading-relaxed">
                           The draw system will automatically initialize once the entry pool closes in {formatTime(eventCountdown)}.
                         </p>
                      </div>
                    ) : systemStatus === "pre-game" ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-4 bg-[#facc15]/10 px-10 py-6 rounded-3xl border border-[#facc15]/30">
                          <Loader2 className="w-8 h-8 text-[#facc15] animate-spin" />
                          <div className="text-left">
                             <p className="text-2xl font-black italic text-[#facc15] uppercase tracking-tighter leading-none">
                                {revealedPool.length < allTicketNumbers.length ? `INTEGRATING: ${revealedPool.length}` : `LAUNCHING IN ${formatTime(preGameCountdown || 0)}`}
                             </p>
                             <p className="text-[9px] font-black text-[#facc15]/60 uppercase tracking-widest mt-1">
                                {revealedPool.length < allTicketNumbers.length ? "Securing entries into the grand wheel..." : "Calibrating RNG & Ticket Signatures"}
                             </p>
                          </div>
                        </div>
                        {/* MANUAL BUTTON REMOVED FOR AUTO-START FLOW */}
                      </div>
                    ) : isDrawing ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3 bg-black/40 px-8 py-4 rounded-2xl border border-[#facc15]/30">
                          <Loader2 className="w-6 h-6 text-[#facc15] animate-spin" />
                          <span className="text-xl font-black italic text-[#facc15] uppercase tracking-tighter">
                            DRAWING {5 - drawStep}TH PLACE...
                          </span>
                        </div>
                        <p className="text-[10px] font-black text-[#7da09d] uppercase tracking-[0.3em] animate-pulse">
                          ESTIMATED TIME: 60 SECONDS
                        </p>
                      </div>
                    ) : interWinnerCountdown !== null ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3 bg-black/40 px-8 py-4 rounded-2xl border border-emerald-500/30">
                          <Timer className="w-6 h-6 text-emerald-400 animate-pulse" />
                          <span className="text-xl font-black italic text-emerald-400 uppercase tracking-tighter">
                            NEXT DRAW IN {formatTime(interWinnerCountdown)}
                          </span>
                        </div>
                        <p className="text-[10px] font-black text-[#7da09d] uppercase tracking-[0.3em]">
                          PREPARING {5 - (drawStep + 1)}TH PLACE REVEAL
                        </p>
                      </div>
                    ) : systemStatus === "finished" ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-3xl text-center space-y-2">
                         <Trophy className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                         <p className="text-xl font-black text-white italic uppercase">DRAW COMPLETE</p>
                         <p className="text-xs font-bold text-[#7da09d] uppercase tracking-widest">All 5 positions have been awarded.</p>
                      </div>
                    ) : null}
                    
                    <p className="text-[10px] font-black text-[#7da09d] uppercase tracking-widest opacity-50">
                      Total Tickets in Pool: {allTicketNumbers.length}
                    </p>
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-[#002d28] border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-emerald-500/10 p-6 border-b border-white/5">
              <h3 className="text-sm font-black italic uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Live Draw Results
              </h3>
            </div>
            <CardContent className="p-0">
               <div className="divide-y divide-white/5">
                  {[
                    { rank: "Grand Champion", prize: config.prize_1, color: "text-[#facc15]", stepIndex: 4 },
                    { rank: "2nd Place", prize: config.prize_2, color: "text-white", stepIndex: 3 },
                    { rank: "3rd Place", prize: config.prize_3, color: "text-white/80", stepIndex: 2 },
                    { rank: "4th Place", prize: config.prize_4, color: "text-white/60", stepIndex: 1 },
                    { rank: "5th Place", prize: config.prize_5, color: "text-white/40", stepIndex: 0 },
                  ].map((p, i) => {
                    const winner = winners[p.stepIndex];
                    const isRevealed = winners.length > 0 && (drawStep > p.stepIndex || (drawStep === p.stepIndex && (showWinnerSequence || interWinnerCountdown !== null)));
                    const isDrawingCurrent = isDrawing && drawStep === p.stepIndex;

                    return (
                      <div key={i} className="px-6 py-4 flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${p.color}`}>{p.rank}</span>
                            {isRevealed && winner ? (
                              <span className="text-sm font-bold text-white truncate max-w-[150px]">{winner.name}</span>
                            ) : isDrawingCurrent ? (
                              <span className="text-[10px] font-black text-emerald-400 animate-pulse uppercase">Drawing...</span>
                            ) : (
                              <span className="text-[10px] font-bold text-[#7da09d] italic opacity-40">Pending Draw</span>
                            )}
                         </div>
                         <div className="text-right">
                            <span className={`text-lg font-black italic block ${p.color}`}>৳ {p.prize.toLocaleString()}</span>
                            {isRevealed && winner && (
                              <span className="text-[9px] font-mono text-white/40">#{winner.ticketNumbers[0]}</span>
                            )}
                         </div>
                      </div>
                    );
                  })}
               </div>
            </CardContent>
          </Card>

          <Card className="bg-[#002d28] border-white/5 rounded-3xl overflow-hidden">
             <div className="p-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#7da09d] mb-4">Recent Participants</h3>
                <div className="space-y-3">
                   {activeTickets.length === 0 ? (
                     <p className="text-xs font-bold text-white/20 uppercase italic py-8 text-center">Waiting for entrants...</p>
                   ) : (
                     activeTickets.slice(-5).reverse().map((t, i) => (
                       <div 
                        key={i} 
                        className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition-all group"
                        onClick={() => openDownloadDialog(t)}
                       >
                          <div>
                            <p className="text-xs font-black text-white">{t.name}</p>
                            <p className="text-[8px] font-bold text-[#7da09d] uppercase">Qty: {t.ticketNumbers.length}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-[#facc15]">#{t.ticketNumbers[0].substring(0, 4)}...</span>
                            <Download className="w-3 h-3 text-white/20 group-hover:text-[#facc15] transition-colors" />
                          </div>
                       </div>
                     ))
                   )}
                </div>
             </div>
          </Card>
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
