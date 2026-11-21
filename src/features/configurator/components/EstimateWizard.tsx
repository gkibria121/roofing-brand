"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  applyAnswer,
  deriveScene,
  getStepsForServices,
  isAnswered,
  toggleServiceSelection,
} from "../domain/engine";
import {
  buildConfigurationsFromSession,
  removeConfiguration,
  updateConfigurationQuantity,
  updateConfigurationTier,
  type SavedConfiguration,
} from "../domain/quote";
import type { Answers, ConfiguratorState, PreviewMode, PropertyAddress, ServiceId, StepId } from "../domain/schemas";
import { serializeConfiguratorState } from "../domain/validation";
import { CustomQuoteStep } from "./CustomQuoteStep";
import { GuidedSteps } from "./GuidedSteps";
import { HouseViewerLazy } from "./HouseViewerLazy";
import { LiveDecorator } from "./LiveDecorator";
import { ServiceSelector } from "./ServiceSelector";
import { ZipAddressLookup } from "./ZipAddressLookup";

const NEW_ROOF_STEPS = new Set<StepId>(["desiredType", "solar"]);
type Mode = "guided" | "decorate";
type Stage = "lookup" | "configure" | "quote";

const FALLBACK_SHARED_ADDRESS: PropertyAddress = {
  id: "75081-0",
  street: "1010 Towne House Ln",
  city: "Richardson",
  state: "TX",
  zip: "75081",
  country: "USA",
  fullAddress: "1010 Towne House Ln, Richardson, TX 75081, USA",
  lat: 32.9495,
  lng: -96.7307,
  suggestedBuildingType: "residential",
  suggestedStories: "single",
  lotLabel: "Single-family · ~2,150 sq ft",
  nearbyStreets: ["E Spring Valley Rd", "Woodhaven Pl", "Bowser Rd", "Morningstar Trail"],
};

export function EstimateWizard({
  initialState = null,
  initialZip = "",
}: {
  /** Server-parsed configurator state from URL searchParams (enables immediate SSR without Suspense bailout). */
  initialState?: ConfiguratorState | null;
  /** Optional server-parsed 5-digit ZIP preloaded from regional links (?zip=75081). */
  initialZip?: string;
} = {}) {
  const uid = useId();
  const initialFromUrl = initialState;

  // Starts on the 3D preview + ZIP lookup gate unless a shared 3D URL is opened directly.
  const [stage, setStage] = useState<Stage>(() => (initialFromUrl ? "configure" : "lookup"));
  const [returnToQuoteAfterAddress, setReturnToQuoteAfterAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<PropertyAddress | null>(() =>
    initialFromUrl ? FALLBACK_SHARED_ADDRESS : null,
  );
  const [highlightedAddress, setHighlightedAddress] = useState<PropertyAddress | null>(null);

  const [services, setServices] = useState<ServiceId[]>(() => initialFromUrl?.services ?? ["roofing"]);
  const [mode, setMode] = useState<Mode>(() => initialFromUrl?.mode ?? "guided");
  const [answers, setAnswers] = useState<Partial<Answers>>(() => initialFromUrl?.answers ?? {});
  const [stepIndex, setStepIndex] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [previewMode, setPreviewMode] = useState<PreviewMode>(() => initialFromUrl?.previewMode ?? "current");
  const [error, setError] = useState<string | null>(null);
  const [serviceNotice, setServiceNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  // Saved quote configurations (supports multi-config cart, + Add a config, Edit, Delete)
  const [savedConfigs, setSavedConfigs] = useState<SavedConfiguration[]>([]);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [addingConfig, setAddingConfig] = useState(false);
  const configCounterRef = useRef(1);

  const headingRef = useRef<HTMLElement | null>(null);
  const firstRadioRef = useRef<HTMLInputElement | null>(null);
  const guidedTabRef = useRef<HTMLButtonElement | null>(null);
  const decorateTabRef = useRef<HTMLButtonElement | null>(null);
  const snapshotGetterRef = useRef<(() => string | null) | null>(null);
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
    (mode === "decorate" ||
      answers.desiredType !== undefined ||
      (step !== undefined && NEW_ROOF_STEPS.has(step.id)));

  const { config, badges, specSummary } = useMemo(
    () => deriveScene(answers, previewMode, services),
    [answers, previewMode, services],
  );

  // Showcase 3D house shown on the left during Stage 1 (ZIP lookup); adapts to highlighted address shape.
  const showcaseScene = useMemo(() => {
    const bt = highlightedAddress?.suggestedBuildingType ?? "residential";
    const st = highlightedAddress?.suggestedStories ?? "multiple";
    const previewAnswers: Partial<Answers> = {
      buildingType: bt,
      stories: st,
      slope: bt === "commercial" ? "flat" : "moderate",
      desiredType: bt === "commercial" ? "tpo" : "metal",
      solar: "no",
      fenceStyle: "wood-privacy",
      fenceFinish: "natural-cedar",
      fenceHeight: "6ft",
      fencePlacement: "backyard",
      fenceGate: "yes",
    };
    const derived = deriveScene(previewAnswers, "new", ["roofing", "fencing"]);
    return {
      config: derived.config,
      badges: highlightedAddress
        ? [
            "3D Preview",
            highlightedAddress.street,
            `${highlightedAddress.city}, ${highlightedAddress.state} ${highlightedAddress.zip}`,
          ]
        : ["3D Property Preview", "Roofing & Fencing"],
    };
  }, [highlightedAddress]);

  const handleSnapshotGetterReady = useCallback((getter: (() => string | null) | null) => {
    snapshotGetterRef.current = getter;
  }, []);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (stage === "configure" && mode === "guided") {
      headingRef.current?.focus();
    }
  }, [safeIndex, mode, stage]);

  function announce(msg: string) {
    setAnnouncement("");
    window.setTimeout(() => setAnnouncement(msg), 50);
  }

  function handleSelectAddress(addr: PropertyAddress) {
    setSelectedAddress(addr);
    setAnswers((prev) => ({
      buildingType: addr.suggestedBuildingType,
      stories: addr.suggestedStories,
      ...prev,
    }));
    announce(`Selected property ${addr.fullAddress}. Opening 3D estimate.`);
    if (returnToQuoteAfterAddress && savedConfigs.length > 0) {
      setReturnToQuoteAfterAddress(false);
      setStage("quote");
    } else {
      setReturnToQuoteAfterAddress(false);
      setStage("configure");
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleChangeAddress(fromQuote = false) {
    setReturnToQuoteAfterAddress(fromQuote);
    setStage("lookup");
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

  function proceedToQuote() {
    const snapshotUrl = snapshotGetterRef.current?.() ?? undefined;
    const prefix = `cfg-${configCounterRef.current++}`;
    const generated = buildConfigurationsFromSession(services, answers, snapshotUrl, prefix);

    if (editingConfigId) {
      const replacement = generated[0];
      if (replacement) {
        setSavedConfigs((prev) =>
          prev.map((c) =>
            c.id === editingConfigId
              ? { ...replacement, id: editingConfigId, quantity: c.unit === replacement.unit ? c.quantity : replacement.quantity }
              : c,
          ),
        );
      }
      setEditingConfigId(null);
    } else if (addingConfig) {
      setSavedConfigs((prev) => [...prev, ...generated]);
      setAddingConfig(false);
    } else {
      setSavedConfigs(generated);
    }

    if (!selectedAddress) setSelectedAddress(FALLBACK_SHARED_ADDRESS);
    if (hasRoof) setPreviewMode("new");
    setStage("quote");
    announce("3D estimate complete. Review your custom quote details.");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        setError("Please confirm this option to finish your quote.");
        announce("Please confirm the remaining option.");
        return;
      }
      proceedToQuote();
    }
  }

  function handleBack() {
    if (safeIndex > 0) goToStep(safeIndex - 1);
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
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

  function handleAddConfigFromQuote() {
    setEditingConfigId(null);
    setAddingConfig(true);
    setMode("decorate");
    if (hasRoof) setPreviewMode("new");
    setStage("configure");
  }

  function handleEditConfigFromQuote(cfg: SavedConfiguration) {
    setEditingConfigId(cfg.id);
    setAddingConfig(false);
    setServices([cfg.serviceId]);
    setAnswers({ ...cfg.sourceAnswers });
    setMode("decorate");
    setPreviewMode("new");
    setStage("configure");
  }

  const guidedTabId = `${uid}-tab-guided`;
  const decorateTabId = `${uid}-tab-decorate`;

  const finishLabel = editingConfigId
    ? "Save changes to quote"
    : addingConfig
      ? "Add to quote"
      : "Continue to custom quote";

  return (
    <div className="container-x py-8 sm:py-12">
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* STAGES 1 & 2: Left 3D House (Showcase Preview -> Full Interactive) + Right ZIP Lookup / Studio */}
      {(stage === "lookup" || stage === "configure") && (
        <div>
          {/* Selected property bar + 3-stage breadcrumb (shown once address is picked) */}
          {stage === "configure" && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-900 text-white" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2.2" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-brand-900">
                    {selectedAddress?.street ?? FALLBACK_SHARED_ADDRESS.street}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {selectedAddress
                      ? `${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zip}, ${selectedAddress.country}`
                      : `${FALLBACK_SHARED_ADDRESS.city}, ${FALLBACK_SHARED_ADDRESS.state} ${FALLBACK_SHARED_ADDRESS.zip}, USA`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChangeAddress(false)}
                  className="ml-1 shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-brand-900 transition-colors hover:border-brand-700 hover:bg-brand-50"
                >
                  Change address
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                {(editingConfigId || addingConfig) && savedConfigs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingConfigId(null);
                      setAddingConfig(false);
                      setStage("quote");
                    }}
                    className="rounded-full border border-accent-600/30 bg-orange-50 px-3 py-1 text-accent-700 hover:bg-orange-100"
                  >
                    ← Back to quote ({savedConfigs.length})
                  </button>
                )}
                <ol className="hidden items-center gap-1.5 sm:flex" aria-label="Estimate stages">
                  <li className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">1. Address ✓</li>
                  <li className="text-slate-300" aria-hidden="true">→</li>
                  <li className="rounded-full bg-brand-900 px-2.5 py-1 text-white">2. 3D Estimate</li>
                  <li className="text-slate-300" aria-hidden="true">→</li>
                  <li className="rounded-full bg-white px-2.5 py-1 text-slate-500">3. Custom Quote</li>
                </ol>
              </div>
            </div>
          )}

          <div className="grid items-start gap-8 md:grid-cols-[1.06fr_1fr] lg:gap-10">
            {/* Left column: Always-mounted 3D House (showcase preview in Stage 1, full interactive in Stage 2) */}
            <div className="md:sticky md:top-24">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                    {stage === "lookup" ? "3D Property Preview" : "Live 3D property preview"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {stage === "lookup"
                      ? "Enter your ZIP code and pick an address to unlock full 3D customization"
                      : "Customize roofing, fencing, or both — watch your property update live"}
                  </p>
                </div>

                {stage === "configure" && (
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
                )}
              </div>

              <HouseViewerLazy
                interactive={stage === "configure"}
                config={stage === "lookup" ? showcaseScene.config : config}
                badges={stage === "lookup" ? showcaseScene.badges : badges}
                onSnapshotGetterReady={handleSnapshotGetterReady}
              />

              {stage === "configure" && (
                <dl className="mt-4 grid grid-cols-3 gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-center text-xs">
                  {specSummary.map((item) => (
                    <div key={item.label}>
                      <dt className="font-medium text-slate-500">{item.label}</dt>
                      <dd className="mt-0.5 font-bold capitalize text-brand-900">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {/* Right column: Stage 1 ZIP Lookup OR Stage 2 Service Selector + Guided / Live Decorator */}
            {stage === "lookup" ? (
              <ZipAddressLookup
                initialZip={selectedAddress?.zip ?? initialZip}
                onSelectAddress={handleSelectAddress}
                onHighlightAddress={setHighlightedAddress}
              />
            ) : (
              <div className="space-y-5">
                <ServiceSelector selected={services} notice={serviceNotice} onToggle={handleToggleService} />

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
                      editingFromResults={Boolean(editingConfigId)}
                      allRequiredAnswered={allRequiredAnswered}
                      headingRef={headingRef}
                      firstRadioRef={firstRadioRef}
                      onSelect={handleUpdateAnswer}
                      onGoToStep={goToStep}
                      onBack={handleBack}
                      onSubmit={handleSubmitStep}
                      onBackToPackages={proceedToQuote}
                      finishLabel={finishLabel}
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
                        onShowPackages={proceedToQuote}
                        ctaLabel={`${finishLabel} →`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 3: Custom Quote Form + Property Map + Selected Configurations */}
      {stage === "quote" && selectedAddress && (
        <CustomQuoteStep
          address={selectedAddress}
          configs={savedConfigs}
          onChangeAddress={() => handleChangeAddress(true)}
          onAddConfig={handleAddConfigFromQuote}
          onEditConfig={handleEditConfigFromQuote}
          onDeleteConfig={(id) => setSavedConfigs((prev) => removeConfiguration(prev, id))}
          onUpdateQuantity={(id, qty) => setSavedConfigs((prev) => updateConfigurationQuantity(prev, id, qty))}
          onUpdateTier={(id, tier) => setSavedConfigs((prev) => updateConfigurationTier(prev, id, tier))}
          onBackToStudio={() => {
            setEditingConfigId(null);
            setAddingConfig(false);
            setStage("configure");
          }}
        />
      )}
    </div>
  );
}
