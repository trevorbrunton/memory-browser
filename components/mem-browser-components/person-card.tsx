"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface Person {
  id: string
  name: string
  email?: string
  role?: string
  photoUrl?: string
}

interface PersonCardProps {
  person: Person
  memoriesCount: number
}

export function PersonCard({ person, memoriesCount }: PersonCardProps) {
  const router = useRouter()

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {person.photoUrl ? (
              <img
                src={person.photoUrl || "/placeholder.svg"}
                alt={person.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                {person.name
                  .split(" ")
                  .map((part) => part.charAt(0))
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{person.name}</h3>
            {person.role && <p className="text-sm text-gray-600">{person.role}</p>}
            {person.email && <p className="text-xs text-gray-500">{person.email}</p>}
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="h-4 w-4 text-purple-600" />
          <span className="text-sm">
            {memoriesCount} {memoriesCount === 1 ? "memory" : "memories"}
          </span>
        </div>
      </div>
      <div className="p-3 bg-gray-50 border-t flex justify-end">
        <Button size="sm" variant="outline" onClick={() => router.push(`/person-details/${person.id}`)}>
          <Eye className="h-3.5 w-3.5 mr-1" />
          View Person
        </Button>
      </div>
    </Card>
  )
}
