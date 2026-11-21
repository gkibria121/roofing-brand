"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import {
  POPULAR_SEARCH_TERMS,
  SEARCH_CATEGORY_OPTIONS,
  searchSite,
  type SearchCategory,
} from "@/lib/search";

export function SiteSearchClient({
  initialQuery,
  initialCategory,
}: {
  initialQuery: string;
  initialCategory: SearchCategory;
}) {
  const uid = useId();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<SearchCategory>(initialCategory);

  const results = useMemo(() => searchSite(query, category), [query, category]);

  function syncUrl(nextQuery: string, nextCategory: SearchCategory) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextCategory !== "all") params.set("category", nextCategory);
    const qs = params.toString();
    router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    syncUrl(query, category);
  }

  function selectCategory(nextCat: SearchCategory) {
    setCategory(nextCat);
    syncUrl(query, nextCat);
  }

  function applySuggestion(term: string) {
    setQuery(term);
    syncUrl(term, category);
  }

  const inputId = `${uid}-search-input`;

  return (
    <div className="space-y-8">
      <search className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <form action="/search" method="get" onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor={inputId} className="sr-only">
              Search roofing systems, custom fencing, ZIP codes, and guides
            </label>
            <div className="relative flex-1">
              <span
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <input
                id={inputId}
                name="q"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search standing-seam metal, cedar fence, ZIP 75081, TPO, warranty…"
                className="field-control w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-base text-brand-900 placeholder:text-slate-400 focus:border-accent-600"
              />
            </div>
            {category !== "all" && <input type="hidden" name="category" value={category} />}
            <button type="submit" className="btn btn-primary shrink-0 px-6">
              Search
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter search results by category">
            {SEARCH_CATEGORY_OPTIONS.map((opt) => {
              const active = category === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectCategory(opt.value)}
                  className={`min-h-9 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    active
                      ? "bg-brand-900 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-700 hover:text-brand-900"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-500">Popular:</span>
          {POPULAR_SEARCH_TERMS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => applySuggestion(term)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-brand-900 transition-colors hover:border-accent-600 hover:bg-orange-50/50 hover:text-accent-700"
            >
              {term}
            </button>
          ))}
        </div>
      </search>

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <p role="status" className="text-sm font-semibold text-slate-600">
            {query.trim() ? (
              <>
                Showing <strong className="text-brand-900">{results.length}</strong>{" "}
                {results.length === 1 ? "result" : "results"} for{" "}
                <strong className="text-brand-900">“{query.trim()}”</strong>
              </>
            ) : (
              <>
                Browsing <strong className="text-brand-900">{results.length}</strong> indexed pages, products, guides,
                and service areas
              </>
            )}
          </p>
          {(query.trim() || category !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
                syncUrl("", "all");
              }}
              className="text-xs font-bold text-accent-700 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
            <h2 className="text-xl font-extrabold text-brand-900">No exact matches found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Try a broader keyword like <strong>metal</strong>, <strong>shingles</strong>, <strong>cedar fence</strong>
              , or enter your 5-digit ZIP code in our 3D estimator.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/estimate" className="btn btn-primary">
                Launch 3D Estimator →
              </Link>
              <Link href="/get-a-quote" className="btn btn-secondary">
                Request a Free Quote
              </Link>
            </div>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {results.map((item) => (
              <li key={item.id}>
                <article className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-shadow hover:shadow-md">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-brand-900">
                        {item.categoryLabel}
                      </span>
                      {item.badge && <span className="text-slate-500">{item.badge}</span>}
                    </div>
                    <h2 className="mt-3 text-lg font-extrabold leading-snug text-brand-900">
                      <Link href={item.href} className="hover:text-accent-700 hover:underline">
                        {item.title}
                      </Link>
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.description}</p>
                  </div>
                  <div className="mt-4 pt-3">
                    <Link
                      href={item.href}
                      className="text-xs font-bold text-accent-700 hover:underline"
                    >
                      Open page<span className="sr-only">: {item.title}</span> →
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
