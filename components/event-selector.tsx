// components/event-selector.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Check, ChevronDown, X, Plus, Calendar, Loader2, MapPin, CalendarDays } from "lucide-react"
import { useAddEvents } from "../hooks/use-events"
import { usePlaces } from "../hooks/use-places"
import type { Place } from "../types/places"
import type { Event } from "../types/events"

interface EventSelectorProps {
  allEvents: Event[]
  selectedEvent?: string
  onSelectionChange: (eventId: string) => void
  isLoading?: boolean
  allPlaces?: Place[]
}

export function EventSelector({
  allEvents,
  selectedEvent,
  onSelectionChange,
  isLoading = false,
  allPlaces = [],
}: EventSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [pendingUpdates, setPendingUpdates] = useState<string[]>([])
  const { data: places = allPlaces } = usePlaces()

  const addEventsMutation = useAddEvents()

  // Helper function to get place name from placeId
  const getPlaceName = (placeId?: string): string | undefined => {
    if (!placeId) return undefined
    const place = places.find((p) => p.id === placeId)
    return place?.name
  }

  const filteredEvents = allEvents.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (getPlaceName(event.placeId ?? undefined) &&
        getPlaceName(event.placeId ?? undefined)!
          .toLowerCase()
          .includes(searchTerm.toLowerCase())),
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
          dateType: "exact" as const,
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
    <div className="w-full space-y-2">
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between h-8 text-xs border-slate-200"
        disabled={isLoading}
      >
        <div className="flex items-center space-x-1">
          <CalendarDays className="h-3 w-3 text-slate-500" />
          <span>{isLoading ? "Loading..." : selectedEventObj ? selectedEventObj.title : "Select event..."}</span>
        </div>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="p-3 space-y-3 shadow-sm border-slate-200">
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
            className="h-8 text-xs border-slate-200"
          />

          {/* Add New Event Button */}
          {canAddNew && (
            <Button
              onClick={addNewEvent}
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs border-dashed border-slate-300 text-slate-600"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add "{searchTerm.trim()}"
            </Button>
          )}

          {/* Clear Selection Button */}
          {selectedEvent && (
            <Button
              onClick={handleClearSelection}
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs text-slate-600 border-slate-200"
            >
              <X className="h-3 w-3 mr-1" />
              Clear Selection
            </Button>
          )}

          {/* Pending Updates Indicator */}
          {pendingUpdates.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded p-2 text-xs">
              <p className="text-slate-700 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {pendingUpdates.length} new {pendingUpdates.length === 1 ? "event" : "events"} will be saved
              </p>
              <p className="text-slate-600 mt-1 bg-white rounded px-1.5 py-0.5 text-xs">
                New: {pendingUpdates.join(", ")}
              </p>
            </div>
          )}

          {/* Error Message */}
          {addEventsMutation.isError && (
            <div className="bg-red-50 border border-red-100 rounded p-2">
              <p className="text-xs text-red-600">
                Failed to save events: {addEventsMutation.error?.message || "Unknown error"}
              </p>
            </div>
          )}

          {/* Events List */}
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredEvents.length === 0 && !canAddNew && (
              <p className="text-xs text-slate-500 text-center py-3">No events found</p>
            )}

            {filteredEvents.map((event) => {
              const placeName = getPlaceName(event.placeId ?? undefined)

              return (
                <div
                  key={event.id}
                  onClick={() => handleSelectEvent(event.id)}
                  className="flex items-center space-x-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {selectedEvent === event.id && (
                      <div className="w-3 h-3 bg-slate-700 rounded-sm flex items-center justify-center">
                        <Check className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-700">{event.title}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <span>{formatDate(event.date)}</span>
                      {placeName && (
                        <span className="flex items-center">
                          <MapPin className="h-2 w-2 mr-0.5" />
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
                className="flex items-center space-x-2 p-1.5 rounded bg-slate-50 border border-slate-200"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-3 h-3 bg-slate-700 rounded-sm flex items-center justify-center">
                    <Check className="h-2 w-2 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-700">{title}</div>
                  <div className="text-[10px] text-slate-600">Will be added to database</div>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0">
                  Pending
                </Badge>
              </div>
            ))}
          </div>

          {/* Close Button */}
          <Button
            onClick={handleClose}
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs bg-slate-50 border-slate-200"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              "Done"
            )}
          </Button>
        </Card>
      )}

      {/* Selected Event Badge */}
      {selectedEventObj && (
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
          <div className="flex items-center space-x-2">
            <Calendar className="h-3 w-3 text-slate-500" />
            <div>
              <div className="text-xs font-medium text-slate-700">{selectedEventObj.title}</div>
              <div className="text-[10px] text-slate-500">
                {formatDate(selectedEventObj.date)}
                {selectedEventPlace && (
                  <span className="flex items-center mt-0.5">
                    <MapPin className="h-2 w-2 mr-0.5 text-slate-500" />
                    {selectedEventPlace}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={handleClearSelection} className="hover:bg-slate-200 rounded-full p-1">
            <X className="h-3 w-3 text-slate-500" />
          </button>
        </div>
      )}
    </div>
  )
}
