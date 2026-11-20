"use client";

import { useId, useState } from "react";
import { validateContactInquiry } from "@/features/configurator";
import { services } from "@/lib/services";
import { site } from "@/lib/site";

/**
 * Contact form with shared Zod runtime validation.
 * Composes an email in the visitor's mail app (`mailto:`) so it works with no backend;
 * for production, swap the `mailto:` line for a Server Action or email API route.
 */
export function ContactForm() {
  const uid = useId();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  function clearFieldError(name: string) {
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    const parsed = validateContactInquiry({
      name: String(d.get("name") ?? ""),
      phone: String(d.get("phone") ?? ""),
      email: String(d.get("email") ?? ""),
      service: String(d.get("service") ?? ""),
      message: String(d.get("message") ?? ""),
    });

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setSent(false);
      const firstBad = Object.keys(parsed.fieldErrors)[0];
      if (firstBad) {
        const el = form.elements.namedItem(firstBad) as HTMLElement | null;
        el?.focus();
      }
      return;
    }

    setFieldErrors({});
    const body = [
      `Name: ${parsed.data.name}`,
      `Phone: ${parsed.data.phone}`,
      `Email: ${parsed.data.email}`,
      `Service: ${parsed.data.service}`,
      "",
      parsed.data.message,
    ].join("\n");
    const subject = `Estimate request — ${parsed.data.service}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  const field =
    "field-control mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-700";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-extrabold">Request a free estimate</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-name`} className="block text-sm font-semibold text-slate-700">
            Full name <span className="text-accent-700" aria-hidden="true">*</span>
          </label>
          <input
            id={`${uid}-name`}
            name="name"
            required
            autoComplete="name"
            enterKeyHint="next"
            aria-invalid={fieldErrors.name ? "true" : "false"}
            aria-describedby={fieldErrors.name ? `${uid}-name-err` : undefined}
            onChange={() => clearFieldError("name")}
            className={field}
          />
          {fieldErrors.name && (
            <p id={`${uid}-name-err`} className="mt-1.5 text-xs font-medium text-red-700">
              <span role="img" aria-label="Error">⚠</span> {fieldErrors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className="block text-sm font-semibold text-slate-700">
            Phone <span className="text-accent-700" aria-hidden="true">*</span>
          </label>
          <input
            id={`${uid}-phone`}
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            enterKeyHint="next"
            aria-invalid={fieldErrors.phone ? "true" : "false"}
            aria-describedby={fieldErrors.phone ? `${uid}-phone-err` : undefined}
            onChange={() => clearFieldError("phone")}
            className={field}
          />
          {fieldErrors.phone && (
            <p id={`${uid}-phone-err`} className="mt-1.5 text-xs font-medium text-red-700">
              <span role="img" aria-label="Error">⚠</span> {fieldErrors.phone}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-email`} className="block text-sm font-semibold text-slate-700">
          Email <span className="text-accent-700" aria-hidden="true">*</span>
        </label>
        <input
          id={`${uid}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          enterKeyHint="next"
          aria-invalid={fieldErrors.email ? "true" : "false"}
          aria-describedby={fieldErrors.email ? `${uid}-email-err` : undefined}
          onChange={() => clearFieldError("email")}
          className={field}
        />
        {fieldErrors.email && (
          <p id={`${uid}-email-err`} className="mt-1.5 text-xs font-medium text-red-700">
            <span role="img" aria-label="Error">⚠</span> {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${uid}-service`} className="block text-sm font-semibold text-slate-700">
          Service needed <span className="text-accent-700" aria-hidden="true">*</span>
        </label>
        <span className="relative mt-1.5 block">
          <select
            id={`${uid}-service`}
            name="service"
            required
            defaultValue=""
            aria-invalid={fieldErrors.service ? "true" : "false"}
            aria-describedby={fieldErrors.service ? `${uid}-service-err` : undefined}
            onChange={() => clearFieldError("service")}
            className="field-control block w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 font-normal text-base text-slate-900 focus:border-brand-700"
          >
            <option value="" disabled>Select a service…</option>
            {services.map((s) => (
              <option key={s.slug}>{s.title}</option>
            ))}
            <option>Roof inspection</option>
            <option>Other</option>
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-brand-900"
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
        </span>
        {fieldErrors.service && (
          <p id={`${uid}-service-err`} className="mt-1.5 text-xs font-medium text-red-700">
            <span role="img" aria-label="Error">⚠</span> {fieldErrors.service}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${uid}-message`} className="block text-sm font-semibold text-slate-700">
          How can we help? <span className="text-accent-700" aria-hidden="true">*</span>
        </label>
        <textarea
          id={`${uid}-message`}
          name="message"
          rows={4}
          required
          enterKeyHint="done"
          aria-invalid={fieldErrors.message ? "true" : "false"}
          aria-describedby={fieldErrors.message ? `${uid}-message-err` : undefined}
          onChange={() => clearFieldError("message")}
          className={field}
        />
        {fieldErrors.message && (
          <p id={`${uid}-message-err`} className="mt-1.5 text-xs font-medium text-red-700">
            <span role="img" aria-label="Error">⚠</span> {fieldErrors.message}
          </p>
        )}
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-full">Send request</button>
      <p role="status" className="text-sm text-slate-600">
        {sent ? "Your email app should now be open — press send to finish your request." : "We respond within one business day."}
      </p>
    </form>
  );
}
