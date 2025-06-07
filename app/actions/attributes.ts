// app/actions/attributes.ts
"use server";

import prisma from "@/lib/prisma";
import type { Attribute as PrismaAttribute } from "@prisma/client";
import type { Attribute as CustomAttributeType } from "@/types/attributes";
import { getPrismaUser } from "./auth-helper";

function transformAttribute(attr: PrismaAttribute): CustomAttributeType {
  return {
    id: attr.id,
    name: attr.name,
    category: attr.category || undefined,
    description: attr.description || undefined,
    entityType: attr.entity_type as CustomAttributeType["entityType"],
    ownerId: attr.ownerId,
    createdAt: new Date(attr.created_at),
    updatedAt: new Date(attr.updated_at),
  };
}

export async function getAllAttributes(): Promise<CustomAttributeType[]> {
  const user = await getPrismaUser();
  try {
    const attributes = await prisma.attribute.findMany({
      where: { ownerId: user.id },
      orderBy: [{ entity_type: "asc" }, { category: "asc" }, { name: "asc" }],
    });
    return attributes.map(transformAttribute);
  } catch (error) {
    console.error("❌ Error fetching attributes:", error);
    throw new Error("Failed to fetch attributes.");
  }
}

export async function getAttributesByEntityType(
  entityType: "person" | "event" | "place"
): Promise<CustomAttributeType[]> {
  const user = await getPrismaUser();
  try {
    const attributes = await prisma.attribute.findMany({
      where: {
        ownerId: user.id,
        entity_type: {
          in: [entityType, "all"],
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return attributes.map(transformAttribute);
  } catch (error) {
    console.error("❌ Error fetching attributes by entity type:", error);
    throw new Error(`Failed to fetch ${entityType} attributes.`);
  }
}

export async function addAttribute(
  name: string,
  category?: string,
  entityType: "person" | "event" | "place" | "all" = "all"
): Promise<CustomAttributeType> {
  const user = await getPrismaUser();
  try {
    const newAttribute = await prisma.attribute.create({
      data: {
        name: name.trim(),
        category: category || "Custom",
        description: `Custom attribute: ${name}`,
        entity_type: entityType,
        ownerId: user.id,
      },
    });
    return transformAttribute(newAttribute);
  } catch (error) {
    console.error("❌ Error adding attribute:", error);
    throw new Error("Failed to add attribute.");
  }
}

export async function searchAttributes(
  query: string,
  entityType?: "person" | "event" | "place"
): Promise<CustomAttributeType[]> {
  const user = await getPrismaUser();
  try {
    const whereCondition: any = {
      ownerId: user.id,
      name: {
        contains: query,
        mode: "insensitive",
      },
    };

    if (entityType) {
      whereCondition.entity_type = {
        in: [entityType, "all"],
      };
    }

    const attributes = await prisma.attribute.findMany({
      where: whereCondition,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return attributes.map(transformAttribute);
  } catch (error) {
    console.error("❌ Error searching attributes:", error);
    throw new Error("Failed to search attributes.");
  }
}
