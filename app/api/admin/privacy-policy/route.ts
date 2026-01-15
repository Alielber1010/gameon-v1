import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import PrivacyPolicy, { getPrivacyPolicy } from '@/lib/db/models/PrivacyPolicy';
import { requireAuth } from '@/lib/auth';

// Force dynamic rendering (uses headers for auth)
export const dynamic = 'force-dynamic';

// GET /api/admin/privacy-policy - Get privacy policy (admin only)
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const authResult = await requireAuth();
    if (authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const policy = await getPrivacyPolicy();

    return NextResponse.json({
      success: true,
      policy: {
        sections: policy.sections,
        lastUpdated: policy.lastUpdated,
        lastUpdatedBy: policy.lastUpdatedBy,
      },
    });
  } catch (error: any) {
    console.error('Error fetching privacy policy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch privacy policy' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/privacy-policy - Update privacy policy (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Authenticate admin
    const authResult = await requireAuth();
    if (authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sections } = body;

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { success: false, error: 'Sections array is required' },
        { status: 400 }
      );
    }

    // Validate sections
    for (const section of sections) {
      if (!section.title || !section.content) {
        return NextResponse.json(
          { success: false, error: 'Each section must have a title and content' },
          { status: 400 }
        );
      }
    }

    await connectDB();

    let policy = await PrivacyPolicy.findOne();
    
    if (!policy) {
      // Create new policy
      policy = await PrivacyPolicy.create({
        sections,
        lastUpdated: new Date(),
        lastUpdatedBy: authResult.id,
      });
    } else {
      // Update existing policy
      policy.sections = sections;
      policy.lastUpdated = new Date();
      policy.lastUpdatedBy = authResult.id;
      await policy.save();
    }

    return NextResponse.json({
      success: true,
      policy: {
        sections: policy.sections,
        lastUpdated: policy.lastUpdated,
        lastUpdatedBy: policy.lastUpdatedBy,
      },
    });
  } catch (error: any) {
    console.error('Error updating privacy policy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update privacy policy' },
      { status: 500 }
    );
  }
}
