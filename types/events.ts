export interface Event {
  id: string
  title: string
  description?: string
  date: Date
  placeId?: string
  type: "meeting" | "workshop" | "conference" | "social" | "training"
  capacity?: number
  attributes?: EventAttribute[]
  createdAt: Date
  updatedAt: Date
}

export interface EventAttribute {
  attribute: string
  value: string
}
