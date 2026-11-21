import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import {
  EstimateWizard,
  FENCE_CATALOG,
  parseConfiguratorState,
  ROOF_MATERIAL_CATALOG,
} from "@/features/configurator";
import { breadcrumbSchema, webApplicationSchema, webPageSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

type SearchParamsRecord = Record<string, string | string[] | undefined>;

const estimateDescription = `Use ${site.name}’s free interactive 3D Roof & Fence Estimator to enter your ZIP code, decorate your home or commercial property live in 3D, and receive an instant itemized estimate.`;

export const metadata: Metadata = buildPageMetadata({
  title: "3D Roof & Fence Estimator & Live Property Decorator",
  description: estimateDescription,
  path: "/estimate",
  keywords: [
    "3D roof estimator",
    "3D fence calculator",
    "roof replacement cost calculator",
    "fence price estimator per foot",
    "interactive exterior house visualizer",
    "solar panel roof preview",
  ],
});

const guarantees = [
  { title: "Interactive 3D preview", text: "Decorate roofs, solar panels, fence styles, finishes, heights & gates live." },
  { title: "Tailored packages", text: "Roofing and fencing options matched specifically to your property." },
  { title: "Free on-site quote", text: "No obligation, no hidden fees — clear itemized pricing." },
  { title: "Licensed & insured", text: `${site.name} backs every install with a written warranty.` },
];

export default async function EstimatePage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}) {
  const rawParams = await searchParams;
  const configParams = new URLSearchParams();
  let initialZip = "";

  for (const [key, value] of Object.entries(rawParams)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (!first) continue;
    if (key === "zip") {
      initialZip = first.replace(/\D/g, "").slice(0, 5);
    } else {
      configParams.set(key, first);
    }
  }

  const initialState = parseConfiguratorState(configParams);
  const offeredRoofs = ROOF_MATERIAL_CATALOG.filter((m) => m.offeredAsNew);

  return (
    <>
      <PageHeader
        eyebrow="Interactive 3D Exterior Estimator"
        title="Get your 3D roof & fence estimate"
        intro="Enter your ZIP code, pick your address, customize your roof or fence live in 3D, and receive an itemized custom quote."
        crumbs={[{ name: "3D Estimate" }]}
        currentPath="/estimate"
      />

      <EstimateWizard initialState={initialState} initialZip={initialZip} />

      <section aria-label="Estimate guarantees" className="border-t border-slate-200 bg-slate-50 py-12">
        <ul className="container-x grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {guarantees.map((g) => (
            <li key={g.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-bold">{g.title}</h2>
              <p className="mt-1.5 text-sm text-slate-600">{g.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Server-rendered indexable specification overview for crawlers and non-WebGL visitors */}
      <section className="section border-t border-slate-200 bg-white" aria-labelledby="estimator-materials-heading">
        <div className="container-x grid gap-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Included in the 3D Configurator</p>
            <h2 id="estimator-materials-heading" className="mt-2 text-2xl font-extrabold sm:text-3xl">
              Compare roofing &amp; fencing materials side by side
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Every material option in our 3D exterior tool reflects real starting installation rates and backed
              warranty packages—from architectural shingles and solar-ready standing-seam metal to commercial TPO flat
              roofs and six custom fence lines.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/products/roofing" className="btn btn-secondary text-sm">
                Full Roofing Specs
              </Link>
              <Link href="/products/fencing" className="btn btn-secondary text-sm">
                Full Fencing Specs
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-900">Roofing options</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {offeredRoofs.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <Link href={`/products/roofing#${m.id}`} className="font-semibold hover:text-accent-700 hover:underline">
                      {m.label}
                    </Link>
                    <span className="text-xs text-slate-500">~${m.pricePerSqFt.toFixed(2)}/sq ft</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-900">Fencing options</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {FENCE_CATALOG.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-2">
                    <Link href={`/products/fencing#${f.id}`} className="font-semibold hover:text-accent-700 hover:underline">
                      {f.label}
                    </Link>
                    <span className="text-xs text-slate-500">~${f.pricePerLinearFt.toFixed(2)}/ft</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <JsonLd
        data={[
          webPageSchema({
            name: `3D Roof & Fence Estimator | ${site.name}`,
            description: estimateDescription,
            path: "/estimate",
          }),
          webApplicationSchema(),
          breadcrumbSchema([{ name: "3D Estimate", path: "/estimate" }]),
        ]}
      />
    </>
  );
}
