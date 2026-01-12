import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import SportsEvent from '@/lib/db/models/SportsEvent'

// Dify API configuration
const DIFY_API_URL = 'https://api.dify.ai/v1/workflows/run'
const DIFY_API_KEY = process.env.DIFY_API_KEY
const DIFY_CRON_SECRET = process.env.DIFY_CRON_SECRET // Secret to protect this endpoint

// Event interface
interface SportsEventData {
  id?: string
  title: string
  description: string
  city: string
  location: string
  website?: string
  image?: string
}

// Dify API response types
interface DifyResponse {
  workflow_run_id: string
  task_id: string
  data: {
    id: string
    workflow_id: string
    status: string
    outputs?: {
      success?: boolean
      data?: SportsEventData[]
      count?: number
      [key: string]: any
    }
    error?: string
    elapsed_time?: number
    total_tokens?: number
    total_steps?: number
    created_at?: number
    finished_at?: number
  }
}

/**
 * POST /api/events/sync
 * Sync events from Dify workflow and store in database
 * This endpoint should be called by a cron job weekly
 * 
 * Security: Protected by DIFY_CRON_SECRET in query parameter or header
 */
export async function POST(request: NextRequest) {
  try {
    // Security check - verify cron secret (optional for same-origin requests in development)
    const authHeader = request.headers.get('authorization')
    const urlSecret = new URL(request.url).searchParams.get('secret')
    const providedSecret = authHeader?.replace('Bearer ', '') || urlSecret
    
    // Check origin - allow same-origin requests without secret for testing
    const origin = request.headers.get('origin') || request.headers.get('referer')
    const isSameOrigin = origin?.includes(process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000') || 
                         origin?.includes('localhost') ||
                         !origin // Direct API calls (like from button)

    // Require secret only if it's set AND it's an external request
    if (DIFY_CRON_SECRET && !isSameOrigin && providedSecret !== DIFY_CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if Dify API key is configured
    if (!DIFY_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'DIFY_API_KEY not configured',
          message: 'Please set DIFY_API_KEY in your environment variables'
        },
        { status: 500 }
      )
    }

    // Connect to database
    await connectDB()

    // STEP 1: Delete ALL old events FIRST (make them disposable)
    console.log('Deleting all old events from database...')
    const deleteResult = await SportsEvent.deleteMany({})
    console.log(`Deleted ${deleteResult.deletedCount} old events`)

    console.log('Calling Dify workflow API...')
    
    // STEP 2: Call Dify workflow API
    const response = await fetch(DIFY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          // Add any input variables your workflow expects here
        },
        response_mode: 'blocking',
        user: 'gameon-cron-sync'
      })
    })

    console.log('Dify API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      let errorData: any = {}
      
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { message: errorText }
      }

      // Handle "workflow not published" error gracefully
      if (errorData.code === 'invalid_param' && errorData.message?.includes('not published')) {
        console.warn('Dify workflow not published, skipping sync')
        return NextResponse.json({
          success: false,
          error: 'Workflow not published',
          message: 'The Dify workflow needs to be published before it can be executed. Please publish your workflow in Dify.',
          skipped: true
        }, { status: 400 })
      }

      console.error('Dify API error:', response.status, errorText)
      return NextResponse.json(
        {
          success: false,
          error: `Dify API error: ${response.status}`,
          details: errorData
        },
        { status: response.status }
      )
    }

    const difyData: DifyResponse = await response.json()
    
    console.log('Dify workflow response:', JSON.stringify(difyData, null, 2))

    // Check if workflow execution was successful
    if (difyData.data.status !== 'succeeded') {
      console.error('Dify workflow failed:', difyData.data.error)
      return NextResponse.json(
        {
          success: false,
          error: difyData.data.error || 'Workflow execution failed',
          status: difyData.data.status,
          details: difyData.data
        },
        { status: 500 }
      )
    }

    console.log('Dify workflow succeeded, extracting events from outputs...')
    console.log('Raw outputs:', JSON.stringify(difyData.data.outputs, null, 2))

    // STEP 3: Extract and parse events from Dify response
    let events: SportsEventData[] = []
    
    if (!difyData.data.outputs) {
      console.warn('No outputs found in Dify response')
      return NextResponse.json({
        success: false,
        error: 'No output from Dify workflow',
        message: 'The workflow did not return any output'
      }, { status: 400 })
    }

    let parsedOutput: any = difyData.data.outputs
    
    // If outputs is a string, parse it
    if (typeof parsedOutput === 'string') {
      try {
        // Try direct parse first
        parsedOutput = JSON.parse(parsedOutput)
      } catch (e) {
        // Handle escaped JSON
        try {
          const unescaped = parsedOutput.replace(/\\"/g, '"').replace(/\\n/g, '')
          parsedOutput = JSON.parse(unescaped)
        } catch (e2) {
          // Try to extract JSON from string
          const jsonMatch = parsedOutput.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            parsedOutput = JSON.parse(jsonMatch[0])
          } else {
            return NextResponse.json({
              success: false,
              error: 'Failed to parse Dify response',
              details: 'The workflow output is not valid JSON',
              rawOutput: parsedOutput.substring(0, 500)
            }, { status: 500 })
          }
        }
      }
    }

    console.log('Parsed output structure:', JSON.stringify(parsedOutput, null, 2))
    console.log('Output keys:', Object.keys(parsedOutput))

    // STEP 4: Extract items from Dify response
    // Handle format: { text: "", json: [{ kind: "customsearch#search", items: [...] }] }
    if (parsedOutput.json && Array.isArray(parsedOutput.json) && parsedOutput.json.length > 0) {
      const searchResult = parsedOutput.json[0]
      if (searchResult.items && Array.isArray(searchResult.items)) {
        // Map all search items to events format - NO FILTERING, accept all items
        events = searchResult.items.map((item: any) => {
          // Extract image URL from pagemap (cse_image or cse_thumbnail)
          let imageUrl = item.image || undefined
          if (!imageUrl && item.pagemap) {
            // Try cse_image first (higher quality)
            if (item.pagemap.cse_image && Array.isArray(item.pagemap.cse_image) && item.pagemap.cse_image.length > 0) {
              imageUrl = item.pagemap.cse_image[0].src
            }
            // Fallback to cse_thumbnail
            if (!imageUrl && item.pagemap.cse_thumbnail && Array.isArray(item.pagemap.cse_thumbnail) && item.pagemap.cse_thumbnail.length > 0) {
              imageUrl = item.pagemap.cse_thumbnail[0].src
            }
          }
          
          return {
            title: item.title || 'Untitled Event',
            description: item.snippet || item.description || 'No description available',
            city: item.city || 'Malaysia',
            location: item.location || item.displayLink || item.link || 'Malaysia',
            website: item.link || item.website || undefined,
            image: imageUrl || undefined
          }
        })
        console.log(`Extracted ${events.length} events from Google Search results`)
      }
    } else if (parsedOutput.data && Array.isArray(parsedOutput.data)) {
      // Handle format: { success: true, data: [...] }
      events = parsedOutput.data
      console.log(`Found ${events.length} events in data`)
    } else if (Array.isArray(parsedOutput)) {
      // Handle format: [...] (direct array)
      events = parsedOutput
      console.log(`Found ${events.length} events (direct array)`)
    } else if (parsedOutput.events && Array.isArray(parsedOutput.events)) {
      // Handle format: { events: [...] }
      events = parsedOutput.events
      console.log(`Found ${events.length} events in events`)
    }

    if (events.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No events found in Dify response',
        message: 'The workflow output does not contain any events',
        outputKeys: Object.keys(parsedOutput)
      }, { status: 400 })
    }

    console.log(`Processing ${events.length} events from Dify response...`)

    // STEP 5: Prepare events for database storage
    const eventsToStore = events.map((event: any) => ({
      title: (event.title || 'Untitled Event').trim(),
      description: (event.description || 'No description').trim(),
      city: (event.city || 'Malaysia').trim(),
      location: (event.location || event.city || 'Malaysia').trim(),
      website: event.website && typeof event.website === 'string' ? event.website.trim() : undefined,
      image: event.image && typeof event.image === 'string' ? event.image.trim() : undefined,
      lastSyncedAt: new Date(),
      syncedFrom: 'dify'
    }))

    // STEP 6: Store all events in database
    console.log(`Storing ${eventsToStore.length} events in database...`)
    const insertResult = await SportsEvent.insertMany(eventsToStore)
    
    console.log(`✅ Successfully stored ${insertResult.length} events in database`)

    return NextResponse.json({
      success: true,
      message: 'Events synced successfully',
      synced: insertResult.length,
      deleted: deleteResult.deletedCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error syncing events:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync events'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/events/sync
 * Manual trigger endpoint (for testing)
 */
export async function GET(request: NextRequest) {
  // For testing purposes, allow GET with secret
  const urlSecret = new URL(request.url).searchParams.get('secret')
  
  if (DIFY_CRON_SECRET && urlSecret !== DIFY_CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Use POST method or provide secret parameter.' },
      { status: 401 }
    )
  }

  // Call POST handler
  return POST(request)
}

