"use client";

import { useParams, useRouter } from "next/navigation";
import { PlaceDetailsForm } from "./place-details-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { usePlaceDetails } from "@/hooks/use-places";
import { Card } from "@/components/ui/card";

export default function PlaceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = params.id as string;

  const { data: place, isLoading, isError, error } = usePlaceDetails(placeId);

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span className="text-lg">Loading place details...</span>
        </div>
      </div>
    );
  }

  if (isError || !place) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Place
          </h2>
          <p className="text-gray-600 mb-4">
            {error?.message || "Place not found"}
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Management System
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.push("/")} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Place Details</h1>
        </div>
      </div>

      <PlaceDetailsForm place={place} />
    </div>
  );
}
