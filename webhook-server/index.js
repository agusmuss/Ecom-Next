import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import fs from "fs";
import admin from "firebase-admin";

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT || "./serviceAccountKey.json";

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in webhook server env.");
}

if (!webhookSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET in webhook server env.");
}

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    `Missing Firebase service account file at ${serviceAccountPath}.`
  );
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

const app = express();
const port = Number(process.env.WEBHOOK_PORT || 4242);

const handleCheckoutCompleted = async (session) => {
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
  });

  const orderRef = db.collection("orders").doc(session.id);
  const userId =
    session.metadata?.userId || session.client_reference_id || null;
  const userEmail =
    session.customer_details?.email || session.customer_email || null;

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(orderRef);
    if (existing.exists) {
      return;
    }

    const orderItems = [];
    for (const item of lineItems.data) {
      const price = item.price;
      const quantity = item.quantity ?? 1;
      const stripePriceId = price?.id;
      if (!stripePriceId) {
        continue;
      }

      const productsQuery = db
        .collection("products")
        .where("stripePriceId", "==", stripePriceId)
        .limit(1);
      const productSnap = await tx.get(productsQuery);
      if (productSnap.empty) {
        continue;
      }

      const productDoc = productSnap.docs[0];
      const productData = productDoc.data();
      const currentStock = Number(productData.stock ?? 0);
      const nextStock = Math.max(0, currentStock - quantity);

      tx.update(productDoc.ref, {
        stock: nextStock,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      orderItems.push({
        productId: productDoc.id,
        title: productData.title ?? price?.product?.name ?? "Product",
        quantity,
        price: (price?.unit_amount ?? 0) / 100,
        currency: (price?.currency ?? "eur").toUpperCase(),
        stripePriceId,
      });
    }

    const totalAmount = (session.amount_total ?? 0) / 100;
    const currency = (session.currency ?? "eur").toUpperCase();

    const orderData = {
      stripeSessionId: session.id,
      userId,
      userEmail,
      items: orderItems,
      total: totalAmount,
      currency,
      status: session.payment_status ?? "paid",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    tx.set(orderRef, orderData);

    if (userId) {
      const userOrderRef = db
        .collection("users")
        .doc(userId)
        .collection("orders")
        .doc(session.id);
      tx.set(userOrderRef, orderData);
    }
  });
};

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Webhook error";
      return res.status(400).send(`Webhook Error: ${message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        await handleCheckoutCompleted(event.data.object);
      }
      res.json({ received: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Webhook handler failed";
      res.status(500).send(message);
    }
  }
);

app.listen(port, () => {
  console.log(`Stripe webhook server running on http://localhost:${port}/webhook`);
});
