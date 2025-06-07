import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const createCollectionSchema = z.object({
  collectionName: z.string().min(1, "Collection name is required"),
  collectionDetails: z.string(),
  userEmail: z.string().email(),
  userId: z.string(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    console.log("json", json);
    const body = createCollectionSchema.parse(json);
    console.log("body", body);

    const newCollection = await prisma.collection.create({
      data: {
        userEmail: body.userEmail,
        collectionName: body.collectionName,
        collectionDetails: body.collectionDetails,
        users: [],
        createDate: new Date().toISOString(),
        updateDate: new Date().toISOString(),
        owner: {
          connect: { id: body.userId }
        }
      },
    });

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
