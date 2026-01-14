import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// POST /api/admin/users/[id]/ban - Ban a user (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[BanAPI] POST request received for user ID:', params.id)
    
    // Authenticate and check admin role
    let authResult;
    try {
      authResult = await requireAuth();
      console.log('[BanAPI] Auth result:', { id: authResult.id, role: authResult.role })
    } catch (error) {
      console.log('[BanAPI] Auth failed:', error)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!authResult || authResult.role !== 'admin') {
      console.log('[BanAPI] Not admin user:', authResult)
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();
    console.log('[BanAPI] Database connected')

    const { id } = params;
    const body = await request.json();
    const { reason } = body;
    console.log('[BanAPI] Request body:', { reason })

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('[BanAPI] Invalid user ID:', id)
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Find the user to ban
    const user = await User.findById(id);
    console.log('[BanAPI] User found:', user ? { id: user._id, name: user.name, isBanned: user.isBanned } : 'null')
    
    if (!user) {
      console.log('[BanAPI] User not found')
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent banning admin users and master admin
    const MASTER_ADMIN_EMAIL = 'ali.melbermawy@gmail.com';
    
    if (user.role === 'admin') {
      console.log('[BanAPI] Attempted to ban admin user')
      return NextResponse.json(
        { success: false, error: 'Cannot ban admin users' },
        { status: 403 }
      );
    }
    
    if (user.email === MASTER_ADMIN_EMAIL) {
      console.log('[BanAPI] Attempted to ban master admin')
      return NextResponse.json(
        { success: false, error: 'Cannot ban the master admin account' },
        { status: 403 }
      );
    }

    // Check if user is already banned
    if (user.isBanned) {
      console.log('[BanAPI] User is already banned')
      return NextResponse.json(
        { success: false, error: 'User is already banned' },
        { status: 400 }
      );
    }

    // Ban the user
    console.log('[BanAPI] Banning user...')
    user.isBanned = true;
    user.bannedAt = new Date();
    user.bannedBy = new mongoose.Types.ObjectId(authResult.id);
    user.banReason = reason || 'Account banned by administrator';
    
    const savedUser = await user.save();
    console.log('[BanAPI] User banned successfully:', {
      id: savedUser._id,
      isBanned: savedUser.isBanned,
      bannedAt: savedUser.bannedAt,
      banReason: savedUser.banReason
    })

    return NextResponse.json({
      success: true,
      message: 'User has been permanently banned',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isBanned: user.isBanned,
        bannedAt: user.bannedAt,
        banReason: user.banReason,
      },
    });
  } catch (error: any) {
    console.error('[BanAPI] Error banning user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to ban user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id]/ban - Unban a user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[UnbanAPI] DELETE request received for user ID:', params.id)
    
    // Authenticate and check admin role
    let authResult;
    try {
      authResult = await requireAuth();
      console.log('[UnbanAPI] Auth result:', { id: authResult.id, role: authResult.role })
    } catch (error) {
      console.log('[UnbanAPI] Auth failed:', error)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!authResult || authResult.role !== 'admin') {
      console.log('[UnbanAPI] Not admin user:', authResult)
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();
    console.log('[UnbanAPI] Database connected')

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('[UnbanAPI] Invalid user ID:', id)
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Find the user to unban
    const user = await User.findById(id);
    console.log('[UnbanAPI] User found:', user ? { id: user._id, name: user.name, isBanned: user.isBanned } : 'null')
    
    if (!user) {
      console.log('[UnbanAPI] User not found')
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is banned
    if (!user.isBanned) {
      console.log('[UnbanAPI] User is not banned')
      return NextResponse.json(
        { success: false, error: 'User is not banned' },
        { status: 400 }
      );
    }

    // Unban the user
    console.log('[UnbanAPI] Unbanning user...')
    user.isBanned = false;
    user.bannedAt = undefined;
    user.bannedBy = undefined;
    user.banReason = undefined;
    
    const savedUser = await user.save();
    console.log('[UnbanAPI] User unbanned successfully:', {
      id: savedUser._id,
      isBanned: savedUser.isBanned
    })

    return NextResponse.json({
      success: true,
      message: 'User has been unbanned',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isBanned: user.isBanned,
      },
    });
  } catch (error: any) {
    console.error('[UnbanAPI] Error unbanning user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unban user' },
      { status: 500 }
    );
  }
}