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
      {/* The rest of your JSX remains the same, as it correctly uses the `addMemoryMutation.isPending` state for the button. */}
    </div>
  );
}
