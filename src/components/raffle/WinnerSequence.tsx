
"use client";

import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, Share2, Sparkles, PartyPopper, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TicketData } from "./RaffleTicketSystem";

interface WinnerSequenceProps {
  winners: TicketData[]; 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStep: number;
  onNext: () => void;
  currentUserUid?: string;
  prizes?: number[];
  countdown: number | null;
}

export const WinnerSequence: React.FC<WinnerSequenceProps> = ({
  winners,
  open,
  onOpenChange,
  currentStep,
  onNext,
  currentUserUid,
  prizes = [5000, 10000, 25000, 50000, 100000],
  countdown,
}) => {
  const steps = ["5th Place", "4th Place", "3rd Place", "2nd Place", "Grand Champion"];

  useEffect(() => {
    if (open && winners[currentStep]) {
      triggerCelebration(currentStep);
    }
  }, [open, currentStep, winners]);

  const triggerCelebration = (step: number) => {
    const isGrand = step === 4;
    // @ts-ignore - confetti is globally available via canvas-confetti
    import('canvas-confetti').then((confetti) => {
      confetti.default({
        particleCount: isGrand ? 300 : 100,
        spread: isGrand ? 160 : 70,
        origin: { y: 0.6 },
        colors: isGrand ? ["#facc15", "#ffffff", "#000000"] : ["#10b981", "#ffffff"],
      });
    });
  };

  if (winners.length < 5) return null;

  const currentWinner = winners[currentStep];
  const isCurrentUserWinner = currentUserUid && currentWinner?.userId === currentUserUid;
  const prizeValue = prizes[currentStep] || 0;

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-[#001f1c] border-[#facc15]/30 shadow-[0_0_80px_rgba(250,204,21,0.2)] overflow-hidden text-white">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-[#facc15] to-emerald-500" />
        
        <DialogHeader className="sr-only">
          <DialogTitle>{steps[currentStep]} Winner Announcement</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="pt-10 pb-8 flex flex-col items-center text-center space-y-8"
          >
            <div className="relative">
              <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center border-2 ${currentStep === 4 ? 'bg-[#facc15]/10 border-[#facc15] text-[#facc15]' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'}`}>
                <Trophy className={currentStep === 4 ? 'w-12 h-12 animate-bounce' : 'w-10 h-10'} />
              </div>
              <div className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">
                 Rank: {5 - currentStep}
              </div>
            </div>

            <div className="space-y-1">
              <h2 className={`text-4xl font-black italic uppercase tracking-tighter ${currentStep === 4 ? 'text-[#facc15]' : 'text-white'}`}>
                {steps[currentStep]}
              </h2>
              <p className="text-[10px] font-black text-[#7da09d] uppercase tracking-[0.4em]">Winning Ticket Announced</p>
            </div>

            <div className="relative group py-6 px-12 rounded-3xl bg-black/40 border border-white/5 overflow-hidden">
               <div className={`absolute inset-0 opacity-20 blur-2xl ${currentStep === 4 ? 'bg-[#facc15]' : 'bg-emerald-500'}`} />
               <span className={`text-4xl md:text-5xl font-mono font-black relative z-10 ${currentStep === 4 ? 'text-[#facc15]' : 'text-white'}`}>
                  #{currentWinner?.ticketNumbers[0]}
               </span>
            </div>

            <div className="flex flex-col items-center">
               <span className="text-[10px] font-black text-[#7da09d] uppercase mb-1">CASH PRIZE REWARD</span>
               <span className={`text-3xl font-black italic ${currentStep === 4 ? 'text-[#facc15]' : 'text-emerald-400'}`}>
                 ৳ {prizeValue.toLocaleString()}
               </span>
            </div>

            {isCurrentUserWinner && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-emerald-500/20 border border-emerald-500/40 p-6 rounded-[24px] space-y-2 animate-pulse"
              >
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                   <PartyPopper className="w-5 h-5" />
                   <span className="text-lg font-black italic uppercase tracking-tighter">CONGRATULATIONS!</span>
                </div>
                <p className="text-sm font-bold text-white leading-relaxed">
                  You won <span className="text-[#facc15]">৳ {prizeValue.toLocaleString()}</span>. 
                  <br />
                  <span className="text-[10px] font-black uppercase text-[#7da09d] tracking-widest mt-2 block">
                    Winning price will be added in your account after end this game.
                  </span>
                </p>
              </motion.div>
            )}

            <div className="flex flex-col gap-4 w-full max-w-sm items-center justify-center pt-4">
               {currentStep < 4 && countdown !== null && (
                 <div className="flex items-center gap-2 bg-white/5 px-6 py-3 rounded-full border border-white/10 text-emerald-400">
                    <Timer className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-black italic uppercase tracking-widest">
                      Next Draw In: {formatCountdown(countdown)}
                    </span>
                 </div>
               )}

               <div className="flex gap-3 w-full max-sm:flex-col">
                 {currentStep < 4 ? (
                   <Button 
                     onClick={onNext}
                     className="flex-1 h-14 rounded-2xl bg-white text-black font-black italic uppercase tracking-widest text-xs hover:bg-white/90"
                   >
                     SKIP WAIT <ArrowRight className="ml-2 w-4 h-4" />
                   </Button>
                 ) : (
                   <Button 
                    onClick={() => onOpenChange(false)}
                    variant="outline" 
                    className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 font-black text-xs italic uppercase tracking-widest"
                   >
                     CLOSE
                   </Button>
                 )}
                 <Button 
                  className="flex-1 h-14 rounded-2xl bg-[#facc15] hover:bg-yellow-400 text-black font-black text-xs italic uppercase tracking-widest"
                 >
                   <Share2 className="mr-2 w-4 h-4" /> SHARE
                 </Button>
               </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
