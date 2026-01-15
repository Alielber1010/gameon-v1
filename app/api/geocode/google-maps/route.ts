import { NextRequest, NextResponse } from 'next/server'

// In-memory cache for resolved URLs (expires after 1 hour)
const urlCache = new Map<string, { resolvedUrl: string; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

// Rate limiting: track requests per URL
const requestTimestamps = new Map<string, number[]>()
const MAX_REQUESTS_PER_MINUTE = 5
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

/**
 * API endpoint to resolve shortened Google Maps URLs (maps.app.goo.gl)
 * Follows redirects to get the canonical google.com/maps URL
 * Includes caching and rate limiting to prevent "Too Many Requests" errors
 */
export const dynamic = 'force-dynamic'

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

    // Normalize URL for caching
    const normalizedUrl = url.trim().toLowerCase()
    
    // Check cache first
    const cached = urlCache.get(normalizedUrl)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[Google Maps Resolver] Cache hit for:', normalizedUrl)
      return NextResponse.json({
        success: true,
        data: {
          originalUrl: url,
          resolvedUrl: cached.resolvedUrl,
        },
      })
    }

    // Rate limiting: check if we've made too many requests for this URL recently
    const now = Date.now()
    const timestamps = requestTimestamps.get(normalizedUrl) || []
    const recentRequests = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW)
    
    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
      console.warn('[Google Maps Resolver] Rate limit exceeded for:', normalizedUrl)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please wait a moment and try again.' 
        },
        { status: 429 }
      )
    }

    // Update rate limit tracking
    recentRequests.push(now)
    requestTimestamps.set(normalizedUrl, recentRequests)

    // Ensure URL has protocol
    let urlToFetch = url.trim()
    if (!urlToFetch.startsWith('http://') && !urlToFetch.startsWith('https://')) {
      urlToFetch = 'https://' + urlToFetch
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.google.com/',
    }

    // Retry logic with exponential backoff for rate limit errors
    let finalUrl: string | null = null
    let lastError: Error | null = null
    const maxRetries = 3
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: wait 2^attempt seconds
          const delay = Math.pow(2, attempt) * 1000
          console.log(`[Google Maps Resolver] Retry attempt ${attempt + 1} after ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const response = await fetch(urlToFetch, {
          method: 'GET',
          redirect: 'follow',
          headers,
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000), // 10 second timeout
        })

        if (response.status === 429) {
          // Rate limited - wait longer before retry
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
          if (attempt < maxRetries - 1) {
            console.warn(`[Google Maps Resolver] Rate limited. Waiting ${retryAfter}s before retry...`)
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
            continue
          }
          throw new Error('Too Many Requests')
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        finalUrl = response.url
        break
      } catch (error: any) {
        lastError = error
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please try again.')
        }
        if (attempt === maxRetries - 1) {
          throw error
        }
        // Continue to retry
      }
    }

    if (!finalUrl) {
      throw lastError || new Error('Failed to resolve URL after retries')
    }

    // Safety validation - ensure it's a Google Maps URL
    if (!finalUrl.includes('google.com/maps') && !finalUrl.includes('maps.google.com')) {
      console.warn('[Google Maps Resolver] Resolved URL is not a Google Maps link:', finalUrl)
      return NextResponse.json(
        { success: false, error: 'Resolved URL is not a valid Google Maps link' },
        { status: 400 }
      )
    }

    // Cache the result
    urlCache.set(normalizedUrl, {
      resolvedUrl: finalUrl,
      timestamp: Date.now(),
    })

    // Clean up old cache entries (keep cache size reasonable)
    if (urlCache.size > 1000) {
      const entries = Array.from(urlCache.entries())
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      urlCache.clear()
      entries.slice(0, 500).forEach(([key, value]) => urlCache.set(key, value))
    }

    console.log('[Google Maps Resolver] Original:', urlToFetch)
    console.log('[Google Maps Resolver] Unwrapped Canonical URL:', finalUrl)

    return NextResponse.json({
      success: true,
      data: {
        originalUrl: url,
        resolvedUrl: finalUrl,
      },
    })
  } catch (error: any) {
    console.error('Error resolving Google Maps URL:', error)
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to resolve URL. Please try again.'
    if (error.message?.includes('Too Many Requests') || error.message?.includes('429')) {
      errorMessage = 'Too many requests to Google Maps. Please wait a moment and try again.'
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please check your connection and try again.'
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
