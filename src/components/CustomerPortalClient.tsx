"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { z } from "zod";
import { site } from "@/lib/site";

const PortalLoginSchema = z.object({
  email: z.string().trim().pipe(z.email("Please enter the email address associated with your project.")),
  projectCode: z
    .string()
    .trim()
    .min(4, "Please enter your project code (for example TS-2026-4812).")
    .max(32, "Project code is too long."),
});

const DEMO_PROJECT = {
  code: "TS-2026-4812",
  customerName: "Jordan Alvarez",
  email: "jordan.alvarez@example.com",
  address: "1010 Towne House Ln, Richardson, TX 75081",
  manager: "Marcus Torres · Senior Project Manager",
  installWindow: "Thursday, Nov 26 – Friday, Nov 27 · 8:00 AM",
  estimateTotal: "$23,460",
  items: [
    {
      title: "2,000 sq ft · Standing-Seam Metal Roof (Signature)",
      detail: "Concealed-fastener panels · High-temp underlayment · Solar-ready clamps",
      status: "Materials staged",
    },
    {
      title: "140 ft · Wood Privacy Fence (Signature)",
      detail: "6 ft Western Red Cedar · Natural Cedar stain · Matching walk & driveway gates",
      status: "Scheduled after roof tear-off",
    },
  ],
  milestones: [
    { label: "3D Estimate & Proposal Approved", date: "Nov 12", done: true },
    { label: "On-Site Laser Measurement & Utility Locate", date: "Nov 15", done: true },
    { label: "Materials Ordered & Staged", date: "Nov 19", done: true },
    { label: "Roof & Fence Installation", date: "Nov 26–27", done: false, current: true },
    { label: "Final Walkthrough & 25-Yr Warranty Issued", date: "Nov 28", done: false },
  ],
  documents: [
    { name: "Approved Itemized Proposal (TS-2026-4812).pdf", meta: "Signed · 412 KB" },
    { name: "HOA Material & Color Submittal Packet.pdf", meta: "Approved · 1.8 MB" },
    { name: "25-Year Workmanship Warranty Specimen.pdf", meta: "Pending completion · 220 KB" },
  ],
};

export function CustomerPortalClient({ sidebarSlot }: { sidebarSlot?: ReactNode } = {}) {
  const uid = useId();
  const [email, setEmail] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSession, setActiveSession] = useState<typeof DEMO_PROJECT | null>(null);
  const [pmMessage, setPmMessage] = useState("");
  const [pmSent, setPmSent] = useState(false);

  function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = PortalLoginSchema.safeParse({ email, projectCode });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      const firstBad = Object.keys(next)[0];
      if (firstBad) {
        (form.elements.namedItem(firstBad) as HTMLElement | null)?.focus();
      }
      return;
    }
    setErrors({});
    setActiveSession({
      ...DEMO_PROJECT,
      code: parsed.data.projectCode.toUpperCase(),
      email: parsed.data.email,
    });
  }

  function openDemoDashboard() {
    setErrors({});
    setActiveSession(DEMO_PROJECT);
  }

  function handleSendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pmMessage.trim().length < 3 || !activeSession) return;
    const subject = `Customer Portal Message — Project ${activeSession.code}`;
    window.location.assign(
      `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        `Project: ${activeSession.code}\nAddress: ${activeSession.address}\nFrom: ${activeSession.email}\n\n${pmMessage.trim()}`,
      )}`,
    );
    setPmSent(true);
    setPmMessage("");
  }

  if (activeSession) {
    return (
      <div className="space-y-6">
        {/* Session top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-brand-900 p-6 text-white shadow-md">
          <div>
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-400">
              Project {activeSession.code} · Active
            </span>
            <h2 className="mt-2.5 text-2xl font-extrabold text-white">{activeSession.address}</h2>
            <p className="mt-1 text-sm text-slate-200">
              {activeSession.manager} · Install window: <strong>{activeSession.installWindow}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/estimate" className="btn btn-primary text-sm">
              + Add 3D Config
            </Link>
            <button
              type="button"
              onClick={() => {
                setActiveSession(null);
                setPmSent(false);
              }}
              className="btn border border-white/25 bg-white/10 text-sm text-white hover:bg-white/20"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Milestones + Scope */}
          <div className="space-y-6 lg:col-span-7">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-brand-900">Project progress timeline</h3>
              <ol className="mt-5 space-y-4">
                {activeSession.milestones.map((m) => (
                  <li key={m.label} className="flex items-start gap-3.5">
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                        m.done
                          ? "bg-emerald-600 text-white"
                          : m.current
                            ? "bg-accent-600 text-white ring-4 ring-orange-100"
                            : "border-2 border-slate-300 bg-white text-slate-400"
                      }`}
                    >
                      {m.done ? "✓" : "•"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className={`text-sm font-bold ${m.done || m.current ? "text-brand-900" : "text-slate-500"}`}>
                          {m.label}
                        </p>
                        <span className="text-xs font-semibold text-slate-500">{m.date}</span>
                      </div>
                      {m.current && (
                        <p className="mt-1 text-xs font-semibold text-accent-700">
                          Up next — crew arrives at 8:00 AM; roof tear-off completes before fence crew sets posts.
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-lg font-extrabold text-brand-900">Approved scope &amp; quote</h3>
                <span className="text-lg font-extrabold text-brand-900">{activeSession.estimateTotal}</span>
              </div>
              <ul className="mt-4 space-y-3">
                {activeSession.items.map((item) => (
                  <li key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-extrabold text-brand-900">{item.title}</p>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-brand-700 shadow-xs">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Documents + Direct PM message */}
          <div className="space-y-6 lg:col-span-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-brand-900">Documents &amp; warranties</h3>
              <ul className="mt-4 space-y-2.5">
                {activeSession.documents.map((doc) => (
                  <li
                    key={doc.name}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-brand-900">{doc.name}</p>
                      <p className="text-[11px] text-slate-500">{doc.meta}</p>
                    </div>
                    <span className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-brand-900">
                      PDF
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-brand-900">Message your project manager</h3>
              <p className="mt-1 text-xs text-slate-600">
                Have gate access notes or schedule questions? Send a direct note to {activeSession.manager.split(" · ")[0]}.
              </p>
              <form onSubmit={handleSendMessage} className="mt-4 space-y-3">
                <label htmlFor={`${uid}-pm-msg`} className="sr-only">
                  Message to project manager
                </label>
                <textarea
                  id={`${uid}-pm-msg`}
                  rows={3}
                  required
                  value={pmMessage}
                  onChange={(e) => {
                    setPmMessage(e.target.value);
                    if (pmSent) setPmSent(false);
                  }}
                  placeholder="Write a message about gate codes, pets, material delivery, or timing…"
                  className="field-control block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-brand-900 focus:border-brand-700"
                />
                <button type="submit" className="btn btn-primary w-full text-sm">
                  Send message
                </button>
                {pmSent && (
                  <p role="status" className="text-xs font-semibold text-emerald-700">
                    Message composed in your email app for {activeSession.code}.
                  </p>
                )}
              </form>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-12">
      <form
        onSubmit={handleSignIn}
        noValidate
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md sm:p-8 lg:col-span-6"
      >
        <h2 className="text-2xl font-extrabold text-brand-900">Sign in to your project</h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Enter the email address on your estimate and your project code to check status, schedules, and warranty documents.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor={`${uid}-email`} className="block text-sm font-bold text-brand-900">
              Email address <span className="text-accent-700" aria-hidden="true">*</span>
            </label>
            <input
              id={`${uid}-email`}
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: "" }));
              }}
              placeholder="you@example.com"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? `${uid}-email-err` : undefined}
              className="field-control mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-brand-900 focus:border-brand-700"
            />
            {errors.email && (
              <p id={`${uid}-email-err`} className="mt-1 text-xs font-medium text-red-700">
                <span role="img" aria-label="Error">⚠</span> {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${uid}-code`} className="block text-sm font-bold text-brand-900">
              Project code <span className="text-accent-700" aria-hidden="true">*</span>
            </label>
            <input
              id={`${uid}-code`}
              name="projectCode"
              type="text"
              required
              autoComplete="off"
              value={projectCode}
              onChange={(e) => {
                setProjectCode(e.target.value);
                if (errors.projectCode) setErrors((p) => ({ ...p, projectCode: "" }));
              }}
              placeholder="e.g. TS-2026-4812"
              aria-invalid={errors.projectCode ? "true" : "false"}
              aria-describedby={errors.projectCode ? `${uid}-code-err` : undefined}
              className="field-control mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm uppercase text-brand-900 placeholder:normal-case focus:border-brand-700"
            />
            {errors.projectCode && (
              <p id={`${uid}-code-err`} className="mt-1 text-xs font-medium text-red-700">
                <span role="img" aria-label="Error">⚠</span> {errors.projectCode}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full">
            Access Customer Portal
          </button>

          <div className="relative py-2 text-center">
            <span className="relative z-10 bg-white px-3 text-xs font-semibold text-slate-400">or preview now</span>
            <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
          </div>

          <button type="button" onClick={openDemoDashboard} className="btn btn-secondary w-full">
            Explore Sample Customer Dashboard →
          </button>
        </div>
      </form>

      {sidebarSlot && <div className="space-y-5 lg:col-span-6">{sidebarSlot}</div>}
    </div>
  );
}
