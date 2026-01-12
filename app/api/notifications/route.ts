import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/db/models/Notification';
import { requireAuth } from '@/lib/auth';

// GET /api/notifications - Get all notifications for the current user
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const read = searchParams.get('read'); // 'true', 'false', or null for all
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query
    const query: any = { userId: authResult.id };
    if (read === 'true') {
      query.read = true;
    } else if (read === 'false') {
      query.read = false;
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .populate('gameId', 'title sport image')
      .populate('relatedUserId', 'name image')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get counts
    const totalCount = await Notification.countDocuments({ userId: authResult.id });
    const unreadCount = await Notification.countDocuments({ userId: authResult.id, read: false });

    // Transform notifications
    const transformedNotifications = notifications.map((notification: any) => ({
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      gameId: notification.gameId?._id?.toString() || notification.gameId?.toString() || null,
      gameTitle: notification.gameId?.title || null,
      gameSport: notification.gameId?.sport || null,
      gameImage: notification.gameId?.image || null,
      relatedUserId: notification.relatedUserId?._id?.toString() || notification.relatedUserId?.toString() || null,
      relatedUserName: notification.relatedUserId?.name || null,
      read: notification.read,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedNotifications,
      pagination: {
        total: totalCount,
        unread: unreadCount,
        limit,
        skip,
      },
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      await Notification.updateMany(
        { userId: authResult.id, read: false },
        { read: true, readAt: new Date() }
      );
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await Notification.updateMany(
        { _id: { $in: notificationIds }, userId: authResult.id },
        { read: true, readAt: new Date() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid request. Provide notificationIds array or markAllAsRead: true' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read',
    });
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}






