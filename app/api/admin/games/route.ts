import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import Report from '@/lib/db/models/Report';
import { requireAuth } from '@/lib/auth';

// GET /api/admin/games - Get all games with report counts (admin only)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const priority = searchParams.get('priority'); // 'green', 'yellow', 'red', or null
    const status = searchParams.get('status'); // 'upcoming', 'ongoing', 'completed', 'cancelled', or null
    const sport = searchParams.get('sport'); // sport name or null

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { sport: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
      ];
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (sport && sport !== 'all') {
      query.sport = sport;
    }

    // Get all games (we need all to calculate priorities before filtering)
    // For large datasets, consider optimizing this with aggregation pipeline
    const allGames = await Game.find(query)
      .select('title sport location date startTime endTime maxPlayers status hostId image createdAt')
      .populate('hostId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Get all game IDs to fetch report counts
    const allGameIds = allGames.map((game: any) => game._id);
    
    // Get report counts for all games
    const reportCounts = await Report.aggregate([
      {
        $match: {
          gameId: { $in: allGameIds },
        },
      },
      {
        $group: {
          _id: '$gameId',
          count: { $sum: 1 },
        },
      },
    ]);

    // Create a map of gameId -> report count
    const reportCountMap = new Map();
    reportCounts.forEach((item: any) => {
      reportCountMap.set(item._id.toString(), item.count);
    });

    // Transform games with report counts and priority
    const transformedGames = allGames.map((game: any) => {
      const reportCount = reportCountMap.get(game._id.toString()) || 0;
      let priorityLevel: 'green' | 'yellow' | 'red';
      
      if (reportCount === 0) {
        priorityLevel = 'green';
      } else if (reportCount <= 5) {
        priorityLevel = 'yellow';
      } else {
        priorityLevel = 'red';
      }

      return {
        id: game._id.toString(),
        title: game.title,
        sport: game.sport,
        location: game.location?.address || '',
        city: game.location?.city || '',
        date: game.date,
        startTime: game.startTime,
        endTime: game.endTime,
        maxPlayers: game.maxPlayers,
        status: game.status,
        hostId: game.hostId?._id?.toString() || game.hostId?.toString() || '',
        hostName: game.hostId?.name || 'Unknown',
        hostEmail: game.hostId?.email || '',
        image: game.image || '/default-game.jpg',
        createdAt: game.createdAt,
        reportCount,
        priority: priorityLevel,
      };
    });

    // Filter by priority if specified (status and sport are already filtered in the query)
    let filteredGames = transformedGames;
    if (priority) {
      filteredGames = transformedGames.filter((game) => game.priority === priority);
    }

    // Apply pagination after filtering
    const total = filteredGames.length;
    const paginatedGames = filteredGames.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      games: paginatedGames,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}
