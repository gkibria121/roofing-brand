import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { PageHeader } from "@/components/PageHeader";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { processSteps, services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Roofing Services — Replacement, Repair, Metal & Commercial",
  description:
    "Residential roofing, commercial roofing, roof repair and emergency service, and metal roofing from T&S Roofing Systems. Free written estimates.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our services"
        title="Complete roofing services, done right"
        intro="Whether you need a quick repair or a brand-new roof, T&S Roofing Systems delivers durable results with honest communication."
        crumbs={[{ name: "Services" }]}
      />

      <div className="container-x space-y-16 py-16 sm:space-y-24 sm:py-20">
        {services.map((s, i) => (
          <section key={s.slug} id={s.slug} aria-labelledby={`${s.slug}-h`} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-100 shadow-lg ring-1 ring-slate-200 ${i % 2 ? "lg:order-2" : ""}`}>
              <Photo src={s.image} alt={s.title} fill loading="lazy" sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
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
              <Link href="/contact" className="btn btn-primary mt-8">Request a free estimate</Link>
            </div>
          </section>
        ))}
      </div>

      <section className="bg-slate-50 section" aria-labelledby="proc-h">
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
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }])} />
    </>
  );
}
