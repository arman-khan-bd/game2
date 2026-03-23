import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Winner from '@/models/Winner';
import Game from '@/models/Game';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectMongo();
    
    // 1. Fetch all tickets
    const tickets = await Ticket.find({}).sort({ createdAt: -1 }).lean();
    
    // 2. Fetch all winners
    const winners = await Winner.find({}).sort({ createdAt: -1 }).lean();
    
    // 3. Fetch all games for names
    const games = await Game.find({}).select('id name').lean();
    const gameMap = games.reduce((acc: any, g: any) => {
      acc[g.id] = g.name;
      return acc;
    }, {});

    // Attach game names to tickets and winners
    const enrichedTickets = tickets.map((t: any) => ({
      ...t,
      gameName: gameMap[t.gameId] || t.gameId
    }));
    
    const enrichedWinners = winners.map((w: any) => ({
      ...w,
      gameName: gameMap[w.gameId] || w.gameId
    }));

    return NextResponse.json({ 
      tickets: enrichedTickets, 
      winners: enrichedWinners 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Fetch Registry Error:', error);
    return NextResponse.json({ error: 'System registry failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { gameId, userId, username, ticketNumber, rank, prizeAmount } = await req.json();
    
    if (!gameId || !username || !ticketNumber || rank === undefined) {
      return NextResponse.json({ error: 'Incomplete winning record' }, { status: 400 });
    }

    await connectMongo();
    const newWinner = await Winner.create({
      gameId,
      userId: userId || 'anonymous',
      username,
      ticketNumber,
      rank,
      prizeAmount: prizeAmount || 0,
    });

    return NextResponse.json({ success: true, winner: newWinner }, { status: 201 });
  } catch (error: any) {
    console.error('Record Winner Error:', error);
    return NextResponse.json({ error: 'Registry write failed' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
    try {
      const { winnerId, action } = await req.json();
      if (action === 'settle' && winnerId) {
        await connectMongo();
        const updated = await Winner.findByIdAndUpdate(winnerId, { isSettled: true }, { new: true });
        return NextResponse.json({ success: true, winner: updated });
      }
      return NextResponse.json({ error: 'Invalid registry state' }, { status: 400 });
    } catch (error: any) {
      console.error('Settlement Error:', error);
      return NextResponse.json({ error: 'Internal system fault' }, { status: 500 });
    }
}
