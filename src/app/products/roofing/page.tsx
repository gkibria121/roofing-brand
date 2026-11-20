import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { ROOF_MATERIAL_CATALOG } from "@/features/configurator";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Roofing Systems — Asphalt, Metal, TPO & Flat Roofs",
  description: `Compare residential and commercial roofing materials, warranty tiers, and per-sq-ft pricing from ${site.name}. Preview every roof live in 3D.`,
  alternates: { canonical: "/products/roofing" },
};

export default function RoofingProductsPage() {
  const newMaterials = ROOF_MATERIAL_CATALOG.filter((m) => m.offeredAsNew);

  return (
    <>
      <PageHeader
        eyebrow="Products · Roofing Systems"
        title="Engineered roofing systems for every slope"
        intro="Compare our residential pitched and commercial flat roofing assemblies, warranty packages, and starting rates — then visualize any option on your property in 3D."
        crumbs={[
          { name: "Products", href: "/products" },
          { name: "Roofing Systems" },
        ]}
      />

      <section className="section" aria-label="Roofing systems catalog">
        <div className="container-x space-y-10">
          {newMaterials.map((mat) => {
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
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Starting at</p>
                      <p className="text-xl font-extrabold text-brand-900">~${mat.pricePerSqFt.toFixed(2)}/sq ft</p>
                    </div>
                    <Link href={previewUrl} className="btn btn-primary">
                      Preview in 3D →
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
      </section>

      <CtaBand
        title="Ready to see a new roof on your house?"
        text="Enter your ZIP code to launch our 3D estimator with instant square-footage pricing and solar panel previews."
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Products", path: "/products" },
          { name: "Roofing Systems", path: "/products/roofing" },
        ])}
      />
    </>
  );
}
