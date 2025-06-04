export type MediaType = "photo" | "document"

export interface Reflection {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface Memory {
  id: string
  title: string
  description?: string
  mediaType: MediaType
  mediaUrl: string
  mediaName: string
  mediaSize: number
  date: Date
  peopleIds: string[]
  placeId?: string
  eventId?: string
  reflections: Reflection[]
  createdAt: Date
  updatedAt: Date
}
