import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/admin/users/[id]/games - Get all games for a specific user (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const userId = new mongoose.Types.ObjectId(id);

    // Find games where user is host or registered player
    const games = await Game.find({
      $or: [
        { hostId: userId },
        { 'registeredPlayers.userId': userId }
      ]
    })
      .populate('hostId', 'name email image')
      .populate('registeredPlayers.userId', 'name email image')
      .sort({ date: -1, createdAt: -1 })
      .limit(50) // Limit to 50 most recent games
      .lean();

    // Transform games for frontend
    const transformedGames = games.map((game: any) => ({
      id: game._id.toString(),
      title: game.title,
      sport: game.sport,
      description: game.description,
      location: game.location,
      date: game.date,
      startTime: game.startTime,
      endTime: game.endTime,
      maxPlayers: game.maxPlayers,
      status: game.status,
      image: game.image || '/placeholder.jpg',
      hostId: game.hostId._id?.toString() || game.hostId.toString(),
      hostName: game.hostId.name || 'Unknown',
      hostImage: game.hostId.image || null,
      registeredPlayers: game.registeredPlayers?.map((player: any) => ({
        userId: player.userId._id?.toString() || player.userId.toString(),
        name: player.name,
        image: player.image,
      })) || [],
      seatsLeft: game.maxPlayers - (game.registeredPlayers?.length || 0),
      isHost: game.hostId._id?.toString() === userId.toString() || game.hostId.toString() === userId.toString(),
      createdAt: game.createdAt,
      completedAt: game.completedAt,
    }));

    return NextResponse.json({
      success: true,
      games: transformedGames,
      total: transformedGames.length,
    });
  } catch (error: any) {
    console.error('Error fetching user games:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user games' },
      { status: 500 }
    );
  }
}
