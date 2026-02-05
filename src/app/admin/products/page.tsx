"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import Link from "next/link";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";

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
  brand?: string;
  serialNumber?: string;
  price?: { amount?: number; currency?: string };
  taxRate?: number;
  image?: string;
  images?: string[];
  category?: string;
  stock?: number;
  draft?: boolean;
  stripeProductId?: string;
  stripePriceId?: string;
};

const createStripeProduct = async (product: ProductRecord) => {
  const response = await fetch("/api/stripe/product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: product.title,
      description: product.description ?? "",
      price: product.price?.amount ?? 0,
      currency: product.price?.currency ?? "EUR",
      image: product.image || product.images?.[0],
    }),
  });

  if (!response.ok) {
    throw new Error("Stripe product creation failed.");
  }

  return (await response.json()) as {
    stripeProductId: string;
    stripePriceId: string;
  };
};

const updateStripeProduct = async (payload: {
  stripeProductId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
}) => {
  const response = await fetch("/api/stripe/product", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Stripe product update failed.");
  }

  return (await response.json()) as {
    stripeProductId: string;
    stripePriceId?: string | null;
  };
};

export default function AdminProductsPage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "Admin" || profile?.role === "SuperAdmin";

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    title: "",
    category: "",
    price: "",
    stock: "",
    draft: false,
    description: "",
  });

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const productsQuery = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
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
  }, [isAdmin]);

  const handleEditStart = (product: ProductRecord) => {
    setEditingId(product.id);
    setEditValues({
      title: product.title ?? "",
      category: product.category ?? "",
      price: product.price?.amount?.toString() ?? "",
      stock: product.stock?.toString() ?? "",
      draft: Boolean(product.draft),
      description: product.description ?? "",
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleStripeSync = async (product: ProductRecord) => {
    setError("");

    try {
      const stripeInfo = await createStripeProduct(product);
      await updateDoc(doc(db, "products", product.id), {
        stripeProductId: stripeInfo.stripeProductId,
        stripePriceId: stripeInfo.stripePriceId,
        updatedAt: serverTimestamp(),
      });
    } catch (syncError) {
      setError(getErrorMessage(syncError));
    }
  };

  const handleEditSave = async (product: ProductRecord) => {
    setError("");

    if (!editValues.title || !editValues.category) {
      setError("Title and category are required.");
      return;
    }

    try {
      const nextPrice = Number(editValues.price || 0);
      const currency = product.price?.currency ?? "EUR";

      let stripeProductId = product.stripeProductId;
      let stripePriceId = product.stripePriceId;

      if (!stripeProductId || !stripePriceId) {
        const stripeInfo = await createStripeProduct({
          ...product,
          title: editValues.title,
          description: editValues.description,
          price: { amount: nextPrice, currency },
        });
        stripeProductId = stripeInfo.stripeProductId;
        stripePriceId = stripeInfo.stripePriceId;
      } else {
        const stripeInfo = await updateStripeProduct({
          stripeProductId,
          title: editValues.title,
          description: editValues.description,
          price: nextPrice,
          currency,
          image: product.image || product.images?.[0],
        });
        if (stripeInfo.stripePriceId) {
          stripePriceId = stripeInfo.stripePriceId;
        }
      }

      await updateDoc(doc(db, "products", product.id), {
        title: editValues.title.trim(),
        category: editValues.category.trim(),
        price: {
          amount: nextPrice,
          currency,
        },
        stock: Number(editValues.stock || 0),
        draft: editValues.draft,
        description: editValues.description.trim(),
        stripeProductId,
        stripePriceId,
        updatedAt: serverTimestamp(),
      });
      setEditingId(null);
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    }
  };

  const deleteImages = async (urls: string[]) => {
    if (!urls.length) {
      return;
    }

    const response = await fetch("/api/blob", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete images from blob storage.");
    }
  };

  const handleDelete = async (product: ProductRecord) => {
    const confirmed = window.confirm(
      "Delete this product? Associated images will also be removed."
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "products", product.id));
      const imageUrls = product.images?.length
        ? product.images
        : product.image
          ? [product.image]
          : [];
      await deleteImages(imageUrls);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  };

  if (!user) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Admin products
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You must be logged in to view this page.
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

  if (!isAdmin) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Admin products
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You do not have permission to view this page.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            Admin products
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Manage products, update details, or remove items from the catalog.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Create new product
        </Link>
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
        <div className="grid gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {product.title}
                    </h2>
                    {product.draft ? (
                      <span className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
                        Draft
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {product.description || "No description yet."}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>Category: {product.category || "-"}</span>
                    <span>Stock: {product.stock ?? 0}</span>
                    <span>
                      Price: {product.price?.amount ?? 0} {product.price?.currency ?? "EUR"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>Stripe Product: {product.stripeProductId ?? "-"}</span>
                    <span>Stripe Price: {product.stripePriceId ?? "-"}</span>
                  </div>
                </div>

                {editingId === product.id ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Title
                      <input
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        value={editValues.title}
                        onChange={(event) =>
                          setEditValues((prev) => ({
                            ...prev,
                            title: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Category
                      <input
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        value={editValues.category}
                        onChange={(event) =>
                          setEditValues((prev) => ({
                            ...prev,
                            category: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Price (EUR)
                      <input
                        type="number"
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        value={editValues.price}
                        onChange={(event) =>
                          setEditValues((prev) => ({
                            ...prev,
                            price: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Stock
                      <input
                        type="number"
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        value={editValues.stock}
                        onChange={(event) =>
                          setEditValues((prev) => ({
                            ...prev,
                            stock: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Description
                      <textarea
                        rows={3}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        value={editValues.description}
                        onChange={(event) =>
                          setEditValues((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={editValues.draft}
                        onChange={(event) =>
                          setEditValues((prev) => ({
                            ...prev,
                            draft: event.target.checked,
                          }))
                        }
                      />
                      Draft
                    </label>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  {editingId === product.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEditSave(product)}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEditStart(product)}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
                      >
                        Edit
                      </button>
                      {!product.stripeProductId || !product.stripePriceId ? (
                        <button
                          type="button"
                          onClick={() => handleStripeSync(product)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
                        >
                          Sync Stripe
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-400 hover:text-red-700 dark:border-red-700 dark:bg-slate-900 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No products yet.
        </p>
      )}
    </section>
  );
}
