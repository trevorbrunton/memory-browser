import type { Reflection } from "@/types/reflection";

export type MediaType = "photo" | "document";



export interface Memory {
  id: string;
  title: string;
  description?: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaName: string;
  date: Date;
  dateType: string;
  peopleIds: string[];
  placeId?: string;
  eventId?: string;
  reflections: Reflection[]; // Add this line
  reflectionIds: string[];
  createdAt: Date;
  updatedAt: Date;
}