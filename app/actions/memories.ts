// app/actions/memories.ts
"use server";
import prisma from "@/lib/prisma";
import type {
  Memory as PrismaMemory,
  Reflection as PrismaReflection,
  MemoryPerson,
  MemoryPlace,
  MemoryEvent,
} from "@prisma/client";
import type { Memory as CustomMemoryType, MediaType } from "@/types/memories";
import type { Reflection as CustomReflectionType } from "@/types/reflection";
import { getPrismaUser } from "./auth-helper";

// ... (transformMemory and other functions remain the same) ...

function transformMemory(
  memory: PrismaMemory & {
    people: MemoryPerson[];
    places: MemoryPlace[];
    events: MemoryEvent[];
    reflections: PrismaReflection[];
  }
): CustomMemoryType {
  return {
    id: memory.id,
    title: memory.title,
    description: memory.description || undefined,
    mediaType: memory.media_type as MediaType,
    mediaUrl: memory.media_url,
    thumbnailUrl: memory.thumbnail_url || undefined,
    mediaName: memory.media_name,
    date: new Date(memory.date),
    dateType: memory.date_type || "exact",
    peopleIds: memory.people?.map((mp) => mp.person_id) || [],
    placeId: memory.places?.[0]?.place_id || undefined,
    eventId: memory.events?.[0]?.event_id || undefined,
    reflections: memory.reflections?.map(transformReflection) || [],
    reflectionIds: memory.reflections?.map((r) => r.id) || [],
    ownerId: memory.ownerId,
    createdAt: new Date(memory.created_at),
    updatedAt: new Date(memory.updated_at),
  };
}

function transformReflection(
  reflection: PrismaReflection
): CustomReflectionType {
  return {
    id: reflection.id,
    title: reflection.title,
    content: reflection.content,
    ownerId: (reflection as any).ownerId, // Assuming ownerId is on the reflection
    createdAt: new Date(reflection.created_at),
    updatedAt: new Date(reflection.updated_at),
  };
}

export async function getAllMemories(): Promise<CustomMemoryType[]> {
  const user = await getPrismaUser();
  const memoriesFromDb = await prisma.memory.findMany({
    where: { ownerId: user.id },
    include: {
      people: true,
      places: true,
      events: true,
      reflections: true,
    },
    orderBy: { date: "desc" },
  });
  return memoriesFromDb.map(transformMemory);
}

export async function getMemoryDetails(
  id: string
): Promise<CustomMemoryType | null> {
  const user = await getPrismaUser();
  const memory = await prisma.memory.findFirst({
    where: { id, ownerId: user.id },
    include: {
      people: true,
      places: true,
      events: true,
      reflections: true,
    },
  });
  return memory ? transformMemory(memory) : null;
}

export async function addMemory(
  memoryData: Omit<
    CustomMemoryType,
    | "id"
    | "ownerId"
    | "createdAt"
    | "updatedAt"
    | "reflections"
    | "reflectionIds"
  >
): Promise<CustomMemoryType> {
  const user = await getPrismaUser();
  const { peopleIds, placeId, eventId, ...restOfMemoryData } = memoryData;

  const newMemoryFromDb = await prisma.memory.create({
    data: {
      title: restOfMemoryData.title,
      description: restOfMemoryData.description,
      date: restOfMemoryData.date,
      ownerId: user.id,
      // Map camelCase from the app to snake_case for the database
      media_type: restOfMemoryData.mediaType,
      media_url: restOfMemoryData.mediaUrl,
      thumbnail_url: restOfMemoryData.thumbnailUrl,
      media_name: restOfMemoryData.mediaName,
      date_type: restOfMemoryData.dateType || "exact",
      people: {
        create: peopleIds.map((personId) => ({ person_id: personId })),
      },
      places: placeId ? { create: { place_id: placeId } } : undefined,
      events: eventId ? { create: { event_id: eventId } } : undefined,
    },
    include: {
      people: true,
      places: true,
      events: true,
      reflections: true,
    },
  });
  return transformMemory(newMemoryFromDb);
}

// ... (the rest of the functions remain the same) ...

export async function updateMemoryDetails(
  id: string,
  updates: Pick<CustomMemoryType, "title" | "description" | "date">
): Promise<CustomMemoryType | null> {
  const user = await getPrismaUser();
  const memoryToUpdate = await prisma.memory.findFirst({
    where: { id: id, ownerId: user.id },
  });
  if (!memoryToUpdate) {
    throw new Error("Memory not found or user does not have permission.");
  }

  const updatedMemory = await prisma.memory.update({
    where: { id: id },
    data: {
      ...updates,
      updated_at: new Date(),
    },
    include: {
      people: true,
      places: true,
      events: true,
      reflections: true,
    },
  });
  return transformMemory(updatedMemory);
}

export async function updateMemoryPeople(
  memoryId: string,
  peopleIds: string[]
): Promise<CustomMemoryType | null> {
  const user = await getPrismaUser();
  const memoryToUpdate = await prisma.memory.findFirst({
    where: { id: memoryId, ownerId: user.id },
  });

  if (!memoryToUpdate) {
    throw new Error("Memory not found or user does not have permission.");
  }

  await prisma.memoryPerson.deleteMany({
    where: { memory_id: memoryId },
  });

  const updatedMemory = await prisma.memory.update({
    where: { id: memoryId },
    data: {
      people: {
        create: peopleIds.map((personId) => ({
          person_id: personId,
        })),
      },
      updated_at: new Date(),
    },
    include: {
      people: true,
      places: true,
      events: true,
      reflections: true,
    },
  });

  return transformMemory(updatedMemory);
}

export async function updateMemoryEventAssociation(
  memoryId: string,
  eventId: string | null
): Promise<CustomMemoryType | null> {
  const user = await getPrismaUser();
  const memoryToUpdate = await prisma.memory.findFirst({
    where: { id: memoryId, ownerId: user.id },
  });

  if (!memoryToUpdate) {
    throw new Error("Memory not found or user does not have permission.");
  }

  await prisma.memoryEvent.deleteMany({
    where: { memory_id: memoryId },
  });

  const updatedMemory = await prisma.memory.update({
    where: { id: memoryId },
    data: {
      events: eventId ? { create: { event_id: eventId } } : undefined,
      updated_at: new Date(),
    },
    include: {
      people: true,
      places: true,
      events: true,
      reflections: true,
    },
  });

  return transformMemory(updatedMemory);
}

export async function updateMemoryPlace(
  memoryId: string,
  placeId: string | null
): Promise<CustomMemoryType | null> {
  const user = await getPrismaUser();
  const memoryToUpdate = await prisma.memory.findFirst({
    where: { id: memoryId, ownerId: user.id },
  });

  if (!memoryToUpdate) {
    throw new Error("Memory not found or user does not have permission.");
  }

  await prisma.memoryPlace.deleteMany({
    where: { memory_id: memoryId },
  });

  const updatedMemory = await prisma.memory.update({
    where: { id: memoryId },
    data: {
      places: placeId ? { create: { place_id: placeId } } : undefined,
      updated_at: new Date(),
    },
    include: {
      people: true,
      places: true,
      events: true,
      reflections: true,
    },
  });

  return transformMemory(updatedMemory);
}

export async function addReflection(
  memoryId: string,
  title: string,
  content: string
): Promise<CustomReflectionType> {
  const user = await getPrismaUser();
  const memory = await prisma.memory.findFirst({
    where: { id: memoryId, ownerId: user.id },
  });

  if (!memory) {
    throw new Error("Memory not found or user does not have permission.");
  }

  const newReflection = await prisma.reflection.create({
    data: {
      memory_id: memoryId,
      title,
      content,
      ownerId: user.id,
    },
  });
  return transformReflection(newReflection);
}

export async function updateReflection(
  reflectionId: string,
  title: string,
  content: string
): Promise<CustomReflectionType | null> {
  const user = await getPrismaUser();
  const reflectionToUpdate = await prisma.reflection.findFirst({
    where: { id: reflectionId, ownerId: user.id },
  });

  if (!reflectionToUpdate) {
    throw new Error("Reflection not found or user does not have permission.");
  }

  const updatedReflection = await prisma.reflection.update({
    where: { id: reflectionId },
    data: {
      title,
      content,
      updated_at: new Date(),
    },
  });

  return transformReflection(updatedReflection);
}

export async function deleteReflection(reflectionId: string): Promise<boolean> {
  const user = await getPrismaUser();
  const reflectionToDelete = await prisma.reflection.findFirst({
    where: { id: reflectionId, ownerId: user.id },
  });

  if (!reflectionToDelete) {
    throw new Error("Reflection not found or user does not have permission.");
  }

  await prisma.reflection.delete({
    where: { id: reflectionId },
  });

  return true;
}
