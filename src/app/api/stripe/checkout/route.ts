import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

type CheckoutItem = {
  stripePriceId: string;
  quantity: number;
};

export async function POST(request: Request) {
  const body = await request.json();
  const items: CheckoutItem[] = Array.isArray(body?.items) ? body.items : [];

  if (!items.length) {
    return NextResponse.json(
      { error: "No items provided." },
      { status: 400 }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: items.map((item) => ({
      price: item.stripePriceId,
      quantity: item.quantity,
    })),
    success_url: `${appUrl}/cart?success=true`,
    cancel_url: `${appUrl}/cart?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
