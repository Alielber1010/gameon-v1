"use client"

import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { EventCard, type SportsEvent } from "@/components/dashboard/event-card"
import { Loader2, RefreshCw, CheckCircle2, XCircle } from "lucide-react"

export default function EventsPage() {
  const [events, setEvents] = useState<SportsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Fetch events from API
  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/events")
      const data = await response.json()

      if (data.success) {
        setEvents(data.data || [])
      } else {
        setError(data.error || "Failed to load events")
      }
    } catch (err) {
      console.error("Error fetching events:", err)
      setError("Failed to load events. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleSyncEvents = async () => {
    try {
      setSyncing(true)
      setSyncMessage(null)
      setError(null)

      const response = await fetch("/api/events/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      
      console.log('Sync response:', data)

      if (data.success) {
        setSyncMessage({
          type: 'success',
          text: `Successfully synced ${data.synced || 0} events!`
        })
        // Refresh events list after successful sync
        await fetchEvents()
        // Clear success message after 5 seconds
        setTimeout(() => setSyncMessage(null), 5000)
      } else {
        // Show both error and message if available
        let errorText = data.message 
          ? `${data.error || 'Error'}: ${data.message}`
          : data.error || data.message || "Failed to sync events"
        
        // Add details if available for debugging
        if (data.details && typeof data.details === 'object') {
          console.error('Sync error details:', data.details)
        }
        
        setSyncMessage({
          type: 'error',
          text: errorText
        })
        // Clear error message after 8 seconds (longer for important errors)
        setTimeout(() => setSyncMessage(null), 8000)
      }
    } catch (err) {
      console.error("Error syncing events:", err)
      setSyncMessage({
        type: 'error',
        text: "Failed to sync events. Please try again later."
      })
      setTimeout(() => setSyncMessage(null), 5000)
    } finally {
      setSyncing(false)
    }
  }

  const handleEventClick = (event: SportsEvent) => {
    if (event.website) {
      window.open(event.website, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold">Malaysia Sports Events</h1>
        </div>
        <Button
          onClick={handleSyncEvents}
          disabled={syncing}
          variant="outline"
          className="gap-2"
        >
          {syncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Refresh Events
            </>
          )}
        </Button>
      </div>

      {/* Sync Status Message */}
      {syncMessage && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded ${
          syncMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {syncMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium flex-1">{syncMessage.text}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading events...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Error loading events</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchEvents}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Events List - Blog Style */}
      {!loading && !error && (
        <>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No events found</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{events.length}</span> latest event{events.length !== 1 ? 's' : ''}
                </p>
              </div>
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

