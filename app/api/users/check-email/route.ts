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

    const user = await User.findOne({ email: email.toLowerCase() }).select('isBanned provider password');

    if (!user) {
      return NextResponse.json({
        success: true,
        exists: false,
      });
    }

    // Check if user signed up with Google
    // MongoDBAdapter stores OAuth accounts separately, but we check:
    // 1. If user has no password (Google accounts don't have passwords)
    // 2. If provider is explicitly set to 'google'
    // Note: We need to check password field with select('+password') to see if it exists
    const userWithPassword = await User.findOne({ email: email.toLowerCase() }).select('+password provider');
    const hasPassword = !!userWithPassword?.password;
    const isGoogleAccount = !hasPassword || userWithPassword?.provider === 'google';

    return NextResponse.json({
      success: true,
      exists: true,
      isBanned: user.isBanned || false,
      provider: user.provider || (isGoogleAccount ? 'google' : 'credentials'),
      isGoogleAccount,
    });
  } catch (error: any) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check email' },
      { status: 500 }
    );
  }
}
