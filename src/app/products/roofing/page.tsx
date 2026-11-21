import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { RoofingCatalogClient } from "@/components/RoofingCatalogClient";
import { ROOF_MATERIAL_CATALOG } from "@/features/configurator";
import {
  breadcrumbSchema,
  faqSchema,
  roofingProductsSchema,
  webPageSchema,
} from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

const roofingDescription = `Compare architectural asphalt shingles, standing-seam metal, reflective TPO, and modified bitumen roofing systems, warranty tiers, and starting per-sq-ft pricing from ${site.name}.`;

export const metadata: Metadata = buildPageMetadata({
  title: "Roofing Systems — Asphalt, Metal, TPO & Flat Roofs",
  description: roofingDescription,
  path: "/products/roofing",
  keywords: [
    "architectural asphalt shingles price",
    "standing-seam metal roof cost",
    "commercial TPO flat roof membrane",
    "modified bitumen roofing",
    "Class 4 impact-resistant shingles",
    "solar-ready standing-seam metal",
  ],
});

const ROOFING_FAQS = [
  {
    question: "Should I choose architectural asphalt shingles or standing-seam metal?",
    answer:
      "Architectural asphalt shingles start around $5.25/sq ft and deliver a 25–30 year lifespan with Class 4 hail-rated upgrade options. Standing-seam metal starts around $9.85/sq ft, lasts 50+ years, reflects solar heat, and allows zero-penetration clamp-on solar mounting.",
  },
  {
    question: "Which flat roofing system is best for commercial buildings?",
    answer:
      "60-mil and 80-mil reflective white TPO is our top commercial choice for heat-welded seam strength and lower summer cooling bills, while multi-ply modified bitumen excels on high-foot-traffic low-slope roofs.",
  },
  {
    question: "Do all roofing packages include tear-off and cleanup?",
    answer:
      "Yes. Every residential and commercial replacement package includes full old-roof tear-off, deck inspection, synthetic or high-temp underlayment, magnetic nail sweep, and a written workmanship warranty.",
  },
] as const;

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
        currentPath="/products/roofing"
      />

      <section className="section" aria-label="Roofing systems catalog">
        <div className="container-x">
          <RoofingCatalogClient materials={newMaterials} />
        </div>
      </section>

      <Faq
        items={ROOFING_FAQS}
        eyebrow="Roofing FAQ"
        title="Roofing material & pricing questions"
        intro="Compare upfront costs, lifespans, and commercial flat-roof assemblies before launching the 3D estimator."
        headingId="roofing-faq-heading"
        className="section border-t border-slate-200 bg-slate-50"
      />

      <CtaBand
        title="Ready to see a new roof on your house?"
        text="Enter your ZIP code to launch our 3D estimator with instant square-footage pricing and solar panel previews."
      />
      <JsonLd
        data={[
          webPageSchema({
            type: "CollectionPage",
            name: `Roofing Systems | ${site.name}`,
            description: roofingDescription,
            path: "/products/roofing",
          }),
          roofingProductsSchema(),
          faqSchema(ROOFING_FAQS),
          breadcrumbSchema([
            { name: "Products", path: "/products" },
            { name: "Roofing Systems", path: "/products/roofing" },
          ]),
        ]}
      />
    </>
  );
}
