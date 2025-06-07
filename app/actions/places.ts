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

export async function addPlaces(
  placeData: Omit<
    CustomPlaceType,
    "id" | "ownerId" | "createdAt" | "updatedAt" | "attributes"
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
      },
      include: { attributes: true },
    });
    createdPlaces.push(transformPlace(newPlace));
  }
  return createdPlaces;
}

// ... other actions would be similarly updated to check for ownership ...
