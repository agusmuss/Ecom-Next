"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "../../../../context/AuthContext";
import { db } from "../../../../lib/firebase";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
};

export default function NewProductPage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "Admin" || profile?.role === "SuperAdmin";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [taxRate, setTaxRate] = useState("18");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [draft, setDraft] = useState(false);
  const [discountRate, setDiscountRate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Create new product
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You must be logged in to access this page.
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
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Create new product
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You do not have permission to create products.
        </p>
      </section>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!title || !price || !category) {
      setError("Please fill in the required fields (title, price, category).");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        brand: brand.trim(),
        serialNumber: serialNumber.trim(),
        price: {
          amount: Number(price),
          currency,
        },
        taxRate: Number(taxRate),
        image: image.trim(),
        category: category.trim(),
        stock: Number(stock || 0),
        draft,
        discount: discountRate
          ? {
              rate: Number(discountRate),
            }
          : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
      };

      await addDoc(collection(db, "products"), payload);
      setTitle("");
      setDescription("");
      setBrand("");
      setSerialNumber("");
      setPrice("");
      setCurrency("EUR");
      setTaxRate("18");
      setImage("");
      setCategory("");
      setStock("");
      setDraft(false);
      setDiscountRate("");
      setSuccess("Product created successfully.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Create new product
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Only admins can create new products.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/70"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Title *
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Brand
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Serial number
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={serialNumber}
              onChange={(event) => setSerialNumber(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Category *
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Price *
            <input
              type="number"
              min="0"
              step="0.01"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Currency
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Tax rate
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={taxRate}
              onChange={(event) => setTaxRate(event.target.value)}
            >
              <option value="1">1%</option>
              <option value="8">8%</option>
              <option value="18">18%</option>
              <option value="25">25%</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Image URL
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={image}
              onChange={(event) => setImage(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Stock
            <input
              type="number"
              min="0"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Discount rate (%)
            <input
              type="number"
              min="0"
              max="100"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={discountRate}
              onChange={(event) => setDiscountRate(event.target.value)}
            />
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Description
          <textarea
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={draft}
            onChange={(event) => setDraft(event.target.checked)}
          />
          Save as draft
        </label>

        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-4 text-sm text-emerald-600" role="status">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          {isSubmitting ? "Saving..." : "Create product"}
        </button>
      </form>
    </section>
  );
}
