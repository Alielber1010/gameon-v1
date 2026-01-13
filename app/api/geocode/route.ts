import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/utils/geocoding';

// Force dynamic rendering - this route processes user input at runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/geocode?address=...
 * Geocode an address to get coordinates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    const result = await geocodeAddress(address);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Could not geocode address' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Geocoding API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to geocode address' },
      { status: 500 }
    );
  }
}








