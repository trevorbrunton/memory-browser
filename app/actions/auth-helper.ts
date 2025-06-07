// app/actions/auth-helper.ts
"use server";

import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function getPrismaUser() {
  const authUser = await currentUser();
  if (!authUser) {
    throw new Error("Not authenticated");
  }
  const user = await prisma.user.findUnique({
    where: { externalId: authUser.id },
  });
  if (!user) {
    throw new Error("User not found in database.");
  }
  return user;
}
