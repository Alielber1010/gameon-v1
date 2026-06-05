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

// ── Malaysia / Asia (first half) ─────────────────────────────────────────────
const MALAYSIA_NEWS = [
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/mly.super_league/news?limit=8', label: 'Malaysia Super League', city: 'Malaysia' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/afc.champions_league/news?limit=6', label: 'AFC Champions League', city: 'Asia' },
]
const MALAYSIA_SCOREBOARDS = [
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/mly.super_league/scoreboard', label: 'Malaysia Super League', city: 'Malaysia' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/afc.champions_league/scoreboard', label: 'AFC Champions League', city: 'Asia' },
]

// ── International (sports popular in Malaysia) ────────────────────────────────
const INTL_NEWS = [
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news?limit=5', label: 'Premier League', city: 'England' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/news?limit=4', label: 'Formula 1', city: 'International' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/news?limit=4', label: 'UEFA Champions League', city: 'Europe' },
]
const INTL_SCOREBOARDS = [
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard', label: 'Premier League', city: 'England' },
  { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard', label: 'UEFA Champions League', city: 'Europe' },
]

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { headers: { 'User-Agent': 'GameOn Sports App' }, signal: ctrl.signal })
  } finally {
    clearTimeout(id)
  }
}

function parseNews(article: any, label: string, city: string): SportsEventData | null {
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

function parseScoreboard(event: any, label: string, defaultCity: string): SportsEventData | null {
  const title = event.name || event.shortName
  if (!title) return null
  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString('en-MY', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Upcoming'
  const status = event.status?.type?.detail || event.status?.type?.shortDetail || ''
  const competition = event.competitions?.[0]
  const venue = competition?.venue?.fullName || ''
  const venueCity = competition?.venue?.address?.city || defaultCity
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
  const malaysiaEvents: SportsEventData[] = []
  const intlEvents: SportsEventData[] = []
  const seen = new Set<string>()

  const add = (arr: SportsEventData[], ev: SportsEventData | null) => {
    if (ev && !seen.has(ev.title)) { seen.add(ev.title); arr.push(ev) }
  }

  await Promise.allSettled([
    // Malaysia/Asia news
    ...MALAYSIA_NEWS.map(async ({ url, label, city }) => {
      try {
        const res = await fetchWithTimeout(url)
        if (!res.ok) return
        const json = await res.json()
        for (const a of (json.articles || json.news || [])) add(malaysiaEvents, parseNews(a, label, city))
      } catch { /* skip failed source */ }
    }),
    // Malaysia/Asia scoreboards
    ...MALAYSIA_SCOREBOARDS.map(async ({ url, label, city }) => {
      try {
        const res = await fetchWithTimeout(url)
        if (!res.ok) return
        const json = await res.json()
        for (const e of (json.events || []).slice(0, 6)) add(malaysiaEvents, parseScoreboard(e, label, city))
      } catch { /* skip failed source */ }
    }),
    // International news
    ...INTL_NEWS.map(async ({ url, label, city }) => {
      try {
        const res = await fetchWithTimeout(url)
        if (!res.ok) return
        const json = await res.json()
        for (const a of (json.articles || json.news || [])) add(intlEvents, parseNews(a, label, city))
      } catch { /* skip failed source */ }
    }),
    // International scoreboards
    ...INTL_SCOREBOARDS.map(async ({ url, label, city }) => {
      try {
        const res = await fetchWithTimeout(url)
        if (!res.ok) return
        const json = await res.json()
        for (const e of (json.events || []).slice(0, 6)) add(intlEvents, parseScoreboard(e, label, city))
      } catch { /* skip failed source */ }
    }),
  ])

  // Interleave: Malaysia first, then international, roughly 50/50
  const combined: SportsEventData[] = []
  const max = Math.max(malaysiaEvents.length, intlEvents.length)
  for (let i = 0; i < max; i++) {
    if (i < malaysiaEvents.length) combined.push(malaysiaEvents[i])
    if (i < intlEvents.length) combined.push(intlEvents[i])
  }
  return combined
}

/**
 * GET /api/events
 * Serves from DB cache unless DB is empty or ?refresh=1 is passed.
 * The Refresh button on the page passes ?refresh=1 to force a live ESPN fetch.
 */
export async function GET(request: NextRequest) {
  const forceRefresh = new URL(request.url).searchParams.get('refresh') === '1'

  try {
    await connectDB()

    if (!forceRefresh) {
      // Serve cached data if available
      const count = await SportsEvent.countDocuments()
      if (count > 0) {
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
        return NextResponse.json({ success: true, data: events, count: events.length })
      }
    }

    // Fetch live from ESPN (first load or manual refresh)
    const espnEvents = await fetchFromESPN()

    if (espnEvents.length === 0) {
      // ESPN unavailable — fall back to whatever is in DB
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
      return NextResponse.json({ success: true, data: events, count: events.length })
    }

    // Replace DB with fresh ESPN data
    await SportsEvent.deleteMany({})
    const now = new Date()
    await SportsEvent.insertMany(espnEvents.map(e => ({ ...e, lastSyncedAt: now, syncedFrom: 'espn' })))

    const events = espnEvents.map((e, i) => ({ id: String(i), ...e }))
    return NextResponse.json({ success: true, data: events, count: events.length })
  } catch (error: any) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch events' }, { status: 500 })
  }
}
