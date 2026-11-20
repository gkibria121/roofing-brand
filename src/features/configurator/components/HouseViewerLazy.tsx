"use client";

import dynamic from "next/dynamic";

/** three.js is browser-only and large: load it on the client, after first paint. */
export const HouseViewerLazy = dynamic(() => import("./HouseViewer"), {
  ssr: false,
  loading: () => (
    <div
      className="grid aspect-[4/3] w-full place-items-center rounded-3xl border border-slate-200 bg-gradient-to-b from-[#8dbde8] via-[#cfe3f4] to-[#dce9f5] text-sm font-semibold text-brand-900/70"
      role="status"
    >
      Loading 3D preview…
    </div>
  ),
});
