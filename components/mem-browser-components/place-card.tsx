"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, User, Calendar, ImageIcon, Building, Star } from "lucide-react"
import { useRouter } from "next/navigation"

interface Place {
  id: string
  name: string
  city: string
  country: string
  address?: string
  type: string
  capacity?: number
  rating?: number
  attributes?: Array<{ attribute: string; value: string }>
}

interface PlaceCardProps {
  place: Place
  memoriesCount: number
  eventsCount: number
}

export function PlaceCard({ place, memoriesCount, eventsCount }: PlaceCardProps) {
  const router = useRouter()

  const getPlaceTypeColor = (type: string) => {
    const colors = {
      office: "bg-blue-100 text-blue-800",
      restaurant: "bg-red-100 text-red-800",
      hotel: "bg-purple-100 text-purple-800",
      venue: "bg-green-100 text-green-800",
      park: "bg-emerald-100 text-emerald-800",
      museum: "bg-amber-100 text-amber-800",
      store: "bg-orange-100 text-orange-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const renderStars = (rating?: number) => {
    if (!rating) return null
    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="text-xs text-gray-600">{rating.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      {/* Place Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-green-600 flex items-center justify-center text-white text-lg font-bold">
              {place.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{place.name}</h3>
              <p className="text-sm text-gray-600">
                {place.city}, {place.country}
              </p>
            </div>
          </div>
          <Badge className={`${getPlaceTypeColor(place.type)}`}>{place.type}</Badge>
        </div>
      </div>

      {/* Place Details */}
      <div className="p-4 space-y-3">
        {place.address && (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{place.address}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          {place.capacity && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm">{place.capacity} capacity</span>
            </div>
          )}
          {place.rating && renderStars(place.rating)}
        </div>

        {/* Associated Content */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-purple-600" />
            <span className="text-sm">
              {memoriesCount} {memoriesCount === 1 ? "memory" : "memories"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-600" />
            <span className="text-sm">
              {eventsCount} {eventsCount === 1 ? "event" : "events"}
            </span>
          </div>
        </div>

        {/* Attributes Preview */}
        {place.attributes && place.attributes.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Attributes</p>
            <div className="flex flex-wrap gap-1">
              {place.attributes.slice(0, 3).map((attr, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {attr.attribute}: {attr.value}
                </Badge>
              ))}
              {place.attributes.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{place.attributes.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-gray-50 border-t flex justify-end">
        <Button size="sm" variant="outline" onClick={() => router.push(`/place-details/${place.id}`)}>
          <Eye className="h-3.5 w-3.5 mr-1" />
          View Place
        </Button>
      </div>
    </Card>
  )
}
