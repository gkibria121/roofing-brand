import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { QuoteRequestForm } from "@/features/configurator";
import { breadcrumbSchema, webPageSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

const quoteDescription = `Request a free, no-obligation roofing or custom fencing quote from ${site.name}. Upload property photos or HOA specs and receive an itemized written estimate within one business day.`;

export const metadata: Metadata = buildPageMetadata({
  title: "Get a Free Quote — Roofing & Custom Fencing Estimate",
  description: quoteDescription,
  path: "/get-a-quote",
  keywords: [
    "free roofing quote",
    "custom fence estimate",
    "written roof replacement estimate",
    "storm damage roof quote",
    "T&S Roofing Systems quote",
  ],
});

const quoteBenefits = [
  {
    title: "Itemized written pricing",
    text: "Clear material, labor, and warranty breakdowns with zero hidden fees or high-pressure sales.",
  },
  {
    title: "Fast photo & file review",
    text: "Attach roof photos, HOA specs, or inspection reports right in your quote request.",
  },
  {
    title: "Licensed & insured crews",
    text: `Backed by ${site.name}'s 25-year workmanship warranty and full liability coverage.`,
  },
];

export default function GetAQuotePage() {
  return (
    <>
      <PageHeader
        eyebrow="Free Written Quote"
        title="Get your free roofing & fencing quote"
        intro="Select your service, enter your property details, and attach any photos or project notes. Our specialists follow up within one business day."
        crumbs={[{ name: "Get a Quote" }]}
        currentPath="/get-a-quote"
      />

      <section className="section" aria-label="Quote request form">
        <div className="container-x grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md sm:p-8 lg:col-span-7">
            <h2 id="quote-form-heading" className="text-2xl font-extrabold text-brand-900">
              Request your quote
            </h2>
            <p className="mt-1.5 mb-6 text-sm text-slate-600">
              Fill out the form below for a no-obligation written estimate tailored to your property.
            </p>
            <QuoteRequestForm allowEmptyService formAriaLabelledBy="quote-form-heading" />
          </div>

          <aside className="space-y-6 lg:col-span-5" aria-label="Quote details and assistance">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-extrabold text-brand-900">What’s included with your quote</h2>
              <ul className="mt-4 space-y-4">
                {quoteBenefits.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 size-5 shrink-0 text-accent-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-bold text-brand-900">{item.title}</h3>
                      <p className="mt-0.5 text-sm text-slate-600">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-brand-900 p-6 text-white shadow-md">
              <p className="text-xs font-bold uppercase tracking-wider text-accent-400">Interactive 3D Tool</p>
              <h2 className="mt-2 text-xl font-extrabold text-white">Want to preview materials in 3D first?</h2>
              <p className="mt-2 text-sm text-slate-200">
                Try standing-seam metal, architectural shingles, solar panels, and 6 custom fence styles live on a 3D
                model of your property.
              </p>
              <Link href="/estimate" className="btn btn-primary mt-5 w-full">
                Build Your 3D Estimate →
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-extrabold text-brand-900">Need urgent help?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Call our team directly for active leaks, storm damage tarping, or immediate scheduling.
              </p>
              <a
                href={`tel:${site.phoneHref}`}
                className="mt-3 block font-heading text-2xl font-extrabold text-accent-700 hover:underline"
              >
                {site.phone}
              </a>
              <p className="mt-1 text-xs text-slate-500">{site.hours}</p>
            </div>
          </aside>
        </div>
      </section>

      <JsonLd
        data={[
          webPageSchema({
            type: "ContactPage",
            name: `Get a Free Quote | ${site.name}`,
            description: quoteDescription,
            path: "/get-a-quote",
          }),
          breadcrumbSchema([{ name: "Get a Quote", path: "/get-a-quote" }]),
        ]}
      />
    </>
  );
}
