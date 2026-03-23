import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Game from '@/models/Game';
import Ticket from '@/models/Ticket';
import Profile from '@/models/Profile';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: slugId } = await params;
    await connectMongo();

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugId);
    const query = isObjectId ? { $or: [{ id: slugId }, { _id: slugId }] } : { id: slugId };

    const game = await Game.findOne(query);
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    // 0. LOCKING LAYER: If draw has already started in the last 25 minutes, serve current results
    if (game.draw_started_at) {
        const timeSince = Date.now() - new Date(game.draw_started_at).getTime();
        if (timeSince < 25 * 60 * 1000) {
            return NextResponse.json({
                message: 'Recovery session active',
                winners: game.current_winners,
                winningNumbers: game.current_winning_numbers,
                draw_started_at: game.draw_started_at
            });
        }
    }

    // 1. Get all active tickets for this game
    const tickets = await Ticket.find({ gameId: game.id, status: 'active' }).lean();
    const allNumbers: string[] = tickets.flatMap((t: any) => t.ticketNumbers);

    if (allNumbers.length === 0) {
       return NextResponse.json({ error: 'No tickets in the pool' }, { status: 400 });
    }

    const winnerLimit = game.winners_count || 1;
    const pool = [...allNumbers];
    const selectedWinningNumbers: string[] = [];
    const selectedWinningTickets: any[] = [];

    // 2. Select winners (incorporating manual winners)
    for (let i = 0; i < winnerLimit; i++) {
        const rank = winnerLimit - i;
        const manualNum = game.manual_winners && game.manual_winners.get ? game.manual_winners.get(rank.toString()) : game.manual_winners?.[rank.toString()];
        
        let number;
        if (manualNum && pool.includes(manualNum)) {
            number = manualNum;
            const idx = pool.indexOf(number);
            pool.splice(idx, 1);
        } else {
            const idx = Math.floor(Math.random() * pool.length);
            number = pool.splice(idx, 1)[0] || '88888888';
        }

        selectedWinningNumbers.push(number);
        const original = tickets.find((t: any) => t.ticketNumbers.includes(number));
        if (original) {
            selectedWinningTickets.push({
                ...original,
                ticketNumbers: [number]
            });
        }
    }

    // 3. PERSISTENCE & PAYOUTS
    game.draw_started_at = new Date();
    game.current_winners = selectedWinningTickets;
    game.current_winning_numbers = selectedWinningNumbers;
    game.current_step = 0;
    
    // --- DELAYED PAYOUT SYSTEM ---
    // Payout is now handled in a separate route (/api/admin/games/[id]/payout)
    // triggered 2 minutes after the UI reveals the winners to ensure 
    // a premium surprise-reveal experience.
    
    game.last_payout_complete = false;
    game.draw_completed_at = null; // Reset for new draw

    await game.save();

    return NextResponse.json({
        message: 'Draw started and winners secured',
        winners: selectedWinningTickets,
        winningNumbers: selectedWinningNumbers,
        draw_started_at: game.draw_started_at
    });

  } catch (error: any) {
    console.error('Draw Start Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
