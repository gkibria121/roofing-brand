"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { QUICK_QUOTE_SERVICE_OPTIONS, QuoteRequestForm } from "@/features/configurator";

export interface OpenQuoteOptions {
  service?: string;
}

interface QuoteModalContextValue {
  openQuoteModal: (options?: OpenQuoteOptions) => void;
  closeQuoteModal: () => void;
}

const QuoteModalContext = createContext<QuoteModalContextValue | null>(null);

export function useQuoteModal(): QuoteModalContextValue | null {
  return useContext(QuoteModalContext);
}

let supportsDisplayTransition: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (
    typeof window === "undefined" ||
    !window.CSS?.supports?.("transition-behavior", "allow-discrete") ||
    !document.body
  ) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText = "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  const initialDisplay = getComputedStyle(probe).display;
  probe.style.display = "none";
  supportsDisplayTransition =
    initialDisplay === "block" && getComputedStyle(probe).display === "block";
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit(): boolean {
  return typeof window !== "undefined" && Boolean(window.CSS?.supports?.("overlay", "auto")) && canTransitionDisplay();
}

async function closeTopLayer(dialog: HTMLDialogElement): Promise<void> {
  if (!dialog.open) return;
  if (!supportsTopLayerExit()) {
    if (dialog.hasAttribute("data-closing")) return;
    dialog.setAttribute("data-closing", "");
    const animations = dialog.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }
    if (!dialog.hasAttribute("data-closing")) return;
    dialog.removeAttribute("data-closing");
  }
  if (dialog.open) dialog.close();
}

function isOutsideDialog(e: PointerEvent, dialog: HTMLDialogElement): boolean {
  const r = dialog.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
}

export function QuoteModalProvider({ children }: { children: ReactNode }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [sessionId, setSessionId] = useState(0);
  const [initialService, setInitialService] = useState("");

  const openQuoteModal = useCallback((options?: OpenQuoteOptions) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.removeAttribute("data-closing");
    // Flush synchronously so the freshly keyed form and its `autofocus` attribute
    // are in the DOM before native `showModal()` runs its initial-focus algorithm.
    flushSync(() => {
      setInitialService(options?.service ?? "");
      setSessionId((n) => n + 1);
    });
    if (!dialog.open) {
      dialog.showModal();
    }
  }, []);

  const closeQuoteModal = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    void closeTopLayer(dialog);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onCancel = (e: Event) => {
      e.preventDefault();
      void closeTopLayer(dialog);
    };

    const onClose = () => {
      dialog.returnValue = "";
      setInitialService("");
      setSessionId((n) => n + 1);
    };

    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onClose);

    // Fallback light-dismiss for browsers without native <dialog closedby="any">
    let removeOutsideFallback: (() => void) | undefined;
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = isOutsideDialog(e, dialog);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutsideDialog(e, dialog)) {
          void closeTopLayer(dialog);
        }
        pressedOutside = false;
      };
      dialog.addEventListener("pointerdown", onPointerDown);
      dialog.addEventListener("pointerup", onPointerUp);
      removeOutsideFallback = () => {
        dialog.removeEventListener("pointerdown", onPointerDown);
        dialog.removeEventListener("pointerup", onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onClose);
      removeOutsideFallback?.();
    };
  }, []);

  const value = useMemo(
    () => ({ openQuoteModal, closeQuoteModal }),
    [openQuoteModal, closeQuoteModal],
  );

  return (
    <QuoteModalContext.Provider value={value}>
      {children}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="quote-dialog"
        {...({ closedby: "any" } as Record<string, string>)}
      >
        <div className="p-5 sm:px-6 sm:py-5">
          <div className="mb-3 flex items-start justify-between gap-4 border-b border-slate-100 pb-2.5">
            <div>
              <h2 id={titleId} className="text-xl font-extrabold text-brand-900 sm:text-2xl">
                Get your free quote
              </h2>
              <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
                Tell us about your project and we’ll follow up within one business day.
              </p>
            </div>
            <button
              type="button"
              onClick={closeQuoteModal}
              aria-label="Close quote form"
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-brand-900"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <QuoteRequestForm
            key={sessionId}
            serviceOptions={QUICK_QUOTE_SERVICE_OPTIONS}
            defaultService={initialService}
            allowEmptyService
            autoFocusFirstField
            compact
            formAriaLabelledBy={titleId}
          />

          <p className="mt-2.5 border-t border-slate-100 pt-2.5 text-center text-xs text-slate-500">
            Want to preview materials on your home first?{" "}
            <Link
              href="/estimate"
              onClick={closeQuoteModal}
              className="font-bold text-accent-700 underline underline-offset-4 hover:text-accent-600"
            >
              Open 3D Estimator →
            </Link>
          </p>
        </div>
      </dialog>
    </QuoteModalContext.Provider>
  );
}
