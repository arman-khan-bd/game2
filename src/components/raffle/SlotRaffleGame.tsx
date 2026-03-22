'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCcw, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useUser, useCollection } from '@/firebase';

export function SlotRaffleGame({ game }: { game: any }) {
  const { user } = useUser();
  const { data: storedTickets } = useCollection('raffleTickets');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [participants, setParticipants] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<any | null>(null);
  
  // Rapid iteration state for visual slot spinning
  const [currentIndex, setCurrentIndex] = useState(0);
  const spinSpeedRef = useRef(50); // ms per tick initially
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Verify if user is admin to show the 'Draw' button
    if (user) {
      fetch(`/api/profile?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data?.profile?.role === 'admin') setIsAdmin(true);
        })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (storedTickets && storedTickets.length > 0) {
      // Flatten all tickets into individual participant nodes
      const flattened: any[] = [];
      storedTickets.forEach((ticketRecord: any) => {
        if (ticketRecord.ticketNumbers) {
          ticketRecord.ticketNumbers.forEach((num: string) => {
            flattened.push({
              ticketNumber: num,
              ownerName: ticketRecord.name || ticketRecord.username || "Unknown Player",
              userId: ticketRecord.userId
            });
          });
        }
      });
      if (flattened.length > 0) {
        setParticipants(flattened);
        return;
      }
    }
    
    // Fallback pool if no players are registered yet
    setParticipants([
      { ticketNumber: '921135401', ownerName: 'Adam Jensen', userId: '1' },
      { ticketNumber: '102934812', ownerName: 'Sarah Connor', userId: '2' },
      { ticketNumber: '748291045', ownerName: 'Neo', userId: '3' },
      { ticketNumber: '445210982', ownerName: 'Trinity', userId: '4' },
      { ticketNumber: '612930219', ownerName: 'Morpheus', userId: '5' }
    ]);
  }, [storedTickets]);

  const drawWinner = () => {
    if (participants.length === 0 || isSpinning) return;
    
    setIsSpinning(true);
    setWinner(null);
    let spinsLeft = 40; // Total frames of spinning
    spinSpeedRef.current = 50;

    const tick = () => {
      setCurrentIndex((prev) => (prev + 1) % participants.length);
      spinsLeft--;

      // As spins run out, slow the speed down exponentially
      if (spinsLeft < 15) {
        spinSpeedRef.current += 30; // Friction
      }

      if (spinsLeft > 0) {
        timerRef.current = setTimeout(tick, spinSpeedRef.current);
      } else {
        // Stop spinning and select final winner randomly
        const finalWinnerIndex = Math.floor(Math.random() * participants.length);
        setCurrentIndex(finalWinnerIndex);
        setWinner(participants[finalWinnerIndex]);
        setIsSpinning(false);
      }
    };

    tick();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const currentlyShown = participants[currentIndex] || { ticketNumber: '88888888', ownerName: 'Awaiting' };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">
           Grand <span className="text-[#facc15]">Selection Engine</span>
        </h2>
        <p className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">
           Live Slot-Style Draw Sequence
        </p>
      </div>

      <Card className="bg-card/40 border-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden relative border-t-4 border-t-[#facc15]">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
        
        <CardContent className="pt-20 pb-20 px-8 relative flex flex-col items-center justify-center min-h-[400px]">
          
          {/* THE SLOT REEL WINDOW */}
          <div className="w-full max-w-lg h-32 bg-black/60 border-2 border-white/10 rounded-2xl shadow-[inset_0_0_50px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden relative">
             <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
             <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black via-black/80 to-transparent z-10" />
             
             {/* Scrolling Content */}
             <div className="w-full text-center transform transition-transform duration-75">
               <div className={`text-4xl md:text-7xl font-mono font-black uppercase tracking-[0.2em] transition-all duration-75 ${winner ? 'text-[#facc15] scale-110 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]' : 'text-white/80 scale-100 blur-[0.5px]'}`}>
                 {currentlyShown.ticketNumber}
               </div>
             </div>
             
             {/* Target Reticle */}
             <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xs border-x border-white/5 pointer-events-none" />
             <div className="absolute top-1/2 left-0 right-0 h-px bg-[#facc15]/30 pointer-events-none" />
          </div>

          {!winner && !isSpinning && (
            <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-[#facc15] animate-pulse">
              [ WAITING FOR ADMIN INITIATION ]
            </div>
          )}

          {isSpinning && (
            <div className="mt-8 flex items-center gap-2 text-primary font-black italic uppercase tracking-widest text-sm">
               <RefreshCcw className="w-4 h-4 animate-spin" /> EXECUTING ALGORITHM
            </div>
          )}

          {winner && (
            <div className="mt-12 text-center animate-in slide-in-from-bottom-4 zoom-in duration-500">
               <div className="w-16 h-16 rounded-full bg-[#facc15]/20 border border-[#facc15] flex items-center justify-center mx-auto mb-4 shadow-[0_0_50px_rgba(250,204,21,0.4)]">
                 <Trophy className="w-8 h-8 text-[#facc15]" />
               </div>
               <h3 className="text-xl font-black italic text-white uppercase tracking-widest mb-1">
                 Winning Ticket Drawn
               </h3>
               <p className="text-4xl font-mono font-black text-[#facc15] uppercase tracking-[0.2em] mb-4">
                 {winner.ticketNumber}
               </p>
               <p className="text-[10px] uppercase font-bold flex items-center justify-center gap-2 text-white/80 tracking-widest bg-white/5 rounded-full px-4 py-2 border border-white/10 w-fit mx-auto mt-2">
                 Ticket Owned By: <span className="text-[#facc15] font-black">{winner.ownerName}</span>
               </p>
            </div>
          )}

        </CardContent>
      </Card>

      {isAdmin ? (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={drawWinner} 
            disabled={isSpinning || participants.length === 0}
            className="h-16 px-16 text-lg font-black italic uppercase tracking-widest bg-[#facc15] text-black hover:bg-[#facc15]/90 hover:scale-105 transition-all shadow-[0_0_40px_rgba(250,204,21,0.3)] border-2 border-[#facc15]/50"
          >
            {isSpinning ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <Sparkles className="w-5 h-5 mr-3" />
                INITIATE DRAW SEQUENCE
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex justify-center pt-4">
           <div className="px-6 py-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
             <AlertCircle className="w-4 h-4 text-muted-foreground" />
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Only system administrators can initiate the draw sequence.</p>
           </div>
        </div>
      )}
    </div>
  );
}
