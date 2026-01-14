import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// PUT /api/admin/users/[id]/role - Update user role (admin only)
export async function PUT(
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
    const body = await request.json();
    const { role, secretKey } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Validate role
    if (!role || !['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be "user" or "admin"' },
        { status: 400 }
      );
    }

    // Require admin password for role changes
    const ADMIN_PASSWORD = "t9rmQXsQj9b0K37J3rkBIncdXxD8WPd2";

    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: 'Admin password is required to change user roles' },
        { status: 400 }
      );
    }

    if (secretKey !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin password' },
        { status: 403 }
      );
    }

    // Find the user
    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent removing admin role from yourself
    if (user._id.toString() === authResult.id && role === 'user') {
      return NextResponse.json(
        { success: false, error: 'Cannot remove admin role from yourself' },
        { status: 403 }
      );
    }

    // Update the role
    user.role = role;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}
