"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Save,
  Brain,
  User,
  MapPin,
  Calendar,
  Clock,
  Loader2,
  X,
  Eye,
  FileText,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
} from "lucide-react"
import {
  useUpdateMemory,
  useAddReflection,
  useUpdateReflection,
  useDeleteReflection,
} from "../../../hooks/use-memories"
import { usePeople } from "../../../hooks/use-people"
import { usePlaces } from "../../../hooks/use-places"
import { useEvents } from "../../../hooks/use-events"
import { PeopleSelector } from "@/components/people-selector"
import { PlaceSelector } from "@/components/place-selector"
import { EventSelector } from "@/components/event-selector"
import type { Memory } from "@/types/memories"
import type { Reflection } from "@/types/reflection"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ReflectionDialog } from "@/components/reflection-dialog"

interface MemoryDetailsFormProps {
  memory: Memory
}

export function MemoryDetailsForm({ memory }: MemoryDetailsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const updateMemoryMutation = useUpdateMemory()

  const { data: allPeople = [] } = usePeople()
  const { data: allPlaces = [] } = usePlaces()
  const { data: allEvents = [] } = useEvents()

  // Form state
  const [formData, setFormData] = useState({
    title: memory.title || "",
    description: memory.description || "",
    date: memory.date ? new Date(memory.date).toISOString().slice(0, 16) : "",
    peopleIds: memory.peopleIds || [],
    placeId: memory.placeId || "",
    eventId: memory.eventId || "",
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [showPlaceErrorDialog, setShowPlaceErrorDialog] = useState(false)

  const [reflectionDialog, setReflectionDialog] = useState<{
    open: boolean
    reflection?: Reflection
  }>({ open: false })

  const addReflectionMutation = useAddReflection()
  const updateReflectionMutation = useUpdateReflection()
  const deleteReflectionMutation = useDeleteReflection()

  // Update form data when memory changes
  useEffect(() => {
    setFormData({
      title: memory.title || "",
      description: memory.description || "",
      date: memory.date ? new Date(memory.date).toISOString().slice(0, 16) : "",
      peopleIds: memory.peopleIds || [],
      placeId: memory.placeId || "",
      eventId: memory.eventId || "",
    })
    setHasChanges(false)
  }, [memory])

  // Check for changes
  useEffect(() => {
    const hasFormChanges =
      formData.title !== (memory.title || "") ||
      formData.description !== (memory.description || "") ||
      formData.date !== (memory.date ? new Date(memory.date).toISOString().slice(0, 16) : "") ||
      JSON.stringify(formData.peopleIds) !== JSON.stringify(memory.peopleIds || []) ||
      formData.placeId !== (memory.placeId || "") ||
      formData.eventId !== (memory.eventId || "")

    setHasChanges(hasFormChanges)
  }, [formData, memory])

  const handleInputChange = (field: string, value: string | string[]) => {
    // Prevent place changes when memory has an event
    if (field === "placeId" && formData.eventId) {
      setShowPlaceErrorDialog(true)
      return
    }

    // Special handling for event selection/removal
    if (field === "eventId") {
      // If selecting a new event, find its associated place
      if (value) {
        const selectedEvent = allEvents.find((event) => event.id === value)
        if (selectedEvent && selectedEvent.placeId) {
          // Update both event and place in form state
          setFormData((prev) => ({
            ...prev,
            eventId: value as string,
            placeId: selectedEvent.placeId || "",
          }))
          return
        }
      }

      // If removing event or event has no place
      setFormData((prev) => ({
        ...prev,
        eventId: value as string,
        // Only clear place if removing event
        placeId: value ? prev.placeId : "",
      }))
      return
    }

    // Default case - just update the specified field
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddReflection = () => {
    setReflectionDialog({ open: true })
  }

  const handleEditReflection = (reflection: Reflection) => {
    setReflectionDialog({ open: true, reflection })
  }

  const handleSaveReflection = async (title: string, content: string) => {
    try {
      if (reflectionDialog.reflection) {
        // Update existing reflection
        await updateReflectionMutation.mutateAsync({
          reflectionId: reflectionDialog.reflection.id,
          title,
          content,
        })
        toast({
          title: "Success",
          description: "Reflection updated successfully",
        })
      } else {
        // Add new reflection
        await addReflectionMutation.mutateAsync({
          memoryId: memory.id,
          title,
          content,
        })
        toast({
          title: "Success",
          description: "Reflection added successfully",
        })
      }
      setReflectionDialog({ open: false })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save reflection",
        variant: "destructive",
      })
    }
  }

  const handleDeleteReflection = async (reflectionId: string) => {
    if (confirm("Are you sure you want to delete this reflection?")) {
      try {
        await deleteReflectionMutation.mutateAsync(reflectionId)
        toast({
          title: "Success",
          description: "Reflection deleted successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete reflection",
          variant: "destructive",
        })
      }
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Memory title is required",
        variant: "destructive",
      })
      return
    }

    try {
      const updates = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: new Date(formData.date),
        peopleIds: formData.peopleIds,
        placeId: formData.placeId || undefined,
        eventId: formData.eventId || undefined,
      }

      await updateMemoryMutation.mutateAsync({
        id: memory.id,
        updates,
      })

      toast({
        title: "Success",
        description: "Memory updated successfully",
      })

      // Navigate back to main page after successful save
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update memory",
        variant: "destructive",
      })
    }
  }

  // Get selected items for display
  const selectedPeople = allPeople.filter((person) => formData.peopleIds.includes(person.id))
  const selectedPlace = allPlaces.find((place) => place.id === formData.placeId)
  const selectedEvent = allEvents.find((event) => event.id === formData.eventId)

  // Get original items for comparison
  const originalEvent = allEvents.find((event) => event.id === memory.eventId)

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

  // Check if event has changed
  const hasEventChanged = formData.eventId !== memory.eventId

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Memory Overview Panel */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <Brain className="h-4 w-4 mr-2" />
            Memory Overview
          </h3>
          <div className="space-y-3">
            <div className="text-center">
              {/* Media Thumbnail */}
              <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden bg-gray-100 mb-3 border-2 border-gray-200">
                {memory.mediaType === "photo" ? (
                  <img
                    src={memory.mediaUrl || "/placeholder.svg"}
                    alt={memory.title}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                    <FileText className="h-8 w-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 text-center px-1 leading-tight">
                      {memory.mediaName.split(".").pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <h4 className="font-medium text-lg">{formData.title || memory.title}</h4>
              <Badge variant="secondary" className="mt-2">
                {memory.mediaType === "photo" ? "Photo Memory" : "Document Memory"}
              </Badge>
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
              {selectedPeople.length > 0 && (
                <div className="flex items-center text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span>{selectedPeople.length} people</span>
                </div>
              )}
              {originalEvent && (
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{originalEvent.title}</span>
                  {hasEventChanged && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Will change on save
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {formData.description && (
              <div className="mt-4">
                <h5 className="font-medium text-sm mb-2">Description</h5>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{formData.description}</p>
              </div>
            )}

            {/* Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h5 className="font-medium text-sm mb-2">Associations</h5>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1 text-blue-600" />
                  {selectedPeople.length} people associated
                </div>
                <div className="flex items-center">
                  <MapPin className={`h-3 w-3 mr-1 ${selectedPlace ? "text-green-600" : "text-gray-400"}`} />
                  {selectedPlace ? `Place: ${selectedPlace.name}` : "No place associated"}
                </div>
                <div className="flex items-center">
                  <Calendar className={`h-3 w-3 mr-1 ${originalEvent ? "text-purple-600" : "text-gray-400"}`} />
                  {originalEvent ? `Event: ${originalEvent.title}` : "No event associated"}
                  {hasEventChanged && <span className="ml-1 text-amber-600">(pending changes)</span>}
                </div>
              </div>
            </div>

            {/* Memory Statistics */}
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h5 className="font-medium text-sm mb-2">Memory Info</h5>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Created: {new Date(memory.createdAt).toLocaleDateString()}</div>
                <div>Last Updated: {new Date(memory.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Details Form */}
      <div className="lg:col-span-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              People ({selectedPeople.length})
            </TabsTrigger>
            <TabsTrigger value="event" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Event {hasEventChanged && "✎"}
              {!hasEventChanged && selectedEvent && "✓"}
            </TabsTrigger>
            <TabsTrigger value="place" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Place {selectedPlace && "✓"}
            </TabsTrigger>
            <TabsTrigger value="reflections" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Reflections ({memory.reflectionIds?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Memory Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                Memory Details
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter memory title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe this memory..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date & Time</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* People Tab */}
          <TabsContent value="people" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Select People
              </h3>
              <PeopleSelector
                allPeople={allPeople}
                selectedPeople={formData.peopleIds}
                onSelectionChange={(peopleIds) => handleInputChange("peopleIds", peopleIds)}
                isLoading={false}
              />

              {selectedPeople.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">Selected People:</h4>
                  <div className="space-y-2">
                    {selectedPeople.map((person) => (
                      <div key={person.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                            {person.photoUrl ? (
                              <img
                                src={person.photoUrl || "/placeholder.svg"}
                                alt={person.name}
                                className="w-full h-full object-cover"
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
                                {person.name
                                  .split(" ")
                                  .map((part) => part.charAt(0))
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{person.name}</div>
                            {person.role && <div className="text-xs text-gray-600">{person.role}</div>}
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            const updatedPeopleIds = formData.peopleIds.filter((id) => id !== person.id)
                            handleInputChange("peopleIds", updatedPeopleIds)
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Event Tab */}
          <TabsContent value="event" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Associate with Event
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-700">
                    <strong>"{formData.title}"</strong> can be associated with an event. When you select an event, the
                    memory's location will automatically be set to the event's venue. Changes will be applied when you
                    click "Save Changes".
                  </p>
                </div>

                {hasEventChanged && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <p className="text-sm text-amber-700 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Event association changes will be applied when you save this form.
                    </p>
                  </div>
                )}

                <EventSelector
                  allEvents={allEvents}
                  selectedEvent={formData.eventId}
                  onSelectionChange={(eventId) => handleInputChange("eventId", eventId)}
                  isLoading={false}
                />

                {selectedEvent && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => router.push(`/event-details/${selectedEvent.id}`)}
                      size="sm"
                      variant="outline"
                      className="h-8"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Event Details
                    </Button>
                    <Button
                      onClick={() => handleInputChange("eventId", "")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove Association
                    </Button>
                  </div>
                )}

                {!selectedEvent && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No event associated with this memory</p>
                    <p className="text-xs mt-1">Select an event above to create an association</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Place Tab */}
          <TabsContent value="place" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Associate with Place
              </h3>
              <div className="space-y-4">
                {formData.eventId && selectedEvent && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                        <Calendar className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-yellow-800">Place Locked by Event</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          This memory's place is automatically set to <strong>{selectedPlace?.name}</strong> because
                          it's associated with the event "<strong>{selectedEvent.title}</strong>". To change the place,
                          you must first change or remove the event.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-700">
                    <strong>"{formData.title}"</strong> is an independent memory. Select a place to associate it with.
                    Selecting a different place will automatically replace the current association.
                  </p>
                </div>

                <PlaceSelector
                  allPlaces={allPlaces}
                  selectedPlace={formData.placeId}
                  onSelectionChange={(placeId) => handleInputChange("placeId", placeId)}
                  isLoading={false}
                />

                {selectedPlace && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => router.push(`/place-details/${selectedPlace.id}`)}
                      size="sm"
                      variant="outline"
                      className="h-8"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Place Details
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Reflections Tab */}
          <TabsContent value="reflections" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Reflections
                </h3>
                <Button onClick={handleAddReflection} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reflection
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-700">
                    Reflections allow you to capture your thoughts, insights, and feelings about this memory. You can
                    add multiple reflections over time to see how your perspective evolves.
                  </p>
                </div>

                {memory.reflectionIds && memory.reflectionIds.length > 0 ? (
                  <div className="space-y-4">
                    {/* You need to fetch or map reflection objects by their IDs here */}
                    {/* Example: If you have a reflections array in props or context, map by IDs */}
                    {/* Replace the following with your actual reflection fetching logic */}
                    {/* 
                      You need to provide the actual reflections array, e.g. from props or context.
                      For demonstration, let's assume you have a `reflections` array of type Reflection[].
                      Replace the following line with your actual data source.
                    */}
                    {/* TODO: Replace the following with your actual reflections data source */}
                    {/* Example: const reflections = useReflectionsForMemory(memory.id) */}
                    {(memory.reflectionIds as string[]).map((reflectionId) => {
                      // You need to fetch the reflection object by ID.
                      // For demonstration, we'll assume you have a `reflections` array available in scope.
                      // Replace `reflections` with your actual data source.
                      const reflection = (typeof window !== "undefined" && (window as any).reflections
                        ? (window as any).reflections
                        : []
                      ).find((r: Reflection) => r.id === reflectionId)
                      if (!reflection) return null
                      return (
                        <div key={reflection.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-sm">{reflection.title}</h4>
                              <div className="text-xs text-gray-500">
                                {new Date(reflection.createdAt).toLocaleDateString()} at{" "}
                                {new Date(reflection.createdAt).toLocaleTimeString()}
                                {new Date(reflection.updatedAt).getTime() !== new Date(reflection.createdAt).getTime() && (
                                  <span className="ml-2">(edited {new Date(reflection.updatedAt).toLocaleDateString()})</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => handleEditReflection(reflection)}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteReflection(reflection.id)}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: reflection.content
                                .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                                .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
                                .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                                .replace(
                                  /`(.*?)`/g,
                                  '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>',
                                )
                                .replace(/^\* (.*$)/gim, '<li class="ml-4">• $1</li>')
                                .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">1. $1</li>')
                                .replace(
                                  /^> (.*$)/gim,
                                  '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600">$1</blockquote>',
                                )
                                .replace(/\n/g, "<br>"),
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No reflections yet</p>
                    <p className="text-xs mt-1">Add your first reflection to capture your thoughts about this memory</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateMemoryMutation.isPending}
            className="min-w-[120px]"
          >
            {updateMemoryMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
            <p className="text-sm text-yellow-700">
              You have unsaved changes. Click "Save Changes" to update the memory.
              {hasEventChanged && " This includes changes to event associations."}
            </p>
          </div>
        )}
      </div>
      {/* Place Change Error Dialog */}
      {showPlaceErrorDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cannot Change Place</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This memory is associated with an event. The place is automatically set based on the event's location.
              <br />
              <br />
              To change the place, you must first change or remove the event association.
            </p>
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setShowPlaceErrorDialog(false)} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowPlaceErrorDialog(false)
                  setActiveTab("event")
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Event Tab
              </Button>
            </div>
          </div>
        </div>
      )}
      <ReflectionDialog
        open={reflectionDialog.open}
        onOpenChange={(open) => setReflectionDialog({ open })}
        reflection={reflectionDialog.reflection}
        onSave={handleSaveReflection}
        isLoading={addReflectionMutation.isPending || updateReflectionMutation.isPending}
      />
    </div>
  )
}
