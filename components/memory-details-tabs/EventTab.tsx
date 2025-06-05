"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, X, Loader2, Save, Eye, MapPin } from "lucide-react";
import { useEvents } from "@/hooks/use-events"; // Adjusted path
import { usePlaces } from "@/hooks/use-places"; // Adjusted path
import { useUpdateMemoryEventAssociation } from "@/hooks/use-memories"; // New hook
import type { Memory } from "@/types/memories";
import type { Event as EventType } from "@/types/events"; // Renamed to avoid conflict
import type { Place } from "@/types/places";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { EventSelector } from "@/components/event-selector"; // Adjusted path

interface EventTabProps {
  memory: Memory;
  allEvents: EventType[];
  eventsLoading: boolean;
  allPlaces: Place[]; // Pass allPlaces for displaying place names
}

export function EventTab({
  memory,
  allEvents,
  eventsLoading,
  allPlaces,
}: EventTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(
    memory.eventId
  );
  const [hasChanges, setHasChanges] = useState(false);

  const updateMemoryEventMutation = useUpdateMemoryEventAssociation();

  useEffect(() => {
    setSelectedEventId(memory.eventId);
    setHasChanges(false);
  }, [memory.eventId]);

  useEffect(() => {
    setHasChanges(selectedEventId !== memory.eventId);
  }, [selectedEventId, memory.eventId]);

  const handleEventSelectionChange = (newEventId: string | undefined) => {
    setSelectedEventId(newEventId);
    // If an event is selected, its place should also be associated with the memory
    // This logic will be handled by the mutation to ensure atomicity if needed,
    // or the parent MemoryDetailsForm can coordinate this based on the event's placeId.
    // For now, we just update the eventId here.
  };

  const handleSaveChanges = async () => {
    try {
      await updateMemoryEventMutation.mutateAsync({
        memoryId: memory.id,
        eventId: selectedEventId || null, // Send null if undefined to clear association
      });
      toast({
        title: "Success",
        description: "Event association updated.",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event association.",
        variant: "destructive",
      });
    }
  };

  const selectedEventDetails = allEvents.find(
    (event) => event.id === selectedEventId
  );
  const associatedPlace = selectedEventDetails?.placeId
    ? allPlaces.find((p) => p.id === selectedEventDetails.placeId)
    : undefined;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Associated Event
        </h3>
        {hasChanges && (
          <Button
            onClick={handleSaveChanges}
            disabled={updateMemoryEventMutation.isPending}
            size="sm"
          >
            {updateMemoryEventMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Event
              </>
            )}
          </Button>
        )}
      </div>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-700">
            Link this memory to a specific event. If the event has a venue, the
            memory's location will also update. Changes to this tab are saved
            independently.
          </p>
        </div>

        <EventSelector
          allEvents={allEvents}
          selectedEvent={selectedEventId}
          onSelectionChange={(eventId) =>
            handleEventSelectionChange(eventId || undefined)
          }
          isLoading={eventsLoading}
          allPlaces={allPlaces}
        />

        {selectedEventDetails && (
          <div className="mt-2 p-3 bg-purple-50 rounded border space-y-1">
            <div className="font-medium text-sm">
              {selectedEventDetails.title}
            </div>
            <div className="text-xs text-gray-600">
              {new Date(selectedEventDetails.date).toLocaleDateString()}
            </div>
            {associatedPlace && (
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="h-3 w-3 mr-1" /> {associatedPlace.name}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Button
                onClick={() =>
                  router.push(`/event-details/${selectedEventDetails.id}`)
                }
                size="sm" // Smaller button
                variant="outline"
                className="h-7 px-2 py-1 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                onClick={() => handleEventSelectionChange(undefined)}
                size="sm" // Smaller button
                variant="outline"
                className="h-7 px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        )}
        {hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">
            You have unsaved changes in this tab.
          </div>
        )}
      </div>
    </Card>
  );
}
