import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

export async function POST(request: Request) {
  const body = await request.json();
  const {
    title,
    description,
    price,
    currency = "EUR",
    image,
  } = body ?? {};

  const normalizedDescription =
    typeof description === "string" && description.trim()
      ? description.trim()
      : undefined;

  if (!title || typeof price !== "number") {
    return NextResponse.json(
      { error: "Missing required product fields." },
      { status: 400 }
    );
  }

  const product = await stripe.products.create({
    name: title,
    description: normalizedDescription,
    images: image ? [image] : undefined,
  });

  const stripePrice = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(price * 100),
    currency: currency.toLowerCase(),
  });

  return NextResponse.json({
    stripeProductId: product.id,
    stripePriceId: stripePrice.id,
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const {
    stripeProductId,
    title,
    description,
    price,
    currency = "EUR",
    image,
  } = body ?? {};

  const normalizedDescription =
    typeof description === "string" && description.trim()
      ? description.trim()
      : undefined;

  if (!stripeProductId) {
    return NextResponse.json(
      { error: "Missing stripeProductId." },
      { status: 400 }
    );
  }

  const updatedProduct = await stripe.products.update(stripeProductId, {
    name: title ?? undefined,
    description: normalizedDescription,
    images: image ? [image] : undefined,
  });

  let stripePriceId: string | null = null;
  if (typeof price === "number") {
    const stripePrice = await stripe.prices.create({
      product: updatedProduct.id,
      unit_amount: Math.round(price * 100),
      currency: currency.toLowerCase(),
    });
    stripePriceId = stripePrice.id;
  }

  return NextResponse.json({
    stripeProductId: updatedProduct.id,
    stripePriceId,
  });
}
