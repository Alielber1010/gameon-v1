import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import User from '@/lib/db/models/User';
import Notification from '@/lib/db/models/Notification';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// POST /api/games/[id]/join-requests/[requestId]/reject - Reject a join request
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; requestId: string } }
) {
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

    const { id: gameId, requestId } = params;

    if (!mongoose.Types.ObjectId.isValid(gameId) || !mongoose.Types.ObjectId.isValid(requestId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid game ID or request ID' },
        { status: 400 }
      );
    }

    const game = await Game.findById(gameId);

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    // Check if user is the host
    if (game.hostId.toString() !== authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Only the host can reject join requests' },
        { status: 403 }
      );
    }

    // Find the join request
    const joinRequest = game.joinRequests.id(requestId);
    if (!joinRequest) {
      return NextResponse.json(
        { success: false, error: 'Join request not found' },
        { status: 404 }
      );
    }

    // Remove the join request
    const requesterId = joinRequest.userId;
    game.joinRequests.pull(requestId);

    await game.save();

    // Get game title for notification
    const gameTitle = game.title;

    // Create notification for the requester
    const notification = new Notification({
      userId: requesterId,
      type: 'join_request_rejected',
      title: 'Join Request Rejected',
      message: `Your request to join "${gameTitle}" has been rejected.`,
      gameId: game._id,
      read: false,
    });
    await notification.save();

    // Populate for response
    await game.populate('hostId', 'name email image');
    await game.populate('registeredPlayers.userId', 'name email image');
    await game.populate('joinRequests.userId', 'name email image');

    const transformedGame = {
      id: game._id.toString(),
      hostId: game.hostId._id?.toString() || game.hostId.toString(),
      hostName: game.hostId.name || game.hostId,
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
      registeredPlayers: game.registeredPlayers.map((player: any) => ({
        id: player._id?.toString(),
        userId: player.userId._id?.toString() || player.userId.toString(),
        name: player.name,
        age: player.age,
        skillLevel: player.skillLevel,
        image: player.image,
        whatsApp: player.whatsApp,
        joinedAt: player.joinedAt,
      })),
      teamBlue: game.teamBlue || [],
      teamRed: game.teamRed || [],
      joinRequests: game.joinRequests.map((request: any) => ({
        id: request._id?.toString(),
        userId: request.userId._id?.toString() || request.userId.toString(),
        userName: request.name,
        userAge: request.age,
        userSkillLevel: request.skillLevel,
        userImage: request.image,
        userWhatsApp: request.whatsApp,
        requestDate: request.requestedAt,
      })),
      seatsLeft: game.maxPlayers - game.registeredPlayers.length,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedGame,
      message: 'Join request rejected',
    });
  } catch (error: any) {
    console.error('Error rejecting join request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reject join request' },
      { status: 500 }
    );
  }
}

