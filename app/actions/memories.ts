// app/actions/memories.ts
"use server";

import prisma from "../../lib/prisma";
import type {
  Memory as PrismaMemory,
  Reflection as PrismaReflection,
  MemoryPerson,
  MemoryPlace,
  MemoryEvent,
} from "@prisma/client";
import type {
  Memory as CustomMemoryType,
  MediaType,
} from "@/types/memories";
import type { Reflection as CustomReflectionType } from "@/types/reflection";

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

// Adjusted transformMemory for MongoDB structure
function transformMemory(
  memory: PrismaMemory & {
    people?: (MemoryPerson & { person: { id: string; name: string } })[];
    places?: (MemoryPlace & { place: { id: string; name: string } })[]; // Assuming one place via MemoryPlace
    events?: (MemoryEvent & {
      event: { id: string; title: string; place_id?: string | null };
    })[]; // Assuming one event via MemoryEvent
    reflections?: PrismaReflection[];
  }
): CustomMemoryType {
  return {
    id: memory.id,
    title: memory.title,
    description: memory.description || undefined,
    mediaType: memory.media_type as MediaType,
    mediaUrl: memory.media_url,
    mediaName: memory.media_name,
    date: new Date(memory.date),
    dateType: "exact", // Set to a valid default value; adjust as needed
    peopleIds: memory.people?.map((mp) => mp.person_id) || [],
    placeId: memory.places?.[0]?.place_id || undefined, // Assuming MemoryPlace for single place
    eventId: memory.events?.[0]?.event_id || undefined, // Assuming MemoryEvent for single event
    reflectionIds: memory.reflections?.map(reflection => reflection.id) || [],
    createdAt: new Date(memory.created_at),
    updatedAt: new Date(memory.updated_at),
  };
}

export async function getAllMemories(): Promise<CustomMemoryType[]> {
  console.log("💭 Reading memories with Prisma (MongoDB)...");
  try {
    const memories = await prisma.memory.findMany({
      include: {
        people: { include: { person: { select: { id: true, name: true } } } },
        places: { include: { place: { select: { id: true, name: true } } } }, // For MemoryPlace
        events: {
          include: {
            event: { select: { id: true, title: true, place_id: true } },
          },
        }, // For MemoryEvent
        reflections: true,
      },
      orderBy: {
        date: "desc",
      },
    });
    const transformedMemories = memories.map(transformMemory);
    console.log(
      `✅ Retrieved ${transformedMemories.length} memories with Prisma (MongoDB)`
    );
    return transformedMemories;
  } catch (error) {
    console.error("❌ Error fetching memories with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to fetch memories: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function addMemory(memoryData: {
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
}): Promise<CustomMemoryType> {
  console.log("💾 Adding memory with Prisma (MongoDB):", memoryData.title);
  try {
    const { peopleIds, placeId, eventId, ...restOfMemoryData } = memoryData;

    const newMemory = await prisma.memory.create({
      data: {
        title: memoryData.title.trim(),
        description: memoryData.description?.trim() || null,
        date: memoryData.date,
        media_type: memoryData.mediaType,
        media_url: memoryData.mediaUrl,
        media_name: memoryData.mediaName,
        media_size: memoryData.mediaSize,
        people:
          peopleIds.length > 0
            ? {
                create: peopleIds.map((personId) => ({ person_id: personId })),
              }
            : undefined,
        places: placeId
          ? {
              create: { place_id: placeId },
            }
          : undefined,
        events: eventId
          ? {
              create: { event_id: eventId },
            }
          : undefined,
      },
      include: {
        people: { include: { person: true } },
        places: { include: { place: true } },
        events: { include: { event: true } },
        reflections: true,
      },
    });
    const transformedMemory = transformMemory(newMemory);
    console.log(
      `✅ Successfully added memory with Prisma (MongoDB): ${transformedMemory.title}`
    );
    return transformedMemory;
  } catch (error) {
    console.error("❌ Error adding memory with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to add memory: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function updateMemory(
  id: string,
  updates: Partial<Omit<CustomMemoryType, "id" | "createdAt" | "reflections">>
): Promise<CustomMemoryType | null> {
  console.log(`🔄 Updating memory ${id} with Prisma (MongoDB):`, updates);
  try {
    const { peopleIds, placeId, eventId, ...memoryUpdates } = updates;

    const dataToUpdate: any = {
      ...memoryUpdates,
      title: memoryUpdates.title?.trim(),
      description: memoryUpdates.description?.trim(),
      date: memoryUpdates.date ? new Date(memoryUpdates.date) : undefined,
      media_type: memoryUpdates.mediaType,
      media_url: memoryUpdates.mediaUrl,
      media_name: memoryUpdates.mediaName,
    };
    Object.keys(dataToUpdate).forEach(
      (key) => dataToUpdate[key] === undefined && delete dataToUpdate[key]
    );

    const updatedMemory = await prisma.$transaction(async (tx) => {
      await tx.memory.update({
        where: { id },
        data: dataToUpdate,
      });

      // Manage People
      if (peopleIds !== undefined) {
        await tx.memoryPerson.deleteMany({ where: { memory_id: id } });
        if (peopleIds.length > 0) {
          await tx.memoryPerson.createMany({
            data: peopleIds.map((personId) => ({
              memory_id: id,
              person_id: personId,
            })),
          });
        }
      }

      // Manage Place (assuming one place via MemoryPlace)
      if (placeId !== undefined) {
        await tx.memoryPlace.deleteMany({ where: { memory_id: id } });
        if (placeId) {
          await tx.memoryPlace.create({
            data: { memory_id: id, place_id: placeId },
          });
        }
      }

      // Manage Event (assuming one event via MemoryEvent)
      if (eventId !== undefined) {
        await tx.memoryEvent.deleteMany({ where: { memory_id: id } });
        if (eventId) {
          await tx.memoryEvent.create({
            data: { memory_id: id, event_id: eventId },
          });
        }
      }

      return tx.memory.findUnique({
        where: { id },
        include: {
          people: { include: { person: true } },
          places: { include: { place: true } },
          events: { include: { event: true } },
          reflections: true,
        },
      });
    });

    if (!updatedMemory) return null;

    const transformedMemory = transformMemory(updatedMemory);
    console.log(`✅ Successfully updated memory ${id} with Prisma (MongoDB)`);
    return transformedMemory;
  } catch (error) {
    console.error("❌ Error updating memory with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to update memory: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function updateMemoryEvent(
  memoryId: string,
  eventId: string | null
): Promise<CustomMemoryType | null> {
  console.log(
    `🔄 Updating memory ${memoryId} with event ${eventId} using Prisma (MongoDB)`
  );
  try {
    return await prisma.$transaction(async (tx) => {
      // First, clear existing MemoryEvent and potentially MemoryPlace for this memory
      await tx.memoryEvent.deleteMany({ where: { memory_id: memoryId } });
      // If the place was tied to the event, we might also clear MemoryPlace,
      // or let the main updateMemory handle placeId separately if it's independent.
      // For this function, let's assume if event changes, place derived from old event should be cleared.
      const oldMemory = await tx.memory.findUnique({
        where: { id: memoryId },
        include: { events: { include: { event: true } } },
      });
      if (oldMemory?.events?.[0]?.event?.place_id) {
        // if old event dictated the place, and event is changing/removed, remove that place link too
        await tx.memoryPlace.deleteMany({
          where: {
            memory_id: memoryId,
            place_id: oldMemory.events[0].event.place_id,
          },
        });
      }

      let placeIdToSet: string | null | undefined = undefined;
      if (eventId) {
        const eventDetails = await tx.event.findUnique({
          where: { id: eventId },
          select: { place_id: true },
        });
        if (!eventDetails) throw new Error(`Event ${eventId} not found.`);
        placeIdToSet = eventDetails.place_id;

        // Create new MemoryEvent link
        await tx.memoryEvent.create({
          data: { memory_id: memoryId, event_id: eventId },
        });
        // If event has a place, create MemoryPlace link
        if (placeIdToSet) {
          await tx.memoryPlace.create({
            data: { memory_id: memoryId, place_id: placeIdToSet },
          });
        }
      }
      // else: eventId is null, links already cleared.

      const updatedMemory = await tx.memory.findUnique({
        where: { id: memoryId },
        include: {
          people: { include: { person: true } },
          places: { include: { place: true } },
          events: { include: { event: true } },
          reflections: true,
        },
      });

      if (!updatedMemory) throw new Error("Memory not found after update.");
      return transformMemory(updatedMemory);
    });
  } catch (error) {
    console.error(
      "❌ Error updating memory event with Prisma (MongoDB):",
      error
    );
    throw new Error(
      `Failed to update memory event: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function deleteMemory(id: string): Promise<boolean> {
  console.log(`🗑️ Deleting memory ${id} with Prisma (MongoDB)...`);
  try {
    // Prisma onDelete: Cascade in related models (MemoryPerson, Reflection, MemoryPlace, MemoryEvent)
    // will handle deletion of associated join records.
    await prisma.memory.delete({
      where: { id },
    });
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
    // MongoDB text search setup:
    // 1. Create a text index in MongoDB on Memory collection:
    //    db.memory.createIndex({ title: "text", description: "text", media_name: "text" })
    // 2. Use $text search with $runCommandRaw or wait for better Prisma support.
    // For now, using 'contains' for broader compatibility with Prisma's default capabilities:
    const memories = await prisma.memory.findMany({
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
        events: { include: { event: true } },
        reflections: true,
      },
      orderBy: { date: "desc" },
    });
    const transformedMemories = memories.map(transformMemory);
    console.log(
      `✅ Found ${transformedMemories.length} memories matching "${query}" with Prisma (MongoDB)`
    );
    return transformedMemories;
  } catch (error) {
    console.error("❌ Error searching memories with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to search memories: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function getMemoryDetails(
  id: string
): Promise<CustomMemoryType | null> {
  console.log(`📖 Reading memory details for ID: ${id} with Prisma (MongoDB)`);
  try {
    const memory = await prisma.memory.findUnique({
      where: { id },
      include: {
        people: { include: { person: true } },
        places: { include: { place: true } },
        events: { include: { event: true } },
        reflections: true,
      },
    });

    if (!memory) {
      console.log(`❌ Memory with ID ${id} not found with Prisma (MongoDB).`);
      return null;
    }
    const transformedMemory = transformMemory(memory);
    console.log(
      `✅ Retrieved memory details for: ${transformedMemory.title} with Prisma (MongoDB)`
    );
    return transformedMemory;
  } catch (error) {
    console.error(
      "❌ Error fetching memory details with Prisma (MongoDB):",
      error
    );
    return null;
  }
}

export async function uploadMemoryFile(
  file: File
): Promise<{ url: string; name: string; size: number }> {
  // This function remains a mock as it's about file storage, not direct DB interaction via Prisma here.
  // In a real scenario, you'd upload to a service (like S3, Cloudinary, or Supabase Storage) and get a URL.
  console.log(
    `📤 Uploading file: ${file.name} (${file.size} bytes) (Simulated for Prisma MongoDB refactor)`
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const isImage = file.type.startsWith("image/");
  const query = encodeURIComponent(
    file.name.replace(/\.[^/.]+$/, "").replace(/-/g, " ")
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
    const newReflection = await prisma.reflection.create({
      data: {
        memory_id: memoryId,
        title: title.trim(),
        content: content.trim(),
      },
    });
    const transformedReflection = transformReflection(newReflection);
    console.log(
      `✅ Successfully added reflection to memory ${memoryId} with Prisma (MongoDB)`
    );
    return transformedReflection;
  } catch (error) {
    console.error("❌ Error adding reflection with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to add reflection: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function updateReflection(
  reflectionId: string,
  title: string,
  content: string
): Promise<CustomReflectionType | null> {
  console.log(`🔄 Updating reflection ${reflectionId} with Prisma (MongoDB)`);
  try {
    const updatedReflection = await prisma.reflection.update({
      where: { id: reflectionId },
      data: {
        title: title.trim(),
        content: content.trim(),
      },
    });
    if (!updatedReflection) return null;
    const transformedReflection = transformReflection(updatedReflection);
    console.log(
      `✅ Successfully updated reflection ${reflectionId} with Prisma (MongoDB)`
    );
    return transformedReflection;
  } catch (error) {
    console.error("❌ Error updating reflection with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to update reflection: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function deleteReflection(reflectionId: string): Promise<boolean> {
  console.log(`🗑️ Deleting reflection ${reflectionId} with Prisma (MongoDB)`);
  try {
    await prisma.reflection.delete({
      where: { id: reflectionId },
    });
    console.log(
      `✅ Successfully deleted reflection ${reflectionId} with Prisma (MongoDB)`
    );
    return true;
  } catch (error) {
    console.error("❌ Error deleting reflection with Prisma (MongoDB):", error);
    return false;
  }
}
