"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
};

type OrderItem = {
  productId: string;
  title: string;
  quantity: number;
  price: number;
  currency: string;
};

type OrderRecord = {
  id: string;
  createdAt?: { seconds?: number };
  total?: number;
  currency?: string;
  status?: string;
  items?: OrderItem[];
  stripeSessionId?: string;
};

export default function AccountPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const ordersQuery = query(
      collection(db, "users", user.uid, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as OrderRecord),
          id: docSnap.id,
        }));
        setOrders(data);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Your account
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You need to be logged in to view order history.
        </p>
        <Link
          href="/login"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Go to login
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Your orders
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Review your recent purchases.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {getErrorMessage(error)}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading orders...
        </p>
      ) : orders.length ? (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Order #{order.id}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {order.total?.toFixed(2) ?? "0.00"} {order.currency ?? "EUR"}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  {order.status ?? "paid"}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
                {order.items?.length ? (
                  order.items.map((item) => (
                    <div key={item.productId} className="flex justify-between">
                      <span>
                        {item.title} x {item.quantity}
                      </span>
                      <span>
                        {item.price.toFixed(2)} {item.currency}
                      </span>
                    </div>
                  ))
                ) : (
                  <span>No items recorded.</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No orders yet.
        </p>
      )}
    </section>
  );
}
