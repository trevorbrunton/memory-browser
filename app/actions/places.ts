// app/actions/places.ts
"use server";

import prisma from "@/lib/prisma";
import type {
  Place as PrismaPlace,
  PlaceAttribute as PrismaPlaceAttribute,
} from "@prisma/client";
import type {
  Place as CustomPlaceType,
  PlaceAttribute as CustomPlaceAttributeType,
} from "@/types/places";

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
    createdAt: new Date(place.created_at),
    updatedAt: new Date(place.updated_at),
  };
}

export async function getAllPlaces(): Promise<CustomPlaceType[]> {
  console.log("🏢 Reading places with Prisma (MongoDB)...");
  try {
    const places = await prisma.place.findMany({
      include: {
        attributes: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });
    const transformedPlaces = places.map(transformPlace);
    console.log(
      `✅ Retrieved ${transformedPlaces.length} places with Prisma (MongoDB)`
    );
    return transformedPlaces;
  } catch (error) {
    console.error("❌ Error fetching places with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to fetch places: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function addPlaces(
  placeData: {
    name: string;
    address?: string;
    city: string;
    country: string;
    type: CustomPlaceType["type"];
  }[]
): Promise<CustomPlaceType[]> {
  console.log(
    "💾 Adding places with Prisma (MongoDB):",
    placeData.map((p) => p.name)
  );
  try {
    const createdPlaces: CustomPlaceType[] = [];
    for (const data of placeData) {
      const newPlace = await prisma.place.create({
        data: {
          name: data.name.trim(),
          address: data.address || "Address TBD",
          city: data.city,
          country: data.country,
          type: data.type,
          capacity: 50, // Default
          rating: 4.0, // Default
        },
        include: { attributes: true },
      });
      createdPlaces.push(transformPlace(newPlace));
    }
    console.log(
      `✅ Successfully added ${createdPlaces.length} places with Prisma (MongoDB)`
    );
    return createdPlaces;
  } catch (error) {
    console.error("❌ Error adding places with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to add places: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function updatePlace(
  id: string,
  updates: Partial<Omit<CustomPlaceType, "id" | "createdAt">>
): Promise<CustomPlaceType | null> {
  console.log(`🔄 Updating place ${id} with Prisma (MongoDB):`, updates);
  try {
    const { attributes, ...placeUpdates } = updates;

    const updatedPlace = await prisma.$transaction(async (tx) => {
      const place = await tx.place.update({
        where: { id },
        data: {
          ...placeUpdates,
        },
        include: { attributes: true },
      });

      if (attributes) {
        await tx.placeAttribute.deleteMany({ where: { place_id: id } });
        if (attributes.length > 0) {
          await tx.placeAttribute.createMany({
            data: attributes.map((attr) => ({
              place_id: id,
              attribute: attr.attribute,
              value: attr.value,
            })),
          });
        }
      }
      return tx.place.findUnique({
        where: { id },
        include: { attributes: true },
      });
    });

    if (!updatedPlace) return null;

    const transformedPlace = transformPlace(updatedPlace);
    console.log(`✅ Successfully updated place ${id} with Prisma (MongoDB)`);
    return transformedPlace;
  } catch (error) {
    console.error("❌ Error updating place with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to update place: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function deletePlace(id: string): Promise<boolean> {
  console.log(`🗑️ Deleting place ${id} with Prisma (MongoDB)...`);
  try {
    // Prisma relations (onDelete: SetNull for Event.place_id, etc.) should handle this.
    await prisma.place.delete({
      where: { id },
    });
    console.log(`✅ Successfully deleted place ${id} with Prisma (MongoDB)`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting place with Prisma (MongoDB):", error);
    return false;
  }
}

export async function searchPlaces(query: string): Promise<CustomPlaceType[]> {
  console.log(`🔍 Searching places for: "${query}" with Prisma (MongoDB)`);
  try {
    const places = await prisma.place.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { attributes: true },
      orderBy: { created_at: "desc" },
    });
    const transformedPlaces = places.map(transformPlace);
    console.log(
      `✅ Found ${transformedPlaces.length} places matching "${query}" with Prisma (MongoDB)`
    );
    return transformedPlaces;
  } catch (error) {
    console.error("❌ Error searching places with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to search places: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function getPlaceDetails(
  id: string
): Promise<CustomPlaceType | null> {
  console.log(`📖 Reading place details for ID: ${id} with Prisma (MongoDB)`);
  try {
    const place = await prisma.place.findUnique({
      where: { id },
      include: { attributes: true },
    });

    if (!place) {
      console.log(`❌ Place with ID ${id} not found with Prisma (MongoDB).`);
      return null;
    }
    const transformedPlace = transformPlace(place);
    console.log(
      `✅ Retrieved place details for: ${transformedPlace.name} with Prisma (MongoDB)`
    );
    return transformedPlace;
  } catch (error) {
    console.error(
      "❌ Error fetching place details with Prisma (MongoDB):",
      error
    );
    return null;
  }
}
