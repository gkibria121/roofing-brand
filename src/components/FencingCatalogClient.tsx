"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FenceStyleDef } from "@/features/configurator";

type HeightFilter = "all" | "4ft" | "6ft";
type SortOrder = "featured" | "price-asc" | "price-desc";

export function FencingCatalogClient({
  fences,
}: {
  fences: readonly FenceStyleDef[];
}) {
  const [heightFilter, setHeightFilter] = useState<HeightFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("featured");

  const visible = useMemo(() => {
    const filtered =
      heightFilter === "all"
        ? [...fences]
        : fences.filter((f) => f.defaultHeight === heightFilter);
    if (sortOrder === "price-asc") {
      filtered.sort((a, b) => a.pricePerLinearFt - b.pricePerLinearFt);
    } else if (sortOrder === "price-desc") {
      filtered.sort((a, b) => b.pricePerLinearFt - a.pricePerLinearFt);
    }
    return filtered;
  }, [fences, heightFilter, sortOrder]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter fence styles by default height">
          {([
            ["all", `All Styles (${fences.length})`],
            ["6ft", "Privacy (6 ft Default)"],
            ["4ft", "Open / Decorative (4 ft Default)"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={heightFilter === value}
              onClick={() => setHeightFilter(value)}
              className={`min-h-9 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                heightFilter === value
                  ? "bg-brand-900 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-brand-700 hover:text-brand-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <label htmlFor="fence-sort" className="text-slate-600">
            Sort:
          </label>
          <select
            id="fence-sort"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-brand-900"
          >
            <option value="featured">Featured order</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {visible.map((fence) => {
          const previewUrl = `/estimate?services=fencing&mode=decorate&fenceStyle=${fence.id}&fenceFinish=${fence.defaultFinishId}&fenceHeight=${fence.defaultHeight}`;
          return (
            <article
              key={fence.id}
              id={fence.id}
              className="flex scroll-mt-24 flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
            >
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-900">
                      Default {fence.defaultHeight} · 4 ft / 6 ft / 8 ft
                    </span>
                    <h2 className="mt-2.5 text-2xl font-extrabold">{fence.label}</h2>
                    <p className="mt-1 text-sm text-slate-600">{fence.shortDescription}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Starting at</p>
                    <p className="text-xl font-extrabold text-brand-900">~${fence.pricePerLinearFt.toFixed(2)}/ft</p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Available finishes</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {fence.finishes.map((fin) => (
                      <span
                        key={fin.id}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-brand-900"
                      >
                        <span
                          className="size-3.5 rounded-full border border-black/15"
                          style={{ backgroundColor: fin.color }}
                          aria-hidden="true"
                        />
                        {fin.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                  {fence.packages.map((pkg) => (
                    <div
                      key={pkg.name}
                      className={`rounded-xl border p-3 ${
                        pkg.recommended ? "border-accent-600 bg-orange-50/40" : "border-slate-200 bg-slate-50/70"
                      }`}
                    >
                      <h3 className="text-xs font-extrabold text-brand-900">{pkg.name}</h3>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-600">{pkg.tagline}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <span className="text-xs font-medium text-slate-500">
                  Includes utility locate &amp; custom gate options
                </span>
                <Link href={previewUrl} className="btn btn-primary text-sm">
                  Try {fence.label} in 3D →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
