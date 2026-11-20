"use client";

import { useId } from "react";
import { getFenceFinish, getFenceStyle } from "../catalogs/fencing";
import { isAnswered } from "../domain/engine";
import type { Answers, StepId } from "../domain/schemas";
import type { StepDef } from "../domain/types";
import { OptionVisual } from "./OptionVisual";

type Props = {
  steps: readonly StepDef[];
  stepIndex: number;
  maxReached: number;
  answers: Partial<Answers>;
  error: string | null;
  editingFromResults: boolean;
  allRequiredAnswered: boolean;
  headingRef: React.MutableRefObject<HTMLElement | null>;
  firstRadioRef: React.RefObject<HTMLInputElement | null>;
  onSelect: <K extends StepId>(id: K, value: Answers[K]) => void;
  onGoToStep: (idx: number) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBackToPackages: () => void;
};

export function GuidedSteps({
  steps,
  stepIndex,
  maxReached,
  answers,
  error,
  editingFromResults,
  allRequiredAnswered,
  headingRef,
  firstRadioRef,
  onSelect,
  onGoToStep,
  onBack,
  onSubmit,
  onBackToPackages,
}: Props) {
  const uid = useId();
  const step = steps[stepIndex];
  if (!step) return null;

  const options = step.options(answers);
  const stepErrorId = `${uid}-step-error`;
  const stepHintId = `${uid}-step-hint`;
  const nextLabel =
    stepIndex < steps.length - 1
      ? `Next: ${steps[stepIndex + 1].summaryLabel}`
      : "Show matching packages";

  const fenceStyle = getFenceStyle(answers.fenceStyle);
  const fenceFinish = getFenceFinish(fenceStyle.id, answers.fenceFinish);

  return (
    <div className="p-6 sm:p-8">
      {/* Progress header */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span className="flex items-center gap-2">
            <span>
              Step {stepIndex + 1} of {steps.length} ·{" "}
              <span className="text-brand-900">{step.summaryLabel}</span>
            </span>
            {step.category !== "property" && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-brand-700">
                {step.category}
              </span>
            )}
          </span>
          <span>{Math.round(((stepIndex + 1) / steps.length) * 100)}%</span>
        </div>
        <progress
          className="wizard-progress mt-2"
          value={stepIndex + 1}
          max={steps.length}
          aria-label={`Estimate questionnaire progress: step ${stepIndex + 1} of ${steps.length}`}
        />

        <nav aria-label="Questionnaire steps" className="mt-3">
          <ol className="flex flex-wrap gap-1.5">
            {steps.map((s, idx) => {
              const active = idx === stepIndex;
              const reachable = idx <= maxReached || isAnswered(s, answers);
              const done = idx < maxReached && isAnswered(s, answers);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={!reachable && !active}
                    aria-current={active ? "step" : undefined}
                    onClick={() => onGoToStep(idx)}
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

      <form onSubmit={onSubmit} noValidate className="mt-7">
        <fieldset
          className="border-0 p-0"
          aria-describedby={
            [step.hint ? stepHintId : null, error ? stepErrorId : null].filter(Boolean).join(" ") ||
            undefined
          }
        >
          <legend
            ref={(el) => {
              headingRef.current = el;
            }}
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
                    onChange={() => onSelect(step.id, opt.value as Answers[typeof step.id])}
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

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={stepIndex === 0}
            className="btn btn-secondary min-h-12 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Back
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {editingFromResults && allRequiredAnswered && (
              <button type="button" onClick={onBackToPackages} className="btn btn-secondary min-h-12">
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
  );
}
