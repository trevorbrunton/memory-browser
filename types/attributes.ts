export type Attribute = {
  id: string;
  name: string;
  category?: string;
  description?: string;
  entityType: "person" | "event" | "place" | "reflection" | "journal" | "all";
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};
