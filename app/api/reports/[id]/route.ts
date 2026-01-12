import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Report from '@/lib/db/models/Report';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/reports/[id] - Get a single report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const User = (await import('@/lib/db/models/User')).default;
    const user = await User.findById(authResult.id);
    const isAdmin = user?.role === 'admin';

    const report = await Report.findById(id)
      .populate('gameId', 'title sport image description')
      .populate('reportedBy', 'name email image')
      .populate('resolvedBy', 'name email')
      .lean();

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // Non-admin users can only view their own reports
    if (!isAdmin && report.reportedBy.toString() !== authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const transformedReport = {
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
    };

    return NextResponse.json({
      success: true,
      data: transformedReport,
    });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

// PUT /api/reports/[id] - Update a report (admin only for status/action)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const User = (await import('@/lib/db/models/User')).default;
    const user = await User.findById(authResult.id);
    const isAdmin = user?.role === 'admin';

    const report = await Report.findById(id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, action, actionReason } = body;

    // Only admins can update status and action
    if (status || action || actionReason) {
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Only admins can update report status and action' },
          { status: 403 }
        );
      }

      // Validate status
      if (status && !['pending', 'resolved', 'dismissed'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }

      // Validate action
      if (action && !['delete', 'keep', 'dismiss'].includes(action)) {
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
      }

      // Update report
      if (status) report.status = status;
      if (action) report.action = action;
      if (actionReason) report.actionReason = actionReason;

      if (status === 'resolved' || status === 'dismissed') {
        report.resolvedBy = new mongoose.Types.ObjectId(authResult.id);
        report.actionDate = new Date();
      }
    }

    // Regular users can only update their own reports (description, images)
    if (!isAdmin && report.reportedBy.toString() !== authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Regular users can update description and images
    if (body.description !== undefined) {
      report.description = body.description;
    }
    if (body.images !== undefined) {
      if (Array.isArray(body.images) && body.images.length > 3) {
        return NextResponse.json(
          { success: false, error: 'Maximum 3 images allowed' },
          { status: 400 }
        );
      }
      report.images = body.images || [];
    }

    await report.save();

    // Populate references
    await report.populate('gameId', 'title sport image');
    await report.populate('reportedBy', 'name email image');
    await report.populate('resolvedBy', 'name email');

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

    return NextResponse.json({
      success: true,
      data: transformedReport,
    });
  } catch (error: any) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Delete a report (admin only or own report)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const User = (await import('@/lib/db/models/User')).default;
    const user = await User.findById(authResult.id);
    const isAdmin = user?.role === 'admin';

    const report = await Report.findById(id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // Only admins or the reporter can delete
    if (!isAdmin && report.reportedBy.toString() !== authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await Report.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}






