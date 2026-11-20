"use client";

import { useState } from "react";
import { site } from "@/lib/site";
import { services } from "@/lib/services";

/**
 * Starter contact form: composes an email in the visitor's mail app (mailto:),
 * so it works with no backend. For production, swap `onSubmit` for a server
 * action / API route / form service (Formspree, Resend, etc.).
 */
export function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const body = [
      `Name: ${d.get("name")}`,
      `Phone: ${d.get("phone")}`,
      `Email: ${d.get("email")}`,
      `Service: ${d.get("service")}`,
      "",
      `${d.get("message")}`,
    ].join("\n");
    const subject = `Estimate request — ${d.get("service")}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  const field =
    "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-700";

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-extrabold">Request a free estimate</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Full name
          <input name="name" required autoComplete="name" className={field} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Phone
          <input name="phone" type="tel" required autoComplete="tel" className={field} />
        </label>
      </div>
      <label className="block text-sm font-semibold text-slate-700">
        Email
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Service needed
        <span className="relative mt-1.5 block">
          <select name="service" required defaultValue="" className="block w-full appearance-none rounded-lg font-normal border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-base text-slate-900 focus:border-brand-700">
            <option value="" disabled>Select a service…</option>
            {services.map((s) => (<option key={s.slug}>{s.title}</option>))}
            <option>Roof inspection</option>
            <option>Other</option>
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-brand-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        How can we help?
        <textarea name="message" rows={4} required className={field} />
      </label>
      <button type="submit" className="btn btn-primary btn-lg w-full">Send request</button>
      <p role="status" className="text-sm text-slate-600">
        {sent ? "Your email app should now be open — press send to finish your request." : "We respond within one business day."}
      </p>
    </form>
  );
}
