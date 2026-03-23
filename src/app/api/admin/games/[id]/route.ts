import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Game from '@/models/Game';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: slugId } = await params;
    
    if (!slugId) {
      return NextResponse.json({ error: 'Missing game slug' }, { status: 400 });
    }

    await connectMongo();
    
    // Support querying by logical 'id' or fallback to internal MongoDB '_id'
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugId);
    const query = isObjectId ? { $or: [{ id: slugId }, { _id: slugId }] } : { id: slugId };
    
    const game = await Game.findOne(query).lean();

    if (!game) {
      return NextResponse.json({ error: 'Game not found in database' }, { status: 404 });
    }

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    console.error('Fetch Game Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: slugId } = await params;
    const body = await req.json();

    if (!slugId) {
      return NextResponse.json({ error: 'Missing game slug' }, { status: 400 });
    }

    await connectMongo();

    const updatePayload = {
      name: body.name,
      game_type: body.game_type,
      total_tickets: parseInt(body.total_tickets) || 100,
      ticket_price: parseFloat(body.ticket_price) || 1,
      auto_play_hours: parseInt(body.auto_play_hours) || 24,
      next_winner_minutes: parseInt(body.next_winner_minutes) || 10,
      is_bot_play: !!body.is_bot_play,
      is_active: body.is_active,
      winners_count: parseInt(body.winners_count) || 1,
      prizes: body.prizes,
      manual_winners: body.manual_winners,
    };

    // Remove undefined values to avoid corrupting data
    Object.keys(updatePayload).forEach(key => {
      // @ts-ignore
      if (updatePayload[key] === undefined) delete updatePayload[key];
    });

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugId);
    const query = isObjectId ? { $or: [{ id: slugId }, { _id: slugId }] } : { id: slugId };

    const updatedGame = await Game.findOneAndUpdate(
      query,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updatedGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Game parameters refreshed', game: updatedGame }, { status: 200 });
  } catch (error: any) {
    console.error('Update Game Error:', error);
    return NextResponse.json({ error: 'Failed to synchronize configuration' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: slugId } = await params;
    
    if (!slugId) {
      return NextResponse.json({ error: 'Missing game slug' }, { status: 400 });
    }

    await connectMongo();
    
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugId);
    const query = isObjectId ? { $or: [{ id: slugId }, { _id: slugId }] } : { id: slugId };
    
    const deletedGame = await Game.findOneAndDelete(query);

    if (!deletedGame) {
      return NextResponse.json({ error: 'Game not found in database' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Game successfully wiped from network', success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Delete Game Error:', error);
    return NextResponse.json({ error: 'System failed to wipe database parameter' }, { status: 500 });
  }
}
