"use client";

import { useId } from "react";
import { SERVICE_REGISTRY } from "../domain/registry";
import type { ServiceId } from "../domain/schemas";

type Props = {
  selected: readonly ServiceId[];
  notice: string | null;
  onToggle: (id: ServiceId) => void;
};

/** Renders all registered 3D services dynamically from `SERVICE_REGISTRY`. */
export function ServiceSelector({ selected, notice, onToggle }: Props) {
  const uid = useId();

  return (
    <fieldset className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <legend className="sr-only">Select services to design in 3D</legend>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-extrabold uppercase tracking-wider text-brand-900">
          Select service(s) to decorate
        </p>
        <span className="text-xs text-slate-500">Pick one or combine multiple</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {SERVICE_REGISTRY.map((svc) => {
          const checked = selected.includes(svc.id);
          const id = `${uid}-svc-${svc.id}`;
          return (
            <div key={svc.id} className="relative">
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(svc.id)}
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
      {notice && (
        <p role="status" className="mt-2.5 text-xs font-medium text-amber-800">
          {notice}
        </p>
      )}
    </fieldset>
  );
}
