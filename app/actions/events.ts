// app/actions/events.ts
"use server";

import prisma from "@/lib/prisma";
import type {
  Event as PrismaEvent,
  EventAttribute as PrismaEventAttribute,
} from "@prisma/client";
import type { Event as CustomEventType } from "@/types/events";
import { getPrismaUser } from "./auth-helper";

function transformEvent(
  event: PrismaEvent & { attributes?: PrismaEventAttribute[] }
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
    ownerId: event.ownerId,
    createdAt: new Date(event.created_at),
    updatedAt: new Date(event.updated_at),
  };
}

export async function getAllEvents(): Promise<CustomEventType[]> {
  const user = await getPrismaUser();
  try {
    const events = await prisma.event.findMany({
      where: { ownerId: user.id },
      include: { attributes: true },
      orderBy: { date: "desc" },
    });
    return events.map(transformEvent);
  } catch (error) {
    console.error("Error fetching events:", error);
    throw new Error("Failed to fetch events.");
  }
}

export async function getEventDetails(
  id: string
): Promise<CustomEventType | null> {
  const user = await getPrismaUser();
  try {
    const event = await prisma.event.findFirst({
      where: { id, ownerId: user.id },
      include: { attributes: true },
    });
    return event ? transformEvent(event) : null;
  } catch (error) {
    console.error(`Error fetching event details for ID ${id}:`, error);
    throw new Error("Failed to fetch event details.");
  }
}

export async function addEvents(
  eventDataArray: Omit<
    CustomEventType,
    "id" | "ownerId" | "createdAt" | "updatedAt"
  >[]
): Promise<CustomEventType[]> {
  const user = await getPrismaUser();
  const createdEvents: CustomEventType[] = [];
  for (const data of eventDataArray) {
    const eventData: any = {
      title: data.title.trim(),
      description: data.description,
      date: data.date,
      dateType: data.dateType || "exact",
      ownerId: user.id,
      attributes: {
        create: data.attributes?.map((attr) => ({
          attribute: attr.attribute,
          value: attr.value,
        })),
      },
    };
    if (data.placeId) {
      eventData.place = { connect: { id: data.placeId } };
    }
    const newEvent = await prisma.event.create({
      data: eventData,
      include: { attributes: true },
    });
    createdEvents.push(transformEvent(newEvent));
  }
  return createdEvents;
}

export async function updateEvent(
  eventId: string,
  updates: Partial<
    Omit<CustomEventType, "id" | "ownerId" | "createdAt" | "updatedAt">
  >
): Promise<CustomEventType | null> {
  const user = await getPrismaUser();
  const eventToUpdate = await prisma.event.findFirst({
    where: { id: eventId, ownerId: user.id },
    include: { attributes: true },
  });
  if (!eventToUpdate)
    throw new Error("Event not found or user does not have permission.");

  const { attributes, placeId, dateType, ...eventCoreUpdates } = updates;
  const prismaEventUpdateData: any = {
    ...eventCoreUpdates,
    updated_at: new Date(),
  };

  if (dateType) prismaEventUpdateData.type = dateType;

  if (updates.hasOwnProperty("placeId")) {
    prismaEventUpdateData.place = placeId
      ? { connect: { id: placeId } }
      : { disconnect: true };
  }

  if (attributes) {
    await prisma.eventAttribute.deleteMany({
      where: { event_id: eventId },
    });
    prismaEventUpdateData.attributes = {
      create: attributes.map((attr) => ({
        attribute: attr.attribute,
        value: attr.value,
      })),
    };
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: prismaEventUpdateData,
    include: { attributes: true },
  });

  return transformEvent(updatedEvent);
}

export async function deleteEvent(id: string): Promise<boolean> {
  const user = await getPrismaUser();
  const eventToDelete = await prisma.event.findFirst({
    where: { id, ownerId: user.id },
  });
  if (!eventToDelete)
    throw new Error("Event not found or user does not have permission.");

  await prisma.event.delete({ where: { id } });
  return true;
}

export async function searchEvents(query: string): Promise<CustomEventType[]> {
  const user = await getPrismaUser();
  const events = await prisma.event.findMany({
    where: {
      ownerId: user.id,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { attributes: true },
    orderBy: { date: "desc" },
  });
  return events.map(transformEvent);
}
