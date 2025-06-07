import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function GET() {
  try {
    const auth = await currentUser();
    if (!auth) {
      return new NextResponse(
        JSON.stringify({
          error: "User not authenticated",
        }),
        { status: 401 }
      );
    }
      const user = await db.user.findFirst({
        where: { externalId: auth.id },
      });

    return new NextResponse(
      JSON.stringify({
        plan: user?.plan,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new NextResponse(
      JSON.stringify({
        error: "An error occurred while attempting to create checkout session",
      }),
      { status: 500 }
    );
  }
}
