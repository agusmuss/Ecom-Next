"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useCart } from "../../context/CartContext";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
};

type ProductRecord = {
  id: string;
  title: string;
  description?: string;
  price?: { amount?: number; currency?: string };
  image?: string;
  images?: string[];
  stripePriceId?: string;
  draft?: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addItem } = useCart();

  useEffect(() => {
    const productsQuery = query(
      collection(db, "products"),
      where("draft", "==", false)
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const payload = docSnap.data() as ProductRecord;
          return {
            ...payload,
            id: docSnap.id,
          };
        });
        setProducts(data);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAddToCart = (product: ProductRecord) => {
    if (!product.stripePriceId) {
      setError("This product is missing Stripe price data.");
      return;
    }

    addItem({
      productId: product.id,
      title: product.title,
      price: product.price?.amount ?? 0,
      currency: product.price?.currency ?? "EUR",
      quantity: 1,
      stripePriceId: product.stripePriceId,
      image: product.image || product.images?.[0],
    });
  };

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Products
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Browse the catalog and add items to your cart.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading products...
        </p>
      ) : products.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="flex flex-col gap-4">
                {product.image || product.images?.[0] ? (
                  <img
                    src={product.image || product.images?.[0]}
                    alt={product.title}
                    className="h-48 w-full rounded-xl object-cover"
                  />
                ) : null}
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {product.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {product.description || "No description yet."}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>
                    {product.price?.amount ?? 0} {product.price?.currency ?? "EUR"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No products available yet.
        </p>
      )}
    </section>
  );
}
