"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  RefreshCw,
  Loader2,
  Eye,
  User,
  MapPin,
  Calendar,
  ImageIcon,
  FileText,
  Plus,
  Search,
  Star,
  Building,
} from "lucide-react"
import { usePeople } from "../hooks/use-people"
import { usePlaces } from "../hooks/use-places"
import { useEvents } from "../hooks/use-events"
import { useMemories } from "../hooks/use-memories"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("memories")

  const { data: allPeople = [], isLoading: peopleLoading, refetch: refetchPeople } = usePeople()
  const { data: allPlaces = [], isLoading: placesLoading, refetch: refetchPlaces } = usePlaces()
  const { data: allEvents = [], isLoading: eventsLoading, refetch: refetchEvents } = useEvents()
  const {
    data: allMemories = [],
    isLoading: memoriesLoading,
    isError: memoriesError,
    error: memoriesErrorMsg,
    refetch: refetchMemories,
    isFetching: memoriesFetching,
  } = useMemories()

  const isAnyLoading = peopleLoading || placesLoading || eventsLoading || memoriesLoading
  const isAnyFetching = memoriesFetching

  const refetchAll = () => {
    refetchPeople()
    refetchPlaces()
    refetchEvents()
    refetchMemories()
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  // Filter data based on search term and active tab
  const filteredMemories = allMemories.filter(
    (memory) =>
      memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.mediaName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredPlaces = allPlaces.filter(
    (place) =>
      place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.address?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredPeople = allPeople.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.role?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredEvents = allEvents.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPlaceTypeColor = (type: string) => {
    const colors = {
      office: "bg-blue-100 text-blue-800",
      restaurant: "bg-red-100 text-red-800",
      hotel: "bg-purple-100 text-purple-800",
      venue: "bg-green-100 text-green-800",
      park: "bg-emerald-100 text-emerald-800",
      museum: "bg-amber-100 text-amber-800",
      store: "bg-orange-100 text-orange-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const renderStars = (rating?: number) => {
    if (!rating) return null
    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="text-xs text-gray-600">{rating.toFixed(1)}</span>
      </div>
    )
  }

  if (memoriesError) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{memoriesErrorMsg?.message || "Something went wrong"}</p>
          <Button onClick={refetchAll} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cronicle Memory Browser</h1>
        <div className="flex items-center gap-2">
          <Button onClick={refetchAll} variant="outline" size="sm" disabled={isAnyFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnyFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {isAnyFetching && (
            <span className="text-sm text-gray-500 flex items-center">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Syncing...
            </span>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="memories" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Memories ({allMemories.length})
            </TabsTrigger>
            <TabsTrigger value="places" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Places ({allPlaces.length})
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              People ({allPeople.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events ({allEvents.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            {activeTab === "memories" && (
              <Button onClick={() => router.push("/create-memory")} variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Upload Memory
              </Button>
            )}
            {activeTab === "places" && (
              <Button onClick={() => router.push("/create-place")} variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Place
              </Button>
            )}
          </div>
        </div>

        {/* Memories Tab */}
        <TabsContent value="memories" className="space-y-4">
          {isAnyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span className="text-lg">Loading memories...</span>
            </div>
          ) : filteredMemories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMemories.map((memory) => {
                const memoryPeople = allPeople.filter((person) => memory.peopleIds.includes(person.id))
                const memoryPlace = allPlaces.find((place) => place.id === memory.placeId)
                const memoryEvent = allEvents.find((event) => event.id === memory.eventId)

                return (
                  <Card key={memory.id} className="overflow-hidden">
                    {/* Media Preview */}
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      {memory.mediaType === "photo" ? (
                        <img
                          src={memory.mediaUrl || "/placeholder.svg"}
                          alt={memory.title}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <FileText className="h-12 w-12 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">{memory.mediaName}</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-white/80">
                          {memory.mediaType === "photo" ? "Photo" : "Document"}
                        </Badge>
                      </div>
                    </div>

                    {/* Memory Info */}
                    <div className="p-4 border-b">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg truncate">{memory.title}</h3>
                        <Badge variant="outline">{formatDate(memory.date)}</Badge>
                      </div>
                      {memory.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{memory.description}</p>
                      )}

                    </div>

                    <div className="p-4 space-y-3">
                      {/* People */}
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Associated People</p>
                          {memoryPeople.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {memoryPeople.slice(0, 3).map((person) => (
                                <Badge
                                  key={person.id}
                                  variant="secondary"
                                  className="text-xs cursor-pointer hover:bg-blue-100 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/person-details/${person.id}`)
                                  }}
                                >
                                  {person.name}
                                </Badge>
                              ))}
                              {memoryPeople.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{memoryPeople.length - 3} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No people associated</span>
                          )}
                        </div>
                      </div>

                      {/* Event */}
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Associated Event</p>
                          {memoryEvent ? (
                            <Badge
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-purple-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/event-details/${memoryEvent.id}`)
                              }}
                            >
                              {memoryEvent.title}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">No event associated</span>
                          )}
                        </div>
                      </div>

                      {/* Place */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Associated Place</p>
                          {memoryPlace ? (
                            <Badge
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-green-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/place-details/${memoryPlace.id}`)
                              }}
                            >
                              {memoryPlace.name}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">No place associated</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 border-t flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => router.push(`/memory-details/${memory.id}`)}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View Memory
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-600 mb-1">No memories found</p>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm ? "Try a different search term" : "Start by uploading your first memory"}
              </p>
              <Button onClick={() => router.push("/create-memory")} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Upload Memory
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Places Tab */}
        <TabsContent value="places" className="space-y-4">
          {isAnyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span className="text-lg">Loading places...</span>
            </div>
          ) : filteredPlaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlaces.map((place) => {
                // Find memories associated with this place
                const placeMemories = allMemories.filter((memory) => memory.placeId === place.id)
                const placeEvents = allEvents.filter((event) => event.placeId === place.id)

                return (
                  <Card key={place.id} className="overflow-hidden">
                    {/* Place Header */}
                    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-green-600 flex items-center justify-center text-white text-lg font-bold">
                            {place.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{place.name}</h3>
                            <p className="text-sm text-gray-600">
                              {place.city}, {place.country}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getPlaceTypeColor(place.type)}`}>{place.type}</Badge>
                      </div>
                    </div>

                    {/* Place Details */}
                    <div className="p-4 space-y-3">
                      {place.address && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{place.address}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {place.capacity && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">{place.capacity} capacity</span>
                          </div>
                        )}
                        {place.rating && renderStars(place.rating)}
                      </div>

                      {/* Associated Content */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-purple-600" />
                          <span className="text-sm">
                            {placeMemories.length} {placeMemories.length === 1 ? "memory" : "memories"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-orange-600" />
                          <span className="text-sm">
                            {placeEvents.length} {placeEvents.length === 1 ? "event" : "events"}
                          </span>
                        </div>
                      </div>

                      {/* Attributes Preview */}
                      {place.attributes && place.attributes.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Attributes</p>
                          <div className="flex flex-wrap gap-1">
                            {place.attributes.slice(0, 3).map((attr, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {attr.attribute}: {attr.value}
                              </Badge>
                            ))}
                            {place.attributes.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{place.attributes.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-gray-50 border-t flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => router.push(`/place-details/${place.id}`)}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View Place
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-600 mb-1">No places found</p>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm ? "Try a different search term" : "Start by creating your first place"}
              </p>
              <Button onClick={() => router.push("/create-place")} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Place
              </Button>
            </div>
          )}
        </TabsContent>

        {/* People Tab */}
        <TabsContent value="people" className="space-y-4">
          {isAnyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span className="text-lg">Loading people...</span>
            </div>
          ) : filteredPeople.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeople.map((person) => {
                const personMemories = allMemories.filter((memory) => memory.peopleIds.includes(person.id))

                return (
                  <Card key={person.id} className="overflow-hidden">
                    <div className="p-4 border-b">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          {person.photoUrl ? (
                            <img
                              src={person.photoUrl || "/placeholder.svg"}
                              alt={person.name}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                              {person.name
                                .split(" ")
                                .map((part) => part.charAt(0))
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{person.name}</h3>
                          {person.role && <p className="text-sm text-gray-600">{person.role}</p>}
                          {person.email && <p className="text-xs text-gray-500">{person.email}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">
                          {personMemories.length} {personMemories.length === 1 ? "memory" : "memories"}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 border-t flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => router.push(`/person-details/${person.id}`)}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View Person
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-600 mb-1">No people found</p>
              <p className="text-sm text-gray-500">
                {searchTerm ? "Try a different search term" : "People will appear here as you add them to memories"}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {isAnyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span className="text-lg">Loading events...</span>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((event) => {
                const eventMemories = allMemories.filter((memory) => memory.eventId === event.id)
                const eventPlace = allPlaces.find((place) => place.id === event.placeId)

                return (
                  <Card key={event.id} className="overflow-hidden">
                    <div className="p-4 border-b">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge variant="outline">{formatDate(event.date)}</Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                      )}
                      {eventPlace && (
                        <div className="flex items-center gap-1 mt-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{eventPlace.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">
                          {eventMemories.length} {eventMemories.length === 1 ? "memory" : "memories"}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 border-t flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => router.push(`/event-details/${event.id}`)}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View Event
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-600 mb-1">No events found</p>
              <p className="text-sm text-gray-500">
                {searchTerm ? "Try a different search term" : "Events will appear here as you add them to memories"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
