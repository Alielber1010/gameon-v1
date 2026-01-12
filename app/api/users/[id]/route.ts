import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth';

// GET /api/users/[id] - Get public user profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user (must be logged in to view profiles)
    let authResult;
    try {
      authResult = await requireAuth();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!authResult || !authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = params;

    // Find user by ID (only return public fields)
    const user = await User.findById(id)
      .select('name email image bio phoneNumber location gamesPlayed averageRating totalRatings activityHistory createdAt')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get recent activity (last 3 games)
    const recentActivity = (user.activityHistory || [])
      .sort((a: any, b: any) => new Date(b.playedAt || b.date).getTime() - new Date(a.playedAt || a.date).getTime())
      .slice(0, 3)
      .map((activity: any) => ({
        sport: activity.sport,
        date: activity.date || activity.playedAt,
        attended: activity.attended,
      }));

    // Calculate member since date
    const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email, // Only show to authenticated users
        image: user.image,
        bio: user.bio || 'Passionate sports player who loves team games and staying active.',
        location: user.location || 'Not specified',
        gamesPlayed: user.gamesPlayed || 0,
        averageRating: user.averageRating || 0,
        totalRatings: user.totalRatings || 0,
        memberSince,
        recentActivity,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}





