import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { EstimateWizard } from "@/components/estimate/EstimateWizard";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "3D Roof Estimator & Instant Package Finder",
  description: `Answer a few quick questions to preview your home or commercial building in 3D and explore matching roofing packages from ${site.name}.`,
  alternates: { canonical: "/estimate" },
};

const guarantees = [
  { title: "Interactive 3D preview", text: "See slope, stories, materials, damage and solar panels live." },
  { title: "Tailored packages", text: "Options matched specifically to your roof type and goals." },
  { title: "Free on-site quote", text: "No obligation, no hidden fees — clear itemized pricing." },
  { title: "Licensed & insured", text: `${site.name} backs every install with a written warranty.` },
];

export default function EstimatePage() {
  return (
    <>
      <PageHeader
        eyebrow="Interactive 3D Roof Estimator"
        title="Build your roof in 3D & see matching packages"
        intro="Answer a quick set of questions about your building. Watch your 3D roof model update in real time, then compare matching roofing packages."
        crumbs={[{ name: "3D Estimate" }]}
      />

      <EstimateWizard />

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

      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "3D Estimate", path: "/estimate" },
        ])}
      />
    </>
  );
}
