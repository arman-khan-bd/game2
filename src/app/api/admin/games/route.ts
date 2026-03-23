import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Game from '@/models/Game';

export const dynamic = 'force-dynamic';

import Ticket from '@/models/Ticket';

export async function GET() {
  try {
    await connectMongo();
    
    const games = await Game.find({}).sort({ name: 1 });
    
    // Enrich with ticket stats
    const enrichedGames = await Promise.all(games.map(async (g) => {
       const gameObj = g.toObject();
       gameObj._id_mongo = gameObj._id.toString();
       
       const stats = await Ticket.aggregate([
         { $match: { gameId: g.id, status: 'active' } },
         { $group: {
             _id: "$gameId",
             soldTickets: { $sum: { $size: "$ticketNumbers" } },
             uniqueBuyers: { $addToSet: "$userId" }
           }
         }
       ]);

       gameObj.soldTickets = stats[0]?.soldTickets || 0;
       gameObj.buyersCount = stats[0]?.uniqueBuyers?.length || 0;
       
       return gameObj;
    }));

    return NextResponse.json({ games: enrichedGames }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch Games Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch games' }, { status: 500 });
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
      prizes,
      instructions
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
      photo_url: body.photo_url || '',
      instructions: instructions || "Welcome to the game. Place your bets and wait for the system to finalize the sequence."
    });

    return NextResponse.json({ game: newGame, message: "Game generated successfully" }, { status: 201 });
  } catch (error: any) {
    console.error('Create Game Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create game engine' }, { status: 500 });
  }
}
