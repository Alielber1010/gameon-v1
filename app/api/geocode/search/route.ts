import { NextRequest, NextResponse } from 'next/server';
import { searchLocations } from '@/lib/utils/geocoding';

/**
 * GET /api/geocode/search?q=...
 * Search for location suggestions (autocomplete)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const results = await searchLocations(query, limit);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Location search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search locations' },
      { status: 500 }
    );
  }
}








