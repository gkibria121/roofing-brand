import type { Metadata } from "next";
import Link from "next/link";
import { CustomerPortalClient } from "@/components/CustomerPortalClient";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { breadcrumbSchema, webPageSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

const portalDescription = `Sign in to the ${site.name} Customer Portal to track live installation milestones, review approved 3D roofing & fencing specs, download HOA packets and warranty PDFs, and message your project manager.`;

export const metadata: Metadata = buildPageMetadata({
  title: "Customer Portal — Track Your Roof & Fence Project",
  description: portalDescription,
  path: "/portal",
  keywords: [
    "T&S Roofing customer portal",
    "track roof installation status",
    "roofing warranty documents",
    "HOA submittal packet download",
  ],
});

const PORTAL_HIGHLIGHTS = [
  "Real-time milestone tracking from on-site measurement to final walkthrough",
  "Approved 3D roofing & fencing specifications with locked-in itemized pricing",
  "Downloadable HOA color packets, permits, inspection photos, and warranty PDFs",
  "Direct messaging with your assigned Project Manager",
] as const;

export default function CustomerPortalPage() {
  const serverRenderedFeatures = (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
      <h2 className="text-xl font-extrabold text-brand-900">What’s inside your portal</h2>
      <ul className="mt-4 space-y-3 text-sm text-slate-700">
        {PORTAL_HIGHLIGHTS.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <span className="mt-0.5 font-bold text-accent-600" aria-hidden="true">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-600">
        Need a new quote first?{" "}
        <Link href="/estimate" className="font-bold text-accent-700 underline underline-offset-4">
          Start your 3D estimate →
        </Link>{" "}
        or call{" "}
        <a href={`tel:${site.phoneHref}`} className="font-bold text-brand-900">
          {site.phone}
        </a>
        .
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow="Homeowner Dashboard"
        title="Customer Portal"
        intro="Track installation progress, review approved 3D quotes and HOA packets, and message your dedicated project manager."
        crumbs={[{ name: "Customer Portal" }]}
        currentPath="/portal"
      />

      <section className="section" aria-label="Customer portal access">
        <div className="container-x">
          <CustomerPortalClient sidebarSlot={serverRenderedFeatures} />
        </div>
      </section>

      <JsonLd
        data={[
          webPageSchema({
            name: `Customer Portal | ${site.name}`,
            description: portalDescription,
            path: "/portal",
          }),
          breadcrumbSchema([{ name: "Customer Portal", path: "/portal" }]),
        ]}
      />
    </>
  );
}
