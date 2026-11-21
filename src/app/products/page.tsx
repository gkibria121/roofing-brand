import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { FENCE_CATALOG, ROOF_MATERIAL_CATALOG } from "@/features/configurator";
import {
  breadcrumbSchema,
  fencingProductsSchema,
  roofingProductsSchema,
  webPageSchema,
} from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

const productsDescription = `Explore residential and commercial roofing systems and 6 custom fencing lines installed by ${site.name}. Compare per-sq-ft and per-foot rates and preview every style live in 3D.`;

export const metadata: Metadata = buildPageMetadata({
  title: "Roofing & Custom Fencing Products",
  description: productsDescription,
  path: "/products",
  keywords: [
    "roofing materials catalog",
    "architectural asphalt shingles",
    "standing-seam metal roofing",
    "commercial TPO flat roof",
    "Western Red Cedar privacy fence",
    "horizontal modern slat fence",
  ],
});

export default function ProductsPage() {
  const newRoofs = ROOF_MATERIAL_CATALOG.filter((m) => m.offeredAsNew);

  return (
    <>
      <PageHeader
        eyebrow="Products & Systems"
        title="Roofing systems & custom fencing built to last"
        intro="Every material below is backed by our written workmanship warranty and can be customized live on your home in our 3D estimator."
        crumbs={[{ name: "Products" }]}
        currentPath="/products"
      />

      {/* Category summary cards */}
      <section className="section" aria-label="Product lines">
        <div className="container-x grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div>
              <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-900">
                Roofing Systems
              </span>
              <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">Residential &amp; Commercial Roofing</h2>
              <p className="mt-3 text-slate-600">
                Architectural asphalt shingles, concealed-fastener standing-seam metal, reflective TPO, and multi-ply
                modified bitumen—engineered for high winds, hail, and solar integration.
              </p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {newRoofs.map((mat) => (
                  <li key={mat.id}>
                    <Link
                      href={`/products/roofing#${mat.id}`}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 transition-colors hover:border-accent-600/50 hover:bg-orange-50/40"
                    >
                      <span
                        className="size-5 shrink-0 rounded-md border border-black/15"
                        style={{ backgroundColor: mat.baseColor }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-brand-900">{mat.label}</span>
                        <span className="block text-xs text-slate-500">From ~${mat.pricePerSqFt.toFixed(2)}/sq ft</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products/roofing" className="btn btn-primary">
                Explore Roofing Systems →
              </Link>
              <Link href="/estimate?services=roofing&mode=decorate&view=new" className="btn btn-secondary">
                Preview Roofing in 3D
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div>
              <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-700">
                Custom Fencing
              </span>
              <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">Architectural &amp; Privacy Fencing</h2>
              <p className="mt-3 text-slate-600">
                Western Red Cedar privacy boards, solid vinyl, horizontal modern slats on steel posts, ornamental
                iron/aluminum, classic picket, and commercial chain link with custom-framed gates.
              </p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {FENCE_CATALOG.map((fence) => (
                  <li key={fence.id}>
                    <Link
                      href={`/products/fencing#${fence.id}`}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 transition-colors hover:border-accent-600/50 hover:bg-orange-50/40"
                    >
                      <span
                        className="size-5 shrink-0 rounded-md border border-black/15"
                        style={{ backgroundColor: fence.finishes[0]?.color ?? "#9c6b43" }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-brand-900">{fence.label}</span>
                        <span className="block text-xs text-slate-500">From ~${fence.pricePerLinearFt.toFixed(2)}/ft</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products/fencing" className="btn btn-primary">
                Explore Fencing Catalog →
              </Link>
              <Link href="/estimate?services=fencing&mode=decorate" className="btn btn-secondary">
                Preview Fencing in 3D
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        title="Bundle your roof & fence for seamless scheduling"
        text="Enter your ZIP code to preview both roofing and fencing together on your property in 3D and get an instant itemized quote."
      />
      <JsonLd
        data={[
          webPageSchema({
            type: "CollectionPage",
            name: `Roofing & Custom Fencing Products | ${site.name}`,
            description: productsDescription,
            path: "/products",
          }),
          roofingProductsSchema(),
          fencingProductsSchema(),
          breadcrumbSchema([{ name: "Products", path: "/products" }]),
        ]}
      />
    </>
  );
}
