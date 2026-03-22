import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Profile from '@/models/Profile';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id || id.length < 24) {
      return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
    }

    await connectMongo();
    const user = await Profile.findById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found in MongoDB' }, { status: 404 });
    }

    return NextResponse.json({ profile: user }, { status: 200 });
  } catch (error) {
    console.error('Fetch User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id || id.length < 24) {
      return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
    }

    await connectMongo();
    
    // Whitelist updatable fields
    const updatePayload = {
      full_name: body.full_name,
      username: body.username,
      email: body.email,
      address: body.address || body.location, // Support mapping
      location: body.location || body.address,
      balance: parseFloat(body.balance) || 0,
      role: body.role,
      status: body.status,
      photo_url: body.photo_url,
      password: body.password, // Only storing visually for admin reference, Firebase manages real passwords
      agent_id: body.agent_id,
      ip_address: body.ip_address,
      total_wagered: parseFloat(body.total_wagered) || 0,
      total_won: parseFloat(body.total_won) || 0,
    };

    // Remove undefined fields so we don't accidentally overwrite with nulls
    Object.keys(updatePayload).forEach(key => {
      // @ts-ignore
      if (updatePayload[key] === undefined) {
        // @ts-ignore
        delete updatePayload[key];
      }
    });

    const updatedUser = await Profile.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User updated successfully', profile: updatedUser }, { status: 200 });
  } catch (error: any) {
    console.error('Update User Error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email or Username already taken by another user' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update user parameters' }, { status: 500 });
  }
}
