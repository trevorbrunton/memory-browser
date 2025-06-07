"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Save, ArrowLeft, Calendar, Clock, MapPin, Users, Plus, X, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAddEvents } from "@/hooks/use-events"
import { usePlaces } from "@/hooks/use-places"
import { AttributeSelector } from "@/components/attribute-selector"
import type { Event, EventAttribute } from "@/types/events"

export default function CreateEventPage() {
  const router = useRouter()
  const { toast } = useToast()
  const addEventsMutation = useAddEvents()
  const { data: allPlaces = [] } = usePlaces()

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    endTime: "",
    placeId: "",
    type: "",
    status: "",
    maxAttendees: "",
    attributes: [] as EventAttribute[],
  })

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

    if (!formData.date) {
      toast({
        title: "Error",
        description: "Event date is required",
        variant: "destructive",
      })
      return
    }

    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: new Date(formData.date),
        dateType: "exact" as "exact",
        placeId: formData.placeId || undefined,
        // or another appropriate default/type, adjust as needed
        attributes: formData.attributes,
      };

      const newEvents = await addEventsMutation.mutateAsync([eventData])

      toast({
        title: "Success",
        description: "Event created successfully",
      })

      // Navigate to the new event's details page
      if (newEvents.length > 0) {
        router.push(`/event-details/${newEvents[0].id}`)
      } else {
        router.push("/")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      })
    }
  }





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

  const selectedPlace = allPlaces.find((place) => place.id === formData.placeId)
  const canSave = formData.title.trim() && formData.date && !addEventsMutation.isPending

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.push("/")} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold flex items-center">
            <Calendar className="h-6 w-6 mr-2" />
            Create New Event
          </h1>
        </div>
        <Button onClick={handleSave} disabled={!canSave} className="min-w-[120px]">
          {addEventsMutation.isPending ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Event
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Preview Panel */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Event Preview
            </h3>
            <div className="space-y-3">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {formData.title ? formData.title.charAt(0).toUpperCase() : "?"}
                </div>
                <h4 className="font-medium text-lg">{formData.title || "New Event"}</h4>

              </div>

              <div className="space-y-2 text-sm">
                {formData.date && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(formData.date).toLocaleDateString()}</span>
                  </div>
                )}
                {(formData.time || formData.endTime) && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {formData.time && formData.endTime
                        ? `${formData.time} - ${formData.endTime}`
                        : formData.time || formData.endTime}
                    </span>
                  </div>
                )}
                {selectedPlace && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{selectedPlace.name}</span>
                  </div>
                )}
                {formData.maxAttendees && (
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Max {formData.maxAttendees} attendees</span>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h5 className="font-medium text-sm mb-2">Quick Info</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Type: {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}</div>
                  <div>Status: {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}</div>
                  {formData.date && <div>Date: {new Date(formData.date).toLocaleDateString()}</div>}
                  {selectedPlace && <div>Venue: {selectedPlace.name}</div>}
                  {formData.maxAttendees && <div>Capacity: {formData.maxAttendees} people</div>}
                </div>
              </div>

              {formData.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <h5 className="font-medium text-sm mb-2">Description:</h5>
                  <p className="text-xs text-gray-600 line-clamp-3">{formData.description}</p>
                </div>
              )}

              {formData.attributes.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <h5 className="font-medium text-sm mb-2">Attributes:</h5>
                  <div className="flex flex-wrap gap-1">
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter event title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Event Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="party">Party</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the event..."
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Date & Time Information */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Date & Time Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Start Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Location & Capacity */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Location & Capacity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="placeId">Venue</Label>
                <Select value={formData.placeId} onValueChange={(value) => handleInputChange("placeId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPlaces.map((place) => (
                      <SelectItem key={place.id} value={place.id}>
                        {place.name} - {place.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Max Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  value={formData.maxAttendees}
                  onChange={(e) => handleInputChange("maxAttendees", e.target.value)}
                  placeholder="Enter maximum attendees"
                  min="1"
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
                  No additional attributes. Click "Add Attribute" to add requirements, dress code, or other details.
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

          {/* Help Text */}
          <Card className="p-4 bg-green-50 border-green-200">
            <h4 className="font-medium text-sm mb-2 text-green-800">💡 Tips for Creating Events</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Use clear, descriptive titles that explain what the event is about</li>
              <li>• Add start and end times to help with scheduling</li>
              <li>• Link to a venue if you have one created, or create the venue first</li>
              <li>• Use attributes for dress code, requirements, or special instructions</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
