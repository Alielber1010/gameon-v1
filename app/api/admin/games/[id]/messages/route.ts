import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Message from '@/lib/db/models/Message';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/admin/games/[id]/messages - Get all messages for a game (admin only)
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

    const messages = await Message.find({
      gameId: new mongoose.Types.ObjectId(id),
    })
      .sort({ createdAt: 1 }) // Oldest first
      .lean();

    const transformedMessages = messages.map((msg: any) => ({
      id: msg._id.toString(),
      userId: msg.userId?.toString() || msg.userId || '',
      userName: msg.userName,
      userImage: msg.userImage || '/placeholder-user.jpg',
      message: msg.message,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({
      success: true,
      messages: transformedMessages,
    });
  } catch (error: any) {
    console.error('Error fetching game messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game messages' },
      { status: 500 }
    );
  }
}
