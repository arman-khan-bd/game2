import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Game from '@/models/Game';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectMongo();
    
    // Fetch games logic - we sort by name intentionally
    const games = await Game.find({}).sort({ name: 1 });
    
    // Format them mapping _id -> _id_mongo and id -> slug for UI compatibility
    const formattedGames = games.map(g => {
       const gameObj = g.toObject();
       gameObj._id_mongo = gameObj._id.toString();
       return gameObj;
    });

    return NextResponse.json({ games: formattedGames }, { status: 200 });
  } catch (error) {
    console.error('Fetch Games Error:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      id, 
      name, 
      game_type, 
      total_tickets, 
      ticket_price, 
      auto_play_hours, 
      next_winner_minutes, 
      is_bot_play, 
      is_active,
      winners_count,
      prizes
    } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Game slug (id) and name are required' }, { status: 400 });
    }

    await connectMongo();
    
    // Prevent duplicate game IDs
    const existing = await Game.findOne({ id });
    if (existing) {
      return NextResponse.json({ error: 'A game with this ID already exists' }, { status: 409 });
    }

    const newGame = await Game.create({
      id: id.toLowerCase().replace(/\s+/g, '-'),
      name,
      game_type: game_type || 'raffle',
      total_tickets: parseInt(total_tickets) || 100,
      ticket_price: parseFloat(ticket_price) || 1,
      auto_play_hours: parseInt(auto_play_hours) || 24,
      next_winner_minutes: parseInt(next_winner_minutes) || 10,
      is_bot_play: !!is_bot_play,
      is_active: is_active ?? true,
      winners_count: parseInt(winners_count) || 1,
      prizes: prizes || [],
      photo_url: body.photo_url || ''
    });

    return NextResponse.json({ game: newGame, message: "Game generated successfully" }, { status: 201 });
  } catch (error) {
    console.error('Create Game Error:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}
