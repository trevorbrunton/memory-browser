// app/actions/memories.ts
"use server";

import prisma from "../../lib/prisma";
import type {
  Memory as PrismaMemory,
  Reflection as PrismaReflection,
  MemoryPerson as PrismaMemoryPerson,
  Place as PrismaPlace,
  Event as PrismaEvent, // Using base PrismaEvent type
  MemoryPlace as PrismaMemoryPlace,
  MemoryEvent as PrismaMemoryEvent,
  Person as PrismaPersonInfo,
} from "@prisma/client";

import type { Memory as CustomMemoryType, MediaType } from "@/types/memories";
import type { Reflection as CustomReflectionType } from "@/types/reflection";

// Define a precise type for what Prisma returns from queries with 'include'
// This helps TypeScript understand the shape of data passed to transformMemory.
type PrismaMemoryWithFullIncludes = PrismaMemory & {
  people?: (PrismaMemoryPerson & { person: PrismaPersonInfo })[];
  places?: (PrismaMemoryPlace & { place: PrismaPlace })[];
  events?: (PrismaMemoryEvent & {
    event: PrismaEvent & { place?: PrismaPlace | null };
  })[];
  reflections?: PrismaReflection[];
};

// This function IS SYNCHRONOUS and SHOULD REMAIN SYNCHRONOUS.
// It transforms an already-fetched Prisma object into your custom type.
function transformMemory(
  memory: PrismaMemoryWithFullIncludes // Parameter type is crucial
): CustomMemoryType {
  return {
    id: memory.id,
    title: memory.title,
    description: memory.description || undefined,
    mediaType: memory.media_type as MediaType,
    mediaUrl: memory.media_url,
    mediaName: memory.media_name,
    date: new Date(memory.date),
    dateType: (memory as any).date_type || "exact", // Cast if date_type is not strictly on PrismaMemory but expected
    peopleIds: memory.people?.map((mp) => mp.person_id) || [],
    placeId: memory.places?.[0]?.place_id || undefined,
    eventId: memory.events?.[0]?.event_id || undefined,
    reflections: memory.reflections?.map(transformReflection) || [],
    reflectionIds: memory.reflections?.map((reflection) => reflection.id) || [],
    createdAt: new Date(memory.created_at),
    updatedAt: new Date(memory.updated_at),
  };
}

// This is also SYNCHRONOUS.
function transformReflection(
  reflection: PrismaReflection
): CustomReflectionType {
  return {
    id: reflection.id,
    title: reflection.title,
    content: reflection.content,
    createdAt: new Date(reflection.created_at),
    updatedAt: new Date(reflection.updated_at),
  };
}

// --- Exported Server Actions (These ARE async) ---

export async function getAllMemories(): Promise<CustomMemoryType[]> {
  console.log("💭 Reading memories with Prisma (MongoDB)...");
  try {
    const memoriesFromDb: PrismaMemoryWithFullIncludes[] =
      await prisma.memory.findMany({
        // Await the Prisma query
        include: {
          people: { include: { person: true } },
          places: { include: { place: true } },
          events: { include: { event: { include: { place: true } } } },
          reflections: true,
        },
        orderBy: { date: "desc" },
      });
    // .map calls transformMemory synchronously for each item in the resolved array
    return memoriesFromDb.map(transformMemory);
  } catch (error) {
    console.error("❌ Error fetching memories with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to fetch memories: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

interface AddMemoryServerDTO {
  title: string;
  description?: string;
  mediaType: MediaType;
  mediaUrl: string;
  mediaName: string;
  mediaSize: number;
  date: Date;
  peopleIds: string[];
  placeId?: string;
  eventId?: string;
}

export async function addMemory(
  memoryData: AddMemoryServerDTO
): Promise<CustomMemoryType> {
  console.log("💾 Adding memory with Prisma (MongoDB):", memoryData.title);
  try {
    const { peopleIds, placeId, eventId, ...restOfMemoryData } = memoryData;
    const newMemoryFromDb: PrismaMemoryWithFullIncludes =
      await prisma.memory.create({
        // Await the Prisma query
        data: {
          ...restOfMemoryData,
          media_type: memoryData.mediaType,
          media_url: memoryData.mediaUrl,
          media_name: memoryData.mediaName,
          media_size: memoryData.mediaSize, // Ensure this field exists in your Prisma Memory model
          people:
            peopleIds.length > 0
              ? {
                  create: peopleIds.map((personId) => ({
                    person_id: personId,
                  })),
                }
              : undefined,
          places: placeId ? { create: { place_id: placeId } } : undefined,
          events: eventId ? { create: { event_id: eventId } } : undefined,
        },
        include: {
          people: { include: { person: true } },
          places: { include: { place: true } },
          events: { include: { event: { include: { place: true } } } },
          reflections: true,
        },
      });
    // Call transformMemory synchronously with the resolved data
    return transformMemory(newMemoryFromDb);
  } catch (error) {
    console.error("❌ Error adding memory with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to add memory: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function updateMemoryDetails(
  id: string,
  updates: Pick<CustomMemoryType, "title" | "description" | "date">
): Promise<CustomMemoryType | null> {
  console.log(
    `🔄 Updating core memory details ${id} with Prisma (MongoDB):`,
    updates
  );
  try {
    const dataToUpdate: Partial<PrismaMemory> = {
      title: updates.title?.trim(),
      description: updates.description?.trim() || null,
      date: updates.date ? new Date(updates.date) : undefined,
      updated_at: new Date(),
    };
    Object.keys(dataToUpdate).forEach(
      (key) =>
        (dataToUpdate as any)[key] === undefined &&
        delete (dataToUpdate as any)[key]
    );

    const updatedMemoryFromDb: PrismaMemoryWithFullIncludes | null =
      await prisma.memory.update({
        // Await Prisma
        where: { id },
        data: dataToUpdate,
        include: {
          people: { include: { person: true } },
          places: { include: { place: true } },
          events: { include: { event: { include: { place: true } } } },
          reflections: true,
        },
      });
    return updatedMemoryFromDb ? transformMemory(updatedMemoryFromDb) : null; // Synchronous call
  } catch (error) {
    console.error("❌ Error updating core memory details:", error);
    throw error;
  }
}

export async function updateMemoryPeople(
  memoryId: string,
  peopleIds: string[]
): Promise<CustomMemoryType | null> {
  console.log(
    `🔄 Updating people for memory ${memoryId} with Prisma (MongoDB):`,
    peopleIds
  );
  try {
    const updatedMemoryFromDb = await prisma.$transaction(async (tx) => {
      // Await transaction
      await tx.memoryPerson.deleteMany({ where: { memory_id: memoryId } });
      if (peopleIds.length > 0) {
        await tx.memoryPerson.createMany({
          data: peopleIds.map((personId) => ({
            memory_id: memoryId,
            person_id: personId,
          })),
        });
      }
      await tx.memory.update({
        where: { id: memoryId },
        data: { updated_at: new Date() },
      });
      return tx.memory.findUnique({
        where: { id: memoryId },
        include: {
          people: { include: { person: true } },
          places: { include: { place: true } },
          events: { include: { event: { include: { place: true } } } },
          reflections: true,
        },
      });
    });
    return updatedMemoryFromDb
      ? transformMemory(updatedMemoryFromDb as PrismaMemoryWithFullIncludes)
      : null; // Synchronous call
  } catch (error) {
    console.error("❌ Error updating memory people:", error);
    throw error;
  }
}

export async function updateMemoryEventAssociation(
  memoryId: string,
  newEventId: string | null
): Promise<CustomMemoryType | null> {
  console.log(
    `🔄 Updating event association for memory ${memoryId} to event ${newEventId} with Prisma (MongoDB)`
  );
  try {
    const resultMemory = await prisma.$transaction(async (tx) => {
      // Await transaction
      const currentMemoryWithOldEvent = await tx.memory.findUnique({
        where: { id: memoryId },
        include: {
          events: { include: { event: { select: { place_id: true } } } },
        },
      });
      const oldEventPlaceId =
        currentMemoryWithOldEvent?.events?.[0]?.event?.place_id;

      await tx.memoryEvent.deleteMany({ where: { memory_id: memoryId } });
      if (oldEventPlaceId) {
        await tx.memoryPlace.deleteMany({
          where: { memory_id: memoryId, place_id: oldEventPlaceId },
        });
      } else {
        await tx.memoryPlace.deleteMany({ where: { memory_id: memoryId } });
      }

      if (newEventId) {
        const newEventDetails = await tx.event.findUnique({
          where: { id: newEventId },
          select: { place_id: true },
        });
        if (!newEventDetails)
          throw new Error(`New event ${newEventId} not found.`);
        await tx.memoryEvent.create({
          data: { memory_id: memoryId, event_id: newEventId },
        });
        if (newEventDetails.place_id) {
          await tx.memoryPlace.deleteMany({ where: { memory_id: memoryId } });
          await tx.memoryPlace.create({
            data: { memory_id: memoryId, place_id: newEventDetails.place_id },
          });
        }
      }
      await tx.memory.update({
        where: { id: memoryId },
        data: { updated_at: new Date() },
      });
      const updatedMemoryFromDb = await tx.memory.findUnique({
        where: { id: memoryId },
        include: {
          people: { include: { person: true } },
          places: { include: { place: true } },
          events: { include: { event: { include: { place: true } } } },
          reflections: true,
        },
      });
      if (!updatedMemoryFromDb)
        throw new Error("Memory not found after update transaction.");
      return updatedMemoryFromDb;
    });
    return transformMemory(resultMemory as PrismaMemoryWithFullIncludes); // Synchronous call
  } catch (error) {
    console.error("❌ Error updating memory event association:", error);
    throw error;
  }
}

export async function updateMemoryPlace(
  memoryId: string,
  placeId: string | null
): Promise<CustomMemoryType | null> {
  console.log(
    `🔄 Updating place for memory ${memoryId} to place ${placeId} with Prisma (MongoDB)`
  );
  try {
    const memoryLinks = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: { events: { select: { event: { select: { place_id: true } } } } },
    });
    if (memoryLinks?.events && memoryLinks.events.length > 0) {
      const eventPlaceId = memoryLinks.events[0].event.place_id;
      if (eventPlaceId && placeId !== eventPlaceId) {
        console.warn(
          `Memory ${memoryId} is linked to an event. Changing place directly may be overridden or cause inconsistency.`
        );
      } else if (eventPlaceId && !placeId) {
        console.warn(
          `Memory ${memoryId} is linked to an event with a place. Unlinking the event is preferred to clear the place.`
        );
      }
    }

    const updatedMemoryFromDb = await prisma.$transaction(async (tx) => {
      // Await transaction
      await tx.memoryPlace.deleteMany({ where: { memory_id: memoryId } });
      if (placeId) {
        await tx.memoryPlace.create({
          data: { memory_id: memoryId, place_id: placeId },
        });
      }
      await tx.memory.update({
        where: { id: memoryId },
        data: { updated_at: new Date() },
      });
      return tx.memory.findUnique({
        where: { id: memoryId },
        include: {
          people: { include: { person: true } },
          places: { include: { place: true } },
          events: { include: { event: { include: { place: true } } } },
          reflections: true,
        },
      });
    });
    return updatedMemoryFromDb
      ? transformMemory(updatedMemoryFromDb as PrismaMemoryWithFullIncludes)
      : null; // Synchronous call
  } catch (error) {
    console.error("❌ Error updating memory place:", error);
    throw error;
  }
}

export async function updateMemory(
  id: string,
  updates: Partial<Omit<CustomMemoryType, "id" | "createdAt" | "updatedAt">>
): Promise<CustomMemoryType | null> {
  console.warn(
    "Using full updateMemory. Prefer granular updates for associations."
  );
  const { title, description, date } = updates; // Only handle direct fields here for simplicity
  let finalMemoryState: CustomMemoryType | null = null;

  if (title !== undefined || description !== undefined || date !== undefined) {
    finalMemoryState = await updateMemoryDetails(id, {
      title,
      description,
      date,
    } as Pick<CustomMemoryType, "title" | "description" | "date">);
  }
  if (
    updates.peopleIds !== undefined &&
    (finalMemoryState || (await getMemoryDetails(id)))
  ) {
    // ensure memory exists
    finalMemoryState = await updateMemoryPeople(id, updates.peopleIds);
  }
  if (
    updates.eventId !== undefined &&
    (finalMemoryState || (await getMemoryDetails(id)))
  ) {
    finalMemoryState = await updateMemoryEventAssociation(id, updates.eventId);
  } else if (
    updates.placeId !== undefined &&
    (finalMemoryState || (await getMemoryDetails(id)))
  ) {
    const currentMemory = finalMemoryState || (await getMemoryDetails(id));
    if (!currentMemory?.eventId) {
      finalMemoryState = await updateMemoryPlace(id, updates.placeId);
    }
  }
  return finalMemoryState || getMemoryDetails(id);
}

export async function deleteMemory(id: string): Promise<boolean> {
  console.log(`🗑️ Deleting memory ${id} with Prisma (MongoDB)...`);
  try {
    await prisma.memory.delete({ where: { id } });
    console.log(`✅ Successfully deleted memory ${id} with Prisma (MongoDB)`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting memory with Prisma (MongoDB):", error);
    return false;
  }
}

export async function searchMemories(
  query: string
): Promise<CustomMemoryType[]> {
  console.log(`🔍 Searching memories for: "${query}" with Prisma (MongoDB)`);
  try {
    const memoriesFromDb: PrismaMemoryWithFullIncludes[] =
      await prisma.memory.findMany({
        // Await Prisma
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { media_name: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          people: { include: { person: true } },
          places: { include: { place: true } },
          events: { include: { event: { include: { place: true } } } },
          reflections: true,
        },
        orderBy: { date: "desc" },
      });
    return memoriesFromDb.map(transformMemory); // Synchronous call
  } catch (error) {
    console.error("❌ Error searching memories with Prisma (MongoDB):", error);
    throw error;
  }
}

export async function getMemoryDetails(
  id: string
): Promise<CustomMemoryType | null> {
  console.log(`📖 Reading memory details for ID: ${id} with Prisma (MongoDB)`);
  try {
    const memoryFromDb: PrismaMemoryWithFullIncludes | null =
      await prisma.memory.findUnique({
        // Await Prisma
        where: { id },
        include: {
          people: { include: { person: true } },
          places: { include: { place: true } },
          events: { include: { event: { include: { place: true } } } },
          reflections: true,
        },
      });
    return memoryFromDb ? transformMemory(memoryFromDb) : null; // Synchronous call
  } catch (error) {
    console.error("❌ Error fetching memory details:", error);
    return null;
  }
}

export async function uploadMemoryFile(
  file: File
): Promise<{ url: string; name: string; size: number }> {
  console.log(
    `📤 Uploading file: ${file.name} (${file.size} bytes) (Simulated)`
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const isImage = file.type.startsWith("image/");
  const query = encodeURIComponent(
    file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
  );
  const url = isImage
    ? `/placeholder.svg?height=800&width=1200&query=${query}&db=mongodb`
    : `/placeholder.svg?height=800&width=600&query=${query}&db=mongodb`;
  console.log(`✅ File uploaded successfully (Simulated): ${url}`);
  return { url, name: file.name, size: file.size };
}

export async function addReflection(
  memoryId: string,
  title: string,
  content: string
): Promise<CustomReflectionType> {
  console.log(
    `💭 Adding reflection to memory ${memoryId} with Prisma (MongoDB)`
  );
  try {
    const newReflectionFromDb = await prisma.reflection.create({
      // Await Prisma
      data: {
        memory_id: memoryId,
        title: title.trim(),
        content: content.trim(),
      },
    });
    await prisma.memory.update({
      where: { id: memoryId },
      data: { updated_at: new Date() },
    });
    return transformReflection(newReflectionFromDb); // Synchronous call
  } catch (error) {
    console.error("❌ Error adding reflection:", error);
    throw error;
  }
}

export async function updateReflection(
  reflectionId: string,
  title: string,
  content: string
): Promise<CustomReflectionType | null> {
  console.log(`🔄 Updating reflection ${reflectionId} with Prisma (MongoDB)`);
  try {
    const updatedReflectionFromDb = await prisma.reflection.update({
      // Await Prisma
      where: { id: reflectionId },
      data: {
        title: title.trim(),
        content: content.trim(),
        updated_at: new Date(),
      },
    });
    const reflectionWithMemoryId = await prisma.reflection.findUnique({
      where: { id: reflectionId },
      select: { memory_id: true },
    });
    if (reflectionWithMemoryId?.memory_id) {
      await prisma.memory.update({
        where: { id: reflectionWithMemoryId.memory_id },
        data: { updated_at: new Date() },
      });
    }
    return updatedReflectionFromDb
      ? transformReflection(updatedReflectionFromDb)
      : null; // Synchronous call
  } catch (error) {
    console.error("❌ Error updating reflection:", error);
    throw error;
  }
}

export async function deleteReflection(reflectionId: string): Promise<boolean> {
  console.log(`🗑️ Deleting reflection ${reflectionId} with Prisma (MongoDB)`);
  try {
    const reflectionWithMemoryId = await prisma.reflection.findUnique({
      where: { id: reflectionId },
      select: { memory_id: true },
    });
    if (reflectionWithMemoryId?.memory_id) {
      await prisma.memory.update({
        where: { id: reflectionWithMemoryId.memory_id },
        data: { updated_at: new Date() },
      });
    }
    await prisma.reflection.delete({ where: { id: reflectionId } }); // Await Prisma
    return true;
  } catch (error) {
    console.error("❌ Error deleting reflection:", error);
    return false;
  }
}
