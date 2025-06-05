"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, MapPin, ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface Event {
  id: string
  title: string
  description?: string
  date: Date
}

interface Place {
  id: string
  name: string
}

interface EventCardProps {
  event: Event
  place?: Place
  memoriesCount: number
}

export function EventCard({ event, place, memoriesCount }: EventCardProps) {
  const router = useRouter()

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{event.title}</h3>
          <Badge variant="outline">{formatDate(event.date)}</Badge>
        </div>
        {event.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>}
        {place && (
          <div className="flex items-center gap-1 mt-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{place.name}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-purple-600" />
          <span className="text-sm">
            {memoriesCount} {memoriesCount === 1 ? "memory" : "memories"}
          </span>
        </div>
      </div>
      <div className="p-3 bg-gray-50 border-t flex justify-end">
        <Button size="sm" variant="outline" onClick={() => router.push(`/event-details/${event.id}`)}>
          <Eye className="h-3.5 w-3.5 mr-1" />
          View Event
        </Button>
      </div>
    </Card>
  )
}
