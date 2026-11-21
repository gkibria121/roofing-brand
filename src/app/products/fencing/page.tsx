import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { FencingCatalogClient } from "@/components/FencingCatalogClient";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { FENCE_CATALOG } from "@/features/configurator";
import {
  breadcrumbSchema,
  faqSchema,
  fencingProductsSchema,
  webPageSchema,
} from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

const fencingDescription = `Explore 6 custom fence styles—Western Red Cedar privacy, solid vinyl, horizontal modern slats, ornamental aluminum/iron, picket, and chain link—with starting per-foot pricing from ${site.name}.`;

export const metadata: Metadata = buildPageMetadata({
  title: "Custom Fencing — Wood Privacy, Vinyl, Iron, Slat & Picket",
  description: fencingDescription,
  path: "/products/fencing",
  keywords: [
    "custom privacy fence cost per foot",
    "Western Red Cedar privacy fence",
    "horizontal modern slat fence steel posts",
    "solid vinyl privacy fence",
    "ornamental aluminum iron fence",
    "backyard fence 3D preview",
  ],
});

const FENCING_FAQS = [
  {
    question: "How much does custom fence installation cost per linear foot?",
    answer:
      "Starting rates range from ~$21.50/ft for chain link and ~$28.50/ft for wood privacy up to ~$36.00/ft for solid vinyl and ~$48.50/ft for horizontal modern cedar slats on steel posts. Use our 3D configurator for an instant linear-foot estimate.",
  },
  {
    question: "Why upgrade to steel posts for a wood privacy or horizontal slat fence?",
    answer:
      "Hidden galvanized or matte-black powder-coated steel posts set in concrete eliminate ground-line wood rot, resist high wind gusts, and keep heavy walk and driveway gates aligned for 15–20+ years.",
  },
  {
    question: "Do you handle underground utility locates and matching gates?",
    answer:
      "Yes. We coordinate utility locates prior to digging post holes and custom-frame matching walk gates and double-swing driveway gates with rust-resistant latches.",
  },
] as const;

export default function FencingProductsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Products · Custom Fencing"
        title="Custom fences tailored to your lot & architecture"
        intro="Choose from 6 architectural fence lines with concrete-set posts, matched walk & driveway gates, and instant linear-foot estimates in 3D."
        crumbs={[
          { name: "Products", href: "/products" },
          { name: "Custom Fencing" },
        ]}
        currentPath="/products/fencing"
      />

      <section className="section" aria-label="Custom fencing catalog">
        <div className="container-x">
          <FencingCatalogClient fences={FENCE_CATALOG} />
        </div>
      </section>

      <Faq
        items={FENCING_FAQS}
        eyebrow="Fencing FAQ"
        title="Custom fencing materials, heights & gates"
        intro="Answers to common homeowner questions about posts, finishes, HOA approvals, and linear-foot pricing."
        headingId="fencing-faq-heading"
        className="section border-t border-slate-200 bg-slate-50"
      />

      <CtaBand
        title="See your new fence wrap around your yard in 3D"
        text="Pick backyard, full-perimeter, or front-yard layouts, toggle walk & driveway gates, and get an instant linear-foot quote."
      />
      <JsonLd
        data={[
          webPageSchema({
            type: "CollectionPage",
            name: `Custom Fencing Catalog | ${site.name}`,
            description: fencingDescription,
            path: "/products/fencing",
          }),
          fencingProductsSchema(),
          faqSchema(FENCING_FAQS),
          breadcrumbSchema([
            { name: "Products", path: "/products" },
            { name: "Custom Fencing", path: "/products/fencing" },
          ]),
        ]}
      />
    </>
  );
}
