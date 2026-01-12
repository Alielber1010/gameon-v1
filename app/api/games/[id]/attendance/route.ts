import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import User from '@/lib/db/models/User';
import Notification from '@/lib/db/models/Notification';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// POST /api/games/[id]/attendance - Mark attendance for players
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
        { success: false, error: 'Only the host can mark attendance' },
        { status: 403 }
      );
    }

    // Allow marking attendance if game is not cancelled
    // Host can mark attendance anytime (before, during, or after game)
    if (game.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cannot mark attendance for a cancelled game' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { playerIds, markAll } = body; // playerIds: array of userIds to mark as attended, markAll: boolean

    // Get all players (host + registered players)
    const allPlayerIds = [
      game.hostId.toString(),
      ...game.registeredPlayers.map((p: any) => p.userId.toString())
    ];

    // Initialize attendance array if it doesn't exist
    if (!game.attendance || game.attendance.length === 0) {
      game.attendance = allPlayerIds.map((userId: string) => ({
        userId: new mongoose.Types.ObjectId(userId),
        attended: false,
      }));
    }

    // Mark attendance
    const markedPlayerIds: string[] = [];
    
    if (markAll) {
      // Mark all players as attended
      game.attendance = game.attendance.map((att: any) => {
        if (!att.attended) {
          markedPlayerIds.push(att.userId.toString());
        }
        return {
          ...att.toObject(),
          attended: true,
          markedAt: new Date(),
          markedBy: new mongoose.Types.ObjectId(authResult.id),
        };
      });
    } else if (playerIds && Array.isArray(playerIds)) {
      // Mark specific players
      playerIds.forEach((playerId: string) => {
        const attendanceIndex = game.attendance.findIndex(
          (att: any) => att.userId.toString() === playerId
        );
        
        if (attendanceIndex >= 0) {
          const att = game.attendance[attendanceIndex];
          if (!att.attended) {
            markedPlayerIds.push(playerId);
          }
          game.attendance[attendanceIndex] = {
            ...att.toObject(),
            attended: true,
            markedAt: new Date(),
            markedBy: new mongoose.Types.ObjectId(authResult.id),
          };
        }
      });
    }

    // Send notifications to marked players
    if (markedPlayerIds.length > 0) {
      const notifications = markedPlayerIds.map((playerId: string) => ({
        userId: new mongoose.Types.ObjectId(playerId),
        type: 'game_attended',
        title: 'Game Attendance Confirmed',
        message: `Your attendance for "${game.title}" has been confirmed by the host. Enjoy your game!`,
        gameId: game._id,
        relatedUserId: new mongoose.Types.ObjectId(authResult.id),
        read: false,
      }));

      await Notification.insertMany(notifications);
    }

    // Check if all players are now marked as attended
    const allPlayersCount = 1 + game.registeredPlayers.length; // Host + registered players
    const attendedCount = game.attendance.filter((att: any) => att.attended).length;
    const allPlayersAttended = attendedCount === allPlayersCount && allPlayersCount > 0;

    // If all players are attended, mark game as completed
    if (allPlayersAttended && game.status !== 'completed') {
      game.status = 'completed';
      game.completedAt = new Date();
      game.completedBy = new mongoose.Types.ObjectId(authResult.id);

      // Send game_completed notifications to all players
      const allPlayerIds = [
        game.hostId.toString(),
        ...game.registeredPlayers.map((p: any) => p.userId.toString())
      ];

      const completionNotifications = allPlayerIds.map((playerId: string) => ({
        userId: new mongoose.Types.ObjectId(playerId),
        type: 'game_completed',
        title: 'Game Completed',
        message: `The game "${game.title}" has been completed! You can now rate other players.`,
        gameId: game._id,
        relatedUserId: new mongoose.Types.ObjectId(authResult.id),
        read: false,
      }));

      await Notification.insertMany(completionNotifications);

      // Update activity history for all players
      const User = (await import('@/lib/db/models/User')).default;
      for (const playerId of allPlayerIds) {
        const user = await User.findById(playerId);
        if (user) {
          // Increment games played
          user.gamesPlayed = (user.gamesPlayed || 0) + 1;
          
          // Add to activity history
          if (!user.activityHistory) {
            user.activityHistory = [];
          }
          user.activityHistory.push({
            gameId: game._id,
            playedAt: new Date(),
          });
          
          await user.save();
        }
      }
    }

    await game.save();

    // Populate for response
    await game.populate('hostId', 'name email image');
    await game.populate('registeredPlayers.userId', 'name email image');
    await game.populate('attendance.userId', 'name email image');
    await game.populate('attendance.markedBy', 'name email image');

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
      attendance: game.attendance?.map((att: any) => ({
        userId: att.userId._id?.toString() || att.userId.toString(),
        userName: att.userId.name || att.userId,
        userImage: att.userId.image || null,
        attended: att.attended,
        markedAt: att.markedAt,
        markedBy: att.markedBy?._id?.toString() || att.markedBy?.toString(),
      })) || [],
      seatsLeft: game.maxPlayers - game.registeredPlayers.length,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
      completedAt: game.completedAt,
      completedBy: game.completedBy?._id?.toString() || game.completedBy?.toString(),
      // Include original date for time comparison
      originalDate: game.date,
    };

    return NextResponse.json({
      success: true,
      data: transformedGame,
      message: `Attendance marked for ${markedPlayerIds.length} player(s)`,
    });
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}

