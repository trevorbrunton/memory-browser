// app/actions/memories.ts
"use server";

import prisma from "../../lib/prisma";
import type {
  Memory as PrismaMemory,
  Reflection as PrismaReflection,
  MemoryPerson,
  MemoryPlace,
  MemoryEvent,
  // Import other Prisma types if needed for event/place details
  Event as PrismaEventType, // For fetching event details
} from "@prisma/client";
import type { Memory as CustomMemoryType, MediaType } from "@/types/memories";
import type { Reflection as CustomReflectionType } from "@/types/reflection";
// Ensure that CustomMemoryType includes 'reflections: CustomReflectionType[]'

// ... (keep transformReflection and transformMemory functions as they are)
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

function transformMemory(
  memory: PrismaMemory & {
    people?: (MemoryPerson & { person: { id: string; name: string } })[];
    places?: (MemoryPlace & { place: { id: string; name: string } })[];
    events?: (MemoryEvent & {
      event: { id: string; title: string; place_id?: string | null };
    })[];
    reflections?: PrismaReflection[]; // Ensure reflections are included
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
    dateType: "exact", // Or derive from `memory.date_type` if it exists
    peopleIds: memory.people?.map((mp) => mp.person_id) || [],
    placeId: memory.places?.[0]?.place_id || undefined,
    eventId: memory.events?.[0]?.event_id || undefined,
    // Include full reflection objects if your transformMemory expects them
    // or if you want to return them directly from actions that update reflections.
    reflections: memory.reflections?.map(transformReflection) || [], // Populate if you fetch them
    reflectionIds: memory.reflections?.map((reflection) => reflection.id) || [], // Keep this if primarily using IDs
    createdAt: new Date(memory.created_at),
    updatedAt: new Date(memory.updated_at),
  };
}

// ... (keep getAllMemories, addMemory, uploadMemoryFile as they are)
export async function getAllMemories(): Promise<CustomMemoryType[]> {
  console.log("💭 Reading memories with Prisma (MongoDB)...");
  try {
    const memories = await prisma.memory.findMany({
      include: {
        people: { include: { person: { select: { id: true, name: true } } } },
        places: { include: { place: { select: { id: true, name: true } } } },
        events: {
          include: {
            event: { select: { id: true, title: true, place_id: true } },
          },
        },
        reflections: true, // Ensure reflections are fetched
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
  mediaSize: number; // Assuming mediaSize is part of your schema
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
        media_size: memoryData.mediaSize, // Make sure this field exists in your Prisma schema for Memory
        people:
          peopleIds.length > 0
            ? {
                create: peopleIds.map((personId) => ({ person_id: personId })),
              }
            : undefined,
        places: placeId ? { create: { place_id: placeId } } : undefined,
        events: eventId ? { create: { event_id: eventId } } : undefined,
      },
      include: {
        // Include relations to match transformMemory
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

// --- UPDATED/NEW ACTIONS ---

/**
 * Updates only the core details (title, description, date) of a memory.
 */
export async function updateMemoryDetails(
  id: string,
  updates: Pick<CustomMemoryType, "title" | "description" | "date">
): Promise<CustomMemoryType | null> {
  console.log(
    `🔄 Updating core memory details ${id} with Prisma (MongoDB):`,
    updates
  );
  try {
    const dataToUpdate: any = {
      title: updates.title?.trim(),
      description: updates.description?.trim() || null,
      date: updates.date ? new Date(updates.date) : undefined,
      updated_at: new Date(),
    };
    Object.keys(dataToUpdate).forEach(
      (key) => dataToUpdate[key] === undefined && delete dataToUpdate[key]
    );

    const updatedMemory = await prisma.memory.update({
      where: { id },
      data: dataToUpdate,
      include: {
        // Keep includes consistent for transformMemory
        people: { include: { person: true } },
        places: { include: { place: true } },
        events: { include: { event: true } },
        reflections: true,
      },
    });

    if (!updatedMemory) return null;
    return transformMemory(updatedMemory);
  } catch (error) {
    console.error("❌ Error updating core memory details:", error);
    throw error;
  }
}

/**
 * Updates the people associated with a memory.
 */
export async function updateMemoryPeople(
  memoryId: string,
  peopleIds: string[]
): Promise<CustomMemoryType | null> {
  console.log(
    `🔄 Updating people for memory ${memoryId} with Prisma (MongoDB):`,
    peopleIds
  );
  try {
    const updatedMemory = await prisma.$transaction(async (tx) => {
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
          events: { include: { event: true } },
          reflections: true,
        },
      });
    });
    if (!updatedMemory) return null;
    return transformMemory(updatedMemory);
  } catch (error) {
    console.error("❌ Error updating memory people:", error);
    throw error;
  }
}

/**
 * Updates the event associated with a memory.
 * If the event has a place, the memory's place is also updated.
 */
export async function updateMemoryEventAssociation(
  memoryId: string,
  eventId: string | null
): Promise<CustomMemoryType | null> {
  console.log(
    `🔄 Updating event association for memory ${memoryId} to event ${eventId} with Prisma (MongoDB)`
  );
  try {
    return await prisma.$transaction(async (tx) => {
      // Clear existing MemoryEvent and MemoryPlace (if it was tied to the old event)
      await tx.memoryEvent.deleteMany({ where: { memory_id: memoryId } });
      // For simplicity, we will always clear the place if the event changes.
      // A more sophisticated approach might check if the new event has a different place.
      await tx.memoryPlace.deleteMany({ where: { memory_id: memoryId } });

      let newPlaceId: string | undefined = undefined;

      if (eventId) {
        const eventDetails = await tx.event.findUnique({
          where: { id: eventId },
          select: { place_id: true }, // Select only place_id
        });

        if (!eventDetails) throw new Error(`Event ${eventId} not found.`);
        newPlaceId = eventDetails.place_id || undefined;

        // Create new MemoryEvent link
        await tx.memoryEvent.create({
          data: { memory_id: memoryId, event_id: eventId },
        });

        // If event has a place, create MemoryPlace link
        if (newPlaceId) {
          await tx.memoryPlace.create({
            data: { memory_id: memoryId, place_id: newPlaceId },
          });
        }
      }
      // Update the memory's updated_at timestamp
      await tx.memory.update({
        where: { id: memoryId },
        data: { updated_at: new Date() },
      });

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
    console.error("❌ Error updating memory event association:", error);
    throw error;
  }
}

/**
 * Updates the place associated with a memory.
 * This should typically only be called if no event is associated, or if overriding event's place.
 */
export async function updateMemoryPlace(
  memoryId: string,
  placeId: string | null
): Promise<CustomMemoryType | null> {
  console.log(
    `🔄 Updating place for memory ${memoryId} to place ${placeId} with Prisma (MongoDB)`
  );
  try {
    // Check if an event is associated with this memory.
    // If so, generally the place should be dictated by the event.
    // This action assumes direct place update is allowed or event is not set.
    const memoryWithEvent = await prisma.memory.findUnique({
      where: { id: memoryId },
      include: { events: true },
    });
    if (
      memoryWithEvent?.events &&
      memoryWithEvent.events.length > 0 &&
      placeId !== memoryWithEvent.events[0].event_id
    ) {
      // Potentially throw an error or log a warning if trying to set place directly when an event is linked,
      // unless this is an intended override. For this refactor, we allow it but it's a design consideration.
      console.warn(
        `Warning: Updating place directly for memory ${memoryId} which is associated with an event. Place might be overwritten by event association.`
      );
    }

    const updatedMemory = await prisma.$transaction(async (tx) => {
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
          events: { include: { event: true } },
          reflections: true,
        },
      });
    });
    if (!updatedMemory) return null;
    return transformMemory(updatedMemory);
  } catch (error) {
    console.error("❌ Error updating memory place:", error);
    throw error;
  }
}

// The old `updateMemory` function might be deprecated or refactored if all its parts are now handled by granular functions.
// For now, let's keep it but note that its usage might change.
export async function updateMemory(
  id: string,
  updates: Partial<Omit<CustomMemoryType, "id" | "createdAt" | "reflections">>
): Promise<CustomMemoryType | null> {
  console.log(
    `🔄 Updating memory ${id} with Prisma (MongoDB) [Full Update]:`,
    updates
  );
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
      // media_size: memoryUpdates.mediaSize, // Ensure this exists or is handled
      updated_at: new Date(),
    };
    Object.keys(dataToUpdate).forEach(
      (key) => dataToUpdate[key] === undefined && delete dataToUpdate[key]
    );

    const updatedMemory = await prisma.$transaction(async (tx) => {
      // Update basic memory fields
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

      // Manage Place & Event carefully, event might dictate place
      if (eventId !== undefined) {
        // If eventId is part of the update
        await tx.memoryEvent.deleteMany({ where: { memory_id: id } });
        await tx.memoryPlace.deleteMany({ where: { memory_id: id } }); // Clear place if event changes

        if (eventId) {
          // If a new event is set
          const eventDetails = await tx.event.findUnique({
            where: { id: eventId },
            select: { place_id: true },
          });
          if (!eventDetails)
            throw new Error(
              `Event ${eventId} not found during full memory update.`
            );

          await tx.memoryEvent.create({
            data: { memory_id: id, event_id: eventId },
          });
          if (eventDetails.place_id) {
            await tx.memoryPlace.create({
              data: { memory_id: id, place_id: eventDetails.place_id },
            });
          }
        }
        // If eventId is explicitly set to null, relations are already cleared.
      } else if (placeId !== undefined) {
        // If eventId is NOT part of update, but placeId IS
        const currentMemoryLinks = await tx.memory.findUnique({
          where: { id },
          select: { events: true },
        });
        if (
          !currentMemoryLinks?.events ||
          currentMemoryLinks.events.length === 0
        ) {
          // Only update place if no event is linked
          await tx.memoryPlace.deleteMany({ where: { memory_id: id } });
          if (placeId) {
            await tx.memoryPlace.create({
              data: { memory_id: id, place_id: placeId },
            });
          }
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
    return transformMemory(updatedMemory);
  } catch (error) {
    console.error("❌ Error in full memory update:", error);
    throw error;
  }
}

// Keep deleteMemory, searchMemories, getMemoryDetails, uploadMemoryFile
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
    return memories.map(transformMemory);
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
    const memory = await prisma.memory.findUnique({
      where: { id },
      include: {
        people: { include: { person: true } },
        places: { include: { place: true } },
        events: { include: { event: true } },
        reflections: true, // Ensure reflections are fetched here
      },
    });

    if (!memory) {
      console.log(`❌ Memory with ID ${id} not found.`);
      return null;
    }
    // The transformMemory function should now also handle transforming the fetched reflections
    return transformMemory(memory);
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
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

  // In a real app, upload to a service like S3, Cloudinary, Firebase Storage, or Supabase Storage
  // and get a public URL.
  // For this mock, we'll create a placeholder URL.
  const isImage = file.type.startsWith("image/");
  // Create a more descriptive query for placeholder based on filename
  const query = encodeURIComponent(
    file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
  );
  const url = isImage
    ? `/placeholder.svg?height=800&width=1200&query=${query}&db=mongodb` // More descriptive for images
    : `/placeholder.svg?height=800&width=600&query=${query}&db=mongodb`; // Generic for documents

  console.log(`✅ File uploaded successfully (Simulated): ${url}`);
  return { url, name: file.name, size: file.size };
}

// --- Reflection Actions (Adjusted for Prisma and to return full reflection) ---
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
    // Also update the memory's updated_at timestamp
    await prisma.memory.update({
      where: { id: memoryId },
      data: { updated_at: new Date() },
    });
    return transformReflection(newReflection);
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
    const updatedReflection = await prisma.reflection.update({
      where: { id: reflectionId },
      data: {
        title: title.trim(),
        content: content.trim(),
        updated_at: new Date(),
      },
    });
    // Also update the memory's updated_at timestamp
    const reflectionWithMemoryId = await prisma.reflection.findUnique({
      where: { id: reflectionId },
      select: { memory_id: true },
    });
    if (reflectionWithMemoryId) {
      await prisma.memory.update({
        where: { id: reflectionWithMemoryId.memory_id },
        data: { updated_at: new Date() },
      });
    }
    return updatedReflection ? transformReflection(updatedReflection) : null;
  } catch (error) {
    console.error("❌ Error updating reflection:", error);
    throw error;
  }
}

export async function deleteReflection(reflectionId: string): Promise<boolean> {
  console.log(`🗑️ Deleting reflection ${reflectionId} with Prisma (MongoDB)`);
  try {
    // Also update the memory's updated_at timestamp before deleting the reflection
    const reflectionWithMemoryId = await prisma.reflection.findUnique({
      where: { id: reflectionId },
      select: { memory_id: true },
    });
    if (reflectionWithMemoryId) {
      await prisma.memory.update({
        where: { id: reflectionWithMemoryId.memory_id },
        data: { updated_at: new Date() },
      });
    }
    await prisma.reflection.delete({ where: { id: reflectionId } });
    return true;
  } catch (error) {
    console.error("❌ Error deleting reflection:", error);
    return false;
  }
}
