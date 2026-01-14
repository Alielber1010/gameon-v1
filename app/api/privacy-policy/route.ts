import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { getPrivacyPolicy } from '@/lib/db/models/PrivacyPolicy';

// GET /api/privacy-policy - Get privacy policy (public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const policy = await getPrivacyPolicy();

    return NextResponse.json({
      success: true,
      policy: {
        sections: policy.sections,
        lastUpdated: policy.lastUpdated,
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
