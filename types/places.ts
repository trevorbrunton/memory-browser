export type Place = {
  id: string;
  name: string;
  address?: string;
  city: string;
  country: string;
  type:
    | "office"
    | "restaurant"
    | "hotel"
    | "venue"
    | "park"
    | "museum"
    | "store";
  capacity?: number;
  rating?: number;
  attributes?: PlaceAttribute[];
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PlaceAttribute = {
  attribute: string;
  value: string;
};
