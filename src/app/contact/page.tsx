import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { breadcrumbSchema, webPageSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { SERVICE_AREAS } from "@/lib/serviceAreas";
import { site } from "@/lib/site";

const contactDescription = `Contact ${site.name} for a free roofing or custom fencing estimate. Call ${site.phone} for 24/7 emergency roof repair or message our team in Richardson, TX.`;

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Us — Free Roofing & Fencing Estimate",
  description: contactDescription,
  path: "/contact",
  keywords: [
    "contact T&S Roofing Systems",
    "emergency roof repair phone number",
    "Richardson TX roofing office",
    "free roofing inspection",
  ],
});

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get your free roofing & fencing estimate"
        intro="Tell us about your project and we’ll get back to you within one business day. For emergencies, call us any time."
        crumbs={[{ name: "Contact" }]}
        currentPath="/contact"
      />
      <div className="container-x grid gap-10 py-16 lg:grid-cols-[1.3fr_1fr] lg:py-20">
        <ContactForm />
        <aside className="space-y-6" aria-label="Contact details">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-extrabold">Call us</h2>
            <a href={`tel:${site.phoneHref}`} className="mt-2 block font-heading text-3xl font-extrabold text-accent-700 hover:underline">{site.phone}</a>
            <p className="mt-1 text-sm text-slate-600">24/7 emergency roof repair</p>
          </div>
          <address className="rounded-2xl border border-slate-200 p-6 not-italic">
            <h2 className="text-xl font-extrabold">Visit or email</h2>
            <p className="mt-3 text-slate-600">{site.address.street}<br />{site.address.city}, {site.address.region} {site.address.postalCode}</p>
            <p className="mt-3"><a className="font-semibold text-brand-900 hover:text-accent-700" href={`mailto:${site.email}`}>{site.email}</a></p>
            <p className="mt-3 text-sm text-slate-600">{site.hours}</p>
          </address>
          <div className="rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-extrabold">Areas we serve</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SERVICE_AREAS.map((area) => (
                <li key={area.slug}>
                  <Link
                    href={`/service-areas/${area.slug}`}
                    className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-brand-900 hover:border-accent-600 hover:text-accent-700"
                  >
                    {area.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
      <JsonLd
        data={[
          webPageSchema({
            type: "ContactPage",
            name: `Contact ${site.name}`,
            description: contactDescription,
            path: "/contact",
          }),
          breadcrumbSchema([{ name: "Contact", path: "/contact" }]),
        ]}
      />
    </>
  );
}
