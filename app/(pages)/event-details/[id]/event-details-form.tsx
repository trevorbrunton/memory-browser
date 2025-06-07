"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// Select related imports are not used in this version of the form for event type, but kept if needed elsewhere
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Calendar,
  MapPin,
  Clock,
  FileText,
  Plus,
  X,
  Settings,
  Loader2,
} from "lucide-react"; // Added Loader2
import { useUpdateEventDetails } from "@/hooks/use-events"; //
import { usePlaces } from "@/hooks/use-places"; //
import type { Event, EventAttribute } from "@/types/events"; //
import { useToast } from "@/hooks/use-toast"; //
import { useRouter } from "next/navigation";
import { AttributeSelector } from "@/components/attribute-selector"; //
import { PlaceSelector } from "@/components/place-selector"; //

interface EventDetailsFormProps {
  event: Event;
}

export function EventDetailsForm({ event }: EventDetailsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const updateEventMutation = useUpdateEventDetails(); //
  const { data: allPlaces = [], isLoading: placesLoading } = usePlaces(); //

  // Form state
  const [formData, setFormData] = useState({
    title: event.title || "",
    description: event.description || "",
    date: event.date ? new Date(event.date).toISOString().slice(0, 16) : "", // For datetime-local input
    placeId: event.placeId || "", // Keep as empty string for PlaceSelector compatibility
    attributes: event.attributes || [],
    dateType: event.dateType || "exact", // Initialize dateType from event
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Update form data when event prop changes
  useEffect(() => {
    setFormData({
      title: event.title || "",
      description: event.description || "",
      date: event.date ? new Date(event.date).toISOString().slice(0, 16) : "",
      placeId: event.placeId || "",
      attributes: event.attributes || [],
      dateType: event.dateType || "exact",
    });
    setHasChanges(false);
  }, [event]);

  // Check for changes
  useEffect(() => {
    const originalDateString = event.date
      ? new Date(event.date).toISOString().slice(0, 16)
      : "";
    const formDateString = formData.date;

    const hasFormChanges =
      formData.title !== (event.title || "") ||
      formData.description !== (event.description || "") ||
      formDateString !== originalDateString ||
      formData.placeId !== (event.placeId || "") ||
      JSON.stringify(
        formData.attributes
          .map((a) => ({ attribute: a.attribute, value: a.value }))
          .sort((a, b) => a.attribute.localeCompare(b.attribute))
      ) !==
        JSON.stringify(
          (event.attributes || [])
            .map((a) => ({ attribute: a.attribute, value: a.value }))
            .sort((a, b) => a.attribute.localeCompare(b.attribute))
        ) ||
      formData.dateType !== (event.dateType || "exact");

    setHasChanges(hasFormChanges);
  }, [formData, event]);

  const handleInputChange = (
    field: string,
    value: string | EventAttribute[] | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === undefined ? "" : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(
        "[Form] Attempting to save. formData.placeId:",
        formData.placeId
      );

      // Construct the updates object carefully
      const updatesToSend: Partial<
        Omit<Event, "id" | "createdAt" | "updatedAt">
      > = {
        title: formData.title.trim(),
        // Send description only if it has a value, otherwise server action should handle it as undefined (or null if schema prefers)
        description: formData.description.trim()
          ? formData.description.trim()
          : undefined,
        date: formData.date ? new Date(formData.date) : undefined, // Server action defaults to new Date() if undefined

        // --- KEY CHANGE HERE ---
        // If formData.placeId is an empty string (meaning cleared in UI), send null.
        // Otherwise, send the actual placeId.
        // The 'hasOwnProperty' check in the server action relies on 'placeId' being a property in 'updates'.
        placeId: formData.placeId === "" ? null : formData.placeId,

        attributes: formData.attributes.filter(
          (attr) => attr.attribute.trim() !== "" || attr.value.trim() !== ""
        ),
        dateType: formData.dateType,
      };

      // If placeId was originally present in event and is now cleared (empty string in formData)
      // ensure it's explicitly part of updates as null.
      // If placeId was not part of the original event and formData.placeId is still empty,
      // we don't need to send it unless there's a specific need to set it to null.
      // The `updates.hasOwnProperty('placeId')` check on the server is crucial.
      // To ensure `hasOwnProperty` works, we always include `placeId` in the `updatesToSend` if its value
      // (or cleared status) is different from the original event's `placeId`.
      // A simpler way is to just always send it if it's part of the form.

      console.log(
        "[Form] Updates object being sent to server action:",
        JSON.stringify(updatesToSend, null, 2)
      );

      await updateEventMutation.mutateAsync({
        id: event.id,
        updates: updatesToSend,
      });

      toast({
        title: "Success",
        description: "Event details updated successfully",
      });

      router.push("/");
    } catch (error) {
      console.error("Failed to update event:", error);
      toast({
        title: "Error",
        description: `Failed to update event details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const currentSelectedPlace = allPlaces.find(
    (place) => place.id === formData.placeId
  );

  const addAttribute = () => {
    handleInputChange("attributes", [
      ...formData.attributes,
      { attribute: "", value: "" },
    ]);
  };

  const updateAttribute = (
    index: number,
    field: "attribute" | "value",
    value: string
  ) => {
    const updatedAttributes = formData.attributes.map((attr, i) =>
      i === index ? { ...attr, [field]: value } : attr
    );
    handleInputChange("attributes", updatedAttributes);
  };

  const removeAttribute = (index: number) => {
    const updatedAttributes = formData.attributes.filter((_, i) => i !== index);
    handleInputChange("attributes", updatedAttributes);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Event Overview Panel */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Event Overview
          </h3>
          <div className="space-y-3">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                {(formData.title || event.title || "E").charAt(0).toUpperCase()}
              </div>
              <h4 className="font-medium text-lg">
                {formData.title || event.title}
              </h4>
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
            </div>

            {(formData.description ||
              (!formData.description && event.description)) && ( // Show original if form is empty but original had value
              <div className="mt-4">
                <h5 className="font-medium text-sm mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Description
                </h5>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {formData.description || event.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Details Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter event title"
              />
            </div>
            {/* DateType Selector - Assuming you have values for it */}
            <div className="space-y-2">
              <Label htmlFor="dateType">Event Date Type</Label>
              <select // Using a native select for simplicity, replace with ShadCN if preferred
                id="dateType"
                value={formData.dateType}
                onChange={(e) =>
                  handleInputChange(
                    "dateType",
                    e.target.value as Event["dateType"]
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="exact">Exact</option>
                <option value="day">Day</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter event description"
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Schedule & Location */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Schedule & Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="placeId">Location</Label>
              <PlaceSelector
                allPlaces={allPlaces}
                selectedPlace={formData.placeId}
                onSelectionChange={(newPlaceId) =>
                  handleInputChange("placeId", newPlaceId || "")
                } // Ensure empty string if null/undefined
                isLoading={placesLoading}
              />
            </div>
          </div>
        </Card>

        {/* Other Details */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Other Details (Attributes)
            </h3>
            <Button onClick={addAttribute} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Attribute
            </Button>
          </div>

          <div className="space-y-4">
            {formData.attributes.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">
                No additional attributes.
              </p>
            ) : (
              formData.attributes.map((attr, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] items-end gap-3 p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <Label htmlFor={`attr-name-${index}`}>Attribute Name</Label>
                    <AttributeSelector
                      value={attr.attribute}
                      onChange={(value) =>
                        updateAttribute(index, "attribute", value)
                      }
                      placeholder="Select or add attribute..."
                      entityType="event"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`attr-value-${index}`}>
                      Attribute Value
                    </Label>
                    <Input
                      id={`attr-value-${index}`}
                      value={attr.value}
                      onChange={(e) =>
                        updateAttribute(index, "value", e.target.value)
                      }
                      placeholder="Enter value..."
                    />
                  </div>
                  <Button
                    onClick={() => removeAttribute(index)}
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-red-500 hover:text-red-700 self-end" // Align button
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove Attribute</span>
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateEventMutation.isPending}
            className="min-w-[120px]"
          >
            {updateEventMutation.isPending ? (
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
              You have unsaved changes. Click "Save Changes" to update the event
              details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
