"use client";

import {
  FENCE_CATALOG,
  FENCE_HEIGHT_OPTIONS,
  FENCE_PLACEMENT_OPTIONS,
  getFenceFinish,
  getFenceStyle,
} from "../catalogs/fencing";
import {
  currentMaterialOptions,
  desiredMaterialOptions,
  SLOPE_OPTIONS,
} from "../catalogs/roofing";
import type {
  Answers,
  BuildingType,
  FenceHeight,
  FencePlacement,
  Material,
  PreviewMode,
  ServiceId,
  Slope,
  Stories,
  YesNo,
} from "../domain/schemas";
import { OptionVisual } from "./OptionVisual";

type Props = {
  services: readonly ServiceId[];
  answers: Partial<Answers>;
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  onUpdate: <K extends keyof Answers>(id: K, value: Answers[K]) => void;
  onShowPackages: () => void;
};

const pillBase =
  "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition-all";
const pillOn = "border-accent-600 bg-orange-50/45 text-brand-900 shadow-xs";
const pillOff = "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";

export function LiveDecorator({
  services,
  answers,
  previewMode,
  onPreviewModeChange,
  onUpdate,
  onShowPackages,
}: Props) {
  const hasRoof = services.includes("roofing");
  const hasFence = services.includes("fencing");

  const slope: Slope = answers.slope ?? "moderate";
  const stories: Stories = answers.stories ?? "single";
  const buildingType: BuildingType = answers.buildingType ?? "residential";

  const fenceStyle = getFenceStyle(answers.fenceStyle);
  const fenceFinish = getFenceFinish(fenceStyle.id, answers.fenceFinish);
  const fenceHeight: FenceHeight = answers.fenceHeight ?? fenceStyle.defaultHeight;
  const fencePlacement: FencePlacement = answers.fencePlacement ?? "backyard";
  const fenceGate: YesNo = answers.fenceGate ?? "yes";

  const roofMaterials =
    previewMode === "current"
      ? currentMaterialOptions({ ...answers, slope })
      : desiredMaterialOptions({ ...answers, slope });
  const activeRoofMat: Material =
    previewMode === "current"
      ? (answers.currentMaterial ?? (slope === "flat" ? "tpo" : "asphalt"))
      : (answers.desiredType ?? (slope === "flat" ? "tpo" : "asphalt"));

  return (
    <div className="space-y-6">
      <section aria-label="Building shape" className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Building &amp; lot</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div role="group" aria-label="Building type" className="grid grid-cols-2 gap-2">
            {(["residential", "commercial"] as const).map((bt) => (
              <button
                key={bt}
                type="button"
                aria-pressed={buildingType === bt}
                onClick={() => onUpdate("buildingType", bt)}
                className={`${pillBase} capitalize ${buildingType === bt ? pillOn : pillOff}`}
              >
                {bt}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Stories" className="grid grid-cols-2 gap-2">
            {([
              ["single", "1 Story"],
              ["multiple", "Multi-Story"],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                aria-pressed={stories === val}
                onClick={() => onUpdate("stories", val)}
                className={`${pillBase} ${stories === val ? pillOn : pillOff}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {hasRoof && (
        <section aria-label="Roof decoration" className="space-y-4 border-t border-slate-200 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-900">Roofing</h2>
            <div role="group" aria-label="Roof view state" className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-0.5 text-xs">
              <button
                type="button"
                aria-pressed={previewMode === "new"}
                onClick={() => onPreviewModeChange("new")}
                className={`rounded-full px-3 py-1 font-bold ${previewMode === "new" ? "bg-accent-600 text-white" : "text-slate-600"}`}
              >
                New roof
              </button>
              <button
                type="button"
                aria-pressed={previewMode === "current"}
                onClick={() => onPreviewModeChange("current")}
                className={`rounded-full px-3 py-1 font-bold ${previewMode === "current" ? "bg-white text-brand-900 shadow-xs" : "text-slate-600"}`}
              >
                Current roof
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">Roof slope</p>
            <div role="group" aria-label="Roof slope" className="grid grid-cols-4 gap-2">
              {SLOPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={slope === opt.value}
                  onClick={() => onUpdate("slope", opt.value as Slope)}
                  className={`${pillBase} px-2 text-xs sm:text-sm ${slope === opt.value ? pillOn : pillOff}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">
              {previewMode === "new" ? "New roof material" : "Current roof material"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {roofMaterials.map((opt) => {
                const active = activeRoofMat === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      onUpdate(
                        previewMode === "new" ? "desiredType" : "currentMaterial",
                        opt.value as Material,
                      )
                    }
                    className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all ${
                      active ? pillOn : pillOff
                    }`}
                  >
                    <OptionVisual stepId="currentMaterial" value={opt.value} />
                    <span className="text-sm font-bold text-brand-900">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {previewMode === "new" ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
              <div>
                <p className="text-sm font-bold text-brand-900">Solar panels</p>
                <p className="text-xs text-slate-500">Preview monocrystalline solar array on your roof</p>
              </div>
              <div role="group" aria-label="Solar panels" className="flex gap-1.5">
                {(["yes", "no"] as const).map((v) => {
                  const active = (answers.solar ?? "no") === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onUpdate("solar", v)}
                      className={`min-h-9 rounded-lg border-2 px-3 text-xs font-bold uppercase ${active ? pillOn : pillOff}`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="mb-1.5 text-xs font-bold text-brand-900">Roof age (weathering)</p>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    ["0-10", "0–10 yr"],
                    ["10+", "10+ yr"],
                    ["unsure", "Unsure"],
                  ] as const).map(([v, lbl]) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={(answers.roofAge ?? "0-10") === v}
                      onClick={() => onUpdate("roofAge", v)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                        (answers.roofAge ?? "0-10") === v ? pillOn : pillOff
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="mb-1.5 text-xs font-bold text-brand-900">Leaks or damage</p>
                <div className="flex gap-1.5">
                  {(["yes", "no"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={(answers.damage ?? "no") === v}
                      onClick={() => onUpdate("damage", v)}
                      className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase ${
                        (answers.damage ?? "no") === v ? pillOn : pillOff
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {hasFence && (
        <section aria-label="Fence decoration" className="space-y-4 border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-900">
              Fencing · {fenceStyle.label}
            </h2>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-900">
              {fenceHeight} · {fenceFinish.label}
            </span>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">Fence style</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {FENCE_CATALOG.map((style) => {
                const active = fenceStyle.id === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onUpdate("fenceStyle", style.id)}
                    className={`flex min-h-14 cursor-pointer items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all ${
                      active ? pillOn : pillOff
                    }`}
                  >
                    <OptionVisual stepId="fenceStyle" value={style.id} />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-brand-900">{style.label}</span>
                      <span className="block truncate text-[0.7rem] text-slate-500">{style.shortDescription}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">Color &amp; finish</p>
            <div className="flex flex-wrap gap-2">
              {fenceStyle.finishes.map((fin) => {
                const active = fenceFinish.id === fin.id;
                return (
                  <button
                    key={fin.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onUpdate("fenceFinish", fin.id)}
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                      active ? pillOn : pillOff
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="relative size-5 shrink-0 overflow-hidden rounded-full border border-slate-300 shadow-inner"
                      style={{ backgroundColor: fin.color }}
                    >
                      {fin.postColor && (
                        <span className="absolute inset-y-0 right-0 w-1.5" style={{ backgroundColor: fin.postColor }} />
                      )}
                    </span>
                    <span>{fin.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-600">Height</p>
              <div role="group" aria-label="Fence height" className="grid grid-cols-3 gap-1.5">
                {FENCE_HEIGHT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={fenceHeight === opt.value}
                    onClick={() => onUpdate("fenceHeight", opt.value)}
                    className={`${pillBase} px-2 text-xs ${fenceHeight === opt.value ? pillOn : pillOff}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-slate-600">Matching gates</p>
              <div role="group" aria-label="Matching gates" className="grid grid-cols-2 gap-1.5">
                {([
                  ["yes", "With gates"],
                  ["no", "Open entry"],
                ] as const).map(([v, lbl]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={fenceGate === v}
                    onClick={() => onUpdate("fenceGate", v)}
                    className={`${pillBase} px-2 text-xs ${fenceGate === v ? pillOn : pillOff}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">Placement around house</p>
            <div role="group" aria-label="Fence placement" className="grid grid-cols-3 gap-2">
              {FENCE_PLACEMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={fencePlacement === opt.value}
                  onClick={() => onUpdate("fencePlacement", opt.value)}
                  className={`${pillBase} flex-col gap-0.5 px-2 py-2 text-center text-xs ${
                    fencePlacement === opt.value ? pillOn : pillOff
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="border-t border-slate-100 pt-4">
        <button type="button" onClick={onShowPackages} className="btn btn-primary btn-lg w-full">
          View matching packages →
        </button>
      </div>
    </div>
  );
}
