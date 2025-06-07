import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createCheckoutSession } from "@/lib/stripe";

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
    const userId = auth.id;
    const email = auth.emailAddresses[0].emailAddress;
    console.log("User: ",userId);

    const session = await createCheckoutSession({ userEmail: email, userId });

    console.log("Bling: ",session);
    return new NextResponse(
      JSON.stringify({
        url: session.url,
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
