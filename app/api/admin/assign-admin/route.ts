import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

/**
 * POST /api/admin/assign-admin
 * Assign admin role to a user by email
 * REQUIRES ADMIN_SECRET_KEY environment variable and matching secretKey in request
 * This is for initial admin setup only
 */
export async function POST(request: NextRequest) {
  try {
    const { email, secretKey } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Secret key is REQUIRED for security
    const requiredSecretKey = process.env.ADMIN_SECRET_KEY;
    
    if (!requiredSecretKey) {
      console.error('ADMIN_SECRET_KEY environment variable is not set');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: ADMIN_SECRET_KEY not configured' },
        { status: 500 }
      );
    }

    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: 'Secret key is required' },
        { status: 400 }
      );
    }

    if (secretKey !== requiredSecretKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid secret key' },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, error: `User with email ${email} not found` },
        { status: 404 }
      );
    }

    if (user.role === 'admin') {
      return NextResponse.json({
        success: true,
        message: `User ${email} is already an admin`,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Update the role
    user.role = 'admin';
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Successfully assigned admin role to ${email}`,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error assigning admin role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign admin role' },
      { status: 500 }
    );
  }
}
