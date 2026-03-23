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
  const rawGameInfo = await Game.findOne({ id: gameId }).lean();
  
  if (!rawGameInfo || !rawGameInfo.is_active) {
    return notFound();
  }

  // Serialize to plain JSON to satisfy Next.js Server->Client Component props rule
  const gameInfo = JSON.parse(JSON.stringify(rawGameInfo));

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

          <div className="mt-8 grid grid-cols-2 lg:grid-cols-6 gap-3">
             <div className="bg-[#002d28] border border-white/5 p-3 rounded-2xl flex flex-col justify-center shadow-lg relative overflow-hidden group hover:border-[#facc15]/50 transition-colors">
                <span className="text-[8px] font-black uppercase text-[#7da09d] tracking-widest mb-1 flex items-center justify-between">Ticket Price</span>
                <span className="text-2xl font-black italic text-[#facc15]">৳{gameInfo.ticket_price || 1}</span>
             </div>
             <div className="bg-[#002d28] border border-white/5 p-3 rounded-2xl flex flex-col justify-center shadow-lg hover:border-white/20 transition-colors">
                <span className="text-[8px] font-black uppercase text-[#7da09d] tracking-widest mb-1">Max Capacity</span>
                <span className="text-2xl font-black italic text-white">{gameInfo.total_tickets || 100} <span className="text-[10px] text-white/50 not-italic uppercase tracking-widest">TKS</span></span>
             </div>
             <div className="bg-[#002d28] border border-white/5 p-3 rounded-2xl flex flex-col justify-center shadow-lg hover:border-white/20 transition-colors">
                <span className="text-[8px] font-black uppercase text-[#7da09d] tracking-widest mb-1">Total Winners</span>
                <span className="text-2xl font-black italic text-white">{gameInfo.winners_count || 1} <span className="text-[10px] text-white/50 not-italic uppercase tracking-widest">WINNERS</span></span>
             </div>
             <div className="bg-[#002d28] border border-white/5 p-3 rounded-2xl flex flex-col justify-center shadow-lg hover:border-white/20 transition-colors">
                <span className="text-[8px] font-black uppercase text-[#7da09d] tracking-widest mb-1">Auto-Play Matrix</span>
                <span className="text-2xl font-black italic text-emerald-400">{gameInfo.auto_play_hours || 24} <span className="text-[10px] text-emerald-400/50 not-italic uppercase tracking-widest">HRS</span></span>
             </div>
             <div className="bg-[#002d28] border border-white/5 p-3 rounded-2xl flex flex-col justify-center shadow-lg hover:border-white/20 transition-colors">
                <span className="text-[8px] font-black uppercase text-[#7da09d] tracking-widest mb-1">Bot Network</span>
                <span className={`text-lg font-black italic uppercase ${gameInfo.is_bot_play ? 'text-blue-400' : 'text-white/30'}`}>{gameInfo.is_bot_play ? 'Engaged' : 'Offline'}</span>
             </div>
             <div className="bg-[#002d28] border border-[#facc15]/20 p-3 rounded-2xl flex flex-col justify-center shadow-[0_0_20px_rgba(250,204,21,0.05)] hover:border-[#facc15]/50 transition-colors">
                <span className="text-[8px] font-black uppercase text-[#facc15] tracking-widest mb-1">Prize Scaling Matrix</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-tight opacity-80 mt-1">Pool grows based on net ticket revenue</span>
             </div>
          </div>
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
