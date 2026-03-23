import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Game from '@/models/Game';

export const dynamic = 'force-dynamic';

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
  } catch (error: any) {
    console.error('Fetch Game Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
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
      prizes: Array.isArray(body.prizes) 
                ? body.prizes.map((p: any) => ({ rank: p.rank, percentage: p.percentage })) 
                : [],
      manual_winners: body.manual_winners,
      photo_url: body.photo_url || '',
      instructions: body.instructions,
      draw_date: body.draw_date ? new Date(body.draw_date) : null,
      draw_started_at: body.draw_started_at ? new Date(body.draw_started_at) : undefined,
      current_winners: body.current_winners,
      current_winning_numbers: body.current_winning_numbers,
      current_step: body.current_step
    };

    // Remove undefined values to avoid corrupting data
    Object.keys(updatePayload).forEach(key => {
      // @ts-ignore
      if (updatePayload[key] === undefined) delete updatePayload[key];
    });

    console.log('--- ADMIN UPDATE PAYLOAD ---', updatePayload);

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugId);
    const query = isObjectId ? { $or: [{ id: slugId }, { _id: slugId }] } : { id: slugId };

    // Bypassing Mongoose strictness by using collection directly
    const result = await Game.collection.findOneAndUpdate(
      query,
      { $set: updatePayload },
      { returnDocument: 'after' }
    );

    const updatedGame = result.value || result;

    console.log('--- SAVED GAME IN MONGODB ---', updatedGame?.draw_date);

    if (!updatedGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (updatedGame) {
        // Broadcast the update to all active game rooms
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rdepfiqnzilqixgxknss.supabase.co',
                process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZXBmaXFuemlscWl4Z3hrbnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDAxNzgsImV4cCI6MjA4OTA3NjE3OH0.a0CZTxsanpC1sno3-4m2I1iZA8GrLTNuq2sAVV6OG0g'
            );
            
            const channel = supabase.channel(`game_${slugId}`);
            await channel.send({
                type: 'broadcast',
                event: 'GAME_ROLLOVER',
                payload: { drawDate: updatedGame.draw_date }
            });
            console.log('--- ADMIN REALTIME SYNK SENT ---');
        } catch (syncErr) {
            console.error('Realtime Sync Error:', syncErr);
        }
    }

    return NextResponse.json({ message: 'Game parameters refreshed', game: updatedGame }, { status: 200 });
  } catch (error: any) {
    console.error('Update Game Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to synchronize configuration' }, { status: 500 });
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
