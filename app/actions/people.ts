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
    dateOfBirth: person.date_of_birth
      ? new Date(person.date_of_birth).toISOString().split("T")[0]
      : undefined,
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

export async function getPersonDetails(
  id: string
): Promise<CustomPersonType | null> {
  const user = await getPrismaUser();
  const person = await prisma.person.findUnique({
    where: { id: id, ownerId: user.id },
    include: { attributes: true },
  });
  return person ? transformPerson(person) : null;
}

export async function addPeople(
  peopleData: Omit<
    CustomPersonType,
    "id" | "createdAt" | "updatedAt" | "ownerId"
  >[]
): Promise<CustomPersonType[]> {
  const user = await getPrismaUser();
  const createdPeople: CustomPersonType[] = [];
  for (const person of peopleData) {
    const newPerson = await prisma.person.create({
      data: {
        name: person.name.trim(),
        ownerId: user.id,
        email: person.email,
        role: person.role,
        photo_url: person.photoUrl,
        date_of_birth: person.dateOfBirth,
        place_of_birth: person.placeOfBirth,
        marital_status: person.maritalStatus,
        spouse_id: person.spouseId,
        childrenIds: person.childrenIds,
        attributes: {
          create: person.attributes?.map((attr) => ({
            attribute: attr.attribute,
            value: attr.value,
          })),
        },
      },
      include: { attributes: true },
    });
    createdPeople.push(transformPerson(newPerson));
  }
  return createdPeople;
}

export async function updatePerson(
  id: string,
  updates: Partial<
    Omit<CustomPersonType, "id" | "createdAt" | "updatedAt" | "ownerId">
  >
): Promise<CustomPersonType | null> {
  const user = await getPrismaUser();
  const personToUpdate = await prisma.person.findFirst({
    where: { id: id, ownerId: user.id },
  });

  if (!personToUpdate) {
    throw new Error("Person not found or user does not have permission.");
  }
  const { attributes, ...personCoreUpdates } = updates;

  const updatedPerson = await prisma.person.update({
    where: { id: id },
    data: {
      ...personCoreUpdates,
      date_of_birth: updates.dateOfBirth
        ? new Date(updates.dateOfBirth).toISOString()
        : undefined,
      updated_at: new Date(),
    },
    include: { attributes: true },
  });

  return transformPerson(updatedPerson);
}

export async function deletePerson(id: string): Promise<boolean> {
  const user = await getPrismaUser();
  const personToDelete = await prisma.person.findFirst({
    where: { id, ownerId: user.id },
  });
  if (!personToDelete) {
    throw new Error("Person not found or user does not have permission.");
  }

  await prisma.person.delete({ where: { id: id } });
  return true;
}

export async function searchPeople(query: string): Promise<CustomPersonType[]> {
  const user = await getPrismaUser();
  const people = await prisma.person.findMany({
    where: {
      ownerId: user.id,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { role: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { attributes: true },
    orderBy: { name: "asc" },
  });
  return people.map(transformPerson);
}
