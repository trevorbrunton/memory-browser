export interface Place {
  id: string
  name: string
  address?: string
  city: string
  country: string
  type: "office" | "restaurant" | "hotel" | "venue" | "park" | "museum" | "store"
  capacity?: number
  rating?: number
  attributes?: PlaceAttribute[]
  createdAt: Date
  updatedAt: Date
}

export interface PlaceAttribute {
  attribute: string
  value: string
}
