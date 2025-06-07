import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const auth = await currentUser();
    if (!auth) {
      return new NextResponse(
        JSON.stringify({
          isSynced: false,
        }),
        { status: 200 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { externalId: auth.id },
    });

    console.log("USER IN DB:", user);

    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          externalId: auth.id,
          email: auth.emailAddresses[0].emailAddress,
          defaultCollectionId: "",
          quotaLimit: 100,
          collections: [],
        },
      });

      const newCollection = await prisma.collection.create({
        data: {
          collectionName: "Recent Uploads",
          collectionDetails: "A collection of your most recent uploads",
          userId: newUser.id,
          userEmail: newUser.email,
          users: [],
          memories: [],
          createDate: new Date().toISOString(),
          updateDate: new Date().toISOString(),
        },
      });

      await prisma.user.update({
        where: { id: newUser.id },
        data: {
          defaultCollectionId: newCollection.id,
        },
      });
    }

    return new NextResponse(
      JSON.stringify({
        isSynced: true,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new NextResponse(
      JSON.stringify({
        error: "An error occurred while attempting to create user record",
      }),
      { status: 500 }
    );
  }
}
