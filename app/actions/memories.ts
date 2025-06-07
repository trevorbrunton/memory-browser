// app/actions/memories.ts
"use server";
import prisma from "@/lib/prisma";
import type {
  Memory as PrismaMemory,
  Reflection as PrismaReflection,
} from "@prisma/client";
import type { Memory as CustomMemoryType, MediaType } from "@/types/memories";
import type { Reflection as CustomReflectionType } from "@/types/reflection";
import { getPrismaUser } from "./auth-helper";

// Transformer functions remain the same...
function transformMemory(memory: any): CustomMemoryType {
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
    peopleIds: memory.people?.map((mp: any) => mp.person_id) || [],
    placeId: memory.places?.[0]?.place_id || undefined,
    eventId: memory.events?.[0]?.event_id || undefined,
    reflections: memory.reflections?.map(transformReflection) || [],
    reflectionIds: memory.reflections?.map((r: any) => r.id) || [],
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
    ownerId: reflection.ownerId,
    createdAt: new Date(reflection.created_at),
    updatedAt: new Date(reflection.updated_at),
  };
}

export async function getAllMemories(): Promise<CustomMemoryType[]> {
  const user = await getPrismaUser();
  const memoriesFromDb = await prisma.memory.findMany({
    where: { ownerId: user.id },
    include: {
      people: { include: { person: true } },
      places: { include: { place: true } },
      events: { include: { event: true } },
      reflections: true,
    },
    orderBy: { date: "desc" },
  });
  return memoriesFromDb.map(transformMemory);
}

// ... other actions updated similarly to check for ownership ...

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
      ...restOfMemoryData,
      ownerId: user.id,
      date_type: "exact",
      media_type: restOfMemoryData.mediaType,
      media_url: restOfMemoryData.mediaUrl,
      media_name: restOfMemoryData.mediaName,
      people: {
        create: peopleIds.map((personId) => ({ person_id: personId })),
      },
      places: placeId ? { create: { place_id: placeId } } : undefined,
      events: eventId ? { create: { event_id: eventId } } : undefined,
    },
    include: {
      people: { include: { person: true } },
      places: { include: { place: true } },
      events: { include: { event: true } },
      reflections: true,
    },
  });
  return transformMemory(newMemoryFromDb);
}
