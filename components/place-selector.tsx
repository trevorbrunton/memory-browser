"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Check, ChevronDown, X, Plus, MapPin, Loader2, Star, Building } from "lucide-react"
import type { Place } from "@/types/places"
import { useAddPlaces } from "../hooks/use-places"

interface PlaceSelectorProps {
  allPlaces: Place[]
  selectedPlace?: string // Changed from selectedPlaces array to single selectedPlace
  onSelectionChange: (placeId: string) => void // Changed to pass single place ID
  isLoading?: boolean
}

export function PlaceSelector({ allPlaces, selectedPlace, onSelectionChange, isLoading = false }: PlaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [pendingUpdates, setPendingUpdates] = useState<string[]>([])

  const addPlacesMutation = useAddPlaces()

  const filteredPlaces = allPlaces.filter(
    (place) =>
      place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.address?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const canAddNew =
    searchTerm.trim() && !allPlaces.some((place) => place.name.toLowerCase() === searchTerm.trim().toLowerCase())

  const addNewPlace = () => {
    if (canAddNew) {
      const newPlaceName = searchTerm.trim()
      setPendingUpdates((prev) => [...prev, newPlaceName])
      setSearchTerm("")
    }
  }

  const handleSelectPlace = (placeId: string) => {
    // Always replace the current selection with the new one
    onSelectionChange(placeId)
    setSearchTerm("")
  }

  const handleClearSelection = () => {
    onSelectionChange("")
  }

  const handleClose = async () => {
    if (pendingUpdates.length > 0) {
      try {
        // Use TanStack Query mutation to add places
        const placeData = pendingUpdates.map((name) => ({
          name,
          address: "Address TBD",
          city: "City TBD",
          country: "USA",
          type: "office" as const,
        }))

        const newPlaces = await addPlacesMutation.mutateAsync(placeData)

        // Auto-select the first newly added place
        if (newPlaces.length > 0) {
          onSelectionChange(newPlaces[0].id)
        }

        setPendingUpdates([]) // Clear pending updates after successful save
      } catch (error) {
        console.error("Failed to save places:", error)
        // Keep pending updates on error so user can retry
        return // Don't close the dialog on error
      }
    }
    setIsOpen(false)
  }

  const isSaving = addPlacesMutation.isPending

  const getPlaceTypeColor = (type: Place["type"]) => {
    const colors = {
      office: "bg-slate-100 text-slate-700",
      restaurant: "bg-slate-100 text-slate-700",
      hotel: "bg-slate-100 text-slate-700",
      venue: "bg-slate-100 text-slate-700",
      park: "bg-slate-100 text-slate-700",
      museum: "bg-slate-100 text-slate-700",
      store: "bg-slate-100 text-slate-700",
    }
    return colors[type] || "bg-slate-100 text-slate-700"
  }

  const renderRating = (rating?: number) => {
    if (!rating) return null
    return (
      <div className="flex items-center gap-0.5">
        <Star className="h-2 w-2 fill-amber-400 text-amber-400" />
        <span className="text-[10px] text-slate-600">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const selectedPlaceObj = allPlaces.find((p) => p.id === selectedPlace)

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
          <Building className="h-3 w-3 text-slate-500" />
          <span>{isLoading ? "Loading..." : selectedPlaceObj ? selectedPlaceObj.name : "Select place..."}</span>
        </div>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="p-3 space-y-3 shadow-sm border-slate-200">
          {/* Search Input */}
          <Input
            placeholder="Search or add new place..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAddNew) {
                addNewPlace()
              }
            }}
            className="h-8 text-xs border-slate-200"
          />

          {/* Add New Place Button */}
          {canAddNew && (
            <Button
              onClick={addNewPlace}
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs border-dashed border-slate-300 text-slate-600"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add "{searchTerm.trim()}"
            </Button>
          )}

          {/* Clear Selection Button */}
          {selectedPlace && (
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
                <MapPin className="h-3 w-3 mr-1" />
                {pendingUpdates.length} new {pendingUpdates.length === 1 ? "place" : "places"} will be saved
              </p>
              <p className="text-slate-600 mt-1 bg-white rounded px-1.5 py-0.5 text-xs">
                New: {pendingUpdates.join(", ")}
              </p>
            </div>
          )}

          {/* Error Message */}
          {addPlacesMutation.isError && (
            <div className="bg-red-50 border border-red-100 rounded p-2">
              <p className="text-xs text-red-600">
                Failed to save places: {addPlacesMutation.error?.message || "Unknown error"}
              </p>
            </div>
          )}

          {/* Places List */}
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredPlaces.length === 0 && !canAddNew && (
              <p className="text-xs text-slate-500 text-center py-3">No places found</p>
            )}

            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => handleSelectPlace(place.id)}
                className="flex items-center space-x-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {selectedPlace === place.id && (
                    <div className="w-3 h-3 bg-slate-700 rounded-sm flex items-center justify-center">
                      <Check className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-700">{place.name}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span>
                      {place.city}, {place.country}
                    </span>
                    {place.capacity && <span>• {place.capacity}</span>}
                    {renderRating(place.rating)}
                  </div>
                </div>
                <Badge className={`text-[10px] border-0 px-1 py-0 ${getPlaceTypeColor(place.type)}`}>
                  {place.type}
                </Badge>
              </div>
            ))}

            {/* Show pending places in the list */}
            {pendingUpdates.map((name) => (
              <div
                key={`pending-${name}`}
                className="flex items-center space-x-2 p-1.5 rounded bg-slate-50 border border-slate-200"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-3 h-3 bg-slate-700 rounded-sm flex items-center justify-center">
                    <Check className="h-2 w-2 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-700">{name}</div>
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

      {/* Selected Place Badge */}
      {selectedPlaceObj && (
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
          <div className="flex items-center space-x-2">
            <MapPin className="h-3 w-3 text-slate-500" />
            <div>
              <div className="text-xs font-medium text-slate-700">{selectedPlaceObj.name}</div>
              <div className="text-[10px] text-slate-500">
                {selectedPlaceObj.city}, {selectedPlaceObj.country}
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
