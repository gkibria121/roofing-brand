"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { RoofMaterialDef } from "@/features/configurator";

type SlopeFilter = "all" | "pitched" | "flat";

export function RoofingCatalogClient({
  materials,
}: {
  materials: readonly RoofMaterialDef[];
}) {
  const [filter, setFilter] = useState<SlopeFilter>("all");

  const visible = useMemo(() => {
    if (filter === "pitched") return materials.filter((m) => m.supportsPitched);
    if (filter === "flat") return materials.filter((m) => m.supportsFlat);
    return materials;
  }, [materials, filter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter roofing systems by slope">
          {([
            ["all", `All Systems (${materials.length})`],
            ["pitched", "Pitched Residential Roofs"],
            ["flat", "Flat & Commercial Roofs"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`min-h-9 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                filter === value
                  ? "bg-brand-900 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-brand-700 hover:text-brand-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p role="status" className="text-xs font-semibold text-slate-600">
          Showing {visible.length} of {materials.length} roofing systems
        </p>
      </div>

      <div className="space-y-10">
        {visible.map((mat) => {
          const slopeParam = mat.supportsFlat ? "flat" : "moderate";
          const previewUrl = `/estimate?services=roofing&mode=decorate&view=new&slope=${slopeParam}&desiredType=${mat.id}`;
          return (
            <article
              key={mat.id}
              id={mat.id}
              className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-start gap-4">
                  <span
                    className="mt-1 size-12 shrink-0 rounded-2xl border border-black/15 shadow-inner"
                    style={{ backgroundColor: mat.baseColor }}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-extrabold">{mat.label} Roofing</h2>
                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-900">
                        {mat.supportsFlat ? "Flat / Low-Slope" : "Pitched Roof"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 sm:text-base">{mat.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Starting at</p>
                    <p className="text-xl font-extrabold text-brand-900">~${mat.pricePerSqFt.toFixed(2)}/sq ft</p>
                  </div>
                  <Link href={previewUrl} className="btn btn-primary">
                    Preview {mat.label} in 3D →
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {mat.packages.map((pkg) => (
                  <div
                    key={pkg.name}
                    className={`rounded-2xl border p-5 ${
                      pkg.recommended
                        ? "border-accent-600 bg-orange-50/35 ring-1 ring-accent-600/20"
                        : "border-slate-200 bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-extrabold">{pkg.name}</h3>
                      {pkg.recommended && (
                        <span className="rounded-full bg-accent-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                          Most popular
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-600">{pkg.tagline}</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                      {pkg.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="mt-0.5 text-accent-600" aria-hidden="true">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
