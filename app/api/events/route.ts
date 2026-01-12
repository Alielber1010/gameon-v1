import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import SportsEvent from '@/lib/db/models/SportsEvent'

// Event interface - matches the database model
export interface SportsEvent {
  id?: string
  title: string
  description: string
  city: string
  location: string
  website?: string
  image?: string
}

/**
 * GET /api/events
 * Returns cached events from database
 * Events are synced weekly via /api/events/sync cron job
 */
export async function GET() {
  try {
    // Connect to database
    await connectDB()

    // Fetch ALL events from database (sorted by creation date, newest first)
    const dbEvents = await SportsEvent.find({})
      .sort({ createdAt: -1 })
      .lean()

    // Return empty array if no events (no mock data)
    if (dbEvents.length === 0) {
      console.log('No events found in database')
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        cached: true,
        message: 'No events synced yet. Click "Refresh Events" to sync from Dify.'
      })
    }

    // Transform database events to match the interface
    const events: SportsEvent[] = dbEvents.map((event: any) => ({
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      city: event.city,
      location: event.location,
      website: event.website || undefined,
      image: event.image || undefined,
    }))

    // Get the most recent sync time
    const lastSync = dbEvents.length > 0 
      ? dbEvents[0].lastSyncedAt || dbEvents[0].createdAt 
      : null

    return NextResponse.json({
      success: true,
      data: events,
      count: events.length,
      cached: true,
      lastSyncedAt: lastSync ? new Date(lastSync).toISOString() : null
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch events'
      },
      { status: 500 }
    )
  }
}

