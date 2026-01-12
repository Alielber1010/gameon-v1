import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import Notification from '@/lib/db/models/Notification';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// POST /api/games/[id]/remove-player - Remove a player from a game (host only)
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

    // Check if user is the host
    if (game.hostId.toString() !== authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Only the host can remove players' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'Player ID is required' },
        { status: 400 }
      );
    }

    // Prevent removing the host
    if (game.hostId.toString() === playerId) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove the host. Transfer host ownership first.' },
        { status: 400 }
      );
    }

    // Find the player in registeredPlayers
    const playerIndex = game.registeredPlayers.findIndex((player: any) => {
      const playerUserId = player.userId?.toString() || player.userId;
      const playerIdStr = player._id?.toString() || player._id;
      // Compare both as strings to handle ObjectId and string comparisons
      return playerUserId?.toString() === playerId?.toString() || playerIdStr?.toString() === playerId?.toString();
    });

    if (playerIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Player not found in this game' },
        { status: 404 }
      );
    }

    const removedPlayer = game.registeredPlayers[playerIndex];
    const removedPlayerUserId = removedPlayer.userId?.toString() || removedPlayer.userId || playerId;

    // Remove player from registeredPlayers
    game.registeredPlayers.splice(playerIndex, 1);

    // Also remove from teams if they're in any team
    game.teamBlue = game.teamBlue.filter(
      (player: any) => {
        const playerUserId = player.userId?.toString() || player.userId;
        const playerIdStr = player._id?.toString() || player._id;
        return playerUserId !== playerId && playerIdStr !== playerId;
      }
    );
    game.teamRed = game.teamRed.filter(
      (player: any) => {
        const playerUserId = player.userId?.toString() || player.userId;
        const playerIdStr = player._id?.toString() || player._id;
        return playerUserId !== playerId && playerIdStr !== playerId;
      }
    );

    // Remove from attendance if exists
    if (game.attendance) {
      game.attendance = game.attendance.filter((att: any) => {
        const attUserId = att.userId?.toString() || att.userId;
        return attUserId?.toString() !== removedPlayerUserId?.toString();
      });
    }

    await game.save();

    // Send notification to removed player
    try {
      if (mongoose.Types.ObjectId.isValid(removedPlayerUserId)) {
        const notification = new Notification({
          userId: new mongoose.Types.ObjectId(removedPlayerUserId),
          type: 'player_left',
          title: 'Removed from Game',
          message: `You have been removed from "${game.title}" by the host.`,
          gameId: game._id,
          relatedUserId: new mongoose.Types.ObjectId(authResult.id),
          read: false,
        });
        await notification.save();
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail the request if notification fails
    }

    // Populate for response
    await game.populate('hostId', 'name email image');
    await game.populate('registeredPlayers.userId', 'name email image');

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
      seatsLeft: game.maxPlayers - game.registeredPlayers.length,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedGame,
      message: `Player removed successfully`,
    });
  } catch (error: any) {
    console.error('Error removing player:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove player' },
      { status: 500 }
    );
  }
}

