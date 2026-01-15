import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to resolve shortened Google Maps URLs (maps.app.goo.gl)
 * Follows redirects to get the canonical google.com/maps URL
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
    const isShortUrl = url.includes('goo.gl/maps') || url.includes('maps.app.goo.gl')
    if (!isShortUrl) {
      return NextResponse.json(
        { success: false, error: 'URL is not a shortened Google Maps link' },
        { status: 400 }
      )
    }

    // Ensure URL has protocol
    let urlToFetch = url.trim()
    if (!urlToFetch.startsWith('http://') && !urlToFetch.startsWith('https://')) {
      urlToFetch = 'https://' + urlToFetch
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    }

    // Follow redirects automatically (max 10 redirects)
    const response = await fetch(urlToFetch, {
      method: 'GET',
      redirect: 'follow',
      headers,
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to resolve URL: ${response.statusText}` },
        { status: 400 }
      )
    }

    // Get the final URL after all redirects
    const finalUrl = response.url

    // Log the unwrapped canonical URL for debugging
    console.log('[Google Maps Resolver] Original:', urlToFetch)
    console.log('[Google Maps Resolver] Unwrapped Canonical URL:', finalUrl)

    // Safety validation - ensure it's a Google Maps URL
    if (!finalUrl.includes('google.com/maps') && !finalUrl.includes('maps.google.com')) {
      console.warn('[Google Maps Resolver] Resolved URL is not a Google Maps link:', finalUrl)
      return NextResponse.json(
        { success: false, error: 'Resolved URL is not a valid Google Maps link' },
        { status: 400 }
      )
    }

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
      { success: false, error: `Failed to resolve URL: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}
