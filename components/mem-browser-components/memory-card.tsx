"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, User, MapPin, Calendar, FileText, Heart, Share2, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface Memory {
  id: string
  title: string
  description?: string
  mediaName: string
  mediaType: string
  mediaUrl?: string
  date: Date
  peopleIds: string[]
  placeId?: string
  eventId?: string
}

interface Person {
  id: string
  name: string
  email?: string
  role?: string
}

interface Place {
  id: string
  name: string
  city: string
  address?: string
}

interface Event {
  id: string
  title: string
  description?: string
}

interface MemoryCardProps {
  memory: Memory
  people: Person[]
  place?: Place
  event?: Event
}

export function MemoryCard({ memory, people, place, event }: MemoryCardProps) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  return (
    <Card
      className="group overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2 border-0 shadow-lg hover:shadow-purple-100/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Media Preview with Overlay */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {memory.mediaType === "photo" ? (
          <>
            <img
              src={memory.mediaUrl || "/placeholder.svg"}
              alt={memory.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 text-center px-4">{memory.mediaName}</span>
          </div>
        )}

        {/* Floating Action Buttons */}
        <div
          className={`absolute top-3 right-3 flex gap-2 transition-all duration-300 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
        >
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border-0"
            onClick={(e) => {
              e.stopPropagation()
              setIsLiked(!isLiked)
            }}
          >
            <Heart className={`h-4 w-4 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* Media Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="bg-white/95 backdrop-blur-sm text-gray-700 border-0 shadow-sm font-medium px-3 py-1"
          >
            {memory.mediaType === "photo" ? "📸 Photo" : "📄 Document"}
          </Badge>
        </div>

        {/* Time Ago Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge
            variant="outline"
            className="bg-white/95 backdrop-blur-sm border-white/50 text-gray-600 font-medium px-3 py-1"
          >
            {getTimeAgo(memory.date)}
          </Badge>
        </div>
      </div>

      {/* Memory Info Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-xl text-gray-900 leading-tight group-hover:text-purple-700 transition-colors duration-300">
            {memory.title}
          </h3>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed h-6 line-clamp-1 mb-3">
          {memory.description || <span className="text-gray-300 italic">No description</span>}
        </p>
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 font-medium px-3 py-1"
          >
            {formatDate(memory.date)}
          </Badge>
        </div>
      </div>

      {/* Associations */}
      <div className="p-5 space-y-4">
        {/* People */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">People</p>
            {people.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {people.slice(0, 3).map((person) => (
                  <Badge
                    key={person.id}
                    variant="secondary"
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700 cursor-pointer transition-all duration-200 hover:shadow-sm font-medium px-3 py-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/person-details/${person.id}`)
                    }}
                  >
                    {person.name}
                  </Badge>
                ))}
                {people.length > 3 && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-medium px-3 py-1">
                    +{people.length - 3} more
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">No people tagged</span>
            )}
          </div>
        </div>

        {/* Event */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Event</p>
            {event ? (
              <Badge
                variant="outline"
                className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200 text-purple-700 cursor-pointer transition-all duration-200 hover:shadow-sm font-medium px-3 py-1"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/event-details/${event.id}`)
                }}
              >
                {event.title}
              </Badge>
            ) : (
              <span className="text-sm text-gray-400 italic">No event linked</span>
            )}
          </div>
        </div>

        {/* Place */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Location</p>
            {place ? (
              <Badge
                variant="outline"
                className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200 text-green-700 cursor-pointer transition-all duration-200 hover:shadow-sm font-medium px-3 py-1"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/place-details/${place.id}`)
                }}
              >
                📍 {place.name}
              </Badge>
            ) : (
              <span className="text-sm text-gray-400 italic">No location set</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-100">
        <Button
          size="sm"
          variant="outline"
          className="w-full transition-all duration-300 hover:bg-gray-50"
          onClick={() => router.push(`/memory-details/${memory.id}`)}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          View Memory
        </Button>
      </div>
    </Card>
  )
}
