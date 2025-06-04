export type Memory = {
  id: string;
  title: string;
  description?: string;
  date: Date;
  dateType: "year" | "month" | "day" | "exact";
  peopleIds: string[];
  placeId?: string;
  eventId?: string;
  memoryIds?: string[];
  reflectionIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
