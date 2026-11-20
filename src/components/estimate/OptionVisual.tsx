import type { Option, StepId } from "@/lib/estimate/questions";

const swatchStyle: Record<string, { bg: string; pattern?: string }> = {
  asphalt: { bg: "#444a52", pattern: "repeating-linear-gradient(180deg, rgba(0,0,0,0.28) 0 2px, transparent 2px 9px)" },
  metal: { bg: "#6b7882", pattern: "repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0 2px, rgba(0,0,0,0.22) 2px 3px, transparent 3px 10px)" },
  tile: { bg: "#b8573a", pattern: "repeating-linear-gradient(90deg, rgba(0,0,0,0.25) 0 3px, rgba(255,255,255,0.16) 3px 6px, transparent 6px 11px)" },
  cedar: { bg: "#8b5e3c", pattern: "repeating-linear-gradient(180deg, rgba(0,0,0,0.25) 0 2px, transparent 2px 8px)" },
  tpo: { bg: "#f1f3f4", pattern: "repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0 1px, transparent 1px 14px)" },
  epdm: { bg: "#2b2d30", pattern: "repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 14px)" },
  modbit: { bg: "#5d6064", pattern: "radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)" },
};

export function OptionVisual({ stepId, value, option }: { stepId: StepId; value: string; option?: Option }) {
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

  if (stepId === "fenceFinish" && option?.swatch) {
    return (
      <span
        aria-hidden="true"
        className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-slate-300 shadow-inner"
        style={{ backgroundColor: option.swatch }}
      >
        {option.swatchSecondary && (
          <span
            className="absolute inset-y-0 right-0 w-3 border-l border-white/40"
            style={{ backgroundColor: option.swatchSecondary }}
          />
        )}
      </span>
    );
  }

  if (stepId === "fenceStyle") {
    const paths: Record<string, string> = {
      "wood-privacy": "M4 6v14M8 6v14M12 6v14M16 6v14M20 6v14M3 6h18M3 19h18",
      "vinyl-privacy": "M4 5h16v15H4zM9.3 5v15M14.7 5v15M3 5h18",
      "ornamental-iron": "M4 5v15M8 6v14M12 6v14M16 6v14M20 5v15M4 8h16M4 11h16M4 18h16",
      picket: "M5 8l1.5-2.5L8 8v12H5zM10.5 8l1.5-2.5L13.5 8v12h-3zM16 8l1.5-2.5L19 8v12h-3zM3 12h18M3 17h18",
      "horizontal-slat": "M4 5v15M20 5v15M4 7h16M4 10.5h16M4 14h16M4 17.5h16",
      "chain-link": "M4 5v15M20 5v15M4 6h16M4 6l14 14M10 6l10 10M4 12l8 8M20 6L6 20M14 6L4 16M20 12l-8 8",
    };
    return (
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-900">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={paths[value] ?? paths["wood-privacy"]} />
        </svg>
      </span>
    );
  }

  if (stepId === "fencePlacement") {
    return (
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-900">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8.5" y="9" width="7" height="6" rx="1" fill="currentColor" fillOpacity="0.16" />
          {value === "backyard" && <path d="M8.5 12H4V4h16v8h-4.5" />}
          {value === "full-perimeter" && <path d="M4 4h16v16h-5M11 20H4V4" />}
          {value === "front-yard" && <path d="M4 12v8h6M14 20h6v-8" />}
        </svg>
      </span>
    );
  }

  if (stepId === "fenceHeight") {
    const barH = value === "4ft" ? 8 : value === "6ft" ? 12 : 16;
    return (
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-900">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 20h16" />
          <rect x="7" y={20 - barH} width="10" height={barH} rx="1.5" fill="currentColor" fillOpacity="0.18" />
        </svg>
      </span>
    );
  }

  if (stepId === "fenceGate") {
    return (
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-900">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {value === "yes" ? (
            <path d="M4 6v14M20 6v14M4 8h7v10H4M13 8h7v10h-7M11 13h2" />
          ) : (
            <path d="M4 6v14M20 6v14M4 8h4M16 8h4M4 18h4M16 18h4" />
          )}
        </svg>
      </span>
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
