import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Profile from '@/models/Profile';
import Game from '@/models/Game';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json({ error: 'GameId required' }, { status: 400 });
    }

    await connectMongo();
    const tickets = await Ticket.find({ gameId, status: 'active' }).sort({ createdAt: -1 });

    return NextResponse.json({ tickets }, { status: 200 });
  } catch (err) {
    console.error('Fetch Tickets Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      gameId, 
      userId, 
      name, 
      phone, 
      address, 
      ticketNumbers 
    } = body;

    if (!gameId || !userId || !ticketNumbers || ticketNumbers.length === 0) {
      return NextResponse.json({ error: 'Missing required ticket data' }, { status: 400 });
    }

    await connectMongo();

    // 1. Fetch Game and Price
    const game = await Game.findOne({ id: gameId });
    const price = game?.ticket_price || 1; 
    const totalCost = ticketNumbers.length * price;

    // 2. Atomic Balance Check and Deduction
    const profile = await Profile.findOne({ firebaseUid: userId });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.balance < totalCost) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // 3. Deduct Balance
    await Profile.findOneAndUpdate(
      { firebaseUid: userId },
      { 
        $inc: { 
          balance: -totalCost,
          total_wagered: totalCost 
        } 
      }
    );

    // 4. Create Ticket Record
    const newTicket = await Ticket.create({
      gameId,
      userId,
      name,
      phone,
      address,
      ticketNumbers,
      purchaseDate: new Date(),
    });

    return NextResponse.json({ 
      ticket: newTicket, 
      balance: profile.balance - totalCost,
      message: 'Purchase successful! Tickets registered.' 
    }, { status: 201 });

  } catch (err) {
    console.error('Purchase Ticket Error:', err);
    return NextResponse.json({ error: 'Database capture failed' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { gameId, action } = await req.json();
    if (action === 'expire_all' && gameId) {
      await connectMongo();
      // Mark all tickets as expired
      await Ticket.updateMany({ gameId }, { $set: { status: 'expired' } });
      return NextResponse.json({ success: true, message: 'All tickets neutralized' }, { status: 200 });
    }
    return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 });
  } catch (err) {
    console.error('Expire Tickets Error:', err);
    return NextResponse.json({ error: 'Failed to update ticket states' }, { status: 500 });
  }
}
