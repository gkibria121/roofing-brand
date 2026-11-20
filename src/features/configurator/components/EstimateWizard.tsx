"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  applyAnswer,
  deriveScene,
  getStepsForServices,
  isAnswered,
  toggleServiceSelection,
} from "../domain/engine";
import type { Answers, PreviewMode, ServiceId, StepId } from "../domain/schemas";
import { parseConfiguratorState, serializeConfiguratorState } from "../domain/validation";
import { GuidedSteps } from "./GuidedSteps";
import { HouseViewerLazy } from "./HouseViewerLazy";
import { LiveDecorator } from "./LiveDecorator";
import { PackagesResult } from "./PackagesResult";
import { ServiceSelector } from "./ServiceSelector";

const NEW_ROOF_STEPS = new Set<StepId>(["desiredType", "solar"]);
type Mode = "guided" | "decorate";

export function EstimateWizard() {
  const uid = useId();
  const searchParams = useSearchParams();
  const initialFromUrl = useMemo(() => parseConfiguratorState(searchParams), [searchParams]);

  const [services, setServices] = useState<ServiceId[]>(() => initialFromUrl?.services ?? ["roofing"]);
  const [mode, setMode] = useState<Mode>(() => initialFromUrl?.mode ?? "guided");
  const [answers, setAnswers] = useState<Partial<Answers>>(() => initialFromUrl?.answers ?? {});
  const [stepIndex, setStepIndex] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [editingFromResults, setEditingFromResults] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>(() => initialFromUrl?.previewMode ?? "current");
  const [error, setError] = useState<string | null>(null);
  const [serviceNotice, setServiceNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
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

  const allRequiredAnswered = useMemo(
    () => activeSteps.every((s) => isAnswered(s, answers)),
    [activeSteps, answers],
  );

  const canCompare =
    hasRoof &&
    (showResults ||
      mode === "decorate" ||
      answers.desiredType !== undefined ||
      (step !== undefined && NEW_ROOF_STEPS.has(step.id)));

  const { config, badges, specSummary } = useMemo(
    () => deriveScene(answers, previewMode, services),
    [answers, previewMode, services],
  );

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

  function handleToggleService(id: ServiceId) {
    setServiceNotice(null);
    setError(null);
    const res = toggleServiceSelection(services, answers, id);
    if (res.blocked) {
      const msg = "Keep at least one service selected to design your 3D property.";
      setServiceNotice(msg);
      announce(msg);
      return;
    }
    setServices(res.services);
    setAnswers(res.answers);
    const nextSteps = getStepsForServices(res.services);
    setStepIndex((cur) => Math.min(cur, Math.max(0, nextSteps.length - 1)));
  }

  function handleUpdateAnswer<K extends StepId>(id: K, value: Answers[K]) {
    setAnswers((prev) => applyAnswer(prev, id, value));
    if (error) setError(null);
    if (id === "desiredType" || id === "solar") {
      setPreviewMode("new");
    } else if (id === "slope" || id === "currentMaterial" || id === "roofAge" || id === "damage") {
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
    } else if (
      targetId &&
      hasRoof &&
      (targetId === "slope" || targetId === "currentMaterial" || targetId === "roofAge" || targetId === "damage")
    ) {
      setPreviewMode("current");
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
    if (nextMode === "decorate" && hasRoof) setPreviewMode("new");
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

  async function handleCopyShareLink() {
    const query = serializeConfiguratorState({ services, mode: "decorate", previewMode, answers });
    const url = `${window.location.origin}${window.location.pathname}?${query}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      announce("3D design link copied to clipboard.");
      window.setTimeout(() => setCopiedLink(false), 2400);
    } catch {
      window.history.replaceState(null, "", `?${query}`);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2400);
    }
  }

  const guidedTabId = `${uid}-tab-guided`;
  const decorateTabId = `${uid}-tab-decorate`;

  return (
    <div className="container-x py-8 sm:py-12">
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1.08fr_1fr] lg:gap-10">
        {/* Left column: Sticky live 3D Building, Roof & Fence Model */}
        <div className="lg:sticky lg:top-24">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                Live 3D property preview
              </p>
              <p className="text-xs text-slate-500">
                Customize roofing, fencing, or both — watch your property update live
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
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
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                      previewMode === "new"
                        ? "bg-accent-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-brand-900"
                    }`}
                  >
                    New roof
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleCopyShareLink}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-brand-900 shadow-xs transition-colors hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {copiedLink ? "Link copied" : "Share 3D"}
              </button>
            </div>
          </div>

          <HouseViewerLazy config={config} badges={badges} />

          <dl className="mt-4 grid grid-cols-3 gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-center text-xs">
            {specSummary.map((item) => (
              <div key={item.label}>
                <dt className="font-medium text-slate-500">{item.label}</dt>
                <dd className="mt-0.5 font-bold capitalize text-brand-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right column: Service Selector + Guided / Live Decorator OR Packages Result */}
        <div className="space-y-5">
          <ServiceSelector selected={services} notice={serviceNotice} onToggle={handleToggleService} />

          {showResults ? (
            <div
              ref={(el) => {
                headingRef.current = el;
              }}
              tabIndex={-1}
              className="outline-none"
            >
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

              <div role="tabpanel" aria-labelledby={guidedTabId} hidden={mode !== "guided"}>
                <GuidedSteps
                  steps={activeSteps}
                  stepIndex={safeIndex}
                  maxReached={maxReached}
                  answers={answers}
                  error={error}
                  editingFromResults={editingFromResults}
                  allRequiredAnswered={allRequiredAnswered}
                  headingRef={headingRef}
                  firstRadioRef={firstRadioRef}
                  onSelect={handleUpdateAnswer}
                  onGoToStep={goToStep}
                  onBack={handleBack}
                  onSubmit={handleSubmitStep}
                  onBackToPackages={() => {
                    setShowResults(true);
                    setEditingFromResults(false);
                    if (hasRoof) setPreviewMode("new");
                  }}
                />
              </div>

              <div role="tabpanel" aria-labelledby={decorateTabId} hidden={mode !== "decorate"}>
                <div className="p-6 sm:p-8">
                  <LiveDecorator
                    services={services}
                    answers={answers}
                    previewMode={previewMode}
                    onPreviewModeChange={setPreviewMode}
                    onUpdate={handleUpdateAnswer}
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
