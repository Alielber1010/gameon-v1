import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to resolve shortened Google Maps URLs
 * This is needed because shortened URLs (goo.gl, maps.app.goo.gl) require
 * following redirects which can't be done client-side due to CORS
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid URL' },
        { status: 400 }
      )
    }

    // Only process shortened Google Maps URLs
    if (!url.includes('goo.gl/maps') && !url.includes('maps.app.goo.gl')) {
      return NextResponse.json(
        { success: false, error: 'URL is not a shortened Google Maps link' },
        { status: 400 }
      )
    }

    // Follow redirects to get the full URL
    const response = await fetch(url, {
      method: 'HEAD', // Use HEAD to avoid downloading the full page
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to resolve URL' },
        { status: 400 }
      )
    }

    // Get the final URL after redirects
    const finalUrl = response.url

    return NextResponse.json({
      success: true,
      data: {
        originalUrl: url,
        resolvedUrl: finalUrl,
      },
    })
  } catch (error: any) {
    console.error('Error resolving Google Maps URL:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to resolve URL' },
      { status: 500 }
    )
  }
}








