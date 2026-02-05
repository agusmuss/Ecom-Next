"use client";

import { useMemo, useState } from "react";
import { useCart } from "../../context/CartContext";


const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
};

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const [error, setError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [items]
  );

  const handleCheckout = async () => {
    setError("");

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            stripePriceId: item.stripePriceId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Checkout failed. Please try again.");
      }

      const data = (await response.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (checkoutError) {
      setError(getErrorMessage(checkoutError));
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Cart
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Review your items and proceed to checkout.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {items.length ? (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : null}
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {item.price} {item.currency}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuantity(item.productId, Number(event.target.value))
                  }
                  className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-400 hover:text-red-700 dark:border-red-700 dark:text-red-400"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your cart is empty.
        </p>
      )}

      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Total
          </p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {total.toFixed(2)} EUR
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={clearCart}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
          >
            Clear cart
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {isCheckingOut ? "Redirecting..." : "Checkout"}
          </button>
        </div>
      </div>
    </section>
  );
}
