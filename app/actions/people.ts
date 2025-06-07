// app/actions/people.ts
"use server";

import prisma from "@/lib/prisma";
import type {
  Person as PrismaPerson,
  PersonAttribute as PrismaPersonAttribute,
} from "@prisma/client";
import type { Person as CustomPersonType } from "@/types/people";
import { getPrismaUser } from "./auth-helper";

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
    childrenIds: person.childrenIds || [],
    attributes:
      person.attributes?.map((attr) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    ownerId: person.ownerId,
    createdAt: new Date(person.created_at),
    updatedAt: new Date(person.updated_at),
  };
}

export async function getAllPeople(): Promise<CustomPersonType[]> {
  const user = await getPrismaUser();
  const people = await prisma.person.findMany({
    where: { ownerId: user.id },
    include: { attributes: true },
    orderBy: { created_at: "desc" },
  });
  return people.map(transformPerson);
}

export async function addPeople(names: string[]): Promise<CustomPersonType[]> {
  const user = await getPrismaUser();
  const createdPeople: CustomPersonType[] = [];
  for (const name of names) {
    const newPerson = await prisma.person.create({
      data: {
        name: name.trim(),
        ownerId: user.id,
        childrenIds: [],
      },
      include: { attributes: true },
    });
    createdPeople.push(transformPerson(newPerson));
  }
  return createdPeople;
}

// ... other actions would be similarly updated to check for ownership ...
