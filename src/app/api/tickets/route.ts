import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Ticket from '@/models/Ticket';

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
      message: 'Tickets successfully registered in database' 
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
