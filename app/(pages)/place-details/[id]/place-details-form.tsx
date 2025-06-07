// app/place-details/[id]/place-details-form.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  MapPin,
  Star,
  Users,
  Building,
  Globe,
  Plus,
  X,
  Settings,
} from "lucide-react";
import type { Place, PlaceAttribute } from "@/types/places";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { AttributeSelector } from "@/components/attribute-selector";
import { useUpdatePlace } from "@/hooks/use-places"; // FIX: Import the correct hook

interface PlaceDetailsFormProps {
  place: Place;
}

export function PlaceDetailsForm({ place }: PlaceDetailsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const updatePlaceMutation = useUpdatePlace(); // FIX: Use the imported hook directly

  // Form state
  const [formData, setFormData] = useState({
    name: place.name || "",
    address: place.address || "",
    city: place.city || "",
    country: place.country || "",
    type: place.type || "office",
    capacity: place.capacity?.toString() || "",
    rating: place.rating?.toString() || "",
    attributes: place.attributes || [],
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Update form data when place changes
  useEffect(() => {
    setFormData({
      name: place.name || "",
      address: place.address || "",
      city: place.city || "",
      country: place.country || "",
      type: place.type || "office",
      capacity: place.capacity?.toString() || "",
      rating: place.rating?.toString() || "",
      attributes: place.attributes || [],
    });
    setHasChanges(false);
  }, [place]);

  // Check for changes
  useEffect(() => {
    const hasFormChanges =
      formData.name !== (place.name || "") ||
      formData.address !== (place.address || "") ||
      formData.city !== (place.city || "") ||
      formData.country !== (place.country || "") ||
      formData.type !== (place.type || "office") ||
      formData.capacity !== (place.capacity?.toString() || "") ||
      formData.rating !== (place.rating?.toString() || "") ||
      JSON.stringify(formData.attributes) !==
        JSON.stringify(place.attributes || []);

    setHasChanges(hasFormChanges);
  }, [formData, place]);

  const handleInputChange = (
    field: string,
    value: string | PlaceAttribute[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Place name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Saving place details...", formData);

      const updates = {
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        city: formData.city.trim(),
        country: formData.country.trim(),
        type: formData.type as Place["type"],
        capacity: formData.capacity
          ? Number.parseInt(formData.capacity)
          : undefined,
        rating: formData.rating
          ? Number.parseFloat(formData.rating)
          : undefined,
        attributes: formData.attributes,
      };

      console.log("Updates to be sent:", updates);

      const result = await updatePlaceMutation.mutateAsync({
        id: place.id,
        updates,
      });

      console.log("Update result:", result);

      toast({
        title: "Success",
        description: "Place details updated successfully",
      });

      // Navigate back to main page after successful save
      router.push("/");
    } catch (error) {
      console.error("Failed to update place:", error);
      toast({
        title: "Error",
        description: `Failed to update place details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    }
  };

  const getPlaceTypeColor = (type: Place["type"]) => {
    const colors = {
      office: "bg-blue-100 text-blue-800",
      restaurant: "bg-red-100 text-red-800",
      hotel: "bg-purple-100 text-purple-800",
      venue: "bg-green-100 text-green-800",
      park: "bg-emerald-100 text-emerald-800",
      museum: "bg-amber-100 text-amber-800",
      store: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  // Attribute management functions
  const addAttribute = () => {
    const newAttribute: PlaceAttribute = { attribute: "", value: "" };
    handleInputChange("attributes", [...formData.attributes, newAttribute]);
  };

  const updateAttribute = (
    index: number,
    field: "attribute" | "value",
    value: string
  ) => {
    const updatedAttributes = [...formData.attributes];
    updatedAttributes[index] = { ...updatedAttributes[index], [field]: value };
    handleInputChange("attributes", updatedAttributes);
  };

  const removeAttribute = (index: number) => {
    const updatedAttributes = formData.attributes.filter((_, i) => i !== index);
    handleInputChange("attributes", updatedAttributes);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Place Overview Panel */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Place Overview
          </h3>
          <div className="space-y-3">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-green-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                {place.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="font-medium text-lg">{place.name}</h4>
              <Badge className={`mt-2 ${getPlaceTypeColor(place.type)}`}>
                {place.type}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>
                  {formData.city}, {formData.country}
                </span>
              </div>
              {formData.address && (
                <div className="flex items-center text-gray-600">
                  <Building className="h-4 w-4 mr-2" />
                  <span>{formData.address}</span>
                </div>
              )}
              {formData.capacity && (
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{formData.capacity} capacity</span>
                </div>
              )}
              {formData.rating && (
                <div className="flex items-center text-gray-600">
                  <div className="flex mr-2">
                    {renderStars(Number.parseFloat(formData.rating))}
                  </div>
                  <span>
                    {Number.parseFloat(formData.rating).toFixed(1)} rating
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h5 className="font-medium text-sm mb-2">Quick Info</h5>
              <div className="text-xs text-gray-600 space-y-1">
                <div>
                  Type:{" "}
                  {place.type.charAt(0).toUpperCase() + place.type.slice(1)}
                </div>
                <div>
                  Location: {place.city}, {place.country}
                </div>
                {place.capacity && (
                  <div>Max Capacity: {place.capacity} people</div>
                )}
                {place.rating && (
                  <div>Rating: {place.rating.toFixed(1)}/5.0</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Details Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Place Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter place name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Place Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select place type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="park">Park</SelectItem>
                  <SelectItem value="museum">Museum</SelectItem>
                  <SelectItem value="store">Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter street address"
              />
            </div>
          </div>
        </Card>

        {/* Location Information */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Globe className="h-4 w-4 mr-2" />
            Location Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                placeholder="Enter country"
              />
            </div>
          </div>
        </Card>

        {/* Capacity & Rating */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Star className="h-4 w-4 mr-2" />
            Capacity & Rating
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleInputChange("capacity", e.target.value)}
                placeholder="Enter maximum capacity"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={formData.rating}
                onChange={(e) => handleInputChange("rating", e.target.value)}
                placeholder="Enter rating (1.0 - 5.0)"
              />
            </div>
          </div>
        </Card>

        {/* Other Details */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Other Details
            </h3>
            <Button onClick={addAttribute} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Attribute
            </Button>
          </div>

          <div className="space-y-4">
            {formData.attributes.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">
                No additional attributes. Click "Add Attribute" to add
                amenities, policies, or other details.
              </p>
            ) : (
              formData.attributes.map((attr, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border rounded-lg"
                >
                  <div className="space-y-2">
                    <Label>Attribute</Label>
                    <AttributeSelector
                      value={attr.attribute}
                      onChange={(value) =>
                        updateAttribute(index, "attribute", value)
                      }
                      placeholder="Select or add attribute..."
                      entityType="place"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Value</Label>
                      <Button
                        onClick={() => removeAttribute(index)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={attr.value}
                      onChange={(e) =>
                        updateAttribute(index, "value", e.target.value)
                      }
                      placeholder="Enter value..."
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {formData.attributes.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Current Attributes:</h4>
              <div className="flex flex-wrap gap-2">
                {formData.attributes
                  .filter((attr) => attr.attribute && attr.value)
                  .map((attr, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {attr.attribute}: {attr.value}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </Card>

        {/* Place Statistics */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Place Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formData.capacity || 0}
              </div>
              <div className="text-sm text-gray-600">Capacity</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {formData.rating
                  ? Number.parseFloat(formData.rating).toFixed(1)
                  : "N/A"}
              </div>
              <div className="text-sm text-gray-600">Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {new Date(place.createdAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600">Created</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {new Date(place.updatedAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600">Last Updated</div>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updatePlaceMutation.isPending}
            className="min-w-[120px]"
          >
            {updatePlaceMutation.isPending ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
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
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-700">
              You have unsaved changes. Click "Save Changes" to update the place
              details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
