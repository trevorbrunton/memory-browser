export type Collection = {
  id: string;
  owner: string;
  collectionName: string;
  collectionDetails: string;
  users: string[];
  memoryIds: string[];
  eventIds: string[];
  placeIds: string[];
  peopleIds: string[];
  createdAt: Date;
  updatedAt: Date;
};
