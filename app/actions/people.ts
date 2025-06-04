// app/actions/people.ts
"use server";

import prisma from "../../lib/prisma";
import type {
  Person as PrismaPerson,
  PersonAttribute as PrismaPersonAttribute,
} from "@prisma/client";
import type {
  Person as CustomPersonType,
  PersonAttribute as CustomPersonAttributeType,
} from "../../types/people";

function transformPerson(
  person: PrismaPerson & { attributes?: PrismaPersonAttribute[] }
): CustomPersonType {
  return {
    id: person.id,
    name: person.name,
    email: person.email || undefined,
    role: person.role || undefined,
    photoUrl: person.photo_url || undefined,
    dateOfBirth: person.date_of_birth || undefined,
    placeOfBirth: person.place_of_birth || undefined,
    maritalStatus:
      (person.marital_status as CustomPersonType["maritalStatus"]) || undefined,
    spouseId: person.spouse_id || undefined,
    childrenIds: person.childrenIds || [], // Assuming childrenIds is stored as String[]
    attributes:
      person.attributes?.map((attr) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(person.created_at),
    updatedAt: new Date(person.updated_at),
  };
}

export async function getAllPeople(): Promise<CustomPersonType[]> {
  console.log("📖 Reading people with Prisma (MongoDB)...");
  try {
    const people = await prisma.person.findMany({
      include: {
        attributes: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });
    const transformedPeople = people.map(transformPerson);
    console.log(
      `✅ Retrieved ${transformedPeople.length} people with Prisma (MongoDB)`
    );
    return transformedPeople;
  } catch (error) {
    console.error("❌ Error fetching people with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to fetch people: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function addPeople(names: string[]): Promise<CustomPersonType[]> {
  console.log("💾 Adding people with Prisma (MongoDB):", names);
  try {
    const createdPeople: CustomPersonType[] = [];
    for (const name of names) {
      const newPerson = await prisma.person.create({
        data: {
          name: name.trim(),
          email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          role: "New User",
          childrenIds: [], // Initialize as empty
        },
        include: { attributes: true },
      });
      createdPeople.push(transformPerson(newPerson));
    }
    console.log(
      `✅ Successfully added ${createdPeople.length} people with Prisma (MongoDB)`
    );
    return createdPeople;
  } catch (error) {
    console.error("❌ Error adding people with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to add people: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function updatePerson(
  id: string,
  updates: Partial<Omit<CustomPersonType, "id" | "createdAt">>
): Promise<CustomPersonType | null> {
  console.log(`🔄 Updating person ${id} with Prisma (MongoDB):`, updates);
  try {
    const {
      attributes,
      photoUrl,
      dateOfBirth,
      placeOfBirth,
      maritalStatus,
      spouseId,
      childrenIds,
      ...personUpdates
    } = updates;

    const dataToUpdate: any = {
      ...personUpdates,
      photo_url: photoUrl,
      date_of_birth: dateOfBirth,
      place_of_birth: placeOfBirth,
      marital_status: maritalStatus,
      spouse_id: spouseId,
      childrenIds: childrenIds, // Direct update if it's just a String array
    };
    Object.keys(dataToUpdate).forEach(
      (key) => dataToUpdate[key] === undefined && delete dataToUpdate[key]
    );

    const updatedPerson = await prisma.$transaction(async (tx) => {
      const person = await tx.person.update({
        where: { id },
        data: dataToUpdate,
        include: { attributes: true },
      });

      if (attributes) {
        await tx.personAttribute.deleteMany({ where: { person_id: id } });
        if (attributes.length > 0) {
          await tx.personAttribute.createMany({
            data: attributes.map((attr) => ({
              person_id: id,
              attribute: attr.attribute,
              value: attr.value,
            })),
          });
        }
      }
      return tx.person.findUnique({
        where: { id },
        include: { attributes: true },
      });
    });

    if (!updatedPerson) return null;

    const transformedPerson = transformPerson(updatedPerson);
    console.log(`✅ Successfully updated person ${id} with Prisma (MongoDB)`);
    return transformedPerson;
  } catch (error) {
    console.error("❌ Error updating person with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to update person: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function deletePerson(id: string): Promise<boolean> {
  console.log(`🗑️ Deleting person ${id} with Prisma (MongoDB)...`);
  try {
    // Cascading deletes for PersonAttribute and MemoryPerson should be handled by Prisma if schema is set up.
    // Spouse_id references would need manual clearing or schema adjustment for onDelete.
    // Manually clear spouse_id from other persons referencing this one
    await prisma.person.updateMany({
      where: { spouse_id: id },
      data: { spouse_id: null },
    });
    // Manually remove this person's ID from any childrenIds arrays (more complex, often handled at application layer or by denormalizing)

    await prisma.person.delete({
      where: { id },
    });
    console.log(`✅ Successfully deleted person ${id} with Prisma (MongoDB)`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting person with Prisma (MongoDB):", error);
    return false;
  }
}

export async function searchPeople(query: string): Promise<CustomPersonType[]> {
  console.log(`🔍 Searching people for: "${query}" with Prisma (MongoDB)`);
  try {
    const people = await prisma.person.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      include: { attributes: true },
      orderBy: { created_at: "desc" },
    });
    const transformedPeople = people.map(transformPerson);
    console.log(
      `✅ Found ${transformedPeople.length} people matching "${query}" with Prisma (MongoDB)`
    );
    return transformedPeople;
  } catch (error) {
    console.error("❌ Error searching people with Prisma (MongoDB):", error);
    throw new Error(
      `Failed to search people: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function getPersonDetails(
  id: string
): Promise<CustomPersonType | null> {
  console.log(`📖 Reading person details for ID: ${id} with Prisma (MongoDB)`);
  try {
    const person = await prisma.person.findUnique({
      where: { id },
      include: { attributes: true },
    });

    if (!person) {
      console.log(`❌ Person with ID ${id} not found with Prisma (MongoDB).`);
      return null;
    }
    const transformedPerson = transformPerson(person);
    console.log(
      `✅ Retrieved person details for: ${transformedPerson.name} with Prisma (MongoDB)`
    );
    return transformedPerson;
  } catch (error) {
    console.error(
      "❌ Error fetching person details with Prisma (MongoDB):",
      error
    );
    return null;
  }
}
