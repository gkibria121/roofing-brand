"use client";

import { useId, useState } from "react";
import { getCallouts, getPackages } from "@/lib/estimate/packages";
import { labelFor, materialLabels, steps, type Answers, type StepId } from "@/lib/estimate/questions";
import { site } from "@/lib/site";

type Props = {
  answers: Partial<Answers>;
  onEditStep: (stepId: StepId) => void;
  onStartOver: () => void;
};

export function PackagesResult({ answers, onEditStep, onStartOver }: Props) {
  const packages = getPackages(answers);
  const callouts = getCallouts(answers);
  const desired = answers.desiredType ?? (answers.slope === "flat" ? "tpo" : "asphalt");
  const recommendedName = packages.find((p) => p.recommended)?.name ?? packages[0]?.name ?? "Signature";

  const [selectedPkg, setSelectedPkg] = useState(recommendedName);
  const [sent, setSent] = useState(false);
  const uid = useId();

  function onSubmitContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const fd = new FormData(form);
    const lines = [
      `Selected package: ${selectedPkg} (${materialLabels[desired]})`,
      `Name: ${fd.get("name")}`,
      `Phone: ${fd.get("phone")}`,
      `Email: ${fd.get("email")}`,
      "",
      "--- Property & Questionnaire Summary ---",
      ...steps.map((s) => `${s.summaryLabel}: ${labelFor(s, answers)}`),
    ];
    const subject = `3D Roof Estimate Request — ${selectedPkg} (${materialLabels[desired]})`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    setSent(true);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Step complete · Matching packages</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              Your recommended {materialLabels[desired]} roofing packages
            </h2>
            <p className="mt-2 text-slate-600">
              Tailored to your{" "}
              <strong className="text-brand-900">
                {answers.stories === "multiple" ? "multi-story" : "single-story"}{" "}
                {answers.buildingType ?? "residential"}
              </strong>{" "}
              property. Exact pricing is confirmed after our free on-site inspection.
            </p>
          </div>
          <button type="button" onClick={onStartOver} className="btn btn-secondary text-sm">
            Start over
          </button>
        </div>

        {/* Packages */}
        <fieldset className="mt-6 border-0 p-0">
          <legend className="text-sm font-bold text-brand-900">Choose a package to include in your free estimate:</legend>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {packages.map((pkg) => {
              const checked = selectedPkg === pkg.name;
              const id = `${uid}-pkg-${pkg.name}`;
              return (
                <label
                  key={pkg.name}
                  htmlFor={id}
                  className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-5 transition-all ${
                    checked
                      ? "border-accent-600 bg-brand-50/40 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    id={id}
                    type="radio"
                    name="packageTier"
                    value={pkg.name}
                    checked={checked}
                    onChange={() => setSelectedPkg(pkg.name)}
                    className="sr-only"
                  />
                  {pkg.recommended && (
                    <span className="mb-3 inline-flex w-fit rounded-full bg-accent-600 px-2.5 py-0.5 text-xs font-bold text-white">
                      Most popular
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-xl font-extrabold text-brand-900">{pkg.name}</span>
                    <span
                      aria-hidden="true"
                      className={`grid size-5 place-items-center rounded-full border-2 ${
                        checked ? "border-accent-600 bg-accent-600 text-white" : "border-slate-300"
                      }`}
                    >
                      {checked && (
                        <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m3 8 3.2 3.2L13 4.5" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{pkg.tagline}</p>
                  <ul className="mt-4 flex-1 space-y-2 border-t border-slate-200/80 pt-4 text-sm text-slate-700">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <svg className="mt-0.5 size-4 shrink-0 text-accent-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                          <path d="m5 12 5 5L20 7" />
                        </svg>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-brand-700">
                    Free written quote on site
                  </p>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Tailored project callouts */}
        {callouts.length > 0 && (
          <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/70 p-5">
            <h3 className="text-base font-bold text-brand-900">Included based on your answers</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {callouts.map((c) => (
                <li key={c.title} className="rounded-xl bg-white p-3.5 shadow-xs ring-1 ring-slate-200/70">
                  <p className="text-sm font-bold text-brand-900">{c.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{c.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Contact capture to book free inspection */}
      <form
        onSubmit={onSubmitContact}
        aria-labelledby={`${uid}-contact-h`}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <h3 id={`${uid}-contact-h`} className="text-xl font-extrabold">
          Schedule your free on-site inspection ({selectedPkg} · {materialLabels[desired]})
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          We’ll bring samples, verify measurements and send your itemized written quote — zero obligation.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor={`${uid}-name`} className="block text-sm font-semibold text-slate-800">
              Full name <span className="text-accent-700" aria-hidden="true">*</span>
            </label>
            <input
              id={`${uid}-name`}
              name="name"
              type="text"
              required
              autoComplete="name"
              enterKeyHint="next"
              className="field-control mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:border-brand-700"
            />
          </div>
          <div>
            <label htmlFor={`${uid}-phone`} className="block text-sm font-semibold text-slate-800">
              Phone <span className="text-accent-700" aria-hidden="true">*</span>
            </label>
            <input
              id={`${uid}-phone`}
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              enterKeyHint="next"
              className="field-control mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:border-brand-700"
            />
          </div>
          <div>
            <label htmlFor={`${uid}-email`} className="block text-sm font-semibold text-slate-800">
              Email <span className="text-accent-700" aria-hidden="true">*</span>
            </label>
            <input
              id={`${uid}-email`}
              name="email"
              type="email"
              required
              autoComplete="email"
              enterKeyHint="done"
              className="field-control mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:border-brand-700"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary btn-lg">
            Request {selectedPkg} Estimate
          </button>
          <a href={`tel:${site.phoneHref}`} className="btn btn-secondary btn-lg">
            Call {site.phone}
          </a>
        </div>
        <p role="status" className="mt-3 text-sm text-slate-600">
          {sent
            ? "Your email app should now be open with your full 3D roof summary — press send to finish."
            : "We respond within one business day."}
        </p>
      </form>

      {/* Editable answers summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-lg font-extrabold">Your answers</h3>
        <dl className="mt-4 divide-y divide-slate-100">
          {steps.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <div>
                <dt className="font-semibold text-slate-600">{s.summaryLabel}</dt>
                <dd className="mt-0.5 font-medium text-brand-900">{labelFor(s, answers)}</dd>
              </div>
              <button
                type="button"
                onClick={() => onEditStep(s.id)}
                className="shrink-0 rounded-md px-3 py-1.5 text-xs font-bold text-accent-700 hover:bg-brand-50"
              >
                Edit<span className="sr-only"> {s.summaryLabel}</span>
              </button>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
