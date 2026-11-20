import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { JsonLd } from "@/components/JsonLd";
import { EstimateWizard } from "@/features/configurator";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "3D Roof & Fence Estimator & Live Property Decorator",
  description: `Select roofing, fencing, or both to decorate your home or commercial property in 3D and compare matching packages from ${site.name}.`,
  alternates: { canonical: "/estimate" },
};

const guarantees = [
  { title: "Interactive 3D preview", text: "Decorate roofs, solar panels, fence styles, finishes, heights & gates live." },
  { title: "Tailored packages", text: "Roofing and fencing options matched specifically to your property." },
  { title: "Free on-site quote", text: "No obligation, no hidden fees — clear itemized pricing." },
  { title: "Licensed & insured", text: `${site.name} backs every install with a written warranty.` },
];

export default function EstimatePage() {
  return (
    <>
      <PageHeader
        eyebrow="Interactive 3D Exterior Estimator"
        title="Design your roof & fence in 3D"
        intro="Select roofing, fencing, or both — follow the guided steps or switch to Decorate in 3D to customize styles, finishes, solar panels, and gates live around your house."
        crumbs={[{ name: "3D Estimate" }]}
      />

      <Suspense
        fallback={
          <div className="container-x py-16 text-center text-sm font-semibold text-slate-500" role="status">
            Loading 3D configurator…
          </div>
        }
      >
        <EstimateWizard />
      </Suspense>

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
