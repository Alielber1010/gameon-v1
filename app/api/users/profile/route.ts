import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import Game from '@/lib/db/models/Game';

// GET /api/users/profile - Get current user profile
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

    await connectDB();

    // Get user from database
    const user = await User.findById(authResult.id).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user stats
    const gamesHosted = await Game.countDocuments({ hostId: new mongoose.Types.ObjectId(authResult.id) });
    const gamesJoined = await Game.countDocuments({
      'registeredPlayers.userId': new mongoose.Types.ObjectId(authResult.id)
    });

    // Transform user data
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image || '/placeholder.svg',
      role: user.role || 'user',
      bio: user.bio || '',
      phoneNumber: user.phoneNumber || '',
      location: user.location || '',
      interests: user.interests || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      gamesPlayed: user.gamesPlayed || 0,
      averageRating: user.averageRating || 0,
      totalRatings: user.totalRatings || 0,
      stats: {
        gamesHosted,
        gamesJoined,
      },
    };

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/users/profile - Update user profile
export async function PUT(request: NextRequest) {
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

    await connectDB();

    const body = await request.json();
    const { name, bio, phoneNumber, location, interests, image } = body;

    // Validate user exists
    const user = await User.findById(authResult.id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (location !== undefined) user.location = location;
    if (image !== undefined) user.image = image;
    if (interests !== undefined) {
      // Validate max 5 interests
      if (Array.isArray(interests) && interests.length <= 5) {
        user.interests = interests.filter((interest: string) => interest && interest.trim().length > 0);
      }
    }

    await user.save();

    // Get updated stats
    const gamesHosted = await Game.countDocuments({ hostId: new mongoose.Types.ObjectId(authResult.id) });
    const gamesJoined = await Game.countDocuments({
      'registeredPlayers.userId': new mongoose.Types.ObjectId(authResult.id)
    });

    // Return updated user data
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image || '/placeholder.svg',
      role: user.role || 'user',
      bio: user.bio || '',
      phoneNumber: user.phoneNumber || '',
      location: user.location || '',
      interests: user.interests || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        gamesHosted,
        gamesJoined,
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: userData,
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}


