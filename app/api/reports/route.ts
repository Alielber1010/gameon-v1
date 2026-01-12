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
      .populate('reportedBy', 'name email image')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Report.countDocuments(query);

    // Transform reports
    const transformedReports = reports.map((report: any) => ({
      id: report._id.toString(),
      gameId: report.gameId._id?.toString() || report.gameId.toString(),
      gameTitle: report.gameId.title || 'Unknown Game',
      gameSport: report.gameId.sport || '',
      reportedBy: {
        id: report.reportedBy._id?.toString() || report.reportedBy.toString(),
        name: report.reportedBy.name || 'Unknown User',
        email: report.reportedBy.email || '',
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
    }));

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
    const { gameId, reportType, description, images } = body;

    // Validation
    if (!gameId || !reportType || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: gameId, reportType, description' },
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

    // Validate gameId
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid game ID' },
        { status: 400 }
      );
    }

    // Check if game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    // Check if user already reported this game
    const existingReport = await Report.findOne({
      gameId: new mongoose.Types.ObjectId(gameId),
      reportedBy: new mongoose.Types.ObjectId(authResult.id),
      status: 'pending',
    });

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted a pending report for this game' },
        { status: 400 }
      );
    }

    // Create report
    const report = new Report({
      gameId: new mongoose.Types.ObjectId(gameId),
      reportedBy: new mongoose.Types.ObjectId(authResult.id),
      reportType,
      description,
      images: images || [],
      status: 'pending',
    });

    await report.save();

    // Populate references
    await report.populate('gameId', 'title sport image');
    await report.populate('reportedBy', 'name email image');

    const transformedReport = {
      id: report._id.toString(),
      gameId: report.gameId._id?.toString() || report.gameId.toString(),
      gameTitle: report.gameId.title || 'Unknown Game',
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

