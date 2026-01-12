import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/db/models/Notification';
import User from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

interface SendNotificationRequest {
  userId?: string; // If provided, send to specific user. If not provided, send to all users
  title: string;
  message: string;
  gameId?: string; // Optional game reference
  relatedUserId?: string; // Optional related user reference
}

// POST /api/admin/notifications/send - Send notification to user(s) (admin only)
export async function POST(request: NextRequest) {
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

    const body: SendNotificationRequest = await request.json();
    const { userId, title, message, gameId, relatedUserId } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Validate gameId if provided
    let gameObjectId: mongoose.Types.ObjectId | undefined;
    if (gameId) {
      if (!mongoose.Types.ObjectId.isValid(gameId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid gameId' },
          { status: 400 }
        );
      }
      gameObjectId = new mongoose.Types.ObjectId(gameId);
    }

    // Validate relatedUserId if provided
    let relatedUserObjectId: mongoose.Types.ObjectId | undefined;
    if (relatedUserId) {
      if (!mongoose.Types.ObjectId.isValid(relatedUserId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid relatedUserId' },
          { status: 400 }
        );
      }
      relatedUserObjectId = new mongoose.Types.ObjectId(relatedUserId);
    }

    let targetUserIds: mongoose.Types.ObjectId[] = [];
    let notificationCount = 0;

    if (userId) {
      // Send to specific user
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid userId' },
          { status: 400 }
        );
      }

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      targetUserIds = [new mongoose.Types.ObjectId(userId)];
    } else {
      // Send to all users (broadcast)
      const users = await User.find({}).select('_id').lean();
      targetUserIds = users.map((user: any) => new mongoose.Types.ObjectId(user._id));
    }

    // Create notifications for all target users
    const notifications = targetUserIds.map((targetUserId) => ({
      userId: targetUserId,
      type: 'admin_message',
      title,
      message,
      gameId: gameObjectId,
      relatedUserId: relatedUserObjectId,
      read: false,
    }));

    // Insert all notifications in bulk
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      notificationCount = notifications.length;
    }

    return NextResponse.json({
      success: true,
      message: userId
        ? `Notification sent to user successfully`
        : `Notification sent to ${notificationCount} users successfully`,
      notificationCount,
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
