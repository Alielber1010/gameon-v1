import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth';

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const showBanned = searchParams.get('showBanned'); // 'true', 'false', or null

    // Build query
    const query: any = {
      role: { $ne: 'admin' } // Exclude admin users from the list
    };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by banned status
    if (showBanned === 'true') {
      // Show only banned users
      query.isBanned = true;
    } else if (showBanned === 'false') {
      // Show only non-banned users
      query.isBanned = { $ne: true };
    }
    // If showBanned is null/undefined, show all users

    // Get users with pagination
    const users = await User.find(query)
      .select('name email image role bio phoneNumber location gamesPlayed averageRating totalRatings createdAt isBanned bannedAt banReason')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Transform users for frontend
    const transformedUsers = users.map((user: any) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image || '/placeholder-user.jpg',
      role: user.role || 'user',
      bio: user.bio || '',
      phoneNumber: user.phoneNumber || '',
      location: user.location || '',
      gamesPlayed: user.gamesPlayed || 0,
      averageRating: user.averageRating || 0,
      totalRatings: user.totalRatings || 0,
      createdAt: user.createdAt,
      isBanned: user.isBanned || false,
      bannedAt: user.bannedAt,
      banReason: user.banReason,
    }));

    return NextResponse.json({
      success: true,
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
