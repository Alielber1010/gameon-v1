"use client"

import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { EventCard, type SportsEvent } from "@/components/dashboard/event-card"
import { Loader2, RefreshCw } from "lucide-react"

export default function EventsPage() {
  const [events, setEvents] = useState<SportsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadEvents = async (forceRefresh = false) => {
    try {
      const url = forceRefresh ? '/api/events?refresh=1' : '/api/events'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setEvents(data.data || [])
        setError(null)
      } else {
        setError(data.error || 'Failed to load events')
      }
    } catch {
      setError('Failed to load events. Please try again.')
    }
  }

  useEffect(() => {
    setLoading(true)
    loadEvents().finally(() => setLoading(false))
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadEvents(true)
    setRefreshing(false)
  }

  const handleEventClick = (event: SportsEvent) => {
    if (event.website) window.open(event.website, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold">Sports Events</h1>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing || loading} variant="outline" className="gap-2">
          {refreshing ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Refreshing...</>
          ) : (
            <><RefreshCw className="h-4 w-4" />Refresh</>
          )}
        </Button>
      </div>

      {(loading || refreshing) && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">{refreshing ? 'Fetching latest from ESPN…' : 'Loading events…'}</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
          <button onClick={() => loadEvents()} className="mt-2 text-sm underline hover:no-underline">Try again</button>
        </div>
      )}

      {!loading && !refreshing && !error && (
        <>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No events found. Click Refresh to fetch from ESPN.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                {events.length} event{events.length !== 1 ? 's' : ''} · auto-refreshes every 30 minutes
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event, index) => (
                  <EventCard
                    key={event.id || index}
                    event={event}
                    onClick={() => handleEventClick(event)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
