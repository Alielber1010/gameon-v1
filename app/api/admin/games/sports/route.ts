import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import { requireAuth } from '@/lib/auth';

// GET /api/admin/games/sports - Get all unique sports from games (admin only)
export async function GET() {
  try {
    // Authenticate and check admin role
    let authResult;
    try {
      authResult = await requireAuth();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!authResult || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get all unique sports from games
    const sports = await Game.distinct('sport');
    
    // Sort alphabetically
    const sortedSports = sports.sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      sports: sortedSports,
    });
  } catch (error: any) {
    console.error('Error fetching sports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sports' },
      { status: 500 }
    );
  }
}
