import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Report from '@/lib/db/models/Report';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/admin/games/[id]/reports - Get all reports for a game (admin only)
export async function GET(
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid game ID' },
        { status: 400 }
      );
    }

    const reports = await Report.find({
      gameId: new mongoose.Types.ObjectId(id),
    })
      .populate('reportedBy', 'name email image')
      .sort({ createdAt: -1 })
      .lean();

    const transformedReports = reports.map((report: any) => ({
      id: report._id.toString(),
      gameId: report.gameId?.toString() || report.gameId || '',
      reportType: report.reportType,
      description: report.description,
      images: report.images || [],
      status: report.status,
      action: report.action,
      actionReason: report.actionReason,
      actionDate: report.actionDate,
      createdAt: report.createdAt,
      reportedBy: {
        id: report.reportedBy?._id?.toString() || report.reportedBy?.toString() || '',
        name: report.reportedBy?.name || 'Unknown',
        email: report.reportedBy?.email || '',
        image: report.reportedBy?.image || '/placeholder-user.jpg',
      },
    }));

    return NextResponse.json({
      success: true,
      reports: transformedReports,
    });
  } catch (error: any) {
    console.error('Error fetching game reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game reports' },
      { status: 500 }
    );
  }
}
