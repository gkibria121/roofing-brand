import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { GoogleReviews } from "@/components/GoogleReviews";
import { JsonLd } from "@/components/JsonLd";
import { Photo } from "@/components/Photo";
import { Stars } from "@/components/Stars";
import { BLOG_POSTS } from "@/lib/blog";
import { faqSchema, howToSchema, webPageSchema } from "@/lib/schema";
import { reviewSummary } from "@/lib/reviews";
import { buildPageMetadata } from "@/lib/seo";
import { SERVICE_AREAS } from "@/lib/serviceAreas";
import { processSteps, services } from "@/lib/services";
import { site } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: { absolute: `${site.name} | Residential & Commercial Roofing & Custom Fencing` },
  description: site.description,
  path: "/",
  useColocatedOgImage: true,
  keywords: [
    "roofing contractor",
    "roof replacement",
    "standing-seam metal roofing",
    "commercial TPO flat roof",
    "custom privacy fencing",
    "3D roof and fence estimator",
    "emergency roof repair",
  ],
});

const whyUs = [
  { title: "Licensed, bonded & insured", text: "Full coverage for your peace of mind on every project." },
  { title: "Upfront, written pricing", text: "Itemized estimates with no hidden fees or pressure." },
  { title: "Quality materials", text: "Top-tier manufacturers backed by strong warranties." },
  { title: "Clean, respectful crews", text: "We protect your property and leave it spotless." },
];

function Check() {
  return (
    <svg className="mt-0.5 size-5 shrink-0 text-accent-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white" aria-labelledby="hero-heading">
        <div className="container-x grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:py-24">
          <div>
            <p className="eyebrow">Residential &amp; commercial roofing &amp; fencing</p>
            <h1 id="hero-heading" className="mt-4 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
              Roofing you can trust, <span className="text-accent-600">built to last.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              {site.name} installs, repairs and replaces roofs and custom fences with honest pricing, expert crews and
              warranties we stand behind. Serving {site.serviceAreas.slice(0, 2).join(", ")} and surrounding markets.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/estimate" className="btn btn-primary btn-lg">Build Your 3D Estimate</Link>
              <a href={`tel:${site.phoneHref}`} className="btn btn-secondary btn-lg">Call {site.phone}</a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <Stars rating={reviewSummary.rating} />
                <span><strong className="text-brand-900">{reviewSummary.rating.toFixed(1)}</strong> on Google</span>
              </span>
              <span className="flex items-center gap-1.5"><Check /> Licensed &amp; insured</span>
              <span className="flex items-center gap-1.5"><Check /> Free estimates</span>
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-slate-200">
              <Photo
                src="/images/hero.jpg"
                alt="Modern home with a freshly installed charcoal architectural shingle roof by T&S Roofing Systems"
                fill
                preload
                fetchPriority="high"
                sizes="(min-width: 1024px) 600px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-lg sm:left-6">
              <p className="font-heading text-2xl font-extrabold text-brand-900">25-year</p>
              <p className="text-sm text-slate-600">workmanship warranty</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Company highlights" className="border-y border-slate-200 bg-white">
        <dl className="container-x grid grid-cols-2 gap-6 py-8 text-center lg:grid-cols-4">
          {site.stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-heading text-3xl font-extrabold text-brand-900">{s.value}</dd>
              <dd className="mt-1 text-sm text-slate-600" aria-hidden="true">{s.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Services */}
      <section className="section" aria-labelledby="services-heading">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">What we do</p>
            <h2 id="services-heading" className="mt-3 text-3xl font-extrabold sm:text-4xl">Roofing &amp; exterior services for every need</h2>
            <p className="mt-4 text-slate-600">From a small leak repair to a full roof replacement or custom fence, one expert team handles it all.</p>
          </div>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.slug}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <Photo
                      src={s.image}
                      alt={s.imageAlt}
                      fill
                      loading="lazy"
                      sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-bold">{s.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-slate-600">{s.short}</p>
                    <Link href={`/services#${s.slug}`} className="mt-4 text-sm font-bold text-accent-700 hover:underline">
                      Learn more<span className="sr-only"> about {s.title}</span> →
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/products/roofing" className="btn btn-secondary">
              Compare Roofing Systems
            </Link>
            <Link href="/products/fencing" className="btn btn-secondary">
              Explore Custom Fencing
            </Link>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="section bg-slate-50" aria-labelledby="why-heading">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl ring-1 ring-slate-200">
            <Photo
              src="/images/residential.jpg"
              alt="T&S Roofing Systems crew completing a precision architectural shingle installation"
              fill
              loading="lazy"
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow">Why {site.shortName}</p>
            <h2 id="why-heading" className="mt-3 text-3xl font-extrabold sm:text-4xl">A roofing partner you can rely on</h2>
            <p className="mt-4 text-slate-600">
              Since {site.foundingYear}, we’ve built our reputation on quality workmanship and treating every home
              and business as if it were our own.
            </p>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {whyUs.map((w) => (
                <li key={w.title} className="flex gap-3">
                  <Check />
                  <div>
                    <h3 className="text-base font-bold">{w.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{w.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section" aria-labelledby="process-heading">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 id="process-heading" className="mt-3 text-3xl font-extrabold sm:text-4xl">Simple, stress-free process</h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((p, i) => (
              <li key={p.title} className="relative rounded-2xl border border-slate-200 bg-white p-6">
                <span className="grid size-10 place-items-center rounded-full bg-brand-900 font-heading text-lg font-extrabold text-white" aria-hidden="true">{i + 1}</span>
                <h3 className="mt-4 text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{p.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <Link href="/how-it-works" className="text-sm font-bold text-brand-900 underline decoration-accent-600 decoration-2 underline-offset-4 hover:text-accent-700">
              See our full 4-step process &amp; permitting details →
            </Link>
          </div>
        </div>
      </section>

      <GoogleReviews />

      {/* Service areas */}
      <section className="section" aria-labelledby="areas-heading">
        <div className="container-x text-center">
          <p className="eyebrow">Service areas</p>
          <h2 id="areas-heading" className="mt-3 text-3xl font-extrabold sm:text-4xl">Proudly serving our communities</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Explore climate-engineered roofing and fencing specs, popular local finishes, and ZIP code coverage in your area.
          </p>
          <ul className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-3">
            {SERVICE_AREAS.map((area) => (
              <li key={area.slug}>
                <Link
                  href={`/service-areas/${area.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-brand-900 transition-colors hover:border-accent-600 hover:bg-orange-50/50 hover:text-accent-700"
                >
                  <span>{area.name}</span>
                  <span className="text-xs text-slate-500">({area.state})</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Link href="/service-areas" className="text-sm font-bold text-accent-700 hover:underline">
              Check your 5-digit ZIP code coverage →
            </Link>
          </div>
        </div>
      </section>

      {/* Featured homeowner guides */}
      <section className="section border-t border-slate-200 bg-slate-50" aria-labelledby="guides-heading">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Homeowner resources</p>
              <h2 id="guides-heading" className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Latest roofing &amp; fencing guides
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-sm font-bold text-brand-900 underline decoration-accent-600 decoration-2 underline-offset-4 hover:text-accent-700"
            >
              Read all guides →
            </Link>
          </div>

          <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {BLOG_POSTS.map((post) => (
              <li key={post.slug}>
                <article className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-shadow hover:shadow-md">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-brand-900">{post.category}</span>
                      <span className="text-slate-500">{post.readMinutes} min read</span>
                    </div>
                    <h3 className="mt-3 text-base font-extrabold leading-snug">
                      <Link href={`/blog/${post.slug}`} className="hover:text-accent-700">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">{post.excerpt}</p>
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-4 inline-block text-xs font-bold text-accent-700 hover:underline"
                  >
                    Read guide<span className="sr-only">: {post.title}</span> →
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Faq />
      <CtaBand />
      <JsonLd
        data={[
          webPageSchema({
            name: `${site.name} — Residential & Commercial Roofing & Custom Fencing`,
            description: site.description,
            path: "/",
          }),
          howToSchema({
            name: `How to replace your roof or install a custom fence with ${site.name}`,
            description: "Our 4-step inspection, written quote, certified installation, and final walkthrough process.",
            path: "/how-it-works",
            steps: processSteps.map((p) => ({ name: p.title, text: p.text })),
          }),
          faqSchema(),
        ]}
      />
    </>
  );
}
