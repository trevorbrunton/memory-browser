"use client"

import { Button } from "@/components/ui/button"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageIcon, MapPin, User, Calendar, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface TabNavigationProps {
  activeTab: string
  memoriesCount: number
  placesCount: number
  peopleCount: number
  eventsCount: number
}

export function TabNavigation({ activeTab, memoriesCount, placesCount, peopleCount, eventsCount }: TabNavigationProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between">
      <TabsList className="grid w-full max-w-md grid-cols-4">
        <TabsTrigger value="memories" className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Memories ({memoriesCount})
        </TabsTrigger>
        <TabsTrigger value="places" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Places ({placesCount})
        </TabsTrigger>
        <TabsTrigger value="people" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          People ({peopleCount})
        </TabsTrigger>
        <TabsTrigger value="events" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Events ({eventsCount})
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
  )
}
