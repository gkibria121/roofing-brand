"use client";

import { useEffect, useId, useRef, useState } from "react";

type Suggestion = { label: string; source: "google" | "osm" | "local" };

type Props = {
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  onBlurValidate: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

export function AddressAutocomplete({
  value,
  onChange,
  hint,
  error,
  onBlurValidate,
  inputRef,
}: Props) {
  const uid = useId();
  const inputId = `${uid}-input`;
  const hintId = `${uid}-hint`;
  const errorId = `${uid}-error`;
  const listId = `${uid}-list`;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const lastSelectedRef = useRef<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 3 || value === lastSelectedRef.current) return;
    const ac = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/address-suggest?q=${encodeURIComponent(q)}`, { signal: ac.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        const next = data.suggestions ?? [];
        setSuggestions(next);
        setOpen(next.length > 0);
        setActiveIndex(-1);
      } catch {
        // Ignore aborts; user can always enter address manually.
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [value]);

  // Close suggestion popover on outside pointer interaction.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function selectSuggestion(label: string) {
    lastSelectedRef.current = label;
    onChange(label);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    setLoading(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex].label);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={inputId} className="block text-sm font-semibold text-slate-800">
        Property street address <span className="text-accent-700" aria-hidden="true">*</span>
      </label>

      {/* Hint placed above the input so autocomplete suggestions never cover it. */}
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-slate-600">
          {hint}
        </p>
      )}

      <div className="relative mt-2.5">
        <input
          ref={inputRef}
          id={inputId}
          name="address"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          autoComplete="street-address"
          enterKeyHint="next"
          required
          minLength={5}
          placeholder="e.g., 742 Evergreen Terrace, Springfield"
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            onChange(next);
            if (next.trim().length < 3) {
              setSuggestions([]);
              setOpen(false);
              setActiveIndex(-1);
              setLoading(false);
            }
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            // Defer slightly so clicking a suggestion still registers before validation.
            window.setTimeout(() => {
              if (!wrapRef.current?.contains(document.activeElement)) {
                setOpen(false);
                onBlurValidate();
              }
            }, 120);
          }}
          className="field-control block w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-brand-700"
        />
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" />
          <circle cx="12" cy="11" r="2.5" />
        </svg>
        {loading && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400" aria-hidden="true">
            Searching…
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Address suggestions"
          className="absolute z-30 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
        >
          {suggestions.map((item, idx) => {
            const active = idx === activeIndex;
            return (
              <li
                key={item.label}
                id={`${listId}-opt-${idx}`}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(item.label);
                }}
                onClick={() => selectSuggestion(item.label)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`flex cursor-pointer items-start gap-2.5 px-3.5 py-2.5 text-sm ${
                  active ? "bg-brand-50 text-brand-900" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <svg
                  className="mt-0.5 size-4 shrink-0 text-accent-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" />
                  <circle cx="12" cy="11" r="2.2" />
                </svg>
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p id={errorId} className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-700">
          <span role="img" aria-label="Error">⚠</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
