import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    await connectMongo();
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectMongo();

    // Prevent duplicates for the same game start within the same minute
    if (body.type === 'game_start' && body.metadata?.gameId) {
      const existing = await Notification.findOne({ 
        userId: body.userId, 
        type: 'game_start', 
        'metadata.gameId': body.metadata.gameId,
        createdAt: { $gte: new Date(Date.now() - 600000) } // 10 minute window
      });
      if (existing) return NextResponse.json({ message: 'Duplicate suppressed' }, { status: 200 });
    }

    const n = new Notification(body);
    await n.save();

    return NextResponse.json({ notification: n }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    await connectMongo();
    
    if (id) {
       await Notification.updateOne({ _id: id, userId }, { $set: { isRead: true } });
    } else {
       await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
