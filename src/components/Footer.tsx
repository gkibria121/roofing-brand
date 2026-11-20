import Link from "next/link";
import { Logo } from "./Logo";
import { navLinks, site } from "@/lib/site";
import { services } from "@/lib/services";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-slate-600">{site.tagline} Licensed, bonded and insured roofing contractor.</p>
          <p className="text-sm font-semibold text-slate-700">{site.licenseNumber}</p>
        </div>

        <nav aria-label="Footer">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-brand-900">Company</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {navLinks.map((l) => (
              <li key={l.href}><Link className="text-slate-600 hover:text-accent-700" href={l.href}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-brand-900">Services</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {services.map((s) => (
              <li key={s.slug}><Link className="text-slate-600 hover:text-accent-700" href={`/services#${s.slug}`}>{s.title}</Link></li>
            ))}
          </ul>
        </div>

        <address className="not-italic">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-brand-900">Contact</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>{site.address.street}<br />{site.address.city}, {site.address.region} {site.address.postalCode}</li>
            <li><a className="font-semibold text-brand-900 hover:text-accent-700" href={`tel:${site.phoneHref}`}>{site.phone}</a></li>
            <li><a className="hover:text-accent-700" href={`mailto:${site.email}`}>{site.email}</a></li>
            <li>{site.hours}</li>
          </ul>
        </address>
      </div>
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>© {year} {site.name}. All rights reserved.</p>
          <p>Serving {site.serviceAreas.join(" · ")}</p>
        </div>
      </div>
    </footer>
  );
}
