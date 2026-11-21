"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { lookupAddressesByZip } from "@/features/configurator";
import { findServiceAreaByZip, type ServiceAreaInfo } from "@/lib/serviceAreas";

export function ServiceAreaZipChecker() {
  const uid = useId();
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState<{
    ok: boolean;
    text: string;
    zip?: string;
    matchedArea?: ServiceAreaInfo;
  } | null>(null);
  const [checking, setChecking] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = zip.replace(/\D/g, "");
    if (clean.length !== 5) {
      setStatus({ ok: false, text: "Please enter a valid 5-digit US ZIP code (e.g. 75081)." });
      return;
    }
    setChecking(true);
    try {
      const res = await lookupAddressesByZip(clean);
      const matchedArea = findServiceAreaByZip(clean);
      setStatus({
        ok: true,
        zip: res.zip,
        matchedArea,
        text: `Great news! We serve ${res.city}, ${res.state} ${res.zip}. Launch the 3D estimator with your ZIP preloaded.`,
      });
    } catch {
      setStatus({ ok: false, text: "Could not verify that ZIP code right now. Please try again." });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-extrabold text-brand-900">Check your ZIP code availability</h2>
      <p className="mt-1.5 text-sm text-slate-600">
        Enter any 5-digit ZIP code to confirm local crew coverage and launch your 3D property estimate.
      </p>
      <search>
        <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label htmlFor={`${uid}-zip`} className="sr-only">
            5-digit ZIP code
          </label>
          <input
            id={`${uid}-zip`}
            name="postal-code"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={zip}
            onChange={(e) => {
              setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
              if (status) setStatus(null);
            }}
            placeholder="Enter 5-digit ZIP (e.g. 75081)"
            className="field-control flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base font-semibold text-brand-900 focus:border-accent-600"
          />
          <button type="submit" disabled={checking} className="btn btn-primary shrink-0">
            {checking ? "Checking…" : "Check Coverage"}
          </button>
        </form>
      </search>

      {status && (
        <div
          role="status"
          className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-sm font-medium ${
            status.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span>{status.text}</span>
          {status.ok && (
            <div className="flex flex-wrap items-center gap-2">
              {status.matchedArea && (
                <Link
                  href={`/service-areas/${status.matchedArea.slug}`}
                  className="btn btn-secondary text-xs"
                >
                  {status.matchedArea.name} Guide
                </Link>
              )}
              <button
                type="button"
                onClick={() => router.push(status.zip ? `/estimate?zip=${status.zip}` : "/estimate")}
                className="btn btn-primary text-xs"
              >
                Start 3D Estimate →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
