// app/actions/attributes.ts
"use server";

import prisma from "@/lib/prisma";
import type { Attribute as PrismaAttribute } from "@prisma/client";
import type { Attribute as CustomAttributeType } from "@/types/attributes";

function transformAttribute(attr: PrismaAttribute): CustomAttributeType {
  return {
    id: attr.id,
    name: attr.name,
    category: attr.category || undefined,
    description: attr.description || undefined,
    entityType: attr.entity_type as CustomAttributeType["entityType"],
    createdAt: new Date(attr.created_at),
    updatedAt: new Date(attr.updated_at),
  };
}

export async function getAllAttributes(): Promise<CustomAttributeType[]> {
  console.log("📖 Reading attributes with Prisma (MongoDB)...");
  try {
    const attributes = await prisma.attribute.findMany({
      orderBy: [{ entity_type: "asc" }, { category: "asc" }, { name: "asc" }],
    });
    const transformedAttributes = attributes.map(transformAttribute);
    console.log(
      `✅ Retrieved ${transformedAttributes.length} attributes with Prisma (MongoDB)`
    );
    return transformedAttributes;
  } catch (error) {
    console.error("❌ Error fetching attributes with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to fetch attributes: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function getAttributesByEntityType(
  entityType: "person" | "event" | "place"
): Promise<CustomAttributeType[]> {
  console.log(`📖 Reading ${entityType} attributes with Prisma (MongoDB)...`);
  try {
    const attributes = await prisma.attribute.findMany({
      where: {
        entity_type: {
          in: [entityType, "all"],
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    const transformedAttributes = attributes.map(transformAttribute);
    console.log(
      `✅ Retrieved ${transformedAttributes.length} ${entityType} attributes with Prisma (MongoDB)`
    );
    return transformedAttributes;
  } catch (error) {
    console.error(
      "❌ Error fetching attributes by entity type with Prisma (MongoDB):",
      error
    );
    throw new Error(
      `Failed to fetch ${entityType} attributes: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function addAttribute(
  name: string,
  category?: string,
  entityType: "person" | "event" | "place" | "all" = "all"
): Promise<CustomAttributeType> {
  console.log("💾 Adding attribute with Prisma (MongoDB):", name);
  try {
    const newAttribute = await prisma.attribute.create({
      data: {
        name: name.trim(),
        category: category || "Custom",
        description: `Custom attribute: ${name}`,
        entity_type: entityType,
      },
    });
    const transformedAttribute = transformAttribute(newAttribute);
    console.log(
      `✅ Successfully added ${entityType} attribute with Prisma (MongoDB): ${transformedAttribute.name}`
    );
    return transformedAttribute;
  } catch (error) {
    console.error("❌ Error adding attribute with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to add attribute: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function searchAttributes(
  query: string,
  entityType?: "person" | "event" | "place"
): Promise<CustomAttributeType[]> {
  console.log(
    `🔍 Searching attributes for: "${query}" (entity: ${
      entityType || "all"
    }) with Prisma (MongoDB)`
  );
  try {
    const whereCondition: any = {
      name: {
        // For MongoDB, Prisma uses $regex for contains, which can be less performant than text indexes for large datasets.
        // For true text search, ensure a text index is created on 'name' in MongoDB.
        // Then you might use: { $text: { $search: query } } via $runCommandRaw or await a Prisma feature.
        // For simplicity with Prisma Client directly:
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
    const transformedAttributes = attributes.map(transformAttribute);
    console.log(
      `✅ Found ${transformedAttributes.length} attributes matching "${query}" with Prisma (MongoDB)`
    );
    return transformedAttributes;
  } catch (error) {
    console.error(
      "❌ Error searching attributes with Prisma (MongoDB):",
      error
    );
    throw new Error(
      `Failed to search attributes: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
