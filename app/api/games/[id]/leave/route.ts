import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// POST /api/games/[id]/leave - Leave a game
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
    const isHost = game.hostId.toString() === authResult.id;
    
    if (isHost) {
      // Host can only leave if there are no registered players
      // (They should transfer host to someone else first if there are players)
      if (game.registeredPlayers && game.registeredPlayers.length > 0) {
      return NextResponse.json(
          { success: false, error: 'Host cannot leave while there are registered players. Please transfer host ownership to another player first.' },
        { status: 400 }
      );
      }
      
      // If no players, host can leave (delete the game)
      await Game.findByIdAndDelete(id);
      
      return NextResponse.json({
        success: true,
        message: 'Successfully left the game. The game has been deleted since there were no players.',
      });
    }

    // Check if user is a registered player
    const playerIndex = game.registeredPlayers.findIndex(
      (player: any) => player.userId.toString() === authResult.id
    );

    if (playerIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'You are not registered for this game' },
        { status: 400 }
      );
    }

    // Remove player from registeredPlayers
    game.registeredPlayers.splice(playerIndex, 1);

    // Also remove from teams if they're in any team
    game.teamBlue = game.teamBlue.filter(
      (player: any) => player.userId.toString() !== authResult.id
    );
    game.teamRed = game.teamRed.filter(
      (player: any) => player.userId.toString() !== authResult.id
    );

    // Also remove any pending join request if exists
    game.joinRequests = game.joinRequests.filter(
      (request: any) => request.userId.toString() !== authResult.id
    );

    await game.save();
    await game.populate('hostId', 'name email image');
    await game.populate('registeredPlayers.userId', 'name email image');

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
      seatsLeft: game.maxPlayers - game.registeredPlayers.length,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedGame,
      message: 'Successfully left the game',
    });
  } catch (error: any) {
    console.error('Error leaving game:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to leave game' },
      { status: 500 }
    );
  }
}

