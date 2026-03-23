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

    // 0. IDEMPOTENCY LOCK: Prevent double-payouts for the same session
    if (game.last_payout_complete) {
        return NextResponse.json({ message: 'Audit reveals funds already settled', status: 'SETTLED' });
    }

    if (!game.current_winners || game.current_winners.length === 0) {
        return NextResponse.json({ error: 'No winners detected in the current sequence' }, { status: 400 });
    }

    // 1. Calculate historical pool based on winners count (since actual tickets may have been rolled over)
    const winningTickets = game.current_winners;
    // Important: We should ideally have the total pool size saved in start-draw, but for now we calculate 
    // based on original ticket retrieval if possible, otherwise we fallback to counting current winners
    // BETTER: Retrieve 'expired' tickets for this game session if rollover happened
    const sessionTickets = await Ticket.find({ gameId: game.id, status: 'expired', updatedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } }).lean();
    
    // Fallback if tickets are missing (unlikely but safe)
    const eligibleCount = sessionTickets.length > 0 ? sessionTickets.length : winningTickets.length;
    const totalPool = eligibleCount * (game.ticket_price || 1);
    const prizes = game.prizes || [];

    console.log(`--- [AUTOMATED SETTLEMENT] POOL: ৳${totalPool} | ELIGIBLE: ${eligibleCount} ---`);

    for (let i = 0; i < winningTickets.length; i++) {
        const winnerTicket = winningTickets[i];
        // Rank logic: winners were collected in reverse order (Rank 5, 4, 3, 2, 1)
        // current_winners[0] is Rank 5 (last place), current_winners[4] is Rank 1 (Champ)
        const rank = winningTickets.length - i;
        const prizeConfig = prizes.find((p: any) => p.rank === rank);
        
        if (prizeConfig && winnerTicket.userId) {
            const prizeAmount = (totalPool * (prizeConfig.percentage || 0)) / 100;
            
            if (prizeAmount > 0) {
                // 1. Atomic Credit to Profile
                await Profile.findOneAndUpdate(
                    { firebaseUid: winnerTicket.userId },
                    { 
                        $inc: { 
                            balance: prizeAmount,
                            total_won: prizeAmount
                        } 
                    }
                );

                // 2. Persistent Notification
                const Notification = (await import('@/models/Notification')).default;
                await Notification.create({
                    userId: winnerTicket.userId,
                    title: '🏆 AUDIT COMPLETE: WINNER CONFIRMED!',
                    message: `Security audit concluded. Your ticket #${winnerTicket.ticketNumbers[0]} has been settled. ৳${prizeAmount.toLocaleString()} has been joined to your balance.`,
                    type: 'win',
                    metadata: { gameId: game.id, amount: prizeAmount, rank }
                });
            }
        }
    }

    // 2. Mark as settled
    game.last_payout_complete = true;
    game.draw_completed_at = new Date();
    await game.save();

    return NextResponse.json({ 
        message: 'Pool settled and prize amounts joined to user balances',
        total_pool: totalPool,
        winners: winningTickets.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Settlement Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
