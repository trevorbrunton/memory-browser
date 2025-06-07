// File: app/create-place/page.tsx
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, ArrowLeft, MapPin, Building, Globe, Star, Users, Plus, X, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAddPlaces } from "../../hooks/use-places"
import { AttributeSelector } from "../../components/attribute-selector"
import type { Place, PlaceAttribute } from "../../types/places"

export default function CreatePlacePage() {
  const router = useRouter()
  const { toast } = useToast()
  const addPlacesMutation = useAddPlaces()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    type: "office" as Place["type"],
    capacity: "",
    rating: "",
    attributes: [] as PlaceAttribute[],
  })

  const handleInputChange = (field: string, value: string | PlaceAttribute[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Place name is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.city.trim()) {
      toast({
        title: "Error",
        description: "City is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.country.trim()) {
      toast({
        title: "Error",
        description: "Country is required",
        variant: "destructive",
      })
      return
    }

    try {
      const placeData = {
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        city: formData.city.trim(),
        country: formData.country.trim(),
        type: formData.type,
        capacity: formData.capacity ? Number.parseInt(formData.capacity) : undefined,
        rating: formData.rating ? Number.parseFloat(formData.rating) : undefined,
        attributes: formData.attributes,
      }

      const newPlaces = await addPlacesMutation.mutateAsync([placeData])

      toast({
        title: "Success",
        description: "Place created successfully",
      })

      // Navigate to the new place's details page
      if (newPlaces.length > 0) {
        router.push(`/place-details/${newPlaces[0].id}`)
      } else {
        router.push("/")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create place",
        variant: "destructive",
      })
    }
  }

  const getPlaceTypeColor = (type: Place["type"]) => {
    const colors = {
      office: "bg-blue-100 text-blue-800",
      restaurant: "bg-red-100 text-red-800",
      hotel: "bg-purple-100 text-purple-800",
      venue: "bg-green-100 text-green-800",
      park: "bg-emerald-100 text-emerald-800",
      museum: "bg-amber-100 text-amber-800",
      store: "bg-orange-100 text-orange-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  // Attribute management functions
  const addAttribute = () => {
    const newAttribute: PlaceAttribute = { attribute: "", value: "" }
    handleInputChange("attributes", [...formData.attributes, newAttribute])
  }

  const updateAttribute = (index: number, field: "attribute" | "value", value: string) => {
    const updatedAttributes = [...formData.attributes]
    updatedAttributes[index] = { ...updatedAttributes[index], [field]: value }
    handleInputChange("attributes", updatedAttributes)
  }

  const removeAttribute = (index: number) => {
    const updatedAttributes = formData.attributes.filter((_, i) => i !== index)
    handleInputChange("attributes", updatedAttributes)
  }

  const canSave =
    formData.name.trim() && formData.city.trim() && formData.country.trim() && !addPlacesMutation.isPending

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.push("/")} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold flex items-center">
            <MapPin className="h-6 w-6 mr-2" />
            Create New Place
          </h1>
        </div>
        <Button onClick={handleSave} disabled={!canSave} className="min-w-[120px]">
          {addPlacesMutation.isPending ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Place
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Place Preview Panel */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Place Preview
            </h3>
            <div className="space-y-3">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-green-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                </div>
                <h4 className="font-medium text-lg">{formData.name || "New Place"}</h4>
                <Badge className={`mt-2 ${getPlaceTypeColor(formData.type)}`}>{formData.type}</Badge>
              </div>

              <div className="space-y-2 text-sm">
                {(formData.city || formData.country) && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>
                      {formData.city && formData.country
                        ? `${formData.city}, ${formData.country}`
                        : formData.city || formData.country}
                    </span>
                  </div>
                )}
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
                    <div className="flex mr-2">{renderStars(Number.parseFloat(formData.rating))}</div>
                    <span>{Number.parseFloat(formData.rating).toFixed(1)} rating</span>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h5 className="font-medium text-sm mb-2">Quick Info</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Type: {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}</div>
                  {(formData.city || formData.country) && (
                    <div>
                      Location:{" "}
                      {formData.city && formData.country
                        ? `${formData.city}, ${formData.country}`
                        : formData.city || formData.country}
                    </div>
                  )}
                  {formData.capacity && <div>Max Capacity: {formData.capacity} people</div>}
                  {formData.rating && <div>Rating: {Number.parseFloat(formData.rating).toFixed(1)}/5.0</div>}
                </div>
              </div>

              {formData.attributes.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <h5 className="font-medium text-sm mb-2">Attributes:</h5>
                  <div className="flex flex-wrap gap-1">
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
                <Label htmlFor="name">Place Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter place name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Place Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
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
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
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
                  No additional attributes. Click "Add Attribute" to add amenities, policies, or other details.
                </p>
              ) : (
                formData.attributes.map((attr, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Attribute</Label>
                      <AttributeSelector
                        value={attr.attribute}
                        onChange={(value) => updateAttribute(index, "attribute", value)}
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
                        onChange={(e) => updateAttribute(index, "value", e.target.value)}
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

          {/* Help Text */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-medium text-sm mb-2 text-blue-800">💡 Tips for Creating Places</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use descriptive names that help you identify the place easily</li>
              <li>• Add specific addresses when possible for better organization</li>
              <li>• Use attributes to store important details like parking, WiFi, or accessibility info</li>
              <li>• Rating can help you remember your experience at this place</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
