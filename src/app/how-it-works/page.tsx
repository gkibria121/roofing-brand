import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { breadcrumbSchema, faqSchema, howToSchema, webPageSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

const howItWorksDescription = `See how ${site.name} takes your roofing or custom fencing project from instant ZIP-based 3D design to free on-site measurement, HOA permitting, and licensed 1–3 day installation.`;

export const metadata: Metadata = buildPageMetadata({
  title: "How It Works — From 3D Quote to Finished Install",
  description: howItWorksDescription,
  path: "/how-it-works",
  keywords: [
    "roof replacement process",
    "how 3D roof estimator works",
    "free roof inspection process",
    "HOA roofing approval packet",
    "roof and fence installation timeline",
  ],
});

const STEPS = [
  {
    number: "01",
    title: "Enter your ZIP code & select your address",
    duration: "30 seconds",
    description:
      "Start with your 5-digit ZIP code and pick your property address. We match local climate guidelines, typical lot layout, and regional material availability immediately.",
    highlights: ["No account or credit card required", "Supports residential & commercial properties", "Instant local service-area verification"],
  },
  {
    number: "02",
    title: "Design your roof & fence live in 3D",
    duration: "2–3 minutes",
    description:
      "Combine roofing, custom fencing, or both in one interactive 3D model. Compare roof slopes, standing-seam metal vs. architectural shingles, solar panels, 6 fence styles, finishes, heights, and gates.",
    highlights: ["Save multiple configurations in one quote", "Adjust square footage or linear feet live", "Share your 3D design link with family or HOA"],
  },
  {
    number: "03",
    title: "Free on-site measurement & written proposal",
    duration: "Within 24–48 hours",
    description:
      "A licensed project specialist visits your home to verify exact roof pitch, decking condition, fence property lines, grade changes, and utility locates—delivering a locked-in written quote.",
    highlights: ["Photo-documented roof & perimeter inspection", "HOA packet & municipal permit assistance", "Clear line-item pricing with zero surprise fees"],
  },
  {
    number: "04",
    title: "Expert installation, cleanup & warranty",
    duration: "1–3 days on site",
    description:
      "Our vetted crews complete roof tear-off before fence installation so heavy equipment never risks damaging new boards or posts, followed by magnetic nail sweeps and a final walkthrough.",
    highlights: ["Track every milestone in your Customer Portal", "Full property protection & spotless cleanup", "Backed by up to a 25-year workmanship warranty"],
  },
] as const;

const FAQS = [
  {
    question: "How accurate is the online 3D estimate?",
    answer:
      "Our online estimate uses current material and installation rates per square foot and linear foot so you have a realistic planning budget right away. After our free on-site measurement, we lock in a firm written contract price.",
  },
  {
    question: "Can I quote both a roof replacement and a new fence together?",
    answer:
      "Yes! Select both Roofing and Fencing in the 3D configurator—or click '+ Add a config' on the quote screen—to bundle multiple sections under one project manager and coordinated schedule.",
  },
  {
    question: "Do you handle permits, utility locates, and HOA approvals?",
    answer:
      "Yes. We coordinate utility locates before digging fence post holes, prepare municipal permits, and provide color/spec sheets formatted for HOA review boards.",
  },
  {
    question: "How can I track my project after approving the quote?",
    answer:
      "Every homeowner receives access to the Customer Portal with live milestone updates, inspection photos, scheduled installation dates, and digital warranty certificates.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        eyebrow="Simple 4-Step Process"
        title="How T&S Roofing Systems works"
        intro="From instant ZIP-based 3D design to spotless installation and warranty protection—transparent at every milestone."
        crumbs={[{ name: "How it works" }]}
        currentPath="/how-it-works"
      />

      <section className="section" aria-label="4 step process">
        <div className="container-x">
          <ol className="space-y-6">
            {STEPS.map((step) => (
              <li
                key={step.number}
                className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:grid-cols-12 md:items-start"
              >
                <div className="md:col-span-3">
                  <span
                    className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-900 font-heading text-lg font-extrabold text-white"
                    aria-hidden="true"
                  >
                    {step.number}
                  </span>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-accent-700">{step.duration}</p>
                </div>
                <div className="md:col-span-9">
                  <h2 className="text-2xl font-extrabold">{step.title}</h2>
                  <p className="mt-2.5 text-slate-600">{step.description}</p>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                    {step.highlights.map((h) => (
                      <li
                        key={h}
                        className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-brand-900"
                      >
                        <span className="text-accent-600" aria-hidden="true">✓</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/estimate" className="btn btn-primary btn-lg">
              Start Step 1: Enter Your ZIP Code →
            </Link>
            <Link href="/portal" className="btn btn-secondary btn-lg">
              Preview Customer Portal
            </Link>
          </div>
        </div>
      </section>

      <Faq
        items={FAQS}
        eyebrow="Process FAQ"
        title="Common questions about our process"
        intro="Everything you need to know about online 3D pricing, HOA packets, permitting, and project tracking."
        headingId="process-faq-heading"
        className="section border-t border-slate-200 bg-slate-50"
      />

      <CtaBand
        title="Ready to see your property in 3D?"
        text="Enter your ZIP code, pick your address, and customize your roof or fence with instant pricing."
      />
      <JsonLd
        data={[
          webPageSchema({
            name: `How ${site.name} Works`,
            description: howItWorksDescription,
            path: "/how-it-works",
          }),
          howToSchema({
            name: `How to Design & Install a New Roof or Fence with ${site.name}`,
            description: howItWorksDescription,
            path: "/how-it-works",
            steps: STEPS.map((s) => ({ name: s.title, text: s.description })),
          }),
          faqSchema(FAQS),
          breadcrumbSchema([{ name: "How it works", path: "/how-it-works" }]),
        ]}
      />
    </>
  );
}
