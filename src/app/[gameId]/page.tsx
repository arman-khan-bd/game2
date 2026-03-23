import { notFound } from 'next/navigation';
import Image from 'next/image';
import connectMongo from '@/lib/mongodb';
import Game from '@/models/Game';
import Ticket from '@/models/Ticket';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { RaffleTicketSystem } from '@/components/raffle/RaffleTicketSystem';
import { SlotRaffleGame } from '@/components/raffle/SlotRaffleGame';
import { SlotMachine } from '@/components/slots/SlotMachine';
import { Trophy, Users, Ticket as TicketIcon, Zap, Wallet } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DynamicGameRoute({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;

  try {
    await connectMongo();
    
    // Find the exact game by URL parameter (id acts as the URL slug)
    const rawGameInfo = await Game.findOne({ id: gameId }).lean();
    
    if (!rawGameInfo || !rawGameInfo.is_active) {
      return notFound();
    }

    // Fetch ticket stats for this specific game
    const ticketStats = await Ticket.aggregate([
      { $match: { gameId: gameId, status: 'active' } },
      { $unwind: "$ticketNumbers" },
      { $group: { 
          _id: "$gameId", 
          sold: { $sum: 1 }, 
          uniqueBuyers: { $addToSet: "$userId" } 
      }}
    ]);

    const stats = ticketStats[0] || { sold: 0, uniqueBuyers: [] };
    
    // Serialize to plain JSON to satisfy Next.js Server->Client Component props rule
    const gameInfo = {
      ...JSON.parse(JSON.stringify(rawGameInfo)),
      soldTickets: stats.sold || 0,
      buyersCount: stats.uniqueBuyers?.length || 0
    };

    const totalPrizePool = gameInfo.soldTickets * (gameInfo.ticket_price || 1);

    return (
      <main className="min-h-screen bg-[#001f1c] text-white flex flex-col pb-24">
        <Header />
        
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          
          {/* Enhanced Game Header with Photo */}
          <div className="mb-12 flex flex-col md:flex-row gap-8 items-start">
            <div className="relative w-full md:w-72 aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 shrink-0 group">
              <Image 
                src={gameInfo.photo_url || `https://picsum.photos/seed/${gameInfo.id}/400/600`}
                alt={gameInfo.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="bg-[#facc15] text-black text-[10px] font-black px-3 py-1.5 rounded-lg uppercase italic shadow-2xl border border-white/20">
                  {gameInfo.game_type?.replace('_', ' ') || 'Raffle'}
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center h-full pt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-1 w-12 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Database Synchronized</span>
              </div>
              
              <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none mb-4">
                {gameInfo.name}
              </h1>
              
              <p className="text-sm md:text-base font-bold text-[#7da09d] uppercase tracking-widest leading-relaxed max-w-3xl">
                {gameInfo.instructions || "Welcome to the game engine. Secure your entries and monitor the live sequence for results."}
              </p>

              <div className="mt-10 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                 <div className="bg-[#002d28] border border-white/5 p-4 rounded-2xl flex flex-col justify-center shadow-lg group hover:border-[#facc15]/50 transition-all">
                    <span className="text-[8px] font-black uppercase text-[#7da09d] tracking-widest mb-1 flex items-center gap-1.5"><Wallet className="w-3 h-3 text-[#facc15]" /> Price</span>
                    <span className="text-2xl font-black italic text-[#facc15]">৳{gameInfo.ticket_price || 1}</span>
                 </div>
                 <div className="bg-[#002d28] border border-white/5 p-4 rounded-2xl flex flex-col justify-center shadow-lg hover:border-white/20 transition-all">
                    <span className="text-[8px] font-black uppercase text-[#7da09d] tracking-widest mb-1 flex items-center gap-1.5"><TicketIcon className="w-3 h-3 text-white/50" /> Sold</span>
                    <span className="text-2xl font-black italic text-white">{gameInfo.soldTickets} <span className="text-[10px] text-white/50 not-italic uppercase tracking-widest">/ {gameInfo.total_tickets || 100}</span></span>
                 </div>
                 <div className="bg-[#002d28] border border-white/5 p-4 rounded-2xl flex flex-col justify-center shadow-lg hover:border-white/20 transition-all">
                    <span className="text-[8px] font-black uppercase text-[#7da09d] tracking-widest mb-1 flex items-center gap-1.5"><Users className="w-3 h-3 text-blue-400/50" /> Buyers</span>
                    <span className="text-2xl font-black italic text-blue-400">{gameInfo.buyersCount}</span>
                 </div>
                 <div className="bg-[#002d28] border border-white/5 p-4 rounded-2xl flex flex-col justify-center shadow-lg hover:border-white/20 transition-all">
                    <span className="text-[8px] font-black uppercase text-[#7da09d] tracking-widest mb-1 flex items-center gap-1.5"><Trophy className="w-3 h-3 text-emerald-400/50" /> Winners</span>
                    <span className="text-2xl font-black italic text-emerald-400">{gameInfo.winners_count || 1} <span className="text-[10px] text-emerald-400/50 not-italic uppercase tracking-widest">Slots</span></span>
                 </div>
                 <div className="bg-[#002d28] border border-white/5 p-4 rounded-2xl flex flex-col justify-center shadow-lg hover:border-white/20 transition-all">
                    <span className="text-[8px] font-black uppercase text-[#7da09d] tracking-widest mb-1 flex items-center gap-1.5"><Zap className="w-3 h-3 text-[#facc15]/50" /> Pool</span>
                    <span className="text-2xl font-black italic text-[#facc15]">৳{totalPrizePool.toLocaleString()}</span>
                 </div>
                 <div className="bg-[#002d28] border border-[#facc15]/20 p-4 rounded-2xl flex flex-col justify-center shadow-[0_0_20px_rgba(250,204,21,0.05)] hover:border-[#facc15]/50 transition-all">
                    <span className="text-[8px] font-black uppercase text-[#7da09d] tracking-widest mb-1">Bot Network</span>
                    <span className={`text-lg font-black italic uppercase ${gameInfo.is_bot_play ? 'text-blue-400' : 'text-white/30'}`}>{gameInfo.is_bot_play ? 'Engaged' : 'Offline'}</span>
                 </div>
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
             <div className="flex flex-col items-center justify-center p-20 border border-red-500/20 bg-red-500/5 rounded-[40px] text-center">
               <span className="text-red-500 font-black uppercase tracking-[0.3em] text-xl mb-2 italic">SYSTEM ARCHITECTURE ERROR</span>
               <span className="text-red-400 opacity-60 text-[10px] font-bold uppercase tracking-widest">Invalid game engine signature detected in database.</span>
             </div>
          )}
        </div>

        <BottomNav />
      </main>
    );
  } catch (error) {
    console.error("Game Page Error:", error);
    return notFound();
  }
}

