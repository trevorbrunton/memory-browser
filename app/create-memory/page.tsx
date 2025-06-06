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
import { PeopleSelector } from "../../components/people-selector"
import { PlaceSelector } from "../../components/place-selector"
import { EventSelector } from "../../components/event-selector"

export default function CreateMemoryPage() {
  const router = useRouter()
  const { toast } = useToast()

  const { data: allPeople = [], isLoading: peopleLoading } = usePeople()
  const { data: allPlaces = [], isLoading: placesLoading } = usePlaces()
  const { data: allEvents = [], isLoading: eventsLoading } = useEvents()
  const addMemoryMutation = useAddMemoryWithFile()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().slice(0, 16),
    peopleIds: [] as string[],
    placeId: "",
    eventId: "",
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("upload")

  const handleInputChange = (field: string, value: string | string[]) => {
    if (field === "eventId") {
      const selectedEvent = allEvents.find((event) => event.id === value)
      if (selectedEvent?.placeId) {
        const associatedPlace = allPlaces.find((place) => place.id === selectedEvent.placeId)
        if (associatedPlace) {
          setFormData((prev) => ({
            ...prev,
            eventId: value as string,
            placeId: associatedPlace.id,
          }))
          toast({
            title: "Place Added",
            description: `${associatedPlace.name} was automatically added as this event's location.`,
            duration: 3000,
          })
          return
        }
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileSelected = (file: File) => {
    setSelectedFile(file)
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
    if (!formData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, "")
      const formattedName = fileName.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      setFormData((prev) => ({ ...prev, title: formattedName }))
    }
    setActiveTab("details")
  }

  const handleSave = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please upload a file first.",
        variant: "destructive",
      })
      return
    }
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the memory.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Creating Memory...",
      description: "Uploading file and saving details. Please wait.",
    })

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

      toast({ title: "Success", description: "Memory created successfully!" })

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      router.push("/")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast({
        title: "Error Creating Memory",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const isLoading = peopleLoading || placesLoading || eventsLoading
  const canSave = selectedFile && formData.title.trim() && !addMemoryMutation.isPending

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
    <div className="min-h-screen bg-slate-50">
      <div className="p-4 max-w-7xl mx-auto space-y-4">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button onClick={() => router.push("/")} variant="outline" size="sm" className="border-slate-200">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-slate-800">Create New Memory</h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="min-w-[120px] bg-slate-800 hover:bg-slate-700 text-white"
          >
            {addMemoryMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Memory
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Preview Panel */}
          <Card className="p-4 shadow-sm border-slate-200">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-medium text-slate-800">Memory Preview</h3>
              </div>

              <div className="space-y-3">
                <div className="text-center">
                  <div className="w-full aspect-square mx-auto rounded-md overflow-hidden bg-slate-100 mb-2 border border-slate-200 shadow-sm">
                    {previewUrl ? (
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <FileText className="h-10 w-10 text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500">{selectedFile?.name || "No file selected"}</span>
                      </div>
                    )}
                  </div>

                  <h4 className="text-sm font-medium text-slate-800">{formData.title || "New Memory"}</h4>

                  {selectedFile && (
                    <Badge variant="secondary" className="mt-1 text-xs bg-slate-100 text-slate-600 font-normal">
                      {selectedFile.type.startsWith("image/") ? "Photo" : "Document"}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center text-slate-600 bg-slate-50 rounded p-2">
                    <Calendar className="h-3 w-3 mr-2 text-slate-500" />
                    <span>{formatDate(formData.date)}</span>
                  </div>

                  {selectedPlace && (
                    <div className="flex items-center text-slate-600 bg-slate-50 rounded p-2">
                      <MapPin className="h-3 w-3 mr-2 text-slate-500" />
                      <span>{selectedPlace.name}</span>
                    </div>
                  )}

                  {selectedPeople.length > 0 && (
                    <div className="flex items-center text-slate-600 bg-slate-50 rounded p-2">
                      <User className="h-3 w-3 mr-2 text-slate-500" />
                      <span>
                        {selectedPeople.length} person{selectedPeople.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}

                  {selectedEvent && (
                    <div className="flex items-center text-slate-600 bg-slate-50 rounded p-2">
                      <Calendar className="h-3 w-3 mr-2 text-slate-500" />
                      <span>{selectedEvent.title}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Details Form */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-0.5 h-9">
                <TabsTrigger
                  value="upload"
                  className="text-xs data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm"
                >
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Upload File
                  {selectedFile && <Check className="h-3 w-3 ml-1 text-slate-500" />}
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="text-xs data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm"
                  disabled={!selectedFile}
                >
                  <User className="h-3 w-3 mr-1" />
                  Add Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="pt-3">
                <Card className="p-4 shadow-sm border-slate-200">
                  <h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2 text-slate-500" />
                    Upload Media
                  </h3>
                  <FileUpload onFileSelected={handleFileSelected} />
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 pt-3">
                <Card className="p-4 shadow-sm border-slate-200">
                  <h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-slate-500" />
                    Core Details
                  </h3>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="text-xs text-slate-600">
                        Title *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="Enter a descriptive title"
                        className="h-8 text-sm border-slate-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="description" className="text-xs text-slate-600">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Add notes, context, or a story about this memory"
                        rows={3}
                        className="text-sm border-slate-200 resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="date" className="text-xs text-slate-600">
                        Date & Time *
                      </Label>
                      <Input
                        id="date"
                        type="datetime-local"
                        value={formData.date}
                        onChange={(e) => handleInputChange("date", e.target.value)}
                        className="h-8 text-sm border-slate-200"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 shadow-sm border-slate-200">
                  <h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2 text-slate-500" />
                    Associations
                  </h3>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-600">People</Label>
                      <PeopleSelector
                        allPeople={allPeople}
                        selectedPeople={formData.peopleIds}
                        onSelectionChange={(value) => handleInputChange("peopleIds", value)}
                        isLoading={isLoading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-600">Event</Label>
                      <EventSelector
                        allEvents={allEvents}
                        selectedEvent={formData.eventId}
                        onSelectionChange={(value) => handleInputChange("eventId", value)}
                        isLoading={isLoading}
                        allPlaces={allPlaces}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-600">Place</Label>
                      <PlaceSelector
                        allPlaces={allPlaces}
                        selectedPlace={formData.placeId}
                        onSelectionChange={(value) => handleInputChange("placeId", value)}
                        isLoading={isLoading}
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
