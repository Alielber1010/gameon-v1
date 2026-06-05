import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import SportsEvent from '@/lib/db/models/SportsEvent'

interface SportsEventData {
  title: string
  description: string
  city: string
  location: string
  website?: string
  image?: string
}

// ESPN public API — no API key required
// News endpoints (always fresh, no season dependency)
const NEWS_SOURCES = [
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/news?limit=8', label: 'Football', city: 'International' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/mly.super_league/news?limit=6', label: 'Malaysia Super League', city: 'Malaysia' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=4', label: 'Basketball (NBA)', city: 'USA' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/tennis/news?limit=4', label: 'Tennis', city: 'International' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/news?limit=4', label: 'Formula 1', city: 'International' },
]

// Upcoming match schedules (may have no events outside season)
const SCOREBOARD_SOURCES = [
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard', label: 'Premier League', city: 'England' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard', label: 'La Liga', city: 'Spain' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard', label: 'Bundesliga', city: 'Germany' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/afc.champions_league/scoreboard', label: 'AFC Champions League', city: 'Asia' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard', label: 'NBA', city: 'USA' },
]

function parseNewsItem(article: any, label: string, city: string): SportsEventData | null {
  const title = article.headline || article.title
  const description = article.description || article.abstract || article.summary
  if (!title || !description) return null

  // Pick best image
  const image =
    article.images?.[0]?.url ||
    article.image?.url ||
    undefined

  return {
    title: title.trim(),
    description: description.trim(),
    city: city.trim(),
    location: label.trim(),
    website: article.links?.web?.href || article.link || undefined,
    image,
  }
}

function parseScoreboardEvent(event: any, label: string, defaultCity: string): SportsEventData | null {
  const title = event.name || event.shortName
  if (!title) return null

  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString('en-MY', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      })
    : 'Upcoming'
  const status = event.status?.type?.detail || event.status?.type?.shortDetail || ''
  const competition = event.competitions?.[0]
  const venue = competition?.venue?.fullName || event.venue?.fullName || ''
  const venueCity = competition?.venue?.address?.city || event.venue?.address?.city || defaultCity
  const logo =
    competition?.competitors?.[0]?.team?.logo ||
    competition?.competitors?.[1]?.team?.logo ||
    undefined
  const link = event.links?.[0]?.href || undefined

  return {
    title: title.trim(),
    description: `${label} · ${dateStr}${status ? ' · ' + status : ''}`,
    city: venueCity.trim(),
    location: venue ? `${venue}${venueCity !== defaultCity ? ', ' + venueCity : ''}` : venueCity,
    website: link,
    image: logo,
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GameOn Sports App' },
      signal: controller.signal,
    })
    return res
  } finally {
    clearTimeout(id)
  }
}

/**
 * POST /api/events/sync
 * Fetches live sports events from ESPN public API (no key needed)
 * and replaces the stored events in the database.
 */
export async function POST(request: NextRequest) {
  try {
    // Optional secret protection for external callers
    const cronSecret = process.env.DIFY_CRON_SECRET || process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const urlSecret = new URL(request.url).searchParams.get('secret')
    const providedSecret = authHeader?.replace('Bearer ', '') || urlSecret
    const origin = request.headers.get('origin') || request.headers.get('referer') || ''
    const isSameOrigin =
      !origin ||
      origin.includes(process.env.NEXT_PUBLIC_APP_URL || 'localhost') ||
      origin.includes('localhost')

    if (cronSecret && !isSameOrigin && providedSecret !== cronSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const events: SportsEventData[] = []
    const seen = new Set<string>()

    // ── 1. Fetch ESPN news ──────────────────────────────────────────────────
    await Promise.allSettled(
      NEWS_SOURCES.map(async ({ url, label, city }) => {
        try {
          const res = await fetchWithTimeout(url)
          if (!res.ok) return
          const json = await res.json()
          const articles: any[] = json.articles || json.news || []
          for (const article of articles) {
            const ev = parseNewsItem(article, label, city)
            if (ev && !seen.has(ev.title)) {
              seen.add(ev.title)
              events.push(ev)
            }
          }
        } catch {
          console.warn(`ESPN news fetch failed for ${label}`)
        }
      })
    )

    // ── 2. Fetch upcoming match schedules ───────────────────────────────────
    await Promise.allSettled(
      SCOREBOARD_SOURCES.map(async ({ url, label, city }) => {
        try {
          const res = await fetchWithTimeout(url)
          if (!res.ok) return
          const json = await res.json()
          const eventList: any[] = json.events || []
          for (const ev of eventList.slice(0, 6)) {
            const parsed = parseScoreboardEvent(ev, label, city)
            if (parsed && !seen.has(parsed.title)) {
              seen.add(parsed.title)
              events.push(parsed)
            }
          }
        } catch {
          console.warn(`ESPN scoreboard fetch failed for ${label}`)
        }
      })
    )

    if (events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No events returned from ESPN. Try again later.' },
        { status: 502 }
      )
    }

    // ── 3. Replace database records ─────────────────────────────────────────
    const deleteResult = await SportsEvent.deleteMany({})
    const toStore = events.map((e) => ({
      ...e,
      lastSyncedAt: new Date(),
      syncedFrom: 'espn',
    }))
    const inserted = await SportsEvent.insertMany(toStore)

    return NextResponse.json({
      success: true,
      message: `Synced ${inserted.length} sports events from ESPN`,
      synced: inserted.length,
      deleted: deleteResult.deletedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error syncing events:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync events' },
      { status: 500 }
    )
  }
}

/** GET — same as POST, for manual browser testing */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.DIFY_CRON_SECRET || process.env.CRON_SECRET
  const urlSecret = new URL(request.url).searchParams.get('secret')
  if (cronSecret && urlSecret !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Provide ?secret= to trigger via GET' }, { status: 401 })
  }
  return POST(request)
}
