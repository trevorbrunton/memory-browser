// app/actions/events.ts
"use server";

import prisma from "@/lib/prisma";
import type {
  Event as PrismaEvent,
  EventAttribute as PrismaEventAttribute,
} from "@prisma/client";
import type {
  Event as CustomEventType,
  EventAttribute as CustomEventAttributeType,
} from "@/types/events";

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
    dateType: event.type as CustomEventType["dateType"],
    placeId: event.place_id || undefined,

    attributes:
      event.attributes?.map((attr) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(event.created_at),
    updatedAt: new Date(event.updated_at),
    // If you need place name directly, ensure it's included in the query and added here
    // location: event.place?.name // Example if place is included
  };
}

export async function getAllEvents(): Promise<CustomEventType[]> {
  console.log("📅 Reading events with Prisma (MongoDB)...");
  try {
    const events = await prisma.event.findMany({
      include: {
        attributes: true,
        place: { select: { id: true, name: true } }, // Include place name
      },
      orderBy: {
        date: "desc",
      },
    });
    const transformedEvents = events.map(transformEvent);
    console.log(
      `✅ Retrieved ${transformedEvents.length} events with Prisma (MongoDB)`
    );
    return transformedEvents;
  } catch (error) {
    console.error("❌ Error fetching events with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to fetch events: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function addEvents(
  eventData: {
    title: string;
    description?: string;
    date: Date;
    placeId?: string;

  }[]
): Promise<CustomEventType[]> {
  console.log(
    "💾 Adding events with Prisma (MongoDB):",
    eventData.map((e) => e.title)
  );
  try {
    const createdEvents: CustomEventType[] = [];
    for (const data of eventData) {
      const newEvent = await prisma.event.create({
        data: {
          title: data.title.trim(),
          description: data.description,
          date: data.date,
          type: "DEFAULT", // <-- Replace "DEFAULT" with the appropriate default or value from data
          ...(data.placeId ? { place: { connect: { id: data.placeId } } } : {}),
        },
        include: {
          attributes: true,
          place: { select: { id: true, name: true } },
        },
      });
      createdEvents.push(transformEvent(newEvent));
    }
    console.log(
      `✅ Successfully added ${createdEvents.length} events with Prisma (MongoDB)`
    );
    return createdEvents;
  } catch (error) {
    console.error("❌ Error adding events with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to add events: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function updateEvent(
  id: string,
  updates: Partial<Omit<CustomEventType, "id" | "createdAt">>
): Promise<CustomEventType | null> {
  console.log(`🔄 Updating event ${id} with Prisma (MongoDB):`, updates);
  try {
    const { attributes, placeId, ...eventUpdates } = updates;

    const dataToUpdate: any = {
      ...eventUpdates,
      date: eventUpdates.date ? new Date(eventUpdates.date) : undefined,
      // place_id handling
      ...(placeId === null // Explicitly setting to null (disconnect)
        ? { place: { disconnect: true } }
        : placeId // If a string ID is provided
        ? { place: { connect: { id: placeId } } }
        : {}), // If placeId is undefined, do nothing with the relation
    };

    // Remove undefined keys so Prisma doesn't try to set them to null if not intended
    Object.keys(dataToUpdate).forEach(
      (key) => dataToUpdate[key] === undefined && delete dataToUpdate[key]
    );

    const updatedEvent = await prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id },
        data: dataToUpdate,
        include: {
          attributes: true,
          place: { select: { id: true, name: true } },
        },
      });

      if (attributes) {
        await tx.eventAttribute.deleteMany({ where: { event_id: id } });
        if (attributes.length > 0) {
          await tx.eventAttribute.createMany({
            data: attributes.map((attr) => ({
              event_id: id,
              attribute: attr.attribute,
              value: attr.value,
            })),
          });
        }
      }
      // Re-fetch to ensure attributes are correctly populated after createMany
      return tx.event.findUnique({
        where: { id },
        include: {
          attributes: true,
          place: { select: { id: true, name: true } },
        },
      });
    });

    if (!updatedEvent) return null;

    const transformedEvent = transformEvent(updatedEvent);
    console.log(`✅ Successfully updated event ${id} with Prisma (MongoDB)`);
    return transformedEvent;
  } catch (error) {
    console.error("❌ Error updating event with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to update event: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  console.log(`🗑️ Deleting event ${id} with Prisma (MongoDB)...`);
  try {
    // Prisma will handle cascading deletes or setting nulls based on schema relations
    // For example, if MemoryEvent has onDelete: Cascade for its event relation
    await prisma.event.delete({
      where: { id },
    });
    console.log(`✅ Successfully deleted event ${id} with Prisma (MongoDB)`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting event with Prisma (MongoDB):", error);
    return false;
  }
}

export async function searchEvents(query: string): Promise<CustomEventType[]> {
  console.log(`🔍 Searching events for: "${query}" with Prisma (MongoDB)`);
  try {
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          // Searching by place name would require a more complex query or denormalization
        ],
      },
      include: {
        attributes: true,
        place: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });
    const transformedEvents = events.map(transformEvent);
    console.log(
      `✅ Found ${transformedEvents.length} events matching "${query}" with Prisma (MongoDB)`
    );
    return transformedEvents;
  } catch (error) {
    console.error("❌ Error searching events with Prisma (MongoDB):", error);
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
  console.log(`📖 Reading event details for ID: ${id} with Prisma (MongoDB)`);
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        attributes: true,
        place: { select: { id: true, name: true } },
      },
    });

    if (!event) {
      console.log(`❌ Event with ID ${id} not found with Prisma (MongoDB).`);
      return null;
    }
    const transformedEvent = transformEvent(event);
    console.log(
      `✅ Retrieved event details for: ${transformedEvent.title} with Prisma (MongoDB)`
    );
    return transformedEvent;
  } catch (error) {
    console.error(
      "❌ Error fetching event details with Prisma (MongoDB):",
      error
    );
    return null;
  }
}
