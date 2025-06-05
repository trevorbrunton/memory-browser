"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, X, Loader2, Save, Eye } from "lucide-react";
import { usePlaces } from "@/hooks/use-places"; // Adjusted path
import { useUpdateMemoryPlace } from "@/hooks/use-memories"; // New hook
import type { Memory } from "@/types/memories";
import type { Place as PlaceType } from "@/types/places"; // Renamed
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { PlaceSelector } from "@/components/place-selector"; // Adjusted path

interface PlaceTabProps {
  memory: Memory;
  allPlaces: PlaceType[];
  placesLoading: boolean;
  isEventAssociated: boolean; // To know if place is locked by an event
}

export function PlaceTab({
  memory,
  allPlaces,
  placesLoading,
  isEventAssociated,
}: PlaceTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>(
    memory.placeId
  );
  const [hasChanges, setHasChanges] = useState(false);

  const updateMemoryPlaceMutation = useUpdateMemoryPlace();

  useEffect(() => {
    setSelectedPlaceId(memory.placeId);
    setHasChanges(false);
  }, [memory.placeId]);

  // If an event becomes associated or disassociated, the memory's placeId might be
  // externally updated by the EventTab or a parent component.
  // This effect ensures this tab reflects that external change.
  useEffect(() => {
    if (
      isEventAssociated &&
      memory.eventId &&
      memory.placeId !== selectedPlaceId
    ) {
      // If an event dictates the place, this tab's selection should match.
      // This assumes the memory.placeId is correctly updated when an event is linked.
      setSelectedPlaceId(memory.placeId);
      setHasChanges(false); // Reset changes as this is an external update
    }
  }, [memory.eventId, memory.placeId, isEventAssociated, selectedPlaceId]);

  useEffect(() => {
    // Only allow changes if not locked by an event OR if the change aligns with event's place
    if (!isEventAssociated) {
      setHasChanges(selectedPlaceId !== memory.placeId);
    } else {
      // If event is associated, changes are only relevant if they deviate from event's place
      // However, direct changes here should be disabled. This effect mainly serves to reset 'hasChanges'
      // if an external update (like event selection) aligns the place.
      const currentEvent = memory.eventId
        ? allPlaces.find((p) => p.id === memory.placeId)
        : undefined;
      if (currentEvent && selectedPlaceId === currentEvent.id) {
        setHasChanges(false);
      }
    }
  }, [
    selectedPlaceId,
    memory.placeId,
    memory.eventId,
    isEventAssociated,
    allPlaces,
  ]);

  const handlePlaceSelectionChange = (newPlaceId: string | undefined) => {
    if (isEventAssociated) {
      toast({
        title: "Place Locked",
        description:
          "Place is determined by the associated event. To change the place, modify the event or remove the event association.",
        variant: "default",
        duration: 5000,
      });
      return;
    }
    setSelectedPlaceId(newPlaceId);
  };

  const handleSaveChanges = async () => {
    if (isEventAssociated) {
      toast({
        title: "Cannot Save Place",
        description: "Place is locked by the associated event.",
        variant: "destructive",
      });
      return;
    }
    try {
      await updateMemoryPlaceMutation.mutateAsync({
        memoryId: memory.id,
        placeId: selectedPlaceId || null, // Send null to clear association
      });
      toast({
        title: "Success",
        description: "Place association updated.",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update place association.",
        variant: "destructive",
      });
    }
  };

  const selectedPlaceDetails = allPlaces.find(
    (place) => place.id === selectedPlaceId
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          Associated Place
        </h3>
        {hasChanges && !isEventAssociated && (
          <Button
            onClick={handleSaveChanges}
            disabled={updateMemoryPlaceMutation.isPending}
            size="sm"
          >
            {updateMemoryPlaceMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Place
              </>
            )}
          </Button>
        )}
      </div>
      <div className="space-y-4">
        {isEventAssociated && selectedPlaceDetails && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-700">
            This memory's place (<strong>{selectedPlaceDetails.name}</strong>)
            is automatically set by the associated event. To change it, update
            or remove the event on the 'Event' tab.
          </div>
        )}
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-700">
            {isEventAssociated
              ? "The place is currently determined by the associated event."
              : "Associate this memory with a specific location. Changes here are saved independently."}
          </p>
        </div>

        <PlaceSelector
          allPlaces={allPlaces}
          selectedPlace={selectedPlaceId}
          onSelectionChange={handlePlaceSelectionChange}
          isLoading={placesLoading}
          // Disable if an event is associated, as event dictates the place
          // disabled={isEventAssociated}
        />

        {selectedPlaceDetails && (
          <div className="mt-2 p-3 bg-green-50 rounded border space-y-1">
            <div className="font-medium text-sm">
              {selectedPlaceDetails.name}
            </div>
            <div className="text-xs text-gray-600">
              {selectedPlaceDetails.city}, {selectedPlaceDetails.country}
            </div>
            <Badge variant="outline" className="mt-1 text-xs">
              {selectedPlaceDetails.type}
            </Badge>
            <div className="flex items-center gap-2 mt-2">
              <Button
                onClick={() =>
                  router.push(`/place-details/${selectedPlaceDetails.id}`)
                }
                size="sm"
                variant="outline"
                className="h-7 px-2 py-1 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              {!isEventAssociated && (
                <Button
                  onClick={() => handlePlaceSelectionChange(undefined)}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}
        {hasChanges && !isEventAssociated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">
            You have unsaved changes in this tab.
          </div>
        )}
      </div>
    </Card>
  );
}
