"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, Calendar, MapPin, Users, Clock, FileText, Plus, X, Settings } from "lucide-react"
import { useUpdateEventDetails } from "../../../hooks/use-events"
import { usePlaces } from "../../../hooks/use-places"
import type { Event, EventAttribute } from "@/types/events"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { AttributeSelector } from "../../../components/attribute-selector"
import { PlaceSelector } from "../../../components/place-selector"

interface EventDetailsFormProps {
  event: Event
}

export function EventDetailsForm({ event }: EventDetailsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const updateEventMutation = useUpdateEventDetails()
  const { data: allPlaces = [] } = usePlaces()

  // Form state
  const [formData, setFormData] = useState({
    title: event.title || "",
    description: event.description || "",
    date: event.date ? new Date(event.date).toISOString().slice(0, 16) : "",
    placeId: event.placeId || "",
    attributes: event.attributes || [],
  })

  const [hasChanges, setHasChanges] = useState(false)

  // Update form data when event changes
  useEffect(() => {
    setFormData({
      title: event.title || "",
      description: event.description || "",
      date: event.date ? new Date(event.date).toISOString().slice(0, 16) : "",
      placeId: event.placeId || "",
      attributes: event.attributes || [],
    })
    setHasChanges(false)
  }, [event])

  // Check for changes
  useEffect(() => {
    const hasFormChanges =
      formData.title !== (event.title || "") ||
      formData.description !== (event.description || "") ||
      formData.date !== (event.date ? new Date(event.date).toISOString().slice(0, 16) : "") ||
      formData.placeId !== (event.placeId || "") ||
      JSON.stringify(formData.attributes) !== JSON.stringify(event.attributes || [])
    setHasChanges(hasFormChanges)
  }, [formData, event])

  const handleInputChange = (field: string, value: string | EventAttribute[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Saving event details...", formData)

      const updates = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: formData.date ? new Date(formData.date) : new Date(),
        placeId: formData.placeId || undefined,
        attributes: formData.attributes,
      }

      console.log("Updates to be sent:", updates)

      const result = await updateEventMutation.mutateAsync({
        id: event.id,
        updates,
      })

      console.log("Update result:", result)

      toast({
        title: "Success",
        description: "Event details updated successfully",
      })

      // Navigate back to main page after successful save
      router.push("/")
    } catch (error) {
      console.error("Failed to update event:", error)
      toast({
        title: "Error",
        description: `Failed to update event details: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    }
  }



  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "Not set"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Get the place object for the selected placeId
  const selectedPlace = allPlaces.find((place) => place.id === formData.placeId)

  // Attribute management functions
  const addAttribute = () => {
    const newAttribute: EventAttribute = { attribute: "", value: "" }
    handleInputChange("attributes", [...formData.attributes, newAttribute])
  }

  const updateAttribute = (index: number, field: "attribute" | "value", value: string) => {
    const updatedAttributes = [...formData.attributes]
    updatedAttributes[index] = { ...updatedAttributes[index], [field]: value }
    handleInputChange("attributes", updatedAttributes)
  }

  const removeAttribute = (index: number) => {
    const updatedAttributes = formData.attributes.filter((_, i) => i !== index)
    handleInputChange("attributes", updatedAttributes)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Event Overview Panel */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Event Overview
          </h3>
          <div className="space-y-3">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                {event.title.charAt(0).toUpperCase()}
              </div>
              <h4 className="font-medium text-lg">{event.title}</h4>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>{formatDateForDisplay(formData.date)}</span>
              </div>
              {selectedPlace && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{selectedPlace.name}</span>
                </div>
              )}

            </div>

            {formData.description && (
              <div className="mt-4">
                <h5 className="font-medium text-sm mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Description
                </h5>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{formData.description}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Details Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter event title"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter event description"
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Schedule & Location */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Schedule & Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="placeId">Location</Label>
              <PlaceSelector
                allPlaces={allPlaces}
                selectedPlace={formData.placeId}
                onSelectionChange={(placeId) => handleInputChange("placeId", placeId)}
              />
            </div>
          </div>
        </Card>

        {/* Other Details */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Other Details
            </h3>
            <Button onClick={addAttribute} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Attribute
            </Button>
          </div>

          <div className="space-y-4">
            {formData.attributes.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">
                No additional attributes. Click "Add Attribute" to add event requirements, logistics, or other details.
              </p>
            ) : (
              formData.attributes.map((attr, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Attribute</Label>
                    <AttributeSelector
                      value={attr.attribute}
                      onChange={(value) => updateAttribute(index, "attribute", value)}
                      placeholder="Select or add attribute..."
                      entityType="event"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Value</Label>
                      <Button
                        onClick={() => removeAttribute(index)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, "value", e.target.value)}
                      placeholder="Enter value..."
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {formData.attributes.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Current Attributes:</h4>
              <div className="flex flex-wrap gap-2">
                {formData.attributes
                  .filter((attr) => attr.attribute && attr.value)
                  .map((attr, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {attr.attribute}: {attr.value}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </Card>

        {/* Event Statistics */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Event Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor((new Date(formData.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-gray-600">Days Until</div>
            </div>
            <div>

              <div className="text-sm text-gray-600">Capacity</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{new Date(event.createdAt).toLocaleDateString()}</div>
              <div className="text-sm text-gray-600">Created</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{new Date(event.updatedAt).toLocaleDateString()}</div>
              <div className="text-sm text-gray-600">Last Updated</div>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateEventMutation.isPending}
            className="min-w-[120px]"
          >
            {updateEventMutation.isPending ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-700">
              You have unsaved changes. Click "Save Changes" to update the event details.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
