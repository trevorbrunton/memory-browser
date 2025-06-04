"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Check, ChevronDown, X, Plus, MapPin, Loader2, Star } from "lucide-react"
import type { Place } from "../data/places"
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
      office: "bg-blue-100 text-blue-800",
      restaurant: "bg-red-100 text-red-800",
      hotel: "bg-purple-100 text-purple-800",
      venue: "bg-green-100 text-green-800",
      park: "bg-emerald-100 text-emerald-800",
      museum: "bg-amber-100 text-amber-800",
      store: "bg-orange-100 text-orange-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  const renderRating = (rating?: number) => {
    if (!rating) return null
    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="text-xs text-gray-600">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const selectedPlaceObj = allPlaces.find((p) => p.id === selectedPlace)

  return (
    <div className="w-full space-y-3">
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
        disabled={isLoading}
      >
        <span>{isLoading ? "Loading..." : selectedPlaceObj ? selectedPlaceObj.name : "Select place..."}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="p-3 space-y-3">
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
          />

          {/* Add New Place Button */}
          {canAddNew && (
            <Button onClick={addNewPlace} variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add "{searchTerm.trim()}"
            </Button>
          )}

          {/* Clear Selection Button */}
          {selectedPlace && (
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
                <MapPin className="h-4 w-4 inline mr-1" />
                {pendingUpdates.length} new {pendingUpdates.length === 1 ? "place" : "places"} will be saved to database
                when you close this dialog
              </p>
              <p className="text-xs text-blue-600 mt-1">New: {pendingUpdates.join(", ")}</p>
            </div>
          )}

          {/* Error Message */}
          {addPlacesMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-sm text-red-700">
                ❌ Failed to save places: {addPlacesMutation.error?.message || "Unknown error"}
              </p>
            </div>
          )}

          {/* Places List */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredPlaces.length === 0 && !canAddNew && (
              <p className="text-sm text-gray-500 text-center py-2">No places found</p>
            )}

            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => handleSelectPlace(place.id)}
                className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {selectedPlace === place.id && <Check className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{place.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>
                      {place.city}, {place.country}
                    </span>
                    {place.capacity && <span>• {place.capacity} capacity</span>}
                    {renderRating(place.rating)}
                  </div>
                </div>
                <Badge className={`text-xs ${getPlaceTypeColor(place.type)}`}>{place.type}</Badge>
              </div>
            ))}

            {/* Show pending places in the list */}
            {pendingUpdates.map((name) => (
              <div
                key={`pending-${name}`}
                className="flex items-center space-x-2 p-2 rounded bg-blue-50 border-blue-200"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{name}</div>
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

      {/* Selected Place Badge */}
      {selectedPlaceObj && (
        <div className="flex items-center justify-between p-2 bg-green-50 rounded border">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium text-sm">{selectedPlaceObj.name}</div>
              <div className="text-xs text-gray-600">
                {selectedPlaceObj.city}, {selectedPlaceObj.country}
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
