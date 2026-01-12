import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/admin/games/[id] - Get game details with members (admin only)
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
        { success: false, error: 'Invalid game ID' },
        { status: 400 }
      );
    }

    const game = await Game.findById(id)
      .populate('hostId', 'name email image phoneNumber')
      .populate('registeredPlayers.userId', 'name email image phoneNumber whatsApp')
      .lean();

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    // Transform game data
    const transformedGame = {
      id: game._id.toString(),
      title: game.title,
      sport: game.sport,
      description: game.description,
      location: {
        address: game.location?.address || '',
        city: game.location?.city || '',
        country: game.location?.country || '',
      },
      date: game.date,
      startTime: game.startTime,
      endTime: game.endTime,
      maxPlayers: game.maxPlayers,
      skillLevel: game.skillLevel,
      status: game.status,
      image: game.image || '/default-game.jpg',
      createdAt: game.createdAt,
      host: {
        id: game.hostId?._id?.toString() || game.hostId?.toString() || '',
        name: game.hostId?.name || 'Unknown',
        email: game.hostId?.email || '',
        image: game.hostId?.image || '/placeholder-user.jpg',
        phoneNumber: game.hostId?.phoneNumber || '',
      },
      members: (game.registeredPlayers || []).map((player: any) => ({
        id: player.userId?._id?.toString() || player.userId?.toString() || '',
        name: player.name || player.userId?.name || 'Unknown',
        email: player.userId?.email || '',
        image: player.image || player.userId?.image || '/placeholder-user.jpg',
        phoneNumber: player.userId?.phoneNumber || '',
        whatsApp: player.whatsApp || player.userId?.whatsApp || '',
        age: player.age,
        skillLevel: player.skillLevel,
        joinedAt: player.joinedAt,
      })),
    };

    return NextResponse.json({
      success: true,
      game: transformedGame,
    });
  } catch (error: any) {
    console.error('Error fetching game details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game details' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/games/[id] - Delete a game (admin only)
export async function DELETE(
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
        { success: false, error: 'Invalid game ID' },
        { status: 400 }
      );
    }

    // Get game details before deletion
    const game = await Game.findById(id).lean();
    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    // Get all reports for this game
    const Report = (await import('@/lib/db/models/Report')).default;
    const Notification = (await import('@/lib/db/models/Notification')).default;
    
    const reports = await Report.find({
      gameId: new mongoose.Types.ObjectId(id),
      status: { $ne: 'resolved' } // Only process unresolved reports
    }).select('reportedBy').lean();

    // Get unique user IDs who reported this game
    const reporterIds = [...new Set(
      reports.map((report: any) => report.reportedBy?.toString()).filter(Boolean)
    )];

    // Mark all reports as resolved
    await Report.updateMany(
      { gameId: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          status: 'resolved',
          action: 'delete',
          actionReason: 'Game deleted by administrator',
          actionDate: new Date(),
          resolvedBy: new mongoose.Types.ObjectId(authResult.id),
        }
      }
    );

    // Send notifications to all users who reported the game
    if (reporterIds.length > 0) {
      const gameTitle = (game as any).title || 'the reported game';
      const notifications = reporterIds.map((reporterId) => ({
        userId: new mongoose.Types.ObjectId(reporterId),
        type: 'admin_message',
        title: 'Report Resolved - Thank You',
        message: `Thank you for your report regarding "${gameTitle}". We have reviewed your report and taken appropriate action. The game has been removed from the platform. Your contribution helps us maintain a safe and enjoyable community for everyone.`,
        read: false,
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    // Delete associated messages
    const Message = (await import('@/lib/db/models/Message')).default;
    await Message.deleteMany({ gameId: new mongoose.Types.ObjectId(id) });

    // Delete the game
    await Game.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Game deleted successfully',
      reportsResolved: reports.length,
      notificationsSent: reporterIds.length,
    });
  } catch (error: any) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete game' },
      { status: 500 }
    );
  }
}
