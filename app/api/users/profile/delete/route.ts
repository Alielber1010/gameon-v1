import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import Game from '@/lib/db/models/Game';
import Notification from '@/lib/db/models/Notification';
import Message from '@/lib/db/models/Message';
import Report from '@/lib/db/models/Report';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// DELETE /api/users/profile/delete - Delete current user's account
export async function DELETE(request: NextRequest) {
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

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin accounts cannot be deleted' },
        { status: 403 }
      );
    }

    console.log(`[DeleteAccount] Deleting user account: ${user.email}`);

    // Delete user's notifications
    await Notification.deleteMany({ userId });
    console.log('[DeleteAccount] Deleted user notifications');

    // Delete user's messages
    await Message.deleteMany({ userId });
    console.log('[DeleteAccount] Deleted user messages');

    // Delete user's reports (reports they created)
    await Report.deleteMany({ reportedBy: userId });
    console.log('[DeleteAccount] Deleted user reports');

    // Remove user from games where they are registered players
    await Game.updateMany(
      { 'registeredPlayers.userId': userId },
      { $pull: { registeredPlayers: { userId } } }
    );
    console.log('[DeleteAccount] Removed user from registered players');

    // Remove user from join requests
    await Game.updateMany(
      { 'joinRequests.userId': userId },
      { $pull: { joinRequests: { userId } } }
    );
    console.log('[DeleteAccount] Removed user from join requests');

    // Remove user from attendance records
    await Game.updateMany(
      { 'attendance.userId': userId },
      { $pull: { attendance: { userId } } }
    );
    console.log('[DeleteAccount] Removed user from attendance records');

    // Handle games where user is the host
    // Option 1: Delete the games (if no other players)
    // Option 2: Transfer host to another player or mark as cancelled
    // For now, we'll cancel games where user is the only host
    const hostedGames = await Game.find({ hostId: userId });
    for (const game of hostedGames) {
      // If game has other players, we could transfer host, but for simplicity, cancel it
      game.status = 'cancelled';
      await game.save();
    }
    console.log(`[DeleteAccount] Cancelled ${hostedGames.length} hosted games`);

    // Delete the user account
    await User.findByIdAndDelete(userId);
    console.log('[DeleteAccount] User account deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
