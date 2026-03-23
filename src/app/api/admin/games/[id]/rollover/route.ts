import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Game from '@/models/Game';
import Ticket from '@/models/Ticket';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: slugId } = await params;
    await connectMongo();

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugId);
    const query = isObjectId ? { $or: [{ id: slugId }, { _id: slugId }] } : { id: slugId };

    const game = await Game.findOne(query);
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    // 1. Calculate next draw date based on auto_play_hours
    const hours = game.auto_play_hours || 24;
    const nextDrawDate = new Date();
    nextDrawDate.setHours(nextDrawDate.getHours() + hours);

    // 2. Clear tickets for this game (Archive or Delete)
    // We update them to 'expired' status so they stay in history but are removed from play
    await Ticket.updateMany(
      { gameId: game.id, status: 'active' },
      { $set: { status: 'expired' } }
    );

    // 3. Update game with new draw date and clear session
    game.draw_date = nextDrawDate;
    // 3. Update game with new draw date only (Keep winner context for Hall of Fame)
    game.draw_date = nextDrawDate;
    // We omit clearing winners here so they stay visible during reveal period
    // These will be cleared when the NEXT draw actually starts
    
    await game.save();

    return NextResponse.json({ 
      message: 'Game rolled over successfully', 
      draw_date: nextDrawDate,
      game: game 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Rollover Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
