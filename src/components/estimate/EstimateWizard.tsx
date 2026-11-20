"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getFenceFinish, getFenceStyle } from "@/lib/estimate/fences";
import {
  applyAnswer,
  getStepsForServices,
  isAnswered,
  type Answers,
  type ServiceId,
  type StepId,
} from "@/lib/estimate/questions";
import { deriveScene, type PreviewMode } from "@/lib/estimate/sceneConfig";
import { HouseViewerLazy } from "./HouseViewerLazy";
import { LiveDecorator } from "./LiveDecorator";
import { OptionVisual } from "./OptionVisual";
import { PackagesResult } from "./PackagesResult";

const NEW_ROOF_STEPS = new Set<StepId>(["desiredType", "solar"]);
const SERVICE_META: { id: ServiceId; label: string; subtitle: string }[] = [
  { id: "roofing", label: "Roofing", subtitle: "Slope, materials & solar" },
  { id: "fencing", label: "Fencing", subtitle: "Styles, colors & gates" },
];

type Mode = "guided" | "decorate";

export function EstimateWizard() {
  const uid = useId();
  const [services, setServices] = useState<ServiceId[]>(["roofing"]);
  const [mode, setMode] = useState<Mode>("guided");
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [editingFromResults, setEditingFromResults] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("current");
  const [error, setError] = useState<string | null>(null);
  const [serviceNotice, setServiceNotice] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const headingRef = useRef<HTMLElement | null>(null);
  const firstRadioRef = useRef<HTMLInputElement | null>(null);
  const guidedTabRef = useRef<HTMLButtonElement | null>(null);
  const decorateTabRef = useRef<HTMLButtonElement | null>(null);
  const didMountRef = useRef(false);

  const activeSteps = useMemo(() => getStepsForServices(services), [services]);
  const safeIndex = Math.min(stepIndex, Math.max(0, activeSteps.length - 1));
  const step = activeSteps[safeIndex];
  const hasRoof = services.includes("roofing");
  const hasFence = services.includes("fencing");

  const allRequiredAnswered = useMemo(
    () => activeSteps.every((s) => isAnswered(s, answers)),
    [activeSteps, answers],
  );

  const canCompare =
    hasRoof &&
    (showResults ||
      mode === "decorate" ||
      answers.desiredType !== undefined ||
      (step && NEW_ROOF_STEPS.has(step.id)));

  const { config, badges } = useMemo(
    () => deriveScene(answers, previewMode, services),
    [answers, previewMode, services],
  );

  // Move focus to the new step heading when navigating between guided steps or results.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (mode === "guided" || showResults) {
      headingRef.current?.focus();
    }
  }, [safeIndex, showResults, mode]);

  function announce(msg: string) {
    setAnnouncement("");
    window.setTimeout(() => setAnnouncement(msg), 50);
  }

  function toggleService(id: ServiceId) {
    setServiceNotice(null);
    setError(null);
    setServices((prev) => {
      const exists = prev.includes(id);
      if (exists && prev.length === 1) {
        setServiceNotice("Keep at least one service selected to design your 3D property.");
        announce("Keep at least one service selected.");
        return prev;
      }
      const next: ServiceId[] = exists ? prev.filter((s) => s !== id) : [...prev, id];
      const nextSteps = getStepsForServices(next);
      // Keep user on a valid step index if the list shrank or grew.
      setStepIndex((cur) => {
        if (!exists && id === "fencing" && prev.length === 1 && showResults) return cur;
        return Math.min(cur, Math.max(0, nextSteps.length - 1));
      });
      if (!exists && id === "fencing") {
        // Seed sensible default fence answers so switching to Fencing immediately shows a crisp fence.
        setAnswers((a) => ({
          ...a,
          fenceStyle: a.fenceStyle ?? "wood-privacy",
          fenceFinish: a.fenceFinish ?? "natural-cedar",
          fenceHeight: a.fenceHeight ?? "6ft",
          fencePlacement: a.fencePlacement ?? "backyard",
          fenceGate: a.fenceGate ?? "yes",
        }));
      }
      return next;
    });
  }

  function updateAnswer<K extends StepId>(id: K, value: Answers[K]) {
    setAnswers((prev) => applyAnswer(prev, id, value));
    if (error) setError(null);
    if (id === "desiredType" || id === "solar") {
      setPreviewMode("new");
    } else if (
      id === "slope" ||
      id === "currentMaterial" ||
      id === "roofAge" ||
      id === "damage"
    ) {
      if (mode === "guided") setPreviewMode("current");
    }
  }

  function goToStep(idx: number) {
    const clamped = Math.max(0, Math.min(activeSteps.length - 1, idx));
    setShowResults(false);
    setMode("guided");
    setStepIndex(clamped);
    setError(null);
    const targetId = activeSteps[clamped]?.id;
    if (targetId && NEW_ROOF_STEPS.has(targetId) && answers.desiredType) {
      setPreviewMode("new");
    } else if (targetId && !NEW_ROOF_STEPS.has(targetId) && hasRoof) {
      if (targetId === "slope" || targetId === "currentMaterial" || targetId === "roofAge" || targetId === "damage") {
        setPreviewMode("current");
      }
    }
  }

  function handleSubmitStep(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!step) return;
    if (!isAnswered(step, answers)) {
      const msg = "Please choose one of the options above to continue.";
      setError(msg);
      announce(`Error: ${msg}`);
      firstRadioRef.current?.focus();
      return;
    }

    setError(null);
    if (safeIndex < activeSteps.length - 1) {
      const nextIndex = safeIndex + 1;
      setStepIndex(nextIndex);
      setMaxReached((m) => Math.max(m, nextIndex));
      const nextId = activeSteps[nextIndex]?.id;
      if (nextId && NEW_ROOF_STEPS.has(nextId) && answers.desiredType) {
        setPreviewMode("new");
      }
    } else {
      const missingIdx = activeSteps.findIndex((s) => !isAnswered(s, answers));
      if (missingIdx >= 0) {
        setStepIndex(missingIdx);
        setError("Please confirm this option to finish your matching packages.");
        announce("Please confirm the remaining option.");
        return;
      }
      setShowResults(true);
      setEditingFromResults(false);
      if (hasRoof) setPreviewMode("new");
    }
  }

  function handleBack() {
    if (showResults) {
      setShowResults(false);
      setStepIndex(activeSteps.length - 1);
      return;
    }
    if (safeIndex > 0) goToStep(safeIndex - 1);
  }

  function handleEditStepFromResults(id: StepId) {
    const idx = activeSteps.findIndex((s) => s.id === id);
    if (idx < 0) return;
    setEditingFromResults(true);
    goToStep(idx);
  }

  function handleStartOver() {
    setAnswers({});
    setStepIndex(0);
    setMaxReached(0);
    setShowResults(false);
    setEditingFromResults(false);
    setMode("guided");
    setPreviewMode("current");
    setError(null);
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setShowResults(false);
    setError(null);
    if (nextMode === "decorate" && hasRoof) {
      setPreviewMode("new");
    }
  }

  function onTabKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const next: Mode =
        e.key === "Home" ? "guided" : e.key === "End" ? "decorate" : mode === "guided" ? "decorate" : "guided";
      switchMode(next);
      (next === "guided" ? guidedTabRef : decorateTabRef).current?.focus();
    }
  }

  const nextLabel =
    safeIndex < activeSteps.length - 1
      ? `Next: ${activeSteps[safeIndex + 1].summaryLabel}`
      : "Show matching packages";

  const options = step ? step.options(answers) : [];
  const stepErrorId = `${uid}-step-error`;
  const stepHintId = `${uid}-step-hint`;
  const guidedTabId = `${uid}-tab-guided`;
  const decorateTabId = `${uid}-tab-decorate`;

  const fenceStyle = getFenceStyle(answers.fenceStyle);
  const fenceFinish = getFenceFinish(fenceStyle.id, answers.fenceFinish);

  return (
    <div className="container-x py-8 sm:py-12">
      {/* Polite screen-reader announcer for dynamic validation feedback */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1.08fr_1fr] lg:gap-10">
        {/* Left column: Sticky live 3D Building, Roof & Fence Model */}
        <div className="lg:sticky lg:top-24">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                Live 3D property preview
              </p>
              <p className="text-xs text-slate-500">
                Customize roofing, fencing, or both — watch your property update live
              </p>
            </div>

            {canCompare && (
              <div
                role="group"
                aria-label="3D roof preview mode"
                className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1"
              >
                <button
                  type="button"
                  aria-pressed={previewMode === "current"}
                  onClick={() => setPreviewMode("current")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    previewMode === "current"
                      ? "bg-white text-brand-900 shadow-xs"
                      : "text-slate-600 hover:text-brand-900"
                  }`}
                >
                  Current roof
                </button>
                <button
                  type="button"
                  aria-pressed={previewMode === "new"}
                  onClick={() => setPreviewMode("new")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    previewMode === "new"
                      ? "bg-accent-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-brand-900"
                  }`}
                >
                  New roof
                </button>
              </div>
            )}
          </div>

          <HouseViewerLazy config={config} badges={badges} />

          {/* Compact live spec strip below the 3D canvas */}
          <dl className="mt-4 grid grid-cols-3 gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-center text-xs">
            <div>
              <dt className="font-medium text-slate-500">Building</dt>
              <dd className="mt-0.5 font-bold capitalize text-brand-900">
                {config.stories === "single" ? "1-story" : "Multi-story"} {config.buildingType}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">{hasRoof ? "Roof shown" : "Roof"}</dt>
              <dd className="mt-0.5 font-bold capitalize text-brand-900">
                {config.slope} · {config.material.toUpperCase()}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Fence</dt>
              <dd className="mt-0.5 font-bold text-brand-900">
                {hasFence ? `${config.fence?.height ?? "6ft"} ${fenceStyle.label}` : "Not added"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Right column: Service selector + Guided Steps / Live Decorator OR Packages Result */}
        <div className="space-y-5">
          {/* Multi-service selector (Roofing, Fencing, or Both) */}
          <fieldset className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <legend className="sr-only">Select services to design in 3D</legend>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-brand-900">
                Select service(s) to decorate
              </p>
              <span className="text-xs text-slate-500">Pick one or combine both</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {SERVICE_META.map((svc) => {
                const checked = services.includes(svc.id);
                const id = `${uid}-svc-${svc.id}`;
                return (
                  <div key={svc.id} className="relative">
                    <input
                      id={id}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(svc.id)}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={id}
                      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition-all peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-600 ${
                        checked
                          ? "border-accent-600 bg-orange-50/40 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors ${
                          checked ? "border-accent-600 bg-accent-600 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {checked && (
                          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="m3 8 3.2 3.2L13 4.5" />
                          </svg>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-extrabold text-brand-900">{svc.label}</span>
                        <span className="block truncate text-xs text-slate-600">{svc.subtitle}</span>
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
            {serviceNotice && (
              <p role="status" className="mt-2.5 text-xs font-medium text-amber-800">
                {serviceNotice}
              </p>
            )}
          </fieldset>

          {showResults ? (
            <div ref={(el) => { headingRef.current = el; }} tabIndex={-1} className="outline-none">
              <PackagesResult
                services={services}
                answers={answers}
                onEditStep={handleEditStepFromResults}
                onBackToDecorate={() => switchMode("decorate")}
                onStartOver={handleStartOver}
              />
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              {/* Mode tabs: Guided Estimate vs. Live 3D Decorator */}
              <div
                role="tablist"
                aria-label="Design mode"
                onKeyDown={onTabKeyDown}
                className="flex border-b border-slate-200 px-6 pt-2"
              >
                <button
                  ref={guidedTabRef}
                  id={guidedTabId}
                  type="button"
                  role="tab"
                  aria-selected={mode === "guided"}
                  tabIndex={mode === "guided" ? 0 : -1}
                  onClick={() => switchMode("guided")}
                  className="mode-tab cursor-pointer px-4 py-3.5 text-sm font-bold text-slate-600 transition-colors hover:text-brand-900"
                >
                  Guided Steps
                </button>
                <button
                  ref={decorateTabRef}
                  id={decorateTabId}
                  type="button"
                  role="tab"
                  aria-selected={mode === "decorate"}
                  tabIndex={mode === "decorate" ? 0 : -1}
                  onClick={() => switchMode("decorate")}
                  className="mode-tab cursor-pointer px-4 py-3.5 text-sm font-bold text-slate-600 transition-colors hover:text-brand-900"
                >
                  Decorate in 3D
                </button>
              </div>

              {/* Tab Panel 1: Guided step-by-step questionnaire */}
              <div role="tabpanel" aria-labelledby={guidedTabId} hidden={mode !== "guided"}>
                {step && (
                  <div className="p-6 sm:p-8">
                    {/* Progress header */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-2">
                          <span>
                            Step {safeIndex + 1} of {activeSteps.length} ·{" "}
                            <span className="text-brand-900">{step.summaryLabel}</span>
                          </span>
                          {step.category !== "property" && (
                            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-brand-700">
                              {step.category}
                            </span>
                          )}
                        </span>
                        <span>{Math.round(((safeIndex + 1) / activeSteps.length) * 100)}%</span>
                      </div>
                      <progress
                        className="wizard-progress mt-2"
                        value={safeIndex + 1}
                        max={activeSteps.length}
                        aria-label={`Estimate questionnaire progress: step ${safeIndex + 1} of ${activeSteps.length}`}
                      />

                      {/* Step jump pills */}
                      <nav aria-label="Questionnaire steps" className="mt-3">
                        <ol className="flex flex-wrap gap-1.5">
                          {activeSteps.map((s, idx) => {
                            const active = idx === safeIndex;
                            const reachable = idx <= maxReached || isAnswered(s, answers);
                            const done = idx < maxReached && isAnswered(s, answers);
                            return (
                              <li key={s.id}>
                                <button
                                  type="button"
                                  disabled={!reachable && !active}
                                  aria-current={active ? "step" : undefined}
                                  onClick={() => goToStep(idx)}
                                  title={`${idx + 1}. ${s.summaryLabel}`}
                                  className={`h-7 min-w-7 rounded-full px-2 text-xs font-bold transition-colors ${
                                    active
                                      ? "bg-brand-900 text-white"
                                      : done
                                        ? "bg-brand-50 text-brand-900 hover:bg-brand-100"
                                        : reachable
                                          ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                          : "cursor-not-allowed bg-slate-100 text-slate-400"
                                  }`}
                                >
                                  {idx + 1}
                                  <span className="sr-only"> {s.summaryLabel}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ol>
                      </nav>
                    </div>

                    <form onSubmit={handleSubmitStep} noValidate className="mt-7">
                      <fieldset
                        className="border-0 p-0"
                        aria-describedby={
                          [step.hint ? stepHintId : null, error ? stepErrorId : null].filter(Boolean).join(" ") ||
                          undefined
                        }
                      >
                        <legend
                          ref={(el) => { headingRef.current = el; }}
                          tabIndex={-1}
                          className="font-heading text-2xl font-extrabold text-brand-900 outline-none sm:text-3xl"
                        >
                          {step.title}
                        </legend>
                        {step.hint && (
                          <p id={stepHintId} className="mt-2 text-sm text-slate-600">
                            {step.hint}
                          </p>
                        )}

                        {(step.id === "currentMaterial" || step.id === "desiredType") && answers.slope && (
                          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-900">
                            Showing options for a <span className="capitalize">{answers.slope}</span> roof
                          </p>
                        )}

                        {step.id === "fenceFinish" && (
                          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-900">
                            Finishes for {fenceStyle.label} (selected: {fenceFinish.label})
                          </p>
                        )}

                        <div
                          className={`mt-5 grid gap-3 ${
                            options.length === 2 || options.length === 4 || options.length >= 6
                              ? "sm:grid-cols-2"
                              : "grid-cols-1"
                          }`}
                        >
                          {options.map((opt, idx) => {
                            const checked = answers[step.id] === opt.value;
                            const optId = `${uid}-${step.id}-${opt.value}`;
                            return (
                              <div key={opt.value} className="relative">
                                <input
                                  ref={idx === 0 ? firstRadioRef : undefined}
                                  id={optId}
                                  type="radio"
                                  name={step.id}
                                  value={opt.value}
                                  checked={checked}
                                  required
                                  onChange={() => updateAnswer(step.id, opt.value as Answers[typeof step.id])}
                                  className="peer sr-only"
                                />
                                <label
                                  htmlFor={optId}
                                  className={`flex min-h-16 cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-4 transition-all peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-600 ${
                                    checked
                                      ? "border-accent-600 bg-brand-50/60 shadow-sm"
                                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                                  }`}
                                >
                                  <OptionVisual stepId={step.id} value={opt.value} option={opt} />
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-base font-bold text-brand-900">{opt.label}</span>
                                    {opt.description && (
                                      <span className="mt-0.5 block text-xs leading-snug text-slate-600">
                                        {opt.description}
                                      </span>
                                    )}
                                  </span>
                                  <span
                                    aria-hidden="true"
                                    className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                                      checked ? "border-accent-600 bg-accent-600 text-white" : "border-slate-300 bg-white"
                                    }`}
                                  >
                                    {checked && (
                                      <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="m3 8 3.2 3.2L13 4.5" />
                                      </svg>
                                    )}
                                  </span>
                                </label>
                              </div>
                            );
                          })}
                        </div>

                        {error && (
                          <p id={stepErrorId} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-700">
                            <span role="img" aria-label="Error">⚠</span>
                            <span>{error}</span>
                          </p>
                        )}
                      </fieldset>

                      {/* Navigation footer */}
                      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
                        <button
                          type="button"
                          onClick={handleBack}
                          disabled={safeIndex === 0}
                          className="btn btn-secondary min-h-12 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ← Back
                        </button>

                        <div className="flex flex-wrap items-center gap-2.5">
                          {editingFromResults && allRequiredAnswered && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowResults(true);
                                setEditingFromResults(false);
                                if (hasRoof) setPreviewMode("new");
                              }}
                              className="btn btn-secondary min-h-12"
                            >
                              Back to packages
                            </button>
                          )}
                          <button type="submit" className="btn btn-primary btn-lg min-h-12">
                            {nextLabel} →
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Tab Panel 2: Instant 3D Live Decorator */}
              <div role="tabpanel" aria-labelledby={decorateTabId} hidden={mode !== "decorate"}>
                <div className="p-6 sm:p-8">
                  <LiveDecorator
                    services={services}
                    answers={answers}
                    previewMode={previewMode}
                    onPreviewModeChange={setPreviewMode}
                    onUpdate={updateAnswer}
                    onShowPackages={() => {
                      setShowResults(true);
                      if (hasRoof) setPreviewMode("new");
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
