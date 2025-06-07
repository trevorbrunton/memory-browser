"use client";

import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, MapPin, User, Calendar, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface TabNavigationProps {
  activeTab: string;
  memoriesCount: number;
  placesCount: number;
  peopleCount: number;
  eventsCount: number;
}

export function TabNavigation({
  activeTab,
  memoriesCount,
  placesCount,
  peopleCount,
  eventsCount,
}: TabNavigationProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <TabsList className="grid w-full max-w-md grid-cols-4">
        <TabsTrigger value="memories" className="flex items-center gap-2">
          <div className="hidden sm:flex items-center">
            <ImageIcon className="h-4 w-4 mr-1" />
            <span className="flex items-center">
              Memories ({memoriesCount})
            </span>
          </div>
          <div className="flex sm:hidden items-center">
            <ImageIcon className="h-4 w-4" />({memoriesCount})
          </div>
        </TabsTrigger>

        <TabsTrigger value="people" className="flex items-center gap-2">
          <div className="hidden sm:flex items-center">
            <User className="h-4 w-4 mr-1" />
            People ({peopleCount})
          </div>
          <div className="flex sm:hidden items-center">
            <User className="h-4 w-4" />({peopleCount})
          </div>
        </TabsTrigger>

        <TabsTrigger value="events" className="flex items-center gap-2">
          <div className="hidden sm:flex">
            <Calendar className="h-4 w-4 mr-1" />
            Events ({eventsCount})
          </div>
          <div className="flex sm:hidden items-center">
            <Calendar className="h-4 w-4" />({eventsCount})
          </div>
        </TabsTrigger>

        <TabsTrigger value="places" className="flex items-center gap-2">
          <div className="hidden sm:flex">
            <MapPin className="h-4 w-4 mr-1" />
            Places ({placesCount})
          </div>
          <div className="flex sm:hidden items-center">
            <MapPin className="h-4 w-4" />({placesCount})
          </div>
        </TabsTrigger>
      </TabsList>
      <div className="flex gap-2">
        {activeTab === "memories" && (
          <Button
            onClick={() => router.push("/create-memory")}
            variant="default"
            size="sm"
          >
            <div className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-2" />
              Upload Memory
            </div>
            <div className="flex sm:hidden">
              <Plus className="h-4 w-4" />
            </div>
          </Button>
        )}
        {activeTab === "people" && (
          <Button
            onClick={() => router.push("/create-person")}
            variant="default"
            size="sm"
          >
            <div className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-2" />
              Create Person
            </div>
            <div className="flex sm:hidden">
              <Plus className="h-4 w-4" />
            </div>
          </Button>
        )}
        {activeTab === "events" && (
          <Button
            onClick={() => router.push("/create-event")}
            variant="default"
            size="sm"
          >
            <div className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </div>
            <div className="flex sm:hidden">
              <Plus className="h-4 w-4" />
            </div>
          </Button>
        )}
        {activeTab === "places" && (
          <Button
            onClick={() => router.push("/create-place")}
            variant="default"
            size="sm"
          >
            <div className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-2" />
              Create Place
            </div>
            <div className="flex sm:hidden">
              <Plus className="h-4 w-4" />
            </div>
          </Button>
        )}
      </div>
    </div>
  );
}
