export type Person = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed";
  spouseId?: string;
  childrenIds?: string[];
  attributes?: PersonAttribute[];
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PersonAttribute = {
  attribute: string;
  value: string;
};
