import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { FENCE_CATALOG } from "@/features/configurator";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Custom Fencing — Wood Privacy, Vinyl, Iron, Slat & Picket",
  description: `Explore all 6 custom fence styles, stain/color finishes, heights, and starting per-foot pricing installed by ${site.name}. Preview around your house in 3D.`,
  alternates: { canonical: "/products/fencing" },
};

export default function FencingProductsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Products · Custom Fencing"
        title="Custom fences tailored to your lot & architecture"
        intro="Choose from 6 architectural fence lines with concrete-set posts, matched walk & driveway gates, and instant linear-foot estimates in 3D."
        crumbs={[
          { name: "Products", href: "/products" },
          { name: "Custom Fencing" },
        ]}
      />

      <section className="section" aria-label="Custom fencing catalog">
        <div className="container-x grid gap-8 lg:grid-cols-2">
          {FENCE_CATALOG.map((fence) => {
            const previewUrl = `/estimate?services=fencing&mode=decorate&fenceStyle=${fence.id}&fenceFinish=${fence.defaultFinishId}&fenceHeight=${fence.defaultHeight}`;
            return (
              <article
                key={fence.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
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
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Starting at</p>
                      <p className="text-xl font-extrabold text-brand-900">~${fence.pricePerLinearFt.toFixed(2)}/ft</p>
                    </div>
                  </div>

                  {/* Finish swatches */}
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

                  {/* Package tiers */}
                  <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                    {fence.packages.map((pkg) => (
                      <div
                        key={pkg.name}
                        className={`rounded-xl border p-3 ${
                          pkg.recommended ? "border-accent-600 bg-orange-50/40" : "border-slate-200 bg-slate-50/70"
                        }`}
                      >
                        <p className="text-xs font-extrabold text-brand-900">{pkg.name}</p>
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
      </section>

      <CtaBand
        title="See your new fence wrap around your yard in 3D"
        text="Pick backyard, full-perimeter, or front-yard layouts, toggle walk & driveway gates, and get an instant linear-foot quote."
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Products", path: "/products" },
          { name: "Custom Fencing", path: "/products/fencing" },
        ])}
      />
    </>
  );
}
