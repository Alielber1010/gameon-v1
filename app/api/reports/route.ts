import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Report from '@/lib/db/models/Report';
import Game from '@/lib/db/models/Game';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/reports - Get all reports (admin only) or user's reports
export async function GET(request: NextRequest) {
  try {
    await connectDB();

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

    if (!authResult || !authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Check if user is admin
    const User = (await import('@/lib/db/models/User')).default;
    const user = await User.findById(authResult.id);
    const isAdmin = user?.role === 'admin';

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }

    // Non-admin users can only see their own reports
    if (!isAdmin) {
      query.reportedBy = new mongoose.Types.ObjectId(authResult.id);
    }

    // Execute query with pagination
    const reports = await Report.find(query)
      .populate('gameId', 'title sport image')
      .populate('userId', 'name email image')
      .populate('reportedBy', 'name email image')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Report.countDocuments(query);

    // Transform reports
    const transformedReports = reports.map((report: any) => {
      const transformed: any = {
        id: report._id.toString(),
        type: report.userId ? 'user' : 'game',
        reportedBy: {
          id: report.reportedBy._id?.toString() || report.reportedBy.toString(),
          name: report.reportedBy.name || 'Unknown User',
          email: report.reportedBy.email || '',
          image: report.reportedBy.image || '',
        },
        reportType: report.reportType,
        description: report.description,
        images: report.images || [],
        status: report.status,
        action: report.action,
        actionReason: report.actionReason,
        actionDate: report.actionDate,
        resolvedBy: report.resolvedBy ? {
          id: report.resolvedBy._id?.toString() || report.resolvedBy.toString(),
          name: report.resolvedBy.name || 'Unknown Admin',
        } : null,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      };

      if (report.gameId) {
        transformed.gameId = report.gameId._id?.toString() || report.gameId.toString();
        transformed.gameTitle = report.gameId.title || 'Unknown Game';
        transformed.gameSport = report.gameId.sport || '';
        transformed.gameImage = report.gameId.image || null;
      }

      if (report.userId) {
        transformed.userId = report.userId._id?.toString() || report.userId.toString();
        transformed.userName = report.userId.name || 'Unknown User';
        transformed.userEmail = report.userId.email || '';
        transformed.userImage = report.userId.image || null;
      }

      return transformed;
    });

    return NextResponse.json({
      success: true,
      data: transformedReports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
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

    if (!authResult || !authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { gameId, userId, reportType, description, images } = body;

    // Validation - must have either gameId or userId
    if (!gameId && !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: gameId or userId must be provided' },
        { status: 400 }
      );
    }

    if (!reportType || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: reportType, description' },
        { status: 400 }
      );
    }

    // Validate reportType
    const validReportTypes = ['spam', 'harassment', 'inappropriate', 'fake_scam', 'violence', 'other'];
    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report type' },
        { status: 400 }
      );
    }

    // Validate images (1-3 images)
    if (images && Array.isArray(images)) {
      if (images.length > 3) {
        return NextResponse.json(
          { success: false, error: 'Maximum 3 images allowed' },
          { status: 400 }
        );
      }
    }

    // Validate userId if provided
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Validate gameId if provided
    if (gameId && !mongoose.Types.ObjectId.isValid(gameId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid game ID' },
        { status: 400 }
      );
    }

    let game = null;
    if (gameId) {
      // Check if game exists
      game = await Game.findById(gameId);
      if (!game) {
        return NextResponse.json(
          { success: false, error: 'Game not found' },
          { status: 404 }
        );
      }
    }

    // If reporting a user, validate game context and user participation
    if (userId) {
      if (!gameId) {
        return NextResponse.json(
          { success: false, error: 'gameId is required when reporting a user' },
          { status: 400 }
        );
      }

      // Check if game is in "upcoming" status
      if (game.status !== 'upcoming') {
        return NextResponse.json(
          { success: false, error: 'Users can only be reported during the upcoming phase of a game' },
          { status: 400 }
        );
      }

      // Check if reporter is a registered player (not pending)
      const reporterId = new mongoose.Types.ObjectId(authResult.id);
      const isRegisteredPlayer = game.registeredPlayers?.some((player: any) => {
        const playerId = player.userId?.toString() || player.userId || player._id?.toString();
        return playerId === authResult.id;
      });

      const isHost = game.hostId?.toString() === authResult.id;

      if (!isRegisteredPlayer && !isHost) {
        // Check if user has a pending request
        const hasPendingRequest = game.joinRequests?.some((request: any) => {
          const requestUserId = request.userId?.toString() || request.userId || request._id?.toString();
          return requestUserId === authResult.id;
        });

        if (hasPendingRequest) {
          return NextResponse.json(
            { success: false, error: 'You can only report users after your join request has been accepted' },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { success: false, error: 'You must be a registered player to report other users' },
          { status: 403 }
        );
      }

      // Check if reported user is in the same game
      const reportedUserId = new mongoose.Types.ObjectId(userId);
      const isReportedUserInGame = game.registeredPlayers?.some((player: any) => {
        const playerId = player.userId?.toString() || player.userId || player._id?.toString();
        return playerId === userId;
      }) || game.hostId?.toString() === userId;

      if (!isReportedUserInGame) {
        return NextResponse.json(
          { success: false, error: 'The reported user is not a participant in this game' },
          { status: 400 }
        );
      }

      // Prevent self-reporting
      if (userId === authResult.id) {
        return NextResponse.json(
          { success: false, error: 'You cannot report yourself' },
          { status: 400 }
        );
      }
    }

    // Check if user already reported this game/user combination
    const existingReportQuery: any = {
      reportedBy: new mongoose.Types.ObjectId(authResult.id),
      status: 'pending',
    };

    if (gameId) {
      existingReportQuery.gameId = new mongoose.Types.ObjectId(gameId);
    }
    if (userId) {
      existingReportQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    const existingReport = await Report.findOne(existingReportQuery);

    if (existingReport) {
      if (userId) {
        return NextResponse.json(
          { success: false, error: 'You have already submitted a pending report for this user in this game' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { success: false, error: 'You have already submitted a pending report for this game' },
          { status: 400 }
        );
      }
    }

    // Create report
    const reportData: any = {
      reportedBy: new mongoose.Types.ObjectId(authResult.id),
      reportType,
      description,
      images: images || [],
      status: 'pending',
    };

    if (gameId) {
      reportData.gameId = new mongoose.Types.ObjectId(gameId);
    }
    if (userId) {
      reportData.userId = new mongoose.Types.ObjectId(userId);
    }

    const report = new Report(reportData);

    await report.save();

    // Populate references
    await report.populate('gameId', 'title sport image');
    await report.populate('userId', 'name email image');
    await report.populate('reportedBy', 'name email image');

    const transformedReport: any = {
      id: report._id.toString(),
      reportedBy: {
        id: report.reportedBy._id?.toString() || report.reportedBy.toString(),
        name: report.reportedBy.name || 'Unknown User',
      },
      reportType: report.reportType,
      description: report.description,
      images: report.images || [],
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };

    if (report.gameId) {
      transformedReport.gameId = report.gameId._id?.toString() || report.gameId.toString();
      transformedReport.gameTitle = (report.gameId as any).title || 'Unknown Game';
    }

    if (report.userId) {
      transformedReport.userId = report.userId._id?.toString() || report.userId.toString();
      transformedReport.userName = (report.userId as any).name || 'Unknown User';
      transformedReport.userEmail = (report.userId as any).email || '';
      transformedReport.userImage = (report.userId as any).image || '';
    }

    return NextResponse.json(
      { success: true, data: transformedReport },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

