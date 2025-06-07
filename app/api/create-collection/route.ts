import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";

const createCollectionSchema = z.object({
  collectionName: z.string().min(1, "Collection name is required"),
  collectionDetails: z.string(),
  userEmail: z.string().email(),
  userId: z.string(),
});

export async function POST(request: Request) {
  try {
      const json = await request.json();
      console.log('json', json)
      const body = createCollectionSchema.parse(json);
      console.log('body', body)

    const newCollection = await db.collection.create({
      data: {
        userId: body.userId,
        userEmail: body.userEmail,
        collectionName: body.collectionName,
        collectionDetails: body.collectionDetails,
        users: [],
        createDate: new Date().toISOString(),
        updateDate: new Date().toISOString(),
      },
    });

    // Update the user's collections array
    // await prisma.user.update({
    //   where: { id: body.userId },
    //   data: {
    //     collections: {
    //       push: body.collectionId,
    //     },
    //   },
      // });
      
      //DEVNOTE - SEEMS TO BE A CACHE REFRESH ISSUE !!!!!!!!!!!

    return NextResponse.json(newCollection, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
