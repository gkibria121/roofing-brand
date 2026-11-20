import type { PropertyAddress } from "../domain/schemas";

type Props = {
  address: PropertyAddress;
};

/**
 * Crisp, zero-latency architectural street map preview centered on the selected
 * property address. Uses real resolved street/neighborhood metadata and links
 * directly to Google Maps without requiring runtime map API keys.
 */
export function PropertyMapCard({ address }: Props) {
  const [st1, st2, st3, st4] = address.nearbyStreets;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.fullAddress)}`;
  const streetShort = address.street.replace(/^\d+\s+/, "");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#0f172a] shadow-sm">
      <svg
        viewBox="0 0 600 230"
        role="img"
        aria-label={`Neighborhood street map for ${address.fullAddress}`}
        className="block h-44 w-full object-cover sm:h-48"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="pinHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Dark crisp vector street map canvas matching reference */}
        <rect width="600" height="230" fill="#131926" />

        {/* Subtle city blocks & park patches */}
        <rect x="24" y="18" width="96" height="58" rx="6" fill="#1a2233" />
        <rect x="148" y="18" width="112" height="62" rx="6" fill="#1a2233" />
        <rect x="292" y="22" width="128" height="58" rx="6" fill="#1a2233" />
        <rect x="448" y="20" width="126" height="64" rx="6" fill="#1a2233" />
        <rect x="136" y="138" width="138" height="78" rx="10" fill="#162b26" />
        <rect x="302" y="114" width="122" height="92" rx="6" fill="#1a2233" />
        <rect x="454" y="118" width="120" height="86" rx="6" fill="#1a2233" />
        <rect x="20" y="108" width="94" height="98" rx="6" fill="#1a2233" />

        {/* Secondary neighborhood streets */}
        <g stroke="#263147" strokeWidth="6" fill="none" strokeLinecap="round">
          <path d="M 128 0 L 128 230" />
          <path d="M 278 0 L 278 230" />
          <path d="M 434 0 L 434 230" />
          <path d="M 0 184 L 600 184" />
          <path d="M 278 134 Q 345 128 434 152" />
          <path d="M 0 46 L 128 46" />
        </g>

        {/* Primary arterial roads */}
        <g stroke="#33425f" strokeWidth="10" fill="none" strokeLinecap="round">
          <path d="M 0 96 L 600 96" />
          <path d="M 380 0 Q 388 110 402 230" />
        </g>
        <g stroke="#46597c" strokeWidth="1.5" strokeDasharray="8 8" fill="none" opacity="0.55">
          <path d="M 0 96 L 600 96" />
        </g>

        {/* Road & neighborhood labels */}
        <g fill="#94a3b8" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="11" fontWeight="600">
          <text x="150" y="99" fill="#cbd5e1">{st1}</text>
          <text x="24" y="42">{st2}</text>
          <text x="456" y="46">{st4}</text>
          <text x="148" y="168" fill="#6ee7b7" fontSize="10.5">{address.city} Park</text>
          <text x="314" y="150" fill="#e2e8f0" fontSize="11.5">{streetShort}</text>
          <text x="390" y="54" transform="rotate(82 390 54)">{st3}</text>
        </g>

        {/* Centered location pin */}
        <circle cx="332" cy="108" r="34" fill="url(#pinHalo)" />
        <g transform="translate(332, 108)">
          <ellipse cx="0" cy="4" rx="10" ry="3.5" fill="#000" opacity="0.45" />
          <path
            d="M0 3 C-9 -8 -13 -15 -13 -22 A13 13 0 1 1 13 -22 C13 -15 9 -8 0 3 Z"
            fill="#38bdf8"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          <circle cx="0" cy="-22" r="4.8" fill="#ffffff" />
        </g>
      </svg>

      {/* Subtle top-left coordinate badge & bottom-right external Google Maps link */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-200 backdrop-blur">
        {address.lat.toFixed(4)}° N, {Math.abs(address.lng).toFixed(4)}° W
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg bg-slate-900/85 px-2.5 py-1 text-[11px] font-semibold text-slate-100 backdrop-blur transition-colors hover:bg-slate-900"
      >
        Open in Google Maps
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
