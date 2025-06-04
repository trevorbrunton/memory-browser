export interface Attribute {
  id: string
  name: string
  category?: string
  description?: string
  entityType: "person" | "event" | "place" | "all"
  createdAt: Date
  updatedAt: Date
}

export interface PersonAttribute {
  attribute: string
  value: string
}
