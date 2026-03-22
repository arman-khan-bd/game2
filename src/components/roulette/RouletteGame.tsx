
'use client';

import React, { useState, useCallback, useEffect } from "react";
import { RouletteWheel } from "./RouletteWheel";
import { RouletteBoard } from "./RouletteBoard";
import { Button } from "@/components/ui/button";
import { Coins, RotateCcw, Play, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase";
import { useUser, useDoc, updateDoc, increment } from "@/firebase";

export type BetType = "number" | "red" | "black" | "even" | "odd" | "1st12" | "2nd12" | "3rd12" | "1-18" | "19-36" | "col1" | "col2" | "col3";

export interface Bet {
  type: BetType;
  value: number | string;
  amount: number;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export const RouletteGame = () => {
  const { user } = useUser();
  const { data: profile } = useDoc(user ? `userProfiles/${user.uid}` : null);
  
  const [currentBets, setCurrentBets] = useState<Bet[]>([]);
  const [selectedChip, setSelectedChip] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [config, setConfig] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchConfig() {
      const { data, error } = await supabase.from('games').select('*').eq('id', 'roulette').single();
      if (!error && data) {
        setConfig(data);
        if (data.preset_bets?.length > 0) setSelectedChip(data.preset_bets[0]);
      }
    }
    fetchConfig();
  }, []);

  const handlePlaceBet = async (type: BetType, value: number | string) => {
    if (spinning || !profile || !user) return;
    
    if (profile.balance < selectedChip) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough credits for this bet.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateDoc(`userProfiles/${user.uid}`, { 
        balance: increment(-selectedChip),
        totalWagered: increment(selectedChip)
      });

      setCurrentBets(prev => {
        const existing = prev.find(b => b.type === type && b.value === value);
        if (existing) {
          return prev.map(b => b === existing ? { ...b, amount: b.amount + selectedChip } : b);
        }
        return [...prev, { type, value, amount: selectedChip }];
      });
    } catch (e) {
      console.error("Bet placement failed:", e);
    }
  };

  const handleClearBets = async () => {
    if (spinning || !profile || !user) return;
    const totalAmount = currentBets.reduce((sum, b) => sum + b.amount, 0);
    if (totalAmount === 0) return;
    
    try {
      await updateDoc(`userProfiles/${user.uid}`, { 
        balance: increment(totalAmount),
        totalWagered: increment(-totalAmount)
      });
      setCurrentBets([]);
    } catch (e) {
      console.error("Clearing bets failed:", e);
    }
  };

  const spin = () => {
    if (spinning || currentBets.length === 0) return;
    const result = Math.floor(Math.random() * 37);
    setWinner(result);
    setSpinning(true);
    setLastResult(null);
  };

  const handleSpinEnd = useCallback(async (result: number) => {
    setSpinning(false);
    setLastResult(result);
    
    let totalWin = 0;
    let totalBet = currentBets.reduce((sum, b) => sum + b.amount, 0);
    const isRed = RED_NUMBERS.includes(result);
    const isEven = result !== 0 && result % 2 === 0;
    const isOdd = result !== 0 && result % 2 !== 0;
    
    const col1 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
    const col2 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
    const col3 = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];

    currentBets.forEach(bet => {
      let won = false;
      let multiplier = 0;

      if (bet.type === "number" && bet.value === result) { won = true; multiplier = 36; }
      else if (bet.type === "red" && isRed) { won = true; multiplier = 2; }
      else if (bet.type === "black" && !isRed && result !== 0) { won = true; multiplier = 2; }
      else if (bet.type === "even" && isEven) { won = true; multiplier = 2; }
      else if (bet.type === "odd" && isOdd) { won = true; multiplier = 2; }
      else if (bet.type === "1st12" && result >= 1 && result <= 12) { won = true; multiplier = 3; }
      else if (bet.type === "2nd12" && result >= 13 && result <= 24) { won = true; multiplier = 3; }
      else if (bet.type === "3rd12" && result >= 25 && result <= 36) { won = true; multiplier = 3; }
      else if (bet.type === "1-18" && result >= 1 && result <= 18) { won = true; multiplier = 2; }
      else if (bet.type === "19-36" && result >= 19 && result <= 36) { won = true; multiplier = 2; }
      else if (bet.type === "col1" && col1.includes(result)) { won = true; multiplier = 3; }
      else if (bet.type === "col2" && col2.includes(result)) { won = true; multiplier = 3; }
      else if (bet.type === "col3" && col3.includes(result)) { won = true; multiplier = 3; }

      if (won) totalWin += bet.amount * multiplier * (config?.payout_multiplier || 1.0);
    });

    if (profile && user) {
      if (totalWin > 0) {
        await updateDoc(`userProfiles/${user.uid}`, { 
          balance: increment(totalWin),
          totalWon: increment(totalWin)
        });
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#facc15", "#ffffff", "#064e3b"] });
        toast({ title: "BIG WIN!", description: `You won ৳${totalWin.toLocaleString()}!` });
      } else {
        toast({ title: `Result: ${result}`, description: `Better luck next spin!` });
      }

      await supabase.from('game_history').insert({
        username: profile.username || 'YOU',
        game_id: 'roulette',
        bet_amount: totalBet,
        win_amount: totalWin,
        is_bot: false,
        user_id: user.uid
      });
    }
    setCurrentBets([]);
  }, [currentBets, profile, user, config, toast]);

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Powering Engine...</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4 space-y-6">
        <Card className="bg-black/20 border-white/10 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center">
            <RouletteWheel spinning={spinning} winner={winner} onAnimationComplete={handleSpinEnd} />
            <div className="mt-8 w-full space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-white/60 font-bold uppercase text-xs tracking-widest">Balance</span>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="text-2xl font-black">৳{(profile?.balance || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-white/60 font-bold uppercase text-xs tracking-widest">Active Bet</span>
                <span className="text-2xl font-black text-accent">৳{currentBets.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</span>
              </div>
              <Button onClick={spin} disabled={spinning || currentBets.length === 0} className="w-full h-16 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl shadow-lg">
                {spinning ? "ROULETTE SPINNING..." : "SPIN NOW"}
                <Play className="ml-2 w-6 h-6 fill-current" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center flex-wrap gap-3">
          {(config.preset_bets || [5, 10, 25, 50, 100]).map((val: number) => (
            <button key={val} onClick={() => setSelectedChip(val)} className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-black transition-all transform hover:scale-110 active:scale-95 ${selectedChip === val ? "border-yellow-400 bg-white text-black scale-110 shadow-xl" : "border-white/20 bg-black/40 text-white hover:border-white/40"}`}>
              {val}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold uppercase tracking-widest text-white/40">Betting Table</h2>
          <Button variant="ghost" onClick={handleClearBets} disabled={spinning || currentBets.length === 0} className="text-white/40 hover:text-white hover:bg-white/10">
            <RotateCcw className="mr-2 w-4 h-4" /> CLEAR TABLE
          </Button>
        </div>
        <RouletteBoard currentBets={currentBets} onPlaceBet={handlePlaceBet} disabled={spinning} />
      </div>
    </div>
  );
};
