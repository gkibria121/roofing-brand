"use client";

import { useId, useRef, useState } from "react";
import { site } from "@/lib/site";
import { FENCE_CATALOG } from "../catalogs/fencing";
import { ROOF_MATERIAL_CATALOG } from "../catalogs/roofing";
import {
  calculateLineTotal,
  calculateQuoteTotal,
  formatCurrency,
  formatUnitRate,
  inferDefaultServiceLabel,
  type SavedConfiguration,
} from "../domain/quote";
import {
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  type PropertyAddress,
} from "../domain/schemas";
import { validateCustomQuoteInquiry } from "../domain/validation";
import { PropertyMapCard } from "./PropertyMapCard";

type Props = {
  address: PropertyAddress;
  configs: readonly SavedConfiguration[];
  onChangeAddress: () => void;
  onAddConfig: () => void;
  onEditConfig: (config: SavedConfiguration) => void;
  onDeleteConfig: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateTier: (id: string, tierName: string) => void;
  onBackToStudio: () => void;
};

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CustomQuoteStep({
  address,
  configs,
  onChangeAddress,
  onAddConfig,
  onEditConfig,
  onDeleteConfig,
  onUpdateQuantity,
  onUpdateTier,
  onBackToStudio,
}: Props) {
  const uid = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultService = inferDefaultServiceLabel(configs);
  const serviceOptions = Array.from(
    new Set([
      defaultService,
      "Roofing + Custom Fencing",
      ...ROOF_MATERIAL_CATALOG.filter((m) => m.offeredAsNew).map((m) => `${m.label} Roof`),
      ...FENCE_CATALOG.map((f) => `${f.label} Fence`),
    ]),
  );

  const [service, setService] = useState(defaultService);
  const [name, setName] = useState("");
  const [addressValue, setAddressValue] = useState(address.fullAddress);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const totalEstimate = calculateQuoteTotal(configs);

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setFileError(null);
    const incoming = Array.from(list);
    const oversized = incoming.find((f) => f.size > MAX_ATTACHMENT_BYTES);
    if (oversized) {
      setFileError(`"${oversized.name}" exceeds the 10 MB per-file limit.`);
      return;
    }
    setAttachments((prev) => {
      const merged = [...prev];
      for (const file of incoming) {
        if (merged.length >= MAX_ATTACHMENTS) {
          setFileError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
          break;
        }
        const duplicate = merged.some((m) => m.name === file.name && m.size === file.size);
        if (!duplicate) {
          merged.push({
            id: `${file.name}-${file.size}-${Date.now()}`,
            name: file.name,
            size: file.size,
            type: file.type || "application/octet-stream",
          });
        }
      }
      return merged;
    });
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    setFileError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = validateCustomQuoteInquiry({
      service,
      name,
      address: addressValue,
      phone,
      email,
      notes,
      acceptedTerms,
      marketingOptIn,
      attachments: attachments.map(({ name: n, size, type }) => ({ name: n, size, type })),
    });

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setSubmitted(false);
      const firstBad = Object.keys(parsed.fieldErrors)[0];
      if (firstBad) {
        const el = form.elements.namedItem(firstBad) as HTMLElement | null;
        el?.focus();
      }
      return;
    }

    setFieldErrors({});
    const configLines = configs.map(
      (c, i) =>
        `${i + 1}. ${c.quantity.toLocaleString()} ${c.unit} · ${c.itemName} (${formatCurrency(calculateLineTotal(c))} @ ${formatUnitRate(c.unitRate, c.unit)})\n   ${c.specsSummary}`,
    );
    const body = [
      `Custom 3D Quote Request — ${parsed.data.service}`,
      `Property Address: ${parsed.data.address}`,
      `Customer: ${parsed.data.name} | ${parsed.data.phone} | ${parsed.data.email}`,
      `Marketing Updates: ${parsed.data.marketingOptIn ? "Yes" : "No"}`,
      "",
      "Selected Configurations:",
      ...(configLines.length > 0 ? configLines : ["(Custom inquiry — no saved items)"]),
      "",
      `Informational Total Estimate: ~${formatCurrency(totalEstimate)}`,
      ...(parsed.data.notes ? ["", `Notes: ${parsed.data.notes}`] : []),
      ...(attachments.length > 0
        ? ["", `Attached files referenced: ${attachments.map((a) => a.name).join(", ")}`]
        : []),
    ].join("\n");

    const subject = `Custom Quote Request (${parsed.data.service}) — ${address.street}`;
    window.location.assign(`mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setSubmitted(true);
  }

  const fieldBase =
    "field-control block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-brand-900 placeholder:font-normal placeholder:text-slate-400 focus:border-brand-700";

  return (
    <div>
      {/* Header row matching reference layout */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToStudio}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 hover:text-accent-700"
          >
            <span aria-hidden="true">←</span> Back to 3D Studio
          </button>
          <h2 className="text-3xl font-extrabold tracking-tight text-brand-900 sm:text-4xl">
            Get your free custom quote
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
            Enter your details below and our experts will be in touch within 24 hours to discuss your project.
          </p>
        </div>
      </div>

      {/* Main 2-column split matching screenshot (side-by-side on medium/desktop viewports) */}
      <div className="grid items-start gap-6 md:grid-cols-12 lg:gap-8">
        {/* LEFT COLUMN — Quote Form Card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md sm:p-7 md:col-span-6"
        >
          <div className="space-y-4">
            {/* Service select with notched floating label */}
            <div className="relative pt-1.5">
              <label
                htmlFor={`${uid}-service`}
                className="absolute left-3 top-0 z-10 bg-white px-1 text-xs font-semibold text-slate-600"
              >
                Service <span className="text-accent-700" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <select
                  id={`${uid}-service`}
                  name="service"
                  required
                  value={service}
                  onChange={(e) => {
                    setService(e.target.value);
                    clearFieldError("service");
                  }}
                  aria-invalid={fieldErrors.service ? "true" : "false"}
                  aria-describedby={fieldErrors.service ? `${uid}-service-err` : undefined}
                  className={`${fieldBase} appearance-none pr-10`}
                >
                  {serviceOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-900"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {fieldErrors.service && (
                <p id={`${uid}-service-err`} className="mt-1 text-xs font-medium text-red-700">
                  <span role="img" aria-label="Error">⚠</span> {fieldErrors.service}
                </p>
              )}
            </div>

            {/* Your name */}
            <div className="relative pt-1.5">
              <label
                htmlFor={`${uid}-name`}
                className="absolute left-3 top-0 z-10 bg-white px-1 text-xs font-semibold text-slate-600"
              >
                Your name <span className="text-accent-700" aria-hidden="true">*</span>
              </label>
              <input
                id={`${uid}-name`}
                name="name"
                type="text"
                required
                autoComplete="name"
                enterKeyHint="next"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError("name");
                }}
                placeholder="Jane Smith"
                aria-invalid={fieldErrors.name ? "true" : "false"}
                aria-describedby={fieldErrors.name ? `${uid}-name-err` : undefined}
                className={fieldBase}
              />
              {fieldErrors.name && (
                <p id={`${uid}-name-err`} className="mt-1 text-xs font-medium text-red-700">
                  <span role="img" aria-label="Error">⚠</span> {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Your address (pre-filled from ZIP lookup) */}
            <div className="relative pt-1.5">
              <label
                htmlFor={`${uid}-address`}
                className="absolute left-3 top-0 z-10 bg-white px-1 text-xs font-semibold text-slate-600"
              >
                Your address <span className="text-accent-700" aria-hidden="true">*</span>
              </label>
              <input
                id={`${uid}-address`}
                name="address"
                type="text"
                required
                autoComplete="street-address"
                enterKeyHint="next"
                value={addressValue}
                onChange={(e) => {
                  setAddressValue(e.target.value);
                  clearFieldError("address");
                }}
                aria-invalid={fieldErrors.address ? "true" : "false"}
                aria-describedby={fieldErrors.address ? `${uid}-address-err` : undefined}
                className={fieldBase}
              />
              {fieldErrors.address && (
                <p id={`${uid}-address-err`} className="mt-1 text-xs font-medium text-red-700">
                  <span role="img" aria-label="Error">⚠</span> {fieldErrors.address}
                </p>
              )}
            </div>

            {/* Your phone number */}
            <div className="relative pt-1.5">
              <label
                htmlFor={`${uid}-phone`}
                className="absolute left-3 top-0 z-10 bg-white px-1 text-xs font-semibold text-slate-600"
              >
                Your phone number <span className="text-accent-700" aria-hidden="true">*</span>
              </label>
              <input
                id={`${uid}-phone`}
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                enterKeyHint="next"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearFieldError("phone");
                }}
                placeholder="(555) 123-4567"
                aria-invalid={fieldErrors.phone ? "true" : "false"}
                aria-describedby={fieldErrors.phone ? `${uid}-phone-err` : undefined}
                className={fieldBase}
              />
              {fieldErrors.phone && (
                <p id={`${uid}-phone-err`} className="mt-1 text-xs font-medium text-red-700">
                  <span role="img" aria-label="Error">⚠</span> {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* Your email */}
            <div className="relative pt-1.5">
              <label
                htmlFor={`${uid}-email`}
                className="absolute left-3 top-0 z-10 bg-white px-1 text-xs font-semibold text-slate-600"
              >
                Your email <span className="text-accent-700" aria-hidden="true">*</span>
              </label>
              <input
                id={`${uid}-email`}
                name="email"
                type="email"
                required
                autoComplete="email"
                enterKeyHint="next"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                placeholder="you@example.com"
                aria-invalid={fieldErrors.email ? "true" : "false"}
                aria-describedby={fieldErrors.email ? `${uid}-email-err` : undefined}
                className={fieldBase}
              />
              {fieldErrors.email && (
                <p id={`${uid}-email-err`} className="mt-1 text-xs font-medium text-red-700">
                  <span role="img" aria-label="Error">⚠</span> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Notes (optional) */}
            <div className="relative pt-1.5">
              <label
                htmlFor={`${uid}-notes`}
                className="absolute left-3 top-0 z-10 bg-white px-1 text-xs font-semibold text-slate-600"
              >
                Notes (optional)
              </label>
              <textarea
                id={`${uid}-notes`}
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share gate access details, HOA preferences, or timeline notes…"
                className="field-control block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-brand-900 placeholder:text-slate-400 focus:border-brand-700"
              />
            </div>

            {/* Drag and drop / Attach File bar matching screenshot */}
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors ${
                  dragActive
                    ? "border-accent-600 bg-orange-50/60"
                    : "border-slate-300 bg-slate-50/70"
                }`}
              >
                <span className="text-xs font-medium text-slate-600">
                  Drag and drop files here or click the button
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-brand-900 shadow-xs transition-colors hover:border-brand-700 hover:bg-brand-50"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  Attach File
                </button>
              </div>
              {fileError && (
                <p className="mt-1 text-xs font-medium text-red-700">
                  <span role="img" aria-label="Error">⚠</span> {fileError}
                </p>
              )}
              {attachments.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <li
                      key={file.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-brand-900"
                    >
                      <span className="max-w-[180px] truncate">{file.name}</span>
                      <span className="text-slate-400">({formatFileSize(file.size)})</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.id)}
                        aria-label={`Remove ${file.name}`}
                        className="text-slate-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Terms of Use checkbox (required) */}
            <div>
              <label htmlFor={`${uid}-terms`} className="brand-checkbox-label text-xs font-medium text-slate-700">
                <input
                  id={`${uid}-terms`}
                  name="acceptedTerms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    clearFieldError("acceptedTerms");
                  }}
                  aria-invalid={fieldErrors.acceptedTerms ? "true" : "false"}
                  aria-describedby={fieldErrors.acceptedTerms ? `${uid}-terms-err` : undefined}
                  className="brand-checkbox"
                />
                <span>
                  I agree to the <span className="font-semibold text-brand-900 underline underline-offset-2">Terms of Use</span>
                </span>
              </label>
              {fieldErrors.acceptedTerms && (
                <p id={`${uid}-terms-err`} className="mt-1 text-xs font-medium text-red-700">
                  <span role="img" aria-label="Error">⚠</span> {fieldErrors.acceptedTerms}
                </p>
              )}
            </div>

            {/* Primary CTA button */}
            <button type="submit" className="btn btn-primary btn-lg w-full">
              Get a quote
            </button>

            {/* Optional marketing checkbox */}
            <label htmlFor={`${uid}-marketing`} className="brand-checkbox-label text-xs font-medium text-slate-600">
              <input
                id={`${uid}-marketing`}
                name="marketingOptIn"
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="brand-checkbox"
              />
              <span>Email me interesting insights and company news</span>
            </label>

            {submitted && (
              <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-900">
                Your quote summary has been prepared in your email app for <strong>{address.street}</strong> (estimated total{" "}
                <strong>~{formatCurrency(totalEstimate)}</strong>). Press send to finish, or call{" "}
                <a href={`tel:${site.phoneHref}`} className="font-bold underline">
                  {site.phone}
                </a>
                .
              </div>
            )}
          </div>
        </form>

        {/* RIGHT COLUMN — Address Header, Map Preview & Selected Configurations */}
        <div className="space-y-5 md:col-span-6">
          {/* Selected Address Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3.5">
            <div>
              <h3 className="text-lg font-extrabold text-brand-900">{address.street}</h3>
              <p className="text-xs font-medium text-slate-500">
                {address.city}, {address.state} {address.zip}, {address.country}
              </p>
            </div>
            <button
              type="button"
              onClick={onChangeAddress}
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-900 hover:border-brand-700 hover:bg-brand-50"
            >
              Change address
            </button>
          </div>

          {/* Interactive Street Map Card */}
          <PropertyMapCard address={address} />

          {/* Selected Configurations Card matching screenshot */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-brand-900">Selected configurations</h3>
                <span className="inline-flex size-6 items-center justify-center rounded-md bg-brand-900 text-xs font-extrabold text-white">
                  {configs.length}
                </span>
              </div>
              <button
                type="button"
                onClick={onAddConfig}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-brand-900 shadow-xs transition-colors hover:border-accent-600 hover:bg-orange-50/50"
              >
                <span aria-hidden="true">+</span> Add a config
              </button>
            </div>

            {configs.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-semibold text-slate-700">No configurations selected yet.</p>
                <button
                  type="button"
                  onClick={onAddConfig}
                  className="btn btn-secondary mt-3 text-xs"
                >
                  + Add a 3D configuration
                </button>
              </div>
            ) : (
              <div className="mt-4 max-h-[420px] space-y-3.5 overflow-y-auto pr-1">
                {configs.map((cfg) => {
                  const lineTotal = calculateLineTotal(cfg);
                  const qtyLabel = cfg.unit === "ft" ? "Length" : "Roof Area";
                  return (
                    <div
                      key={cfg.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-slate-300"
                    >
                      <div className="flex items-start gap-3.5">
                        {/* 3D snapshot thumbnail (or swatch fallback) */}
                        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-sky-200 to-sky-100 shadow-xs">
                          {cfg.snapshotUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cfg.snapshotUrl}
                              alt={`3D preview of ${cfg.itemName}`}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="grid size-full place-items-center">
                              <span
                                className="size-10 rounded-lg border border-black/15 shadow-inner"
                                style={{ backgroundColor: cfg.accentColor }}
                                aria-hidden="true"
                              />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-extrabold leading-snug text-brand-900">
                              {cfg.quantity.toLocaleString()} {cfg.unit} · {cfg.itemName}
                            </p>
                            <span className="shrink-0 text-sm font-extrabold text-brand-900">
                              ~{formatCurrency(lineTotal)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">{cfg.specsSummary}</p>

                          {/* Quick tier selector pills */}
                          <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label={`Package tier for ${cfg.serviceLabel}`}>
                            {cfg.availableTiers.map((tier) => {
                              const active = cfg.tierName === tier;
                              return (
                                <button
                                  key={tier}
                                  type="button"
                                  onClick={() => onUpdateTier(cfg.id, tier)}
                                  aria-pressed={active}
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                                    active
                                      ? "bg-brand-900 text-white"
                                      : "border border-slate-200 bg-white text-slate-600 hover:border-brand-700"
                                  }`}
                                >
                                  {tier}
                                </button>
                              );
                            })}
                          </div>

                          {/* Quantity input + Unit Rate + Edit / Trash controls (matching screenshot!) */}
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <label
                                  htmlFor={`${uid}-qty-${cfg.id}`}
                                  className="absolute -top-2 left-2.5 bg-slate-50 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                                >
                                  {qtyLabel}
                                </label>
                                <div className="flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1.5">
                                  <input
                                    id={`${uid}-qty-${cfg.id}`}
                                    type="number"
                                    min={cfg.minQuantity}
                                    max={cfg.maxQuantity}
                                    step={cfg.unit === "ft" ? 5 : 100}
                                    value={cfg.quantity}
                                    onChange={(e) => {
                                      const n = Number(e.target.value);
                                      if (Number.isFinite(n) && n > 0) onUpdateQuantity(cfg.id, n);
                                    }}
                                    className="w-16 bg-transparent text-sm font-bold text-brand-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                  />
                                  <span className="ml-1.5 shrink-0 text-xs font-semibold text-slate-400">{cfg.unit}</span>
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-slate-500">
                                × {formatUnitRate(cfg.unitRate, cfg.unit)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onEditConfig(cfg)}
                                aria-label={`Edit ${cfg.itemName} in 3D`}
                                title="Edit in 3D Studio"
                                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-brand-900 transition-colors hover:border-brand-700 hover:bg-brand-50"
                              >
                                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteConfig(cfg.id)}
                                aria-label={`Remove ${cfg.itemName}`}
                                title="Remove configuration"
                                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-red-600 transition-colors hover:border-red-300 hover:bg-red-50"
                              >
                                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Estimate Footer */}
            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-bold text-slate-700">Total estimate</span>
                <span className="text-2xl font-extrabold tracking-tight text-brand-900">
                  ~{formatCurrency(totalEstimate)}
                </span>
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500">
                The prices shown are for informational purposes only. Actual prices may vary with project complexity,
                material price fluctuations and additional options. Contact us to speak to an expert and get a
                personalized full quote.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
