import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Game from '@/models/Game';

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
    const { id, name, game_type, instructions, photo_url, min_bet, max_bet, auto_play_seconds, is_active } = body;

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
      game_type: game_type || 'slots',
      instructions,
      photo_url,
      min_bet: parseFloat(min_bet) || 1,
      max_bet: parseFloat(max_bet) || 1000,
      auto_play_seconds: parseInt(auto_play_seconds) || 5,
      is_active: is_active ?? true
    });

    return NextResponse.json({ game: newGame, message: "Game generated successfully" }, { status: 201 });
  } catch (error) {
    console.error('Create Game Error:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}
