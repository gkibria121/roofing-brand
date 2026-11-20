import type { Metadata } from "next";
import { Photo } from "@/components/Photo";
import { PageHeader } from "@/components/PageHeader";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us — Licensed & Insured Roofing Contractor",
  description: `Learn about ${site.name}: a locally owned, licensed and insured roofing contractor with ${new Date().getFullYear() - site.foundingYear}+ years of experience.`,
  alternates: { canonical: "/about" },
};

const values = [
  { title: "Integrity", text: "We tell you what your roof needs — and what it doesn’t. Honest advice, always." },
  { title: "Craftsmanship", text: "Proper installation details and quality materials are the difference between 10 years and 30." },
  { title: "Respect", text: "We treat your property like our own and keep you informed at every step." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About us"
        title={`The team behind ${site.name}`}
        intro="A locally owned roofing company dedicated to protecting homes and businesses with quality work and honest service."
        crumbs={[{ name: "About" }]}
      />

      <section className="container-x grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <h2 className="text-3xl font-extrabold">Built on quality and trust</h2>
          <div className="mt-5 space-y-4 text-slate-600">
            <p>
              {site.name} was founded in {site.foundingYear} with a simple goal: provide roofing that lasts, with
              service that’s straightforward and fair. Today our experienced crews have completed thousands of
              residential and commercial roofs.
            </p>
            <p>
              We’re fully licensed, bonded and insured, and we back our workmanship with a written warranty. From the
              first inspection to the final walkthrough, you’ll deal with professionals who take pride in their work.
            </p>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-6">
            {site.stats.map((s) => (
              <div key={s.label}>
                <dd className="font-heading text-3xl font-extrabold text-brand-900">{s.value}</dd>
                <dt className="text-sm text-slate-600">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-100 shadow-xl ring-1 ring-slate-200">
          <Photo src="/images/about.svg" alt="T&S Roofing Systems crew and company truck" fill priority sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
        </div>
      </section>

      <section className="section bg-slate-50" aria-labelledby="values-h">
        <div className="container-x">
          <h2 id="values-h" className="text-center text-3xl font-extrabold">What we stand for</h2>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <li key={v.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-bold">{v.title}</h3>
                <p className="mt-2 text-slate-600">{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
    </>
  );
}
