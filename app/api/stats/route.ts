import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import Game from '@/lib/db/models/Game';

// GET /api/stats - Get public statistics (no auth required)
export async function GET() {
  try {
    await connectDB();

    // Total Players: all users excluding admins
    const totalPlayers = await User.countDocuments({
      role: { $ne: 'admin' }
    });

    // Total Games: count of all upcoming games
    const totalGames = await Game.countDocuments({
      status: 'upcoming'
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalPlayers,
        totalGames
      }
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
