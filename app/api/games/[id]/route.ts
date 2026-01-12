import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import { SPORTS } from '@/lib/constants/sports';

// GET /api/games/[id] - Get a single game by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid game ID' },
        { status: 400 }
      );
    }

    const game = await Game.findById(id)
      .populate('hostId', 'name email image')
      .populate('registeredPlayers.userId', 'name email image')
      .populate('joinRequests.userId', 'name email image')
      .populate('attendance.userId', 'name email image')
      .populate('attendance.markedBy', 'name email image')
      .lean();

    if (!game || Array.isArray(game)) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    // Type assertion: findById().lean() returns a single document or null, not an array
    const gameDoc = game as any;

    const transformedGame = {
      id: gameDoc._id.toString(),
      hostId: gameDoc.hostId._id?.toString() || gameDoc.hostId.toString(),
      hostName: gameDoc.hostId.name || gameDoc.hostId,
      hostImage: gameDoc.hostId.image || null,
      title: gameDoc.title,
      sport: gameDoc.sport,
      description: gameDoc.description,
      location: gameDoc.location,
      date: gameDoc.date,
      startTime: gameDoc.startTime,
      endTime: gameDoc.endTime,
      maxPlayers: gameDoc.maxPlayers,
      skillLevel: gameDoc.skillLevel,
      minSkillLevel: gameDoc.minSkillLevel,
      image: gameDoc.image,
      status: gameDoc.status,
      hostWhatsApp: gameDoc.hostWhatsApp,
      registeredPlayers: gameDoc.registeredPlayers?.map((player: any) => ({
        id: player._id?.toString(),
        userId: player.userId._id?.toString() || player.userId.toString(),
        name: player.name,
        age: player.age,
        skillLevel: player.skillLevel,
        image: player.image,
        whatsApp: player.whatsApp,
        joinedAt: player.joinedAt,
      })) || [],
      teamBlue: gameDoc.teamBlue || [],
      teamRed: gameDoc.teamRed || [],
      joinRequests: gameDoc.joinRequests?.map((request: any) => ({
        id: request._id?.toString(),
        userId: request.userId._id?.toString() || request.userId.toString(),
        userName: request.name,
        userAge: request.age,
        userSkillLevel: request.skillLevel,
        userImage: request.image,
        userWhatsApp: request.whatsApp,
        requestDate: request.requestedAt,
      })) || [],
      attendance: gameDoc.attendance?.map((att: any) => ({
        userId: att.userId._id?.toString() || att.userId.toString(),
        userName: att.userId.name || att.userId,
        userImage: att.userId.image || null,
        attended: att.attended,
        markedAt: att.markedAt,
        markedBy: att.markedBy?._id?.toString() || att.markedBy?.toString(),
      })) || [],
      seatsLeft: gameDoc.maxPlayers - (gameDoc.registeredPlayers?.length || 0),
      createdAt: gameDoc.createdAt,
      updatedAt: gameDoc.updatedAt,
      // Include original date for time comparison
      originalDate: gameDoc.date,
    };

    return NextResponse.json({
      success: true,
      data: transformedGame,
    });
  } catch (error: any) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}

// PATCH /api/games/[id] - Update a game
export async function PATCH(
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
        { success: false, error: 'Only the host can update this game' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      sport,
      description,
      location,
      date,
      startTime,
      endTime,
      maxPlayers,
      skillLevel,
      minSkillLevel,
      image,
      hostWhatsApp,
      status,
    } = body;

    // Update allowed fields
    if (title !== undefined) game.title = title;
    if (sport !== undefined) {
      if (!SPORTS.includes(sport as any)) {
        return NextResponse.json(
          { success: false, error: 'Invalid sport' },
          { status: 400 }
        );
      }
      game.sport = sport;
    }
    if (description !== undefined) game.description = description;
    if (location !== undefined) game.location = location;
    if (date !== undefined) game.date = new Date(date);
    if (startTime !== undefined) game.startTime = startTime;
    if (endTime !== undefined) game.endTime = endTime;
    if (maxPlayers !== undefined) {
      if (maxPlayers < 2) {
        return NextResponse.json(
          { success: false, error: 'maxPlayers must be at least 2' },
          { status: 400 }
        );
      }
      // Don't allow reducing maxPlayers below current player count
      if (maxPlayers < game.registeredPlayers.length) {
        return NextResponse.json(
          { success: false, error: `maxPlayers cannot be less than current player count (${game.registeredPlayers.length})` },
          { status: 400 }
        );
      }
      game.maxPlayers = maxPlayers;
    }
    if (skillLevel !== undefined) {
      const validLevels = ['beginner', 'intermediate', 'advanced', 'all'];
      if (!validLevels.includes(skillLevel)) {
        return NextResponse.json(
          { success: false, error: 'Invalid skill level' },
          { status: 400 }
        );
      }
      game.skillLevel = skillLevel;
    }
    if (minSkillLevel !== undefined) game.minSkillLevel = minSkillLevel;
    if (image !== undefined) game.image = image;
    if (hostWhatsApp !== undefined) game.hostWhatsApp = hostWhatsApp;
    if (status !== undefined) {
      const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }
      game.status = status;
    }

    await game.save();
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
    });
  } catch (error: any) {
    console.error('Error updating game:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update game' },
      { status: 500 }
    );
  }
}

// DELETE /api/games/[id] - Delete a game
export async function DELETE(
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
        { success: false, error: 'Only the host can delete this game' },
        { status: 403 }
      );
    }

    await Game.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Game deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete game' },
      { status: 500 }
    );
  }
}

