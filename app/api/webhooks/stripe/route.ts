import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");
  console.log("Webhook received");
  const event = stripe.webhooks.constructEvent(
    body,
    signature ?? "",
    process.env.STRIPE_WEBHOOK_SECRET ?? ""
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const { userId } = session.metadata || { userId: null };

    if (!userId) {
      return new Response("Invalid metadata", { status: 400 });
    }
    console.log("webhook received");
    await db.user.update({
      where: { externalId: userId },
      data: { plan: "PRO" },
    });
    console.log("webhook processed");
  }
  console.log("webhook processed");
  return new Response("OK");
}
