import Link from "next/link";

export default function Home() {
  return (
    <section className="flex flex-col gap-10">
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-10 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          MiniCommerce
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">
          Build the next generation of your e-commerce experience
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          This demo showcases Firebase authentication and an admin-only product
          creation flow. Log in to explore protected routes.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
          >
            Create account
          </Link>
        </div>
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <summary className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-bold uppercase tracking-widest text-slate-600 dark:border-slate-700 dark:text-slate-200">
            i
          </span>
          <span>Info</span>
          <span className="ml-auto text-xs font-normal text-slate-500 dark:text-slate-400">
            Click to expand
          </span>
        </summary>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">
              Secure auth:
            </span>{" "}
            Email/password authentication powered by Firebase.
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">
              Admin workflow:
            </span>{" "}
            Only admins can create new products.
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-white">
              Next.js ready:
            </span>{" "}
            Built with the App Router and TailwindCSS.
          </li>
        </ul>
      </details>
    </section>
  );
}
