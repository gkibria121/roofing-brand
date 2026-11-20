"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  SAMPLE_ZIPS,
  createCustomPropertyAddress,
  lookupAddressesByZip,
  type ZipLookupResult,
} from "../domain/addressLookup";
import type { PropertyAddress } from "../domain/schemas";

type Props = {
  initialZip?: string;
  onSelectAddress: (address: PropertyAddress) => void;
};

export function ZipAddressLookup({ initialZip = "", onSelectAddress }: Props) {
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [zipInput, setZipInput] = useState(initialZip.replace(/\D/g, "").slice(0, 5));
  const [result, setResult] = useState<ZipLookupResult | null>(null);
  const [failedZip, setFailedZip] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [customStreet, setCustomStreet] = useState("");
  const [showCustomEntry, setShowCustomEntry] = useState(false);

  const cleanZip = zipInput.replace(/\D/g, "");
  const activeResult = cleanZip.length === 5 && result?.zip === cleanZip ? result : null;
  const loading = cleanZip.length === 5 && activeResult === null && failedZip !== cleanZip;

  useEffect(() => {
    if (cleanZip.length !== 5) return;

    const controller = new AbortController();
    let cancelled = false;

    lookupAddressesByZip(cleanZip, { signal: controller.signal })
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setFailedZip(null);
        setActiveIndex(0);
      })
      .catch(() => {
        if (!cancelled) setFailedZip(cleanZip);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cleanZip]);

  const addresses = activeResult?.addresses ?? [];

  function handleZipChange(raw: string) {
    const next = raw.replace(/\D/g, "").slice(0, 5);
    setZipInput(next);
    setActiveIndex(0);
    if (next.length < 5) {
      setShowCustomEntry(false);
      setFailedZip(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!addresses.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % addresses.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + addresses.length) % addresses.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = addresses[activeIndex];
      if (target) onSelectAddress(target);
    } else if (e.key === "Escape") {
      setZipInput("");
    }
  }

  function submitCustomStreet(e: React.FormEvent) {
    e.preventDefault();
    if (!activeResult || customStreet.trim().length < 4) return;
    onSelectAddress(createCustomPropertyAddress(customStreet, activeResult));
  }

  const listboxId = `${uid}-addresses`;
  const zipInputId = `${uid}-zip`;
  const hintId = `${uid}-hint`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md sm:p-10">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-900">
            <svg viewBox="0 0 24 24" className="size-3.5 text-accent-600" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            Step 1 of 3 · Property Lookup
          </span>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-brand-900 sm:text-3xl">
            Enter your ZIP code to start your 3D estimate
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Select your property address below to open the interactive 3D house &amp; fence configurator.
          </p>
        </div>

        <div className="mt-7">
          <label htmlFor={zipInputId} className="block text-sm font-bold text-brand-900">
            Property ZIP code
          </label>
          <p id={hintId} className="mt-1 text-xs text-slate-500">
            Type any 5-digit US ZIP code (for example 75081) to see matching addresses.
          </p>

          <div className="relative mt-2.5">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>

            <input
              ref={inputRef}
              id={zipInputId}
              name="postal-code"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              pattern="[0-9]{5}"
              maxLength={5}
              value={zipInput}
              onChange={(e) => handleZipChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter 5-digit ZIP code (e.g. 75081)"
              role="combobox"
              aria-expanded={addresses.length > 0}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={addresses[activeIndex] ? `${uid}-opt-${activeIndex}` : undefined}
              aria-describedby={hintId}
              className="field-control w-full rounded-2xl border-2 border-slate-300 bg-white py-3.5 pl-12 pr-12 text-lg font-semibold tracking-wide text-brand-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-accent-600"
            />

            {zipInput.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setZipInput("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear ZIP code"
                className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {!activeResult && !loading && (
            <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Try a sample ZIP:</span>
              {SAMPLE_ZIPS.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => handleZipChange(z)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-brand-900 transition-colors hover:border-accent-600 hover:bg-orange-50/50"
                >
                  {z}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div role="status" className="mt-4 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-600">
              <span className="inline-block size-4 animate-spin rounded-full border-2 border-slate-300 border-t-accent-600" aria-hidden="true" />
              Looking up addresses in ZIP {zipInput}…
            </div>
          )}

          {!loading && activeResult && addresses.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Possible addresses in {activeResult.city}, {activeResult.state} {activeResult.zip}
                </p>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-brand-900 shadow-xs">
                  {addresses.length} found
                </span>
              </div>

              <ul
                id={listboxId}
                role="listbox"
                aria-label={`Possible addresses in ${activeResult.city}, ${activeResult.state} ${activeResult.zip}`}
                className="divide-y divide-slate-100"
              >
                {addresses.map((addr, idx) => {
                  const active = idx === activeIndex;
                  return (
                    <li
                      key={addr.id}
                      id={`${uid}-opt-${idx}`}
                      role="option"
                      aria-selected={active}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectAddress(addr)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors ${
                          active ? "bg-orange-50/60" : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            aria-hidden="true"
                            className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border ${
                              active
                                ? "border-accent-600 bg-accent-600 text-white"
                                : "border-slate-200 bg-slate-50 text-brand-900"
                            }`}
                          >
                            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
                              <circle cx="12" cy="10" r="2.2" />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-brand-900 sm:text-base">{addr.street}</p>
                            <p className="mt-0.5 text-xs text-slate-600">
                              {addr.city}, {addr.state} {addr.zip}, {addr.country} ·{" "}
                              <span className="font-medium text-slate-500">{addr.lotLabel}</span>
                            </p>
                          </div>
                        </div>
                        <span
                          aria-hidden="true"
                          className={`shrink-0 text-sm font-bold ${active ? "text-accent-700" : "text-slate-400"}`}
                        >
                          3D →
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                {!showCustomEntry ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomEntry(true)}
                    className="text-xs font-semibold text-brand-700 underline underline-offset-4 hover:text-accent-700"
                  >
                    Don’t see your street? Enter a custom street address in {activeResult.city}, {activeResult.state} {activeResult.zip}
                  </button>
                ) : (
                  <form onSubmit={submitCustomStreet} className="flex flex-col gap-2 sm:flex-row">
                    <label htmlFor={`${uid}-custom-street`} className="sr-only">
                      Street address in {activeResult.city}, {activeResult.state} {activeResult.zip}
                    </label>
                    <input
                      id={`${uid}-custom-street`}
                      type="text"
                      autoComplete="address-line1"
                      required
                      minLength={4}
                      value={customStreet}
                      onChange={(e) => setCustomStreet(e.target.value)}
                      placeholder={`Street address in ${activeResult.city}, ${activeResult.state} ${activeResult.zip}`}
                      className="field-control flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-brand-900 focus:border-accent-600"
                    />
                    <button type="submit" className="btn btn-primary shrink-0">
                      Open 3D Estimate →
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
