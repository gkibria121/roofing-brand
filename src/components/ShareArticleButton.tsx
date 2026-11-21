"use client";

import { useState } from "react";

export function ShareArticleButton({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared">("idle");

  async function handleShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        setStatus("shared");
        window.setTimeout(() => setStatus("idle"), 2500);
        return;
      } catch {
        // User canceled native share sheet or unsupported — fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch {
      // Fallback ignored if clipboard permissions are blocked
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-brand-900 shadow-2xs transition-colors hover:border-brand-700 hover:bg-brand-50"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 text-accent-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span>{status === "copied" ? "Link copied" : status === "shared" ? "Shared" : "Share guide"}</span>
      </button>
      <span role="status" className="sr-only">
        {status === "copied" ? "Article link copied to clipboard." : status === "shared" ? "Article shared." : ""}
      </span>
    </div>
  );
}
