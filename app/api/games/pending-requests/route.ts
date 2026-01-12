import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/games/pending-requests - Get games where user has pending join requests
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

    // Find all games where the user has a pending join request
    const games = await Game.find({
      status: { $in: ['upcoming', 'ongoing'] },
      'joinRequests.userId': new mongoose.Types.ObjectId(authResult.id),
    })
      .populate('hostId', 'name email image')
      .populate('registeredPlayers.userId', 'name email image')
      .populate('joinRequests.userId', 'name email image')
      .sort({ date: 1, startTime: 1 })
      .lean();

    // Transform games to include computed fields
    const transformedGames = games.map((game: any) => {
      // Find the user's join request
      const userJoinRequest = game.joinRequests.find(
        (req: any) => req.userId.toString() === authResult.id
      );

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
        teamBlue: game.teamBlue || [],
        teamRed: game.teamRed || [],
        joinRequests: game.joinRequests?.map((request: any) => ({
          id: request._id?.toString(),
          userId: request.userId._id?.toString() || request.userId.toString(),
          userName: request.name,
          userAge: request.age,
          userSkillLevel: request.skillLevel,
          userImage: request.image,
          userWhatsApp: request.whatsApp,
          requestDate: request.requestedAt,
        })) || [],
        seatsLeft: game.maxPlayers - game.registeredPlayers.length,
        userJoinRequestId: userJoinRequest?._id?.toString(),
        userJoinRequestDate: userJoinRequest?.requestedAt,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedGames,
    });
  } catch (error: any) {
    console.error('Error fetching games with pending requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch games with pending requests' },
      { status: 500 }
    );
  }
}


