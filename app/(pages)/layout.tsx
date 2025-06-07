import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

/**
 * This layout wraps all pages inside the (pages) route group.
 * It ensures that any authenticated user has a corresponding record
 * in the local database before they can access any page.
 */
export default async function PagesLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 1. Get the authenticated user from Clerk
  const authUser = await currentUser();

  // If there's no user, they should be redirected to sign-in by the middleware.
  // This is a fallback for safety.
  if (!authUser) {
    redirect("/sign-in");
  }

  // 2. Check if the user exists in the local database
  const userInDb = await prisma.user.findUnique({
    where: { externalId: authUser.id },
  });

  // 3. If the user does not exist in the DB, create them now.
  if (!userInDb) {
    try {
      // Create the user record
      const newUser = await prisma.user.create({
        data: {
          externalId: authUser.id,
          email: authUser.emailAddresses[0].emailAddress,
          quotaLimit: 100, // Set a default quota
          // The defaultCollectionId will be set in the next step
        },
      });

      // Create a default collection for the new user
      const newCollection = await prisma.collection.create({
        data: {
          collectionName: "Recent Uploads",
          collectionDetails: "A collection of your most recent uploads",
          userEmail: newUser.email,
          createDate: new Date(),
          updateDate: new Date(),
          owner: {
            connect: { id: newUser.id },
          },
        },
      });

      // Link the default collection to the new user
      await prisma.user.update({
        where: { id: newUser.id },
        data: {
          defaultCollectionId: newCollection.id,
        },
      });
    } catch (error) {
      console.error(
        "Failed to create user and default collection in DB:",
        error
      );
      // Handle the error appropriately. You might want to redirect
      // to an error page or show a message.
      // For now, we'll prevent the app from loading to avoid further errors.
      throw new Error(
        "Could not synchronize user with the database. Please try again later."
      );
    }
  }

  // 4. Now that the user is guaranteed to exist in the DB, render the page.
  return <>{children}</>;
}
