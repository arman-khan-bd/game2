import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Profile from '@/models/Profile';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firebaseUid, username, full_name, email } = body;

    if (!firebaseUid || !username || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Connect to MongoDB
    await connectMongo();

    // Check if profile exists already (prevent double registration issues)
    const existing = await Profile.findOne({ firebaseUid });
    if (existing) {
      return NextResponse.json({ error: 'User already exists in db' }, { status: 400 });
    }

    // Create new user profile document in MongoDB
    const newProfile = await Profile.create({
      firebaseUid,
      username,
      full_name,
      email,
      balance: 1000, 
      role: 'user',
      status: 'active'
    });

    return NextResponse.json({ message: 'User profile created successfully', document: newProfile }, { status: 201 });

  } catch (error: any) {
    console.error('Registration API Error:', error);
    // Unique constraint error from mongoose (e.g. duplicate username)
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Username or email is already taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
