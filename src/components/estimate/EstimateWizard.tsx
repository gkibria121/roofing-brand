"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  applyAnswer,
  isAnswered,
  steps,
  type Answers,
  type StepId,
} from "@/lib/estimate/questions";
import { deriveScene, type PreviewMode } from "@/lib/estimate/sceneConfig";
import { HouseViewerLazy } from "./HouseViewerLazy";
import { OptionVisual } from "./OptionVisual";
import { PackagesResult } from "./PackagesResult";

const NEW_ROOF_STEPS = new Set<StepId>(["desiredType", "solar"]);

export function EstimateWizard() {
  const uid = useId();
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [editingFromResults, setEditingFromResults] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("current");
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const headingRef = useRef<HTMLElement | null>(null);
  const firstRadioRef = useRef<HTMLInputElement | null>(null);
  const didMountRef = useRef(false);

  const step = steps[stepIndex];
  const allRequiredAnswered = useMemo(() => steps.every((s) => isAnswered(s, answers)), [answers]);
  const canCompare =
    showResults ||
    answers.desiredType !== undefined ||
    NEW_ROOF_STEPS.has(step.id);

  const { config, badges } = useMemo(
    () => deriveScene(answers, previewMode),
    [answers, previewMode],
  );

  // Move focus to the new step heading when navigating between steps dynamically.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [stepIndex, showResults]);

  function announce(msg: string) {
    setAnnouncement("");
    window.setTimeout(() => setAnnouncement(msg), 50);
  }

  function updateAnswer<K extends StepId>(id: K, value: Answers[K]) {
    setAnswers((prev) => applyAnswer(prev, id, value));
    if (error) setError(null);
    if (id === "desiredType" || id === "solar") {
      setPreviewMode("new");
    } else {
      setPreviewMode("current");
    }
  }

  function goToStep(idx: number) {
    const clamped = Math.max(0, Math.min(steps.length - 1, idx));
    setShowResults(false);
    setStepIndex(clamped);
    setError(null);
    const targetId = steps[clamped].id;
    if (NEW_ROOF_STEPS.has(targetId) && answers.desiredType) {
      setPreviewMode("new");
    } else if (!NEW_ROOF_STEPS.has(targetId)) {
      setPreviewMode("current");
    }
  }

  function handleSubmitStep(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAnswered(step, answers)) {
      const msg = "Please choose one of the options above to continue.";
      setError(msg);
      announce(`Error: ${msg}`);
      firstRadioRef.current?.focus();
      return;
    }

    setError(null);
    if (stepIndex < steps.length - 1) {
      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);
      setMaxReached((m) => Math.max(m, nextIndex));
      if (NEW_ROOF_STEPS.has(steps[nextIndex].id) && answers.desiredType) {
        setPreviewMode("new");
      }
    } else {
      // Find first incomplete step (e.g., if slope changed and invalidated material).
      const missingIdx = steps.findIndex((s) => !isAnswered(s, answers));
      if (missingIdx >= 0) {
        setStepIndex(missingIdx);
        setError("Because your roof slope changed, please select a compatible roof material here.");
        announce("Please confirm a compatible roof material for your new slope.");
        return;
      }
      setShowResults(true);
      setEditingFromResults(false);
      setPreviewMode("new");
    }
  }

  function handleBack() {
    if (showResults) {
      setShowResults(false);
      setStepIndex(steps.length - 1);
      return;
    }
    if (stepIndex > 0) goToStep(stepIndex - 1);
  }

  function handleEditStepFromResults(id: StepId) {
    const idx = steps.findIndex((s) => s.id === id);
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
    setPreviewMode("current");
    setError(null);
  }

  const nextLabel =
    stepIndex < steps.length - 1
      ? `Next: ${steps[stepIndex + 1].summaryLabel}`
      : "Show matching packages";

  const options = step.options(answers);
  const stepErrorId = `${uid}-step-error`;
  const stepHintId = `${uid}-step-hint`;

  return (
    <div className="container-x py-8 sm:py-12">
      {/* Polite screen-reader announcer for dynamic validation feedback */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1.08fr_1fr] lg:gap-10">
        {/* Left column: Sticky live 3D Building & Roof Model */}
        <div className="lg:sticky lg:top-24">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                Live 3D building preview
              </p>
              <p className="text-xs text-slate-500">
                Every question updates your 3D building and roof in real time
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
              <dt className="font-medium text-slate-500">Slope</dt>
              <dd className="mt-0.5 font-bold capitalize text-brand-900">{config.slope}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Building</dt>
              <dd className="mt-0.5 font-bold capitalize text-brand-900">
                {config.stories === "single" ? "1-story" : "Multi-story"} {config.buildingType}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Roof shown</dt>
              <dd className="mt-0.5 font-bold text-brand-900">
                {previewMode === "new" ? "New" : "Current"} ({config.material.toUpperCase()})
              </dd>
            </div>
          </dl>
        </div>

        {/* Right column: Questionnaire OR Packages Result */}
        <div>
          {showResults ? (
            <div ref={(el) => { headingRef.current = el; }} tabIndex={-1} className="outline-none">
              <PackagesResult
                answers={answers}
                onEditStep={handleEditStepFromResults}
                onStartOver={handleStartOver}
              />
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {/* Progress header */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>
                    Step {stepIndex + 1} of {steps.length} ·{" "}
                    <span className="text-brand-900">{step.summaryLabel}</span>
                  </span>
                  <span>{Math.round(((stepIndex + 1) / steps.length) * 100)}%</span>
                </div>
                <progress
                  className="wizard-progress mt-2"
                  value={stepIndex + 1}
                  max={steps.length}
                  aria-label={`Estimate questionnaire progress: step ${stepIndex + 1} of ${steps.length}`}
                />

                {/* Step jump pills for reached steps */}
                <nav aria-label="Questionnaire steps" className="mt-3">
                  <ol className="flex flex-wrap gap-1.5">
                    {steps.map((s, idx) => {
                      const active = idx === stepIndex;
                      const reachable = idx <= maxReached;
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

                  {/* Branch context pill on Current / Desired roof material steps */}
                  {(step.id === "currentMaterial" || step.id === "desiredType") && answers.slope && (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-900">
                      Showing options for a <span className="capitalize">{answers.slope}</span> roof
                    </p>
                  )}

                  <div
                    className={`mt-5 grid gap-3 ${
                      options.length === 2 ? "sm:grid-cols-2" : options.length === 4 ? "sm:grid-cols-2" : "grid-cols-1"
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
                            <OptionVisual stepId={step.id} value={opt.value} />
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
                    disabled={stepIndex === 0}
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
                          setPreviewMode("new");
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
      </div>
    </div>
  );
}
