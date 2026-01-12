import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Report from '@/lib/db/models/Report';
import { requireAuth } from '@/lib/auth';

// GET /api/admin/reports - Get all reports with filters (admin only)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'pending', 'resolved', 'dismissed'
    const reportType = searchParams.get('reportType'); // 'game' or 'user'
    const priority = searchParams.get('priority'); // 'high', 'medium', 'low' - based on report count

    // Build query
    const query: any = {};

    // Filter by report type (game or user)
    if (reportType === 'game') {
      query.gameId = { $exists: true, $ne: null };
    } else if (reportType === 'user') {
      query.userId = { $exists: true, $ne: null };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Get all reports matching the query
    const reports = await Report.find(query)
      .populate('gameId', 'title sport image')
      .populate('userId', 'name email image')
      .populate('reportedBy', 'name email image')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('[Admin Reports API] Found reports:', reports.length);
    console.log('[Admin Reports API] Query:', JSON.stringify(query, null, 2));

    // Get report counts for priority calculation
    // For games: count reports per game
    // For users: count reports per user
    const gameReportCounts = new Map();
    const userReportCounts = new Map();

    const allReports = await Report.find({
      ...query,
      status: 'pending', // Only count pending reports for priority
    }).lean();

    allReports.forEach((report: any) => {
      if (report.gameId) {
        const gameId = report.gameId._id?.toString() || report.gameId.toString();
        gameReportCounts.set(gameId, (gameReportCounts.get(gameId) || 0) + 1);
      }
      if (report.userId) {
        const userId = report.userId._id?.toString() || report.userId.toString();
        userReportCounts.set(userId, (userReportCounts.get(userId) || 0) + 1);
      }
    });

    // Transform reports
    let transformedReports = reports.map((report: any) => {
      try {
        // Handle gameId - could be ObjectId or populated object
        const gameIdValue = report.gameId;
        const isGameReport = !!gameIdValue;
        const gameIdStr = gameIdValue?._id?.toString() || gameIdValue?.toString() || null;
        
        // Handle userId - could be ObjectId or populated object
        const userIdValue = report.userId;
        const isUserReport = !!userIdValue;
        const userIdStr = userIdValue?._id?.toString() || userIdValue?.toString() || null;
        
        // Calculate priority based on report count
        let priorityLevel: 'high' | 'medium' | 'low' = 'low';
        if (isGameReport && report.status === 'pending' && gameIdStr) {
          const count = gameReportCounts.get(gameIdStr) || 0;
          if (count >= 5) priorityLevel = 'high';
          else if (count >= 2) priorityLevel = 'medium';
        } else if (isUserReport && report.status === 'pending' && userIdStr) {
          const count = userReportCounts.get(userIdStr) || 0;
          if (count >= 5) priorityLevel = 'high';
          else if (count >= 2) priorityLevel = 'medium';
        }

        // Handle populated gameId object
        const gameTitle = gameIdValue?.title || null;
        const gameSport = gameIdValue?.sport || null;
        const gameImage = gameIdValue?.image || null;

        // Handle populated userId object
        const userName = userIdValue?.name || null;
        const userEmail = userIdValue?.email || null;
        const userImage = userIdValue?.image || null;

        // Handle reportedBy - could be ObjectId or populated object
        const reportedByValue = report.reportedBy;
        const reportedById = reportedByValue?._id?.toString() || reportedByValue?.toString() || '';
        const reportedByName = reportedByValue?.name || 'Unknown';
        const reportedByEmail = reportedByValue?.email || '';
        const reportedByImage = reportedByValue?.image || '/placeholder-user.jpg';

        // Handle resolvedBy - could be ObjectId or populated object
        const resolvedByValue = report.resolvedBy;
        let resolvedBy = null;
        if (resolvedByValue) {
          resolvedBy = {
            id: resolvedByValue._id?.toString() || resolvedByValue.toString(),
            name: resolvedByValue.name || 'Unknown',
            email: resolvedByValue.email || '',
          };
        }

        return {
          id: report._id.toString(),
          type: isGameReport ? 'game' : 'user',
          gameId: gameIdStr,
          gameTitle,
          gameSport,
          gameImage,
          userId: userIdStr,
          userName,
          userEmail,
          userImage,
          reportType: report.reportType,
          description: report.description,
          images: report.images || [],
          status: report.status,
          action: report.action,
          actionReason: report.actionReason,
          actionDate: report.actionDate,
          priority: priorityLevel,
          reportedBy: {
            id: reportedById,
            name: reportedByName,
            email: reportedByEmail,
            image: reportedByImage,
          },
          resolvedBy,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        };
      } catch (error: any) {
        console.error('[Admin Reports API] Error transforming report:', error, report);
        return null;
      }
    }).filter(Boolean); // Remove any null entries from transformation errors

    // Apply priority filter if specified
    if (priority) {
      transformedReports = transformedReports.filter((report: any) => report.priority === priority);
    }

    // Apply search filter if provided
    let filteredReports = transformedReports;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReports = transformedReports.filter((report: any) => {
        return (
          report.gameTitle?.toLowerCase().includes(searchLower) ||
          report.userName?.toLowerCase().includes(searchLower) ||
          report.userEmail?.toLowerCase().includes(searchLower) ||
          report.reportedBy.name?.toLowerCase().includes(searchLower) ||
          report.reportedBy.email?.toLowerCase().includes(searchLower) ||
          report.description?.toLowerCase().includes(searchLower) ||
          report.reportType?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Get total count for pagination
    const total = filteredReports.length;

    console.log('[Admin Reports API] Transformed reports:', transformedReports.length);
    console.log('[Admin Reports API] Filtered reports:', filteredReports.length);
    console.log('[Admin Reports API] Total:', total);

    return NextResponse.json({
      success: true,
      reports: filteredReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin Reports API] Error fetching reports:', error);
    console.error('[Admin Reports API] Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch reports',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
