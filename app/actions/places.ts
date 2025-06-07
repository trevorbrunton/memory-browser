// app/actions/places.ts
"use server";

import prisma from "@/lib/prisma";
import type {
  Place as PrismaPlace,
  PlaceAttribute as PrismaPlaceAttribute,
} from "@prisma/client";
import type { Place as CustomPlaceType } from "@/types/places";
import { getPrismaUser } from "./auth-helper";

function transformPlace(
  place: PrismaPlace & { attributes?: PrismaPlaceAttribute[] }
): CustomPlaceType {
  return {
    id: place.id,
    name: place.name,
    address: place.address || undefined,
    city: place.city,
    country: place.country,
    type: place.type as CustomPlaceType["type"],
    capacity: place.capacity || undefined,
    rating: place.rating || undefined,
    attributes:
      place.attributes?.map((attr) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    ownerId: place.ownerId,
    createdAt: new Date(place.created_at),
    updatedAt: new Date(place.updated_at),
  };
}

export async function getAllPlaces(): Promise<CustomPlaceType[]> {
  const user = await getPrismaUser();
  const places = await prisma.place.findMany({
    where: { ownerId: user.id },
    include: { attributes: true },
    orderBy: { created_at: "desc" },
  });
  return places.map(transformPlace);
}

export async function getPlaceDetails(
  id: string
): Promise<CustomPlaceType | null> {
  const user = await getPrismaUser();
  const place = await prisma.place.findUnique({
    where: { id: id, ownerId: user.id },
    include: { attributes: true },
  });
  return place ? transformPlace(place) : null;
}

export async function addPlaces(
  placeData: Omit<
    CustomPlaceType,
    "id" | "ownerId" | "createdAt" | "updatedAt"
  >[]
): Promise<CustomPlaceType[]> {
  const user = await getPrismaUser();
  const createdPlaces: CustomPlaceType[] = [];
  for (const data of placeData) {
    const newPlace = await prisma.place.create({
      data: {
        ...data,
        name: data.name.trim(),
        ownerId: user.id,
        attributes: {
          create: data.attributes?.map((attr) => ({
            attribute: attr.attribute,
            value: attr.value,
          })),
        },
      },
      include: { attributes: true },
    });
    createdPlaces.push(transformPlace(newPlace));
  }
  return createdPlaces;
}

export async function updatePlace(
  id: string,
  updates: Partial<
    Omit<CustomPlaceType, "id" | "createdAt" | "updatedAt" | "ownerId">
  >
): Promise<CustomPlaceType | null> {
  const user = await getPrismaUser();
  const placeToUpdate = await prisma.place.findFirst({
    where: { id: id, ownerId: user.id },
  });

  if (!placeToUpdate) {
    throw new Error("Place not found or user does not have permission.");
  }
  const { attributes, ...placeCoreUpdates } = updates;

  const updatedPlace = await prisma.place.update({
    where: { id: id },
    data: {
      ...placeCoreUpdates,
      updated_at: new Date(),
    },
    include: { attributes: true },
  });

  return transformPlace(updatedPlace);
}
export async function deletePlace(id: string): Promise<boolean> {
  const user = await getPrismaUser();
  const placeToDelete = await prisma.place.findFirst({
    where: { id, ownerId: user.id },
  });

  if (!placeToDelete) {
    throw new Error("Place not found or user does not have permission.");
  }

  await prisma.place.delete({ where: { id: id } });
  return true;
}

export async function searchPlaces(query: string): Promise<CustomPlaceType[]> {
  const user = await getPrismaUser();
  const places = await prisma.place.findMany({
    where: {
      ownerId: user.id,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { attributes: true },
    orderBy: { name: "asc" },
  });
  return places.map(transformPlace);
}
