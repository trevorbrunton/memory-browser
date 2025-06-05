export type Event = {
  id: string;
  title: string;
  description?: string;
  date: Date;
  dateType: "year" | "month" | "day" | "exact";
  placeId?: string | null;
  attributes?: EventAttribute[];
  createdAt: Date;
  updatedAt: Date;
};

export type EventAttribute = {
  attribute: string;
  value: string;
};
