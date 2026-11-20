import { site } from "@/lib/site";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <rect width="40" height="40" rx="9" fill="var(--color-brand-900)" />
        <path d="M6 22 20 9l14 13" fill="none" stroke="var(--color-accent-400)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 22v9h18v-9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-heading text-lg font-extrabold tracking-tight text-brand-900">{site.name.replace(" Roofing Systems", "")} Roofing</span>
        <span className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Systems</span>
      </span>
    </span>
  );
}
