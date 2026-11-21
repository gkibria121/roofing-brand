import Link from "next/link";
import { SERVICE_AREAS } from "@/lib/serviceAreas";
import { navLinks, productNavItems, site } from "@/lib/site";
import { Logo } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-slate-600">
            {site.tagline} Licensed, bonded and insured roofing &amp; custom fencing contractor.
          </p>
          <p className="text-sm font-semibold text-slate-700">{site.licenseNumber}</p>
        </div>

        <nav aria-label="Footer company links">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-brand-900">Company</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link className="text-slate-600 hover:text-accent-700" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer products and tools">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-brand-900">Products &amp; Tools</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {productNavItems.map((p) => (
              <li key={p.href}>
                <Link className="text-slate-600 hover:text-accent-700" href={p.href}>
                  {p.label}
                </Link>
              </li>
            ))}
            <li>
              <Link className="text-slate-600 hover:text-accent-700" href="/services">
                Repair &amp; Inspections
              </Link>
            </li>
            <li>
              <Link className="font-semibold text-brand-900 hover:text-accent-700" href="/get-a-quote">
                Get a Free Quote
              </Link>
            </li>
            <li>
              <Link className="font-semibold text-accent-700 hover:underline" href="/estimate">
                3D Quote Configurator →
              </Link>
            </li>
          </ul>
        </nav>

        <address className="not-italic">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-brand-900">Contact</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>
              {site.address.street}
              <br />
              {site.address.city}, {site.address.region} {site.address.postalCode}
            </li>
            <li>
              <a className="font-semibold text-brand-900 hover:text-accent-700" href={`tel:${site.phoneHref}`}>
                {site.phone}
              </a>
            </li>
            <li>
              <a className="hover:text-accent-700" href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </li>
            <li>{site.hours}</li>
          </ul>
        </address>
      </div>
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {year} {site.name}. All rights reserved.</p>
          <nav aria-label="Service regions">
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <li className="font-semibold text-slate-700">Serving:</li>
              {SERVICE_AREAS.map((area) => (
                <li key={area.slug}>
                  <Link
                    href={`/service-areas/${area.slug}`}
                    className="hover:text-accent-700 hover:underline"
                  >
                    {area.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
