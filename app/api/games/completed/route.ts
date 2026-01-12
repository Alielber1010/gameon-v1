import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import User from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/games/completed - Get all completed games for the current user
export async function GET(request: NextRequest) {
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
    
    if (!authResult || !authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(authResult.id);

    // Find games where:
    // 1. User is the host AND game is completed
    // 2. User is in registeredPlayers AND game is completed
    const games = await Game.find({
      status: 'completed',
      $or: [
        { hostId: userId },
        { 'registeredPlayers.userId': userId }
      ]
    })
      .populate('hostId', 'name email image')
      .populate('registeredPlayers.userId', 'name email image')
      .populate('attendance.userId', 'name email image')
      .sort({ completedAt: -1, date: -1 }) // Most recently completed first
      .lean();

    // Get current user's activity history to check which players they've rated
    const currentUser = await User.findById(userId).lean();
    const userActivityHistory = currentUser?.activityHistory || [];

    // Transform games for frontend
    const transformedGames = games.map((game: any) => {
      // Check if user attended
      const userAttendance = game.attendance?.find((att: any) => 
        att.userId._id?.toString() === userId.toString() || att.userId.toString() === userId.toString()
      );
      const userAttended = userAttendance?.attended || false;

      // Get list of players the current user has already rated in this game
      const gameActivityEntry = userActivityHistory.find((entry: any) => 
        entry.gameId?.toString() === game._id.toString()
      );
      const playersRated = gameActivityEntry?.playersRated?.map((pid: any) => 
        pid.toString()
      ) || [];

      return {
        id: game._id.toString(),
        hostId: game.hostId._id?.toString() || game.hostId.toString(),
        hostName: game.hostId.name || game.hostId,
        hostImage: game.hostId.image || null,
        title: game.title,
        sport: game.sport,
        description: game.description,
        location: game.location,
        date: game.date,
        startTime: game.startTime,
        endTime: game.endTime,
        maxPlayers: game.maxPlayers,
        skillLevel: game.skillLevel,
        minSkillLevel: game.minSkillLevel,
        image: game.image,
        status: game.status,
        hostWhatsApp: game.hostWhatsApp,
        registeredPlayers: game.registeredPlayers?.map((player: any) => ({
          id: player._id?.toString(),
          userId: player.userId._id?.toString() || player.userId.toString(),
          name: player.name,
          age: player.age,
          skillLevel: player.skillLevel,
          image: player.image,
          whatsApp: player.whatsApp,
          joinedAt: player.joinedAt,
        })) || [],
        attendance: game.attendance?.map((att: any) => ({
          userId: att.userId._id?.toString() || att.userId.toString(),
          userName: att.userId.name || att.userId,
          userImage: att.userId.image || null,
          attended: att.attended,
          markedAt: att.markedAt,
          markedBy: att.markedBy?._id?.toString() || att.markedBy?.toString(),
        })) || [],
        completedAt: game.completedAt,
        completedBy: game.completedBy?.toString(),
        seatsLeft: game.maxPlayers - (game.registeredPlayers?.length || 0),
        userAttended, // Whether current user attended
        isHost: game.hostId._id?.toString() === userId.toString() || game.hostId.toString() === userId.toString(),
        playersRated, // List of player IDs the current user has already rated in this game
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedGames,
    });
  } catch (error: any) {
    console.error('Error fetching completed games:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch completed games' },
      { status: 500 }
    );
  }
}

