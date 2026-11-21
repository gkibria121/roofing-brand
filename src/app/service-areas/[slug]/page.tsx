import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { BLOG_POSTS } from "@/lib/blog";
import { breadcrumbSchema, faqSchema, serviceAreaSchema, webPageSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { getServiceAreaBySlug, SERVICE_AREAS } from "@/lib/serviceAreas";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return SERVICE_AREAS.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const area = getServiceAreaBySlug(slug);
  if (!area) return { title: "Service Area Not Found", robots: { index: false, follow: true } };

  const description = `${area.description} Serving ZIP codes ${area.sampleZips.join(", ")} with licensed roofing & fencing crews from ${site.name}.`;

  return buildPageMetadata({
    title: area.headline,
    description,
    path: `/service-areas/${area.slug}`,
    useColocatedOgImage: true,
    keywords: [
      `roofing contractor ${area.name}`,
      `custom fencing ${area.name}`,
      `${area.popularRoof} ${area.state}`,
      ...area.neighborhoods.map((n) => `roofing ${n}`),
      ...area.sampleZips.map((z) => `roofing contractor ${z}`),
    ],
  });
}

export default async function ServiceAreaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const area = getServiceAreaBySlug(slug);
  if (!area) notFound();

  const description = `${area.description} Serving ZIP codes ${area.sampleZips.join(", ")}.`;

  return (
    <>
      <PageHeader
        eyebrow={`Service Area · ${area.regionLabel}`}
        title={area.headline}
        intro={area.description}
        crumbs={[
          { name: "Service Areas", href: "/service-areas" },
          { name: area.name },
        ]}
        currentPath={`/service-areas/${area.slug}`}
      />

      <section className="section">
        <div className="container-x grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-extrabold">Built for {area.name} weather</h2>
              <p className="mt-3 leading-relaxed text-slate-600">{area.climateNotes}</p>

              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Typical install</dt>
                  <dd className="mt-1 text-base font-extrabold text-brand-900">{area.avgInstallDays}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Top roof choice</dt>
                  <dd className="mt-1 text-sm font-bold text-brand-900">{area.popularRoof}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Top fence choice</dt>
                  <dd className="mt-1 text-sm font-bold text-brand-900">{area.popularFence}</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                <Link href="/products/roofing" className="btn btn-secondary text-sm">
                  Compare Roofing Systems
                </Link>
                <Link href="/products/fencing" className="btn btn-secondary text-sm">
                  Compare Custom Fencing
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-extrabold">Neighborhoods &amp; ZIP codes we serve</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {area.neighborhoods.map((n) => (
                  <span
                    key={n}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-semibold text-brand-900"
                  >
                    {n}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">Featured ZIP codes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {area.sampleZips.map((z) => (
                  <Link
                    key={z}
                    href={`/estimate?zip=${z}`}
                    className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-900 transition-colors hover:bg-accent-600 hover:text-white"
                  >
                    {z}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-extrabold">Helpful homeowner planning guides</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {BLOG_POSTS.slice(0, 2).map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="block rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-accent-600/50 hover:bg-orange-50/30"
                    >
                      <span className="text-xs font-bold text-accent-700">{post.category} · {post.readMinutes} min read</span>
                      <span className="mt-1 block text-sm font-extrabold text-brand-900">{post.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="space-y-5 lg:col-span-4" aria-label="Local quote and nearby regions">
            <div className="rounded-3xl border border-slate-200 bg-brand-900 p-6 text-white shadow-md">
              <p className="text-xs font-bold uppercase tracking-wider text-accent-400">Instant 3D Quote</p>
              <h2 className="mt-2 text-2xl font-extrabold text-white">Live in {area.name}?</h2>
              <p className="mt-2 text-sm text-slate-200">
                Start with ZIP <strong>{area.featuredZip}</strong> (or your local ZIP) preloaded to preview roofs and
                fences on your property in 3D and get an itemized quote in minutes.
              </p>
              <div className="mt-6 space-y-3">
                <Link href={`/estimate?zip=${area.featuredZip}`} className="btn btn-primary btn-lg w-full">
                  Start 3D Estimate ({area.featuredZip}) →
                </Link>
                <a
                  href={`tel:${site.phoneHref}`}
                  className="btn w-full border border-white/25 bg-white/10 text-white hover:bg-white/20"
                >
                  Call {site.phone}
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-brand-900">Other service areas</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {SERVICE_AREAS.filter((other) => other.slug !== area.slug).map((other) => (
                  <li key={other.slug}>
                    <Link
                      href={`/service-areas/${other.slug}`}
                      className="font-semibold text-brand-700 hover:text-accent-700 hover:underline"
                    >
                      {other.name} ({other.state}) →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <Faq
        items={area.faqs}
        eyebrow={`${area.name} FAQ`}
        title={`Local roofing & fencing questions in ${area.name}`}
        intro={`Answers tailored to ${area.state} building codes, weather conditions, and neighborhood HOA guidelines.`}
        headingId="area-faq-heading"
        className="section border-t border-slate-200 bg-slate-50"
      />

      <CtaBand
        title={`Schedule a free inspection in ${area.name}`}
        text="Compare roofing and fencing packages in 3D before our local crew visits your property."
      />
      <JsonLd
        data={[
          webPageSchema({
            name: area.headline,
            description,
            path: `/service-areas/${area.slug}`,
          }),
          serviceAreaSchema(area),
          faqSchema(area.faqs),
          breadcrumbSchema([
            { name: "Service Areas", path: "/service-areas" },
            { name: area.name, path: `/service-areas/${area.slug}` },
          ]),
        ]}
      />
    </>
  );
}
