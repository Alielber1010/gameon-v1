import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import Notification from '@/lib/db/models/Notification';
import User from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// POST /api/games/[id]/transfer-host - Transfer host ownership to another player
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

    const body = await request.json();
    const { newHostId } = body;

    if (!newHostId) {
      return NextResponse.json(
        { success: false, error: 'newHostId is required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(newHostId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid new host ID' },
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

    // Check if user is the current host
    if (game.hostId.toString() !== authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Only the current host can transfer ownership' },
        { status: 403 }
      );
    }

    // Check if new host is a registered player
    // Try to match by userId first, then by _id (player document ID)
    const newHostPlayer = game.registeredPlayers.find(
      (player: any) => {
        // Handle both populated and unpopulated userId
        const playerUserId = player.userId?._id?.toString() || player.userId?.toString() || player.userId;
        const playerId = player._id?.toString() || player._id;
        return playerUserId === newHostId || playerId === newHostId;
      }
    );

    if (!newHostPlayer) {
      console.error('Transfer host failed - player not found', {
        newHostId,
        registeredPlayers: game.registeredPlayers.map((p: any) => ({
          userId: p.userId?.toString() || p.userId?._id?.toString(),
          _id: p._id?.toString(),
        })),
      });
      return NextResponse.json(
        { success: false, error: 'New host must be a registered player in the game' },
        { status: 400 }
      );
    }

    // Get the actual userId from the player (not the document _id)
    // Handle both populated and unpopulated userId
    const actualNewHostUserId = newHostPlayer.userId?._id?.toString() || newHostPlayer.userId?.toString() || newHostPlayer.userId;
    
    if (!actualNewHostUserId) {
      console.error('Transfer host failed - invalid player data', {
        newHostPlayer,
        newHostId,
      });
      return NextResponse.json(
        { success: false, error: 'Invalid player data' },
        { status: 400 }
      );
    }

    // Cannot transfer to yourself - check against actual userId
    if (game.hostId.toString() === actualNewHostUserId) {
      return NextResponse.json(
        { success: false, error: 'You are already the host' },
        { status: 400 }
      );
    }

    // Transfer host ownership
    const oldHostId = game.hostId;
    game.hostId = new mongoose.Types.ObjectId(actualNewHostUserId);

    // Remove new host from registeredPlayers (they're now the host, not a player)
    game.registeredPlayers = game.registeredPlayers.filter(
      (player: any) => {
        const playerUserId = player.userId?.toString() || player.userId;
        const playerId = player._id?.toString() || player._id;
        return playerUserId !== actualNewHostUserId && playerId !== actualNewHostUserId;
      }
    );

    // Remove new host from teams if they're in any team
    game.teamBlue = game.teamBlue.filter(
      (player: any) => {
        const playerUserId = player.userId?.toString() || player.userId;
        const playerId = player._id?.toString() || player._id;
        return playerUserId !== actualNewHostUserId && playerId !== actualNewHostUserId;
      }
    );
    game.teamRed = game.teamRed.filter(
      (player: any) => {
        const playerUserId = player.userId?.toString() || player.userId;
        const playerId = player._id?.toString() || player._id;
        return playerUserId !== actualNewHostUserId && playerId !== actualNewHostUserId;
      }
    );

    // Add old host to registeredPlayers if they're not already there
    // (They become a regular player and can leave later if they want)
    const oldHostInPlayers = game.registeredPlayers.find(
      (player: any) => {
        const playerUserId = player.userId?.toString() || player.userId;
        const playerId = player._id?.toString() || player._id;
        return playerUserId === oldHostId.toString() || playerId === oldHostId.toString();
      }
    );

    if (!oldHostInPlayers) {
      // Get old host user details
      const oldHostUser = await User.findById(oldHostId);
      if (oldHostUser) {
        // Add old host as a player
        game.registeredPlayers.push({
          userId: oldHostId,
          name: oldHostUser.name,
          age: oldHostUser.age,
          skillLevel: oldHostUser.skillLevel,
          image: oldHostUser.image,
          whatsApp: oldHostUser.whatsApp,
          joinedAt: new Date(),
        });
      }
    }

    await game.save();
    await game.populate('hostId', 'name email image');
    await game.populate('registeredPlayers.userId', 'name email image');

    // Get the old host's name for the notification
    const oldHost = await User.findById(oldHostId);
    const oldHostName = oldHost?.name || 'The previous host';
    const oldHostIdString = oldHostId.toString();

    // Create notification for the new host
    const notification = new Notification({
      userId: new mongoose.Types.ObjectId(actualNewHostUserId),
      type: 'host_assigned',
      title: 'You are now the host!',
      message: `${oldHostName} has transferred host ownership of "${game.title}" to you. You can now manage the game.`,
      gameId: game._id,
      relatedUserId: new mongoose.Types.ObjectId(oldHostIdString),
      read: false,
    });
    await notification.save();

    const transformedGame = {
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
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedGame,
      message: 'Host ownership transferred successfully',
    });
  } catch (error: any) {
    console.error('Error transferring host:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to transfer host ownership' },
      { status: 500 }
    );
  }
}

