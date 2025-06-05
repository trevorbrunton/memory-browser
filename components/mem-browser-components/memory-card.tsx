"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

export function MemoryCard({ memory }: MemoryCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className="w-full max-w-sm overflow-hidden hover:shadow-lg transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Media Preview with Overlay */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {memory.mediaType === "photo" ? (
          <>
            <img
              src={memory.mediaUrl || "/placeholder.svg?height=240&width=320&query=memory photo"}
              alt={memory.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              crossOrigin="anonymous"
            />
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 text-center px-4">{memory.mediaName}</span>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold line-clamp-2">{memory.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-sm text-muted-foreground line-clamp-2 cursor-help">
                {memory.description || "No description available"}
              </p>
            </TooltipTrigger>
            {memory.description && memory.description.length > 100 && (
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{memory.description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <Button onClick={() => router.push(`/memory-details/${memory.id}`)} className="w-full" variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          View Memory
        </Button>
      </CardContent>
    </Card>
  )
}
