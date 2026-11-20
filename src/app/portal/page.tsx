import type { Metadata } from "next";
import { CustomerPortalClient } from "@/components/CustomerPortalClient";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Customer Portal — Track Your Roof & Fence Project",
  description: `Sign in to the ${site.name} Customer Portal to view project milestones, approved 3D specs, installation schedules, HOA packets, and warranty documents.`,
  alternates: { canonical: "/portal" },
};

export default function CustomerPortalPage() {
  return (
    <>
      <PageHeader
        eyebrow="Homeowner Dashboard"
        title="Customer Portal"
        intro="Track installation progress, review approved 3D quotes and HOA packets, and message your dedicated project manager."
        crumbs={[{ name: "Customer Portal" }]}
      />

      <section className="section" aria-label="Customer portal access">
        <div className="container-x">
          <CustomerPortalClient />
        </div>
      </section>

      <JsonLd data={breadcrumbSchema([{ name: "Customer Portal", path: "/portal" }])} />
    </>
  );
}
