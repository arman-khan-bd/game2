
'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Minus,
  Plus,
  Loader2,
  MoreHorizontal,
  HelpCircle,
  Menu
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useUser, useDoc, updateDoc, increment } from "@/firebase";
import { supabase } from "@/lib/supabase";
import Lottie from "lottie-react";
import { Switch } from "@/components/ui/switch";

interface Player {
  id: string;
  name: string;
  bet: number;
  targetMultiplier: number;
  cashedOutAt: number | null;
  status: "ready" | "playing";
  is_bot?: boolean;
}

interface GameHistory {
  multiplier: number;
}

const FALLBACK_NAMES = [
  "Urban Chimpanzee", "Surprised Damself", "Determined Rook", "Ordinary Mosquito", 
  "Iggie", "Robust Quail", "Suxrobjon", "Satisfied Rat", "Selected Reptile"
];

const PRESET_AMOUNTS = [100, 200, 500, 10000];
const ROCKET_LOTTIE_URL = "/rocket.json";

export const CrashGame = () => {
  const { user } = useUser();
  const { data: profile, isLoading: isProfileLoading } = useDoc(user ? `userProfiles/${user.uid}` : null);
  
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState<"waiting" | "running" | "crashed">("waiting");
  const [rocketAnimationData, setRocketAnimationData] = useState<any>(null);
  
  const [dbBots, setDbBots] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({
    min_bet: 1,
    max_bet: 50000,
    preset_bets: [100, 200, 500, 10000],
    auto_play_seconds: 5
  });

  // Panel 1 State
  const [betAmount1, setBetAmount1] = useState(10);
  const [isAutoTab1, setIsAutoTab1] = useState(false);
  const [isAutoBet1, setIsAutoBet1] = useState(false);
  const [isAutoCashoutEnabled1, setIsAutoCashoutEnabled1] = useState(false);
  const [autoCashout1, setAutoCashout1] = useState(2.0);
  const [isPlayerInRound1, setIsPlayerInRound1] = useState(false);
  const [hasCashedOut1, setHasCashedOut1] = useState(false);

  // Panel 2 State
  const [betAmount2, setBetAmount2] = useState(10);
  const [isAutoTab2, setIsAutoTab2] = useState(false);
  const [isAutoBet2, setIsAutoBet2] = useState(false);
  const [isAutoCashoutEnabled2, setIsAutoCashoutEnabled2] = useState(false);
  const [autoCashout2, setAutoCashout2] = useState(10.0);
  const [isPlayerInRound2, setIsPlayerInRound2] = useState(false);
  const [hasCashedOut2, setHasCashedOut2] = useState(false);

  const [history, setHistory] = useState<GameHistory[]>([
    { multiplier: 1.52 }, { multiplier: 3.20 }, { multiplier: 2.53 }, { multiplier: 1.20 },
    { multiplier: 1.24 }, { multiplier: 2.65 }, { multiplier: 5.17 }
  ]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [countdown, setCountdown] = useState(5);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const multiplierRef = useRef(1.0);
  const crashPointRef = useRef(1.0);
  
  const stateRef = useRef({
    isPlayerInRound1: false,
    isPlayerInRound2: false,
    hasCashedOut1: false,
    hasCashedOut2: false,
    isAutoCashoutEnabled1: false,
    isAutoCashoutEnabled2: false,
    isAutoBet1: false,
    isAutoBet2: false,
    autoCashout1: 2.0,
    autoCashout2: 10.0,
    betAmount1: 10,
    betAmount2: 10,
    profile: null as any,
    gameState: "waiting" as any,
    config: { auto_play_seconds: 5 }
  });

  useEffect(() => {
    stateRef.current = {
      isPlayerInRound1,
      isPlayerInRound2,
      hasCashedOut1,
      hasCashedOut2,
      isAutoCashoutEnabled1,
      isAutoCashoutEnabled2,
      isAutoBet1,
      isAutoBet2,
      autoCashout1, autoCashout2,
      betAmount1, betAmount2,
      profile,
      gameState,
      config
    };
  }, [isPlayerInRound1, isPlayerInRound2, hasCashedOut1, hasCashedOut2, isAutoCashoutEnabled1, isAutoCashoutEnabled2, isAutoBet1, isAutoBet2, autoCashout1, autoCashout2, betAmount1, betAmount2, profile, gameState, config]);

  const { toast } = useToast();

  useEffect(() => {
    fetch(ROCKET_LOTTIE_URL)
      .then(res => res.json())
      .then(data => setRocketAnimationData(data))
      .catch(err => console.error("Lottie fetch failed:", err));
  }, []);

  const logToHistory = async (playerName: string, isBot: boolean, bet: number, win: number) => {
    try {
      await supabase.from('game_history').insert({
        username: playerName,
        game_id: 'crash',
        bet_amount: bet,
        win_amount: win,
        is_bot: isBot,
        user_id: !isBot ? user?.uid : null
      });
    } catch (e) {
      console.warn('Logging fail:', e);
    }
  };

  const generateCrashPoint = (isRealUserIn: boolean) => {
    const rand = Math.random();
    if (rand < 0.10) return 1.0;
    if (rand < 0.50) return 1.01 + Math.random() * 0.99;
    if (rand < 0.85) return 2.0 + Math.random() * 5.0;
    return isRealUserIn ? 7.0 + Math.random() * 10.0 : 12.0 + Math.random() * 88.0;
  };

  const placeBet = async (panel: 1 | 2) => {
    const { gameState, profile, betAmount1, betAmount2, isPlayerInRound1, isPlayerInRound2 } = stateRef.current;
    
    if (panel === 1 && isPlayerInRound1) return;
    if (panel === 2 && isPlayerInRound2) return;

    if (gameState !== "waiting" || !profile || !user) return;
    
    const amount = panel === 1 ? betAmount1 : betAmount2;
    if (profile.balance < amount) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      if (panel === 1) setIsAutoBet1(false);
      if (panel === 2) setIsAutoBet2(false);
      return;
    }
    
    try {
      await updateDoc(`userProfiles/${user.uid}`, { 
        balance: increment(-amount),
        totalWagered: increment(amount) 
      });
      
      const userId = `user-panel-${panel}`;
      setPlayers(prev => prev.some(p => p.id === userId) ? prev : [{
        id: userId,
        name: profile.username || "YOU",
        bet: amount,
        targetMultiplier: 0,
        cashedOutAt: null,
        status: "ready",
        is_bot: false
      }, ...prev]);

      if (panel === 1) {
        setIsPlayerInRound1(true);
        setHasCashedOut1(false);
      } else {
        setIsPlayerInRound2(true);
        setHasCashedOut2(false);
      }
    } catch (e) {
      console.error("Bet placement error:", e);
    }
  };

  const cashOut = async (panel: 1 | 2, forceMult?: number) => {
    const { gameState, profile, isPlayerInRound1, isPlayerInRound2, hasCashedOut1, hasCashedOut2, betAmount1, betAmount2 } = stateRef.current;
    
    if (gameState !== "running" || !profile || !user) return;
    
    const isParticipating = panel === 1 ? isPlayerInRound1 : isPlayerInRound2;
    const isAlreadyCashed = panel === 1 ? hasCashedOut1 : hasCashedOut2;
    
    if (isAlreadyCashed || !isParticipating) return;

    const amount = panel === 1 ? betAmount1 : betAmount2;
    const currentMult = forceMult || multiplierRef.current;
    const win = Math.floor(amount * currentMult);
    
    try {
      await updateDoc(`userProfiles/${user.uid}`, { 
        balance: increment(win),
        totalWon: increment(win)
      });
      logToHistory(profile.username || "YOU", false, amount, win);
    } catch (e) {
      console.error("Cashout persistence error:", e);
    }

    if (panel === 1) setHasCashedOut1(true);
    else setHasCashedOut2(true);

    setPlayers(prev => prev.map(p => p.id === `user-panel-${panel}` ? { ...p, cashedOutAt: currentMult } : p));

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    toast({ title: "WIN!", description: `+৳${win} at ${currentMult.toFixed(2)}x` });
  };

  const startNextRound = useCallback(() => {
    const { isPlayerInRound1, isPlayerInRound2 } = stateRef.current;
    const isParticipating = isPlayerInRound1 || isPlayerInRound2;
    crashPointRef.current = generateCrashPoint(isParticipating);
    
    setPlayers(prev => prev.map(p => ({
      ...p,
      status: "playing",
      targetMultiplier: p.id.startsWith('user-panel') ? 0 : 1.1 + (Math.random() * (isParticipating ? 2.0 : 15.0))
    })));

    setMultiplier(1.0);
    multiplierRef.current = 1.0;
    setGameState("running");

    const startTime = Date.now();
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const { isPlayerInRound1, isPlayerInRound2, hasCashedOut1, hasCashedOut2, isAutoCashoutEnabled1, isAutoCashoutEnabled2, autoCashout1, autoCashout2 } = stateRef.current;
      
      const elapsed = (Date.now() - startTime) / 1000;
      const currentMult = Math.pow(1.06, elapsed);
      
      if (currentMult >= crashPointRef.current) {
        if (timerRef.current) clearInterval(timerRef.current);
        setGameState("crashed");
        setMultiplier(crashPointRef.current);
        setHistory(prev => [{ multiplier: crashPointRef.current }, ...prev].slice(0, 20));
        
        setPlayers(prev => {
          prev.forEach(p => {
            if (!p.cashedOutAt) {
              logToHistory(p.name, p.is_bot || false, p.bet, 0);
            }
          });
          return prev;
        });

        setIsPlayerInRound1(false);
        setHasCashedOut1(false);
        setIsPlayerInRound2(false);
        setHasCashedOut2(false);
        
        setTimeout(() => startCountdown(), 3000);
      } else {
        setMultiplier(currentMult);
        multiplierRef.current = currentMult;

        if (isPlayerInRound1 && !hasCashedOut1 && isAutoCashoutEnabled1 && currentMult >= autoCashout1) {
          cashOut(1, currentMult);
        }
        if (isPlayerInRound2 && !hasCashedOut2 && isAutoCashoutEnabled2 && currentMult >= autoCashout2) {
          cashOut(2, currentMult);
        }

        setPlayers(prev => prev.map(p => {
          if (!p.cashedOutAt && p.targetMultiplier > 0 && currentMult >= p.targetMultiplier && p.targetMultiplier < crashPointRef.current) {
            return { ...p, cashedOutAt: currentMult };
          }
          return p;
        }));
      }
    }, 50);
  }, []);

  const startCountdown = useCallback(() => {
    setGameState("waiting");
    stateRef.current.gameState = "waiting"; 
    
    const initialSeconds = 5;
    setCountdown(initialSeconds);
    setPlayers([]);

    // INSTANT AUTO-BET CHECK
    if (stateRef.current.isAutoBet1) placeBet(1);
    if (stateRef.current.isAutoBet2) placeBet(2);
    
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev > 1 && Math.random() > 0.3) {
          setPlayers(curr => {
            if (curr.length >= 30) return curr;
            const botSource = dbBots.length > 0 ? dbBots : FALLBACK_NAMES.map(n => ({ name: n }));
            const randomBot = botSource[Math.floor(Math.random() * botSource.length)];
            if (curr.some(p => p.name === randomBot.name)) return curr;

            return [...curr, {
              id: 'bot-' + Math.random().toString(36).substring(2, 9),
              name: randomBot.name,
              bet: 10 + Math.floor(Math.random() * 500),
              targetMultiplier: 0,
              cashedOutAt: null,
              status: "ready",
              is_bot: true
            }];
          });
        }

        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          startNextRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [dbBots, startNextRound]);

  useEffect(() => {
    async function initGameData() {
      try {
        const { data: gameData } = await supabase.from('games').select('*').eq('id', 'crash').maybeSingle();
        if (gameData) {
          setConfig(gameData);
        }

        const { data: botData } = await supabase
          .from('bots')
          .select('*')
          .eq('is_active', true);
        
        if (botData) setDbBots(botData);
      } catch (e) {}
    }
    initGameData();
    startCountdown();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Motion Math
  const visualProgress = (Math.log(multiplier) / Math.log(1.06)) / 30;
  const rocketX = 10 + (Math.min(1, visualProgress) * 70); 
  const rocketY = 15 + (Math.pow(Math.min(1, visualProgress), 1.2) * 60); 
  const currentSlope = 1.2 * Math.sqrt(Math.min(1, visualProgress) + 0.01);
  const dynamicRotation = 45 - (Math.atan(currentSlope) * (180 / Math.PI) * 0.4); 

  // PRECISION TAIL ALIGNMENT - Calculation ensures tail is anchored to rocket's exhaust
  const angleRad = (dynamicRotation - 30 + 180) * (Math.PI / 180);
  const tailRadius = 4.5; 
  const tailOffsetX = Math.cos(angleRad) * tailRadius; 
  const tailOffsetY = Math.sin(angleRad) * tailRadius;
  const trailStartX = rocketX + tailOffsetX;
  const trailStartY = (100 - rocketY) - tailOffsetY;

  if (isProfileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#141516]">
        <Loader2 className="w-12 h-12 animate-spin text-[#e11d48]" />
      </div>
    );
  }

  const getHistoryColor = (m: number) => {
    if (m >= 10) return "text-[#9b51e0] border-[#9b51e0]/20";
    if (m >= 2) return "text-[#34bfa3] border-[#34bfa3]/20";
    return "text-[#4682b4] border-[#4682b4]/20";
  };

  return (
    <div className="flex-1 flex flex-col h-screen select-none bg-[#141516] text-white font-sans overflow-hidden">
      {/* Aviator Top Bar */}
      <header className="h-14 bg-[#141516] border-b border-white/5 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black italic text-[#e11d48] tracking-tighter">Aviator</span>
          <Link href="/">
            <div className="bg-[#2c2d2e] rounded-full p-1 cursor-pointer">
               <ChevronLeft className="w-4 h-4 text-white/60" />
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <span className="text-sm font-black text-[#28a745]">{(profile?.balance || 0).toLocaleString()}.00 ৳</span>
          </div>
          <Menu className="w-6 h-6 text-white/60 cursor-pointer" />
        </div>
      </header>

      {/* History Row */}
      <div className="h-10 bg-[#1b1c1d] border-b border-white/5 flex items-center gap-2 px-4 overflow-x-auto scrollbar-hide z-40">
        {history.map((h, i) => (
          <div 
            key={i} 
            className={cn(
              "px-3 py-0.5 rounded-full bg-[#2c2d2e] border text-[11px] font-bold whitespace-nowrap",
              getHistoryColor(h.multiplier)
            )}
          >
            {h.multiplier.toFixed(2)}x
          </div>
        ))}
        <div className="ml-auto bg-[#2c2d2e] rounded-full p-1">
           <MoreHorizontal className="w-4 h-4 text-white/40" />
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar pb-20">
        {/* Main Canvas Area */}
        <div className="px-2 pt-2">
          <div className="relative aspect-[16/9] w-full bg-[#000] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,#1a1f35_0%,#000_100%)]" />
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
            </div>

            {/* Flight Layer */}
            <motion.div 
              animate={{ scale: 1 - (Math.min(1, visualProgress) * 0.4) }}
              className="absolute inset-0 z-10 origin-bottom-left"
            >
              {/* High-Fidelity Golden Plasma Tail */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <filter id="plasmaGlow">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <linearGradient id="exhaustFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#facc15" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* STRICT TAIL RENDERING CONDITION */}
                {gameState === "running" && multiplier > 1.01 && (
                  <g>
                    {/* Atmospheric Exhaust Area */}
                    <motion.path 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      d={`M 10 85 Q 40 85 ${trailStartX} ${trailStartY} L ${trailStartX} 85 L 10 85 Z`}
                      fill="url(#exhaustFill)"
                    />
                    {/* Glowing Core Tail */}
                    <motion.path 
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      d={`M 10 85 Q 40 85 ${trailStartX} ${trailStartY}`}
                      fill="none"
                      stroke="#facc15"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      filter="url(#plasmaGlow)"
                      transition={{ duration: 0.1 }}
                    />
                  </g>
                )}
              </svg>

              {/* Rocket/Plane */}
              <AnimatePresence>
                {gameState === "running" && (
                  <motion.div 
                    initial={{ bottom: "15%", left: "10%", opacity: 0 }}
                    animate={{ 
                      bottom: `${rocketY}%`, 
                      left: `${rocketX}%`,
                      rotate: dynamicRotation,
                      opacity: 1
                    }} 
                    className="absolute -translate-x-1/2 translate-y-1/2"
                  >
                    <div className="w-16 h-16 md:w-24 md:h-24">
                      {rocketAnimationData && (
                        <Lottie animationData={rocketAnimationData} loop className="w-full h-full -rotate-[30deg]" />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Multiplier Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              {gameState === "waiting" ? (
                <div className="text-center space-y-2">
                   <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Waiting for next round</div>
                   <div className="text-5xl font-black italic">{countdown}s</div>
                </div>
              ) : (
                <div className={cn(
                  "text-6xl md:text-8xl font-black italic tracking-tighter drop-shadow-2xl transition-colors",
                  gameState === "crashed" ? "text-[#e11d48]" : "text-white"
                )}>
                  {multiplier.toFixed(2)}x
                  {gameState === "crashed" && (
                    <div className="text-sm font-black uppercase text-[#e11d48]/60 mt-2 text-center tracking-widest">FLEW AWAY!</div>
                  )}
                </div>
              )}
            </div>

            {/* Live Players Overlay */}
            <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
               <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-5 h-5 rounded-full border border-black bg-[#2c2d2e] flex items-center justify-center overflow-hidden">
                       <img src={`https://picsum.photos/seed/${i + 10}/20/20`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
               </div>
               <span className="text-[10px] font-black text-white/80">{players.length + 224}</span>
            </div>
          </div>
        </div>

        {/* Dual Betting Panels */}
        <div className="px-2 py-4 space-y-4">
          {[1, 2].map(panelId => {
            const p = panelId as 1 | 2;
            const bet = p === 1 ? betAmount1 : betAmount2;
            const setBet = p === 1 ? setBetAmount1 : setBetAmount2;
            const isIn = p === 1 ? isPlayerInRound1 : isPlayerInRound2;
            const isCashed = p === 1 ? hasCashedOut1 : hasCashedOut2;
            const isAutoTab = p === 1 ? isAutoTab1 : isAutoTab2;
            const setIsAutoTab = p === 1 ? setIsAutoTab1 : setIsAutoTab2;
            
            const autoBet = p === 1 ? isAutoBet1 : isAutoBet2;
            const setAutoBet = (val: boolean) => {
              if (p === 1) {
                setIsAutoBet1(val);
                if (val && stateRef.current.gameState === "waiting" && !isPlayerInRound1) placeBet(1);
              } else {
                setIsAutoBet2(val);
                if (val && stateRef.current.gameState === "waiting" && !isPlayerInRound2) placeBet(2);
              }
            };
            const autoOutEnabled = p === 1 ? isAutoCashoutEnabled1 : isAutoCashoutEnabled2;
            const setAutoOutEnabled = p === 1 ? setIsAutoCashoutEnabled1 : setIsAutoCashoutEnabled2;
            const autoOutVal = p === 1 ? autoCashout1 : autoCashout2;
            const setAutoOutVal = p === 1 ? setAutoCashout1 : setAutoCashout2;

            return (
              <div key={p} className="bg-[#1b1c1d] rounded-2xl p-3 border border-white/5 shadow-lg flex flex-col gap-3">
                {/* Panel Tabs */}
                <div className="flex bg-[#141516] p-1 rounded-full w-48 mx-auto self-start">
                   <button 
                    onClick={() => setIsAutoTab(false)}
                    className={cn("flex-1 py-1 rounded-full text-[10px] font-black uppercase transition-all", !isAutoTab ? "bg-[#2c2d2e] text-white" : "text-white/40")}
                   >
                     Bet
                   </button>
                   <button 
                    onClick={() => setIsAutoTab(true)}
                    className={cn("flex-1 py-1 rounded-full text-[10px] font-black uppercase transition-all", isAutoTab ? "bg-[#2c2d2e] text-white" : "text-white/40")}
                   >
                     Auto
                   </button>
                </div>

                <div className="flex flex-col gap-3">
                  {isAutoTab && (
                    <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between bg-[#141516] p-2 rounded-xl border border-white/5 h-12">
                        <span className="text-[9px] font-black uppercase text-white/40 tracking-widest shrink-0">Auto Play</span>
                        <Switch checked={autoBet} onCheckedChange={setAutoBet} className="scale-[0.65]" />
                      </div>
                      <div className="flex items-center justify-between bg-[#141516] p-2 rounded-xl border border-white/5 h-12">
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Auto Out</span>
                          <Switch checked={autoOutEnabled} onCheckedChange={setAutoOutEnabled} className="scale-[0.65]" />
                        </div>
                        <div className="flex items-center gap-1 bg-[#2c2d2e] rounded-lg p-1 border border-white/5">
                          <button 
                            onClick={() => setAutoOutVal(Math.max(1.01, autoOutVal - 0.1))} 
                            className="w-5 h-5 flex items-center justify-center hover:bg-white/5 rounded"
                          >
                            <Minus className="w-2 h-2 text-white/40" />
                          </button>
                          <span className="text-[10px] font-black italic min-w-[24px] text-center">{autoOutVal.toFixed(2)}x</span>
                          <button 
                            onClick={() => setAutoOutVal(autoOutVal + 0.1)} 
                            className="w-5 h-5 flex items-center justify-center hover:bg-white/5 rounded"
                          >
                            <Plus className="w-2 h-2 text-white/40" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {/* Left Column: Controls */}
                    <div className="flex-1 space-y-2">
                      <div className="bg-[#141516] rounded-xl flex items-center justify-between p-1 px-2 h-12 border border-white/5">
                         <button onClick={() => setBet(Math.max(1, bet - 1))} className="w-8 h-8 rounded-full bg-[#2c2d2e] flex items-center justify-center text-white/60 hover:text-white"><Minus className="w-4 h-4" /></button>
                         <span className="text-lg font-black">{bet.toFixed(2)}</span>
                         <button onClick={() => setBet(bet + 1)} className="w-8 h-8 rounded-full bg-[#2c2d2e] flex items-center justify-center text-white/60 hover:text-white"><Plus className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         {PRESET_AMOUNTS.map(amt => (
                           <button 
                            key={amt} 
                            onClick={() => setBet(amt)}
                            className="h-8 rounded-lg bg-[#2c2d2e] text-[11px] font-bold text-white/60 hover:bg-[#3c3d3e] hover:text-white border border-white/5"
                           >
                             {amt}
                           </button>
                         ))}
                      </div>
                    </div>

                    {/* Right Column: Action Button */}
                    <div className="w-[45%]">
                      {gameState === "running" ? (
                        <Button 
                          onClick={() => cashOut(p)}
                          disabled={!isIn || isCashed}
                          className={cn(
                            "w-full h-full min-h-[100px] flex flex-col items-center justify-center rounded-2xl transition-all shadow-xl",
                            (!isIn || isCashed) 
                              ? "bg-[#2c2d2e] text-white/20" 
                              : "bg-[#eab308] hover:bg-[#ca8a04] text-black"
                          )}
                        >
                          {isCashed ? (
                            <div className="text-center">
                               <div className="text-xs font-bold uppercase opacity-60">Cashed Out</div>
                               <div className="text-lg font-black">৳ {(bet * (p === 1 ? autoCashout1 : autoCashout2)).toFixed(2)}</div>
                            </div>
                          ) : !isIn ? (
                            <span className="text-lg font-black italic uppercase">Watching</span>
                          ) : (
                            <div className="text-center">
                               <div className="text-sm font-black uppercase tracking-widest mb-1">CASH OUT</div>
                               <div className="text-xl font-black">{(bet * multiplier).toFixed(2)} ৳</div>
                            </div>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => placeBet(p)}
                          disabled={isIn || (profile?.balance || 0) < bet}
                          className={cn(
                            "w-full h-full min-h-[100px] flex flex-col items-center justify-center rounded-2xl transition-all shadow-xl",
                            isIn ? "bg-[#2c2d2e] text-white/40" : "bg-[#28a745] hover:bg-[#218838] text-white"
                          )}
                        >
                          <div className="text-center">
                             <div className="text-sm font-black uppercase tracking-widest mb-1">{isIn ? "READY" : "BET"}</div>
                             <div className="text-xl font-black">{bet.toFixed(2)} ৳</div>
                          </div>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Audit Tabbed Section */}
        <div className="px-2 mt-4 space-y-2">
           <div className="flex bg-[#1b1c1d] rounded-full p-1">
              <button className="flex-1 py-2 rounded-full bg-[#2c2d2e] text-[11px] font-black uppercase tracking-widest">All Bets</button>
              <button className="flex-1 py-2 rounded-full text-[11px] font-black uppercase tracking-widest text-white/40">Previous</button>
              <button className="flex-1 py-2 rounded-full text-[11px] font-black uppercase tracking-widest text-white/40">Top</button>
           </div>
           
           <div className="bg-[#1b1c1d] rounded-2xl p-4 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => <div key={i} className="w-4 h-4 rounded-full border border-black bg-white/10" />)}
                    </div>
                    <span className="text-[10px] font-bold text-white/40 uppercase">{players.length + 377}/427 Bets</span>
                 </div>
                 <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-white/40 tracking-widest">Total Win BDT</div>
                    <div className="text-sm font-black">56,489.11</div>
                 </div>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                 <div className="h-full bg-[#28a745] w-[80%]" />
              </div>
           </div>
        </div>
      </div>

      {/* Floating Help */}
      <div className="fixed right-4 bottom-24 z-50">
         <div className="w-10 h-10 rounded-full bg-[#2c2d2e] border border-white/10 flex items-center justify-center text-white/60 shadow-2xl">
            <HelpCircle className="w-5 h-5" />
         </div>
      </div>
    </div>
  );
};
