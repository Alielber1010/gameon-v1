import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

/**
 * GET /api/users/check-email?email=...
 * Check if a user exists with the given email
 * Returns: { exists: boolean, isBanned?: boolean }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).select('isBanned');

    if (!user) {
      return NextResponse.json({
        success: true,
        exists: false,
      });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      isBanned: user.isBanned || false,
    });
  } catch (error: any) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check email' },
      { status: 500 }
    );
  }
}
