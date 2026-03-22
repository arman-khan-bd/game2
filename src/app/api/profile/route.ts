import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Profile from '@/models/Profile';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid parameter' }, { status: 400 });
    }

    await connectMongo();

    const profile = await Profile.findOne({ firebaseUid: uid });
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile }, { status: 200 });

  } catch (error) {
    console.error('Profile Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
