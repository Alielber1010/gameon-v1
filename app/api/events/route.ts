import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import SportsEvent from '@/lib/db/models/SportsEvent'

const REFRESH_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

interface SportsEventData {
  title: string
  description: string
  city: string
  location: string
  website?: string
  image?: string
}

const NEWS_SOURCES = [
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/news?limit=8', label: 'Football', city: 'International' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/mly.super_league/news?limit=6', label: 'Malaysia Super League', city: 'Malaysia' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=4', label: 'Basketball (NBA)', city: 'USA' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/tennis/news?limit=4', label: 'Tennis', city: 'International' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/news?limit=4', label: 'Formula 1', city: 'International' },
]

const SCOREBOARD_SOURCES = [
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard', label: 'Premier League', city: 'England' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard', label: 'La Liga', city: 'Spain' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard', label: 'Bundesliga', city: 'Germany' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/afc.champions_league/scoreboard', label: 'AFC Champions League', city: 'Asia' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard', label: 'NBA', city: 'USA' },
]

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { headers: { 'User-Agent': 'GameOn Sports App' }, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

function parseNewsItem(article: any, label: string, city: string): SportsEventData | null {
  const title = article.headline || article.title
  const description = article.description || article.abstract || article.summary
  if (!title || !description) return null
  return {
    title: title.trim(),
    description: description.trim(),
    city,
    location: label,
    website: article.links?.web?.href || article.link || undefined,
    image: article.images?.[0]?.url || article.image?.url || undefined,
  }
}

function parseScoreboardEvent(event: any, label: string, defaultCity: string): SportsEventData | null {
  const title = event.name || event.shortName
  if (!title) return null
  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString('en-MY', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Upcoming'
  const status = event.status?.type?.detail || event.status?.type?.shortDetail || ''
  const competition = event.competitions?.[0]
  const venue = competition?.venue?.fullName || event.venue?.fullName || ''
  const venueCity = competition?.venue?.address?.city || event.venue?.address?.city || defaultCity
  const logo = competition?.competitors?.[0]?.team?.logo || competition?.competitors?.[1]?.team?.logo || undefined
  return {
    title: title.trim(),
    description: `${label} · ${dateStr}${status ? ' · ' + status : ''}`,
    city: venueCity,
    location: venue || venueCity,
    website: event.links?.[0]?.href || undefined,
    image: logo,
  }
}

async function fetchFromESPN(): Promise<SportsEventData[]> {
  const events: SportsEventData[] = []
  const seen = new Set<string>()

  await Promise.allSettled(
    NEWS_SOURCES.map(async ({ url, label, city }) => {
      try {
        const res = await fetchWithTimeout(url)
        if (!res.ok) return
        const json = await res.json()
        const articles: any[] = json.articles || json.news || []
        for (const article of articles) {
          const ev = parseNewsItem(article, label, city)
          if (ev && !seen.has(ev.title)) { seen.add(ev.title); events.push(ev) }
        }
      } catch { /* one source failing shouldn't break others */ }
    })
  )

  await Promise.allSettled(
    SCOREBOARD_SOURCES.map(async ({ url, label, city }) => {
      try {
        const res = await fetchWithTimeout(url)
        if (!res.ok) return
        const json = await res.json()
        const eventList: any[] = json.events || []
        for (const ev of eventList.slice(0, 6)) {
          const parsed = parseScoreboardEvent(ev, label, city)
          if (parsed && !seen.has(parsed.title)) { seen.add(parsed.title); events.push(parsed) }
        }
      } catch { /* one source failing shouldn't break others */ }
    })
  )

  return events
}

/**
 * GET /api/events
 * Returns sports events from ESPN. Auto-refreshes from ESPN if data is older
 * than 30 minutes or the DB is empty.
 */
export async function GET(request: NextRequest) {
  const forceRefresh = new URL(request.url).searchParams.get('refresh') === '1'

  try {
    await connectDB()

    // Check if DB has fresh data
    const newest = await SportsEvent.findOne({}).sort({ lastSyncedAt: -1 }).lean() as any
    const isStale = !newest || (Date.now() - new Date(newest.lastSyncedAt).getTime() > REFRESH_INTERVAL_MS)

    if (!forceRefresh && !isStale) {
      // Serve from DB — data is fresh enough
      const dbEvents = await SportsEvent.find({}).sort({ createdAt: -1 }).lean()
      const events = dbEvents.map((e: any) => ({
        id: e._id.toString(),
        title: e.title,
        description: e.description,
        city: e.city,
        location: e.location,
        website: e.website || undefined,
        image: e.image || undefined,
      }))
      return NextResponse.json({ success: true, data: events, count: events.length, source: 'cache' })
    }

    // Fetch live from ESPN
    const espnEvents = await fetchFromESPN()

    if (espnEvents.length === 0) {
      // ESPN failed — fall back to whatever is in the DB
      const dbEvents = await SportsEvent.find({}).sort({ createdAt: -1 }).lean()
      const events = dbEvents.map((e: any) => ({
        id: e._id.toString(),
        title: e.title,
        description: e.description,
        city: e.city,
        location: e.location,
        website: e.website || undefined,
        image: e.image || undefined,
      }))
      return NextResponse.json({ success: true, data: events, count: events.length, source: 'cache-fallback' })
    }

    // Replace DB records with fresh data
    await SportsEvent.deleteMany({})
    const now = new Date()
    await SportsEvent.insertMany(espnEvents.map(e => ({ ...e, lastSyncedAt: now, syncedFrom: 'espn' })))

    const events = espnEvents.map((e, i) => ({ id: String(i), ...e }))
    return NextResponse.json({ success: true, data: events, count: events.length, source: 'espn-live' })
  } catch (error: any) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch events' }, { status: 500 })
  }
}
