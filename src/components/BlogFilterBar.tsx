"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/blog";

export function BlogFilterBar({
  activeCategory,
  initialQuery,
  totalCount,
}: {
  activeCategory: BlogCategory | "All";
  initialQuery: string;
  totalCount: number;
}) {
  const uid = useId();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function navigate(nextCat: BlogCategory | "All", nextQuery: string) {
    const params = new URLSearchParams();
    if (nextCat !== "All") params.set("category", nextCat);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    const qs = params.toString();
    router.push(qs ? `/blog?${qs}` : "/blog", { scroll: false });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate(activeCategory, query);
  }

  const inputId = `${uid}-blog-search`;
  const categories: readonly (BlogCategory | "All")[] = ["All", ...BLOG_CATEGORIES];

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter articles by topic">
        {categories.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={active}
              onClick={() => navigate(cat, query)}
              className={`min-h-9 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                active
                  ? "bg-brand-900 text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-700 hover:text-brand-900"
              }`}
            >
              {cat}
            </button>
          );
        })}
        <span className="ml-1 text-xs font-semibold text-slate-500">
          {totalCount} {totalCount === 1 ? "guide" : "guides"}
        </span>
      </div>

      <search className="w-full lg:w-80">
        <form action="/blog" method="get" onSubmit={onSubmit} className="flex gap-2">
          {activeCategory !== "All" && <input type="hidden" name="category" value={activeCategory} />}
          <label htmlFor={inputId} className="sr-only">
            Filter blog guides by keyword
          </label>
          <input
            id={inputId}
            name="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter guides (e.g. metal, cedar, storm)…"
            className="field-control flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-brand-900 focus:border-accent-600"
          />
          <button type="submit" className="btn btn-secondary shrink-0 px-3.5 py-2 text-xs">
            Filter
          </button>
        </form>
      </search>
    </div>
  );
}
