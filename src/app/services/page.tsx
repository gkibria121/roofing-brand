import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { Photo } from "@/components/Photo";
import { breadcrumbSchema, serviceCatalogSchema, webPageSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { processSteps, services } from "@/lib/services";
import { site } from "@/lib/site";

const servicesDescription =
  "Residential roof replacement, commercial flat TPO roofing, 24/7 emergency leak repair, standing-seam metal roofing, and custom fencing from T&S Roofing Systems. Free written estimates.";

export const metadata: Metadata = buildPageMetadata({
  title: "Roofing & Custom Fencing Services — Replacement, Repair & Commercial",
  description: servicesDescription,
  path: "/services",
  keywords: [
    "residential roofing services",
    "commercial flat roofing TPO",
    "emergency roof leak repair",
    "standing-seam metal roof installation",
    "custom fence installation",
    "storm damage roof inspection",
  ],
});

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our services"
        title="Complete roofing & fencing services, done right"
        intro={`Whether you need a quick leak repair, a brand-new roof, or a custom privacy fence, ${site.name} delivers durable results with honest communication.`}
        crumbs={[{ name: "Services" }]}
        currentPath="/services"
      />

      <div className="container-x space-y-16 py-16 sm:space-y-24 sm:py-20">
        {services.map((s, i) => (
          <section
            key={s.slug}
            id={s.slug}
            aria-labelledby={`${s.slug}-h`}
            className="grid scroll-mt-24 items-center gap-8 lg:grid-cols-2 lg:gap-14"
          >
            <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-100 shadow-lg ring-1 ring-slate-200 ${i % 2 ? "lg:order-2" : ""}`}>
              <Photo
                src={s.image}
                alt={s.imageAlt}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 600px, 100vw"
                className="object-cover"
              />
            </div>
            <div>
              <h2 id={`${s.slug}-h`} className="text-3xl font-extrabold">{s.title}</h2>
              <p className="mt-4 text-slate-600">{s.description}</p>
              <ul className="mt-6 space-y-3">
                {s.features.map((f) => (
                  <li key={f} className="flex gap-3 text-slate-700">
                    <svg className="mt-0.5 size-5 shrink-0 text-accent-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/get-a-quote" className="btn btn-primary">
                  Request a free estimate
                </Link>
                <Link href={s.productHref} className="btn btn-secondary">
                  {s.productLinkLabel}
                </Link>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="section bg-slate-50" aria-labelledby="proc-h">
        <div className="container-x">
          <h2 id="proc-h" className="text-center text-3xl font-extrabold">Our process</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((p, i) => (
              <li key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="font-heading text-sm font-bold text-accent-700">Step {i + 1}</span>
                <h3 className="mt-1 text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand />
      <JsonLd
        data={[
          webPageSchema({
            name: `Roofing & Fencing Services | ${site.name}`,
            description: servicesDescription,
            path: "/services",
          }),
          serviceCatalogSchema(),
          breadcrumbSchema([{ name: "Services", path: "/services" }]),
        ]}
      />
    </>
  );
}
