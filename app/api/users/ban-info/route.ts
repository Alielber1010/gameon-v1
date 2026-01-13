import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';

// GET /api/users/ban-info - Get ban information for a user (public endpoint for login page)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('isBanned banReason bannedAt')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isBanned) {
      return NextResponse.json(
        { success: false, error: 'User is not banned' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      banReason: user.banReason || 'Your account has been permanently banned for violating the GameOn policies.',
      bannedAt: user.bannedAt,
    });
  } catch (error: any) {
    console.error('Error fetching ban info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ban information' },
      { status: 500 }
    );
  }
}
