"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Check, ChevronDown, X, Plus, Calendar, Loader2, MapPin } from "lucide-react"
import { useAddEvents } from "../hooks/use-events"
import { usePlaces } from "../hooks/use-places"

// Import or define the Place type
import type { Place } from "../types/places" // Adjust the path as needed

// Import or define the Event type
import type { Event } from "../types/events" // Adjust the path as needed

interface EventSelectorProps {
  allEvents: Event[]
  selectedEvent?: string // Changed from selectedEvents array to single selectedEvent
  onSelectionChange: (eventId: string) => void // Changed to pass single event ID
  isLoading?: boolean
  allPlaces?: Place[] // Added to display place names
}

export function EventSelector({
  allEvents,
  selectedEvent,
  onSelectionChange,
  isLoading = false,
  allPlaces = [], // Default to empty array if not provided
}: EventSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [pendingUpdates, setPendingUpdates] = useState<string[]>([])
  const { data: places = allPlaces } = usePlaces()

  const addEventsMutation = useAddEvents()

  const filteredEvents = allEvents.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPlaceName(event.placeId)?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const canAddNew =
    searchTerm.trim() && !allEvents.some((event) => event.title.toLowerCase() === searchTerm.trim().toLowerCase())

  const addNewEvent = () => {
    if (canAddNew) {
      const newEventTitle = searchTerm.trim()
      setPendingUpdates((prev) => [...prev, newEventTitle])
      setSearchTerm("")
    }
  }

  const handleSelectEvent = (eventId: string) => {
    // Always replace the current selection with the new one
    onSelectionChange(eventId)
    setSearchTerm("")
  }

  const handleClearSelection = () => {
    onSelectionChange("")
  }

  const handleClose = async () => {
    if (pendingUpdates.length > 0) {
      try {
        // Use TanStack Query mutation to add events
        const eventData = pendingUpdates.map((title) => ({
          title,
          description: `New event: ${title}`,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to next week
          placeId: undefined, // No place by default
          type: "meeting" as const,
        }))

        const newEvents = await addEventsMutation.mutateAsync(eventData)

        // Auto-select the first newly added event
        if (newEvents.length > 0) {
          onSelectionChange(newEvents[0].id)
        }

        setPendingUpdates([]) // Clear pending updates after successful save
      } catch (error) {
        console.error("Failed to save events:", error)
        // Keep pending updates on error so user can retry
        return // Don't close the dialog on error
      }
    }
    setIsOpen(false)
  }

  // Helper function to get place name from placeId
  const getPlaceName = (placeId?: string): string | undefined => {
    if (!placeId) return undefined
    const place = places.find((p) => p.id === placeId)
    return place?.name
  }

  const isSaving = addEventsMutation.isPending

 

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const selectedEventObj = allEvents.find((e) => e.id === selectedEvent)
  const selectedEventPlace = selectedEventObj?.placeId ? getPlaceName(selectedEventObj.placeId) : undefined

  return (
    <div className="w-full space-y-3">
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
        disabled={isLoading}
      >
        <span>{isLoading ? "Loading..." : selectedEventObj ? selectedEventObj.title : "Select event..."}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="p-3 space-y-3">
          {/* Search Input */}
          <Input
            placeholder="Search or add new event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAddNew) {
                addNewEvent()
              }
            }}
          />

          {/* Add New Event Button */}
          {canAddNew && (
            <Button onClick={addNewEvent} variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add "{searchTerm.trim()}"
            </Button>
          )}

          {/* Clear Selection Button */}
          {selectedEvent && (
            <Button
              onClick={handleClearSelection}
              variant="outline"
              size="sm"
              className="w-full text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Selection
            </Button>
          )}

          {/* Pending Updates Indicator */}
          {pendingUpdates.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-sm text-blue-700">
                <Calendar className="h-4 w-4 inline mr-1" />
                {pendingUpdates.length} new {pendingUpdates.length === 1 ? "event" : "events"} will be saved to database
                when you close this dialog
              </p>
              <p className="text-xs text-blue-600 mt-1">New: {pendingUpdates.join(", ")}</p>
            </div>
          )}

          {/* Error Message */}
          {addEventsMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-sm text-red-700">
                ❌ Failed to save events: {addEventsMutation.error?.message || "Unknown error"}
              </p>
            </div>
          )}

          {/* Events List */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredEvents.length === 0 && !canAddNew && (
              <p className="text-sm text-gray-500 text-center py-2">No events found</p>
            )}

            {filteredEvents.map((event) => {
              const placeName = getPlaceName(event.placeId)

              return (
                <div
                  key={event.id}
                  onClick={() => handleSelectEvent(event.id)}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {selectedEvent === event.id && <Check className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{formatDate(event.date)}</span>
                      {placeName && (
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {placeName}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              )
            })}

            {/* Show pending events in the list */}
            {pendingUpdates.map((title) => (
              <div
                key={`pending-${title}`}
                className="flex items-center space-x-2 p-2 rounded bg-blue-50 border-blue-200"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{title}</div>
                  <div className="text-xs text-blue-600">Will be added to database</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Pending
                </Badge>
              </div>
            ))}
          </div>

          {/* Close Button */}
          <Button onClick={handleClose} variant="outline" size="sm" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving to Database...
              </>
            ) : (
              "Done"
            )}
          </Button>
        </Card>
      )}

      {/* Selected Event Badge */}
      {selectedEventObj && (
        <div className="flex items-center justify-between p-2 bg-purple-50 rounded border">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            <div>
              <div className="font-medium text-sm">{selectedEventObj.title}</div>
              <div className="text-xs text-gray-600">
                {formatDate(selectedEventObj.date)}
                {selectedEventPlace && (
                  <span className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                    {selectedEventPlace}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={handleClearSelection} className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
