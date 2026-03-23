import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Winner from '@/models/Winner';
import Game from '@/models/Game';
import Profile from '@/models/Profile';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectMongo();
    
    const tickets = await Ticket.find({}).sort({ createdAt: -1 }).lean();
    const winners = await Winner.find({}).sort({ createdAt: -1 }).lean();
    const games = await Game.find({}).select('id name').lean();
    
    const gameMap = games.reduce((acc: any, g: any) => {
      acc[g.id] = g.name;
      return acc;
    }, {});

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

    // Update the corresponding ticket status to 'winning'
    await Ticket.updateOne(
      { gameId, ticketNumbers: ticketNumber },
      { $set: { status: 'winning' } }
    );

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
      
      const winner = await Winner.findById(winnerId);
      if (!winner) return NextResponse.json({ error: 'Winner record not found' }, { status: 404 });
      if (winner.isSettled) return NextResponse.json({ error: 'Prize already settled' }, { status: 400 });

      // Update Winner Status
      winner.isSettled = true;
      await winner.save();

      // Update User Balance if userId is valid
      if (winner.userId && winner.userId !== 'anonymous') {
        const updateResult = await Profile.findOneAndUpdate(
          { firebaseUid: winner.userId },
          { 
            $inc: { 
              balance: winner.prizeAmount,
              total_won: winner.prizeAmount 
            } 
          },
          { new: true }
        );
        
        if (!updateResult) {
          console.warn(`Profile for user ${winner.userId} not found during settlement.`);
        }
      }

      return NextResponse.json({ success: true, message: 'Prize settled and balance adjusted' });
    }
    return NextResponse.json({ error: 'Invalid registry action' }, { status: 400 });
  } catch (error: any) {
    console.error('Settlement Error:', error);
    return NextResponse.json({ error: 'Internal system fault' }, { status: 500 });
  }
}
