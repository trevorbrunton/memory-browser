export type Attribute = {
  id: string
  name: string
  category?: string
  description?: string
  entityType: "person" | "event" | "place" | "reflection" | "journal" | "all"
  createdAt: Date
  updatedAt: Date
}


