import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth';

// POST /api/users/activity - Update user's last seen timestamp (heartbeat)
export async function POST() {
  try {
    // Authenticate user
    let authResult;
    try {
      authResult = await requireAuth();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Update user's lastSeen timestamp
    await User.findByIdAndUpdate(authResult.id, {
      lastSeen: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Activity updated'
    });
  } catch (error: any) {
    console.error('Error updating user activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}
