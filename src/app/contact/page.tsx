import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ContactForm } from "@/components/ContactForm";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us — Free Roofing Estimate",
  description: `Request a free roofing estimate from ${site.name}. Call ${site.phone} or send us a message. 24/7 emergency service available.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get your free roofing estimate"
        intro="Tell us about your project and we’ll get back to you within one business day. For emergencies, call us any time."
        crumbs={[{ name: "Contact" }]}
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
            <p className="mt-3 text-slate-600">{site.serviceAreas.join(", ")}</p>
          </div>
        </aside>
      </div>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
    </>
  );
}
