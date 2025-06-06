"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  ImageIcon,
  Loader2,
  Check,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { usePeople } from "../../hooks/use-people";
import { usePlaces } from "../../hooks/use-places";
import { useEvents } from "../../hooks/use-events";
import { useAddMemoryWithFile } from "../../hooks/use-memories";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "../../components/file-upload";
import { PeopleSelector } from "../../components/people-selector";
import { PlaceSelector } from "../../components/place-selector";
import { EventSelector } from "../../components/event-selector";

export default function CreateMemoryPage() {
  const router = useRouter();
  const { toast } = useToast();

  const { data: allPeople = [], isLoading: peopleLoading } = usePeople();
  const { data: allPlaces = [], isLoading: placesLoading } = usePlaces();
  const { data: allEvents = [], isLoading: eventsLoading } = useEvents();
  const addMemoryMutation = useAddMemoryWithFile();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().slice(0, 16),
    peopleIds: [] as string[],
    placeId: "",
    eventId: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");

  const handleInputChange = (field: string, value: string | string[]) => {
    if (field === "eventId") {
      const selectedEvent = allEvents.find((event) => event.id === value);
      if (selectedEvent?.placeId) {
        const associatedPlace = allPlaces.find(
          (place) => place.id === selectedEvent.placeId
        );
        if (associatedPlace) {
          setFormData((prev) => ({
            ...prev,
            eventId: value as string,
            placeId: associatedPlace.id,
          }));
          toast({
            title: "Place Added",
            description: `${associatedPlace.name} was automatically added as this event's location.`,
            duration: 3000,
          });
          return;
        }
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    if (!formData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      const formattedName = fileName
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setFormData((prev) => ({ ...prev, title: formattedName }));
    }
    setActiveTab("details");
  };

  const handleSave = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please upload a file first.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the memory.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Creating Memory...",
      description: "Uploading file and saving details. Please wait.",
    });

    try {
      const memoryData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: new Date(formData.date),
        peopleIds: formData.peopleIds,
        placeId: formData.placeId || undefined,
        eventId: formData.eventId || undefined,
      };

      await addMemoryMutation.mutateAsync({
        file: selectedFile,
        memoryData,
      });

      toast({ title: "Success", description: "Memory created successfully!" });

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      router.push("/");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Error Creating Memory",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const isLoading = peopleLoading || placesLoading || eventsLoading;
  const canSave =
    selectedFile && formData.title.trim() && !addMemoryMutation.isPending;

  const selectedPeople = allPeople.filter((person) =>
    formData.peopleIds.includes(person.id)
  );
  const selectedPlace = allPlaces.find(
    (place) => place.id === formData.placeId
  );
  const selectedEvent = allEvents.find(
    (event) => event.id === formData.eventId
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

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
            Create New Memory
          </h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="min-w-[120px]"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview Panel */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center">
              <ImageIcon className="h-4 w-4 mr-2" />
              Memory Preview
            </h3>
            <div className="space-y-3">
              <div className="text-center">
                <div className="w-full aspect-square mx-auto rounded-lg overflow-hidden bg-gray-100 mb-3 border-2 border-gray-200">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                      <FileText className="h-16 w-16 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">
                        {selectedFile?.name || "No file selected"}
                      </span>
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-lg">
                  {formData.title || "New Memory"}
                </h4>
                {selectedFile && (
                  <Badge variant="secondary" className="mt-2">
                    {selectedFile.type.startsWith("image/")
                      ? "Photo"
                      : "Document"}
                  </Badge>
                )}
              </div>

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
                    <span>
                      {selectedPeople.length} person
                      {selectedPeople.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {selectedEvent && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{selectedEvent.title}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Details Form */}
        <div className="lg:col-span-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Upload File
                {selectedFile && <Check className="h-4 w-4 text-green-500" />}
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="flex items-center gap-2"
                disabled={!selectedFile}
              >
                <User className="h-4 w-4" />
                Add Details
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="pt-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Upload Media</h3>
                <FileUpload onFileSelected={handleFileSelected} />
              </Card>
            </TabsContent>
            <TabsContent value="details" className="space-y-6 pt-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Core Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      placeholder="Enter a descriptive title"
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
                      placeholder="Add notes, context, or a story about this memory"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date & Time *</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                    />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Associations</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>People</Label>
                    <PeopleSelector
                      allPeople={allPeople}
                      selectedPeople={formData.peopleIds}
                      onSelectionChange={(value) =>
                        handleInputChange("peopleIds", value)
                      }
                      isLoading={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Event</Label>
                    <EventSelector
                      allEvents={allEvents}
                      selectedEvent={formData.eventId}
                      onSelectionChange={(value) =>
                        handleInputChange("eventId", value)
                      }
                      isLoading={isLoading}
                      allPlaces={allPlaces}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Place</Label>
                    <PlaceSelector
                      allPlaces={allPlaces}
                      selectedPlace={formData.placeId}
                      onSelectionChange={(value) =>
                        handleInputChange("placeId", value)
                      }
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
  );
}
