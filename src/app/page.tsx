
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import Image from "next/image";
import { 
  Plus, 
  ArrowRightLeft, 
  Flame, 
  Heart, 
  Gamepad2, 
  ChevronRight, 
  ChevronLeft,
  Star,
  Users,
  Trophy,
  Share2,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import connectMongo from "@/lib/mongodb";
import Game from "@/models/Game";
import { BottomNav } from "@/components/layout/BottomNav";
import Ticket from "@/models/Ticket";

export const dynamic = 'force-dynamic';

export default async function Home() {
  let dbGames: any[] = [];
  try {
    await connectMongo();
    
    const games = await Game.find({ is_active: true }).sort({ name: 1 }).lean();
    
    // Aggregation to count total tickets sold per game
    const ticketStats = await Ticket.aggregate([
      { $unwind: "$ticketNumbers" },
      { $group: { _id: "$gameId", sold: { $sum: 1 }, uniqueBuyers: { $addToSet: "$userId" } } }
    ]);

    const statsMap = ticketStats.reduce((acc: any, curr: any) => {
      acc[curr._id] = { sold: curr.sold, buyersCount: curr.uniqueBuyers.length };
      return acc;
    }, {});
    
    // Serialize MongoDB specific objects for Next.js Server Components
    dbGames = games.map((g: any) => {
      const stats = statsMap[g._id.toString()] || { sold: 0, buyersCount: 0 };
      return {
        ...g,
        id: g.id || g._id.toString(),
        _id: g._id.toString(),
        soldTickets: stats.sold,
        buyersCount: stats.buyersCount,
        createdAt: g.createdAt ? g.createdAt.toString() : null,
        updatedAt: g.updatedAt ? g.updatedAt.toString() : null
      };
    });
  } catch (e) {
    console.error("Failed to fetch games:", e);
  }

  return (
    <main className="min-h-screen bg-[#001f1c] text-white flex flex-col pb-24">
      <Header />
      
      {/* Hero Banner Area */}
      <div className="px-4 py-4">
        <div className="relative h-48 w-full rounded-2xl overflow-hidden shadow-2xl">
          <Image 
            src="https://picsum.photos/seed/casino_hero/1200/600"
            alt="Promotion"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#001f1c]/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-1.5">
             {[1,2,3,4,5,6,7].map(i => (
               <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'bg-white' : 'bg-white/30'}`} />
             ))}
          </div>
        </div>
      </div>

      {/* Quick Action Pill Buttons */}
      <div className="px-4 grid grid-cols-2 gap-4 mb-6">
        <Link href="/deposit">
          <Button className="w-full h-14 rounded-xl bg-gradient-to-r from-[#14423b] to-[#044e45] border border-white/5 flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] transition-transform">
             <div className="bg-[#facc15] rounded-lg p-1">
                <Plus className="w-4 h-4 text-black" />
             </div>
             <span className="font-black italic uppercase tracking-tighter text-sm">Deposit</span>
          </Button>
        </Link>
        <Link href="/withdraw">
          <Button className="w-full h-14 rounded-xl bg-gradient-to-r from-[#14423b] to-[#044e45] border border-white/5 flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] transition-transform">
             <div className="bg-[#facc15] rounded-lg p-1">
                <ArrowRightLeft className="w-4 h-4 text-black" />
             </div>
             <span className="font-black italic uppercase tracking-tighter text-sm">Withdraw</span>
          </Button>
        </Link>
      </div>

      {/* Category Horizontal Scroll */}
      <div className="flex items-center gap-2 px-4 overflow-x-auto scrollbar-hide pb-2 mb-8">
        {[
          { icon: Flame, label: 'Hot Games' },
          { icon: Heart, label: 'Favorites' },
          { icon: Gamepad2, label: 'Slots' },
          { icon: Trophy, label: 'Jackpots' }
        ].map((cat, i) => (
          <button key={i} className={`flex items-center gap-2 px-5 py-3 rounded-xl border whitespace-nowrap font-black italic uppercase text-[10px] tracking-tight transition-all ${i === 0 ? 'bg-[#044e45] border-[#065f46] text-[#facc15]' : 'bg-[#002d28] border-white/5 text-[#7da09d]'}`}>
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Section Header */}
      <div className="px-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black italic tracking-tighter uppercase text-emerald-400">Hot Games</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="bg-[#002d28] text-[#facc15] h-8 px-4 text-[10px] font-black uppercase rounded-lg">See All</Button>
          <div className="flex gap-1.5">
             <button className="w-8 h-8 rounded-lg bg-[#002d28] flex items-center justify-center border border-white/5"><ChevronLeft className="w-4 h-4 text-white/40" /></button>
             <button className="w-8 h-8 rounded-lg bg-[#002d28] flex items-center justify-center border border-white/5"><ChevronRight className="w-4 h-4 text-white" /></button>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {dbGames.length === 0 ? (
          <div className="col-span-full py-12 text-center text-white/20 uppercase font-black text-xs tracking-[0.2em] italic">Initializing Engine...</div>
        ) : (
          dbGames.map((game) => (
            <Link key={game.id} href={`/${game.id}`}>
              <div className="group relative rounded-2xl overflow-hidden bg-[#002d28] border border-white/5 shadow-xl aspect-[3/4] flex flex-col">
                <div className="relative flex-1">
                  <Image 
                    src={game.photo_url || `https://picsum.photos/seed/${game.id}/400/600`}
                    alt={game.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Real-time Data Badges */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 rounded text-[8px] font-black italic uppercase shadow-lg border border-red-400/50">
                    POOL: ৳{((game.ticket_price || 0) * (game.total_tickets || 0)).toLocaleString()}
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                     <span className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-[#facc15] shadow-lg border border-white/10 uppercase">
                       {game.soldTickets} / {game.total_tickets} TIX
                     </span>
                     <span className="bg-emerald-500/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-white shadow-lg uppercase border border-emerald-400">
                       {game.buyersCount} BUYERS
                     </span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-t from-black via-black/90 to-transparent absolute bottom-0 left-0 right-0 pt-6">
                   <p className="text-xs font-black italic uppercase tracking-tighter text-white truncate">{game.name}</p>
                   <div className="flex items-center justify-between mt-1">
                     <p className="text-[9px] font-bold text-[#7da09d] uppercase">TICKET PRICE</p>
                     <p className="text-[10px] font-black text-[#facc15] italic">৳ {(game.ticket_price || 1).toLocaleString()}</p>
                   </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed right-4 bottom-28 flex flex-col gap-3 z-40">
         <button className="w-12 h-12 rounded-full bg-emerald-500 shadow-xl flex items-center justify-center border border-white/20"><Share2 className="w-6 h-6 text-white" /></button>
         <button className="w-12 h-12 rounded-full bg-blue-600 shadow-xl flex items-center justify-center border border-white/20"><Users className="w-6 h-6 text-white" /></button>
         <button className="w-12 h-12 rounded-full bg-red-500 shadow-xl flex items-center justify-center border border-white/20 animate-bounce"><Gift className="w-6 h-6 text-white" /></button>
      </div>

      <BottomNav />
    </main>
  );
}
