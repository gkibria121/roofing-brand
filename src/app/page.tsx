import Link from "next/link";
import { Photo } from "@/components/Photo";
import { GoogleReviews } from "@/components/GoogleReviews";
import { Faq } from "@/components/Faq";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { Stars } from "@/components/Stars";
import { faqSchema } from "@/lib/schema";
import { processSteps, services } from "@/lib/services";
import { reviewSummary } from "@/lib/reviews";
import { site } from "@/lib/site";

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
            <p className="eyebrow">Residential &amp; commercial roofing</p>
            <h1 id="hero-heading" className="mt-4 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
              Roofing you can trust, <span className="text-accent-600">built to last.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              {site.name} installs, repairs and replaces roofs with honest pricing, expert crews and warranties we
              stand behind. Serving {site.serviceAreas.slice(0, 2).join(", ")} and surrounding areas.
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
                alt="Modern home with a freshly installed charcoal shingle roof"
                fill
                priority
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
            <h2 id="services-heading" className="mt-3 text-3xl font-extrabold sm:text-4xl">Roofing services for every need</h2>
            <p className="mt-4 text-slate-600">From a small repair to a full replacement, one expert team handles it all.</p>
          </div>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.slug}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <Photo
                      src={s.image}
                      alt=""
                      fill
                      loading="lazy"
                      sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
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
        </div>
      </section>

      {/* Why us */}
      <section className="section bg-slate-50" aria-labelledby="why-heading">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl ring-1 ring-slate-200">
            <Photo
              src="/images/residential.jpg"
              alt="T&S Roofing crew installing shingles on a residential roof"
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
        </div>
      </section>

      <GoogleReviews />

      {/* Service area */}
      <section className="section" aria-labelledby="areas-heading">
        <div className="container-x text-center">
          <p className="eyebrow">Service area</p>
          <h2 id="areas-heading" className="mt-3 text-3xl font-extrabold sm:text-4xl">Proudly serving our community</h2>
          <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
            {site.serviceAreas.map((a) => (
              <li key={a} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-brand-900">{a}</li>
            ))}
          </ul>
        </div>
      </section>

      <Faq />
      <CtaBand />
      <JsonLd data={faqSchema()} />
    </>
  );
}
