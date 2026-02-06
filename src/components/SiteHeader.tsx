"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function SiteHeader() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const { items } = useCart();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isAdmin = profile?.role === "Admin" || profile?.role === "SuperAdmin";
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="text-lg font-semibold text-slate-900 transition hover:text-slate-600 dark:text-slate-100"
        >
          MiniCommerce
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link
            href="/"
            className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/products"
            className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Products
          </Link>
          <Link
            href="/cart"
            className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Cart ({totalItems})
          </Link>
          {user ? (
            <Link
              href="/account"
              className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Account
            </Link>
          ) : null}
          {isAdmin ? (
            <Link
              href="/admin/products"
              className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Admin Products
            </Link>
          ) : null}
          {isAdmin ? (
            <Link
              href="/admin/products/new"
              className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              New Product
            </Link>
          ) : null}
          {!user ? (
            <>
              <Link
                href="/login"
                className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Signed in as {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
