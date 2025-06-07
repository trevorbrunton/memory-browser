"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  User,
  MapPin,
  Calendar,
  Clock,
  Loader2,
  Save,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useUpdateMemoryDetails } from "@/hooks/use-memories"; // Keep this for the main details
import { usePeople } from "@/hooks/use-people";
import { usePlaces } from "@/hooks/use-places";
import { useEvents } from "@/hooks/use-events";
import type { Memory } from "@/types/memories";
import type { Reflection } from "@/types/reflection"; // Make sure this type exists
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// Import the new tab components
import { PeopleTab } from "@/components/memory-details-tabs/PeopleTab";
import { EventTab } from "@/components/memory-details-tabs/EventTab";
import { PlaceTab } from "@/components/memory-details-tabs/PlaceTab";
import { ReflectionsTab } from "@/components/memory-details-tabs/ReflectionsTab";

interface MemoryDetailsFormProps {
  memory: Memory & { reflections?: Reflection[] }; // Ensure reflections can be passed
}

export function MemoryDetailsForm({ memory }: MemoryDetailsFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Main memory details state (title, description, date)
  const [formData, setFormData] = useState({
    title: memory.title || "",
    description: memory.description || "",
    date: memory.date ? new Date(memory.date).toISOString().slice(0, 16) : "",
  });
  const [hasMainChanges, setHasMainChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const updateMemoryDetailsMutation = useUpdateMemoryDetails();

  const { data: allPeople = [], isLoading: peopleLoading } = usePeople();
  const { data: allPlaces = [], isLoading: placesLoading } = usePlaces();
  const { data: allEvents = [], isLoading: eventsLoading } = useEvents();
  // Reflections are now passed in via `memory.reflections` or handled within ReflectionsTab if fetched there

  // Update main form data when memory prop changes
  useEffect(() => {
    setFormData({
      title: memory.title || "",
      description: memory.description || "",
      date: memory.date ? new Date(memory.date).toISOString().slice(0, 16) : "",
    });
    setHasMainChanges(false);
  }, [memory.title, memory.description, memory.date]);

  // Check for main form changes
  useEffect(() => {
    const titleChanged = formData.title !== (memory.title || "");
    const descriptionChanged =
      formData.description !== (memory.description || "");
    const dateChanged =
      formData.date !==
      (memory.date ? new Date(memory.date).toISOString().slice(0, 16) : "");
    setHasMainChanges(titleChanged || descriptionChanged || dateChanged);
  }, [formData, memory.title, memory.description, memory.date]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveMainDetails = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Memory title is required",
        variant: "destructive",
      });
      return;
    }
    try {
      await updateMemoryDetailsMutation.mutateAsync({
        id: memory.id,
        updates: {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          date: new Date(formData.date),
          // Note: peopleIds, placeId, eventId are handled by their respective tabs
        },
      });
      toast({ title: "Success", description: "Memory details updated." });
      setHasMainChanges(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update memory details.",
        variant: "destructive",
      });
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const currentSelectedPeople = allPeople.filter((person) =>
    memory.peopleIds?.includes(person.id)
  );
  const currentSelectedPlace = allPlaces.find(
    (place) => place.id === memory.placeId
  );
  const currentSelectedEvent = allEvents.find(
    (event) => event.id === memory.eventId
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Memory Overview Panel (Stays the same, reads from `memory` prop) */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <Brain className="h-4 w-4 mr-2" />
            Memory Overview
          </h3>
          <div className="space-y-3">
            <div className="text-center">
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
                      {memory.mediaName?.split(".").pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <h4 className="font-medium text-lg">
                {formData.title || memory.title}
              </h4>
              <Badge variant="secondary" className="mt-2">
                {memory.mediaType === "photo" ? "Photo" : "Document"} Memory
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>{formatDateForDisplay(formData.date)}</span>
              </div>
              {currentSelectedPlace && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{currentSelectedPlace.name}</span>
                </div>
              )}
              {currentSelectedPeople.length > 0 && (
                <div className="flex items-center text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span>{currentSelectedPeople.length} people</span>
                </div>
              )}
              {currentSelectedEvent && (
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{currentSelectedEvent.title}</span>
                </div>
              )}
            </div>

            {formData.description && (
              <div className="mt-4">
                <h5 className="font-medium text-sm mb-2">Description</h5>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {formData.description}
                </p>
              </div>
            )}
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h5 className="font-medium text-sm mb-2">Memory Info</h5>
              <div className="text-xs text-gray-600 space-y-1">
                <div>
                  Created: {new Date(memory.createdAt).toLocaleDateString()}
                </div>
                <div>
                  Last Updated:{" "}
                  {new Date(memory.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Container */}
      <div className="lg:col-span-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger
              value="details"
              className="flex items-center gap-1 sm:gap-2"
            >
              <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate">Details</span>
            </TabsTrigger>
            <TabsTrigger
              value="people"
              className="flex items-center gap-1 sm:gap-2"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate">
                People ({memory.peopleIds?.length || 0})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="event"
              className="flex items-center gap-1 sm:gap-2"
            >
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate">Event {memory.eventId && "✓"}</span>
            </TabsTrigger>
            <TabsTrigger
              value="place"
              className="flex items-center gap-1 sm:gap-2"
            >
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate"> Place {memory.placeId && "✓"}</span>
            </TabsTrigger>
            <TabsTrigger
              value="reflections"
              className="flex items-center gap-1 sm:gap-2"
            >
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate">
                {" "}
                Reflections ({memory.reflections?.length || 0})
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Memory Details Tab (Main Info) */}
          <TabsContent value="details" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center">
                  <Brain className="h-4 w-4 mr-2" />
                  Edit Memory Details
                </h3>
                {hasMainChanges && (
                  <Button
                    onClick={handleSaveMainDetails}
                    disabled={updateMemoryDetailsMutation.isPending}
                    size="sm"
                  >
                    {updateMemoryDetailsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Details
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-700">
                    Update the core details of this memory, like its title,
                    description, and date. Associations with people, places, and
                    events are managed in their respective tabs.
                  </p>
                </div>
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
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
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
                {hasMainChanges && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">
                    You have unsaved changes to the memory's main details.
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="people">
            <PeopleTab
              memory={memory}
              allPeople={allPeople}
              peopleLoading={peopleLoading}
            />
          </TabsContent>

          <TabsContent value="event">
            <EventTab
              memory={memory}
              allEvents={allEvents}
              eventsLoading={eventsLoading}
              allPlaces={allPlaces}
            />
          </TabsContent>

          <TabsContent value="place">
            <PlaceTab
              memory={memory}
              allPlaces={allPlaces}
              placesLoading={placesLoading}
              isEventAssociated={!!memory.eventId}
            />
          </TabsContent>

          <TabsContent value="reflections">
            <ReflectionsTab memory={memory} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
