"use client";

import { useId, useState } from "react";
import { getFenceFinish, getFenceStyle } from "@/lib/estimate/fences";
import { getCallouts, getFencePackages, getPackages, type Tier } from "@/lib/estimate/packages";
import {
  getStepsForServices,
  labelFor,
  materialLabels,
  type Answers,
  type ServiceId,
  type StepId,
} from "@/lib/estimate/questions";
import { site } from "@/lib/site";

type Props = {
  services: ServiceId[];
  answers: Partial<Answers>;
  onEditStep: (stepId: StepId) => void;
  onBackToDecorate: () => void;
  onStartOver: () => void;
};

function TierList({
  name,
  legend,
  tiers,
  selected,
  onSelect,
  uid,
}: {
  name: string;
  legend: string;
  tiers: Tier[];
  selected: string;
  onSelect: (tierName: string) => void;
  uid: string;
}) {
  return (
    <fieldset className="mt-6 border-0 p-0">
      <legend className="text-sm font-bold text-brand-900">{legend}</legend>
      <div className="mt-3.5 space-y-3.5">
        {tiers.map((pkg) => {
          const checked = selected === pkg.name;
          const id = `${uid}-${name}-${pkg.name}`;
          return (
            <div key={pkg.name} className="relative">
              <input
                id={id}
                type="radio"
                name={name}
                value={pkg.name}
                checked={checked}
                onChange={() => onSelect(pkg.name)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={`block cursor-pointer rounded-2xl border-2 p-5 transition-all peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-600 ${
                  checked
                    ? "border-accent-600 bg-orange-50/35 shadow-sm ring-2 ring-accent-600/15"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                        checked
                          ? "border-accent-600 bg-accent-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {checked && (
                        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m3 8 3.2 3.2L13 4.5" />
                        </svg>
                      )}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-lg font-extrabold text-brand-900 sm:text-xl">
                          {pkg.name}
                        </span>
                        {pkg.recommended && (
                          <span className="inline-flex items-center rounded-full bg-brand-900 px-2.5 py-0.5 text-xs font-bold text-white">
                            Most popular
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600">{pkg.tagline}</p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      checked ? "bg-accent-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {checked ? "Selected" : "Free on-site quote"}
                  </span>
                </div>

                <ul className="mt-4 grid gap-x-5 gap-y-2 border-t border-slate-200/80 pt-3.5 text-sm text-slate-700 sm:grid-cols-2">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <svg className="mt-0.5 size-4 shrink-0 text-accent-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PackagesResult({ services, answers, onEditStep, onBackToDecorate, onStartOver }: Props) {
  const hasRoof = services.includes("roofing");
  const hasFence = services.includes("fencing");

  const roofPackages = getPackages(answers);
  const fencePackages = getFencePackages(answers);
  const callouts = getCallouts(answers, services);
  const activeSteps = getStepsForServices(services);

  const desiredRoof = answers.desiredType ?? (answers.slope === "flat" ? "tpo" : "asphalt");
  const fenceStyle = getFenceStyle(answers.fenceStyle);
  const fenceFinish = getFenceFinish(fenceStyle.id, answers.fenceFinish);

  const [selectedRoofPkg, setSelectedRoofPkg] = useState(
    roofPackages.find((p) => p.recommended)?.name ?? roofPackages[0]?.name ?? "Signature",
  );
  const [selectedFencePkg, setSelectedFencePkg] = useState(
    fencePackages.find((p) => p.recommended)?.name ?? fencePackages[0]?.name ?? "Signature",
  );
  const [sent, setSent] = useState(false);
  const uid = useId();

  const summaryTitle =
    hasRoof && hasFence
      ? `${materialLabels[desiredRoof]} Roof + ${fenceStyle.label} Fence`
      : hasFence
        ? `${fenceStyle.label} (${fenceFinish.label}) Fencing`
        : `${materialLabels[desiredRoof]} Roofing`;

  const selectedSummary = [
    hasRoof ? `${selectedRoofPkg} ${materialLabels[desiredRoof]} Roof` : null,
    hasFence ? `${selectedFencePkg} ${fenceStyle.label} Fence` : null,
  ]
    .filter(Boolean)
    .join(" + ");

  function onSubmitContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const fd = new FormData(form);
    const lines = [
      `Services requested: ${services.map((s) => (s === "roofing" ? "Roofing" : "Fencing")).join(" + ")}`,
      `Selected package(s): ${selectedSummary}`,
      `Name: ${fd.get("name")}`,
      `Phone: ${fd.get("phone")}`,
      `Email: ${fd.get("email")}`,
      "",
      "--- 3D Configuration Summary ---",
      ...activeSteps.map((s) => `${s.summaryLabel}: ${labelFor(s, answers)}`),
    ];
    const subject = `3D Exterior Estimate Request — ${selectedSummary}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    setSent(true);
  }

  return (
    <div className="space-y-8">
      {/* Matching Packages Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Matching packages</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              Your recommended {summaryTitle} packages
            </h2>
            <p className="mt-2 text-slate-600">
              Tailored to your{" "}
              <strong className="text-brand-900">
                {answers.stories === "multiple" ? "multi-story" : "single-story"}{" "}
                {answers.buildingType ?? "residential"}
              </strong>{" "}
              property. Exact pricing is confirmed after our free on-site measurement &amp; inspection.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onBackToDecorate} className="btn btn-secondary text-sm">
              Adjust 3D design
            </button>
            <button type="button" onClick={onStartOver} className="btn btn-secondary text-sm">
              Start over
            </button>
          </div>
        </div>

        {hasRoof && (
          <TierList
            name="roofPackageTier"
            legend={`Choose ${/^[aeiou]/i.test(materialLabels[desiredRoof]) ? "an" : "a"} ${materialLabels[desiredRoof]} roofing package:`}
            tiers={roofPackages}
            selected={selectedRoofPkg}
            onSelect={setSelectedRoofPkg}
            uid={uid}
          />
        )}

        {hasFence && (
          <TierList
            name="fencePackageTier"
            legend={`Choose ${/^[aeiou]/i.test(fenceStyle.label) ? "an" : "a"} ${fenceStyle.label} (${fenceFinish.label}) fencing package:`}
            tiers={fencePackages}
            selected={selectedFencePkg}
            onSelect={setSelectedFencePkg}
            uid={uid}
          />
        )}

        {/* Tailored project callouts */}
        {callouts.length > 0 && (
          <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/70 p-5">
            <h3 className="text-base font-bold text-brand-900">Included based on your design</h3>
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
          Schedule your free on-site estimate ({selectedSummary})
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          We’ll bring material &amp; color samples, verify exact measurements on site, and send your itemized written quote.
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
            Request Free Estimate
          </button>
          <a href={`tel:${site.phoneHref}`} className="btn btn-secondary btn-lg">
            Call {site.phone}
          </a>
        </div>
        <p role="status" className="mt-3 text-sm text-slate-600">
          {sent
            ? "Your email app should now be open with your full 3D summary — press send to finish."
            : "We respond within one business day."}
        </p>
      </form>

      {/* Editable answers summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-lg font-extrabold">Your 3D selections</h3>
        <dl className="mt-4 divide-y divide-slate-100">
          {activeSteps.map((s) => (
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
