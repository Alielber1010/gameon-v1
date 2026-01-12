import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Game from '@/lib/db/models/Game';
import User from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// POST /api/games/[id]/rate-player - Rate a player in a completed game
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    let authResult;
    try {
      authResult = await requireAuth();
    } catch (error) {
      console.error('[RATE-PLAYER] Auth failed:', error);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (!authResult || !authResult.id) {
      console.error('[RATE-PLAYER] No auth result or user ID');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = params;
    console.log('[RATE-PLAYER] Game ID:', id, 'User ID:', authResult.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('[RATE-PLAYER] Invalid game ID:', id);
      return NextResponse.json(
        { success: false, error: 'Invalid game ID' },
        { status: 400 }
      );
    }

    const game = await Game.findById(id);

    if (!game) {
      console.error('[RATE-PLAYER] Game not found:', id);
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    console.log('[RATE-PLAYER] Game status:', game.status);

    // Check if game is completed
    if (game.status !== 'completed') {
      console.error('[RATE-PLAYER] Game not completed. Status:', game.status);
      return NextResponse.json(
        { success: false, error: `Can only rate players in completed games. Current status: ${game.status}` },
        { status: 400 }
      );
    }

    // Check if user participated in this game (as host or player)
    const userId = new mongoose.Types.ObjectId(authResult.id);
    const isHost = game.hostId.toString() === userId.toString();
    const isPlayer = game.registeredPlayers.some((p: any) => 
      p.userId.toString() === userId.toString()
    );

    console.log('[RATE-PLAYER] User participation - isHost:', isHost, 'isPlayer:', isPlayer);

    if (!isHost && !isPlayer) {
      console.error('[RATE-PLAYER] User not in game');
      return NextResponse.json(
        { success: false, error: 'You can only rate players in games you participated in' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { playerId, rating, comment } = body;
    console.log('[RATE-PLAYER] Rating request - playerId:', playerId, 'rating:', rating);

    // Validation
    if (!playerId || !rating) {
      console.error('[RATE-PLAYER] Missing fields - playerId:', playerId, 'rating:', rating);
      return NextResponse.json(
        { success: false, error: 'Missing required fields: playerId, rating' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      console.error('[RATE-PLAYER] Invalid rating:', rating);
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if player exists in the game
    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      console.error('[RATE-PLAYER] Invalid player ID format:', playerId);
      return NextResponse.json(
        { success: false, error: 'Invalid player ID' },
        { status: 400 }
      );
    }

    const playerIdObj = new mongoose.Types.ObjectId(playerId);
    const gameHostIdStr = game.hostId.toString();
    const isRatedPlayerHost = gameHostIdStr === playerId || gameHostIdStr === playerIdObj.toString();
    
    const isRatedPlayer = game.registeredPlayers.some((p: any) => {
      const pUserIdStr = p.userId?.toString() || p.userId;
      return pUserIdStr === playerId || pUserIdStr === playerIdObj.toString();
    });

    console.log('[RATE-PLAYER] Player check - isHost:', isRatedPlayerHost, 'isPlayer:', isRatedPlayer);

    if (!isRatedPlayerHost && !isRatedPlayer) {
      console.error('[RATE-PLAYER] Player not found in game');
      return NextResponse.json(
        { success: false, error: 'Player not found in this game' },
        { status: 404 }
      );
    }

    // Can't rate yourself
    const currentUserIdStr = userId.toString();
    if (playerId === authResult.id || playerIdObj.toString() === currentUserIdStr) {
      console.error('[RATE-PLAYER] User trying to rate themselves');
      return NextResponse.json(
        { success: false, error: 'You cannot rate yourself' },
        { status: 400 }
      );
    }

    // First, check if the rater has already rated this player for this game
    const raterUser = await User.findById(authResult.id);
    console.log('[RATE-PLAYER] Rater user found:', !!raterUser);
    
    if (raterUser) {
      const raterActivityEntry = raterUser.activityHistory?.find((entry: any) => {
        const entryGameId = entry.gameId?.toString() || entry.gameId;
        return entryGameId === id || entryGameId === new mongoose.Types.ObjectId(id).toString();
      });
      
      console.log('[RATE-PLAYER] Rater activity entry:', !!raterActivityEntry);
      console.log('[RATE-PLAYER] Players rated by user:', raterActivityEntry?.playersRated || []);
      
      if (raterActivityEntry?.playersRated && raterActivityEntry.playersRated.length > 0) {
        const alreadyRated = raterActivityEntry.playersRated.some((pid: any) => {
          const pidStr = pid?.toString() || pid;
          return pidStr === playerId || pidStr === playerIdObj.toString();
        });
        
        console.log('[RATE-PLAYER] Already rated:', alreadyRated);
        
        if (alreadyRated) {
          console.error('[RATE-PLAYER] Duplicate rating attempt');
          return NextResponse.json(
            { success: false, error: 'You have already rated this player for this game. You can only rate each player once per game.' },
            { status: 400 }
          );
        }
      }
    }

    // Get the user being rated
    const ratedUser = await User.findById(playerId);
    if (!ratedUser) {
      console.error('[RATE-PLAYER] Rated user not found');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[RATE-PLAYER] Rated user found:', ratedUser.name);

    // Find or create activity history entry for this game
    let activityEntry = ratedUser.activityHistory?.find((entry: any) => {
      const entryGameId = entry.gameId?.toString() || entry.gameId;
      return entryGameId === id || entryGameId === new mongoose.Types.ObjectId(id).toString();
    });

    console.log('[RATE-PLAYER] Rated user activity entry:', !!activityEntry);

    if (!activityEntry) {
      console.log('[RATE-PLAYER] Creating new activity entry for rated user');
      // Create new activity history entry
      if (!ratedUser.activityHistory) {
        ratedUser.activityHistory = [];
      }
      activityEntry = {
        gameId: new mongoose.Types.ObjectId(id),
        sport: game.sport,
        date: game.date,
        attended: true,
        ratingGiven: false,
        ratingsReceived: [],
      };
      ratedUser.activityHistory.push(activityEntry);
    }

    // Double-check: Check if user already rated this player for this game (backup check)
    console.log('[RATE-PLAYER] Ratings received by player:', activityEntry.ratingsReceived || []);
    
    const existingRating = activityEntry.ratingsReceived?.find((r: any) => {
      const raterId = r.fromUserId?.toString() || r.fromUserId;
      return raterId === authResult.id || raterId === userId.toString();
    });

    console.log('[RATE-PLAYER] Existing rating found:', !!existingRating);

    if (existingRating) {
      // User already rated this player for this game - prevent duplicate rating
      console.error('[RATE-PLAYER] Duplicate rating in ratingsReceived array');
      return NextResponse.json(
        { success: false, error: 'You have already rated this player for this game. You can only rate each player once per game.' },
        { status: 400 }
      );
    }

    // Add new rating
    if (!activityEntry.ratingsReceived) {
      activityEntry.ratingsReceived = [];
    }
    activityEntry.ratingsReceived.push({
      fromUserId: userId,
      rating,
      comment: comment || '',
      createdAt: new Date(),
    });

    // Also track in the rater's (current user's) activity history which players they've rated
    if (raterUser) {
      let raterActivityEntry = raterUser.activityHistory?.find((entry: any) => {
        const entryGameId = entry.gameId?.toString() || entry.gameId;
        return entryGameId === id || entryGameId === new mongoose.Types.ObjectId(id).toString();
      });

      console.log('[RATE-PLAYER] Rater activity entry before update:', raterActivityEntry);

      if (!raterActivityEntry) {
        console.log('[RATE-PLAYER] Creating new rater activity entry');
        if (!raterUser.activityHistory) {
          raterUser.activityHistory = [];
        }
        raterActivityEntry = {
          gameId: new mongoose.Types.ObjectId(id),
          sport: game.sport,
          date: game.date,
          attended: isHost || isPlayer,
          ratingGiven: false,
          playersRated: [], // Track which players this user has rated
          ratingsReceived: [],
        };
        raterUser.activityHistory.push(raterActivityEntry);
      }

      // Track that this user has rated this player
      if (!raterActivityEntry.playersRated) {
        raterActivityEntry.playersRated = [];
      }
      
      console.log('[RATE-PLAYER] Adding player to rated list:', playerId);
      
      // Add player to rated list (ensure we're modifying the actual entry in the array)
      const entryIndex = raterUser.activityHistory?.findIndex((entry: any) => {
        const entryGameId = entry.gameId?.toString() || entry.gameId;
        return entryGameId === id || entryGameId === new mongoose.Types.ObjectId(id).toString();
      });
      
      if (entryIndex !== undefined && entryIndex >= 0) {
        raterUser.activityHistory[entryIndex].playersRated.push(new mongoose.Types.ObjectId(playerId));
        raterUser.activityHistory[entryIndex].ratingGiven = true;
        raterUser.markModified('activityHistory');
        console.log('[RATE-PLAYER] Updated playersRated array:', raterUser.activityHistory[entryIndex].playersRated);
      }
      
      await raterUser.save();
      console.log('[RATE-PLAYER] Rater user saved');
    }

    // Update user's average rating
    const allRatings = ratedUser.activityHistory?.flatMap((entry: any) => 
      entry.ratingsReceived || []
    ) || [];
    
    if (allRatings.length > 0) {
      const totalRating = allRatings.reduce((sum: number, r: any) => sum + r.rating, 0);
      ratedUser.averageRating = totalRating / allRatings.length;
      ratedUser.totalRatings = allRatings.length;
    }

    await ratedUser.save();

    console.log('[RATE-PLAYER] Rating saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully',
    });
  } catch (error: any) {
    console.error('[RATE-PLAYER] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}

