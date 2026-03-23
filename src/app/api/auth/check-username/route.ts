import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Profile from '@/models/Profile';

export async function POST(req: Request) {
  try {
    const { username, email } = await req.json();

    if (!username && !email) {
      return NextResponse.json({ error: 'Username or email required for check' }, { status: 400 });
    }

    await connectMongo();

    const query: any = {};
    if (username) query.username = { $regex: new RegExp(`^${username}$`, 'i') };
    if (email) query.email = email.toLowerCase();

    const existing = await Profile.findOne(query);

    if (existing) {
      const field = existing.username.toLowerCase() === username?.toLowerCase() ? 'Username' : 'Email';
      return NextResponse.json({ 
        available: false, 
        error: `${field} is already taken in the master database.` 
      }, { status: 409 });
    }

    return NextResponse.json({ available: true }, { status: 200 });

  } catch (error) {
    console.error('Check Username Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
