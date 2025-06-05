// app/actions/events.ts
"use server";

import prisma from "@/lib/prisma";
import type {
  Event as PrismaEvent,
  EventAttribute as PrismaEventAttribute,
  Place as PrismaPlace,
} from "@prisma/client";
import type { Event as CustomEventType } from "@/types/events";

function transformEvent(
  event: PrismaEvent & {
    attributes?: PrismaEventAttribute[];
    place?: { id: string; name: string } | null;
  }
): CustomEventType {
  return {
    id: event.id,
    title: event.title,
    description: event.description || undefined,
    date: new Date(event.date),
    dateType: (event.type as CustomEventType["dateType"]) || "exact",
    placeId: event.place_id || undefined,
    attributes:
      event.attributes?.map((attr) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(event.created_at),
    updatedAt: new Date(event.updated_at),
  };
}

export async function getAllEvents(): Promise<CustomEventType[]> {
  console.log("📅 Reading events with Prisma (MongoDB)...");
  try {
    const events = await prisma.event.findMany({
      include: {
        attributes: true,
        place: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });
    return events.map(transformEvent);
  } catch (error) {
    console.error("Error fetching events:", error);
    throw new Error(
      `Failed to fetch events: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

interface AddEventServerDTO {
  title: string;
  description?: string;
  date: Date;
  placeId?: string;
  type?: CustomEventType["dateType"];
}

export async function addEvents(
  eventDataArray: AddEventServerDTO[]
): Promise<CustomEventType[]> {
  console.log(
    "Adding events:",
    eventDataArray.map((e) => e.title)
  );
  try {
    const createdEvents: CustomEventType[] = [];
    for (const data of eventDataArray) {
      const newEvent = await prisma.event.create({
        data: {
          title: data.title.trim(),
          description: data.description,
          date: data.date,
          type: data.type || "exact",
          ...(data.placeId ? { place: { connect: { id: data.placeId } } } : {}),
        },
        include: {
          attributes: true,
          place: { select: { id: true, name: true } },
        },
      });
      createdEvents.push(transformEvent(newEvent));
    }
    return createdEvents;
  } catch (error) {
    console.error("Error adding events:", error);
    throw new Error(
      `Failed to add events: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function updateEvent(
  eventId: string,
  updates: Partial<Omit<CustomEventType, "id" | "createdAt" | "updatedAt">>
): Promise<CustomEventType | null> {
  try {
    const {
      attributes,
      placeId: newPlaceIdFromUpdates,
      dateType,
      ...eventCoreUpdates
    } = updates;

    // CORRECTED: Consistently use prismaEventUpdateData
    const prismaEventUpdateData: any = {
      ...eventCoreUpdates,
      updated_at: new Date(),
    };

    if (eventCoreUpdates.date)
      prismaEventUpdateData.date = new Date(eventCoreUpdates.date);
    if (dateType) prismaEventUpdateData.type = dateType;

    if (updates.hasOwnProperty("placeId")) {
      if (newPlaceIdFromUpdates && newPlaceIdFromUpdates.trim() !== "") {
        prismaEventUpdateData.place = {
          connect: { id: newPlaceIdFromUpdates },
        };
        console.log(
          `[Action] Event ${eventId}: Will attempt to CONNECT place: ${newPlaceIdFromUpdates}`
        );
      } else {
        prismaEventUpdateData.place = { disconnect: true };
        console.log(
          `[Action] Event ${eventId}: Will attempt to DISCONNECT place.`
        );
      }
    } else {
      console.log(
        `[Action] Event ${eventId}: No 'placeId' in updates payload. Event's place relation will not be changed directly by this update.`
      );
    }

    Object.keys(prismaEventUpdateData).forEach((key) => {
      if (prismaEventUpdateData[key] === undefined && key !== "place") {
        delete prismaEventUpdateData[key];
      }
    });
    console.log(
      `[Action] Event ${eventId}: Final Prisma data for event.update:`,
      JSON.stringify(prismaEventUpdateData, null, 2)
    );

    // CORRECTED: Consistent variable naming for the result of the transaction
    const eventAfterTransaction = await prisma.$transaction(async (tx) => {
      console.log(`[TXN_START] Event ${eventId}`);

      const updatedEventRecord = await tx.event.update({
        where: { id: eventId },
        data: prismaEventUpdateData, // Use the correctly prepared data
        include: { place: { select: { id: true } } },
      });

      if (!updatedEventRecord) {
        console.error(
          `[TXN_ERROR] Event ${eventId}: Failed to update event record.`
        );
        throw new Error("Event record update failed within transaction.");
      }
      const eventFinalPlaceId = updatedEventRecord.place_id;

      if (updates.hasOwnProperty("placeId")) {

        const associatedMemoryEvents = await tx.memoryEvent.findMany({
          where: { event_id: eventId },
          select: { memory_id: true },
        });

        if (associatedMemoryEvents.length > 0) {
          const memoryIds = associatedMemoryEvents.map((me) => me.memory_id);


          const deletedMemoryPlacesCount = await tx.memoryPlace.deleteMany({
            where: { memory_id: { in: memoryIds } },
          });


          if (eventFinalPlaceId) {

            const createdMemoryPlaces = await tx.memoryPlace.createMany({
              data: memoryIds.map((memId) => ({
                memory_id: memId,
                place_id: eventFinalPlaceId,
              })),
            });

          } 
          

          await tx.memory.updateMany({
            where: { id: { in: memoryIds } },
            data: { updated_at: new Date() },
          });
          console.log(
            `[TXN_STEP] Event ${eventId}: Updated 'updated_at' for ${memoryIds.length} memories.`
          );
        } 
      } else {
        console.log(
          `[TXN_STEP] Event ${eventId}: 'placeId' was NOT in updates. No cascade to memories needed for place.`
        );
      }

      if (updates.hasOwnProperty("attributes")) {
        console.log(
          `[TXN_STEP] Event ${eventId}: Processing attributes update.`
        );
        await tx.eventAttribute.deleteMany({ where: { event_id: eventId } });
        if (attributes && attributes.length > 0) {
          await tx.eventAttribute.createMany({
            data: attributes.map((attr) => ({
              event_id: eventId,
              attribute: attr.attribute,
              value: attr.value,
            })),
          });
        }
      }

      const finalEventForReturn = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          attributes: true,
          place: { select: { id: true, name: true } },
        },
      });
      if (!finalEventForReturn) {
        console.error(
          `[TXN_ERROR] Event ${eventId}: Failed to re-fetch event at end of transaction.`
        );
        throw new Error("Failed to re-fetch event at end of transaction.");
      }
      console.log(`[TXN_END] Event ${eventId}: Transaction successful.`);
      return finalEventForReturn;
    });

    // CORRECTED: Use the result of the transaction for transformation
    return eventAfterTransaction ? transformEvent(eventAfterTransaction) : null;
  } catch (error) {
    console.error(
      `Error in updateEvent action for event ${eventId}:`,
      error
    );
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update event: ${errorMessage}`);
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  console.log(`🗑️ Deleting event ${id}...`);
  try {
    await prisma.$transaction(async (tx) => {
      const memoryEvents = await tx.memoryEvent.findMany({
        where: { event_id: id },
        include: { event: { select: { place_id: true } } },
      });

      if (memoryEvents.length > 0) {
        const memoryIds = memoryEvents.map((me) => me.memory_id);
        await tx.memoryPlace.deleteMany({
          where: { memory_id: { in: memoryIds } },
        });
        await tx.memory.updateMany({
          where: { id: { in: memoryIds } },
          data: { updated_at: new Date() },
        });
      }

      await tx.memoryEvent.deleteMany({ where: { event_id: id } });
      await tx.eventAttribute.deleteMany({ where: { event_id: id } });
      await tx.event.delete({ where: { id } });
    });
    console.log(`✅ Successfully deleted event ${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting event ${id}:`, error);
    throw new Error(
      `Failed to delete event: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function searchEvents(query: string): Promise<CustomEventType[]> {
  console.log(`Searching events for: "${query}"`);
  try {
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { place: { name: { contains: query, mode: "insensitive" } } },
        ],
      },
      include: {
        attributes: true,
        place: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });
    return events.map(transformEvent);
  } catch (error) {
    console.error("Error searching events:", error);
    throw new Error(
      `Failed to search events: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function getEventDetails(
  id: string
): Promise<CustomEventType | null> {
  console.log(`📖 Reading event details for ID: ${id}`);
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        attributes: true,
        place: { select: { id: true, name: true } },
      },
    });
    return event ? transformEvent(event) : null;
  } catch (error) {
    console.error(`Error fetching event details for ID ${id}:`, error);
    throw new Error(
      `Failed to fetch event details: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
