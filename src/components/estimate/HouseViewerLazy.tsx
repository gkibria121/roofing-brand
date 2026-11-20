"use client";

import dynamic from "next/dynamic";

/** three.js is browser-only and large: load it on the client, after first paint. */
export const HouseViewerLazy = dynamic(() => import("./HouseViewer"), {
  ssr: false,
  loading: () => (
    <div
      className="grid aspect-[4/3] w-full place-items-center rounded-3xl border border-slate-200 bg-gradient-to-b from-sky-100 to-white text-sm font-semibold text-slate-500"
      role="status"
    >
      Loading 3D preview…
    </div>
  ),
});
