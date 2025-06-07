//File: app/page.tsx
"use client"

import { useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { ImageIcon, MapPin, User, Calendar } from "lucide-react"
import { usePeople } from "../hooks/use-people"
import { usePlaces } from "../hooks/use-places"
import { useEvents } from "../hooks/use-events"
import { useMemories } from "../hooks/use-memories"
import { useRouter } from "next/navigation"
import { MemoryCard } from "@/components/mem-browser-components/memory-card"
import { PlaceCard } from "@/components/mem-browser-components/place-card";
import { PersonCard } from "@/components/mem-browser-components/person-card"
import { EventCard } from "@/components/mem-browser-components/event-card"
import { SearchBar } from "@/components/mem-browser-components/search-bar"
import { PageHeader } from "@/components/mem-browser-components/page-header"
import { TabNavigation } from "@/components/mem-browser-components/tab-navigation"
import { LoadingState } from "@/components/mem-browser-components/loading-state"
import { EmptyState } from "@/components/mem-browser-components/empty-state"
import { ErrorState } from "@/components/mem-browser-components/error-state"

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

  // Filter data based on search term
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
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (memoriesError) {
    return <ErrorState message={memoriesErrorMsg?.message || "Something went wrong"} onRetry={refetchAll} />
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader onRefresh={refetchAll} isRefreshing={isAnyFetching} />

      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeTab={activeTab}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabNavigation
          activeTab={activeTab}
          memoriesCount={allMemories.length}
          peopleCount={allPeople.length}
          eventsCount={allEvents.length}
          placesCount={allPlaces.length}
        />

        {/* Memories Tab */}
        <TabsContent value="memories" className="space-y-4">
          {isAnyLoading ? (
            <LoadingState message="Loading memories..." />
          ) : filteredMemories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMemories.map((memory) => {
                const memoryPeople = allPeople.filter((person) =>
                  memory.peopleIds.includes(person.id)
                );
                const memoryPlace = allPlaces.find(
                  (place) => place.id === memory.placeId
                );
                const memoryEvent = allEvents.find(
                  (event) => event.id === memory.eventId
                );

                return (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    people={memoryPeople}
                    place={memoryPlace}
                    event={memoryEvent}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={ImageIcon}
              title="No memories found"
              description={
                searchTerm
                  ? "Try a different search term"
                  : "Start by uploading your first memory"
              }
              actionLabel={!searchTerm ? "Upload Memory" : undefined}
              onAction={
                !searchTerm ? () => router.push("/create-memory") : undefined
              }
            />
          )}
        </TabsContent>
        {/* People Tab */}
        <TabsContent value="people" className="space-y-4">
          {isAnyLoading ? (
            <LoadingState message="Loading people..." />
          ) : filteredPeople.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeople.map((person) => {
                const personMemories = allMemories.filter((memory) =>
                  memory.peopleIds.includes(person.id)
                );

                return (
                  <PersonCard
                    key={person.id}
                    person={person}
                    memoriesCount={personMemories.length}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={User}
              title="No people found"
              description={
                searchTerm
                  ? "Try a different search term"
                  : "People will appear here as you add them to memories"
              }
            />
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {isAnyLoading ? (
            <LoadingState message="Loading events..." />
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((event) => {
                const eventMemories = allMemories.filter(
                  (memory) => memory.eventId === event.id
                );
                const eventPlace = allPlaces.find(
                  (place) => place.id === event.placeId
                );

                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    place={eventPlace}
                    memoriesCount={eventMemories.length}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No events found"
              description={
                searchTerm
                  ? "Try a different search term"
                  : "Events will appear here as you add them to memories"
              }
            />
          )}
        </TabsContent>

        {/* Places Tab */}
        <TabsContent value="places" className="space-y-4">
          {isAnyLoading ? (
            <LoadingState message="Loading places..." />
          ) : filteredPlaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlaces.map((place) => {
                const placeMemories = allMemories.filter(
                  (memory) => memory.placeId === place.id
                );
                const placeEvents = allEvents.filter(
                  (event) => event.placeId === place.id
                );

                return (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    memoriesCount={placeMemories.length}
                    eventsCount={placeEvents.length}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={MapPin}
              title="No places found"
              description={
                searchTerm
                  ? "Try a different search term"
                  : "Start by creating your first place"
              }
              actionLabel={!searchTerm ? "Create Place" : undefined}
              onAction={
                !searchTerm ? () => router.push("/create-place") : undefined
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
