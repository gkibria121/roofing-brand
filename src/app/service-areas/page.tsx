import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { ServiceAreaZipChecker } from "@/components/ServiceAreaZipChecker";
import { breadcrumbSchema, serviceAreasListSchema, webPageSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { SERVICE_AREAS } from "@/lib/serviceAreas";
import { site } from "@/lib/site";

const serviceAreasDescription = `Check whether ${site.name} installs roofing systems and custom fencing in your ZIP code. Explore local markets in Richardson, Dallas–Fort Worth, Austin, Miami, and Greater Chicago.`;

export const metadata: Metadata = buildPageMetadata({
  title: "Service Areas — Roofing & Custom Fencing Regions",
  description: serviceAreasDescription,
  path: "/service-areas",
  keywords: [
    "roofing contractor service areas",
    "Richardson TX roofing and fencing",
    "Dallas Fort Worth roof replacement",
    "Austin solar metal roofing",
    "Miami hurricane rated roofing",
    "Chicago roofing and fencing",
  ],
});

export default function ServiceAreasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Regional Coverage"
        title="Where we install roofs & custom fences"
        intro="Licensed, insured local crews delivering rapid on-site inspections, HOA-ready proposals, and clean 1–3 day installations."
        crumbs={[{ name: "Service Areas" }]}
        currentPath="/service-areas"
      />

      <section className="section" aria-label="Service areas list">
        <div className="container-x space-y-10">
          <ServiceAreaZipChecker />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SERVICE_AREAS.map((area) => (
              <article
                key={area.slug}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-900">
                      {area.regionLabel}
                    </span>
                    <span className="text-xs font-bold text-slate-500">Avg. {area.avgInstallDays}</span>
                  </div>
                  <h2 className="mt-4 text-xl font-extrabold">
                    <Link href={`/service-areas/${area.slug}`} className="hover:text-accent-700">
                      {area.name}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">{area.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {area.sampleZips.map((z) => (
                      <span
                        key={z}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700"
                      >
                        {z}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <Link
                    href={`/service-areas/${area.slug}`}
                    className="text-sm font-bold text-brand-900 underline decoration-accent-600 decoration-2 underline-offset-4 hover:text-accent-700"
                  >
                    View local details<span className="sr-only"> for {area.name}</span> →
                  </Link>
                  <Link href={`/estimate?zip=${area.featuredZip}`} className="text-xs font-bold text-slate-600 hover:text-brand-900">
                    3D Quote ({area.featuredZip})
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Don’t see your neighborhood listed?"
        text="Enter your ZIP code in our 3D estimator or call our team directly to check regional crew availability."
      />
      <JsonLd
        data={[
          webPageSchema({
            type: "CollectionPage",
            name: `Service Areas | ${site.name}`,
            description: serviceAreasDescription,
            path: "/service-areas",
          }),
          serviceAreasListSchema(),
          breadcrumbSchema([{ name: "Service Areas", path: "/service-areas" }]),
        ]}
      />
    </>
  );
}
