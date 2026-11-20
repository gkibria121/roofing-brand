import type { StepId } from "@/lib/estimate/questions";

const swatchStyle: Record<string, { bg: string; pattern?: string }> = {
  asphalt: { bg: "#444a52", pattern: "repeating-linear-gradient(180deg, rgba(0,0,0,0.28) 0 2px, transparent 2px 9px)" },
  metal: { bg: "#6b7882", pattern: "repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0 2px, rgba(0,0,0,0.22) 2px 3px, transparent 3px 10px)" },
  tile: { bg: "#b8573a", pattern: "repeating-linear-gradient(90deg, rgba(0,0,0,0.25) 0 3px, rgba(255,255,255,0.16) 3px 6px, transparent 6px 11px)" },
  cedar: { bg: "#8b5e3c", pattern: "repeating-linear-gradient(180deg, rgba(0,0,0,0.25) 0 2px, transparent 2px 8px)" },
  tpo: { bg: "#f1f3f4", pattern: "repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0 1px, transparent 1px 14px)" },
  epdm: { bg: "#2b2d30", pattern: "repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 14px)" },
  modbit: { bg: "#5d6064", pattern: "radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)" },
};

export function OptionVisual({ stepId, value }: { stepId: StepId; value: string }) {
  if (stepId === "currentMaterial" || stepId === "desiredType") {
    const sw = swatchStyle[value];
    if (!sw) return null;
    return (
      <span
        aria-hidden="true"
        className="size-10 shrink-0 rounded-lg border border-slate-300 shadow-inner"
        style={{
          backgroundColor: sw.bg,
          backgroundImage: sw.pattern,
          backgroundSize: value === "modbit" ? "6px 6px" : undefined,
        }}
      />
    );
  }

  if (stepId === "slope") {
    const roofPath: Record<string, string> = {
      flat: "M4 13h16v7H4z M3 13h18",
      low: "M3 14 12 10l9 4M5 14v6h14v-6",
      moderate: "M3 14 12 7l9 7M5 14v6h14v-6",
      steep: "M3 15 12 4l9 11M5 15v5h14v-5",
    };
    return (
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-900">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={roofPath[value] ?? roofPath.moderate} />
        </svg>
      </span>
    );
  }

  if (stepId === "stories") {
    return (
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-900">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {value === "single" ? (
            <path d="M3 13 12 7l9 6M5 13v7h14v-7M10 20v-4h4v4" />
          ) : (
            <path d="M4 10 12 4l8 6M5 10v10h14V10M8 13h2M14 13h2M8 17h2M14 17h2" />
          )}
        </svg>
      </span>
    );
  }

  if (stepId === "buildingType") {
    return (
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-900">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {value === "residential" ? (
            <path d="M3 11 12 4l9 7M5 10v10h14V10M10 20v-5h4v5" />
          ) : (
            <path d="M4 20V5h10v15M14 10h6v10M3 20h18M7 9h2M11 9h1M7 13h2M11 13h1M16 14h2" />
          )}
        </svg>
      </span>
    );
  }

  if (stepId === "solar") {
    return (
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-900">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {value === "yes" ? (
            <path d="M12 3v2M18.4 5.6l-1.4 1.4M5.6 5.6 7 7M4 19l3-8h10l3 8H4ZM9.5 11 8 19M14.5 11l1.5 8M6 15h12" />
          ) : (
            <path d="M3 12 12 5l9 7M5 11v9h14v-9" />
          )}
        </svg>
      </span>
    );
  }

  return null;
}
