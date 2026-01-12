import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import User from '@/lib/db/models/User';
import Notification from '@/lib/db/models/Notification';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// POST /api/games/[id]/join - Join a game
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid game ID' },
        { status: 400 }
      );
    }

    const game = await Game.findById(id);

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    // Check if game is still open
    if (game.status !== 'upcoming' && game.status !== 'ongoing') {
      return NextResponse.json(
        { success: false, error: 'Cannot join a game that is not upcoming or ongoing' },
        { status: 400 }
      );
    }

    // Check if user is already a player
    const isAlreadyPlayer = game.registeredPlayers.some(
      (player: any) => player.userId.toString() === authResult.id
    );

    if (isAlreadyPlayer) {
      return NextResponse.json(
        { success: false, error: 'You are already registered for this game' },
        { status: 400 }
      );
    }

    // Check if user has a pending join request
    const hasPendingRequest = game.joinRequests.some(
      (request: any) => request.userId.toString() === authResult.id
    );

    if (hasPendingRequest) {
      return NextResponse.json(
        { success: false, error: 'You already have a pending join request' },
        { status: 400 }
      );
    }

    // Check if game is full
    if (game.registeredPlayers.length >= game.maxPlayers) {
      return NextResponse.json(
        { success: false, error: 'Game is full' },
        { status: 400 }
      );
    }

    // Get user profile data
    const user = await User.findById(authResult.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      age,
      skillLevel,
      image,
      whatsApp,
      autoApprove = false, // If true, add directly to players; if false, add to joinRequests
    } = body;

    // Prepare player data
    const playerData = {
      userId: authResult.id,
      name: name || user.name,
      age: age || undefined,
      skillLevel: skillLevel || undefined,
      image: image || user.image || undefined,
      whatsApp: whatsApp || user.phoneNumber || undefined,
      joinedAt: new Date(),
    };

    // If auto-approve is true (or host allows direct join), add to registeredPlayers
    // Otherwise, add to joinRequests for host approval
    if (autoApprove || game.hostId.toString() === authResult.id) {
      // Host can always join directly
      game.registeredPlayers.push(playerData);
    } else {
      // Regular users go through join requests
      game.joinRequests.push({
        ...playerData,
        requestedAt: new Date(),
      });

      // Create notification for the host
      const hostNotification = new Notification({
        userId: game.hostId,
        type: 'new_join_request',
        title: 'New Join Request',
        message: `${user.name} wants to join your game "${game.title}"`,
        gameId: game._id,
        relatedUserId: authResult.id,
        read: false,
      });
      await hostNotification.save();

      // Create notification for the user who sent the request
      const userNotification = new Notification({
        userId: authResult.id,
        type: 'join_request_sent',
        title: 'Join Request Sent',
        message: `Your request to join "${game.title}" has been sent. Waiting for host approval.`,
        gameId: game._id,
        relatedUserId: game.hostId,
        read: false,
      });
      await userNotification.save();
    }

    await game.save();
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
      message: autoApprove || game.hostId.toString() === authResult.id
        ? 'Successfully joined the game'
        : 'Join request submitted. Waiting for host approval.',
    });
  } catch (error: any) {
    console.error('Error joining game:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join game' },
      { status: 500 }
    );
  }
}

