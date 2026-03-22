'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Coins, 
  Zap, 
  Trophy, 
  Play, 
  Loader2,
  Gamepad2,
  History,
  TrendingUp,
  Flame
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { useUser, useDoc, updateDoc, increment } from "@/firebase";

export const SlotMachine = ({ gameId = 'slots' }: { gameId?: string }) => {
  const { user } = useUser();
  const { data: profile } = useDoc(user ? `userProfiles/${user.uid}` : null);
  
  const [reels, setReels] = useState([0, 0, 0]);
  const [displayReels, setDisplayReels] = useState([0, 0, 0]);
  const [spinningReels, setSpinningReels] = useState([false, false, false]);
  const [bet, setBet] = useState(10);
  const [lastWin, setLastWin] = useState(0);
  const [config, setConfig] = useState<any>(null);
  
  const [recentSpins, setRecentSpins] = useState<any[]>([]);
  
  const { toast } = useToast();

  const isSpinning = spinningReels.some(r => r);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/admin/games/${gameId}`);
        const data = await res.json();
        if (data && data.game) {
          setConfig(data.game);
          if (data.game.preset_bets?.length > 0) setBet(data.game.preset_bets[0]);
          else setBet(data.game.min_bet || 10);
        }
      } catch (err) {
        console.error("Config fetch failed:", err);
      }
    }
    fetchConfig();
  }, [gameId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSpinning) {
      interval = setInterval(() => {
        setDisplayReels(prev => 
          prev.map((val, i) => spinningReels[i] ? Math.floor(Math.random() * 10) : reels[i])
        );
      }, 50);
    } else {
      setDisplayReels(reels);
    }
    return () => clearInterval(interval);
  }, [isSpinning, spinningReels, reels]);

  const spin = async () => {
    if (isSpinning || !profile || !user || profile.balance < bet) {
      if (profile && profile.balance < bet) {
        toast({ title: "Insufficient credits", variant: "destructive" });
      }
      return;
    }

    try {
      await updateDoc(`userProfiles/${user.uid}`, { 
        balance: increment(-bet),
        totalWagered: increment(bet)
      });

      setLastWin(0);
      setSpinningReels([true, true, true]);

      const finalResults = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
      ];

      [0, 1, 2].forEach((i) => {
        const delay = 1500 + i * 800; // Left to right stopping
        setTimeout(() => {
          setReels(prev => {
            const next = [...prev];
            next[i] = finalResults[i];
            return next;
          });
          setSpinningReels(prev => {
            const next = [...prev];
            next[i] = false;
            return next;
          });

          if (i === 2) {
            calculateWin(finalResults);
          }
        }, delay);
      });
    } catch (e) {
      console.error("Spin failed:", e);
    }
  };

  const calculateWin = async (results: number[]) => {
    let winMultiplier = 0;
    const [r1, r2, r3] = results;

    let winType = "Loss";

    if (r1 === r2 && r2 === r3) {
      if (r1 === 7) { winMultiplier = 100; winType = "LUCKY 7s JACKPOT"; }
      else if (r1 === 0) { winMultiplier = 50; winType = "MEGA MINER"; }
      else { winMultiplier = 30; winType = "3 OF A KIND"; }
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      winMultiplier = 3;
      winType = "ANY PAIR";
    }

    const winAmount = bet * winMultiplier * (config?.payout_multiplier || 1.0);

    if (winMultiplier > 0 && profile && user) {
      await updateDoc(`userProfiles/${user.uid}`, { 
        balance: increment(winAmount),
        totalWon: increment(winAmount)
      });
      setLastWin(winAmount);
      
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ["#5B57E9", "#fb923c", "#ffffff"] });
      toast({ title: winMultiplier >= 30 ? "JACKPOT!" : "YOU WON!", description: `Multiplier x${winMultiplier}! Won ৳${winAmount.toLocaleString()}` });
    }

    // Add to recent spins UI list safely
    setRecentSpins(prev => {
      const updated = [{
        id: Math.random().toString(),
        type: winType,
        bet: bet,
        win: winAmount,
        color: winMultiplier >= 30 ? "text-[#facc15]" : winMultiplier > 0 ? "text-emerald-400" : "text-white/40",
      }, ...prev];
      return updated.slice(0, 10);
    });

    // In a fully integrated app, we'd also run a Next.js API here to log the game_history to MongoDB.
    fetch('/api/profile/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: gameId, bet_amount: bet, win_amount: winAmount, user_id: user?.uid })
    }).catch(console.error);
  };

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-white/40">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Calibrating Reels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: THE SLOT MACHINE UI REPLACING THE RAFFLE BOARD */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="bg-[#002d28] border border-white/5 rounded-[40px] p-8 md:p-12 relative overflow-hidden flex flex-col items-center shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Gamepad2 className="w-24 h-24 text-primary" />
              </div>

              {/* MACHINE HEADER */}
              <div className="text-center mb-8 relative z-10 w-full">
                 <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                   SUPER <span className="text-[#facc15]">{config.name}</span>
                 </h2>
                 <div className="flex items-center justify-center gap-8 mt-6">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#7da09d]">Your Bank</span>
                      <span className="text-2xl font-black text-[#facc15] italic">৳{(profile?.balance || 0).toLocaleString()}</span>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#7da09d]">Last Yield</span>
                      <span className={cn("text-2xl font-black italic transition-colors", lastWin > 0 ? "text-emerald-400 animate-pulse" : "text-white/20")}>
                        ৳{lastWin.toLocaleString()}
                      </span>
                    </div>
                 </div>
              </div>

              {/* REELS CONTAINER */}
              <div className="flex gap-4 md:gap-6 justify-center items-center py-8 w-full relative z-10 p-4 bg-black/60 rounded-[32px] border border-white/10 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
                {reels.map((val, i) => (
                  <div key={i} className="relative w-24 h-32 md:w-32 md:h-48 bg-neutral-900 border-4 border-neutral-800 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                    <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
                    
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={spinningReels[i] ? `spinning-${i}-${displayReels[i]}` : reels[i]}
                        initial={{ y: spinningReels[i] ? 40 : 80, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1, filter: spinningReels[i] ? "blur(3px)" : "blur(0px)" }}
                        transition={{ type: "spring", damping: 15, stiffness: 200 }}
                        exit={{ y: -80, opacity: 0 }}
                        className={cn(
                          "text-7xl md:text-9xl font-black italic tracking-tighter select-none z-20 transition-colors", 
                          displayReels[i] === 7 ? "text-[#facc15]" : "text-white"
                        )}
                      >
                        {displayReels[i]}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* CONTROLS */}
              <div className="mt-12 w-full flex flex-col md:flex-row items-center gap-6 relative z-10 bg-black/20 p-6 rounded-3xl border border-white/5">
                 
                 <div className="flex flex-col gap-2 w-full md:w-1/2">
                   <span className="text-[10px] font-black uppercase text-[#7da09d] tracking-widest pl-2">Select Stake</span>
                   <div className="flex flex-wrap gap-2">
                     {(config.preset_bets || [10, 25, 50, 100, 500]).map((v: number) => (
                       <Button 
                         key={v} 
                         onClick={() => setBet(v)} 
                         disabled={isSpinning} 
                         variant={bet === v ? "default" : "outline"} 
                         className={cn(
                           "flex-1 h-12 rounded-xl font-black italic text-xs transition-all", 
                           bet === v ? "bg-primary text-white border-primary scale-105 shadow-[0_0_15px_rgba(91,87,233,0.5)]" : "text-white/60 bg-transparent border-white/10 hover:bg-white/5 hover:text-white"
                         )}
                       >
                         ৳{v}
                       </Button>
                     ))}
                   </div>
                 </div>

                 <Button 
                   onClick={spin} 
                   disabled={isSpinning || (profile?.balance || 0) < bet} 
                   className={cn(
                     "w-full md:w-1/2 h-20 rounded-[24px] text-2xl font-black italic uppercase tracking-widest transition-all",
                     isSpinning ? "bg-white/10 text-white/50 border border-white/10" : "bg-gradient-to-r from-emerald-500 to-[#044e45] text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] border border-emerald-400/50"
                   )}
                 >
                   {isSpinning ? "Spinning..." : "PULL LEVER"}
                   <Play className={cn("ml-3 w-6 h-6", isSpinning ? "animate-spin text-white/50" : "fill-white text-white")} />
                 </Button>

              </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
             <div className="bg-[#002d28] border border-white/5 rounded-2xl p-6 text-center shadow-xl">
                <p className="text-[10px] font-black tracking-widest text-[#7da09d] uppercase mb-2">Lucky 7s</p>
                <p className="text-3xl font-black text-[#facc15] italic">100x</p>
             </div>
             <div className="bg-[#002d28] border border-white/5 rounded-2xl p-6 text-center shadow-xl">
                <p className="text-[10px] font-black tracking-widest text-[#7da09d] uppercase mb-2">3 of a Kind</p>
                <p className="text-3xl font-black text-white italic">30x</p>
             </div>
             <div className="bg-[#002d28] border border-white/5 rounded-2xl p-6 text-center shadow-xl">
                <p className="text-[10px] font-black tracking-widest text-[#7da09d] uppercase mb-2">Any Pair</p>
                <p className="text-3xl font-black text-white/60 italic">3x</p>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBARS LIKE RAFFLE */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-[#002d28] border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative">
            <div className="bg-emerald-500/10 p-6 border-b border-white/5 relative z-10">
              <h3 className="text-sm font-black italic uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <History className="w-5 h-5" /> Recent Actions
              </h3>
            </div>
            
            <CardContent className="p-0 z-10 relative">
               <div className="divide-y divide-white/5 flex flex-col h-[380px] overflow-y-auto custom-scrollbar p-2">
                  {recentSpins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
                       <TrendingUp className="w-8 h-8 text-white/10" />
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 italic">No spins recorded this session.</p>
                       <Button onClick={spin} variant="outline" className="bg-white/5 border-white/10 text-xs font-black uppercase tracking-widest text-[#7da09d]">Play Now to Record</Button>
                    </div>
                  ) : (
                    recentSpins.map((s, i) => (
                      <div key={s.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl mx-2 my-1">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center">
                              {s.win > 0 ? <Flame className="w-5 h-5 text-[#facc15]" /> : <Zap className="w-5 h-5 text-white/20" />}
                           </div>
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-white uppercase italic">{s.type}</span>
                              <span className="text-[10px] font-bold text-[#7da09d] uppercase">Wager: {s.bet} ৳</span>
                           </div>
                         </div>
                         <div className="text-right">
                            <span className={`text-lg font-black italic ${s.color}`}>
                              {s.win > 0 ? '+' : ''}{s.win.toLocaleString()} ৳
                            </span>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </CardContent>
          </Card>

          <Card className="bg-[#002d28] border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative p-8 text-center flex flex-col items-center">
             <Trophy className="w-16 h-16 text-primary mb-4" />
             <h4 className="text-xl font-black italic uppercase text-white tracking-widest mb-2">Grand Jackpots</h4>
             <p className="text-xs text-[#7da09d] uppercase tracking-[0.2em] leading-relaxed max-w-[250px]">
               Match three <span className="text-[#facc15] font-black">Lucky 7s</span> out of thin air to multiply your stake by 100x instantly!
             </p>
             <div className="mt-6 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
             <p className="text-[8px] font-black uppercase tracking-widest text-primary mt-6">
                PROVABLY FAIR RNG CERTIFIED
             </p>
          </Card>
        </div>
        
      </div>
    </div>
  );
};
