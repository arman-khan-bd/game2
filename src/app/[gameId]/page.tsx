import { notFound } from 'next/navigation';
import connectMongo from '@/lib/mongodb';
import Game from '@/models/Game';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { RaffleTicketSystem } from '@/components/raffle/RaffleTicketSystem';
import { SlotRaffleGame } from '@/components/raffle/SlotRaffleGame';
import { SlotMachine } from '@/components/slots/SlotMachine';

export const dynamic = 'force-dynamic';

export default async function DynamicGameRoute({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;

  await connectMongo();
  
  // Find the exact game by URL parameter (id acts as the URL slug)
  const gameInfo = await Game.findOne({ id: gameId }).lean();
  
  if (!gameInfo || !gameInfo.is_active) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-[#001f1c] text-white flex flex-col pb-24">
      <Header />
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-emerald-400">
            {gameInfo.name}
          </h1>
          <p className="text-sm font-bold text-[#7da09d] uppercase tracking-widest mt-2 max-w-2xl">
            {gameInfo.instructions || "Welcome to the game. Place your bets and wait for the system to finalize the sequence."}
          </p>
        </div>

        {/* Dynamic Engine Router based on game_type */}
        {gameInfo.game_type === 'raffle' && (
          <RaffleTicketSystem game={gameInfo} />
        )}

        {gameInfo.game_type === 'slot_raffle' && (
          <SlotRaffleGame game={gameInfo} />
        )}
        
        {gameInfo.game_type === 'slots' && (
          <SlotMachine gameId={gameInfo.id} />
        )}
        
        {(!gameInfo.game_type || (gameInfo.game_type !== 'raffle' && gameInfo.game_type !== 'slots' && gameInfo.game_type !== 'slot_raffle')) && (
           <div className="flex flex-col items-center justify-center p-20 border border-red-500/20 bg-red-500/5 rounded-3xl text-center">
             <span className="text-red-500 font-black uppercase tracking-widest text-xl mb-2">SYSTEM ERROR</span>
             <span className="text-red-400 opacity-80 text-xs font-bold uppercase">Invalid architecture signature detected.</span>
           </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
