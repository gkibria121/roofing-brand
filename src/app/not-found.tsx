import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: `The page you requested could not be found on ${site.name}. Search our roofing systems, custom fencing catalog, service areas, or launch the 3D estimator.`,
  robots: {
    index: false,
    follow: true,
  },
};

const QUICK_LINKS = [
  { href: "/products/roofing", label: "Roofing Systems" },
  { href: "/products/fencing", label: "Custom Fencing" },
  { href: "/estimate", label: "3D Roof & Fence Estimator" },
  { href: "/service-areas", label: "Service Areas" },
  { href: "/blog", label: "Homeowner Guides" },
  { href: "/get-a-quote", label: "Get a Free Quote" },
] as const;

export default function NotFound() {
  return (
    <div className="container-x py-20 text-center sm:py-28">
      <p className="eyebrow">404 · Page Not Found</p>
      <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">We couldn’t find that page</h1>
      <p className="mx-auto mt-4 max-w-xl text-slate-600">
        The link may have moved or expired. Try searching our roofing systems, custom fencing options, service areas,
        and guides below.
      </p>

      <search className="mx-auto mt-8 max-w-lg">
        <form action="/search" method="get" className="flex flex-col gap-2.5 sm:flex-row">
          <label htmlFor="not-found-search" className="sr-only">
            Search {site.name}
          </label>
          <input
            id="not-found-search"
            name="q"
            type="search"
            placeholder="Search metal roofs, cedar fences, ZIP codes…"
            className="field-control flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-brand-900 focus:border-accent-600"
          />
          <button type="submit" className="btn btn-primary shrink-0">
            Search
          </button>
        </form>
      </search>

      <nav aria-label="Popular pages" className="mx-auto mt-10 max-w-2xl">
        <ul className="flex flex-wrap justify-center gap-2.5">
          {QUICK_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-brand-900 transition-colors hover:border-accent-600 hover:bg-orange-50/50 hover:text-accent-700"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10">
        <Link href="/" className="btn btn-secondary">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
