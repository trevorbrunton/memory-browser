export interface Person {
  id: string
  name: string
  email?: string
  role?: string
  photoUrl?: string
  dateOfBirth?: string
  placeOfBirth?: string
  maritalStatus?: "single" | "married" | "divorced" | "widowed"
  spouseId?: string
  childrenIds?: string[]
  attributes?: PersonAttribute[]
  createdAt: Date
  updatedAt: Date
}

export interface PersonAttribute {
  attribute: string
  value: string
}
