"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Save, ArrowLeft, User, MapPin, Calendar, ImageIcon, Loader2, Check, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { usePeople } from "../../hooks/use-people"
import { usePlaces } from "../../hooks/use-places"
import { useEvents } from "../../hooks/use-events"
import { useAddMemoryWithFile } from "../../hooks/use-memories"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "../../components/file-upload"
import { PeopleSelector } from "../people-selector"
import { PlaceSelector } from "../../components/place-selector"
import { EventSelector } from "../../components/event-selector"

export default function CreateMemoryPage() {
  const router = useRouter()
  const { toast } = useToast()

  const { data: allPeople = [], isLoading: peopleLoading } = usePeople()
  const { data: allPlaces = [], isLoading: placesLoading } = usePlaces()
  const { data: allEvents = [], isLoading: eventsLoading } = useEvents()
  const addMemoryMutation = useAddMemoryWithFile()

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().slice(0, 16), // Current date/time in datetime-local format
    peopleIds: [] as string[],
    placeId: "",
    eventId: "",
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("upload")

  // Update the handleInputChange function in create-memory/page.tsx to work with placeId instead of location
  const handleInputChange = (field: string, value: string | string[]) => {
    // Special handling for event selection
    if (field === "eventId") {
      const selectedEvent = allEvents.find((event) => event.id === value)

      // Check if the event has a placeId
      if (selectedEvent?.placeId) {
        console.log("Event has placeId:", selectedEvent.placeId)

        // Find the associated place
        const associatedPlace = allPlaces.find((place) => place.id === selectedEvent.placeId)

        if (associatedPlace) {
          console.log("Found matching place:", associatedPlace.name, associatedPlace.id)

          // Update both event and place in a single update
          setFormData((prev) => ({
            ...prev,
            eventId: value as string,
            placeId: associatedPlace.id,
          }))

          toast({
            title: "Place Added",
            description: `${associatedPlace.name} was automatically added as this event's location`,
            duration: 3000,
          })

          return // Exit early since we've already updated the state
        } else {
          console.log("No matching place found for placeId:", selectedEvent.placeId)
        }
      }
    }

    // Default case - just update the specified field
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileSelected = (file: File) => {
    setSelectedFile(file)

    // Create a preview URL for the file
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }

    // Auto-generate title from filename if empty
    if (!formData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, "") // Remove extension
      const formattedName = fileName.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) // Capitalize first letter of each word

      setFormData((prev) => ({
        ...prev,
        title: formattedName,
      }))
    }

    // Move to details tab after upload
    setActiveTab("details")
  }

  const handleSave = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please upload a file first",
        variant: "destructive",
      })
      return
    }

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the memory",
        variant: "destructive",
      })
      return
    }

    try {
      const memoryData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: new Date(formData.date),
        peopleIds: formData.peopleIds,
        placeId: formData.placeId || undefined,
        eventId: formData.eventId || undefined,
      }

      await addMemoryMutation.mutateAsync({
        file: selectedFile,
        memoryData,
      })

      toast({
        title: "Success",
        description: "Memory created successfully",
      })

      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      // Navigate back to main page
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create memory",
        variant: "destructive",
      })
    }
  }

  const isLoading = peopleLoading || placesLoading || eventsLoading
  const canSave = selectedFile && formData.title.trim() && !addMemoryMutation.isPending

  // Get selected items for display
  const selectedPeople = allPeople.filter((person) => formData.peopleIds.includes(person.id))
  const selectedPlace = allPlaces.find((place) => place.id === formData.placeId)
  const selectedEvent = allEvents.find((event) => event.id === formData.eventId)

  const formatDate = (dateString: string) => {
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

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.push("/")} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold flex items-center">
            <ImageIcon className="h-6 w-6 mr-2" />
            Upload Memory
          </h1>
        </div>
        <Button onClick={handleSave} disabled={!canSave} className="min-w-[120px]">
          {addMemoryMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Memory
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Memory Preview Panel */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center">
              <ImageIcon className="h-4 w-4 mr-2" />
              Memory Preview
            </h3>
            <div className="space-y-3">
              {selectedFile ? (
                <div className="space-y-4">
                  {/* Media Preview */}
                  <div className="border rounded-lg overflow-hidden">
                    {selectedFile.type.startsWith("image/") && previewUrl ? (
                      <div className="aspect-video bg-gray-100">
                        <img
                          src={previewUrl || "/placeholder.svg"}
                          alt={selectedFile.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center p-4">
                        <FileText className="h-12 w-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500 text-center break-all">{selectedFile.name}</span>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="space-y-1">
                    <h4 className="font-medium text-lg">{formData.title || selectedFile.name}</h4>
                    <div className="flex items-center">
                      <Badge variant="secondary" className="mr-2">
                        {selectedFile.type.startsWith("image/") ? "Photo" : "Document"}
                      </Badge>
                      <span className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-500">Upload a photo or document to see a preview</p>
                </div>
              )}

              {/* Memory Details */}
              {selectedFile && (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(formData.date)}</span>
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
                  </div>

                  {formData.description && (
                    <div className="mt-4">
                      <h5 className="font-medium text-sm mb-2">Description</h5>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{formData.description}</p>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <h5 className="font-medium text-sm mb-2">Summary</h5>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <Check className="h-3 w-3 mr-1 text-green-600" />
                        {selectedFile.type.startsWith("image/") ? "Photo" : "Document"} uploaded
                      </div>
                      <div className="flex items-center">
                        <Check className="h-3 w-3 mr-1 text-green-600" />
                        {selectedPeople.length} people selected
                      </div>
                      <div className="flex items-center">
                        <Check className={`h-3 w-3 mr-1 ${selectedPlace ? "text-green-600" : "text-gray-400"}`} />
                        {selectedPlace ? "Place selected" : "No place selected"}
                      </div>
                      <div className="flex items-center">
                        <Check className={`h-3 w-3 mr-1 ${selectedEvent ? "text-green-600" : "text-gray-400"}`} />
                        {selectedEvent ? "Event selected" : "No event selected"}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Main Form */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2" disabled={!selectedFile}>
                <FileText className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="people" className="flex items-center gap-2" disabled={!selectedFile}>
                <User className="h-4 w-4" />
                People ({selectedPeople.length})
              </TabsTrigger>
              <TabsTrigger value="event" className="flex items-center gap-2" disabled={!selectedFile}>
                <Calendar className="h-4 w-4" />
                Event {selectedEvent && "✓"}
              </TabsTrigger>
              <TabsTrigger value="place" className="flex items-center gap-2" disabled={!selectedFile}>
                <MapPin className="h-4 w-4" />
                Place {selectedPlace && "✓"}
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload Memory
                </h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-700">
                      Upload a photo or document to create a new memory. The memory will have its own title and
                      description, and you can then associate it with people, places, and events.
                    </p>
                  </div>

                  <FileUpload
                    onFileSelected={handleFileSelected}
                    accept="image/*,application/pdf,.doc,.docx,.txt"
                    maxSize={10485760} // 10MB
                  />

                  {selectedFile && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-sm text-green-700">
                        ✅ File uploaded successfully! You can now add details and associations in the other tabs.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Memory Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Memory Details
                </h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-700">
                      Give your memory a unique title and description. This is independent from any events, places, or
                      people you might associate with it.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Memory Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="e.g., 'The Gang', 'Summer Vacation', 'Project Kickoff'"
                    />
                    <p className="text-xs text-gray-500">
                      Choose a memorable name for this photo/document that describes what it means to you
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe this memory, what makes it special, or any context you want to remember..."
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
                    <p className="text-xs text-gray-500">When was this memory captured or when did it happen?</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* People Tab */}
            <TabsContent value="people" className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Associate People
                </h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-700">
                      Select the people who are in this photo/document or are related to this memory. You can add or
                      remove people at any time.
                    </p>
                  </div>

                  <PeopleSelector
                    allPeople={allPeople}
                    selectedPeople={formData.peopleIds}
                    onSelectionChange={(peopleIds) => handleInputChange("peopleIds", peopleIds)}
                    isLoading={peopleLoading}
                  />

                  {selectedPeople.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm mb-2">People in this memory:</h4>
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Event Tab */}
            <TabsContent value="event" className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Associate with Event (Optional)
                </h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-700">
                      If this memory was captured during a specific event, you can associate it here. The memory keeps
                      its own title - this just links it to the event for context.
                    </p>
                  </div>

                  <EventSelector
                    allEvents={allEvents}
                    selectedEvent={formData.eventId}
                    onSelectionChange={(eventId) => handleInputChange("eventId", eventId)}
                    isLoading={eventsLoading}
                  />

                  {selectedEvent && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Associated Event:</h4>
                      <div className="p-3 bg-purple-50 rounded border">
                        <div className="font-medium">{selectedEvent.title}</div>
                        <div className="text-sm text-gray-600">
                          {new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(selectedEvent.date)}
                          {selectedEvent.location && ` • ${selectedEvent.location}`}
                        </div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {selectedEvent.type}
                        </Badge>
                      </div>
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
                  Associate with Place (Optional)
                </h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-700">
                      If this memory is associated with a specific location, you can select it here. This helps organize
                      your memories by where they happened.
                    </p>
                  </div>

                  <PlaceSelector
                    allPlaces={allPlaces}
                    selectedPlace={formData.placeId}
                    onSelectionChange={(placeId) => handleInputChange("placeId", placeId)}
                    isLoading={placesLoading}
                  />

                  {selectedPlace && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Associated Place:</h4>
                      <div className="p-3 bg-green-50 rounded border">
                        <div className="font-medium">{selectedPlace.name}</div>
                        <div className="text-sm text-gray-600">
                          {selectedPlace.city}, {selectedPlace.country}
                        </div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {selectedPlace.type}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
