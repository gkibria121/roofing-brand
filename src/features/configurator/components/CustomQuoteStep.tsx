"use client";

import { useId } from "react";
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
import type { CustomQuoteInquiry, PropertyAddress } from "../domain/schemas";
import { PropertyMapCard } from "./PropertyMapCard";
import { QuoteRequestForm, type AttachedFile } from "./QuoteRequestForm";

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

  const defaultService = inferDefaultServiceLabel(configs);
  const serviceOptions = Array.from(
    new Set([
      defaultService,
      "Roofing + Custom Fencing",
      ...ROOF_MATERIAL_CATALOG.filter((m) => m.offeredAsNew).map((m) => `${m.label} Roof`),
      ...FENCE_CATALOG.map((f) => `${f.label} Fence`),
    ]),
  );

  const totalEstimate = calculateQuoteTotal(configs);

  function buildConfiguratorSubmission(data: CustomQuoteInquiry, attachments: readonly AttachedFile[]) {
    const configLines = configs.map(
      (c, i) =>
        `${i + 1}. ${c.quantity.toLocaleString()} ${c.unit} · ${c.itemName} (${formatCurrency(calculateLineTotal(c))} @ ${formatUnitRate(c.unitRate, c.unit)})\n   ${c.specsSummary}`,
    );
    const body = [
      `Custom 3D Quote Request — ${data.service}`,
      `Property Address: ${data.address}`,
      `Customer: ${data.name} | ${data.phone} | ${data.email}`,
      `Marketing Updates: ${data.marketingOptIn ? "Yes" : "No"}`,
      "",
      "Selected Configurations:",
      ...(configLines.length > 0 ? configLines : ["(Custom inquiry — no saved items)"]),
      "",
      `Informational Total Estimate: ~${formatCurrency(totalEstimate)}`,
      ...(data.notes ? ["", `Notes: ${data.notes}`] : []),
      ...(attachments.length > 0
        ? ["", `Attached files referenced: ${attachments.map((a) => a.name).join(", ")}`]
        : []),
    ].join("\n");

    return {
      subject: `Custom Quote Request (${data.service}) — ${address.street}`,
      body,
      confirmation: (
        <>
          Your quote summary has been prepared in your email app for <strong>{address.street}</strong> (estimated total{" "}
          <strong>~{formatCurrency(totalEstimate)}</strong>). Press send to finish, or call{" "}
          <a href={`tel:${site.phoneHref}`} className="font-bold underline">
            {site.phone}
          </a>
          .
        </>
      ),
    };
  }

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
        <QuoteRequestForm
          key={address.id}
          serviceOptions={serviceOptions}
          defaultService={defaultService}
          defaultAddress={address.fullAddress}
          buildSubmission={buildConfiguratorSubmission}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md sm:p-7 md:col-span-6"
        />

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
