import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Profile from '@/models/Profile';

export async function GET(req: Request) {
  try {
    // Basic auth check: usually from headers, cookies, or auth token.
    // In a production app you'd verify the Firebase ID token here to ensure they are an admin.
    
    await connectMongo();
    
    // Fetch all profiles from MongoDB, sorted by newest first
    const users = await Profile.find({}).sort({ createdAt: -1 });
    
    // Map _id to id so the frontend doesn't break
    const formattedUsers = users.map(u => {
       const userObj = u.toObject();
       userObj.id = userObj._id.toString();
       return userObj;
    });

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error) {
    console.error('Admin Fetch Users Error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
       return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    await connectMongo();
    
    // Find by the mapped string _id and delete
    await Profile.findByIdAndDelete(id);

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Admin Delete User Error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
